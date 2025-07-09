import React, { useState } from "react";
import { Outlet, Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Button, Avatar, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Badge, NavbarMenuToggle, NavbarMenu, NavbarMenuItem } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { BeamlyLogo } from "../components/beamly-logo";
import { Footer } from "../components/footer";
import { useAuth } from "../contexts/AuthContext";
import { useSignOut } from "../hooks/use-auth";
import { useTheme } from "../contexts/theme-context";

interface MainLayoutProps {
  isLoggedIn: boolean;
  onLogout: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ isLoggedIn, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const { signOut } = useSignOut();
  const { isDarkMode } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  
  const handleLogout = async () => {
    await signOut();
    onLogout();
    navigate('/');
  };
  
  const profilePicture = userData?.photoURL || user?.photoURL || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.displayName || user?.displayName || 'User')}&background=0F43EE&color=fff`;
  
  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/browse-freelancers', label: 'Browse Freelancers' },
    { path: '/looking-for-work', label: 'Looking for Work' }
  ];
  
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
        
        {/* Desktop Nav */}
        <Navbar maxWidth="xl" className="glass-effect border-none" isMenuOpen={menuOpen} onMenuOpenChange={setMenuOpen}>
          <NavbarContent>
            <NavbarMenuToggle
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="sm:hidden"
            />
            <NavbarBrand>
              <RouterLink to="/" className="cursor-pointer">
                <BeamlyLogo />
              </RouterLink>
            </NavbarBrand>
          </NavbarContent>
          
          <NavbarContent className="hidden sm:flex gap-4" justify="center">
            {navItems.map((item) => (
              <NavbarItem key={item.path} isActive={location.pathname === item.path}>
                <RouterLink 
                  to={item.path}
                  className={`${isDarkMode ? 'text-white' : 'text-gray-800'} hover:text-beamly-secondary`}
                >
                  {item.label}
                </RouterLink>
              </NavbarItem>
            ))}
          </NavbarContent>
          
          <NavbarContent justify="end">
            {isLoggedIn ? (
              <>
                <NavbarItem className="hidden lg:flex">
                  <RouterLink to="/notifications" className="flex items-center gap-1">
                    <Badge content="2" color="danger" size="sm">
                      <Icon icon="lucide:bell" className={`text-xl ${isDarkMode ? 'text-white' : 'text-gray-800'}`} />
                    </Badge>
                  </RouterLink>
                </NavbarItem>
                
                <NavbarItem className="hidden lg:flex">
                  <RouterLink to="/chat">
                    <Icon icon="lucide:message-square" className={`text-xl ${isDarkMode ? 'text-white' : 'text-gray-800'}`} />
                  </RouterLink>
                </NavbarItem>
                
                <Dropdown placement="bottom-end">
                  <DropdownTrigger>
                    <Avatar
                      isBordered
                      as="button"
                      className="transition-transform"
                      color="secondary"
                      name={userData?.displayName || user?.displayName || "User"}
                      size="sm"
                      src={profilePicture}
                    />
                  </DropdownTrigger>
                  <DropdownMenu aria-label="Profile Actions" variant="flat">
                    <DropdownItem key="profile" className="h-14 gap-2">
                      <p className="font-semibold">Signed in as</p>
                      <p className="font-semibold">{userData?.email || user?.email}</p>
                    </DropdownItem>
                    <DropdownItem 
                      key="dashboard" 
                      onPress={() => navigate('/dashboard')}
                    >
                      Dashboard
                    </DropdownItem>
                    <DropdownItem 
                      key="settings" 
                      onPress={() => navigate('/settings')}
                    >
                      Settings
                    </DropdownItem>
                    <DropdownItem 
                      key="analytics" 
                      onPress={() => navigate('/analytics')}
                    >
                      Analytics
                    </DropdownItem>
                    <DropdownItem 
                      key="logout" 
                      color="danger" 
                      onPress={handleLogout}
                    >
                      Log Out
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </>
            ) : (
              <>
                <NavbarItem className="hidden lg:flex">
                  <RouterLink to="/login" className={isDarkMode ? 'text-white' : 'text-gray-800'}>
                    Login
                  </RouterLink>
                </NavbarItem>
                <NavbarItem>
                  <Button as={RouterLink} to="/signup" color="secondary" variant="flat">
                    Sign Up
                  </Button>
                </NavbarItem>
              </>
            )}
          </NavbarContent>
          
          {/* Mobile Menu */}
          <NavbarMenu className={`${isDarkMode ? 'bg-beamly-third/95' : 'bg-white/95'} backdrop-blur-md`}>
            {navItems.map((item, index) => (
              <NavbarMenuItem key={`${item.path}-${index}`}>
                <RouterLink
                  className={`w-full ${isDarkMode ? 'text-white' : 'text-gray-800'} ${
                    location.pathname === item.path ? 'text-beamly-secondary' : ''
                  }`}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </RouterLink>
              </NavbarMenuItem>
            ))}
            
            <div className="mt-8 space-y-2">
              {isLoggedIn ? (
                <>
                  <Button
                    as={RouterLink}
                    to="/dashboard"
                    variant="light"
                    fullWidth
                    className={`justify-start ${isDarkMode ? 'text-white' : 'text-gray-800'}`}
                    startContent={<Icon icon="lucide:layout-dashboard" />}
                    onClick={() => setMenuOpen(false)}
                  >
                    Dashboard
                  </Button>
                  <Button
                    as={RouterLink}
                    to="/notifications"
                    variant="light"
                    fullWidth
                    className={`justify-start ${isDarkMode ? 'text-white' : 'text-gray-800'}`}
                    startContent={
                      <Badge content="2" color="danger" size="sm">
                        <Icon icon="lucide:bell" />
                      </Badge>
                    }
                    onClick={() => setMenuOpen(false)}
                  >
                    Notifications
                  </Button>
                  <Button
                    as={RouterLink}
                    to="/chat"
                    variant="light"
                    fullWidth
                    className={`justify-start ${isDarkMode ? 'text-white' : 'text-gray-800'}`}
                    startContent={<Icon icon="lucide:message-square" />}
                    onClick={() => setMenuOpen(false)}
                  >
                    Messages
                  </Button>
                  <Button
                    as={RouterLink}
                    to="/settings"
                    variant="light"
                    fullWidth
                    className={`justify-start ${isDarkMode ? 'text-white' : 'text-gray-800'}`}
                    startContent={<Icon icon="lucide:settings" />}
                    onClick={() => setMenuOpen(false)}
                  >
                    Settings
                  </Button>
                  <Button
                    variant="light"
                    fullWidth
                    color="danger"
                    className="justify-start"
                    startContent={<Icon icon="lucide:log-out" />}
                    onPress={() => {
                      handleLogout();
                      setMenuOpen(false);
                    }}
                  >
                    Log Out
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    as={RouterLink}
                    to="/login"
                    variant="light"
                    fullWidth
                    className={`justify-start ${isDarkMode ? 'text-white' : 'text-gray-800'}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    Login
                  </Button>
                  <Button
                    as={RouterLink}
                    to="/signup"
                    color="secondary"
                    fullWidth
                    onClick={() => setMenuOpen(false)}
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </NavbarMenu>
        </Navbar>
        
        {/* Main Content - will have gradient background in dark mode */}
        <main className="relative z-10">
          <Outlet />
        </main>
        
        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};