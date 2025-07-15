import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Avatar } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../contexts/theme-context";
import { useAuth } from "../contexts/AuthContext";
import { LanguageToggle } from "./language-toggle";
import { ThemeToggle } from "./theme-toggle";
import { BeamlyLogo } from "./beamly-logo";

interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  onLogout: () => void;
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
  
  // Smooth animation with consistent timing
  const menuVariants = {
    closed: {
      x: "100%",
      transition: {
        type: "tween",
        duration: 0.3,
        ease: "easeInOut"
      }
    },
    open: {
      x: 0,
      transition: {
        type: "tween",
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  };

  const overlayVariants = {
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
            className={`fixed inset-y-0 right-0 w-full sm:w-80 z-[9999] ${isDarkMode ? 'glass-effect' : 'bg-white'} ${isDarkMode ? 'border-l border-white/10' : 'border-l border-gray-200'} overflow-y-auto`}
            variants={menuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className={`p-4 flex justify-between items-center border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
              <BeamlyLogo />
              <Button
                isIconOnly
                variant="light"
                onPress={onClose}
                className={isDarkMode ? "text-white hover:bg-white/10" : "text-gray-800 hover:bg-gray-100"}
                aria-label="Close menu"
              >
                <Icon icon="lucide:x" width={24} />
              </Button>
            </div>
            
            {/* Navigation Menu */}
            <div className="p-4 space-y-3">
              {/* User Profile Section (when logged in) */}
              {isLoggedIn && (
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'}`}>
                  <div className="flex items-center gap-3" onClick={() => handleNavigation("/profile/edit")}>
                    <Avatar
                      src={profilePicture}
                      alt={userData?.displayName || user?.displayName || "User"}
                      size="md"
                      className="cursor-pointer"
                    />
                    <div className="flex-1 cursor-pointer">
                      <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {userData?.displayName || user?.displayName || "User"}
                      </p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Signed in as: {user?.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Main Navigation */}
              <div className="space-y-3">
                {/* Show different menu items based on auth status */}
                {isLoggedIn ? (
                  <>
                    <Button
                      variant="light"
                      className={`w-full justify-start ${isDarkMode ? 'text-white hover:bg-white/10' : 'text-gray-800 hover:bg-gray-100'} py-6 text-lg`}
                      startContent={<Icon icon="lucide:home" width={24} height={24} />}
                      onPress={() => handleNavigation("/dashboard")}
                    >
                      Dashboard
                    </Button>
                    <Button
                      variant="light"
                      className={`w-full justify-start ${isDarkMode ? 'text-white hover:bg-white/10' : 'text-gray-800 hover:bg-gray-100'} py-6 text-lg`}
                      startContent={<Icon icon="lucide:bell" width={24} height={24} />}
                      onPress={() => handleNavigation("/notifications")}
                    >
                      Notifications
                    </Button>
                    <Button
                      variant="light"
                      className={`w-full justify-start ${isDarkMode ? 'text-white hover:bg-white/10' : 'text-gray-800 hover:bg-gray-100'} py-6 text-lg`}
                      startContent={<Icon icon="lucide:message-circle" width={24} height={24} />}
                      onPress={() => handleNavigation("/chat")}
                    >
                      Messages
                    </Button>
                    <Button
                      variant="light"
                      className={`w-full justify-start ${isDarkMode ? 'text-white hover:bg-white/10' : 'text-gray-800 hover:bg-gray-100'} py-6 text-lg`}
                      startContent={<Icon icon="lucide:settings" width={24} height={24} />}
                      onPress={() => handleNavigation("/settings")}
                    >
                      Settings
                    </Button>
                    <Button
                      variant="light"
                      className={`w-full justify-start ${isDarkMode ? 'text-white hover:bg-white/10' : 'text-gray-800 hover:bg-gray-100'} py-6 text-lg`}
                      startContent={<Icon icon="lucide:briefcase" width={24} height={24} />}
                      onPress={() => handleNavigation("/looking-for-work")}
                    >
                      Looking for Work
                    </Button>
                    <Button
                      variant="light"
                      className={`w-full justify-start ${isDarkMode ? 'text-white hover:bg-white/10' : 'text-gray-800 hover:bg-gray-100'} py-6 text-lg`}
                      startContent={<Icon icon="lucide:users" width={24} height={24} />}
                      onPress={() => handleNavigation("/browse-freelancers")}
                    >
                      Browse Freelancers
                    </Button>
                  </>
                ) : (
                  <>
                    {menuItems.map((item) => (
                      <Button
                        key={item.path}
                        variant="light"
                        className={`w-full justify-start ${isDarkMode ? 'text-white hover:bg-white/10' : 'text-gray-800 hover:bg-gray-100'} py-6 text-lg`}
                        startContent={<Icon icon={item.icon} width={24} height={24} />}
                        onPress={() => handleNavigation(item.path)}
                      >
                        {item.name}
                      </Button>
                    ))}
                  </>
                )}
              </div>
              
              {/* Auth Buttons */}
              {!isLoggedIn && (
                <div className={`space-y-3 pt-6 mt-4 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                  <Button
                    color="default"
                    variant="flat"
                    className={`w-full ${isDarkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-800'} py-6 text-lg`}
                    onPress={() => handleNavigation("/login")}
                  >
                    Login
                  </Button>
                  <Button
                    color="secondary"
                    className="w-full text-beamly-third font-medium py-6 text-lg"
                    onPress={() => handleNavigation("/signup")}
                  >
                    Sign Up
                  </Button>
                </div>
              )}
              
              {/* Preferences Section */}
              <div className={`space-y-4 pt-6 mt-8 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                <p className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                  Preferences
                </p>
                
                {/* Language Toggle */}
                <div className="flex justify-center">
                  <LanguageToggle />
                </div>
                
                {/* Theme Toggle */}
                <div className="flex justify-center items-center gap-2">
                  <Icon icon="lucide:sun" className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  <ThemeToggle />
                  <Icon icon="lucide:moon" className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                </div>
              </div>
              
              {/* Social Links */}
              <div className={`flex justify-center gap-4 pt-6 mt-6 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                <Button
                  isIconOnly
                  variant="light"
                  className={isDarkMode ? "text-white hover:bg-white/10" : "text-gray-800 hover:bg-gray-100"}
                  onPress={() => window.open('https://facebook.com', '_blank')}
                  aria-label="Facebook"
                >
                  <Icon icon="lucide:facebook" width={20} />
                </Button>
                <Button
                  isIconOnly
                  variant="light"
                  className={isDarkMode ? "text-white hover:bg-white/10" : "text-gray-800 hover:bg-gray-100"}
                  onPress={() => window.open('https://twitter.com', '_blank')}
                  aria-label="Twitter"
                >
                  <Icon icon="lucide:twitter" width={20} />
                </Button>
                <Button
                  isIconOnly
                  variant="light"
                  className={isDarkMode ? "text-white hover:bg-white/10" : "text-gray-800 hover:bg-gray-100"}
                  onPress={() => window.open('https://instagram.com', '_blank')}
                  aria-label="Instagram"
                >
                  <Icon icon="lucide:instagram" width={20} />
                </Button>
                <Button
                  isIconOnly
                  variant="light"
                  className={isDarkMode ? "text-white hover:bg-white/10" : "text-gray-800 hover:bg-gray-100"}
                  onPress={() => window.open('https://linkedin.com', '_blank')}
                  aria-label="LinkedIn"
                >
                  <Icon icon="lucide:linkedin" width={20} />
                </Button>
              </div>
              
              {/* Logout Button for Logged In Users */}
              {isLoggedIn && (
                <div className="pt-6 mt-6">
                  <Button
                    color="danger"
                    variant="flat"
                    className="w-full py-6 text-lg"
                    onPress={onLogout}
                    startContent={<Icon icon="lucide:log-out" width={24} />}
                  >
                    Logout
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

HamburgerMenu.displayName = 'HamburgerMenu';

export { HamburgerMenu };