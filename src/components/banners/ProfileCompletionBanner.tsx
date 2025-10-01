import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Modal, ModalContent, ModalBody, Progress, Chip } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export const ProfileCompletionBanner: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userData } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [forceModal, setForceModal] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Don't show on edit-profile page
    if (location.pathname === '/edit-profile' || location.pathname === '/profile/edit') {
      setIsVisible(false);
      setForceModal(false);
      return;
    }

    // Check if banner should be shown
    if (user && userData) {
      // Show banner if profile is not completed
      const shouldShow = !userData.profileCompleted && 
                        (!userData.bio || 
                         !userData.displayName || 
                         (userData.userType === 'freelancer' && (!userData.skills || userData.skills.length === 0)) ||
                         (userData.userType === 'freelancer' && (!userData.hourlyRate || userData.hourlyRate <= 0)));
      
      if (shouldShow) {
        // Check if user is trying to access protected routes
        const protectedRoutes = [
          '/post-job',
          '/post-project',
          '/messages',
          '/proposals',
          '/payments',
          '/job/',
          '/freelancer/',
          '/client/',
          '/dashboard',
          '/browse-freelancers',
          '/browse-jobs',
          '/home'
        ];

        const isProtectedRoute = protectedRoutes.some(route => 
          location.pathname.startsWith(route)
        );

        // Force modal on desktop for protected routes
        if (isProtectedRoute) {
  setForceModal(true);
  setIsVisible(true);
} else if (!isDismissed) {
  // Show regular banner only on non-protected routes
  const sessionDismissed = sessionStorage.getItem('profileBannerDismissed');
  if (!sessionDismissed) {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);
    return () => clearTimeout(timer);
  }
}
      } else {
        setIsVisible(false);
        setForceModal(false);
      }
    }
  }, [user, userData, isDismissed, location.pathname, isMobile]);

  const handleDismiss = () => {
    if (!forceModal) {
      setIsDismissed(true);
      setIsVisible(false);
      sessionStorage.setItem('profileBannerDismissed', 'true');
    }
  };

  const handleCompleteProfile = () => {
    navigate('/edit-profile', { state: { from: location.pathname } });
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
      total = 2;
    }
    
    return Math.round((completed / total) * 100);
  };

  const getMissingFields = () => {
    if (!userData) return [];
    
    const missing = [];
    if (!userData.displayName?.trim()) missing.push(t('profileBanner.missingDisplayName'));
    if (!userData.bio?.trim()) missing.push(t('profileBanner.missingBio'));
    
    if (userData.userType === 'freelancer' || userData.userType === 'both') {
      if (!userData.skills || userData.skills.length === 0) missing.push(t('profileBanner.missingSkills'));
      if (!userData.hourlyRate || userData.hourlyRate <= 0) missing.push(t('profileBanner.missingHourlyRate'));
    }
    
    return missing;
  };

  const completionPercentage = calculateCompletion();
  const missingFields = getMissingFields();

  // Don't render if user is not logged in or profile is complete
  if (!user || !userData || userData.profileCompleted) {
    return null;
  }

  // Desktop Modal Version (Blocking)
  // Mobile Modal Version (Blocking) - Same as Desktop
