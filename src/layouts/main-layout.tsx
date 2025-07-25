// src/layouts/main-layout.tsx - Updated version

import React, { useState, useEffect } from "react";
import { Outlet, Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { BeamlyLogo } from "../components/beamly-logo";
import { Footer } from "../components/footer";
import { HamburgerMenu } from "../components/hamburger-menu";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/theme-context";
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { toast } from 'react-hot-toast';

export const MainLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Signed out successfully');
      setMenuOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };
  
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
        <header className={`fixed top-0 left-0 right-0 z-40 glass-effect border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200/50'} w-full`}>
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
                <Button
                  isIconOnly
                  variant="light"
                  onPress={() => setMenuOpen(true)}
                  className={`${isDarkMode ? 'text-white hover:bg-white/10' : 'text-gray-800 hover:bg-gray-100'} transition-colors`}
                  aria-label="Open menu"
                >
                  <Icon icon="lucide:menu" className="w-6 h-6" />
                </Button>
              </div>
            </div>
          </div>
        </header>
        
        {/* Hamburger Menu */}
        <HamburgerMenu 
          isOpen={menuOpen} 
          onClose={() => setMenuOpen(false)} 
          isLoggedIn={!!user} 
          onLogout={handleLogout}
        />
        
        {/* Page Content */}
        <main className="relative z-10 pt-20">
          <Outlet />
        </main>
        
        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};