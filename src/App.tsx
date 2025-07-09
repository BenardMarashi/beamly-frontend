import React, { Suspense, lazy, useEffect, useState } from 'react';
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

// Direct imports for pages that export as default
import DashboardPage from './pages/dashboard';
import LoginPage from './pages/login';
import SignupPage from './pages/signup';
import ForgotPasswordPage from './pages/forgot-password';
import HomePage from './pages/home'; // Add HomePage import

// Lazy imports for pages with named exports
const BrowseFreelancersPage = lazy(() => import('./pages/browse-freelancers').then(m => ({ default: m.BrowseFreelancersPage })));
const LookingForWorkPage = lazy(() => import('./pages/looking-for-work').then(m => ({ default: m.LookingForWorkPage })));
const JobDetailsPage = lazy(() => import('./pages/job-details').then(m => ({ default: m.JobDetailsPage })));
const PostJobPage = lazy(() => import('./pages/post-job').then(m => ({ default: m.PostJobPage })));
const CreateProfilePage = lazy(() => import('./pages/create-profile').then(m => ({ default: m.CreateProfilePage })));
const EditProfilePage = lazy(() => import('./pages/profile/edit').then(m => ({ default: m.EditProfilePage })));
const ManageJobsPage = lazy(() => import('./pages/jobs/manage').then(m => ({ default: m.ManageJobsPage })));
const ProposalsPage = lazy(() => import('./pages/proposals'));
const ContractsPage = lazy(() => import('./pages/contracts'));
const AnalyticsPage = lazy(() => import('./pages/analytics'));
const ChatPage = lazy(() => import('./pages/chat'));
const NotificationsPage = lazy(() => import('./pages/notifications'));
const BillingPage = lazy(() => import('./pages/billing'));
const SettingsPage = lazy(() => import('./pages/settings'));

const LoadingFallback = () => (
  <div className="flex justify-center items-center h-screen bg-mesh">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-gray-400">Loading...</p>
    </div>
  </div>
);

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
    return <LoadingFallback />;
  }

  return (
    <Router>
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
          <Route path="browse-freelancers" element={
            <Suspense fallback={<LoadingFallback />}>
              <BrowseFreelancersPage />
            </Suspense>
          } />
          <Route path="looking-for-work" element={
            <Suspense fallback={<LoadingFallback />}>
              <LookingForWorkPage />
            </Suspense>
          } />
          <Route path="jobs/:id" element={
            <Suspense fallback={<LoadingFallback />}>
              <JobDetailsPage />
            </Suspense>
          } />
        </Route>

        {/* Protected routes */}
        <Route element={<ProtectedRoute isLoggedIn={isLoggedIn} />}>
          <Route element={<MainLayout isLoggedIn={isLoggedIn} onLogout={handleLogout} />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="post-job" element={
              <Suspense fallback={<LoadingFallback />}>
                <PostJobPage />
              </Suspense>
            } />
            <Route path="create-profile" element={
              <Suspense fallback={<LoadingFallback />}>
                <CreateProfilePage />
              </Suspense>
            } />
            <Route path="profile/edit" element={
              <Suspense fallback={<LoadingFallback />}>
                <EditProfilePage />
              </Suspense>
            } />
            <Route path="jobs/manage" element={
              <Suspense fallback={<LoadingFallback />}>
                <ManageJobsPage />
              </Suspense>
            } />
            <Route path="proposals" element={
              <Suspense fallback={<LoadingFallback />}>
                <ProposalsPage />
              </Suspense>
            } />
            <Route path="contracts" element={
              <Suspense fallback={<LoadingFallback />}>
                <ContractsPage />
              </Suspense>
            } />
            <Route path="analytics" element={
              <Suspense fallback={<LoadingFallback />}>
                <AnalyticsPage />
              </Suspense>
            } />
            <Route path="chat" element={
              <Suspense fallback={<LoadingFallback />}>
                <ChatPage />
              </Suspense>
            } />
            <Route path="notifications" element={
              <Suspense fallback={<LoadingFallback />}>
                <NotificationsPage />
              </Suspense>
            } />
            <Route path="billing" element={
              <Suspense fallback={<LoadingFallback />}>
                <BillingPage />
              </Suspense>
            } />
            <Route path="settings" element={
              <Suspense fallback={<LoadingFallback />}>
                <SettingsPage />
              </Suspense>
            } />
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