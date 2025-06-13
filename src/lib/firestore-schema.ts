import { Timestamp } from 'firebase/firestore';

// User Types
export interface Language {
  code: string;
  proficiency: 'basic' | 'conversational' | 'fluent' | 'native';
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
}

export interface BillingInfo {
  stripeCustomerId?: string;
  paymentMethods?: PaymentMethod[];
  defaultPaymentMethod?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  last4: string;
  expiryMonth?: number;
  expiryYear?: number;
}

// Collection: users
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  userType: 'freelancer' | 'client' | 'both';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Freelancer specific fields
  skills?: string[];
  hourlyRate?: number;
  bio?: string;
  portfolio?: string[];
  rating?: number;
  completedJobs?: number;
  availability?: 'available' | 'busy' | 'offline';
  languages?: Language[];
  
  // Client specific fields
  companyName?: string;
  industry?: string;
  
  // Settings
  notifications: NotificationSettings;
  billingInfo?: BillingInfo;
}

// Collection: jobs
export interface Job {
  id: string;
  clientId: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  budget: {
    type: 'fixed' | 'hourly';
    amount: number;
    currency: string;
  };
  duration: string;
  experienceLevel: 'beginner' | 'intermediate' | 'expert';
  status: 'draft' | 'active' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  proposals?: number;
  attachments?: string[];
  visibility: 'public' | 'invite_only';
  assignedFreelancerId?: string;
}

// Collection: proposals
export interface Milestone {
  id: string;
  description: string;
  amount: number;
  dueDate: Timestamp;
  status: 'pending' | 'in_progress' | 'completed' | 'approved';
}

export interface Proposal {
  id: string;
  jobId: string;
  freelancerId: string;
  coverLetter: string;
  proposedRate: number;
  estimatedDuration: string;
  attachments?: string[];
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt: Timestamp;
  clientViewed: boolean;
  milestones?: Milestone[];
}

// Collection: conversations
export interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: Timestamp;
  unreadCount: {
    [userId: string]: number;
  };
  jobId?: string; // Optional link to related job
}

// Sub-collection: conversations/{conversationId}/messages
export interface Attachment {
  url: string;
  type: 'image' | 'document' | 'video';
  name: string;
  size: number;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Timestamp;
  read: boolean;
  attachments?: Attachment[];
  edited?: boolean;
  editedAt?: Timestamp;
}

// Collection: transactions
export interface Transaction {
  id: string;
  type: 'payment' | 'withdrawal' | 'escrow' | 'release';
  amount: number;
  currency: string;
  fromUserId?: string;
  toUserId?: string;
  jobId?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod?: string;
  stripeSessionId?: string;
  createdAt: Timestamp;
  completedAt?: Timestamp;
  description: string;
}

// Collection: reviews
export interface Review {
  id: string;
  jobId: string;
  fromUserId: string;
  toUserId: string;
  rating: number;
  comment: string;
  createdAt: Timestamp;
  helpful?: number; // Count of users who found this helpful
}

// Collection: notifications
export interface Notification {
  id: string;
  userId: string;
  type: 'message' | 'proposal' | 'job_update' | 'payment' | 'review';
  title: string;
  body: string;
  data?: any;
  read: boolean;
  createdAt: Timestamp;
  actionUrl?: string;
}