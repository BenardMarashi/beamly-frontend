// Collection: users
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  userType: 'freelancer' | 'client' | 'both';
  
  // Profile Information
  bio?: string;
  title?: string;
  skills?: string[];
  hourlyRate?: number;
  location?: string;
  timezone?: string;
  languages?: string[];
  portfolio?: string;
  experienceLevel?: 'entry' | 'intermediate' | 'expert';
  
  // Availability
  isAvailable?: boolean;
  availabilityStatus?: string;
  
  // Stats
  completedProjects?: number;
  totalEarnings?: number;
  totalSpent?: number;
  rating?: number;
  reviewCount?: number;
  
  // Company (for clients)
  companyName?: string;
  companySize?: string;
  industry?: string;
  
  // Settings
  notifications?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  
  privacy?: {
    profileVisibility: 'public' | 'clients-only' | 'private';
    showEmail: boolean;
    showPhone: boolean;
  };
  
  // Subscription
  subscription?: {
    plan: 'free' | 'monthly' | 'quarterly' | 'yearly';
    status: 'active' | 'cancelled' | 'expired';
    startDate: Date;
    endDate: Date;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  };
  
  // Verification
  isVerified: boolean;
  verificationDocuments?: string[];
  
  // Social Links
  socialLinks?: {
    linkedin?: string;
    github?: string;
    website?: string;
    twitter?: string;
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastActive?: Date;
  
  // Account Status
  isBlocked?: boolean;
  blockedReason?: string;
  profileCompleted?: boolean;
}

// Collection: jobs
export interface Job {
  id: string;
  
  // Basic Info
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  skills: string[];
  
  // Budget
  budgetType: 'fixed' | 'hourly';
  budgetMin: number;
  budgetMax: number;
  fixedPrice?: number;
  
  // Project Details
  duration: string;
  experienceLevel: 'entry' | 'intermediate' | 'expert';
  projectSize: 'small' | 'medium' | 'large';
  
  // Location
  locationType: 'remote' | 'onsite' | 'hybrid';
  location?: string;
  timezone?: string;
  
  // Client Info
  clientId: string;
  clientName: string;
  clientPhotoURL?: string;
  clientCompany?: string;
  clientCountry?: string;
  clientRating?: number;
  clientJobsPosted?: number;
  clientTotalSpent?: number;
  
  // Status
  status: 'draft' | 'open' | 'in-progress' | 'completed' | 'cancelled';
  visibility: 'public' | 'invite-only' | 'private';
  
  // Metrics
  viewCount: number;
  proposalCount: number;
  invitesSent: number;
  
  // Features
  featured: boolean;
  urgent: boolean;
  verified: boolean;
  
  // Attachments
  attachments?: string[];
  
  // Hired Freelancer (when job is awarded)
  hiredFreelancerId?: string;
  hiredAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  completedAt?: Date;
  
  // SEO
  slug?: string;
  tags?: string[];
}

// Collection: proposals
export interface Proposal {
  id: string;
  
  // Job Reference
  jobId: string;
  jobTitle: string;
  clientId: string;
  clientName: string;
  
  // Freelancer Info
  freelancerId: string;
  freelancerName: string;
  freelancerPhotoURL?: string;
  freelancerRating?: number;
  freelancerCompletedJobs?: number;
  
  // Proposal Details
  coverLetter: string;
  proposedRate: number;
  estimatedDuration: string;
  budgetType: 'fixed' | 'hourly';
  
  // Attachments
  attachments?: string[];
  portfolio?: string[];
  
  // Status
  status: 'pending' | 'shortlisted' | 'interviewed' | 'accepted' | 'rejected' | 'withdrawn';
  
  // Client Actions
  clientViewed: boolean;
  clientViewedAt?: Date;
  clientNotes?: string;
  
  // Interview
  interviewScheduled?: boolean;
  interviewDate?: Date;
  
  // Boost
  isBoosted: boolean;
  boostExpiresAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  respondedAt?: Date;
}

// Collection: contracts
export interface Contract {
  id: string;
  
  // References
  jobId: string;
  jobTitle: string;
  proposalId: string;
  clientId: string;
  clientName: string;
  freelancerId: string;
  freelancerName: string;
  
  // Contract Details
  description: string;
  terms?: string;
  
  // Payment
  paymentType: 'fixed' | 'hourly' | 'milestone';
  totalBudget: number;
  hourlyRate?: number;
  weeklyLimit?: number;
  
  // Milestones (for milestone contracts)
  milestones?: Milestone[];
  
  // Escrow
  escrowAmount: number;
  escrowStatus: 'pending' | 'funded' | 'released' | 'disputed';
  
