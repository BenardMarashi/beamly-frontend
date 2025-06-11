import { useEffect, useState } from 'react';
    import { useQuery } from 'react-query';
    import {
      collection,
      doc,
      getDoc,
      getDocs,
      query,
      where,
      orderBy,
      limit,
      onSnapshot,
      DocumentData,
      QueryConstraint
    } from 'firebase/firestore';
    import { db } from '../lib/firebase';
    import { useFirebase } from '../contexts/firebase-context';

    // User hook
    export const useUser = (uid?: string) => {
      const { user: currentUser } = useFirebase();
      const userId = uid || currentUser?.uid;
      
      return useQuery(
        ['user', userId],
        async () => {
          if (!userId) return null;
          
          const userDoc = await getDoc(doc(db, 'users', userId));
          return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;
        },
        {
          enabled: !!userId,
          staleTime: 5 * 60 * 1000 // 5 minutes
        }
      );
    };

    // Jobs hooks
    export const useJob = (jobId: string) => {
      return useQuery(
        ['job', jobId],
        async () => {
          if (!jobId) return null;
          
          const jobDoc = await getDoc(doc(db, 'jobs', jobId));
          return jobDoc.exists() ? { id: jobDoc.id, ...jobDoc.data() } : null;
        },
        {
          enabled: !!jobId
        }
      );
    };

    export const useJobsByFilter = (filters: {
      category?: string;
      status?: string;
      userId?: string;
      limit?: number;
    }) => {
      return useQuery(
        ['jobs', filters],
        async () => {
          const constraints: QueryConstraint[] = [];
          
          if (filters.category) {
            constraints.push(where('category', '==', filters.category));
          }
          
          if (filters.status) {
            constraints.push(where('status', '==', filters.status));
          }
          
          if (filters.userId) {
            constraints.push(where('userId', '==', filters.userId));
          }
          
          constraints.push(orderBy('createdAt', 'desc'));
          
          if (filters.limit) {
            constraints.push(limit(filters.limit));
          }
          
          const q = query(collection(db, 'jobs'), ...constraints);
          const querySnapshot = await getDocs(q);
          
          return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        }
      );
    };

    // Conversation hook
    export const useConversation = (conversationId: string) => {
      const [messages, setMessages] = useState<DocumentData[]>([]);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState<Error | null>(null);
      
      useEffect(() => {
        if (!conversationId) {
          setLoading(false);
          return () => {};
        }
        
        setLoading(true);
        
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));
        
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const messageData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setMessages(messageData);
            setLoading(false);
          },
          (err) => {
            console.error('Error in conversation snapshot:', err);
            setError(err);
            setLoading(false);
          }
        );
        
        return () => unsubscribe();
      }, [conversationId]);
      
      return { messages, loading, error };
    };

    // Notifications hook
    export const useNotifications = () => {
      const { user } = useFirebase();
      const [notifications, setNotifications] = useState<DocumentData[]>([]);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState<Error | null>(null);
      
      useEffect(() => {
        if (!user?.uid) {
          setLoading(false);
          return () => {};
        }
        
        setLoading(true);
        
        const notificationsRef = collection(db, 'users', user.uid, 'notifications');
        const q = query(notificationsRef, orderBy('timestamp', 'desc'));
        
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const notificationData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setNotifications(notificationData);
            setLoading(false);
          },
          (err) => {
            console.error('Error in notifications snapshot:', err);
            setError(err);
            setLoading(false);
          }
        );
        
        return () => unsubscribe();
      }, [user?.uid]);
      
      return { notifications, loading, error };
    };
