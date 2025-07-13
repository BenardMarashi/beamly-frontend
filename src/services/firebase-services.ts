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
  isVerified: boolean;
  isBlocked: boolean;
  skills?: string[];
  hourlyRate?: number;
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



interface NotificationData {
  id: string;
  userId: string;
  title: string;
  body: string;
  message?: string;
  type: string;
  actionUrl?: string;
  actionData?: Record<string, any>;
  relatedId?: string;
  read?: boolean;
  isRead?: boolean;
  pushSent?: boolean;
  createdAt: Timestamp | FieldValue;
  readAt?: Timestamp | FieldValue;
}

interface ProjectData {
  id: string;
  freelancerId: string;
  freelancerName: string;
  freelancerPhotoURL?: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  images: string[];
  thumbnailUrl?: string;
  liveUrl?: string;
  githubUrl?: string;
  viewCount: number;
  likeCount: number;
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
  completedAt?: Timestamp | FieldValue;
}

interface VerificationData {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  documentType: 'passport' | 'driver_license' | 'national_id';
  documentUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Timestamp | FieldValue;
  rejectionReason?: string;
  submittedAt: Timestamp | FieldValue;
  expiresAt?: Timestamp | FieldValue;
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
      
      // TODO: Create notification for job poster
      // Temporarily disabled to fix build issues
      /*
      if (proposalData.clientId && proposalData.freelancerName && proposalData.jobTitle) {
        try {
          await NotificationService.createNotification({
            userId: proposalData.clientId,
            type: 'new_proposal',
            title: 'New Proposal Received',
            message: `${proposalData.freelancerName} submitted a proposal for "${proposalData.jobTitle}"`,
            actionUrl: `/proposals?jobId=${proposalData.jobId}`,
            relatedId: proposalRef.id,
            isRead: false
          });
        } catch (notificationError) {
          console.warn('Failed to create notification:', notificationError);
        }
      }
      */
      
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
        const proposalsResult = await ProposalService.getUserProposals(userId);
        
        const pendingProposals = proposalsResult.proposals?.filter(p => p.status === 'pending').length || 0;
        
        return {
          success: true,
          data: {
            totalProjects: 0, // TODO: Fetch from projects collection
            pendingProposals,
            totalProposals: proposalsResult.proposals?.length || 0,
            avgRating: 4.5 // Calculate from reviews - placeholder for now
          }
        };
      } else {
        // Get client stats
        const jobsResult = await JobService.getUserJobs(userId, 'client');
        
        const activeJobs = jobsResult.jobs?.filter(j => j.status === 'open' || j.status === 'in-progress').length || 0;
        const completedJobs = jobsResult.jobs?.filter(j => j.status === 'completed').length || 0;
        
        return {
          success: true,
          data: {
            activeJobs,
            completedJobs,
            totalJobs: jobsResult.jobs?.length || 0
          }
        };
      }
    } catch (error) {
      console.error('Error getting user analytics:', error);
      return { success: false, error };
    }
  },

  // Project Services
  async createProject(projectData: Partial<ProjectData>) {
    try {
      const projectRef = doc(collection(db, 'projects'));
      const project = {
        id: projectRef.id,
        ...projectData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        viewCount: 0,
        likeCount: 0,
        isPublished: true,
        isFeatured: false
      };

      await setDoc(projectRef, project);
      return { success: true, project };
    } catch (error) {
      console.error('Error creating project:', error);
      return { success: false, error };
    }
  },

  async getFreelancerProjects(freelancerId: string) {
    try {
      const q = query(
        collection(db, 'projects'),
        where('freelancerId', '==', freelancerId),
        where('isPublished', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const projects = querySnapshot.docs.map(doc => mapDocumentData<ProjectData>(doc));
      
      return { success: true, projects };
    } catch (error) {
      console.error('Error getting freelancer projects:', error);
      return { success: false, error, projects: [] };
    }
  },

  async getProject(projectId: string) {
    try {
      const projectDoc = await getDoc(doc(db, 'projects', projectId));
      if (!projectDoc.exists()) {
        return { success: false, error: 'Project not found' };
      }
      
      const project = mapDocumentData<ProjectData>(projectDoc);
      return { success: true, project };
    } catch (error) {
      console.error('Error getting project:', error);
      return { success: false, error };
    }
  },

  async updateProject(projectId: string, updates: Partial<ProjectData>) {
    try {
      await updateDoc(doc(db, 'projects', projectId), {
        ...updates,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating project:', error);
      return { success: false, error };
    }
  },

  async deleteProject(projectId: string) {
    try {
      await deleteDoc(doc(db, 'projects', projectId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting project:', error);
      return { success: false, error };
    }
  }
};

// Export verification functions - use the actual implementations from UserService
export const VerificationService = {
  async submitVerification(verificationData: Partial<VerificationData>) {
    try {
      const verificationRef = doc(collection(db, 'verifications'));
      const verification = {
        id: verificationRef.id,
        ...verificationData,
        status: 'pending' as const,
        submittedAt: serverTimestamp()
      };

      await setDoc(verificationRef, verification);
      return { success: true, verification };
    } catch (error) {
      console.error('Error submitting verification:', error);
      return { success: false, error };
    }
  },
  
  async getUserVerification(userId: string) {
    try {
      const q = query(
        collection(db, 'verifications'),
        where('userId', '==', userId),
        orderBy('submittedAt', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return { success: true, verification: null };
      }
      
      const verification = mapDocumentData<VerificationData>(querySnapshot.docs[0]);
      return { success: true, verification };
    } catch (error) {
      console.error('Error getting user verification:', error);
      return { success: false, error };
    }
  },
  
  async updateVerificationStatus(verificationId: string, status: 'approved' | 'rejected', adminNotes?: string) {
    try {
      const verificationRef = doc(db, 'verifications', verificationId);
      await updateDoc(verificationRef, {
        status,
        adminNotes,
        reviewedAt: serverTimestamp()
      });
      
      // Update user's verified status if approved
      if (status === 'approved') {
        const verificationDoc = await getDoc(verificationRef);
        if (verificationDoc.exists()) {
          const verification = verificationDoc.data();
          await updateDoc(doc(db, 'users', verification.userId), {
            isVerified: true
          });
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error updating verification status:', error);
      return { success: false, error };
    }
  }
};