if (isMobile && forceModal && isVisible) {
  return (
    <Modal
      isOpen={isVisible}
      onClose={() => {}} // Non-dismissible
      hideCloseButton
      isDismissable={false}
      isKeyboardDismissDisabled={true}
      backdrop="blur"
      size="full" // ← Full screen on mobile
      classNames={{
        backdrop: "bg-black/80 z-[9998]",
        wrapper: "z-[9999] p-0",
        base: "bg-[#011241]/95 backdrop-blur-xl border-0 m-0 sm:m-0",
        body: "p-0"
      }}
    >
      <ModalContent>
        <ModalBody className="p-0 h-screen overflow-y-auto">
          {/* Compact Header - no gradient, consistent background */}
          <div className="bg-white/10 backdrop-blur-md border-b border-white/10 p-4 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="bg-[#FCE90D]/20 backdrop-blur-md p-2 rounded-full">
                  <Icon icon="lucide:user" className="text-[#FCE90D] text-xl" />
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-bold text-white">
                    {t('profileBanner.modalTitle')}
                  </h2>
                  <p className="text-gray-300 text-xs">
                    {t('profileBanner.modalSubtitle')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#FCE90D]">{completionPercentage}%</div>
                <p className="text-gray-400 text-xs font-medium">{t('common.complete')}</p>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="px-4 py-3">
            <Progress 
              value={completionPercentage} 
              color="warning"
              className="mb-2"
              size="md"
              classNames={{
                base: "bg-white/10",
                indicator: "bg-[#FCE90D]"
              }}
            />
            <p className="text-gray-300 text-xs text-center">
              {completionPercentage === 100 
                ? t('profileBanner.allComplete')
                : t('profileBanner.almostThere', { percentage: 100 - completionPercentage })}
            </p>
          </div>

          {/* Content section */}
          <div className="px-4 pb-6">
            {/* Important Notice */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <Icon icon="lucide:info" className="text-amber-400 text-lg mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1 text-sm">
                    {t('profileBanner.importantNotice')}
                  </h3>
                  <p className="text-gray-300 text-xs">
                    {t('profileBanner.profileNotVisible')}
                  </p>
                </div>
              </div>
            </div>

            {missingFields.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <Icon icon="lucide:alert-triangle" className="text-red-400 text-lg mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-2 text-sm">
                      {t('profileBanner.requiredFields')}
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      {missingFields.map((field, index) => (
                        <Chip
                          key={index}
                          size="sm"
                          variant="flat"
                          className="bg-red-500/20 text-red-300"
                          startContent={<Icon icon="lucide:x" className="text-xs" />}
                        >
                          <span className="text-xs">{field}</span>
                        </Chip>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Benefits of completing profile */}
            <div className="space-y-2 mb-6">
              <h4 className="text-white font-medium mb-2 text-sm">
                {t('profileBanner.whyComplete')}
              </h4>
              {[
                { icon: "lucide:eye", text: t('profileBanner.benefit1') },

                { icon: "lucide:shield-check", text: t('profileBanner.benefit3') },
                { icon: "lucide:zap", text: t('profileBanner.benefit4') }
              ].map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 text-gray-300">
                  <Icon icon={benefit.icon} className="text-[#FCE90D] text-base flex-shrink-0" />
                  <span className="text-xs">{benefit.text}</span>
                </div>
              ))}
            </div>

            {/* CTA Button - Fixed at bottom on mobile */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#011241]/95 backdrop-blur-md border-t border-white/10">
              <Button
                fullWidth
                color="warning"
                size="lg"
                onPress={handleCompleteProfile}
                startContent={<Icon icon="lucide:edit-3" className="text-xl" />}
                className="font-bold bg-[#FCE90D] text-[#011241]"
              >
                {t('profileBanner.completeNow')}
              </Button>
              
              {/* Warning text */}
              <p className="text-center text-gray-400 text-xs mt-2">
                {t('profileBanner.cannotContinue')}
              </p>
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

  // Original Banner Version (Mobile or Non-Blocking Desktop)
  return (
    <AnimatePresence>
      {isVisible && !forceModal && (
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
            <div className="bg-[#011241]/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden">
              {/* Compact header for banner version - no gradient */}
              <div className="bg-white/10 backdrop-blur-md p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <Icon icon="lucide:user" className="text-[#FCE90D] text-xl" />
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-sm">
                        {t('profileBanner.title', { percentage: completionPercentage })}
                      </h3>
                      <p className="text-gray-300 text-xs">
                        {t('profileBanner.description')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-2">
                      <span className="text-[#FCE90D] font-bold text-lg">{completionPercentage}%</span>
                    </div>
                    <Button
                      size="sm"
                      className="bg-[#FCE90D] text-[#011241] font-semibold hover:bg-[#FCE90D]/90"
                      onPress={handleCompleteProfile}
                    >
                      {t('profileBanner.completeNow')}
                    </Button>
                    {!forceModal && (
                      <Button
                        size="sm"
                        variant="light"
                        isIconOnly
                        onPress={handleDismiss}
                        className="text-gray-400 hover:text-white min-w-unit-8"
                        aria-label={t('profileBanner.dismiss')}
                      >
                        <Icon icon="lucide:x" className="text-lg" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Progress bar */}
              <Progress 
                value={completionPercentage} 
                color="warning"
                size="sm"
                className="rounded-none"
                classNames={{
                  base: "bg-white/10",
                  indicator: "bg-[#FCE90D]"
                }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProfileCompletionBanner;