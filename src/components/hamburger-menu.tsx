import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Button, Avatar } from '@nextui-org/react';
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
  
  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('menu-open');
    } else {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('menu-open');
    }
    
    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('menu-open');
    };
  }, [isOpen]);

  // Handle click outside to close menu
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
    navigate(path);
    onClose();
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
      // Non-authenticated menu items
      return [
        { name: "Home", path: "/", icon: "lucide:home" },
        { name: "Browse Freelancers", path: "/browse-freelancers", icon: "lucide:users" },
        { name: "Looking for Work", path: "/looking-for-work", icon: "lucide:briefcase" },
        { name: "How it Works", path: "/how-it-works", icon: "lucide:help-circle" }
      ];
    }

    // Authenticated menu items - show all items on all pages
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

    // Add user type specific items
    if (isFreelancer) {
      menuItems.push(
        { name: "Post Project", path: "/post-project", icon: "lucide:folder-plus" },
        { name: "My Projects", path: "/projects/manage", icon: "lucide:folder" }
      );
    }

    if (isClient) {
      menuItems.push(
        { name: "Post Job", path: "/post-job", icon: "lucide:plus-circle" },
        { name: "My Jobs", path: "/jobs/manage", icon: "lucide:briefcase" }
      );
    }

    return menuItems;
  };

  const menuItems = getMenuItems();
  
  // Animation variants
  const menuVariants: Variants = {
    closed: {
      x: "100%",
      transition: {
        type: "tween" as const,
        duration: 0.3,
        ease: "easeInOut"
      }
    },
    open: {
      x: 0,
      transition: {
        type: "tween" as const,
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  };

  const overlayVariants: Variants = {
    closed: { 
      opacity: 0,
      transition: { duration: 0.2 }
    },
    open: { 
      opacity: 0.5,
      transition: { duration: 0.2 }
    }
  };

  const profilePicture = userData?.photoURL || user?.photoURL || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.displayName || user?.displayName || 'User')}&background=0F43EE&color=fff`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed inset-0 bg-black z-[9998] hamburger-overlay"
            onClick={onClose}
            role="presentation"
            aria-hidden="true"
          />
          
          {/* Menu */}
          <motion.div
            className={`fixed inset-y-0 right-0 w-full sm:w-80 z-[9999] hamburger-menu-panel ${isDarkMode ? 'glass-effect' : 'bg-white'} ${isDarkMode ? 'text-white' : 'text-gray-900'} shadow-xl`}
            variants={menuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold">Menu</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close menu"
              >
                <Icon icon="lucide:x" className="w-6 h-6" />
              </button>
            </div>
            
            {/* User Profile Section - Only show when logged in */}
            {isLoggedIn && user && (
              <div 
                className="p-6 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                onClick={() => handleNavigation('/edit-profile')}
              >
                <div className="flex items-center gap-4">
                  <Avatar
                    src={profilePicture}
                    name={userData?.displayName || 'User'}
                    size="lg"
                  />
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
            </nav>
            
            {/* Bottom Actions */}
            {isLoggedIn ? (
              <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  color="danger"
                  variant="flat"
                  className="w-full"
                  onClick={handleLogout}
                  startContent={<Icon icon="lucide:log-out" />}
                >
                  Sign Out
                </Button>
              </div>
            ) : (
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