import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NextUIProvider } from '@nextui-org/react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/theme-context';
import { MainLayout } from './layouts/main-layout';
import { ProtectedRoute } from './components/protected-route';
import { NotFoundPage } from './pages/not-found';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';

// Direct imports for all pages to avoid lazy loading issues
import DashboardPage from './pages/dashboard';
import LoginPage from './pages/login';
import SignupPage from './pages/signup';
import ForgotPasswordPage from './pages/forgot-password';
import HomePage from './pages/home';
import BrowseFreelancersPage from './pages/browse-freelancers';
import LookingForWorkPage from './pages/looking-for-work';
import JobDetailsPage from './pages/job-details';
import FreelancerProfilePage from './pages/freelancer-profile';
import PostJobPage from './pages/post-job';
import PostProjectPage from './pages/post-project';
import CreateProfilePage from './pages/create-profile';
import EditProfilePage from './pages/profile/edit';
import ManageJobsPage from './pages/jobs/manage';
import ManageProjectsPage from './pages/projects/manage';
import ProposalsPage from './pages/proposals';
import AnalyticsPage from './pages/analytics';
import ChatPage from './pages/chat';
import NotificationsPage from './pages/notifications';
import BillingPage from './pages/billing';
import SettingsPage from './pages/settings';
import JobApplyPage from './pages/job-apply';


const AppContent: React.FC = () => {
  const { loading } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner size="large" />;
  }

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<MainLayout isLoggedIn={isLoggedIn} onLogout={handleLogout} />}>
          <Route index element={
            isLoggedIn ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <HomePage /> // Show HomePage directly for unlogged users
            )
          } />
          <Route path="home" element={
            isLoggedIn ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <HomePage /> // Add /home route
            )
          } />
          <Route path="login" element={
            isLoggedIn ? <Navigate to="/dashboard" replace /> : <LoginPage />
          } />
          <Route path="signup" element={
            isLoggedIn ? <Navigate to="/dashboard" replace /> : <SignupPage />
          } />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="browse-freelancers" element={<BrowseFreelancersPage />} />
          <Route path="looking-for-work" element={<LookingForWorkPage />} />
          <Route path="jobs/:id" element={<JobDetailsPage />} />
          <Route path="jobs/:id/apply" element={<JobApplyPage />} />
          <Route path="freelancer/:id" element={<FreelancerProfilePage />} />
        </Route>

        {/* Protected routes */}
        <Route element={<ProtectedRoute isLoggedIn={isLoggedIn} />}>
          <Route element={<MainLayout isLoggedIn={isLoggedIn} onLogout={handleLogout} />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="post-job" element={<PostJobPage />} />
            <Route path="post-project" element={<PostProjectPage />} />
            <Route path="create-profile" element={<CreateProfilePage />} />
            <Route path="profile/edit" element={<EditProfilePage />} />
            <Route path="jobs/manage" element={<ManageJobsPage />} />
            <Route path="projects/manage" element={<ManageProjectsPage />} />
            <Route path="proposals" element={<ProposalsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* 404 route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <NextUIProvider>
        <ThemeProvider>
          <AuthProvider>
            <AppContent />
            <Toaster position="top-right" />
          </AuthProvider>
        </ThemeProvider>
      </NextUIProvider>
    </ErrorBoundary>
  );
}

export default App;