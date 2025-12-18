import React from 'react';
import { Icon } from '@iconify/react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Tooltip } from '@nextui-org/react';
import { useTranslation } from 'react-i18next';

export const FloatingActionButton: React.FC = () => {
  const { user, userData, isFreelancer, isClient } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Don't show if user is not logged in
  if (!user) return null;

  const handleClick = () => {
    // Freelancers go to post-project
    if (isFreelancer && !isClient) {
      navigate('/post-project');
    } 
    // Clients go to post-job
    else if (isClient && !isFreelancer) {
      navigate('/post-job');
    }
    // If user is both, prefer post-job (client action)
    else if (userData?.userType === 'both') {
      navigate('/post-job');
    }
  };

  // Determine tooltip text
  const getTooltipText = () => {
    if (isFreelancer && !isClient) {
      return t('nav.postProject') || 'Post Project';
    } else if (isClient) {
      return t('nav.postJob') || 'Post Job';
    }
    return 'Create';
  };

  return (
    <Tooltip content={getTooltipText()} placement="left">
      <button
        onClick={handleClick}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full shadow-lg flex items-center justify-center cursor-pointer z-50"
        style={{ backgroundColor: '#FCE90D' }}
      >
        <Icon 
          icon="lucide:plus" 
          className="text-black text-2xl" 
        />
      </button>
    </Tooltip>
  );
};