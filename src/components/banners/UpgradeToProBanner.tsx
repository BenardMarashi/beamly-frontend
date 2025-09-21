import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

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

  const handleUpgrade = () => {
    onClose();
    navigate('/billing?tab=subscription');
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
              className="w-full max-w-md"
            >
              <div className="bg-gradient-to-br from-[#FCE90D]/20 via-[#0F43EE]/20 to-blue-600/20 backdrop-blur-xl rounded-2xl border border-[#FCE90D]/30 shadow-2xl overflow-hidden">
                {/* Top accent bar */}
                <div className="h-1.5 bg-gradient-to-r from-[#FCE90D] to-[#0F43EE]" />
                
                <div className="p-5 md:p-6">
                  {/* Icon and Title */}
                  <div className="text-center mb-4">
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

                  {/* Simple Benefits */}
                  <div className="bg-white/5 rounded-lg p-4 mb-5 space-y-2">
                    <div className="flex items-center gap-2">
                      <Icon icon="lucide:check" className="text-[#FCE90D]" />
                      <span className="text-gray-300 text-sm">
                        {t('upgradeProBanner.benefit1')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon icon="lucide:check" className="text-[#FCE90D]" />
                      <span className="text-gray-300 text-sm">
                        {t('upgradeProBanner.benefit2')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-xs">
                      <Icon icon="lucide:info-circle" className="ml-0.5" />
                      <span>{t('upgradeProBanner.priceNote')}</span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      size="md"
                      className="flex-1 bg-[#FCE90D] text-black font-bold hover:bg-[#FCE90D]/90"
                      onPress={handleUpgrade}
                      startContent={<Icon icon="lucide:crown" />}
                    >
                      {t('upgradeProBanner.upgradeButton')}
                    </Button>
                    <Button
                      size="md"
                      variant="light"
                      onPress={onClose}
                      className="flex-1 text-gray-400 hover:text-white"
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