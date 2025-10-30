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
  DocumentSnapshot,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';

// Subscription manager to prevent memory leaks
class SubscriptionManager {
  private subscriptions: Map<string, Unsubscribe> = new Map();
  private subscriptionRefs: Map<string, number> = new Map();

  // Add subscription with reference counting
  add(key: string, unsubscribe: Unsubscribe): void {
    const currentRefs = this.subscriptionRefs.get(key) || 0;
    
    if (currentRefs === 0) {
      // First subscription for this key
      this.subscriptions.set(key, unsubscribe);
    }
    
    this.subscriptionRefs.set(key, currentRefs + 1);
  }

  // Remove subscription with reference counting
  remove(key: string): void {
    const currentRefs = this.subscriptionRefs.get(key) || 0;
    
    if (currentRefs > 1) {
      // Still other references, just decrement
      this.subscriptionRefs.set(key, currentRefs - 1);
    } else {
      // Last reference, actually unsubscribe
      const unsubscribe = this.subscriptions.get(key);
      if (unsubscribe) {
        unsubscribe();
        this.subscriptions.delete(key);
        this.subscriptionRefs.delete(key);
      }
    }
  }

  // Check if subscription exists
  has(key: string): boolean {
    return this.subscriptions.has(key);
  }

  // Cleanup all subscriptions
  cleanup(): void {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions.clear();
    this.subscriptionRefs.clear();
  }

  // Get active subscription count
  getActiveCount(): number {
    return this.subscriptions.size;
  }
}

// Single instance of subscription manager
const subscriptionManager = new SubscriptionManager();

// Request deduplication for real-time updates
class RequestDeduplicator {
  private pendingRequests: Map<string, Promise<any>> = new Map();

  async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    const existing = this.pendingRequests.get(key);
    if (existing) {
      return existing;
    }

    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }
}

const requestDeduplicator = new RequestDeduplicator();

