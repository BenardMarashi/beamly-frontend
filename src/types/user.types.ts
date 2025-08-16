// src/types/user.types.ts

export interface Language {
  code: string;
  proficiency: 'basic' | 'conversational' | 'fluent' | 'native';
}

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
  experience?: string; // Experience description/summary
  languages?: string[];
  isAvailable?: boolean;
  
  // Stats (usually calculated/updated by system)
  rating?: number;
  reviewCount?: number;
  completedProjects?: number;
  
  // Client specific fields  
  companyName?: string;
  industry?: string;
  activeJobs?: number;
  
  // Stripe Connect fields (for freelancers)
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
  
  // Stripe Customer fields (for subscriptions)
  stripeCustomerId?: string;
  
  // Subscription fields
  isPro?: boolean;
  subscriptionStatus?: 'active' | 'cancelled' | 'past_due' | 'unpaid';
  subscriptionPlan?: 'monthly' | 'quarterly' | 'yearly';
  stripeSubscriptionId?: string;
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  
  // System fields
  createdAt?: Date;
  updatedAt?: Date;
  lastActive?: Date;
  isVerified?: boolean;
  isBlocked?: boolean;
  joinedAt?: Date; // Alternative to createdAt for display
  
  // Notification settings
  notifications?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  
  // Additional profile metadata
  savedProfiles?: string[]; // IDs of saved freelancer profiles
  viewCount?: number; // Profile view count
}
