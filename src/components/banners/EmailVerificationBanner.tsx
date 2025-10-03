import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Modal, ModalContent, ModalBody } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useAuth } from '../../contexts/AuthContext';
import { sendEmailVerification, signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

export const EmailVerificationBanner: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
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
    if (user && !user.emailVerified) {
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

      if (isProtectedRoute) {
        setForceModal(true);
      }
    }
  }, [user, location.pathname]);

  if (!user || user.emailVerified) {
    return null;
  }

  const handleSendVerification = async () => {
    if (!user) return;
    
    setSending(true);
    try {
      await sendEmailVerification(user, {
        url: `${window.location.origin}/dashboard`,
        handleCodeInApp: false
      });
      toast.success(t('emailVerification.emailSent'), {
        duration: 6000
      });
    } catch (error: any) {
      console.error('Failed to send verification email:', error);
      if (error.code === 'auth/too-many-requests') {
        toast.error(t('emailVerification.tooManyRequests'));
      } else {
        toast.error(t('emailVerification.sendFailed'));
      }
    } finally {
      setSending(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!user) return;
    
    setChecking(true);
    try {
      await user.reload();
      
      if (user.emailVerified) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          await updateDoc(userDocRef, {
            emailVerified: true,
            isVerified: true
          });
        } catch (firestoreError) {
          console.error('Failed to update Firestore:', firestoreError);
        }
        
        toast.success(t('emailVerification.verifiedSuccess'), {
          duration: 2000
        });
        
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error(t('emailVerification.notVerifiedYet'), {
          duration: 6000
        });
      }
    } catch (error) {
      console.error('Failed to check verification:', error);
      toast.error(t('emailVerification.checkFailed'));
    } finally {
      setChecking(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success(t('auth.signedOutSuccess'));
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error(t('auth.signOutFailed'));
    }
  };

  const handleUpdateEmail = () => {
    toast(t('emailVerification.updateEmailMessage'), {
      duration: 5000,
      icon: 'ℹ️'
    });
    handleSignOut();
  };

  if (forceModal) {
    return (
      <Modal 
        isOpen={true}
        isDismissable={false}
        hideCloseButton
        size="full"
        backdrop="blur"
        classNames={{
          base: "bg-[#011241] m-0 sm:m-0",
          body: "p-0"
        }}
      >
        <ModalContent>
          <ModalBody className="p-0 h-screen overflow-y-auto">
            <div className="bg-white/10 backdrop-blur-md border-b border-white/10 p-4 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="bg-[#FCE90D]/20 backdrop-blur-md p-2 rounded-full">
                    <Icon icon="lucide:mail-warning" className="text-[#FCE90D] text-xl" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-base font-bold text-white">
                      {t('emailVerification.title')}
                    </h2>
                    <p className="text-gray-300 text-xs">
                      {t('emailVerification.subtitle')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-6">
              <div className="max-w-md w-full space-y-6">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-[#FCE90D]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon icon="lucide:mail" className="text-4xl text-[#FCE90D]" />
                    </div>
                    <p className="text-gray-300 text-sm mb-2">
                      {t('emailVerification.yourEmail')}
                    </p>
                    <p className="text-white font-semibold text-lg">
                      {user.email}
                    </p>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <Icon icon="lucide:info" className="text-blue-400 text-xl mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-semibold text-blue-300 mb-2">{t('emailVerification.howToVerify')}</p>
                        <ol className="text-blue-200 space-y-1 list-decimal list-inside">
                          <li>{t('emailVerification.step1')}</li>
                          <li>{t('emailVerification.step2')}</li>
                          <li>{t('emailVerification.step3')}</li>
                          <li>{t('emailVerification.step4')}</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button
                      size="lg"
                      className="w-full bg-[#FCE90D] text-[#011241] font-semibold hover:bg-[#FCE90D]/90"
                      onPress={handleSendVerification}
                      isLoading={sending}
                      startContent={!sending && <Icon icon="lucide:mail" className="text-xl" />}
                    >
                      {sending ? t('emailVerification.sending') : t('emailVerification.sendEmail')}
                    </Button>

                    <Button
                      size="lg"
                      variant="flat"
                      className="w-full bg-green-500/20 text-green-300 hover:bg-green-500/30"
                      onPress={handleCheckVerification}
                      isLoading={checking}
                      startContent={!checking && <Icon icon="lucide:check-circle" className="text-xl" />}
                    >
                      {checking ? t('emailVerification.checking') : t('emailVerification.iVerified')}
                    </Button>
                    <Button
                      size="lg"
                      variant="light"
                      className="w-full text-gray-400 hover:text-white"
                      onPress={handleSignOut}
                      startContent={<Icon icon="lucide:log-out" className="text-xl" />}
                    >
                      {t('auth.signOut')}
                    </Button>
                  </div>

                  <p className="text-xs text-center text-gray-400 mt-6">
                    {t('emailVerification.didntReceive')}
                  </p>
                </div>

                <p className="text-center text-gray-400 text-xs">
                  {t('emailVerification.cannotContinue')}
                </p>
              </div>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <AnimatePresence>
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
            <div className="bg-white/10 backdrop-blur-md p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <Icon icon="lucide:mail-warning" className="text-[#FCE90D] text-xl" />
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-sm">
                      {t('emailVerification.bannerTitle')}
                    </h3>
                    <p className="text-gray-300 text-xs">
                      {t('emailVerification.checkEmail', { email: user.email })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="bg-[#FCE90D] text-[#011241] font-semibold hover:bg-[#FCE90D]/90"
                    onPress={handleSendVerification}
                    isLoading={sending}
                  >
                    {sending ? t('emailVerification.sending') : t('emailVerification.sendEmailShort')}
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    className="bg-green-500/20 text-green-300 hover:bg-green-500/30"
                    onPress={handleCheckVerification}
                    isLoading={checking}
                  >
                    {checking ? t('emailVerification.checking') : t('emailVerification.verify')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EmailVerificationBanner;