export class RealtimeService {
  // OPTIMIZED: Subscribe to conversations with deduplication
  static subscribeToConversations(
    userId: string, 
    callback: (conversations: any[]) => void
  ): () => void {
    const subscriptionKey = `conversations_${userId}`;
    
    // Return existing subscription if already active
    if (subscriptionManager.has(subscriptionKey)) {
      console.log('Reusing existing conversation subscription');
      return () => subscriptionManager.remove(subscriptionKey);
    }
    
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId),
      orderBy('lastMessageTime', 'desc')
    );
    
    const unsubscribe = onSnapshot(
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
        // Auto-cleanup on error
        subscriptionManager.remove(subscriptionKey);
      }
    );
    
    subscriptionManager.add(subscriptionKey, unsubscribe);
    
    // Return cleanup function
    return () => subscriptionManager.remove(subscriptionKey);
  }
  
  // OPTIMIZED: Subscribe to messages with deduplication
  static subscribeToMessages(
    conversationId: string,
    callback: (messages: any[]) => void
  ): () => void {
    const subscriptionKey = `messages_${conversationId}`;
    
    if (subscriptionManager.has(subscriptionKey)) {
      console.log('Reusing existing messages subscription');
      return () => subscriptionManager.remove(subscriptionKey);
    }
    
    // Query from top-level messages collection
    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('createdAt', 'asc')
    );
    
    const unsubscribe = onSnapshot(
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
        subscriptionManager.remove(subscriptionKey);
      }
    );
    
    subscriptionManager.add(subscriptionKey, unsubscribe);
    return () => subscriptionManager.remove(subscriptionKey);
  }
  
  // OPTIMIZED: Subscribe to notifications with deduplication
  static subscribeToNotifications(
    userId: string,
    callback: (notifications: any[]) => void
  ): () => void {
    const subscriptionKey = `notifications_${userId}`;
    
    if (subscriptionManager.has(subscriptionKey)) {
      console.log('Reusing existing notifications subscription');
      return () => subscriptionManager.remove(subscriptionKey);
    }
    
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(
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
        subscriptionManager.remove(subscriptionKey);
      }
    );
    
    subscriptionManager.add(subscriptionKey, unsubscribe);
    return () => subscriptionManager.remove(subscriptionKey);
  }
  
  // OPTIMIZED: Subscribe to job with deduplication
  static subscribeToJob(
    jobId: string,
    callback: (job: any) => void
  ): () => void {
    const subscriptionKey = `job_${jobId}`;
    
    if (subscriptionManager.has(subscriptionKey)) {
      console.log('Reusing existing job subscription');
      return () => subscriptionManager.remove(subscriptionKey);
    }
    
    const unsubscribe = onSnapshot(
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
        subscriptionManager.remove(subscriptionKey);
      }
    );
    
    subscriptionManager.add(subscriptionKey, unsubscribe);
    return () => subscriptionManager.remove(subscriptionKey);
  }
  
  // OPTIMIZED: Batch mark messages as read
  static async markMessagesAsRead(conversationId: string, userId: string) {
    const requestKey = `mark_read_${conversationId}_${userId}`;
    
    return requestDeduplicator.deduplicate(requestKey, async () => {
      try {
        // Get unread messages
        const q = query(
          collection(db, 'messages'),
          where('conversationId', '==', conversationId),
          where('recipientId', '==', userId),
          where('status', '!=', 'read')
        );
        
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) return;
        
        // Batch update for efficiency
        const batch = writeBatch(db);
        const now = serverTimestamp();
        
        snapshot.docs.forEach(doc => {
          batch.update(doc.ref, {
            status: 'read',
            readAt: now
          });
        });
        
        // Update conversation unread count
        batch.update(doc(db, 'conversations', conversationId), {
          [`participantDetails.${userId}.unreadCount`]: 0
        });
        
        await batch.commit();
      } catch (error) {
        console.error('Error marking messages as read:', error);
        throw error;
      }
    });
  }
  
  // OPTIMIZED: Batch update presence
  static async updatePresence(userId: string, status: 'online' | 'away' | 'offline') {
    const requestKey = `presence_${userId}`;
    
    return requestDeduplicator.deduplicate(requestKey, async () => {
      try {
        await updateDoc(doc(db, 'users', userId), {
          presence: {
            status,
            lastSeen: serverTimestamp()
          },
          isOnline: status === 'online'
        });
      } catch (error) {
        console.error('Error updating presence:', error);
        throw error;
      }
    });
  }
  
  // OPTIMIZED: Subscribe to user presence with deduplication
  static subscribeToUserPresence(
    userId: string,
    callback: (presence: any) => void
  ): () => void {
    const subscriptionKey = `presence_${userId}`;
    
    if (subscriptionManager.has(subscriptionKey)) {
      console.log('Reusing existing presence subscription');
      return () => subscriptionManager.remove(subscriptionKey);
    }
    
    const unsubscribe = onSnapshot(
      doc(db, 'users', userId),
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          callback(data.presence || { status: 'offline' });
        }
      },
      (error) => {
        console.error('Error in presence subscription:', error);
        subscriptionManager.remove(subscriptionKey);
      }
    );
    
    subscriptionManager.add(subscriptionKey, unsubscribe);
    return () => subscriptionManager.remove(subscriptionKey);
  }
  
  // OPTIMIZED: Subscribe to multiple users' presence
  static subscribeToMultiplePresence(
    userIds: string[],
    callback: (presences: Map<string, any>) => void
  ): () => void {
    const subscriptionKey = `presence_multiple_${userIds.join('_')}`;
    
    if (subscriptionManager.has(subscriptionKey)) {
      return () => subscriptionManager.remove(subscriptionKey);
    }
    
    const presences = new Map<string, any>();
    const unsubscribes: Unsubscribe[] = [];
    
    userIds.forEach(userId => {
      const unsubscribe = onSnapshot(
        doc(db, 'users', userId),
        (snapshot: DocumentSnapshot<DocumentData>) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            presences.set(userId, data.presence || { status: 'offline' });
            callback(new Map(presences));
          }
        },
        (error) => {
          console.error(`Error in presence subscription for ${userId}:`, error);
        }
      );
      unsubscribes.push(unsubscribe);
    });
    
    // Combined unsubscribe
    const combinedUnsubscribe = () => {
      unsubscribes.forEach(unsub => unsub());
    };
    
    subscriptionManager.add(subscriptionKey, combinedUnsubscribe);
    return () => subscriptionManager.remove(subscriptionKey);
  }
  
  // Cleanup all subscriptions (call on logout)
  static cleanup(): void {
    console.log(`Cleaning up ${subscriptionManager.getActiveCount()} active subscriptions`);
    subscriptionManager.cleanup();
  }
  
  // Get subscription stats for debugging
  static getSubscriptionStats(): { activeCount: number } {
    return {
      activeCount: subscriptionManager.getActiveCount()
    };
  }
}

// Auto-cleanup on window unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    RealtimeService.cleanup();
  });
}