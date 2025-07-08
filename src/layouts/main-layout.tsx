import React, { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Button, Avatar, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Badge } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { BeamlyLogo } from "../components/beamly-logo";
import { Footer } from "../components/footer";
import { useAuth } from "../contexts/AuthContext";
import { useSignOut } from "../hooks/use-auth";

interface MainLayoutProps {
  isLoggedIn: boolean;
  onLogout: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ isLoggedIn, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const { signOut } = useSignOut();
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
    <div className="min-h-screen overflow-hidden">
      <div className="relative bg-mesh">
        <div className="blue-accent blue-accent-1"></div>
        <div className="blue-accent blue-accent-2"></div>
        <div className="yellow-accent yellow-accent-1"></div>
        <div className="yellow-accent yellow-accent-2"></div>
        
        {/* Desktop Nav */}
        <Navbar maxWidth="xl" className="glass-effect border-none">
          <NavbarBrand>
            <Link to="/" className="cursor-pointer">
              <BeamlyLogo />
            </Link>
          </NavbarBrand>
          
          <NavbarContent className="hidden sm:flex gap-4" justify="center">
            {navItems.map((item) => (
              <NavbarItem key={item.path} isActive={location.pathname === item.path}>
                <Link 
                  to={item.path}
                  className="text-white hover:text-beamly-secondary"
                >
                  {item.label}
                </Link>
              </NavbarItem>
            ))}
          </NavbarContent>
          
          <NavbarContent justify="end">
            {isLoggedIn ? (
              <>
                <NavbarItem className="hidden lg:flex">
                  <Button
                    as={Link}
                    to="/notifications"
                    isIconOnly
                    variant="light"
                    className="text-white"
                  >
                    <Badge content="2" color="danger" size="sm">
                      <Icon icon="lucide:bell" width={20} />
                    </Badge>
                  </Button>
                </NavbarItem>
                
                <NavbarItem className="hidden lg:flex">
                  <Button
                    as={Link}
                    to="/chat"
                    isIconOnly
                    variant="light"
                    className="text-white"
                  >
                    <Icon icon="lucide:message-square" width={20} />
                  </Button>
                </NavbarItem>
                
                <Dropdown placement="bottom-end">
                  <DropdownTrigger>
                    <Avatar
                      as="button"
                      className="transition-transform"
                      src={profilePicture}
                      name={userData?.displayName || user?.displayName || 'User'}
                      size="sm"
                    />
                  </DropdownTrigger>
                  <DropdownMenu 
                    aria-label="Profile Actions" 
                    variant="flat"
                    onAction={(key) => {
                      switch (key) {
                        case 'dashboard':
                          navigate('/dashboard');
                          break;
                        case 'settings':
                          navigate('/settings');
                          break;
                        case 'billing':
                          navigate('/billing');
                          break;
                        case 'logout':
                          handleLogout();
                          break;
                      }
                    }}
                  >
                    <DropdownItem key="profile" className="h-14 gap-2">
                      <p className="font-semibold">Signed in as</p>
                      <p className="font-semibold">{user?.email}</p>
                    </DropdownItem>
                    <DropdownItem 
                      key="dashboard"
                      startContent={<Icon icon="lucide:layout-dashboard" />}
                    >
                      Dashboard
                    </DropdownItem>
                    <DropdownItem 
                      key="settings"
                      startContent={<Icon icon="lucide:settings" />}
                    >
                      Settings
                    </DropdownItem>
                    <DropdownItem 
                      key="billing"
                      startContent={<Icon icon="lucide:credit-card" />}
                    >
                      Billing
                    </DropdownItem>
                    <DropdownItem 
                      key="logout" 
                      color="danger"
                      startContent={<Icon icon="lucide:log-out" />}
                    >
                      Log Out
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </>
            ) : (
              <>
                <NavbarItem className="hidden lg:flex">
                  <Link to="/login" className="text-white">
                    Login
                  </Link>
                </NavbarItem>
                <NavbarItem>
                  <Button 
                    as={Link} 
                    to="/signup" 
                    color="primary" 
                    variant="flat"
                  >
                    Sign Up
                  </Button>
                </NavbarItem>
              </>
            )}
            
            {/* Mobile menu button */}
            <NavbarItem className="lg:hidden">
              <Button
                isIconOnly
                variant="light"
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-white"
              >
                <Icon icon={menuOpen ? "lucide:x" : "lucide:menu"} width={24} />
              </Button>
            </NavbarItem>
          </NavbarContent>
        </Navbar>
        
        {/* Mobile Menu */}
        {menuOpen && (
          <div className="lg:hidden absolute top-16 left-0 right-0 bg-black/95 backdrop-blur-md z-50">
            <div className="p-4 space-y-2">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  as={Link}
                  to={item.path}
                  variant="light"
                  fullWidth
                  className="justify-start text-white"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Button>
              ))}
              
              {isLoggedIn ? (
                <>
                  <Button
                    as={Link}
                    to="/dashboard"
                    variant="light"
                    fullWidth
                    className="justify-start text-white"
                    startContent={<Icon icon="lucide:layout-dashboard" />}
                    onClick={() => setMenuOpen(false)}
                  >
                    Dashboard
                  </Button>
                  <Button
                    as={Link}
                    to="/notifications"
                    variant="light"
                    fullWidth
                    className="justify-start text-white"
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
                    as={Link}
                    to="/chat"
                    variant="light"
                    fullWidth
                    className="justify-start text-white"
                    startContent={<Icon icon="lucide:message-square" />}
                    onClick={() => setMenuOpen(false)}
                  >
                    Messages
                  </Button>
                  <Button
                    color="danger"
                    variant="flat"
                    fullWidth
                    className="justify-start"
                    startContent={<Icon icon="lucide:log-out" />}
                    onClick={() => {
                      setMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    Log Out
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    as={Link}
                    to="/login"
                    variant="light"
                    fullWidth
                    className="justify-start text-white"
                    onClick={() => setMenuOpen(false)}
                  >
                    Login
                  </Button>
                  <Button
                    as={Link}
                    to="/signup"
                    color="primary"
                    variant="flat"
                    fullWidth
                    onClick={() => setMenuOpen(false)}
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Main Content */}
        <main className="relative z-10">
          <Outlet />
        </main>
        
        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};