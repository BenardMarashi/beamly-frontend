import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useTheme } from '../contexts/theme-context';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { toast } from 'react-hot-toast';

interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn?: boolean;
  onLogout?: () => void;
  isDashboard?: boolean;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = React.memo(({ 
  isOpen, 
  onClose, 
  isLoggedIn = false, 
  onLogout,
  isDashboard = false
}) => {
  const { isDarkMode } = useTheme();
  const { user, userData } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const previousLocation = useRef(location.pathname);
  
  // Close menu when location changes
  useEffect(() => {
    if (previousLocation.current !== location.pathname) {
      previousLocation.current = location.pathname;
      if (isOpen) {
        onClose();
      }
    }
  }, [location.pathname, isOpen, onClose]);

  // Handle body scroll and cleanup
  useEffect(() => {
    if (isOpen) {
      // Add classes and styles when opening
      document.body.style.overflow = 'hidden';
      document.body.classList.add('menu-open');
    } else {
      // IMPORTANT: Clean up everything when closing
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.classList.remove('menu-open');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.classList.remove('menu-open');
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);
  
  const handleNavigation = (path: string) => {
    onClose(); // Close menu first
    setTimeout(() => {
      navigate(path); // Then navigate
    }, 100); // Small delay to ensure animation completes
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success(t('menu.signedOutSuccess'));
      if (onLogout) onLogout();
      onClose();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error(t('menu.signOutFailed'));
    }
  };
  
  const userType = userData?.userType || 'freelancer';
  const isFreelancer = userType === 'freelancer' || userType === 'both';
  const isClient = userType === 'client' || userType === 'both';
  
  const getProposalsLink = () => {
    if (userData?.userType === 'freelancer') {
      return { path: '/freelancer/proposals', label: t('menu.myProposals') };
    } else if (userData?.userType === 'client') {
      return { path: '/client/proposals', label: t('menu.viewProposals') };
    } else if (userData?.userType === 'both') {
      // For users who are both, you might want to show both links
      // or have a toggle to switch between views
      return [
        { path: '/freelancer/proposals', label: t('menu.myProposalsFreelancer') },
        { path: '/client/proposals', label: t('menu.viewProposalsClient') }
      ];
    }
    return null;
  };
  
  // Menu items based on authentication state
  const getMenuItems = () => {
    if (!isLoggedIn || !user) {
      return [
        { name: t('nav.home'), path: "/", icon: "lucide:home" },
        { name: t('nav.browseFreelancers'), path: "/browse-freelancers", icon: "lucide:users" },
        { name: t('nav.lookingForWork'), path: "/looking-for-work", icon: "lucide:briefcase" },
        { name: t('nav.howItWorks'), path: "/how-it-works", icon: "lucide:help-circle" }
      ];
    }

    const menuItems = [
      { name: t('nav.home'), path: "/", icon: "lucide:home" },
      { name: t('nav.browseFreelancers'), path: "/browse-freelancers", icon: "lucide:users" },
      { name: t('nav.lookingForWork'), path: "/looking-for-work", icon: "lucide:briefcase" },
      { name: t('nav.dashboard'), path: "/dashboard", icon: "lucide:layout-dashboard" },
      { name: t('nav.messages'), path: "/messages", icon: "lucide:message-circle" }
    ];

    // Add user type specific items
    if (isFreelancer) {
      menuItems.push(
        { name: t('nav.postProject'), path: "/post-project", icon: "lucide:folder-plus" },
        { name: t('nav.portfolio'), path: "/portfolio", icon: "lucide:folder" },
        { name: t('menu.myProposals'), path: "/freelancer/proposals", icon: "lucide:file-text" },
        { name: t('nav.billing'), path: "/billing", icon: "lucide:credit-card" }
      );
    }

    if (isClient) {
      menuItems.push(
        { name: t('nav.postJob'), path: "/post-job", icon: "lucide:plus-circle" },
        { name: t('nav.myJobs'), path: "/job/manage", icon: "lucide:briefcase" },
        { name: t('menu.viewProposals'), path: "/client/proposals", icon: "lucide:file-text" }
      );
    }

    // Add common items for all logged-in users
    menuItems.push(
      { name: t('nav.analytics'), path: "/analytics", icon: "lucide:bar-chart" },
      { name: t('nav.notifications'), path: "/notifications", icon: "lucide:bell" },
      { name: t('nav.settings'), path: "/settings", icon: "lucide:settings" },
      { name: t('nav.howItWorks'), path: "/how-it-works", icon: "lucide:help-circle" }
    );

    return menuItems;
  };

  const menuItems = getMenuItems();

  // Don't render anything if not open
  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }} // Faster fade
            className="fixed inset-0 bg-black/50 backdrop-blur-sm cursor-pointer"
            style={{ zIndex: 9998 }} // Much higher z-index
            onClick={onClose}
            aria-hidden="true"
          />
                    
          {/* Menu Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ 
              type: 'tween', // Change from spring to tween
              duration: 0.2, // 200ms animation
              ease: 'easeOut'
            }}
            className="glass-effect shadow-xl"
            style={{ 
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              left: 'auto',
              width: '320px',
              maxWidth: '80vw',
              zIndex: 9999 // Much higher z-index
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold">{t('menu.title')}</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Icon icon="lucide:x" className="w-6 h-6" />
              </button>
            </div>
            
            {/* User Profile Section */}
            {isLoggedIn && user && (
              <div 
                className="p-6 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                onClick={() => handleNavigation('/edit-profile')}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold">{userData?.displayName || t('common.user')}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {userType === 'both' ? t('menu.freelancerAndClient') : t(`menu.${userType}`)}
                    </p>
                  </div>
                  <Icon icon="lucide:chevron-right" className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            )}
            
            {/* Navigation Items */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
              <nav className="p-6 space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                  >
                    <Icon icon={item.icon} className="w-5 h-5" />
                    <span>{item.name}</span>
                  </button>
                ))}
                
                {/* Sign Out */}
                {isLoggedIn && (
                  <>
                    <div className="my-4 pt-4 border-t border-gray-200 dark:border-gray-700" />
                    <Button
                      color="danger"
                      variant="flat"
                      className="w-full"
                      onPress={handleLogout}
                      startContent={<Icon icon="lucide:log-out" />}
                    >
                      {t('menu.signOut')}
                    </Button>
                  </>
                )}
              </nav>
            </div>
            
            {/* Sign In/Up buttons */}
            {!isLoggedIn && (
              <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
                <Button
                  color="primary"
                  className="w-full"
                  onPress={() => handleNavigation('/login')}
                >
                  {t('menu.signIn')}
                </Button>
                <Button
                  variant="bordered"
                  className="w-full"
                  onPress={() => handleNavigation('/signup')}
                >
                  {t('menu.signUp')}
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

HamburgerMenu.displayName = 'HamburgerMenu';

export { HamburgerMenu };