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
  
  // Freelancer specific fields
  bio?: string;
  skills?: string[];
  hourlyRate?: number;
  location?: string;
  portfolio?: string;
  experienceLevel?: 'entry' | 'intermediate' | 'expert';
  languages?: string[];
  isAvailable?: boolean;
  rating?: number;
  completedProjects?: number;
  totalEarnings?: number;
  
  // Client specific fields  
  companyName?: string;
  industry?: string;
  totalSpent?: number;
  activeJobs?: number;
  
  // Common fields
  createdAt?: Date;
  updatedAt?: Date;
  lastActive?: Date;
  isVerified?: boolean;
  isBlocked?: boolean;
  
  // Notification settings
  notifications?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  
  // Subscription info
  subscription?: {
    plan: 'free' | 'monthly' | 'quarterly' | 'yearly';
    startDate: Date;
    endDate: Date;
    status: 'active' | 'cancelled' | 'expired';
  };
}