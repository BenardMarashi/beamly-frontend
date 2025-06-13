import { getToken, onMessage } from 'firebase/messaging';
import { getMessagingIfSupported } from './firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export class MessagingService {
  static async requestPermission(): Promise<boolean> {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }
  
  static async getFCMToken(): Promise<string | null> {
    try {
      const messaging = await getMessagingIfSupported();
      if (!messaging) {
        console.log('Messaging not supported');
        return null;
      }
      
      const permission = await this.requestPermission();
      if (!permission) {
        console.log('Notification permission denied');
        return null;
      }
      
      // You'll need to get this VAPID key from Firebase Console
      // Go to Project Settings > Cloud Messaging > Web Push certificates
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || 'YOUR_VAPID_KEY'
      });
      
      console.log('FCM Token:', token);
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }
  
  static async saveFCMToken(userId: string, token: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        [`fcmTokens.${token}`]: true,
        lastTokenUpdate: new Date()
      });
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  }
  
  static async removeFCMToken(userId: string, token: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        [`fcmTokens.${token}`]: false
      });
    } catch (error) {
      console.error('Error removing FCM token:', error);
    }
  }
  
  static async listenToMessages(): Promise<void> {
    const messaging = await getMessagingIfSupported();
    if (!messaging) return;
    
    onMessage(messaging, (payload) => {
      console.log('Message received:', payload);
      
      // Show notification using the browser's notification API
      if (Notification.permission === 'granted' && payload.notification) {
        const notificationOptions = {
          body: payload.notification.body,
          icon: '/icon-192x192.png',
          badge: '/icon-72x72.png',
          data: payload.data,
          tag: payload.messageId
        };
        
        new Notification(
          payload.notification.title || 'New Notification', 
          notificationOptions
        );
      }
      
      // You can also dispatch a custom event to update UI
      window.dispatchEvent(new CustomEvent('fcm-message', { detail: payload }));
    });
  }
  
  static async initializeMessaging(userId: string): Promise<void> {
    try {
      // Get and save FCM token
      const token = await this.getFCMToken();
      if (token && userId) {
        await this.saveFCMToken(userId, token);
      }
      
      // Start listening to messages
      await this.listenToMessages();
      
      console.log('Messaging initialized');
    } catch (error) {
      console.error('Error initializing messaging:', error);
    }
  }
}