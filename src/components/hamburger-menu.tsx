import React, { useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Button, Avatar } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/theme-context';
import { useAuth } from '../contexts/AuthContext';

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
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
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
  
  const userType = (userData as any)?.accountType || 'freelancer';
  const isFreelancer = userType === 'freelancer';
  const isClient = userType === 'client';
  
  const menuItems = [
    { name: "Home", path: "/", icon: "lucide:home" },
    { name: "Browse Freelancers", path: "/browse-freelancers", icon: "lucide:users" },
    { name: "Looking for Work", path: "/looking-for-work", icon: "lucide:briefcase" },
    { name: "How it Works", path: "/how-it-works", icon: "lucide:help-circle" }
  ];
  
  // FIXED: Properly typed animation variants
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
            className="fixed inset-0 bg-black z-[9998]"
            onClick={onClose}
            role="presentation"
            aria-hidden="true"
          />
          
          {/* Menu */}
          <motion.div
            className={`fixed inset-y-0 right-0 w-full sm:w-80 z-[9999] ${isDarkMode ? 'glass-effect' : 'bg-white'} ${isDarkMode ? 'text-white' : 'text-gray-800'} shadow-2xl`}
            variants={menuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div className="h-full flex flex-col p-6 overflow-y-auto">
              {/* Header */}
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold">Menu</h2>
                <Button
                  isIconOnly
                  variant="light"
                  onPress={onClose}
                  className="text-current"
                  aria-label="Close menu"
                >
                  <Icon icon="lucide:x" width={24} />
                </Button>
              </div>
              
              {/* User Profile Section (if logged in) */}
              {isLoggedIn && user && (
                <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center space-x-3">
                    <Avatar
                      src={profilePicture}
                      size="lg"
                      className="border-2 border-beamly-primary"
                    />
                    <div className="flex-1">
                      <p className="font-semibold">{userData?.displayName || user?.displayName || 'User'}</p>
                      <p className="text-sm opacity-70">
                        {userType === 'both' ? 'Freelancer & Client' : userType}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Navigation Links */}
              <nav className="flex-1">
                <ul className="space-y-2">
                  {menuItems.map((item) => (
                    <li key={item.path}>
                      <button
                        onClick={() => handleNavigation(item.path)}
                        className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                          isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                        }`}
                      >
                        <Icon icon={item.icon} width={20} />
                        <span>{item.name}</span>
                      </button>
                    </li>
                  ))}
                  
                  {/* Dashboard-specific items */}
                  {isDashboard && isLoggedIn && (
                    <>
                      <li className="border-t border-gray-200/20 pt-4 mt-4">
                        <button
                          onClick={() => handleNavigation('/dashboard')}
                          className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                            isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                          }`}
                        >
                          <Icon icon="lucide:layout-dashboard" width={20} />
                          <span>Dashboard</span>
                        </button>
                      </li>
                      
                      {isClient && (
                        <li>
                          <button
                            onClick={() => handleNavigation('/post-job')}
                            className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                              isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                            }`}
                          >
                            <Icon icon="lucide:plus-circle" width={20} />
                            <span>Post a Job</span>
                          </button>
                        </li>
                      )}
                      
                      {isFreelancer && (
                        <li>
                          <button
                            onClick={() => handleNavigation('/looking-for-work')}
                            className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                              isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                            }`}
                          >
                            <Icon icon="lucide:search" width={20} />
                            <span>Find Work</span>
                          </button>
                        </li>
                      )}
                      
                      <li>
                        <button
                          onClick={() => handleNavigation('/messages')}
                          className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                            isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                          }`}
                        >
                          <Icon icon="lucide:message-circle" width={20} />
                          <span>Messages</span>
                        </button>
                      </li>
                      
                      <li>
                        <button
                          onClick={() => handleNavigation('/settings')}
                          className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                            isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                          }`}
                        >
                          <Icon icon="lucide:settings" width={20} />
                          <span>Settings</span>
                        </button>
                      </li>
                    </>
                  )}
                </ul>
              </nav>
              
              {/* Bottom Actions */}
              <div className="mt-6 space-y-3">
                {isLoggedIn ? (
                  <Button
                    fullWidth
                    color="danger"
                    variant="flat"
                    onPress={onLogout}
                    startContent={<Icon icon="lucide:log-out" />}
                  >
                    Sign Out
                  </Button>
                ) : (
                  <>
                    <Button
                      fullWidth
                      color="primary"
                      onPress={() => handleNavigation('/login')}
                    >
                      Sign In
                    </Button>
                    <Button
                      fullWidth
                      variant="bordered"
                      onPress={() => handleNavigation('/signup')}
                    >
                      Sign Up
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

HamburgerMenu.displayName = 'HamburgerMenu';

export { HamburgerMenu };