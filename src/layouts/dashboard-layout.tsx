import React, { useState, useEffect } from 'react';
import { Outlet, Link as RouterLink, useLocation } from 'react-router-dom';
import { 
  Navbar, 
  NavbarBrand, 
  NavbarContent, 
  NavbarItem,
  Button,
  Badge,
  User
} from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/theme-context';
import { BeamlyLogo } from '../components/beamly-logo';
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

  const menuItems = [
    { name: t('navigation.dashboard'), icon: 'lucide:layout-dashboard', path: '/dashboard' },
    { name: t('navigation.browseJobs') || 'Browse Jobs', icon: 'lucide:briefcase', path: '/jobs' },
    { name: t('navigation.messages'), icon: 'lucide:message-square', path: '/messages' },
    { name: t('navigation.proposals') || 'Proposals', icon: 'lucide:file-text', path: '/proposals' },
    { name: t('navigation.contracts') || 'Contracts', icon: 'lucide:file-check', path: '/contracts' },
    { name: t('navigation.analytics') || 'Analytics', icon: 'lucide:bar-chart', path: '/analytics' },
    { name: t('navigation.billing'), icon: 'lucide:credit-card', path: '/billing' },
    { name: t('navigation.settings'), icon: 'lucide:settings', path: '/settings' },
  ];

  const profilePicture = userData?.photoURL || user?.photoURL || 
    `https://ui-avatars.com/api/?name=${userData?.displayName || user?.displayName || 'User'}&background=0F43EE&color=fff`;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-mesh' : ''}`}>
      <div className="blue-accent blue-accent-1"></div>
      <div className="blue-accent blue-accent-2"></div>
      <div className="yellow-accent yellow-accent-1"></div>
      <div className="yellow-accent yellow-accent-2"></div>
      
      {/* Desktop Nav */}
      <Navbar maxWidth="xl" className="glass-effect border-none z-40">
        <NavbarBrand>
          <RouterLink to="/" className="cursor-pointer">
            <BeamlyLogo />
          </RouterLink>
        </NavbarBrand>
        <NavbarContent className="gap-4 hidden md:flex" justify="center">
          <NavbarItem>
            <Button 
              as={RouterLink} 
              to="/jobs/new"
              color="primary" 
              variant="flat"
              startContent={<Icon icon="lucide:plus" />}
              className="font-medium"
            >
              {t('dashboard.postJob')}
            </Button>
          </NavbarItem>
        </NavbarContent>
        <NavbarContent justify="end">
          <NavbarItem className="hidden md:flex">
            <Button
              isIconOnly
              variant="light"
              as={RouterLink}
              to="/notifications"
              className={isDarkMode ? "text-white" : "text-gray-800"}
              aria-label={t('navigation.notifications')}
            >
              <Badge content={notificationCount > 0 ? notificationCount.toString() : "0"} color="danger" size="sm">
                <Icon icon="lucide:bell" width={20} />
              </Badge>
            </Button>
          </NavbarItem>
          <NavbarItem className="md:hidden">
            <Button
              isIconOnly
              variant="light"
              onPress={() => setMenuOpen(!menuOpen)}
              className={isDarkMode ? "text-white" : "text-gray-800"}
              aria-label="Toggle menu"
            >
              <Icon icon={menuOpen ? "lucide:x" : "lucide:menu"} width={24} />
            </Button>
          </NavbarItem>
        </NavbarContent>
      </Navbar>
      
      {/* Mobile Menu */}
      <div className={`md:hidden fixed inset-0 z-30 transform ${menuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300`}>
        <div className={`w-64 h-full ${isDarkMode ? 'bg-black/95' : 'bg-white/95'} backdrop-blur-md p-4`}>
          <div className="mb-6">
            <User
              name={userData?.displayName || user?.displayName || "User"}
              description={userData?.userType === 'both' ? 'Freelancer & Client' : userData?.userType || 'Member'}
              avatarProps={{
                src: profilePicture,
                size: "sm"
              }}
            />
          </div>
          
          <div className="space-y-2">
            {menuItems.map((item) => (
              <Button
                key={item.path}
                as={RouterLink}
                to={item.path}
                variant={location.pathname === item.path ? "flat" : "light"}
                startContent={<Icon icon={item.icon} />}
                className={`w-full justify-start ${
                  location.pathname === item.path 
                    ? "bg-beamly-primary text-white" 
                    : isDarkMode ? "text-white hover:bg-white/10" : "text-gray-800 hover:bg-gray-100"
                }`}
                onPress={() => setMenuOpen(false)}
              >
                {item.name}
              </Button>
            ))}
          </div>
          
          {/* Footer */}
          <div className="pt-4 border-t border-white/10">
            <Button
              color="danger"
              variant="flat"
              startContent={<Icon icon="lucide:log-out" />}
              onPress={handleSignOut}
              className="w-full"
            >
              {t('navigation.logout')}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Desktop Sidebar */}
      <div className="flex">
        <aside className={`hidden md:block w-64 min-h-[calc(100vh-64px)] ${
          isDarkMode ? 'bg-black/20' : 'bg-white/80'
        } backdrop-blur-md border-r ${
          isDarkMode ? 'border-white/10' : 'border-gray-200'
        }`}>
          <div className="p-4">
            <div className="mb-6">
              <User
                name={userData?.displayName || user?.displayName || "User"}
                description={userData?.userType === 'both' ? 'Freelancer & Client' : userData?.userType || 'Member'}
                avatarProps={{
                  src: profilePicture,
                  size: "sm"
                }}
              />
            </div>
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <Button
                  key={item.path}
                  as={RouterLink}
                  to={item.path}
                  variant={location.pathname === item.path ? "flat" : "light"}
                  startContent={<Icon icon={item.icon} />}
                  className={`w-full justify-start ${
                    location.pathname === item.path 
                      ? "bg-beamly-primary text-white" 
                      : isDarkMode ? "text-white hover:bg-white/10" : "text-gray-800 hover:bg-gray-100"
                  }`}
                >
                  {item.name}
                </Button>
              ))}
            </nav>
            <div className="mt-8 pt-8 border-t border-white/10">
              <Button
                color="danger"
                variant="light"
                startContent={<Icon icon="lucide:log-out" />}
                onPress={handleSignOut}
                className="w-full justify-start"
              >
                {t('navigation.logout')}
              </Button>
            </div>
          </div>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-64px)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Make sure to export the component
export { DashboardLayout };