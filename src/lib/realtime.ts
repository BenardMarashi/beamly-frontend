import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  Unsubscribe,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from './firebase';

export class RealtimeService {
  // Subscribe to user's conversations
  static subscribeToConversations(
    userId: string, 
    callback: (conversations: any[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId),
      orderBy('lastMessageTime', 'desc')
    );
    
    return onSnapshot(
      q, 
      (snapshot: QuerySnapshot<DocumentData>) => {
        const conversations = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(conversations);
      },
      (error) => {
        console.error('Error in conversations subscription:', error);
      }
    );
  }
  
  // Subscribe to messages in a conversation
  static subscribeToMessages(
    conversationId: string,
    callback: (messages: any[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    
    return onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const messages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(messages);
      },
      (error) => {
        console.error('Error in messages subscription:', error);
      }
    );
  }
  
  // Subscribe to notifications
  static subscribeToNotifications(
    userId: string,
    callback: (notifications: any[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const notifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(notifications);
      },
      (error) => {
        console.error('Error in notifications subscription:', error);
      }
    );
  }
  
  // Subscribe to job updates
  static subscribeToJob(
    jobId: string,
    callback: (job: any) => void
  ): Unsubscribe {
    return onSnapshot(
      doc(db, 'jobs', jobId),
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (snapshot.exists()) {
          callback({
            id: snapshot.id,
            ...snapshot.data()
          });
        }
      },
      (error) => {
        console.error('Error in job subscription:', error);
      }
    );
  }
  
  // Mark messages as read
  static async markMessagesAsRead(conversationId: string, userId: string) {
    try {
      await updateDoc(doc(db, 'conversations', conversationId), {
        [`unreadCount.${userId}`]: 0
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }
  
  // Update user presence
  static async updatePresence(userId: string, status: 'online' | 'away' | 'offline') {
    try {
      await updateDoc(doc(db, 'users', userId), {
        presence: {
          status,
          lastSeen: serverTimestamp()
        }
      });
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }
  
  // Subscribe to user presence
  static subscribeToUserPresence(
    userId: string,
    callback: (presence: any) => void
  ): Unsubscribe {
    return onSnapshot(
      doc(db, 'users', userId),
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          callback(data.presence || { status: 'offline' });
        }
      },
      (error) => {
        console.error('Error in presence subscription:', error);
      }
    );
  }
}