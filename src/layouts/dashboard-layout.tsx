// src/layouts/dashboard-layout.tsx - FIXED VERSION WITHOUT NAVIGATION

import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/theme-context';

export const DashboardLayout: React.FC = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen relative">
      <div className="relative z-10">
        {/* Main Content - no header since MainLayout handles navigation */}
        <main className="relative z-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};