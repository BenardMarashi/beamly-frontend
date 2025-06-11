import React from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Button, Link, Avatar } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/theme-context";
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

// Add memo to optimize rerenders
const HamburgerMenu: React.FC<HamburgerMenuProps> = React.memo(({ 
  isOpen, 
  onClose, 
  isLoggedIn = false, 
  onLogout,
  isDashboard = false
}) => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate(); // Add the missing navigate hook
  
  // Fix navigation function to properly use navigate and close menu
  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };
  
  // Simplify menu items to ensure consistent routing
  const menuItems = isLoggedIn ? [
    { name: t('navigation.home'), path: "/home", icon: "lucide:home" },
    { name: t('navigation.dashboard'), path: "/dashboard", icon: "lucide:layout-dashboard" },
    { name: t('navigation.freelancers'), path: "/browse-freelancers", icon: "lucide:users" },
    { name: t('navigation.lookingForWork'), path: "/looking-for-work", icon: "lucide:briefcase" },
    { name: t('navigation.messages'), path: "/chat/inbox", icon: "lucide:message-square" },
    { name: t('navigation.notifications'), path: "/notifications", icon: "lucide:bell" }
  ] : [
    { name: t('navigation.home'), path: "/", icon: "lucide:home" },
    { name: t('navigation.freelancers'), path: "/browse-freelancers", icon: "lucide:users" },
    { name: t('navigation.lookingForWork'), path: "/looking-for-work", icon: "lucide:briefcase" },
    { name: t('navigation.howItWorks'), path: "/help-support", icon: "lucide:help-circle" }
  ];
  
  const menuVariants = {
    closed: {
      x: "100%",
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 250,
      },
    },
    open: {
      x: 0,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 100,
      },
    },
  };

  const publicMenuItems = [
    { name: t('navigation.home'), path: "/", icon: "lucide:home" },
    { name: t('navigation.freelancers'), path: "/browse-freelancers", icon: "lucide:users" },
    { name: t('navigation.lookingForWork'), path: "/looking-for-work", icon: "lucide:briefcase" },
    { name: t('navigation.howItWorks'), path: "/how-it-works", icon: "lucide:help-circle" }
  ];

  const dashboardMenuItems = [
    { name: t('common.dashboard'), path: "/dashboard", icon: "lucide:layout-dashboard" },
    { name: "Jobs", path: "/jobs", icon: "lucide:briefcase" },
    { name: "Messages", path: "/chat", icon: "lucide:message-square" },
    { name: "Notifications", path: "/notifications", icon: "lucide:bell" },
    { name: "Billing", path: "/billing", icon: "lucide:credit-card" },
    { name: "Settings", path: "/settings", icon: "lucide:settings" }
  ];
  
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
            className={`fixed inset-y-0 right-0 w-full sm:w-80 z-50 overflow-y-auto ${isDarkMode ? 'bg-[#010b29]' : 'bg-white'} ${isDarkMode ? 'glass-effect' : 'glass-effect'}`}
            variants={menuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            role="dialog"
            aria-modal="true"
            aria-label={t('navigation.mobileMenu')}
          >
            <div className={`p-4 flex justify-between items-center border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
              {isLoggedIn ? (
                <div className="flex items-center gap-3">
                  <Avatar 
                    src="https://img.heroui.chat/image/avatar?w=100&h=100&u=user1" 
                    className="w-10 h-10"
                  />
                  <div>
                    <p className={isDarkMode ? "text-white font-medium" : "text-gray-800 font-medium"}>Alexander</p>
                    <p className="text-gray-400 text-xs">{t('navigation.freelancerRole')}</p>
                  </div>
                </div>
              ) : (
                <BeamlyLogo />
              )}
              <Button
                isIconOnly
                variant="light"
                onPress={onClose}
                className={isDarkMode ? "text-white" : "text-gray-800"}
                aria-label={t('navigation.closeMenu')}
              >
                <Icon icon="lucide:x" width={24} />
              </Button>
            </div>
            
            <div className="p-4 flex flex-col items-center">
              {/* Simplified menu structure - no nested pages */}
              <div className="space-y-3 mb-8 w-full max-w-md">
                {menuItems.map((item) => (
                  <Button
                    key={item.path}
                    variant="light"
                    className={`w-full justify-start ${isDarkMode ? 'text-white' : 'text-gray-800'} hover:bg-${isDarkMode ? 'white/10' : 'gray-100'} py-6 text-lg`}
                    startContent={<Icon icon={item.icon} width={24} height={24} />}
                    onPress={() => handleNavigation(item.path)}
                  >
                    {item.name}
                  </Button>
                ))}
              </div>
              
              {/* Additional menu items for logged in users */}
              {isLoggedIn && (
                <div className="space-y-3 mb-8 w-full max-w-md">
                  <Button
                    variant="light"
                    className={`w-full justify-start ${isDarkMode ? 'text-white' : 'text-gray-800'} hover:bg-${isDarkMode ? 'white/10' : 'gray-100'} py-6 text-lg`}
                    startContent={<Icon icon="lucide:settings" width={24} height={24} />}
                    onPress={() => handleNavigation("/settings")}
                  >
                    {t('navigation.settings')}
                  </Button>
                  <Button
                    variant="light"
                    className={`w-full justify-start ${isDarkMode ? 'text-white' : 'text-gray-800'} hover:bg-${isDarkMode ? 'white/10' : 'gray-100'} py-6 text-lg`}
                    startContent={<Icon icon="lucide:credit-card" width={24} height={24} />}
                    onPress={() => handleNavigation("/billing")}
                  >
                    {t('navigation.billing')}
                  </Button>
                </div>
              )}
              
              {/* Login/signup buttons */}
              {!isLoggedIn && (
                <div className={`border-t pt-6 mt-4 w-full max-w-md ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                  <div className="flex flex-col gap-3">
                    <Button
                      color="default"
                      variant="flat"
                      className={`w-full ${isDarkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-800'} py-6 text-lg`}
                      onPress={() => handleNavigation("/login")}
                    >
                      {t('common.login')}
                    </Button>
                    <Button
                      color="secondary"
                      className="w-full text-beamly-third font-medium py-6 text-lg"
                      onPress={() => handleNavigation("/signup")}
                    >
                      {t('common.signup')}
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Logout button for logged in users */}
              {isLoggedIn && (
                <div className={`border-t pt-6 mt-4 w-full max-w-md ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
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
                    {t('common.logout')}
                  </Button>
                </div>
              )}
              
              <div className={`border-t pt-6 mt-8 w-full max-w-md ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                <p className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
                  {isLoggedIn ? t('navigation.accountSettings') : t('navigation.preferences')}
                </p>
                
                {/* Add language and theme toggles to mobile menu */}
                <div className="flex justify-center items-center gap-6 mt-6">
                  <LanguageToggle />
                  <ThemeToggle />
                </div>

                <div className="flex justify-center gap-4 mt-8">
                  {["lucide:facebook", "lucide:twitter", "lucide:instagram", "lucide:linkedin"].map((social, index) => (
                    <Button
                      key={index}
                      isIconOnly
                      variant="light"
                      className={`${isDarkMode ? 'text-white bg-white/10' : 'text-gray-800 bg-gray-100'} rounded-full w-12 h-12 min-w-0`}
                      aria-label={t(`social.${social.split(':')[1]}`)}
                    >
                      <Icon icon={social} width={24} />
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

// Add display name
HamburgerMenu.displayName = 'HamburgerMenu';

export { HamburgerMenu };