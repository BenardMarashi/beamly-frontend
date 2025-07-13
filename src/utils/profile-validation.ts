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
  
  if (!userData?.location?.trim()) {
    missingFields.push('Location');
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