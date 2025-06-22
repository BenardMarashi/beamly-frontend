// Firestore Database Structure for Freelance Marketplace

// Collection: users
interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  userType: 'freelancer' | 'client' | 'both';
  
  // Profile Information
  bio?: string;
  skills?: string[];
  hourlyRate?: number;
  location?: string;
  languages?: string[];
  
  // Freelancer specific
  portfolio?: string;
  completedProjects?: number;
  rating?: number;
  totalEarnings?: number;
  isAvailable?: boolean;
  featuredUntil?: Date; // For featured boost
  
  // Client specific
  companyName?: string;
  totalSpent?: number;
  activeJobs?: number;
  
  // Subscription info
  subscription?: {
    plan: 'free' | 'monthly' | 'quarterly' | 'yearly';
    startDate: Date;
    endDate: Date;
    status: 'active' | 'cancelled' | 'expired';
  };
  
  // System fields
  createdAt: Date;
  updatedAt: Date;
  lastActive: Date;
  fcmToken?: string;
  isVerified: boolean;
  isBlocked: boolean;
}

// Collection: jobs
interface Job {
  id: string;
  clientId: string;
  clientName: string;
  
  // Job Details
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  skills: string[];
  
  // Budget & Timeline
  budgetType: 'fixed' | 'hourly';
  budgetMin?: number;
  budgetMax?: number;
  fixedPrice?: number;
  hourlyRate?: number;
  duration?: string; // "1-3 months", "Less than 1 month", etc.
  deadline?: Date;
  
  // Job Settings
  experienceLevel: 'entry' | 'intermediate' | 'expert';
  projectSize: 'small' | 'medium' | 'large';
  visibility: 'public' | 'invite-only';
  
  // Location
  locationType: 'remote' | 'onsite' | 'hybrid';
  location?: string;
  
  // Status
  status: 'draft' | 'open' | 'in-progress' | 'completed' | 'cancelled';
  
  // Proposals & Hiring
  proposalCount: number;
  invitesSent: number;
  hiredFreelancerId?: string;
  hiredFreelancerName?: string;
  hiredAt?: Date;
  
  // Attachments
  attachments?: {
    name: string;
    url: string;
    size: number;
    type: string;
  }[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  featured?: boolean;
  featuredUntil?: Date;
}

// Collection: proposals
interface Proposal {
  id: string;
  jobId: string;
  freelancerId: string;
  freelancerName: string;
  freelancerAvatar?: string;
  
  // Proposal Details
  coverLetter: string;
  proposedRate: number;
  rateType: 'fixed' | 'hourly';
  estimatedDuration?: string;
  
  // Status
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  
  // Attachments
  attachments?: {
    name: string;
    url: string;
    size: number;
    type: string;
  }[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  respondedAt?: Date;
}

// Collection: contracts
interface Contract {
  id: string;
  jobId: string;
  clientId: string;
  freelancerId: string;
  proposalId: string;
  
  // Contract Terms
  title: string;
  scope: string;
  rate: number;
  rateType: 'fixed' | 'hourly';
  paymentSchedule?: 'milestone' | 'weekly' | 'monthly' | 'on-completion';
  
  // Milestones (for fixed projects)
  milestones?: {
    id: string;
    title: string;
    description: string;
    amount: number;
    dueDate: Date;
    status: 'pending' | 'in-progress' | 'submitted' | 'approved' | 'paid';
    submittedAt?: Date;
    approvedAt?: Date;
    paidAt?: Date;
  }[];
  
  // Time Tracking (for hourly)
  totalHoursLogged?: number;
  weeklyHourLimit?: number;
  
  // Status & Payments
  status: 'active' | 'paused' | 'completed' | 'terminated';
  totalPaid: number;
  totalDue: number;
  lastPaymentDate?: Date;
  
  // Dates
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// Collection: messages
interface Message {
  id: string;
  conversationId: string; // Format: `${userId1}_${userId2}` (sorted)
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  
  // Message Content
  text?: string;
  attachments?: {
    name: string;
    url: string;
    size: number;
    type: string;
  }[];
  
  // Status
  status: 'sent' | 'delivered' | 'read';
  readAt?: Date;
  
  // Related Context
  jobId?: string; // If message is about a specific job
  contractId?: string; // If message is about a contract
  
  createdAt: Date;
  editedAt?: Date;
}

// Collection: conversations
interface Conversation {
  id: string; // Format: `${userId1}_${userId2}` (sorted)
  participants: string[]; // Array of user IDs
  participantNames: string[];
  
  // Last Message Info (for listing)
  lastMessage?: string;
  lastMessageTime?: Date;
  lastMessageSenderId?: string;
  
  // Unread counts
  unreadCount: {
    [userId: string]: number;
  };
  
  // Context
  jobId?: string;
  jobTitle?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

// Collection: reviews
interface Review {
  id: string;
  contractId: string;
  jobId: string;
  
  // Review from client to freelancer
  clientToFreelancer?: {
    reviewerId: string;
    revieweeId: string;
    rating: number; // 1-5
    comment: string;
    skills?: string[]; // Skills endorsed
    wouldHireAgain: boolean;
  };
  
  // Review from freelancer to client
  freelancerToClient?: {
    reviewerId: string;
    revieweeId: string;
    rating: number; // 1-5
    comment: string;
    wouldWorkAgain: boolean;
  };
  
  createdAt: Date;
}

// Collection: transactions
interface Transaction {
  id: string;
  type: 'subscription' | 'feature-boost' | 'job-fee' | 'milestone-payment' | 'hourly-payment';
  
  // User Info
  userId: string;
  userEmail: string;
  
  // Transaction Details
  amount: number;
  currency: string;
  description: string;
  
  // Payment Provider Info
  provider: 'stripe' | 'paddle';
  providerId: string; // Stripe/Paddle transaction ID
  paymentMethod?: string;
  
  // Related Entities
  jobId?: string;
  contractId?: string;
  milestoneId?: string;
  subscriptionId?: string;
  
  // Status
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  
  // Timestamps
  createdAt: Date;
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
  messagessSent: number;
  contractsCreated: number;
}