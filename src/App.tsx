import React, { useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { NextUIProvider } from '@nextui-org/react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/theme-context';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Spinner } from '@nextui-org/react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import { UserService } from './services/firebase-services';
import ErrorBoundary from './components/ErrorBoundary';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';

// Layouts - Keep your current layout system
import { MainLayout } from './layouts/main-layout';
import { DashboardLayout } from './layouts/dashboard-layout';

// Regular imports for frequently used pages
import { LandingPage } from './pages/landing';
import { HomePage } from './pages/home';
import LoginPage from './pages/login';
import { SignupPage } from './pages/signup';
import { MessagesPage } from './pages/messages';
import { ConversationsListPage } from './pages/conversations-list';
import { PostProjectPage } from './pages/post-project';
import { FreelancerProfilePage } from './pages/freelancer-profile';


// Lazy load less frequently used pages
const EditProfilePage = lazy(() => import('./pages/profile/edit'));
const DashboardPage = lazy(() => import('./pages/dashboard'));
const BrowseJobsPage = lazy(() => import('./pages/looking-for-work'));
const BrowseFreelancersPage = lazy(() => import('./pages/browse-freelancers'));
const PostJobPage = lazy(() => import('./pages/post-job'));
const JobDetailsPage = lazy(() => import('./pages/job-details'));
const ProposalsPage = lazy(() => import('./pages/proposals'));
const PaymentsPage = lazy(() => import('./pages/payments'));
const SettingsPage = lazy(() => import('./pages/settings'));
const NotificationsPage = lazy(() => import('./pages/notifications'));
const HelpPage = lazy(() => import('./pages/help'));
const TermsPage = lazy(() => import('./pages/terms'));
const PrivacyPage = lazy(() => import('./pages/privacy'));
const NotFoundPage = lazy(() => import('./pages/404'));
const AnalyticsPage = lazy(() => import('./pages/analytics'));
const ManageJobsPage = lazy(() => import('./pages/jobs/manage'));
const PortfolioPage = lazy(() => import('./pages/portfolio/index'));
const ProjectDetailsPage = lazy(() => import('./pages/portfolio/details'));
const ProjectEditPage = lazy(() => import('./pages/portfolio/edit'));
const ClientProposalsPage = lazy(() => import('./pages/client/proposals'));
const FreelancerProposalsPage = lazy(() => import('./pages/freelancer/proposals'));
const ClientPaymentPage = lazy(() => import('./pages/client/payment'));
const BillingPage = lazy(() => import('./pages/billing'));


// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Spinner size="lg" />
  </div>
);

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresAuth?: boolean;
  requiresProfile?: boolean;
  allowedUserTypes?: Array<'client' | 'freelancer' | 'both'>;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiresAuth = true,
  requiresProfile = false,
  allowedUserTypes = []
}) => {
  const { user, userData, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

useEffect(() => {
  // Skip redirects if we're navigating between message pages
  const isMessageRoute = location.pathname.includes('/messages');
  const prevPath = location.state?.from || '';
  const isNavigatingBetweenMessages = isMessageRoute && prevPath.includes('/messages');

  if (!loading && !isNavigatingBetweenMessages) {
    if (requiresAuth && !user) {
      navigate('/login', { state: { from: location.pathname } });
    } else if (requiresProfile && user && !userData?.profileCompleted) {
      navigate('/edit-profile', { state: { from: location.pathname } });
    } else if (allowedUserTypes.length > 0 && userData) {
      const userType = userData.userType;
      if (!allowedUserTypes.includes(userType) && userType !== 'both') {
        navigate('/dashboard');
      }
    }
  }
}, [user, userData, loading, navigate, location, requiresAuth, requiresProfile, allowedUserTypes]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (requiresAuth && !user) {
    return null;
  }

  return <>{children}</>;
};

// Route configuration with your existing layout system
const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public routes with MainLayout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={user ? <Navigate to="/home" /> : <LandingPage />} />
          <Route path="/login" element={user ? <Navigate to="/home" /> : <LoginPage />} />
          <Route path="/signup" element={user ? <Navigate to="/home" /> : <SignupPage />} />
          <Route path="/browse-jobs" element={<BrowseJobsPage />} />
          <Route path="/browse-freelancers" element={<BrowseFreelancersPage />} />
          <Route path="/freelancer/:id" element={<FreelancerProfilePage />} />
          <Route path="/job/:id" element={<JobDetailsPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/looking-for-work" element={<Navigate to="/browse-jobs" replace />} />
          <Route path="/profile/edit" element={<Navigate to="/edit-profile" replace />} />
          <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
          <Route path="/job/manage" element={<ProtectedRoute><ManageJobsPage /></ProtectedRoute>} />
          <Route path="/portfolio" element={<ProtectedRoute><PortfolioPage /></ProtectedRoute>} />
          <Route path="/projects/manage" element={<Navigate to="/portfolio" replace />} />
          <Route path="/chat" element={<Navigate to="/messages" replace />} />
          <Route path="/home" element={<ProtectedRoute ><HomePage /></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetailsPage /></ProtectedRoute>} />
          <Route path="/projects/:id/edit" element={<ProtectedRoute><ProjectEditPage /></ProtectedRoute>} />
        </Route>

        {/* Protected routes with DashboardLayout - but without its own navigation */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          
          <Route path="/profile/:userId" element={
            <ProtectedRoute>
              <FreelancerProfilePage />
            </ProtectedRoute>
          } />
          
          <Route path="/edit-profile" element={
            <ProtectedRoute>
              <EditProfilePage />
            </ProtectedRoute>
          } />

          <Route path="/client/proposals" element={
            <ProtectedRoute requiresProfile={true} allowedUserTypes={['client', 'both']}>
              <ClientProposalsPage />
            </ProtectedRoute>
          } />

          <Route path="/client/payment" element={
            <ProtectedRoute requiresProfile={true} allowedUserTypes={['client', 'both']}>
              <ClientPaymentPage />
            </ProtectedRoute>
          } />

          {/* Freelancer-specific routes */}
          <Route path="/freelancer/proposals" element={
            <ProtectedRoute requiresProfile={true} allowedUserTypes={['freelancer', 'both']}>
              <FreelancerProposalsPage />
            </ProtectedRoute>
          } />
          
          <Route path="/messages" element={
            <ProtectedRoute>
              <ConversationsListPage />
            </ProtectedRoute>
          } />

          <Route path="/messages/:conversationId" element={
            <ProtectedRoute>
              {window.innerWidth < 768 ? <MessagesPage /> : <ConversationsListPage />}
            </ProtectedRoute>
          } />
          
          {/* Job Routes */}
          <Route path="/post-job" element={
            <ProtectedRoute requiresProfile={true} allowedUserTypes={['client', 'both']}>
              <PostJobPage />
            </ProtectedRoute>
          } />
          
          <Route path="/my-jobs" element={
            <ProtectedRoute requiresProfile={true}>
              <BrowseJobsPage />
            </ProtectedRoute>
          } />
          
          {/* Project Routes */}
          <Route path="/post-project" element={
            <ProtectedRoute requiresProfile={true} allowedUserTypes={['freelancer', 'both']}>
              <PostProjectPage />
            </ProtectedRoute>
          } />
          
          {/* Proposals */}
          <Route path="/proposals" element={
            <ProtectedRoute requiresProfile={true}>
              <ProposalsPage />
            </ProtectedRoute>
          } />
          
          <Route path="/job/:jobId/proposals" element={
            <ProtectedRoute requiresProfile={true} allowedUserTypes={['client', 'both']}>
              <ProposalsPage />
            </ProtectedRoute>
          } />
          
          {/* Payments */}
          <Route path="/payments" element={
            <ProtectedRoute requiresProfile={true}>
              <PaymentsPage />
            </ProtectedRoute>
          } />
          
          {/* Billing Route */}
          <Route path="/billing" element={
            <ProtectedRoute>
              <BillingPage />
            </ProtectedRoute>
          } />
          
          {/* Other Protected Routes */}
          <Route path="/notifications" element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

// Main App Component
function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', prefersDark);
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? 'dark' : 'light';
      setTheme(newTheme);
      document.documentElement.classList.toggle('dark', e.matches);
      localStorage.setItem('theme', newTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // Handle auth state changes and update user online status
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Update user online status
        await UserService.updateOnlineStatus(user.uid, true);
        
        // Set up offline detection
        window.addEventListener('beforeunload', async () => {
          await UserService.updateOnlineStatus(user.uid, false);
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <ErrorBoundary>
      <I18nextProvider i18n={i18n}>
        <NextUIProvider>
          <ThemeProvider>
            <Router>
              <AuthProvider>
                <NotificationProvider>
                  <div className="min-h-screen bg-background text-foreground">
                    <Suspense fallback={<LoadingSpinner />}>
                      <AnimatePresence mode="wait">
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <AppRoutes />
                        </motion.div>
                      </AnimatePresence>
                    </Suspense>
                    
                    {/* Toast Notifications */}
                    <Toaster
                      position="top-left"
                      toastOptions={{
                        duration: 1000,
                        style: {
                          marginTop: '80px', // Below header
                          background: 'transparent', // Let CSS handle the styling
                          color: 'inherit',
                          boxShadow: 'none',
                          padding: '0',
                          border: 'none',
                        },
                        // Success toast
                        success: {
                          duration: 1000,
                          iconTheme: {
                            primary: '#10b981',
                            secondary: '#ffffff',
                          },
                        },
                        // Error toast
                        error: {
                          duration: 1000,
                          iconTheme: {
                            primary: '#ef4444',
                            secondary: '#ffffff',
                          },
                        },
                      }}
                      containerStyle={{
                        gap: '8px', // Reduced gap between toasts
                      }}
                    />
                  </div>
                </NotificationProvider>
              </AuthProvider>
            </Router>
          </ThemeProvider>
        </NextUIProvider>
      </I18nextProvider>
    </ErrorBoundary>
  );
}

export default App;