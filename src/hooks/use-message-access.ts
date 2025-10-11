import { useAuth } from '../contexts/AuthContext';

export const useMessageAccess = () => {
  const { userData } = useAuth();
  
  // Check if user has message access (messages OR pro tier)
  const hasMessageAccess = 
    userData?.subscriptionTier === 'messages' || 
    userData?.subscriptionTier === 'pro' ||
    userData?.isPro === true;
  
  return {
    hasMessageAccess,
    isProUser: userData?.subscriptionTier === 'pro' || userData?.isPro === true,
    isMessagesUser: userData?.subscriptionTier === 'messages',
  };
};