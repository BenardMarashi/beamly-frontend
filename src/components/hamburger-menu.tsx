import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Avatar } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
// i18next removed to fix warnings
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
  // i18next translation removed
  const { isDarkMode } = useTheme();
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  
  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };
  
  // Determine user type for different navigation
  const userType = (userData as any)?.accountType || 'freelancer'; // Default to freelancer
  const isFreelancer = userType === 'freelancer';
  const isClient = userType === 'client';
  
  const menuItems = [
    { name: "Home", path: "/", icon: "lucide:home" },
    { name: "Browse Freelancers", path: "/browse-freelancers", icon: "lucide:users" },
    { name: "Looking for Work", path: "/looking-for-work", icon: "lucide:briefcase" },
    { name: "How it Works", path: "/how-it-works", icon: "lucide:help-circle" }
  ];
  
  const menuVariants = {
    closed: {
      x: "100%",
      transition: {
        type: "spring" as const,
        damping: 20,
        stiffness: 250,
      },
    },
    open: {
      x: 0,
      transition: {
        type: "spring" as const,
        damping: 20,
        stiffness: 100,
      },
    },
  };

  const profilePicture = userData?.photoURL || user?.photoURL || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.displayName || user?.displayName || 'User')}&background=0F43EE&color=fff`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={onClose}
            role="presentation"
            aria-hidden="true"
          />
          
          <motion.div
            className={`fixed inset-y-0 right-0 w-full sm:w-80 z-50 ${isDarkMode ? 'glass-effect' : 'bg-white'} ${isDarkMode ? 'border-l border-white/10' : 'border-l border-gray-200'}`}
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
              {/* Main Navigation */}
              <div className="space-y-3">
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
                <p className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
                  Preferences
                </p>
                
                <div className="flex justify-center items-center gap-6 mt-6">
                  <LanguageToggle />
                  <ThemeToggle />
                </div>
              </div>
              
              {/* Social Links */}
              <div className="flex justify-center gap-4 mt-8">
                {["lucide:facebook", "lucide:twitter", "lucide:instagram", "lucide:linkedin"].map((social, index) => (
                  <Button
                    key={index}
                    isIconOnly
                    variant="light"
                    className={`${isDarkMode ? 'text-white bg-white/10' : 'text-gray-800 bg-gray-100'} rounded-full w-12 h-12 min-w-0`}
                    aria-label={`Social link ${index + 1}`}
                  >
                    <Icon icon={social} width={24} />
                  </Button>
                ))}
              </div>
              
              {/* Logout Button for logged in users */}
              {isLoggedIn && (
                <div className={`pt-6 mt-4 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                  <Button
                    color="default"
                    variant="flat"
                    className={`w-full ${isDarkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-800'} py-6 text-lg`}
                    startContent={<Icon icon="lucide:log-out" width={24} height={24} />}
                    onPress={() => {
                      onLogout();
                      onClose();
                    }}
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

HamburgerMenu.displayName = "HamburgerMenu";

export { HamburgerMenu };