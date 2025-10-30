import React from 'react';
import { Chip, Tooltip } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';

interface VerifiedBadgeProps {
  isVerified?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ 
  isVerified = false, 
  size = 'sm',
  showText = false 
}) => {
  const { t } = useTranslation();

  if (!isVerified) return null;

  if (showText) {
    return (
      <Chip
        startContent={<Icon icon="lucide:shield-check" />}
        color="success"
        variant="flat"
        size={size}
      >
        {t('verification.verified')}
      </Chip>
    );
  }

  return (
    <Tooltip content={t('verification.verified')}>
      <div className="inline-flex">
        <Icon 
          icon="lucide:shield-check" 
          className={`text-green-500 ${
            size === 'lg' ? 'text-2xl' : 
            size === 'md' ? 'text-xl' : 
            'text-base'
          }`}
        />
      </div>
    </Tooltip>
  );
};