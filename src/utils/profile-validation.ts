// src/utils/profile-validation.ts

interface ProfileValidationResult {
  isValid: boolean;
  missingFields: string[];
  message?: string;
}

export const validateUserProfile = (userData: any, requiredFor: 'job-posting' | 'proposal' = 'job-posting'): ProfileValidationResult => {
  const missingFields: string[] = [];
  
  // Basic fields required for all users
  if (!userData?.displayName?.trim()) {
    missingFields.push('Display Name');
  }
  
  if (!userData?.bio?.trim()) {
    missingFields.push('Bio');
  }
  
  // Additional fields for freelancers
  if (requiredFor === 'proposal' && (userData?.userType === 'freelancer' || userData?.userType === 'both')) {
    if (!userData?.skills || userData.skills.length === 0) {
      missingFields.push('Skills');
    }
    
    if (!userData?.hourlyRate || userData.hourlyRate <= 0) {
      missingFields.push('Hourly Rate');
    }
  }
  
  const isValid = missingFields.length === 0;
  
  return {
    isValid,
    missingFields,
    message: isValid 
      ? 'Profile is complete' 
      : `Please complete your profile. Missing: ${missingFields.join(', ')}`
  };
};

export const isProfileComplete = (userData: any): boolean => {
  return userData?.profileCompleted === true || validateUserProfile(userData).isValid;
};

// src/utils/profile-check.ts

import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export const checkUserProfile = async (userId: string) => {
  try {
    console.log("Checking profile for user:", userId);
    
    const userDoc = await getDoc(doc(db, "users", userId));
    
    if (!userDoc.exists()) {
      console.log("No Firestore document found");
      return {
        exists: false,
        data: null,
        profileCompleted: false,
        missingFields: ["User document not found"]
      };
    }
    
    const data = userDoc.data();
    console.log("User document data:", data);
    
    // Check required fields
    const missingFields = [];
    if (!data.displayName?.trim()) missingFields.push("Display Name");
    if (!data.bio?.trim()) missingFields.push("Bio");
    if (!data.userType) missingFields.push("User Type");
    
    // Additional checks for freelancers
    if (data.userType === 'freelancer' || data.userType === 'both') {
      if (!data.skills || data.skills.length === 0) missingFields.push("Skills");
      if (!data.hourlyRate || data.hourlyRate <= 0) missingFields.push("Hourly Rate");
    }
    
    const profileCompleted = data.profileCompleted === true || missingFields.length === 0;
    
    return {
      exists: true,
      data: data,
      profileCompleted: profileCompleted,
      missingFields: missingFields,
      userType: data.userType,
      hasAllRequiredFields: missingFields.length === 0,
      verificationStatus: data.verificationStatus || 'unverified'
    };
  } catch (error) {
    console.error("Error checking profile:", error);
    return {
      exists: false,
      data: null,
      profileCompleted: false,
      missingFields: ["Error checking profile"],
      error: error
    };
  }
};