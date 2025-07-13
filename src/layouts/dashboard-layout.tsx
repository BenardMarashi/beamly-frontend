import React, { useState, useEffect } from 'react';
import { Outlet, Link as RouterLink, useLocation } from 'react-router-dom';
import { Button, Badge, Avatar } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/theme-context';
import { BeamlyLogo } from '../components/beamly-logo';
import { HamburgerMenu } from '../components/hamburger-menu';
import { useAuth } from '../contexts/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { toast } from 'react-hot-toast';

const DashboardLayout: React.FC = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const location = useLocation();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Subscribe to user data changes
    const unsubscribeUser = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        setUserData(doc.data());
      }
    });

    // Subscribe to unread notifications count
    // Note: This assumes a different structure, adjust based on your Firestore schema
    const unsubscribeNotifications = onSnapshot(
      doc(db, 'users', user.uid),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          // Adjust this based on your actual notification structure
          setNotificationCount(data.unreadNotifications || 0);
        }
      }
    );

    return () => {
      unsubscribeUser();
      unsubscribeNotifications();
    };
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  // Determine user type for role-based navigation
  const userType = userData?.accountType || 'freelancer';
  const isFreelancer = userType === 'freelancer';
  const isClient = userType === 'client';

  const profilePicture = userData?.photoURL || user?.photoURL || 
    `https://ui-avatars.com/api/?name=${userData?.displayName || user?.displayName || 'User'}&background=0F43EE&color=fff`;

  return (
    <div className={`min-h-screen overflow-hidden ${isDarkMode ? 'bg-mesh' : 'bg-white'}`}>
      <div className="relative">
        {/* Always add gradient accents in dark mode */}
        {isDarkMode && (
          <>
            <div className="blue-accent blue-accent-1"></div>
            <div className="blue-accent blue-accent-2"></div>
            <div className="yellow-accent yellow-accent-1"></div>
            <div className="yellow-accent yellow-accent-2"></div>
          </>
        )}
        
        {/* Glass Effect Header with Hamburger Menu - Dashboard Version */}
        <header className={`fixed top-0 left-0 right-0 z-50 glass-effect border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200/50'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex-shrink-0">
                <RouterLink to="/dashboard" className="cursor-pointer">
                  <BeamlyLogo />
                </RouterLink>
              </div>
              
              {/* Center Action - Role-based */}
              <div className="hidden md:flex items-center gap-4">
                {isClient && (
                  <Button 
                    as={RouterLink} 
                    to="/post-job"
                    color="secondary" 
                    variant="flat"
                    startContent={<Icon icon="lucide:plus" />}
                    className="font-medium"
                  >
                    {t('dashboard.postJob') || 'Post Job'}
                  </Button>
                )}
                {isFreelancer && (
                  <Button 
                    as={RouterLink} 
                    to="/looking-for-work"
                    color="secondary" 
                    variant="flat"
                    startContent={<Icon icon="lucide:search" />}
                    className="font-medium"
                  >
                    {t('dashboard.findWork') || 'Find Work'}
                  </Button>
                )}
              </div>
              
              {/* Right side - Notifications & Hamburger */}
              <div className="flex items-center gap-2">
                {/* Notifications */}
                <Button
                  isIconOnly
                  variant="light"
                  as={RouterLink}
                  to="/notifications"
                  className={`${isDarkMode ? 'text-white hover:bg-white/10' : 'text-gray-800 hover:bg-gray-100'} transition-colors`}
                  aria-label={t('navigation.notifications')}
                >
                  <Badge content={notificationCount > 0 ? notificationCount.toString() : undefined} color="danger" size="sm">
                    <Icon icon="lucide:bell" width={20} />
                  </Badge>
                </Button>
                
                {/* Hamburger Menu Button */}
                <Button
                  isIconOnly
                  variant="light"
                  onPress={() => setMenuOpen(true)}
                  className={`${isDarkMode ? 'text-white hover:bg-white/10' : 'text-gray-800 hover:bg-gray-100'} transition-colors`}
                  aria-label="Open menu"
                >
                  <Icon icon="lucide:menu" width={24} height={24} />
                </Button>
              </div>
            </div>
          </div>
        </header>
        
        {/* Glass Effect Hamburger Menu */}
        <HamburgerMenu 
          isOpen={menuOpen} 
          onClose={() => setMenuOpen(false)} 
          isLoggedIn={true} 
          onLogout={handleSignOut}
          isDashboard={true}
        />
        
        {/* Main Content */}
        <main className="relative z-10 pt-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Make sure to export the component
export { DashboardLayout };