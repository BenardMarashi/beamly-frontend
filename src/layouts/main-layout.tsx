import React, { useState } from "react";
import { Outlet, Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { Button, Avatar } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { BeamlyLogo } from "../components/beamly-logo";
import { Footer } from "../components/footer";
import { HamburgerMenu } from "../components/hamburger-menu";
import { useAuth } from "../contexts/AuthContext";
import { useSignOut } from "../hooks/use-auth";
import { useTheme } from "../contexts/theme-context";

interface MainLayoutProps {
  isLoggedIn?: boolean;
  onLogout?: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ isLoggedIn, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const { signOut } = useSignOut();
  const { isDarkMode } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Use prop or derive from auth context
  const actualIsLoggedIn = isLoggedIn ?? !!user;
  
  const handleLogout = async () => {
    await signOut();
    onLogout?.();
    navigate('/');
  };
  
  const profilePicture = userData?.photoURL || user?.photoURL || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.displayName || user?.displayName || 'User')}&background=0F43EE&color=fff`;
  
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
        
        {/* Glass Effect Header with Hamburger Menu */}
        <header className={`fixed top-0 left-0 right-0 z-50 glass-effect border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200/50'} w-full`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="flex justify-between items-center h-16 w-full relative">
              {/* Logo */}
              <div className="flex-shrink-0">
                <RouterLink to="/" className="cursor-pointer">
                  <BeamlyLogo />
                </RouterLink>
              </div>
              
              {/* Hamburger Menu Button */}
              <div className="relative z-50">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Hamburger menu clicked, current state:', menuOpen);
                    setMenuOpen(!menuOpen);
                  }}
                  className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-white hover:bg-white/10' : 'text-gray-800 hover:bg-gray-100'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/20 touch-manipulation`}
                  aria-label="Open menu"
                  type="button"
                  style={{ 
                    WebkitTapHighlightColor: 'transparent',
                    userSelect: 'none',
                    touchAction: 'manipulation'
                  }}
                >
                  <Icon icon="lucide:menu" width={24} height={24} />
                </button>
              </div>
            </div>
          </div>
        </header>
        
        {/* Glass Effect Hamburger Menu */}
        <HamburgerMenu 
          isOpen={menuOpen} 
          onClose={() => setMenuOpen(false)} 
          isLoggedIn={actualIsLoggedIn} 
          onLogout={handleLogout}
        />
        
        {/* Main Content - will have gradient background in dark mode */}
        <main className="relative z-10 pt-16">
          <Outlet />
        </main>
        
        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};