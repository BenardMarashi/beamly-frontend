import React from "react";
import { Route, Routes, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { lazy, Suspense } from "react";
import { Spinner } from "@nextui-org/react";

// Layouts
import { MainLayout } from "./layouts/main-layout";
import { DashboardLayout } from "./layouts/dashboard-layout";

// Add missing ProtectedRoute import
import { ProtectedRoute } from "./components/protected-route";

// Pages
import { HomePage } from "./pages/home";
import { LoginPage } from "./pages/login";
import { SignupPage } from "./pages/signup";
import { BrowseFreelancersPage } from "./pages/browse-freelancers";
import { LookingForWorkPage } from "./pages/looking-for-work";
import { JobDetailsPage } from "./pages/job-details";
import { FreelancerProfilePage } from "./pages/freelancer-profile";
import { NotFoundPage } from "./pages/not-found";
import { MenuPage } from "./pages/menu";
import { ContactPage } from "./pages/contact";
import { HelpPage } from "./pages/help";
import { PrivacyPolicyPage } from "./pages/privacy";
import { TermsOfServicePage } from "./pages/terms";
import { LandingPage } from "./components/landing-page";

// Theme
import { ThemeProvider } from "./contexts/theme-context";

// Optimize routing with lazy loading for better performance
const DashboardPage = lazy(() => import('./pages/dashboard').then(mod => ({ default: mod.DashboardPage })));
const PostJobPage = lazy(() => import('./pages/post-job').then(mod => ({ default: mod.PostJobPage })));
const ChatPage = lazy(() => import('./pages/chat').then(mod => ({ default: mod.ChatPage })));
const NotificationsPage = lazy(() => import('./pages/notifications').then(mod => ({ default: mod.NotificationsPage })));
const BillingPage = lazy(() => import('./pages/billing').then(mod => ({ default: mod.BillingPage })));
const SettingsPage = lazy(() => import('./pages/settings').then(mod => ({ default: mod.SettingsPage })));

const LoadingFallback = () => (
  <div className="flex justify-center items-center h-screen">
    <Spinner color="secondary" size="lg" />
  </div>
);

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Simulate initial loading
  React.useEffect(() => {
    console.log('App component mounted');
    
    // Check if user is logged in (you can add Firebase auth check here)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Handle login/logout
  const handleLogin = () => {
    setIsLoggedIn(true);
    navigate("/dashboard");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    navigate("/");
  };

  // Apply theme class based on stored preference
  React.useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      if (storedTheme === 'dark') {
        document.body.className = 'dark-mode';
      } else if (storedTheme === 'light') {
        document.body.className = 'light-mode';
      } else if (storedTheme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.body.className = prefersDark ? 'dark-mode' : 'light-mode';
      }
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner color="secondary" size="lg" />
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Routes>
        {/* Public routes */}
        <Route element={<MainLayout isLoggedIn={isLoggedIn} onLogout={handleLogout} />}>
          {/* Make landing page the root and move home to protected routes */}
          <Route path="/" element={<LandingPage setCurrentPage={(page) => navigate(`/${page}`)} />} />
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/signup" element={<SignupPage onSignup={handleLogin} />} />
          <Route path="/browse-freelancers" element={<BrowseFreelancersPage />} />
          <Route path="/looking-for-work" element={<LookingForWorkPage />} />
          <Route path="/job/:id" element={<JobDetailsPage />} />
          <Route path="/freelancer/:id" element={<FreelancerProfilePage />} />
          <Route path="/menu" element={<MenuPage isLoggedIn={isLoggedIn} onLogout={handleLogout} />} />
          
          {/* Footer pages */}
          <Route path="/contact-us" element={<ContactPage />} />
          <Route path="/help-support" element={<HelpPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
        </Route>

        {/* Protected routes */}
        <Route element={<ProtectedRoute isLoggedIn={isLoggedIn} />}>
          <Route element={<DashboardLayout />}>
            {/* Add HomePage as a protected route */}
            <Route path="/home" element={<HomePage />} />
            <Route path="/dashboard" element={
              <Suspense fallback={<LoadingFallback />}>
                <DashboardPage />
              </Suspense>
            } />
            <Route path="/jobs/new" element={
              <Suspense fallback={<LoadingFallback />}>
                <PostJobPage />
              </Suspense>
            } />
            <Route path="/chat/:conversationId" element={
              <Suspense fallback={<LoadingFallback />}>
                <ChatPage />
              </Suspense>
            } />
            <Route path="/notifications" element={
              <Suspense fallback={<LoadingFallback />}>
                <NotificationsPage />
              </Suspense>
            } />
            <Route path="/billing" element={
              <Suspense fallback={<LoadingFallback />}>
                <BillingPage />
              </Suspense>
            } />
            <Route path="/settings" element={
              <Suspense fallback={<LoadingFallback />}>
                <SettingsPage />
              </Suspense>
            } />
          </Route>
        </Route>

        {/* 404 fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ThemeProvider>
  );
};

export default App;