import { useAuth } from '../contexts/AuthContext';

export const useMessageAccess = () => {
  const { userData } = useAuth();
  
  /*
  const isSubscriptionValid = () => {
    if (!userData?.subscriptionEndDate) return false;
    const endDate = userData.subscriptionEndDate;
    const now = new Date();
    return endDate > now && userData.subscriptionStatus === 'active';
  };
  
  const hasMessageAccess = 
    userData?.userType === 'client' ||
    (userData?.subscriptionTier === 'messages' && isSubscriptionValid()) ||
    (userData?.subscriptionTier === 'pro' && isSubscriptionValid()) ||
    userData?.isPro === true;
  */
  return {
    hasMessageAccess: true, // Changed from conditional check
    isProUser: (userData?.subscriptionTier === 'pro') || userData?.isPro === true,
    isMessagesUser: userData?.subscriptionTier === 'messages',
    subscriptionEndDate: userData?.subscriptionEndDate,
    isExpired: false // Always false
  };
};