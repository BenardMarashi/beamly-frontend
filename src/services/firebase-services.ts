// src/services/firebase-services.ts

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  DocumentSnapshot,
  Timestamp,
  serverTimestamp,
  increment,
  onSnapshot,
  QueryConstraint,
  FieldValue,
  DocumentReference
} from 'firebase/firestore';

import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  StorageReference
} from 'firebase/storage';

// Import from the lib/firebase.ts file
import { db, storage } from '../lib/firebase';

// Type definitions
interface UserData {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  userType: 'freelancer' | 'client' | 'both';
  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
  lastActive?: Timestamp | FieldValue;
  completedProjects: number;
  completedJobs?: number;
  rating: number;
  reviewCount?: number;
  totalEarnings: number;
  totalSpent: number;
  isVerified: boolean;
  isBlocked: boolean;
  skills?: string[];
  hourlyRate?: number;
  location?: string;
  isAvailable?: boolean;
  bio?: string;
  notifications?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

interface JobData {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  skills: string[];
  budgetType: 'fixed' | 'hourly';
  budgetMin: number;
  budgetMax: number;
  experienceLevel: string;
  locationType: string;
  location?: string;
  duration?: string;
  projectSize?: string;
  clientId: string;
  clientName: string;
  clientPhotoURL: string;
  status: 'open' | 'in-progress' | 'completed' | 'cancelled';
  proposalCount: number;
  invitesSent: number;
  featured: boolean;
  urgent: boolean;
  verified: boolean;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
  hiredFreelancerId?: string;
  hiredAt?: Timestamp | FieldValue;
  completedAt?: Timestamp | FieldValue;
  viewCount?: number;
}

interface ProposalData {
  id: string;
  jobId: string;
  jobTitle: string;
  clientId: string;
  clientName: string;
  freelancerId: string;
  freelancerName: string;
  freelancerPhotoURL: string;
  freelancerRating?: number;
  freelancerCompletedJobs?: number;
  coverLetter: string;
  proposedRate: number;
  estimatedDuration: string;
  budgetType: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
  respondedAt?: Timestamp | FieldValue;
  attachments?: string[];
}

interface MessageData {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  text: string;
  attachments?: string[];
  status: 'sent' | 'delivered' | 'read';
  createdAt: Timestamp | FieldValue;
  readAt?: Timestamp | FieldValue;
}

interface ConversationData {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: Timestamp | FieldValue;
  lastMessageSenderId: string;
  unreadCount?: { [userId: string]: number };
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

interface ContractData {
  id: string;
  jobId: string;
  jobTitle: string;
  proposalId: string;
  clientId: string;
  clientName: string;
  freelancerId: string;
  freelancerName: string;
  rate: number;
  budgetType: 'fixed' | 'hourly';
  status: 'active' | 'completed' | 'cancelled' | 'disputed';
  totalPaid: number;
  totalDue: number;
  milestones?: MilestoneData[];
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

interface MilestoneData {
  id: string;
  title: string;
  description: string;
  amount: number;
  status: 'pending' | 'in-progress' | 'submitted' | 'approved' | 'paid';
  dueDate: Timestamp;
  submittedAt?: Timestamp;
  approvedAt?: Timestamp;
  paidAt?: Timestamp;
}

interface NotificationData {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  actionUrl?: string;
  actionData?: Record<string, any>;
  read: boolean;
  pushSent: boolean;
  createdAt: Timestamp | FieldValue;
  readAt?: Timestamp | FieldValue;
}

// Helper function to map document data
function mapDocumentData<T>(doc: DocumentSnapshot): T {
  return {
    id: doc.id,
    ...doc.data()
  } as T;
}

// User Services
export const UserService = {
  // Create user profile
  async createUserProfile(userId: string, userData: Partial<UserData>) {
    try {
      const userRef: DocumentReference = doc(db, 'users', userId);
      await setDoc(userRef, {
        ...userData,
        uid: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        completedProjects: 0,
        rating: 0,
        totalEarnings: 0,
        totalSpent: 0,
        isVerified: false,
        isBlocked: false
      });
      return { success: true };
    } catch (error) {
      console.error('Error creating user profile:', error);
      return { success: false, error };
    }
  },

  // Get user profile
  async getUserProfile(userId: string) {
    try {
      const userRef: DocumentReference = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return { success: true, data: mapDocumentData<UserData>(userSnap) };
      } else {
        return { success: false, error: 'User not found' };
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
      return { success: false, error };
    }
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: Partial<UserData>) {
    try {
      const userRef: DocumentReference = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating user profile:', error);
      return { success: false, error };
    }
  },

  // Search freelancers
  async searchFreelancers(searchParams: {
    skills?: string[];
    minRating?: number;
    maxHourlyRate?: number;
    location?: string;
    isAvailable?: boolean;
    lastDoc?: DocumentSnapshot;
    pageSize?: number;
  }) {
    try {
      const constraints: QueryConstraint[] = [
        where('userType', 'in', ['freelancer', 'both']),
        orderBy('rating', 'desc')
      ];

      if (searchParams.minRating) {
        constraints.push(where('rating', '>=', searchParams.minRating));
      }
      if (searchParams.maxHourlyRate) {
        constraints.push(where('hourlyRate', '<=', searchParams.maxHourlyRate));
      }
      if (searchParams.location) {
        constraints.push(where('location', '==', searchParams.location));
      }
      if (searchParams.isAvailable !== undefined) {
        constraints.push(where('isAvailable', '==', searchParams.isAvailable));
      }

      if (searchParams.lastDoc) {
        constraints.push(startAfter(searchParams.lastDoc));
      }

      constraints.push(limit(searchParams.pageSize || 20));

      const q = query(collection(db, 'users'), ...constraints);
      const querySnapshot = await getDocs(q);
      
      let freelancers = querySnapshot.docs.map(doc => mapDocumentData<UserData>(doc));
      
      // Filter by skills in memory (Firestore doesn't support array-contains-any with other queries)
      if (searchParams.skills && searchParams.skills.length > 0) {
        freelancers = freelancers.filter(f => 
          f.skills && searchParams.skills!.some(skill => f.skills!.includes(skill))
        );
      }
      
      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      
      return { 
        success: true, 
        freelancers, 
        lastDoc: lastVisible,
        hasMore: querySnapshot.docs.length === (searchParams.pageSize || 20)
      };
    } catch (error) {
      console.error('Error searching freelancers:', error);
      return { success: false, error, freelancers: [] };
    }
  }
};

// Job Services
export const JobService = {
  // Create job
  async createJob(jobData: Partial<JobData>) {
    try {
      const jobRef: DocumentReference = doc(collection(db, 'jobs'));
      await setDoc(jobRef, {
        ...jobData,
        id: jobRef.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'open',
        proposalCount: 0,
        invitesSent: 0,
        viewCount: 0,
        featured: false,
        urgent: false,
        verified: false
      });
      return { success: true, jobId: jobRef.id };
    } catch (error) {
      console.error('Error creating job:', error);
      return { success: false, error };
    }
  },

  // Get job details
  async getJob(jobId: string) {
    try {
      const jobRef: DocumentReference = doc(db, 'jobs', jobId);
      const jobSnap = await getDoc(jobRef);
      
      if (jobSnap.exists()) {
        // Increment view count
        await updateDoc(jobRef, {
          viewCount: increment(1)
        });
        
        return { success: true, data: mapDocumentData<JobData>(jobSnap) };
      } else {
        return { success: false, error: 'Job not found' };
      }
    } catch (error) {
      console.error('Error getting job:', error);
      return { success: false, error };
    }
  },

  // Update job
  async updateJob(jobId: string, updates: Partial<JobData>) {
    try {
      const jobRef: DocumentReference = doc(db, 'jobs', jobId);
      await updateDoc(jobRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating job:', error);
      return { success: false, error };
    }
  },

  // Delete job
  async deleteJob(jobId: string) {
    try {
      await deleteDoc(doc(db, 'jobs', jobId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting job:', error);
      return { success: false, error };
    }
  },

  // Search jobs
  async searchJobs(searchParams: {
    category?: string;
    skills?: string[];
    budgetMin?: number;
    budgetMax?: number;
    experienceLevel?: string;
    lastDoc?: DocumentSnapshot;
    pageSize?: number;
  }) {
    try {
      const constraints: QueryConstraint[] = [
        where('status', '==', 'open'),
        orderBy('createdAt', 'desc')
      ];

      if (searchParams.category) {
        constraints.push(where('category', '==', searchParams.category));
      }
      if (searchParams.experienceLevel) {
        constraints.push(where('experienceLevel', '==', searchParams.experienceLevel));
      }
      if (searchParams.budgetMin) {
        constraints.push(where('budgetMax', '>=', searchParams.budgetMin));
      }
      if (searchParams.budgetMax) {
        constraints.push(where('budgetMin', '<=', searchParams.budgetMax));
      }

      if (searchParams.lastDoc) {
        constraints.push(startAfter(searchParams.lastDoc));
      }

      constraints.push(limit(searchParams.pageSize || 20));

      const q = query(collection(db, 'jobs'), ...constraints);
      const querySnapshot = await getDocs(q);
      
      let jobs = querySnapshot.docs.map(doc => mapDocumentData<JobData>(doc));
      
      // Filter by skills in memory
      if (searchParams.skills && searchParams.skills.length > 0) {
        jobs = jobs.filter(j => 
          j.skills && searchParams.skills!.some(skill => j.skills.includes(skill))
        );
      }
      
      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      
      return { 
        success: true, 
        jobs, 
        lastDoc: lastVisible,
        hasMore: querySnapshot.docs.length === (searchParams.pageSize || 20)
      };
    } catch (error) {
      console.error('Error searching jobs:', error);
      return { success: false, error, jobs: [] };
    }
  },

  // Get user jobs
  async getUserJobs(userId: string, userType: 'client' | 'freelancer') {
    try {
      const field = userType === 'client' ? 'clientId' : 'hiredFreelancerId';
      const q = query(
        collection(db, 'jobs'),
        where(field, '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const querySnapshot = await getDocs(q);
      const jobs = querySnapshot.docs.map(doc => mapDocumentData<JobData>(doc));
      
      return { success: true, jobs };
    } catch (error) {
      console.error('Error getting user jobs:', error);
      return { success: false, error, jobs: [] };
    }
  }
};

// Proposal Services
export const ProposalService = {
  // Create proposal
  async createProposal(proposalData: Partial<ProposalData>) {
    try {
      const proposalRef: DocumentReference = doc(collection(db, 'proposals'));
      await setDoc(proposalRef, {
        ...proposalData,
        id: proposalRef.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'pending'
      });
      
      // Update job proposal count
      if (proposalData.jobId) {
        const jobRef = doc(db, 'jobs', proposalData.jobId);
        await updateDoc(jobRef, {
          proposalCount: increment(1)
        });
      }
      
      return { success: true, proposalId: proposalRef.id };
    } catch (error) {
      console.error('Error creating proposal:', error);
      return { success: false, error };
    }
  },

  // Update proposal
  async updateProposal(proposalId: string, updates: Partial<ProposalData>) {
    try {
      const proposalRef: DocumentReference = doc(db, 'proposals', proposalId);
      await updateDoc(proposalRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating proposal:', error);
      return { success: false, error };
    }
  },

  // Get proposal
  async getProposal(proposalId: string) {
    try {
      const proposalRef: DocumentReference = doc(db, 'proposals', proposalId);
      const proposalSnap = await getDoc(proposalRef);
      
      if (proposalSnap.exists()) {
        return { success: true, data: mapDocumentData<ProposalData>(proposalSnap) };
      } else {
        return { success: false, error: 'Proposal not found' };
      }
    } catch (error) {
      console.error('Error getting proposal:', error);
      return { success: false, error };
    }
  },

  // Get job proposals
  async getJobProposals(jobId: string) {
    try {
      const q = query(
        collection(db, 'proposals'),
        where('jobId', '==', jobId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const proposals = querySnapshot.docs.map(doc => mapDocumentData<ProposalData>(doc));
      
      return { success: true, proposals };
    } catch (error) {
      console.error('Error getting job proposals:', error);
      return { success: false, error, proposals: [] };
    }
  },

  // Get user proposals
  async getUserProposals(userId: string) {
    try {
      const q = query(
        collection(db, 'proposals'),
        where('freelancerId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const proposals = querySnapshot.docs.map(doc => mapDocumentData<ProposalData>(doc));
      
      return { success: true, proposals };
    } catch (error) {
      console.error('Error getting user proposals:', error);
      return { success: false, error, proposals: [] };
    }
  }
};

// Message Services
export const MessageService = {
  // Create conversation
  async createConversation(participants: string[], context?: any) {
    try {
      const conversationRef: DocumentReference = doc(collection(db, 'conversations'));
      await setDoc(conversationRef, {
        id: conversationRef.id,
        participants,
        context,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        unreadCount: participants.reduce((acc, userId) => ({ ...acc, [userId]: 0 }), {})
      });
      
      return { success: true, conversationId: conversationRef.id };
    } catch (error) {
      console.error('Error creating conversation:', error);
      return { success: false, error };
    }
  },

  // Send message
  async sendMessage(messageData: Partial<MessageData>) {
    try {
      const messageRef: DocumentReference = doc(collection(db, 'messages'));
      await setDoc(messageRef, {
        ...messageData,
        id: messageRef.id,
        createdAt: serverTimestamp(),
        status: 'sent'
      });
      
      // Update conversation
      if (messageData.conversationId) {
        const conversationRef = doc(db, 'conversations', messageData.conversationId);
        await updateDoc(conversationRef, {
          lastMessage: messageData.text,
          lastMessageTime: serverTimestamp(),
          lastMessageSenderId: messageData.senderId,
          updatedAt: serverTimestamp()
        });
      }
      
      return { success: true, messageId: messageRef.id };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error };
    }
  },

  // Get conversation messages
  async getConversationMessages(conversationId: string, lastDoc?: DocumentSnapshot) {
    try {
      const constraints: QueryConstraint[] = [
        where('conversationId', '==', conversationId),
        orderBy('createdAt', 'desc'),
        limit(50)
      ];
      
      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }
      
      const q = query(collection(db, 'messages'), ...constraints);
      const querySnapshot = await getDocs(q);
      const messages = querySnapshot.docs.map(doc => mapDocumentData<MessageData>(doc));
      
      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      
      return { 
        success: true, 
        messages: messages.reverse(), 
        lastDoc: lastVisible 
      };
    } catch (error) {
      console.error('Error getting messages:', error);
      return { success: false, error, messages: [] };
    }
  },

  // Get user conversations
  async getUserConversations(userId: string) {
    try {
      const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const conversations = querySnapshot.docs.map(doc => mapDocumentData<ConversationData>(doc));
      
      return { success: true, conversations };
    } catch (error) {
      console.error('Error getting conversations:', error);
      return { success: false, error, conversations: [] };
    }
  },

  // Mark messages as read
  async markMessagesAsRead(conversationId: string, userId: string) {
    try {
      const q = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId),
        where('recipientId', '==', userId),
        where('status', '!=', 'read')
      );
      
      const querySnapshot = await getDocs(q);
      const batch = querySnapshot.docs.map(doc => 
        updateDoc(doc.ref, {
          status: 'read',
          readAt: serverTimestamp()
        })
      );
      
      await Promise.all(batch);
      
      // Update conversation unread count
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        [`unreadCount.${userId}`]: 0
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return { success: false, error };
    }
  }
};

// Contract Services
export const ContractService = {
  // Create contract
  async createContract(contractData: Partial<ContractData>) {
    try {
      const contractRef: DocumentReference = doc(collection(db, 'contracts'));
      await setDoc(contractRef, {
        ...contractData,
        id: contractRef.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'active',
        totalPaid: 0,
        totalDue: contractData.rate || 0
      });
      
      return { success: true, contractId: contractRef.id };
    } catch (error) {
      console.error('Error creating contract:', error);
      return { success: false, error };
    }
  },

  // Update contract
  async updateContract(contractId: string, updates: Partial<ContractData>) {
    try {
      const contractRef: DocumentReference = doc(db, 'contracts', contractId);
      await updateDoc(contractRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating contract:', error);
      return { success: false, error };
    }
  },

  // Get contract
  async getContract(contractId: string) {
    try {
      const contractRef: DocumentReference = doc(db, 'contracts', contractId);
      const contractSnap = await getDoc(contractRef);
      
      if (contractSnap.exists()) {
        return { success: true, data: mapDocumentData<ContractData>(contractSnap) };
      } else {
        return { success: false, error: 'Contract not found' };
      }
    } catch (error) {
      console.error('Error getting contract:', error);
      return { success: false, error };
    }
  },

  // Get user contracts
  async getUserContracts(userId: string, userType: 'client' | 'freelancer') {
    try {
      const field = userType === 'client' ? 'clientId' : 'freelancerId';
      const q = query(
        collection(db, 'contracts'),
        where(field, '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const contracts = querySnapshot.docs.map(doc => mapDocumentData<ContractData>(doc));
      
      return { success: true, contracts };
    } catch (error) {
      console.error('Error getting user contracts:', error);
      return { success: false, error, contracts: [] };
    }
  }
};

// Notification Services
export const NotificationService = {
  // Create notification
  async createNotification(notificationData: Partial<NotificationData>) {
    try {
      const notificationRef: DocumentReference = doc(collection(db, 'notifications'));
      await setDoc(notificationRef, {
        ...notificationData,
        id: notificationRef.id,
        createdAt: serverTimestamp(),
        read: false,
        pushSent: false
      });
      
      return { success: true, notificationId: notificationRef.id };
    } catch (error) {
      console.error('Error creating notification:', error);
      return { success: false, error };
    }
  },

  // Get user notifications
  async getUserNotifications(userId: string, unreadOnly: boolean = false) {
    try {
      const constraints: QueryConstraint[] = [
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      ];
      
      if (unreadOnly) {
        constraints.push(where('read', '==', false));
      }
      
      const q = query(collection(db, 'notifications'), ...constraints);
      const querySnapshot = await getDocs(q);
      const notifications = querySnapshot.docs.map(doc => mapDocumentData<NotificationData>(doc));
      
      return { success: true, notifications };
    } catch (error) {
      console.error('Error getting notifications:', error);
      return { success: false, error, notifications: [] };
    }
  },

  // Mark notification as read
  async markNotificationAsRead(notificationId: string) {
    try {
      const notificationRef: DocumentReference = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        readAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error };
    }
  },

  // Subscribe to notifications
  subscribeToNotifications(userId: string, callback: (notifications: NotificationData[]) => void) {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => mapDocumentData<NotificationData>(doc));
      callback(notifications);
    });
  }
};

// Storage Services
export const StorageService = {
  // Upload file
  async uploadFile(file: File, path: string) {
    try {
      const storageRef: StorageReference = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return { success: true, downloadURL };
    } catch (error) {
      console.error('Error uploading file:', error);
      return { success: false, error };
    }
  },

  // Upload profile picture
  async uploadProfilePicture(userId: string, file: File) {
    const path = `users/${userId}/profile-picture/${Date.now()}_${file.name}`;
    return await StorageService.uploadFile(file, path);
  },

  // Upload attachment
  async uploadAttachment(userId: string, file: File, type: 'proposal' | 'message' | 'job') {
    const path = `users/${userId}/${type}-attachments/${Date.now()}_${file.name}`;
    return await StorageService.uploadFile(file, path);
  }
};

// Review Services
export const ReviewService = {
  // Get user reviews
  async getUserReviews(userId: string) {
    try {
      const q = query(
        collection(db, 'reviews'),
        where('revieweeId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const reviews = querySnapshot.docs.map(doc => doc.data());
      
      return { success: true, reviews };
    } catch (error) {
      console.error('Error getting user reviews:', error);
      return { success: false, error, reviews: [] };
    }
  }
};

// Analytics Services (for dashboard)
export const AnalyticsService = {
  // Get user analytics
  async getUserAnalytics(userId: string, userType: 'client' | 'freelancer') {
    try {
      if (userType === 'freelancer') {
        // Get freelancer stats
        const [contractsResult, proposalsResult] = await Promise.all([
          ContractService.getUserContracts(userId, 'freelancer'),
          ProposalService.getUserProposals(userId),
          // ReviewService.getUserReviews(userId) - Removed as result wasn't being used
        ]);
        
        const activeContracts = contractsResult.contracts?.filter(c => c.status === 'active').length || 0;
        const completedContracts = contractsResult.contracts?.filter(c => c.status === 'completed').length || 0;
        const totalEarnings = contractsResult.contracts?.reduce((sum, c) => sum + (c.totalPaid || 0), 0) || 0;
        const pendingProposals = proposalsResult.proposals?.filter(p => p.status === 'pending').length || 0;
        
        return {
          success: true,
          data: {
            activeContracts,
            completedContracts,
            totalEarnings,
            pendingProposals,
            totalProposals: proposalsResult.proposals?.length || 0,
            avgRating: 4.5 // Calculate from reviews - placeholder for now
          }
        };
      } else {
        // Get client stats
        const [jobsResult, contractsResult] = await Promise.all([
          JobService.getUserJobs(userId, 'client'),
          ContractService.getUserContracts(userId, 'client')
        ]);
        
        const activeJobs = jobsResult.jobs?.filter(j => j.status === 'open' || j.status === 'in-progress').length || 0;
        const completedJobs = jobsResult.jobs?.filter(j => j.status === 'completed').length || 0;
        const totalSpent = contractsResult.contracts?.reduce((sum, c) => sum + (c.totalPaid || 0), 0) || 0;
        
        return {
          success: true,
          data: {
            activeJobs,
            completedJobs,
            totalSpent,
            totalJobs: jobsResult.jobs?.length || 0
          }
        };
      }
    } catch (error) {
      console.error('Error getting user analytics:', error);
      return { success: false, error };
    }
  }
};