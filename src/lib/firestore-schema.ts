// src/lib/firestore-schema.ts
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
  
  // Stripe Connect fields (for freelancers)
  stripeConnectAccountId?: string;
  stripeConnectStatus?: 'pending' | 'active' | 'restricted';
  stripeConnectChargesEnabled?: boolean;
  stripeConnectPayoutsEnabled?: boolean;
  stripeConnectDetailsSubmitted?: boolean;
  totalEarnings?: number;
  availableBalance?: number;
  pendingBalance?: number;
  
  // Stripe Customer fields (for subscriptions)
  stripeCustomerId?: string;
  
  // Subscription fields
  isPro?: boolean;
  subscriptionStatus?: 'active' | 'cancelled' | 'past_due' | 'unpaid';
  subscriptionPlan?: 'monthly' | 'quarterly' | 'yearly';
  stripeSubscriptionId?: string;
  subscriptionStartDate?: Timestamp;
  subscriptionEndDate?: Timestamp;
  
  // Settings
  notifications: NotificationSettings;
  billingInfo?: BillingInfo;
}

// Collection: jobs
export interface Job {
  id: string;
  clientId: string;
  clientName: string;
  clientPhotoURL?: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  skills: string[];
  budgetType: 'fixed' | 'hourly';
  budgetMin?: number;
  budgetMax?: number;
  fixedPrice?: number;
  duration: string;
  experienceLevel: 'beginner' | 'intermediate' | 'expert';
  status: 'draft' | 'active' | 'in_progress' | 'completed' | 'cancelled';
  paymentStatus?: 'pending' | 'escrow' | 'released' | 'disputed';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  proposals?: number;
  attachments?: string[];
  visibility: 'public' | 'invite_only';
  assignedFreelancerId?: string;
  assignedProposalId?: string;
  completedAt?: Timestamp;
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
  jobTitle: string;
  clientId: string;
  clientName: string;
  freelancerId: string;
  freelancerName: string;
  freelancerPhotoURL?: string;
  freelancerRating?: number;
  freelancerCompletedJobs?: number;
  coverLetter: string;
  proposedRate: number;
  estimatedDuration: string;
  budgetType: string;
  attachments?: string[];
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  clientViewed: boolean;
  milestones?: Milestone[];
}

// Collection: payments
export interface Payment {
  id: string;
  jobId: string;
  proposalId: string;
  clientId: string;
  freelancerId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'held_in_escrow' | 'released' | 'refunded' | 'failed';
  type: 'job_payment';
  stripePaymentIntentId?: string;
  stripeTransferId?: string;
  platformFee?: number;
  freelancerAmount?: number;
  createdAt: Timestamp;
  paidAt?: Timestamp;
  heldAt?: Timestamp;
  releasedAt?: Timestamp;
  refundedAt?: Timestamp;
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
  type: 'payment' | 'withdrawal' | 'escrow' | 'release' | 'subscription' | 'refund';
  userId: string;
  userEmail?: string;
  amount: number;
  currency: string;
  fromUserId?: string;
  toUserId?: string;
  jobId?: string;
  paymentId?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod?: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  stripeTransferId?: string;
  stripePayoutId?: string;
  stripeInvoiceId?: string;
  createdAt: Timestamp;
  completedAt?: Timestamp;
  description: string;
  metadata?: Record<string, any>;
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

// Subscription Plans
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'quarter' | 'year';
  features: string[];
  stripePriceId: string;
  isPopular?: boolean;
}

// Payout Request
export interface PayoutRequest {
  id: string;
  freelancerId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  stripePayoutId?: string;
  requestedAt: Timestamp;
  processedAt?: Timestamp;
  failureReason?: string;
}