// src/components/navigation/Navbar.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { BeamlyLogo } from '../beamly-logo';
import { HamburgerMenu } from '../hamburger-menu';
import { useAuth } from '../../contexts/AuthContext';

export const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    navigate('/');
  };

  return (
    <>
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-40 glass-effect border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <BeamlyLogo />
            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Open menu"
            >
              <Icon icon="lucide:menu" className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Hamburger Menu */}
      <HamburgerMenu 
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        isLoggedIn={!!user} 
        onLogout={handleLogout}
      />
    </>
  );
};