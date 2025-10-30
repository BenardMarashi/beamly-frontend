// src/types/user.types.ts

export interface Language {
  code: string;
  proficiency: 'basic' | 'conversational' | 'fluent' | 'native';
}

export type SubscriptionTier = 'free' | 'messages' | 'pro';

export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  userType: 'freelancer' | 'client' | 'both';
  profileCompleted?: boolean;
  category?: string;
  
  // Basic Info
  bio?: string;
  
  // Freelancer specific fields
  skills?: string[];
  hourlyRate?: number;
  experienceLevel?: 'entry' | 'intermediate' | 'expert';
  experience?: string;
  languages?: string[];
  isAvailable?: boolean;
  
  // Stats
  rating?: number;
  reviewCount?: number;
  completedProjects?: number;
  
  // Client specific fields  
  companyName?: string;
  industry?: string;
  activeJobs?: number;
  
  // Stripe Connect fields
  stripeConnectAccountId?: string;
  stripeConnectStatus?: 'pending' | 'active' | 'restricted';
  stripeConnectChargesEnabled?: boolean;
  stripeConnectPayoutsEnabled?: boolean;
  stripeConnectDetailsSubmitted?: boolean;
  stripeConnectOnboarded?: boolean;
  stripeConnectCountry?: string;
  totalEarnings?: number;
  availableBalance?: number;
  pendingBalance?: number;
  
  // Stripe Customer fields
  stripeCustomerId?: string;
  
  // NEW: Unified subscription fields
  subscriptionTier?: SubscriptionTier; // 'free', 'messages', or 'pro'
  subscriptionStatus?: 'active' | 'cancelled' | 'expired';
  subscriptionPlan?: string; // 'monthly', 'sixmonths', 'yearly', 'messages'
  stripeSubscriptionId?: string;
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  
  // Legacy fields (keep for backward compatibility)
  isPro?: boolean;
  monthlyProposals?: number;
  lastProposalReset?: Date;
  
  // System fields
  createdAt?: Date;
  updatedAt?: Date;
  lastActive?: Date;
  isVerified?: boolean;
  isBlocked?: boolean;
  joinedAt?: Date;
  
  // Notification settings
  notifications?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  
  // Additional profile metadata
  savedProfiles?: string[];
  viewCount?: number;
}