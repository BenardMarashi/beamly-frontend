import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, CardBody } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMessageAccess } from '../../hooks/use-message-access';

interface UpgradeToProBannerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpgradeToProBanner: React.FC<UpgradeToProBannerProps> = ({
  isOpen,
  onClose
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isMessagesUser, isProUser } = useMessageAccess();

  const handleUpgrade = (plan: 'messages' | 'pro') => {
    onClose();
    navigate(`/billing?plan=${plan}`);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999]"
            onClick={onClose}
          />
          
          {/* Centered Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center z-[10000] p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 25 
              }}
              className="w-full max-w-2xl max-h-[90vh] overflow-hidden"
            >
              <div className="bg-gradient-to-br from-[#FCE90D]/20 via-[#0F43EE]/20 to-blue-600/20 backdrop-blur-xl rounded-2xl border border-[#FCE90D]/30 shadow-2xl overflow-hidden">
                {/* Top accent bar */}
                <div className="h-1.5 bg-gradient-to-r from-[#FCE90D] to-[#0F43EE]" />
                
                <div className="p-5 md:p-6">
                  {/* Header */}
                  <div className="text-center mb-5">
                    <div className="inline-flex p-3 rounded-full bg-[#FCE90D]/20 mb-3">
                      <Icon 
                        icon="lucide:lock" 
                        className="text-3xl text-[#FCE90D]" 
                      />
                    </div>
                    <h3 className="text-white font-bold text-xl mb-2">
                      {t('upgradeProBanner.title')}
                    </h3>
                    <p className="text-gray-300 text-sm">
                      {t('upgradeProBanner.description')}
                    </p>
                  </div>

                  {/* Horizontal Scrolling Plans */}
                  <div className="relative mb-5">
                    <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory upgrade-banner-scroll-container">
                      {/* Messages Plan 
                      <div className="flex-shrink-0 w-[280px] md:w-[calc(50%-0.5rem)] snap-center">
                        <Card className="bg-white/5 border border-[#0F43EE]/30 h-full">
                          <CardBody className="p-4">
                            <div className="text-center mb-3">
                              <Icon 
                                icon="lucide:message-circle" 
                                className="text-2xl text-[#0F43EE] mb-2 mx-auto" 
                              />
                              <h4 className="text-white font-bold text-lg mb-1">
                                {t('upgradeProBanner.messagesTitle')}
                              </h4>
                              <div className="text-[#FCE90D] font-bold text-2xl mb-3">
                                {t('upgradeProBanner.messagesPrice')}
                              </div>
                            </div>
                            
                            <div className="space-y-2 mb-4">
                              <div className="flex items-center gap-2 text-sm">
                                <Icon icon="lucide:check" className="text-green-400 flex-shrink-0" />
                                <span className="text-gray-300">
                                  {t('upgradeProBanner.messagesBenefit1')}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Icon icon="lucide:check" className="text-green-400 flex-shrink-0" />
                                <span className="text-gray-300">
                                  {t('upgradeProBanner.messagesBenefit2')}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Icon icon="lucide:check" className="text-green-400 flex-shrink-0" />
                                <span className="text-gray-300">
                                  {t('upgradeProBanner.messagesBenefit3')}
                                </span>
                              </div>
                            </div>

                            <Button
                              size="md"
                              className="w-full bg-[#0F43EE] text-white font-semibold"
                              onPress={() => handleUpgrade('messages')}
                              isDisabled={isMessagesUser || isProUser}
                            >
                              {isMessagesUser ? t('upgradeProBanner.currentPlan') : t('upgradeProBanner.getMessages')}
                            </Button>
                          </CardBody>
                        </Card>
                      </div>*/}

                      {/* Pro Plan */}
                      <div className="flex-shrink-0 w-[280px] md:w-[calc(50%-0.5rem)] snap-center">
                        <Card className="bg-white/5 border border-[#FCE90D]/50 h-full">
                          <CardBody className="p-4">
                            <div className="text-center mb-3">
                              <Icon 
                                icon="lucide:crown" 
                                className="text-2xl text-[#FCE90D] mb-2 mx-auto" 
                              />
                              <h4 className="text-white font-bold text-lg mb-1">
                                {t('upgradeProBanner.proTitle')}
                              </h4>
                              <div className="text-[#FCE90D] font-bold text-2xl mb-3">
                                {t('upgradeProBanner.proPrice')}
                              </div>
                            </div>
                            
                            <div className="space-y-2 mb-4">
                              <div className="flex items-center gap-2 text-sm">
                                <Icon icon="lucide:check" className="text-green-400 flex-shrink-0" />
                                <span className="text-gray-300">
                                  {t('upgradeProBanner.proBenefit1')}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Icon icon="lucide:check" className="text-green-400 flex-shrink-0" />
                                <span className="text-gray-300">
                                  {t('upgradeProBanner.proBenefit2')}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Icon icon="lucide:check" className="text-green-400 flex-shrink-0" />
                                <span className="text-gray-300">
                                  {t('upgradeProBanner.proBenefit3')}
                                </span>
                              </div>
                            </div>

                            <Button
                              size="md"
                              className="w-full bg-[#FCE90D] text-black font-bold"
                              onPress={() => handleUpgrade('pro')}
                              isDisabled={isProUser}
                            >
                              {isProUser ? t('upgradeProBanner.currentPlan') : t('upgradeProBanner.getPro')}
                            </Button>
                          </CardBody>
                        </Card>
                      </div>
                    </div>
                    
                    {/* Scroll indicator dots (mobile only) */}
                  </div>
                  
                  {/* Close Button */}
                  <div className="text-center">
                    <Button
                      size="sm"
                      variant="light"
                      onPress={onClose}
                      className="text-gray-400 hover:text-white"
                    >
                      {t('upgradeProBanner.laterButton')}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};