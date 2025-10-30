import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  serverTimestamp, 
  DocumentReference, 
  DocumentSnapshot, 
  QueryConstraint, 
  Timestamp, 
  FieldValue,
  writeBatch,
  increment,
  onSnapshot,
  addDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject, StorageReference } from 'firebase/storage';
import { auth, db, storage } from '../lib/firebase';
import { StripeService } from './stripe-service';

// Type definitions
interface UserData {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  location?: string;
  skills?: string[];
  hourlyRate?: number;
  userType: 'client' | 'freelancer' | 'both';
  rating?: number;
  reviewCount?: number;
  completedProjects?: number;
  isAvailable?: boolean;
  isVerified?: boolean;
  isOnline?: boolean;
  profileCompleted?: boolean;
  savedProfiles?: string[];
  notifications?: boolean;
  language?: string;
  currency?: string;
  timezone?: string;
  experience?: string;
  portfolio?: string[];
  certifications?: string[];
  isPro: false, // ADD THIS LINE
  subscriptionPlan: null, // ADD THIS LINE
  education?: string;
  languages?: string[];
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
  lastActive?: Timestamp | FieldValue;
  verificationStatus?: string;
  subscriptionStatus?: string;
  subscriptionTier?: string;
}

interface JobData {
  id: string;
  clientId: string;
  clientName: string;
  clientPhotoURL?: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  budgetType: 'fixed' | 'hourly';
  budgetMin: number;
  budgetMax: number;
  duration: string;
  experienceLevel: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  visibility?: 'public' | 'private' | 'invite_only';
  proposalCount: number;
  invitesSent: number;
  viewCount: number;
  attachments?: string[];
  featured: boolean;
  urgent: boolean;
  verified: boolean;
  location?: string;
  timezone?: string;
  startDate?: Timestamp | FieldValue;
  deadline?: Timestamp | FieldValue;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
  completedAt?: Timestamp | FieldValue;
  awardedTo?: string;
  awardedAt?: Timestamp | FieldValue;
}

interface ProposalData {
  id: string;
  jobId: string;
  jobTitle: string;
  clientId: string;
  freelancerId: string;
  freelancerName: string;
  freelancerPhotoURL?: string;
  freelancerRating?: number;
  coverLetter: string;
  proposedRate: number;
  estimatedDuration: string;
  budgetType: string;
  milestones?: MilestoneData[];
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
  respondedAt?: Timestamp | FieldValue;
  attachments?: string[];
  portfolio?: string[];
  availability?: string;
  questions?: string[];
}

interface MilestoneData {
  id: string;
  title: string;
  description: string;
  amount: number;
  duration: string;
  status: 'pending' | 'in_progress' | 'completed' | 'approved';
}

interface MessageData {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderPhotoURL?: string;
  recipientId: string;
  text: string;
  attachments?: string[];
  type?: 'text' | 'image' | 'file' | 'system';
  status: 'sent' | 'delivered' | 'read';
  editedAt?: Timestamp | FieldValue;
  deletedAt?: Timestamp | FieldValue;
  createdAt: Timestamp | FieldValue;
  readAt?: Timestamp | FieldValue;
}

