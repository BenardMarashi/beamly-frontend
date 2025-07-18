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
  
  // Subscription info
  subscription?: {
    plan: 'free' | 'monthly' | 'quarterly' | 'yearly';
    startDate: Date;
    endDate: Date;
    status: 'active' | 'cancelled' | 'expired';
  };
  
  // Additional profile metadata
  savedProfiles?: string[]; // IDs of saved freelancer profiles
  viewCount?: number; // Profile view count
}