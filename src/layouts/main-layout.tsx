import React from "react";
import { Outlet, Link as RouterLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Button, Link, Avatar, Badge } from "@heroui/react";
import { Icon } from "@iconify/react";
import { BeamlyLogo } from "../components/beamly-logo";
import { HamburgerMenu } from "../components/hamburger-menu";
import { Footer } from "../components/footer";
import { useTheme } from "../contexts/theme-context";
import { useScrollPosition } from "../hooks/use-scroll-position";

interface MainLayoutProps {
  isLoggedIn: boolean;
  onLogout: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ isLoggedIn, onLogout }) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const location = useLocation();
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  
  // Add scroll position tracking
  const { scrollPosition, scrollDirection } = useScrollPosition();
  
  // Determine if header should be visible on mobile
  const shouldShowMobileHeader = React.useMemo(() => {
    // Always show at top of page
    if (scrollPosition < 50) return true;
    // Show when scrolling up
    return scrollDirection === 'up';
  }, [scrollPosition, scrollDirection]);
  
  return (
    <div className="min-h-screen overflow-hidden">
      <div className={`relative ${isDarkMode ? 'bg-mesh' : ''}`}>
        <div className="blue-accent blue-accent-1"></div>
        <div className="blue-accent blue-accent-2"></div>
        <div className="yellow-accent yellow-accent-1"></div>
        <div className="yellow-accent yellow-accent-2"></div>
        
        {/* Desktop Nav */}
        <Navbar maxWidth="xl" className="glass-effect border-none hidden md:flex">
          <NavbarBrand>
            <RouterLink to="/" className="cursor-pointer">
              <BeamlyLogo />
            </RouterLink>
          </NavbarBrand>
          <NavbarContent className="gap-4" justify="center">
            <NavbarItem isActive={location.pathname === '/'}>
              <Link 
                as={RouterLink} 
                to="/" 
                className={`${isDarkMode ? 'text-white' : 'text-gray-800'} font-outfit hover:text-beamly-secondary`}
              >
                {t('navigation.home')}
              </Link>
            </NavbarItem>
            <NavbarItem isActive={location.pathname === '/browse-freelancers'}>
              <Link 
                as={RouterLink} 
                to="/browse-freelancers" 
                className={`${isDarkMode ? 'text-white' : 'text-gray-800'} font-outfit hover:text-beamly-secondary`}
              >
                {t('navigation.freelancers')}
              </Link>
            </NavbarItem>
            <NavbarItem isActive={location.pathname === '/looking-for-work'}>
              <Link 
                as={RouterLink} 
                to="/looking-for-work" 
                className={`${isDarkMode ? 'text-white' : 'text-gray-800'} font-outfit hover:text-beamly-secondary`}
              >
                {t('navigation.lookingForWork')}
              </Link>
            </NavbarItem>
            <NavbarItem isActive={location.pathname === '/how-it-works'}>
              <Link 
                as={RouterLink} 
                to="/how-it-works" 
                className={`${isDarkMode ? 'text-white' : 'text-gray-800'} font-outfit hover:text-beamly-secondary`}
              >
                {t('navigation.howItWorks')}
              </Link>
            </NavbarItem>
            {isLoggedIn && (
              <NavbarItem isActive={location.pathname.includes('/dashboard')}>
                <Link 
                  as={RouterLink} 
                  to="/dashboard" 
                  className={`${isDarkMode ? 'text-white' : 'text-gray-800'} font-outfit hover:text-beamly-secondary`}
                >
                  {t('navigation.dashboard')}
                </Link>
              </NavbarItem>
            )}
          </NavbarContent>
          <NavbarContent justify="end">
            {isLoggedIn ? (
              <>
                <NavbarItem>
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
                <NavbarItem>
                  <Avatar 
                    as={RouterLink}
                    to="/settings"
                    src="https://img.heroui.chat/image/avatar?w=100&h=100&u=user1" 
                    className="w-8 h-8 cursor-pointer"
                    aria-label={t('navigation.profile')}
                  />
                </NavbarItem>
              </>
            ) : (
              <>
                <NavbarItem>
                  <Link 
                    as={RouterLink}
                    to="/login"
                    className={`${isDarkMode ? 'text-white' : 'text-gray-800'} font-outfit hover:text-beamly-secondary`}
                  >
                    {t('common.login')}
                  </Link>
                </NavbarItem>
                <NavbarItem>
                  <Button 
                    as={RouterLink} 
                    to="/signup"
                    color="secondary" 
                    variant="solid"
                    className="font-medium font-outfit text-beamly-third"
                  >
                    {t('common.signup')}
                  </Button>
                </NavbarItem>
              </>
            )}
          </NavbarContent>
        </Navbar>
        
        {/* Mobile Nav - Add transition and fixed positioning */}
        <div 
          className={`md:hidden glass-effect border-none fixed top-0 left-0 right-0 z-30 transition-transform duration-300 ${
            shouldShowMobileHeader ? 'translate-y-0' : '-translate-y-full'
          }`}
        >
          <div className="flex justify-between items-center p-4">
            <RouterLink to="/" className="cursor-pointer">
              <BeamlyLogo />
            </RouterLink>
            
            <div className="flex items-center gap-2">
              {isLoggedIn && (
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
              )}
              <Button
                isIconOnly
                variant="light"
                onPress={() => setMenuOpen(true)}
                className={isDarkMode ? "text-white" : "text-gray-800"}
                aria-label={t('navigation.openMenu')}
              >
                <Icon icon="lucide:menu" width={24} />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Add padding to prevent content from being hidden under fixed header on mobile */}
        <div className="md:hidden h-[72px]"></div>
        
        {/* Content */}
        <main>
          <Outlet />
        </main>
        
        {/* Footer */}
        <Footer />
        
        {/* Mobile Menu */}
        <HamburgerMenu 
          isOpen={menuOpen} 
          onClose={() => setMenuOpen(false)} 
          isLoggedIn={isLoggedIn}
          onLogout={onLogout}
        />
      </div>
    </div>
  );
};