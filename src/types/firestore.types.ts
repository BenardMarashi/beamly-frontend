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
  languages?: string[];
  portfolio?: string;
  experienceLevel?: 'entry' | 'intermediate' | 'expert';
  
  // Availability
  isAvailable?: boolean;
  availabilityStatus?: string;
  
  // Stats
  completedProjects?: number;
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
    type: 'job' | 'general';
    jobId?: string;
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
// Add these at the end of the file, before the closing of the file

// Collection: notifications
export interface Notification {
  id: string;
  userId: string;
  
  // Notification Content
  title: string;
  body: string;
  type: 'new-job' | 'proposal' | 'message' | 'payment' | 'review' | 'system';
  
  // Navigation
  actionUrl?: string;
  actionData?: {
    jobId?: string;
    proposalId?: string;
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
export interface Category {
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
export interface Skill {
  id: string;
  name: string;
  category: string;
  usageCount: number;
  trending: boolean;
}

// Collection: savedJobs (subcollection under users)
export interface SavedJob {
  jobId: string;
  savedAt: Date;
}

// Collection: analytics (for admin dashboard)
export interface Analytics {
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
}

// Collection: projects (freelancer portfolios)
export interface Project {
  id: string;
  freelancerId: string;
  freelancerName?: string;
  freelancerPhotoURL?: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  images: string[];
  thumbnailUrl?: string;
  liveUrl?: string;
  githubUrl?: string;
  demoUrl?: string;
  client?: string;
  duration?: string;
  teamSize?: number;
  role?: string;
  technologies?: string[];
  challenges?: string;
  solution?: string;
  impact?: string;
  testimonial?: string;
  viewCount?: number;
  likeCount?: number;
  shareCount?: number;
  savedBy?: string[];
  isPublished?: boolean;
  isFeatured?: boolean;
  isArchived?: boolean;
  createdAt: any;
  updatedAt: any;
}

// Collection: verifications (ID verification requests)
export interface Verification {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  
  // Document Info
  documentType: 'passport' | 'driver_license' | 'national_id';
  documentUrl: string; // Secure storage URL
  
  // Status
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string; // Admin who reviewed
  reviewedAt?: Date;
  rejectionReason?: string;
  
  // Timestamps
  submittedAt: Date;
  expiresAt?: Date; // Some IDs have expiration
}

// Note: The following interfaces were removed as they were unused:
// - Notification (declared but never used)
// - Category (declared but never used)
// - Skill (declared but never used)
// - SavedJob (declared but never used)
// - Analytics (declared but never used)