interface ConversationData {
  id: string;
  participants: string[];
  participantDetails?: {
    [userId: string]: {
      unreadCount: number;
      lastReadAt?: Timestamp | FieldValue;
      isTyping?: boolean;
      isMuted?: boolean;
      displayName?: string;
      photoURL?: string;
      userType?: string;
    };
  };
  lastMessage: string;
  lastMessageTime: Timestamp | FieldValue;
  lastMessageSenderId: string;
  context?: {
    type?: string;
    relatedId?: string;
    metadata?: any;
  };
  isGroup?: boolean;
  groupName?: string;
  groupPhotoURL?: string;
  createdBy?: string;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

interface NotificationData {
  id: string;
  userId: string;
  title: string;
  body: string;
  message?: string;
  type: 'message' | 'job' | 'proposal' | 'payment' | 'review' | 'system';
  priority?: 'low' | 'medium' | 'high';
  actionUrl?: string;
  actionData?: Record<string, any>;
  relatedId?: string;
  senderId?: string;
  senderName?: string;
  senderPhotoURL?: string;
  read?: boolean;
  isRead?: boolean;
  pushSent?: boolean;
  emailSent?: boolean;
  createdAt: Timestamp | FieldValue;
  readAt?: Timestamp | FieldValue;
  expiresAt?: Timestamp | FieldValue;
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
  videoUrl?: string;
  liveUrl?: string;
  githubUrl?: string;
  demoUrl?: string;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  savedBy?: string[];
  tags?: string[];
  client?: string;
  duration?: string;
  teamSize?: number;
  role?: string;
  technologies?: string[];
  challenges?: string;
  solution?: string;
  impact?: string;
  testimonial?: string;
  isPublished: boolean;
  isFeatured: boolean;
  isArchived?: boolean;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
  completedAt?: Timestamp | FieldValue;
}

interface VerificationData {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  documentType: 'passport' | 'driver_license' | 'national_id' | 'other';
  documentNumber?: string;
  documentUrl: string;
  selfieUrl?: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  verificationLevel?: 'basic' | 'standard' | 'premium';
  reviewedBy?: string;
  reviewedAt?: Timestamp | FieldValue;
  rejectionReason?: string;
  notes?: string;
  submittedAt: Timestamp | FieldValue;
  expiresAt?: Timestamp | FieldValue;
  metadata?: Record<string, any>;
}

interface ReviewData {
  id: string;
  jobId: string;
  jobTitle: string;
  reviewerId: string;
  reviewerName: string;
  reviewerPhotoURL?: string;
  reviewerType: 'client' | 'freelancer';
  revieweeId: string;
  revieweeName: string;
  revieweePhotoURL?: string;
  rating: number;
  comment: string;
  skills?: string[];
  communication?: number;
  quality?: number;
  timeliness?: number;
  professionalism?: number;
  wouldRecommend?: boolean;
  isPublic?: boolean;
  response?: string;
  responseAt?: Timestamp | FieldValue;
  createdAt: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
}

interface ContractData {
  id: string;
  jobId: string;
  jobTitle: string;
  clientId: string;
  clientName: string;
  freelancerId: string;
  freelancerName: string;
  proposalId?: string;
  terms: string;
  amount: number;
  paymentSchedule: 'hourly' | 'fixed' | 'milestone';
  milestones?: MilestoneData[];
  startDate: Timestamp | FieldValue;
  endDate?: Timestamp | FieldValue;
  status: 'draft' | 'pending' | 'active' | 'completed' | 'terminated' | 'disputed';
  hoursWorked?: number;
  totalPaid?: number;
  escrowAmount?: number;
  attachments?: string[];
  signatures?: {
    client?: { signedAt: Timestamp | FieldValue; ip: string; };
    freelancer?: { signedAt: Timestamp | FieldValue; ip: string; };
  };
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
  completedAt?: Timestamp | FieldValue;
}

interface PaymentData {
  id: string;
  contractId?: string;
  jobId?: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  amount: number;
  currency: string;
  type: 'payment' | 'refund' | 'tip' | 'subscription';
  method: 'stripe' | 'paypal' | 'bank_transfer' | 'crypto';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  description?: string;
  invoice?: string;
  metadata?: Record<string, any>;
  fees?: number;
  netAmount?: number;
  createdAt: Timestamp | FieldValue;
  processedAt?: Timestamp | FieldValue;
  failedAt?: Timestamp | FieldValue;
  failureReason?: string;
}

interface AnalyticsData {
  userId: string;
  period: 'day' | 'week' | 'month' | 'year' | 'all';
  metrics: {
    profileViews?: number;
    proposalsSent?: number;
    proposalsAccepted?: number;
    jobsPosted?: number;
    jobsCompleted?: number;
    totalEarnings?: number;
    totalSpent?: number;
    avgResponseTime?: number;
    completionRate?: number;
    satisfactionRate?: number;
    activeProjects?: number;
    newClients?: number;
    repeatClients?: number;
  };
  chartData?: any[];
  topSkills?: { skill: string; count: number; }[];
  topCategories?: { category: string; count: number; }[];
  createdAt: Timestamp | FieldValue;
}

// Helper function to map document data
const mapDocumentData = <T>(doc: DocumentSnapshot): T => {
  return {
    id: doc.id,
    ...doc.data()
  } as T;
};

// User Services
export const UserService = {
  // Create user profile
  async createUserProfile(userId: string, userData: Partial<UserData>) {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        ...userData,
        id: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        profileCompleted: false,
        rating: 0,
        reviewCount: 0,
        completedProjects: 0,
        isAvailable: true,
        isVerified: false,
        isOnline: true,
        notifications: true
      });
      return { success: true };
    } catch (error) {
      console.error('Error creating user profile:', error);
      return { success: false, error };
    }
  },

  // Get user by ID
  async getUser(userId: string) {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return { success: true, data: mapDocumentData<UserData>(userSnap) };
      }
      
      return { success: false, error: 'User not found' };
    } catch (error) {
      console.error('Error getting user:', error);
      return { success: false, error };
    }
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: Partial<UserData>) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp(),
        lastActive: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating user profile:', error);
      return { success: false, error };
    }
  },

  // Complete user profile
  async completeUserProfile(userId: string, profileData: Partial<UserData>) {
    try {
      const updates = {
        ...profileData,
        profileCompleted: true,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(doc(db, 'users', userId), updates);
      return { success: true };
    } catch (error) {
      console.error('Error completing profile:', error);
      return { success: false, error };
    }
  },

  // Update user online status
  async updateOnlineStatus(userId: string, isOnline: boolean) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isOnline,
        lastActive: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating online status:', error);
      return { success: false, error };
    }
  },

  // Search freelancers
  async searchFreelancers(searchParams: {
    skills?: string[];
    minRating?: number;
    maxHourlyRate?: number;
    isAvailable?: boolean;
    category?: string;
    location?: string;
    experience?: string;
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
      
      // Filter by skills in memory
      if (searchParams.skills && searchParams.skills.length > 0) {
        freelancers = freelancers.filter(f => 
          f.skills && searchParams.skills!.some(skill => f.skills!.includes(skill))
        );
      }
      
      // Filter by location if provided
      if (searchParams.location) {
        freelancers = freelancers.filter(f => 
          f.location?.toLowerCase().includes(searchParams.location!.toLowerCase())
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
  },

  // Save/unsave profile
  async toggleSavedProfile(userId: string, profileId: string) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return { success: false, error: 'User not found' };
      }
      
      const savedProfiles = userDoc.data().savedProfiles || [];
      const index = savedProfiles.indexOf(profileId);
      
      if (index > -1) {
        savedProfiles.splice(index, 1);
      } else {
        savedProfiles.push(profileId);
      }
      
      await updateDoc(userRef, { savedProfiles });
      
      return { success: true, isSaved: index === -1 };
    } catch (error) {
      console.error('Error toggling saved profile:', error);
      return { success: false, error };
    }
  }
};

