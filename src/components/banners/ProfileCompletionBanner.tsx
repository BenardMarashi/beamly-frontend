import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export const ProfileCompletionBanner: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if banner should be shown
    if (user && userData) {
      // Show banner if profile is not completed
      const shouldShow = !userData.profileCompleted && 
                        (!userData.bio || 
                         !userData.displayName || 
                         (userData.userType === 'freelancer' && (!userData.skills || userData.skills.length === 0)) ||
                         (userData.userType === 'freelancer' && (!userData.hourlyRate || userData.hourlyRate <= 0)));
      
      if (shouldShow && !isDismissed) {
        // Check if previously dismissed in this session
        const sessionDismissed = sessionStorage.getItem('profileBannerDismissed');
        if (!sessionDismissed) {
          // Delay showing banner for better UX
          const timer = setTimeout(() => {
            setIsVisible(true);
          }, 2000);
          return () => clearTimeout(timer);
        }
      } else {
        setIsVisible(false);
      }
    }
  }, [user, userData, isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    // Store dismissal for this session only
    sessionStorage.setItem('profileBannerDismissed', 'true');
  };

  const handleCompleteProfile = () => {
    navigate('/profile/edit');
  };

  const calculateCompletion = (): number => {
    if (!userData) return 0;
    
    let completed = 0;
    let total = 4;
    
    if (userData.displayName?.trim()) completed++;
    if (userData.bio?.trim()) completed++;
    
    if (userData.userType === 'freelancer' || userData.userType === 'both') {
      if (userData.skills && userData.skills.length > 0) completed++;
      if (userData.hourlyRate && userData.hourlyRate > 0) completed++;
    } else {
      // For clients, adjust the total
      total = 2;
    }
    
    return Math.round((completed / total) * 100);
  };

  const completionPercentage = calculateCompletion();

  // Don't render if user is not logged in or profile is complete
  if (!user || !userData || userData.profileCompleted) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 100, 
            damping: 15 
          }}
          className="fixed top-20 left-0 right-0 z-50 px-4 pointer-events-none"
        >
          <div className="max-w-5xl mx-auto pointer-events-auto">
            <div className="bg-gradient-to-r from-[#FCE90D]/10 via-[#0F43EE]/10 to-blue-600/10 backdrop-blur-xl rounded-xl border border-[#FCE90D]/20 shadow-2xl overflow-hidden">
              {/* Progress bar at top */}
              <div className="h-1 bg-white/10">
                <motion.div 
                  className="h-full bg-gradient-to-r from-[#FCE90D] to-[#0F43EE]"
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              
              <div className="p-4 md:p-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Left content */}
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-0.5">
                      <Icon 
                        icon="lucide:user-check" 
                        className="text-2xl md:text-3xl text-[#FCE90D]" 
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-base md:text-lg mb-1">
                        {t('profileBanner.title', { percentage: completionPercentage })}
                      </h3>
                      <p className="text-gray-300 text-sm md:text-base">
                        {t('profileBanner.description')}
                      </p>
                      {/* Mobile missing items */}
                      <div className="mt-2 md:hidden">
                        <p className="text-xs text-gray-400">
                          {t('profileBanner.missingItems')}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Desktop missing items indicator */}
                  <div className="hidden md:block text-sm text-gray-400 px-4">
                    {t('profileBanner.missingItems')}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-9 md:ml-0">
                    <Button
                      size="sm"
                      color="warning"
                      variant="flat"
                      onPress={handleCompleteProfile}
                      className="font-semibold bg-[#FCE90D]/20 text-[#FCE90D] hover:bg-[#FCE90D]/30"
                      startContent={<Icon icon="lucide:edit-3" className="text-lg" />}
                    >
                      {t('profileBanner.completeNow')}
                    </Button>
                    <Button
                      size="sm"
                      variant="light"
                      isIconOnly
                      onPress={handleDismiss}
                      className="text-gray-400 hover:text-white min-w-unit-8"
                      aria-label={t('profileBanner.dismiss')}
                    >
                      <Icon icon="lucide:x" className="text-xl" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProfileCompletionBanner;