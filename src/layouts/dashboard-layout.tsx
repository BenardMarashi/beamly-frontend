import React from "react";
import { Outlet, Link as RouterLink, useLocation, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Button, Link, Avatar, Badge } from "@heroui/react";
import { Icon } from "@iconify/react";
import { BeamlyLogo } from "../components/beamly-logo";
import { useTheme } from "../contexts/theme-context";
import { Footer } from "../components/footer";
import { HamburgerMenu } from "../components/hamburger-menu";

interface DashboardLayoutProps {
  isLoggedIn: boolean;
  onLogout: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ isLoggedIn, onLogout }) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const location = useLocation();
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();

  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  const sidebarItems = [
    { key: 'dashboard', label: t('common.dashboard'), icon: 'lucide:layout-dashboard', path: '/dashboard' },
    { key: 'jobs', label: t('dashboard.jobs'), icon: 'lucide:briefcase', path: '/jobs' },
    { key: 'messages', label: t('dashboard.messages'), icon: 'lucide:message-square', path: '/chat' },
    { key: 'notifications', label: t('dashboard.notifications'), icon: 'lucide:bell', path: '/notifications' },
    { key: 'billing', label: t('dashboard.billing'), icon: 'lucide:credit-card', path: '/billing' },
    { key: 'settings', label: t('dashboard.settings'), icon: 'lucide:settings', path: '/settings' }
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      <div className={`relative ${isDarkMode ? 'bg-mesh' : ''}`}>
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
            <NavbarItem isActive={location.pathname === '/browse-freelancers'}>
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
                <Badge content={3} color="secondary" shape="circle">
                  <Icon icon="lucide:bell" width={20} />
                </Badge>
              </Button>
            </NavbarItem>
            <NavbarItem className="hidden md:flex">
              <Avatar 
                as={RouterLink}
                to="/settings"
                src="https://img.heroui.chat/image/avatar?w=100&h=100&u=user1" 
                className="w-8 h-8 cursor-pointer"
                aria-label={t('navigation.profile')}
              />
            </NavbarItem>
            <NavbarItem className="md:hidden">
              <Button
                isIconOnly
                variant="light"
                onPress={() => setMenuOpen(true)}
                className={isDarkMode ? "text-white" : "text-gray-800"}
                aria-label={t('navigation.openMenu')}
              >
                <Icon icon="lucide:menu" width={24} />
              </Button>
            </NavbarItem>
          </NavbarContent>
        </Navbar>
        
        <div className="flex">
          {/* Desktop Sidebar */}
          <div className="hidden md:block w-64 h-[calc(100vh-64px)] glass-effect fixed">
            <div className="p-4 space-y-2">
              {sidebarItems.map(item => (
                <Button
                  key={item.key}
                  as={RouterLink}
                  to={item.path}
                  variant="light"
                  startContent={<Icon icon={item.icon} />}
                  className={`w-full justify-start mb-1 ${
                    location.pathname.includes(item.path) 
                      ? 'bg-beamly-secondary/20 text-beamly-secondary'
                      : isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  {item.label}
                </Button>
              ))}
              
              <div className="pt-4 mt-4 border-t border-gray-700">
                <Button
                  variant="light"
                  startContent={<Icon icon="lucide:log-out" />}
                  className={`w-full justify-start ${isDarkMode ? 'text-white' : 'text-gray-800'}`}
                  onPress={onLogout}
                >
                  {t('common.logout')}
                </Button>
              </div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="w-full md:ml-64 md:pl-4">
            <main className="py-4 px-4">
              <Outlet />
            </main>
          </div>
        </div>
        
        {/* Mobile Menu */}
        <HamburgerMenu 
          isOpen={menuOpen} 
          onClose={() => setMenuOpen(false)} 
          isLoggedIn={isLoggedIn}
          onLogout={onLogout}
          isDashboard
        />
      </div>
    </div>
  );
};