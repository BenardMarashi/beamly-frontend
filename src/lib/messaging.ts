import { getToken } from 'firebase/messaging';
    import { getMessagingIfSupported } from './firebase';

    export const getFCMToken = async () => {
      try {
        const messaging = await getMessagingIfSupported();
        
        if (!messaging) {
          console.log('Firebase Cloud Messaging is not supported in this browser');
          return null;
        }
        
        // Request permission
        const permission = await Notification.requestPermission();
        
        if (permission !== 'granted') {
          console.log('Notification permission not granted');
          return null;
        }
        
        // Get token
        const token = await getToken(messaging, {
          vapidKey: 'YOUR_VAPID_KEY' // Replace with your VAPID key
        });
        
        return token;
      } catch (error) {
        console.error('Error getting FCM token:', error);
        return null;
      }
    };
