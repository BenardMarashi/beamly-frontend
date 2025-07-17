import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Avatar, Button } from '@nextui-org/react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/theme-context';
import { BeamlyLogo } from '../beamly-logo';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { toast } from 'react-hot-toast';

interface UnifiedHamburgerMenuProps {
  isLoggedIn: boolean;
  onLogout: () => void;
}

export const UnifiedHamburgerMenu: React.FC<UnifiedHamburgerMenuProps> = ({ 
  isLoggedIn, 
  onLogout 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, userData, isFreelancer, isClient, canPostJobs } = useAuth();
  const { theme, setTheme, isDarkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const profilePicture = userData?.photoURL || user?.photoURL || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.displayName || user?.displayName || 'User')}&background=0F43EE&color=fff`;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Signed out successfully');
      onLogout();
      setIsMenuOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  const handleMenuItemClick = () => {
    setIsMenuOpen(false);
  };

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }

    return () => {
      document.body.classList.remove('menu-open');
    };
  }, [isMenuOpen]);

  const getNavigationItems = () => {
    // For non-logged in users
    if (!isLoggedIn || !user) {
      return [
        { path: '/', label: 'Home', icon: 'solar:home-2-bold' },
        { path: '/browse-freelancers', label: 'Browse Freelancers', icon: 'solar:users-group-rounded-bold' },
        { path: '/browse-jobs', label: 'Looking for Work', icon: 'solar:case-round-minimalistic-bold' },
        { path: '/how-it-works', label: 'How it Works', icon: 'solar:question-circle-bold' },
      ];
    }

    // For logged in users - show all navigation items regardless of page
    const items = [
      { path: '/', label: 'Home', icon: 'solar:home-2-bold' },
      { path: '/browse-freelancers', label: 'Browse Freelancers', icon: 'solar:users-group-rounded-bold' },
      { path: '/browse-jobs', label: 'Looking for Work', icon: 'solar:case-round-minimalistic-bold' },
      { path: '/how-it-works', label: 'How it Works', icon: 'solar:question-circle-bold' },
      { path: '/dashboard', label: 'Dashboard', icon: 'solar:widget-2-bold' },
      { path: '/browse-jobs', label: 'Find Work', icon: 'solar:case-round-minimalistic-bold' },
      { path: '/messages', label: 'Messages', icon: 'solar:chat-round-dots-bold' },
      { path: '/settings', label: 'Settings', icon: 'solar:settings-bold' },
    ];

    // Add user type specific items
    if (userData?.userType === 'freelancer' || userData?.userType === 'both') {
      items.push(
        { path: '/post-project', label: 'Post Project', icon: 'solar:folder-plus-bold' },
        { path: '/projects/manage', label: 'My Projects', icon: 'solar:folder-bold' }
      );
    }

    if (userData?.userType === 'client' || userData?.userType === 'both') {
      items.push(
        { path: '/post-job', label: 'Post Job', icon: 'solar:add-circle-bold' },
        { path: '/jobs/manage', label: 'My Jobs', icon: 'solar:briefcase-bold' }
      );
    }

    return items;
  };

  const navigationItems = getNavigationItems();

  const menuVariants = {
    closed: {
      x: '100%',
      transition: {
        type: 'spring' as const,
        stiffness: 400,
        damping: 40
      }
    },
    open: {
      x: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 400,
        damping: 40
      }
    }
  };

  const overlayVariants = {
    closed: {
      opacity: 0,
      transition: {
        duration: 0.2
      }
    },
    open: {
      opacity: 1,
      transition: {
        duration: 0.2
      }
    }
  };

  const itemVariants = {
    closed: {
      x: 50,
      opacity: 0
    },
    open: (index: number) => ({
      x: 0,
      opacity: 1,
      transition: {
        delay: index * 0.05,
        type: 'spring' as const,
        stiffness: 300,
        damping: 24
      }
    })
  };

  return (
    <>
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-40 h-16">
        <div className="glass-effect h-full flex items-center justify-between px-4 md:px-6">
          {/* Logo */}
          <RouterLink to="/" className="flex items-center">
            <BeamlyLogo />
          </RouterLink>

          {/* Hamburger Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center justify-center w-10 h-10 rounded-lg border border-white/10 hover:border-white/20 transition-colors duration-200"
            aria-label="Toggle menu"
          >
            <motion.div
              animate={isMenuOpen ? 'open' : 'closed'}
              className="flex flex-col justify-center items-center w-6 h-6"
            >
              <motion.span
                variants={{
                  closed: { rotate: 0, y: 0 },
                  open: { rotate: 45, y: 6 }
                }}
                className="w-6 h-0.5 bg-current block transition-all duration-300 origin-center"
              />
              <motion.span
                variants={{
                  closed: { opacity: 1 },
                  open: { opacity: 0 }
                }}
                className="w-6 h-0.5 bg-current block transition-all duration-300 mt-1.5"
              />
              <motion.span
                variants={{
                  closed: { rotate: 0, y: 0 },
                  open: { rotate: -45, y: -6 }
                }}
                className="w-6 h-0.5 bg-current block transition-all duration-300 mt-1.5 origin-center"
              />
            </motion.div>
          </button>
        </div>
      </div>

      {/* Menu Overlay and Sidebar */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop Overlay - Fixed to properly close menu */}
            <motion.div
              variants={overlayVariants}
              initial="closed"
              animate="open"
              exit="closed"
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm hamburger-overlay"
              aria-hidden="true"
            />

            {/* Menu Panel */}
            <motion.div
              variants={menuVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm hamburger-menu-panel"
            >
              <div className="glass-effect h-full overflow-y-auto">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-8">
                    <BeamlyLogo />
                    <button
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/10 transition-colors duration-200"
                    >
                      <Icon icon="solar:close-circle-bold" className="w-6 h-6" />
                    </button>
                  </div>

                  {/* User Profile Section - Now Clickable */}
                  {isLoggedIn && userData && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="mb-8"
                    >
                      <RouterLink
                        to="/edit-profile"
                        onClick={handleMenuItemClick}
                        className="block p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200"
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar
                            src={profilePicture}
                            alt={userData.displayName}
                            className="w-12 h-12"
                          />
                          <div>
                            <h3 className="font-semibold text-white">
                              {userData.displayName || 'User'}
                            </h3>
                            <p className="text-sm text-white/70 capitalize">
                              {userData.userType === 'both' ? 'Freelancer & Client' : userData.userType}
                            </p>
                          </div>
                          <Icon icon="solar:arrow-right-bold" className="w-5 h-5 text-white/50 ml-auto" />
                        </div>
                      </RouterLink>
                    </motion.div>
                  )}

                  {/* Navigation Items */}
                  <nav className="space-y-2 mb-8">
                    {navigationItems.filter((item, index, self) => 
                      // Remove duplicate paths
                      index === self.findIndex((i) => i.path === item.path)
                    ).map((item, index) => (
                      <motion.div
                        key={`${item.path}-${index}`}
                        custom={index}
                        variants={itemVariants}
                        initial="closed"
                        animate="open"
                      >
                        <RouterLink
                          to={item.path}
                          onClick={handleMenuItemClick}
                          className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                            location.pathname === item.path
                              ? 'bg-beamly-secondary text-beamly-primary font-medium'
                              : 'hover:bg-white/10 text-white'
                          }`}
                        >
                          <Icon icon={item.icon} className="w-5 h-5" />
                          <span>{item.label}</span>
                        </RouterLink>
                      </motion.div>
                    ))}
                  </nav>

                  {/* User Actions */}
                  {isLoggedIn && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="space-y-2 border-t border-white/10 pt-6"
                    >
                      <Button
                        as={RouterLink}
                        to="/settings"
                        onPress={handleMenuItemClick}
                        variant="bordered"
                        className="w-full border-white/20 text-white hover:bg-white/10"
                        startContent={<Icon icon="solar:settings-bold" className="w-4 h-4" />}
                      >
                        Settings
                      </Button>
                      <Button
                        onPress={handleLogout}
                        variant="bordered"
                        className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
                        startContent={<Icon icon="solar:logout-2-bold" className="w-4 h-4" />}
                      >
                        Logout
                      </Button>
                    </motion.div>
                  )}

                  {/* Login/Signup for non-authenticated users */}
                  {!isLoggedIn && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="space-y-2 border-t border-white/10 pt-6"
                    >
                      <Button
                        as={RouterLink}
                        to="/login"
                        onPress={handleMenuItemClick}
                        variant="bordered"
                        className="w-full border-white/20 text-white hover:bg-white/10"
                      >
                        Login
                      </Button>
                      <Button
                        as={RouterLink}
                        to="/signup"
                        onPress={handleMenuItemClick}
                        color="primary"
                        className="w-full"
                      >
                        Sign Up
                      </Button>
                    </motion.div>
                  )}

                  {/* Preferences */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="border-t border-white/10 pt-6"
                  >
                    <h4 className="text-sm font-medium text-white/60 mb-4">Preferences</h4>
                    
                    {/* Theme Toggle */}
                    <div className="flex items-center justify-between">
                      <span className="text-white/80">Theme</span>
                      <div className="flex items-center space-x-2">
                        <Icon icon="solar:sun-bold" className="w-4 h-4 text-white/60" />
                        <button
                          onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
                          className="relative w-11 h-6 bg-white/20 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-beamly-primary focus:ring-offset-2 focus:ring-offset-transparent"
                        >
                          <motion.div
                            animate={{ x: isDarkMode ? 20 : 2 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className="w-5 h-5 bg-beamly-secondary rounded-full shadow-md"
                          />
                        </button>
                        <Icon icon="solar:moon-bold" className="w-4 h-4 text-white/60" />
                      </div>
                    </div>
                  </motion.div>

                  {/* Social Links */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center justify-center space-x-4 mt-8"
                  >
                    {[
                      { icon: 'ri:facebook-fill', href: '#' },
                      { icon: 'ri:twitter-x-fill', href: '#' },
                      { icon: 'ri:instagram-fill', href: '#' },
                      { icon: 'ri:linkedin-fill', href: '#' }
                    ].map((social, index) => (
                      <a
                        key={index}
                        href={social.href}
                        className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200"
                      >
                        <Icon icon={social.icon} className="w-5 h-5 text-white/70" />
                      </a>
                    ))}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};