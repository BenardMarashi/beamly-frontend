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
  arrayUnion,
  arrayRemove,
  onSnapshot,
  QueryConstraint
} from 'firebase/firestore';

import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';

import { db, storage } from '../lib/firebase';

// User Services
export const UserService = {
  // Create user profile
  async createUserProfile(userId: string, userData: any) {
    try {
      const userRef = doc(db, 'users', userId);
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
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return { success: true, data: userSnap.data() };
      } else {
        return { success: false, error: 'User not found' };
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
      return { success: false, error };
    }
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: any) {
    try {
      const userRef = doc(db, 'users', userId);
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

  // Upload profile photo
  async uploadProfilePhoto(userId: string, file: File) {
    try {
      const storageRef = ref(storage, `users/${userId}/profile.jpg`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      await this.updateUserProfile(userId, { photoURL: downloadURL });
      
      return { success: true, url: downloadURL };
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      return { success: false, error };
    }
  }
};

// Job Services
export const JobService = {
  // Create job
  async createJob(jobData: any) {
    try {
      const jobsRef = collection(db, 'jobs');
      const newJobRef = doc(jobsRef);
      
      await setDoc(newJobRef, {
        ...jobData,
        id: newJobRef.id,
        status: 'open',
        proposalCount: 0,
        invitesSent: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return { success: true, jobId: newJobRef.id };
    } catch (error) {
      console.error('Error creating job:', error);
      return { success: false, error };
    }
  },

  // Get jobs with filters
  async getJobs(filters: {
    category?: string;
    subcategory?: string;
    budgetMin?: number;
    budgetMax?: number;
    skills?: string[];
    experienceLevel?: string;
    locationType?: string;
    lastDoc?: DocumentSnapshot;
    pageSize?: number;
  }) {
    try {
      const constraints: QueryConstraint[] = [
        where('status', '==', 'open'),
        orderBy('createdAt', 'desc')
      ];

      if (filters.category) {
        constraints.push(where('category', '==', filters.category));
      }
      if (filters.subcategory) {
        constraints.push(where('subcategory', '==', filters.subcategory));
      }
      if (filters.experienceLevel) {
        constraints.push(where('experienceLevel', '==', filters.experienceLevel));
      }
      if (filters.locationType) {
        constraints.push(where('locationType', '==', filters.locationType));
      }

      if (filters.lastDoc) {
        constraints.push(startAfter(filters.lastDoc));
      }

      constraints.push(limit(filters.pageSize || 20));

      const q = query(collection(db, 'jobs'), ...constraints);
      const querySnapshot = await getDocs(q);
      
      const jobs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      
      return { 
        success: true, 
        jobs, 
        lastDoc: lastVisible,
        hasMore: querySnapshot.docs.length === (filters.pageSize || 20)
      };
    } catch (error) {
      console.error('Error getting jobs:', error);
      return { success: false, error, jobs: [] };
    }
  },

  // Get single job
  async getJob(jobId: string) {
    try {
      const jobRef = doc(db, 'jobs', jobId);
      const jobSnap = await getDoc(jobRef);
      
      if (jobSnap.exists()) {
        return { success: true, job: { id: jobSnap.id, ...jobSnap.data() } };
      } else {
        return { success: false, error: 'Job not found' };
      }
    } catch (error) {
      console.error('Error getting job:', error);
      return { success: false, error };
    }
  },

  // Update job
  async updateJob(jobId: string, updates: any) {
    try {
      const jobRef = doc(db, 'jobs', jobId);
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

  // Save/unsave job
  async toggleSaveJob(userId: string, jobId: string, save: boolean) {
    try {
      const savedJobRef = doc(db, 'users', userId, 'savedJobs', jobId);
      
      if (save) {
        await setDoc(savedJobRef, {
          jobId,
          savedAt: serverTimestamp()
        });
      } else {
        await deleteDoc(savedJobRef);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error toggling save job:', error);
      return { success: false, error };
    }
  }
};

// Proposal Services
export const ProposalService = {
  // Submit proposal
  async submitProposal(proposalData: any) {
    try {
      const proposalsRef = collection(db, 'proposals');
      const newProposalRef = doc(proposalsRef);
      
      await setDoc(newProposalRef, {
        ...proposalData,
        id: newProposalRef.id,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Increment proposal count on job
      await JobService.updateJob(proposalData.jobId, {
        proposalCount: increment(1)
      });
      
      return { success: true, proposalId: newProposalRef.id };
    } catch (error) {
      console.error('Error submitting proposal:', error);
      return { success: false, error };
    }
  },

  // Get proposals for a job
  async getJobProposals(jobId: string) {
    try {
      const q = query(
        collection(db, 'proposals'),
        where('jobId', '==', jobId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const proposals = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return { success: true, proposals };
    } catch (error) {
      console.error('Error getting job proposals:', error);
      return { success: false, error, proposals: [] };
    }
  },

  // Get user's proposals
  async getUserProposals(userId: string) {
    try {
      const q = query(
        collection(db, 'proposals'),
        where('freelancerId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const proposals = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return { success: true, proposals };
    } catch (error) {
      console.error('Error getting user proposals:', error);
      return { success: false, error, proposals: [] };
    }
  },

  // Update proposal status
  async updateProposalStatus(proposalId: string, status: string) {
    try {
      const proposalRef = doc(db, 'proposals', proposalId);
      await updateDoc(proposalRef, {
        status,
        respondedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating proposal status:', error);
      return { success: false, error };
    }
  }
};

// Message Services
export const MessageService = {
  // Send message
  async sendMessage(messageData: any) {
    try {
      const messagesRef = collection(db, 'messages');
      const newMessageRef = doc(messagesRef);
      
      await setDoc(newMessageRef, {
        ...messageData,
        id: newMessageRef.id,
        status: 'sent',
        createdAt: serverTimestamp()
      });
      
      // Update conversation
      const conversationId = this.getConversationId(
        messageData.senderId,
        messageData.recipientId
      );
      
      await this.updateConversation(
        conversationId,
        messageData.text,
        messageData.senderId
      );
      
      return { success: true, messageId: newMessageRef.id };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error };
    }
  },

  // Get conversation messages
  getConversationMessages(conversationId: string, callback: (messages: any[]) => void) {
    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('createdAt', 'asc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(messages);
    });
  },

  // Get user conversations
  async getUserConversations(userId: string) {
    try {
      const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', userId),
        orderBy('lastMessageTime', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const conversations = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return { success: true, conversations };
    } catch (error) {
      console.error('Error getting user conversations:', error);
      return { success: false, error, conversations: [] };
    }
  },

  // Update conversation
  async updateConversation(conversationId: string, lastMessage: string, senderId: string) {
    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        lastMessage,
        lastMessageTime: serverTimestamp(),
        lastMessageSenderId: senderId,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating conversation:', error);
    }
  },

  // Get conversation ID (sorted user IDs)
  getConversationId(userId1: string, userId2: string) {
    return [userId1, userId2].sort().join('_');
  },

  // Mark messages as read
  async markMessagesAsRead(conversationId: string, userId: string) {
    try {
      const q = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId),
        where('senderId', '!=', userId),
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
      
      // Reset unread count in conversation
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
  async createContract(contractData: any) {
    try {
      const contractsRef = collection(db, 'contracts');
      const newContractRef = doc(contractsRef);
      
      await setDoc(newContractRef, {
        ...contractData,
        id: newContractRef.id,
        status: 'active',
        totalPaid: 0,
        totalDue: contractData.rate,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Update job status
      await JobService.updateJob(contractData.jobId, {
        status: 'in-progress',
        hiredFreelancerId: contractData.freelancerId,
        hiredAt: serverTimestamp()
      });
      
      // Update proposal status
      await ProposalService.updateProposalStatus(contractData.proposalId, 'accepted');
      
      return { success: true, contractId: newContractRef.id };
    } catch (error) {
      console.error('Error creating contract:', error);
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
      const contracts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return { success: true, contracts };
    } catch (error) {
      console.error('Error getting user contracts:', error);
      return { success: false, error, contracts: [] };
    }
  },

  // Update milestone
  async updateMilestone(contractId: string, milestoneId: string, updates: any) {
    try {
      const contractRef = doc(db, 'contracts', contractId);
      const contractSnap = await getDoc(contractRef);
      
      if (!contractSnap.exists()) {
        return { success: false, error: 'Contract not found' };
      }
      
      const contract = contractSnap.data();
      const milestones = contract.milestones || [];
      const milestoneIndex = milestones.findIndex((m: any) => m.id === milestoneId);
      
      if (milestoneIndex === -1) {
        return { success: false, error: 'Milestone not found' };
      }
      
      milestones[milestoneIndex] = {
        ...milestones[milestoneIndex],
        ...updates
      };
      
      await updateDoc(contractRef, {
        milestones,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating milestone:', error);
      return { success: false, error };
    }
  }
};

// Review Services
export const ReviewService = {
  // Submit review
  async submitReview(reviewData: any) {
    try {
      const reviewsRef = collection(db, 'reviews');
      const newReviewRef = doc(reviewsRef);
      
      await setDoc(newReviewRef, {
        ...reviewData,
        id: newReviewRef.id,
        createdAt: serverTimestamp()
      });
      
      // Update user ratings
      const isClientReview = reviewData.clientToFreelancer !== undefined;
      if (isClientReview) {
        await this.updateUserRating(
          reviewData.clientToFreelancer.revieweeId,
          reviewData.clientToFreelancer.rating
        );
      } else {
        await this.updateUserRating(
          reviewData.freelancerToClient.revieweeId,
          reviewData.freelancerToClient.rating
        );
      }
      
      return { success: true, reviewId: newReviewRef.id };
    } catch (error) {
      console.error('Error submitting review:', error);
      return { success: false, error };
    }
  },

  // Update user rating
  async updateUserRating(userId: string, newRating: number) {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) return;
      
      const userData = userSnap.data();
      const currentRating = userData.rating || 0;
      const reviewCount = userData.reviewCount || 0;
      
      // Calculate new average rating
      const totalRating = (currentRating * reviewCount) + newRating;
      const newAvgRating = totalRating / (reviewCount + 1);
      
      await updateDoc(userRef, {
        rating: newAvgRating,
        reviewCount: reviewCount + 1
      });
    } catch (error) {
      console.error('Error updating user rating:', error);
    }
  },

  // Get user reviews
  async getUserReviews(userId: string) {
    try {
      const q1 = query(
        collection(db, 'reviews'),
        where('clientToFreelancer.revieweeId', '==', userId)
      );
      
      const q2 = query(
        collection(db, 'reviews'),
        where('freelancerToClient.revieweeId', '==', userId)
      );
      
      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(q1),
        getDocs(q2)
      ]);
      
      const reviews = [
        ...snapshot1.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        ...snapshot2.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      ];
      
      return { success: true, reviews };
    } catch (error) {
      console.error('Error getting user reviews:', error);
      return { success: false, error, reviews: [] };
    }
  }
};

// Notification Services
export const NotificationService = {
  // Create notification
  async createNotification(notificationData: any) {
    try {
      const notificationsRef = collection(db, 'notifications');
      const newNotificationRef = doc(notificationsRef);
      
      await setDoc(newNotificationRef, {
        ...notificationData,
        id: newNotificationRef.id,
        read: false,
        pushSent: false,
        createdAt: serverTimestamp()
      });
      
      return { success: true, notificationId: newNotificationRef.id };
    } catch (error) {
      console.error('Error creating notification:', error);
      return { success: false, error };
    }
  },

  // Get user notifications
  async getUserNotifications(userId: string) {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const querySnapshot = await getDocs(q);
      const notifications = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return { success: true, notifications };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return { success: false, error, notifications: [] };
    }
  },

  // Mark notification as read
  async markAsRead(notificationId: string) {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
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
  subscribeToNotifications(userId: string, callback: (notifications: any[]) => void) {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(notifications);
    });
  }
};

// Search Services
export const SearchService = {
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
      
      let freelancers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter by skills in memory (Firestore doesn't support array-contains-any with other queries)
      if (searchParams.skills && searchParams.skills.length > 0) {
        freelancers = freelancers.filter(f => 
          f.skills && searchParams.skills!.some(skill => f.skills.includes(skill))
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

// Analytics Services (for dashboard)
export const AnalyticsService = {
  // Get user analytics
  async getUserAnalytics(userId: string, userType: 'client' | 'freelancer') {
    try {
      if (userType === 'freelancer') {
        // Get freelancer stats
        const [contractsResult, proposalsResult, reviewsResult] = await Promise.all([
          ContractService.getUserContracts(userId, 'freelancer'),
          ProposalService.getUserProposals(userId),
          ReviewService.getUserReviews(userId)
        ]);
        
        const activeContracts = contractsResult.contracts?.filter(c => c.status === 'active').length || 0;
        const completedContracts = contractsResult.contracts?.filter(c => c.status === 'completed').length || 0;
        const totalEarnings = contractsResult.contracts?.reduce((sum, c) => sum + (c.totalPaid || 0), 0) || 0;
        const pendingProposals = proposalsResult.proposals?.filter(p => p.status === 'pending').length || 0;
        
        return {
          success: true,
          analytics: {
            activeContracts,
            completedContracts,
            totalEarnings,
            pendingProposals,
            totalReviews: reviewsResult.reviews?.length || 0
          }
        };
      } else {
        // Get client stats
        const [jobsQuery, contractsResult] = await Promise.all([
          getDocs(query(collection(db, 'jobs'), where('clientId', '==', userId))),
          ContractService.getUserContracts(userId, 'client')
        ]);
        
        const activeJobs = jobsQuery.docs.filter(doc => doc.data().status === 'open').length;
        const completedJobs = jobsQuery.docs.filter(doc => doc.data().status === 'completed').length;
        const totalSpent = contractsResult.contracts?.reduce((sum, c) => sum + (c.totalPaid || 0), 0) || 0;
        
        return {
          success: true,
          analytics: {
            activeJobs,
            completedJobs,
            totalSpent,
            totalJobsPosted: jobsQuery.size
          }
        };
      }
    } catch (error) {
      console.error('Error getting user analytics:', error);
      return { success: false, error };
    }
  }
};

// Export all services
export {
  UserService,
  JobService,
  ProposalService,
  MessageService,
  ContractService,
  ReviewService,
  NotificationService,
  SearchService,
  AnalyticsService
};