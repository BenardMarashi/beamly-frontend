import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useTheme } from '../contexts/theme-context';
import { useAuth } from '../contexts/AuthContext';
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
      toast.success('Signed out successfully');
      if (onLogout) onLogout();
      onClose();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };
  
  const userType = userData?.userType || 'freelancer';
  const isFreelancer = userType === 'freelancer' || userType === 'both';
  const isClient = userType === 'client' || userType === 'both';
  
  // Menu items based on authentication state
  const getMenuItems = () => {
    if (!isLoggedIn || !user) {
      return [
        { name: "Home", path: "/", icon: "lucide:home" },
        { name: "Browse Freelancers", path: "/browse-freelancers", icon: "lucide:users" },
        { name: "Looking for Work", path: "/looking-for-work", icon: "lucide:briefcase" },
        { name: "How it Works", path: "/how-it-works", icon: "lucide:help-circle" }
      ];
    }

    const menuItems = [
      { name: "Home", path: "/", icon: "lucide:home" },
      { name: "Browse Freelancers", path: "/browse-freelancers", icon: "lucide:users" },
      { name: "Looking for Work", path: "/looking-for-work", icon: "lucide:briefcase" },
      { name: "How it Works", path: "/how-it-works", icon: "lucide:help-circle" },
      { name: "Dashboard", path: "/dashboard", icon: "lucide:layout-dashboard" },
      { name: "Find Work", path: "/browse-jobs", icon: "lucide:search" },
      { name: "Messages", path: "/messages", icon: "lucide:message-circle" },
      { name: "Settings", path: "/settings", icon: "lucide:settings" }
    ];

    if (isFreelancer) {
      menuItems.push(
        { name: "Post Project", path: "/post-project", icon: "lucide:folder-plus" },
        { name: "My Projects", path: "/projects/manage", icon: "lucide:folder" }
      );
    }

    if (isClient) {
      menuItems.push(
        { name: "Post Job", path: "/post-job", icon: "lucide:plus-circle" },
        { name: "My Jobs", path: "/job/manage", icon: "lucide:briefcase" }
      );
    }

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
              <h2 className="text-xl font-semibold">Menu</h2>
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
                    <h3 className="font-semibold">{userData?.displayName || 'User'}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {userType}
                    </p>
                  </div>
                  <Icon icon="lucide:chevron-right" className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            )}
            
            {/* Navigation Items */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
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
                      Sign Out
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
                  onClick={() => handleNavigation('/login')}
                >
                  Sign In
                </Button>
                <Button
                  variant="bordered"
                  className="w-full"
                  onClick={() => handleNavigation('/signup')}
                >
                  Sign Up
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