// Job Services
export const JobService = {
  // Create job
  async createJob(jobData: Partial<JobData>) {
    try {
      const jobRef = doc(collection(db, 'jobs'));
      await setDoc(jobRef, {
        ...jobData,
        id: jobRef.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'open',
        visibility: jobData.visibility || 'public',
        proposalCount: 0,
        invitesSent: 0,
        viewCount: 0,
        featured: false,
        urgent: false,
        verified: false
      });
      
      // Create notification for matching freelancers
      // This could be handled by a Cloud Function in production
      
      return { success: true, jobId: jobRef.id };
    } catch (error) {
      console.error('Error creating job:', error);
      return { success: false, error };
    }
  },

  // Update job
  async updateJob(jobId: string, updates: Partial<JobData>) {
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

  // Get job details
  async getJob(jobId: string) {
    try {
      const jobRef = doc(db, 'jobs', jobId);
      const jobSnap = await getDoc(jobRef);
      
      if (jobSnap.exists()) {
        // Increment view count
        await updateDoc(jobRef, {
          viewCount: increment(1)
        });
        
        return { success: true, job: mapDocumentData<JobData>(jobSnap) };
      }
      
      return { success: false, error: 'Job not found' };
    } catch (error) {
      console.error('Error getting job:', error);
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
      const field = userType === 'client' ? 'clientId' : 'freelancerId';
      const q = query(
        collection(db, 'jobs'),
        where(field, '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const jobs = querySnapshot.docs.map(doc => mapDocumentData<JobData>(doc));
      
      return { success: true, jobs };
    } catch (error) {
      console.error('Error getting user jobs:', error);
      return { success: false, error, jobs: [] };
    }
  },

  // Get featured jobs
  async getFeaturedJobs() {
    try {
      const q = query(
        collection(db, 'jobs'),
        where('featured', '==', true),
        where('status', '==', 'open'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      
      const querySnapshot = await getDocs(q);
      const jobs = querySnapshot.docs.map(doc => mapDocumentData<JobData>(doc));
      
      return { success: true, jobs };
    } catch (error) {
      console.error('Error getting featured jobs:', error);
      return { success: false, error, jobs: [] };
    }
  },

  // Award job to freelancer
  async awardJob(jobId: string, freelancerId: string, proposalId: string) {
    try {
      const batch = writeBatch(db);
      
      // Update job
      batch.update(doc(db, 'jobs', jobId), {
        status: 'in_progress',
        awardedTo: freelancerId,
        awardedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Update proposal
      batch.update(doc(db, 'proposals', proposalId), {
        status: 'accepted',
        respondedAt: serverTimestamp()
      });
      
      // Update other proposals
      const otherProposalsQuery = query(
        collection(db, 'proposals'),
        where('jobId', '==', jobId),
        where('id', '!=', proposalId)
      );
      
      const otherProposals = await getDocs(otherProposalsQuery);
      otherProposals.forEach(doc => {
        batch.update(doc.ref, {
          status: 'rejected',
          respondedAt: serverTimestamp()
        });
      });
      
      await batch.commit();
      
      return { success: true };
    } catch (error) {
      console.error('Error awarding job:', error);
      return { success: false, error };
    }
  }
};

// In firebase-services.ts, update the ProposalService.createProposal method:

export const ProposalService = {
  // Create proposal
  async createProposal(proposalData: Partial<ProposalData>) {
    try {
      // Validate required fields
      if (!proposalData.freelancerId || !proposalData.clientId || !proposalData.jobId) {
        console.error('Missing required fields:', {
          freelancerId: proposalData.freelancerId,
          clientId: proposalData.clientId,
          jobId: proposalData.jobId
        });
        // Return error object instead of throwing
        return { 
          success: false, 
          error: 'Missing required fields for proposal creation' 
        };
      }
      
      const proposalRef = doc(collection(db, 'proposals'));
      
      // Create the document with required fields first
      const proposalDoc = {
        // Required fields for Firestore rules
        freelancerId: proposalData.freelancerId,
        clientId: proposalData.clientId,
        jobId: proposalData.jobId,
        status: 'pending',
        
        // Then spread other fields
        ...proposalData,
        id: proposalRef.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      console.log('Creating proposal document:', {
        ...proposalDoc,
        createdAt: '[serverTimestamp]',
        updatedAt: '[serverTimestamp]'
      });
      
      await setDoc(proposalRef, proposalDoc);
      console.log('Proposal created successfully with ID:', proposalRef.id);
      
      // Update job proposal count
      if (proposalData.jobId) {
        try {
          const jobRef = doc(db, 'jobs', proposalData.jobId);
          await updateDoc(jobRef, {
            proposalCount: increment(1)
          });
          console.log('Job proposal count updated');
        } catch (updateError) {
          console.warn('Failed to update job proposal count:', updateError);
          // Don't fail the whole operation
        }
      }
      
      // Create notification for client
      if (proposalData.clientId) {
        try {
          await NotificationService.createNotification({
            userId: proposalData.clientId,
            title: 'New Proposal',
            body: `${proposalData.freelancerName} submitted a proposal for "${proposalData.jobTitle}"`,
            type: 'proposal',
            relatedId: proposalRef.id,
            actionUrl: `/job/${proposalData.jobId}/proposals`
          });
          console.log('Notification created');
        } catch (notificationError) {
          console.warn('Failed to create notification:', notificationError);
          // Don't fail the whole operation
        }
      }
      
      // Always return success object
      return { success: true, proposalId: proposalRef.id };
      
    } catch (error: any) {
      console.error('Error creating proposal:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      // Always return error object
      let errorMessage = 'Failed to create proposal';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'You do not have permission to create proposals. Please ensure you are logged in as a freelancer.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { 
        success: false, 
        error: errorMessage,
        code: error.code,
        details: error
      };
    }
  },

  // Update proposal
  async updateProposal(proposalId: string, updates: Partial<ProposalData>) {
    try {
      await updateDoc(doc(db, 'proposals', proposalId), {
        ...updates,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating proposal:', error);
      return { success: false, error };
    }
  },

  // Withdraw proposal
  async withdrawProposal(proposalId: string) {
    try {
      const proposalRef = doc(db, 'proposals', proposalId);
      const proposalDoc = await getDoc(proposalRef);
      
      if (!proposalDoc.exists()) {
        return { success: false, error: 'Proposal not found' };
      }
      
      const proposal = proposalDoc.data();
      
      await updateDoc(proposalRef, {
        status: 'withdrawn',
        updatedAt: serverTimestamp()
      });
      
      // Update job proposal count
      if (proposal.jobId) {
        await updateDoc(doc(db, 'jobs', proposal.jobId), {
          proposalCount: increment(-1)
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error withdrawing proposal:', error);
      return { success: false, error };
    }
  },

  // Get proposal
  async getProposal(proposalId: string) {
    try {
      const proposalRef = doc(db, 'proposals', proposalId);
      const proposalSnap = await getDoc(proposalRef);
      
      if (proposalSnap.exists()) {
        return { success: true, proposal: mapDocumentData<ProposalData>(proposalSnap) };
      }
      
      return { success: false, error: 'Proposal not found' };
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
  },

  // Check if user already submitted proposal
  async checkExistingProposal(jobId: string, freelancerId: string) {
    try {
      const q = query(
        collection(db, 'proposals'),
        where('jobId', '==', jobId),
        where('freelancerId', '==', freelancerId)
      );
      
      const querySnapshot = await getDocs(q);
      
      return { 
        success: true, 
        exists: !querySnapshot.empty,
        proposal: querySnapshot.empty ? null : mapDocumentData<ProposalData>(querySnapshot.docs[0])
      };
    } catch (error) {
      console.error('Error checking existing proposal:', error);
      return { success: false, error };
    }
  }
};

// Conversation Services (Fixed Implementation)
export const ConversationService = {
  // Find or create conversation between two users
  async findOrCreateConversation(participant1Id: string, participant2Id: string, context?: any) {
    try {
      // Sort participants to ensure consistent order
      const participants = [participant1Id, participant2Id].sort();
      
      // Check if conversation already exists
      const q = query(
        collection(db, 'conversations'),
        where('participants', '==', participants)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Conversation exists
        const conversationDoc = querySnapshot.docs[0];
        return { 
          success: true, 
          conversationId: conversationDoc.id,
          conversation: {
            id: conversationDoc.id,
            ...conversationDoc.data()
          },
          isNew: false
        };
      }
      
      // Get both users' data for the conversation
      const [user1Doc, user2Doc] = await Promise.all([
        getDoc(doc(db, 'users', participant1Id)),
        getDoc(doc(db, 'users', participant2Id))
      ]);
      
      const user1Data = user1Doc.data();
      const user2Data = user2Doc.data();
      
      // Create new conversation
      const conversationRef = doc(collection(db, 'conversations'));
      const conversationData = {
        id: conversationRef.id,
        participants,
        participantDetails: {
          [participant1Id]: { 
            unreadCount: 0,
            displayName: user1Data?.displayName || 'Unknown',
            photoURL: user1Data?.photoURL || '',
            userType: user1Data?.userType || 'freelancer'
          },
          [participant2Id]: { 
            unreadCount: 0,
            displayName: user2Data?.displayName || 'Unknown',
            photoURL: user2Data?.photoURL || '',
            userType: user2Data?.userType || 'freelancer'
          }
        },
        lastMessage: '',
        lastMessageTime: serverTimestamp(),
        lastMessageSenderId: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(conversationRef, conversationData);
      
      return { 
        success: true, 
        conversationId: conversationRef.id,
        conversation: conversationData,
        isNew: true
      };
    } catch (error) {
      console.error('Error finding/creating conversation:', error);
      return { success: false, error };
    }
  },

  // Send message
  async sendMessage(messageData: {
    conversationId: string;
    senderId: string;
    senderName: string;
    recipientId: string;
    text: string;
    attachments?: string[];
  }) {
    try {
      const { conversationId, senderId, senderName, recipientId, text, attachments = [] } = messageData;
      
      // Create message in top-level messages collection
      const messageRef = doc(collection(db, 'messages'));
      const messageDoc = {
        id: messageRef.id,
        conversationId,
        senderId,
        senderName,
        recipientId,
        text,
        attachments,
        status: 'sent',
        createdAt: serverTimestamp()
      };
      
      // Use batch write for atomicity
      const batch = writeBatch(db);
      
      // Add message
      batch.set(messageRef, messageDoc);
      
      // Update conversation
      const conversationRef = doc(db, 'conversations', conversationId);
      batch.update(conversationRef, {
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
        lastMessageSenderId: senderId,
        [`participantDetails.${recipientId}.unreadCount`]: increment(1),
        updatedAt: serverTimestamp()
      });
      
      // Commit batch
      await batch.commit();
      
      // Create notification for recipient
      await addDoc(collection(db, 'notifications'), {
        userId: recipientId,
        title: 'New Message',
        body: `${senderName}: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`,
        type: 'message',
        actionUrl: `/messages/${conversationId}`,
        actionData: {
          conversationId,
          senderId,
          senderName
        },
        read: false,
        createdAt: serverTimestamp()
      });
      
      return { success: true, messageId: messageRef.id };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error };
    }
  },

  // Get conversation with details
  // In firebase-services.ts, fix the getConversationWithDetails method:

  async getConversationWithDetails(conversationId: string, currentUserId: string) {
    try {
      const conversationDoc = await getDoc(doc(db, 'conversations', conversationId));
      
      if (!conversationDoc.exists()) {
        return { success: false, error: 'Conversation not found' };
      }
      
      const conversationData = conversationDoc.data() as ConversationData;
      
      // Don't include id in the data since we're adding it separately
      const { id: _, ...dataWithoutId } = conversationData;
      
      const conversation = {
        id: conversationDoc.id,
        ...dataWithoutId
      };
      
      // Get other user ID - now TypeScript knows participants is string[]
      const otherUserId = conversation.participants.find((id: string) => id !== currentUserId);
      
      // Get other user details from participantDetails or fetch from users collection
      let otherUser = null;
      if (otherUserId) {
        if (conversation.participantDetails?.[otherUserId]) {
          otherUser = {
            id: otherUserId,
            displayName: conversation.participantDetails[otherUserId].displayName || 'Unknown',
            photoURL: conversation.participantDetails[otherUserId].photoURL || '',
            userType: conversation.participantDetails[otherUserId].userType || 'freelancer',
            ...conversation.participantDetails[otherUserId]
          };
        } else {
          // Fallback: fetch from users collection
          const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
          if (otherUserDoc.exists()) {
            const userData = otherUserDoc.data();
            otherUser = {
              id: otherUserId,
              displayName: userData.displayName || 'Unknown',
              photoURL: userData.photoURL || '',
              userType: userData.userType || 'freelancer',
              ...userData
            };
          }
        }
      }
      
      return { success: true, conversation, otherUser };
    } catch (error) {
      console.error('Error getting conversation:', error);
      return { success: false, error };
    }
  },
  // Mark messages as read
  async markMessagesAsRead(conversationId: string, userId: string) {
    try {
      // Get unread messages
      const q = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId),
        where('recipientId', '==', userId),
        where('status', '!=', 'read')
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) return { success: true };
      
      // Update messages in batch
      const batch = writeBatch(db);
      
      querySnapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          status: 'read',
          readAt: serverTimestamp()
        });
      });
      
      // Reset unread count in conversation
      const conversationRef = doc(db, 'conversations', conversationId);
      batch.update(conversationRef, {
        [`participantDetails.${userId}.unreadCount`]: 0
      });
      
      await batch.commit();
      
      return { success: true };
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return { success: false, error };
    }
  },

  // Delete conversation
  async deleteConversation(conversationId: string, userId: string) {
    try {
      // Soft delete by removing user from participants
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationDoc = await getDoc(conversationRef);
      
      if (!conversationDoc.exists()) {
        return { success: false, error: 'Conversation not found' };
      }
      
      const participants = conversationDoc.data().participants.filter((id: string) => id !== userId);
      
      if (participants.length === 0) {
        // If no participants left, delete the conversation
        await deleteDoc(conversationRef);
      } else {
        // Otherwise just remove the user
        await updateDoc(conversationRef, { participants });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return { success: false, error };
    }
  }
};

// Notification Services
export const NotificationService = {
  // Create notification
  async createNotification(notificationData: Partial<NotificationData>) {
    try {
      const notificationRef = doc(collection(db, 'notifications'));
      await setDoc(notificationRef, {
        ...notificationData,
        id: notificationRef.id,
        read: false,
        pushSent: false,
        emailSent: false,
        priority: notificationData.priority || 'medium',
        createdAt: serverTimestamp()
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

  // Mark all notifications as read
  async markAllNotificationsAsRead(userId: string) {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      querySnapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          read: true,
          readAt: serverTimestamp()
        });
      });
      
      await batch.commit();
      
      return { success: true };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return { success: false, error };
    }
  },

  // Delete notification
  async deleteNotification(notificationId: string) {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting notification:', error);
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
      const storageRef = ref(storage, path);
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
    const path = `users/${userId}/profile/${Date.now()}_${file.name}`;
    const result = await StorageService.uploadFile(file, path);
    
    if (result.success && result.downloadURL) {
      // Update user profile with new photo URL
      await UserService.updateUserProfile(userId, { photoURL: result.downloadURL });
    }
    
    return result;
  },

  // Upload project images
  async uploadProjectImages(userId: string, files: File[]) {
    const uploadPromises = files.map(async (file, index) => {
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const path = `projects/${userId}/${Date.now()}_${index}_${sanitizedFileName}`;
      const result = await StorageService.uploadFile(file, path);
      return result.success ? result.downloadURL : null;
    });
    
    const results = await Promise.all(uploadPromises);
    return results.filter(url => url !== null) as string[];
  },

  // Upload attachment
  async uploadAttachment(userId: string, file: File, type: 'proposal' | 'message' | 'job' | 'contract') {
    const path = `users/${userId}/${type}-attachments/${Date.now()}_${file.name}`;
    return await StorageService.uploadFile(file, path);
  },

  // Delete file
  async deleteFile(fileUrl: string) {
    try {
      const storageRef = ref(storage, fileUrl);
      await deleteObject(storageRef);
      return { success: true };
    } catch (error) {
      console.error('Error deleting file:', error);
      return { success: false, error };
    }
  }
};

// Project Services
export const ProjectService = {
  // Create project
  async createProject(projectData: Partial<ProjectData>) {
    try {
      const projectRef = doc(collection(db, 'projects'));
      await setDoc(projectRef, {
        ...projectData,
        id: projectRef.id,
        viewCount: 0,
        likeCount: 0,
        shareCount: 0,
        savedBy: [],
        isPublished: true,
        isFeatured: false,
        isArchived: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return { success: true, projectId: projectRef.id };
    } catch (error) {
      console.error('Error creating project:', error);
      return { success: false, error };
    }
  },

  // Update project
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

  // Delete project
  async deleteProject(projectId: string) {
    try {
      await deleteDoc(doc(db, 'projects', projectId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting project:', error);
      return { success: false, error };
    }
  },

  // Get project
  async getProject(projectId: string) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);
      
      if (projectSnap.exists()) {
        // Increment view count
        await updateDoc(projectRef, {
          viewCount: increment(1)
        });
        
        return { success: true, project: mapDocumentData<ProjectData>(projectSnap) };
      }
      
      return { success: false, error: 'Project not found' };
    } catch (error) {
      console.error('Error getting project:', error);
      return { success: false, error };
    }
  },

  // Get freelancer projects
  async getFreelancerProjects(freelancerId: string) {
    try {
      const q = query(
        collection(db, 'projects'),
        where('freelancerId', '==', freelancerId),
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

  // Search projects
  async searchProjects(searchParams: {
    category?: string;
    skills?: string[];
    freelancerId?: string;
    lastDoc?: DocumentSnapshot;
    pageSize?: number;
  }) {
    try {
      const constraints: QueryConstraint[] = [
        where('isPublished', '==', true),
        orderBy('createdAt', 'desc')
      ];

      if (searchParams.category) {
        constraints.push(where('category', '==', searchParams.category));
      }
      if (searchParams.freelancerId) {
        constraints.push(where('freelancerId', '==', searchParams.freelancerId));
      }

      if (searchParams.lastDoc) {
        constraints.push(startAfter(searchParams.lastDoc));
      }

      constraints.push(limit(searchParams.pageSize || 20));

      const q = query(collection(db, 'projects'), ...constraints);
      const querySnapshot = await getDocs(q);
      
      let projects = querySnapshot.docs.map(doc => mapDocumentData<ProjectData>(doc));
      
      // Filter by skills in memory
      if (searchParams.skills && searchParams.skills.length > 0) {
        projects = projects.filter(p => 
          p.skills && searchParams.skills!.some(skill => p.skills.includes(skill))
        );
      }
      
      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      
      return { 
        success: true, 
        projects, 
        lastDoc: lastVisible,
        hasMore: querySnapshot.docs.length === (searchParams.pageSize || 20)
      };
    } catch (error) {
      console.error('Error searching projects:', error);
      return { success: false, error, projects: [] };
    }
  },

  // Like/unlike project
  async toggleProjectLike(projectId: string, userId: string) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        return { success: false, error: 'Project not found' };
      }
      
      const savedBy = projectDoc.data().savedBy || [];
      const index = savedBy.indexOf(userId);
      
      if (index > -1) {
        savedBy.splice(index, 1);
        await updateDoc(projectRef, {
          savedBy,
          likeCount: increment(-1)
        });
      } else {
        savedBy.push(userId);
        await updateDoc(projectRef, {
          savedBy,
          likeCount: increment(1)
        });
      }
      
      return { success: true, isLiked: index === -1 };
    } catch (error) {
      console.error('Error toggling project like:', error);
      return { success: false, error };
    }
  }
};

// Review Services
export const ReviewService = {
  // Create review
  async createReview(reviewData: Partial<ReviewData>) {
    try {
      const reviewRef = doc(collection(db, 'reviews'));
      await setDoc(reviewRef, {
        ...reviewData,
        id: reviewRef.id,
        isPublic: reviewData.isPublic !== false,
        createdAt: serverTimestamp()
      });
      
      // Update user rating
      if (reviewData.revieweeId && reviewData.rating) {
        const userRef = doc(db, 'users', reviewData.revieweeId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const currentRating = userData.rating || 0;
          const ratingCount = userData.ratingCount || 0;
          
          // Calculate new average rating
          const newRating = ((currentRating * ratingCount) + reviewData.rating) / (ratingCount + 1);
          
          await updateDoc(userRef, {
            rating: newRating,
            ratingCount: increment(1)
          });
        }
      }
      
      // Create notification
      if (reviewData.revieweeId) {
        await NotificationService.createNotification({
          userId: reviewData.revieweeId,
          title: 'New Review',
          body: `${reviewData.reviewerName} left you a ${reviewData.rating}-star review`,
          type: 'review',
          relatedId: reviewRef.id,
          actionUrl: `/reviews/${reviewRef.id}`
        });
      }
      
      return { success: true, reviewId: reviewRef.id };
    } catch (error) {
      console.error('Error creating review:', error);
      return { success: false, error };
    }
  },

  // Get user reviews
  async getUserReviews(userId: string) {
    try {
      const q = query(
        collection(db, 'reviews'),
        where('revieweeId', '==', userId),
        where('isPublic', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const reviews = querySnapshot.docs.map(doc => mapDocumentData<ReviewData>(doc));
      
      return { success: true, reviews };
    } catch (error) {
      console.error('Error getting user reviews:', error);
      return { success: false, error, reviews: [] };
    }
  },

  // Get job reviews
  async getJobReviews(jobId: string) {
    try {
      const q = query(
        collection(db, 'reviews'),
        where('jobId', '==', jobId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const reviews = querySnapshot.docs.map(doc => mapDocumentData<ReviewData>(doc));
      
      return { success: true, reviews };
    } catch (error) {
      console.error('Error getting job reviews:', error);
      return { success: false, error, reviews: [] };
    }
  },

  // Respond to review
  async respondToReview(reviewId: string, response: string) {
    try {
      await updateDoc(doc(db, 'reviews', reviewId), {
        response,
        responseAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error responding to review:', error);
      return { success: false, error };
    }
  }
};

// Contract Services
export const ContractService = {
  // Create contract
  async createContract(contractData: Partial<ContractData>) {
    try {
      const contractRef = doc(collection(db, 'contracts'));
      await setDoc(contractRef, {
        ...contractData,
        id: contractRef.id,
        status: 'draft',
        hoursWorked: 0,
        totalPaid: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return { success: true, contractId: contractRef.id };
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
      const contracts = querySnapshot.docs.map(doc => mapDocumentData<ContractData>(doc));
      
      return { success: true, contracts };
    } catch (error) {
      console.error('Error getting contracts:', error);
      return { success: false, error, contracts: [] };
    }
  },

  // Update contract
  async updateContract(contractId: string, updates: Partial<ContractData>) {
    try {
      await updateDoc(doc(db, 'contracts', contractId), {
        ...updates,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating contract:', error);
      return { success: false, error };
    }
  }
};

// Payment Services
export const PaymentService = {
  // Create payment
  async createPayment(paymentData: Partial<PaymentData>) {
    try {
      const paymentRef = doc(collection(db, 'payments'));
      await setDoc(paymentRef, {
        ...paymentData,
        id: paymentRef.id,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      // Create notification for recipient
      if (paymentData.recipientId) {
        await NotificationService.createNotification({
          userId: paymentData.recipientId,
          title: 'New Payment',
          body: `You received a payment of ${paymentData.currency} ${paymentData.amount} from ${paymentData.senderName}`,
          type: 'payment',
          relatedId: paymentRef.id,
          priority: 'high',
          actionUrl: `/payments/${paymentRef.id}`
        });
      }
      
      return { success: true, paymentId: paymentRef.id };
    } catch (error) {
      console.error('Error creating payment:', error);
      return { success: false, error };
    }
  },

  // Get user payments
  async getUserPayments(userId: string, type: 'sent' | 'received' | 'all') {
    try {
      let q;
      
      if (type === 'sent') {
        q = query(
          collection(db, 'payments'),
          where('senderId', '==', userId),
          orderBy('createdAt', 'desc')
        );
      } else if (type === 'received') {
        q = query(
          collection(db, 'payments'),
          where('recipientId', '==', userId),
          orderBy('createdAt', 'desc')
        );
      } else {
        // Get all payments involving the user
        const sentQuery = query(
          collection(db, 'payments'),
          where('senderId', '==', userId)
        );
        const receivedQuery = query(
          collection(db, 'payments'),
          where('recipientId', '==', userId)
        );
        
        const [sentSnapshot, receivedSnapshot] = await Promise.all([
          getDocs(sentQuery),
          getDocs(receivedQuery)
        ]);
        
        const payments = [
          ...sentSnapshot.docs.map(doc => mapDocumentData<PaymentData>(doc)),
          ...receivedSnapshot.docs.map(doc => mapDocumentData<PaymentData>(doc))
        ].sort((a, b) => {
          const aTime = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
          const bTime = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
          return bTime - aTime;
        });
        
        return { success: true, payments };
      }
      
      const querySnapshot = await getDocs(q);
      const payments = querySnapshot.docs.map(doc => mapDocumentData<PaymentData>(doc));
      
      return { success: true, payments };
    } catch (error) {
      console.error('Error getting payments:', error);
      return { success: false, error, payments: [] };
    }
  }
};

// Verification Services
export const VerificationService = {
  // Submit verification
  async submitVerification(verificationData: Partial<VerificationData>) {
    try {
      const verificationRef = doc(collection(db, 'verifications'));
      await setDoc(verificationRef, {
        ...verificationData,
        id: verificationRef.id,
        status: 'pending',
        submittedAt: serverTimestamp()
      });
      
      return { success: true, verificationId: verificationRef.id };
    } catch (error) {
      console.error('Error submitting verification:', error);
      return { success: false, error };
    }
  },

  // Get user verification
  async getUserVerification(userId: string) {
    try {
      const q = query(
        collection(db, 'verifications'),
        where('userId', '==', userId),
        orderBy('submittedAt', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        return { 
          success: true, 
          verification: mapDocumentData<VerificationData>(querySnapshot.docs[0])
        };
      }
      
      return { success: true, verification: null };
    } catch (error) {
      console.error('Error getting verification:', error);
      return { success: false, error };
    }
  }
};

// Analytics Services
export const AnalyticsService = {
  // Get user analytics
  async getUserAnalytics(userId: string, userType: 'client' | 'freelancer', period: string = 'month') {
    try {
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate = new Date(0); // All time
      }
      
      if (userType === 'freelancer') {
        // Get freelancer analytics
        const [proposalsResult, projectsResult, paymentsResult] = await Promise.all([
          ProposalService.getUserProposals(userId),
          ProjectService.getFreelancerProjects(userId),
          PaymentService.getUserPayments(userId, 'received')
        ]);
        
        const proposals = proposalsResult.proposals || [];
        const projects = projectsResult.projects || [];
        const payments = paymentsResult.payments || [];
        
        // Calculate metrics
        const proposalsSent = proposals.filter(p => 
          p.createdAt instanceof Timestamp && p.createdAt.toDate() >= startDate
        ).length;
        
        const proposalsAccepted = proposals.filter(p => 
          p.status === 'accepted' &&
          p.respondedAt instanceof Timestamp && p.respondedAt.toDate() >= startDate
        ).length;
        
        const totalEarnings = payments
          .filter(p => 
            p.status === 'completed' &&
            p.processedAt instanceof Timestamp && p.processedAt.toDate() >= startDate
          )
          .reduce((sum, p) => sum + (p.netAmount || p.amount), 0);
        
        const completedProjects = projects.filter(p => 
          p.completedAt instanceof Timestamp && p.completedAt.toDate() >= startDate
        ).length;
        
        return {
          success: true,
          data: {
            proposalsSent,
            proposalsAccepted,
            totalEarnings,
            completedProjects,
            acceptanceRate: proposalsSent > 0 ? (proposalsAccepted / proposalsSent) * 100 : 0,
            activeProposals: proposals.filter(p => p.status === 'pending').length,
            totalProjects: projects.length,
            profileViews: 0, // Would need to track this separately
            period
          }
        };
      } else {
        // Get client analytics
        const [jobsResult, paymentsResult] = await Promise.all([
          JobService.getUserJobs(userId, 'client'),
          PaymentService.getUserPayments(userId, 'sent')
        ]);
        
        const jobs = jobsResult.jobs || [];
        const payments = paymentsResult.payments || [];
        
        // Calculate metrics
        const jobsPosted = jobs.filter(j => 
          j.createdAt instanceof Timestamp && j.createdAt.toDate() >= startDate
        ).length;
        
        const jobsCompleted = jobs.filter(j => 
          j.status === 'completed' &&
          j.completedAt instanceof Timestamp && j.completedAt.toDate() >= startDate
        ).length;
        
        const totalSpent = payments
          .filter(p => 
            p.status === 'completed' &&
            p.processedAt instanceof Timestamp && p.processedAt.toDate() >= startDate
          )
          .reduce((sum, p) => sum + p.amount, 0);
        
        const activeJobs = jobs.filter(j => j.status === 'open' || j.status === 'in_progress').length;
        
        return {
          success: true,
          data: {
            jobsPosted,
            jobsCompleted,
            totalSpent,
            activeJobs,
            completionRate: jobsPosted > 0 ? (jobsCompleted / jobsPosted) * 100 : 0,
            avgProposalsPerJob: jobsPosted > 0 ? jobs.reduce((sum, j) => sum + j.proposalCount, 0) / jobsPosted : 0,
            period
          }
        };
      }
    } catch (error) {
      console.error('Error getting user analytics:', error);
      return { success: false, error, data: null };
    }
  },

  // Track event
  async trackEvent(userId: string, event: string, data?: any) {
    try {
      // Only track events if user is authenticated
      if (!userId) {
        console.warn('Cannot track event without userId');
        return { success: false, error: 'No userId provided' };
      }
      
      await addDoc(collection(db, 'analytics_events'), {
        userId,
        event,
        data,
        createdAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error tracking event:', error);
      // Don't throw, just log the error
      return { success: false, error };
    }
  }
};

// Export all services as a single object
export const firebaseService = {
  UserService,
  JobService,
  ProposalService,
  ConversationService,
  NotificationService,
  StorageService,
  ProjectService,
  ReviewService,
  ContractService,
  PaymentService,
  VerificationService,
  AnalyticsService,
  StripeService
};

// Default export for convenience
export default firebaseService;