  // Time Tracking (for hourly contracts)
  totalHoursWorked?: number;
  timeEntries?: TimeEntry[];
  
  // Status
  status: 'pending' | 'active' | 'paused' | 'completed' | 'cancelled' | 'disputed';
  
  // Payments
  totalPaid: number;
  totalDue: number;
  paymentSchedule?: 'weekly' | 'biweekly' | 'monthly' | 'milestone';
  
  // Feedback
  clientFeedback?: Review;
  freelancerFeedback?: Review;
  
  // Timestamps
  startDate: Date;
  endDate?: Date;
  actualEndDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Sub-types for Contract
interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  dueDate: Date;
  status: 'pending' | 'in-progress' | 'submitted' | 'approved' | 'paid';
  submittedAt?: Date;
  approvedAt?: Date;
  paidAt?: Date;
}

interface TimeEntry {
  id: string;
  date: Date;
  hours: number;
  description: string;
  status: 'pending' | 'approved' | 'disputed';
  rate: number;
  amount: number;
}

interface Review {
  rating: number;
  comment: string;
  skills?: string[];
  wouldRecommend: boolean;
  createdAt: Date;
}

// Collection: messages
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  attachments?: string[];
  
  // Read receipts
  read: boolean;
  readAt?: Date;
  
  // Message type
  type: 'text' | 'attachment' | 'system' | 'offer';
  
  // For offer messages
  offer?: {
    amount: number;
    description: string;
    milestones?: Milestone[];
  };
  
  // Status
  status: 'sent' | 'delivered' | 'read';
  edited: boolean;
  editedAt?: Date;
  
  createdAt: Date;
}

// Collection: conversations
export interface Conversation {
  id: string;
  participants: string[];
  participantNames: { [userId: string]: string };
  participantAvatars: { [userId: string]: string };
  
  // Context
  context?: {
    type: 'job' | 'contract' | 'general';
    jobId?: string;
    contractId?: string;
  };
  
  // Last Message
  lastMessage?: string;
  lastMessageTime?: Date;
  lastMessageSenderId?: string;
  
  // Unread counts per participant
  unreadCount: { [userId: string]: number };
  
  // Status
  isActive: boolean;
  isArchived: { [userId: string]: boolean };
  
  createdAt: Date;
  updatedAt: Date;
}

// Collection: transactions
export interface Transaction {
  id: string;
  
  // Type
  type: 'payment' | 'withdrawal' | 'subscription' | 'refund' | 'fee';
  
  // Parties
  fromUserId?: string;
  toUserId?: string;
  
  // References
  contractId?: string;
  milestoneId?: string;
  subscriptionId?: string;
  
  // Amount
  amount: number;
  currency: string;
  
  // Fees
  platformFee?: number;
  processingFee?: number;
  netAmount?: number;
  
  // Payment Method
  paymentMethod?: 'card' | 'bank' | 'paypal' | 'stripe';
  paymentMethodDetails?: any;
  
  // Status
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  
  // External References
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  
  // Description
  description: string;
  
  // Timestamps
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  refundedAt?: Date;
}

// Collection: notifications
interface Notification {
  id: string;
  userId: string;
  
  // Notification Content
  title: string;
  body: string;
  type: 'new-job' | 'proposal' | 'message' | 'contract' | 'payment' | 'review' | 'system';
  
  // Navigation
  actionUrl?: string;
  actionData?: {
    jobId?: string;
    proposalId?: string;
    contractId?: string;
    conversationId?: string;
  };
  
  // Status
  read: boolean;
  readAt?: Date;
  
  // Push Notification
  pushSent: boolean;
  pushSentAt?: Date;
  
  createdAt: Date;
  expiresAt?: Date;
}

// Collection: categories
interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  subcategories: string[];
  jobCount: number;
  featured: boolean;
  order: number;
}

// Collection: skills
interface Skill {
  id: string;
  name: string;
  category: string;
  usageCount: number;
  trending: boolean;
}

// Collection: savedJobs (subcollection under users)
interface SavedJob {
  jobId: string;
  savedAt: Date;
}

// Collection: analytics (for admin dashboard)
interface Analytics {
  id: string; // Date format: YYYY-MM-DD
  date: Date;
  
  // User Metrics
  newUsers: number;
  activeUsers: number;
  totalUsers: number;
  
  // Job Metrics
  newJobs: number;
  activeJobs: number;
  completedJobs: number;
  
  // Financial Metrics
  revenue: {
    subscriptions: number;
    jobFees: number;
    featureBoosts: number;
    total: number;
  };
  
  // Engagement Metrics
  proposalsSubmitted: number;
  messagesSent: number;
  contractsCreated: number;
}