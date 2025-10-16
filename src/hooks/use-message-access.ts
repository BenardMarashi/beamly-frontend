import { useAuth } from '../contexts/AuthContext';

export const useMessageAccess = () => {
  const { userData } = useAuth();
  
  // Check if subscription is active AND not expired
  const isSubscriptionValid = () => {
    if (!userData?.subscriptionEndDate) return false;
    
    const endDate = userData.subscriptionEndDate;
    const now = new Date();
    
    // Check if subscription end date is in the future
    return endDate > now && userData.subscriptionStatus === 'active';
  };
  
  // Check if user has message access
  const hasMessageAccess = 
    userData?.userType === 'client' ||  // Clients always have access
    (userData?.subscriptionTier === 'messages' && isSubscriptionValid()) ||
    (userData?.subscriptionTier === 'pro' && isSubscriptionValid()) ||
    userData?.isPro === true; // Legacy pro users
  
  return {
    hasMessageAccess,
    isProUser: (userData?.subscriptionTier === 'pro' && isSubscriptionValid()) || userData?.isPro === true,
    isMessagesUser: userData?.subscriptionTier === 'messages' && isSubscriptionValid(),
    subscriptionEndDate: userData?.subscriptionEndDate,
    isExpired: userData?.subscriptionEndDate ? userData.subscriptionEndDate < new Date() : false
  };
};