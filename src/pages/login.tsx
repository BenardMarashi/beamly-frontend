// src/pages/login.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input, Button, Checkbox, Card, CardBody } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useSignIn } from '../hooks/use-auth';
import { signInWithPopup, GoogleAuthProvider, getRedirectResult } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { firebaseService } from '../services/firebase-services';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';


export default function LoginPage() {
  const navigate = useNavigate();
  const { signInWithEmail, loading } = useSignIn(); // Changed from signIn to signInWithEmail
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
useEffect(() => {
  // Handle redirect result for mobile
  const handleRedirectResult = async () => {
    try {
      const result = await getRedirectResult(auth);
      if (result?.user) {
        await result.user.getIdToken(true);
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const userData = await firebaseService.UserService.getUser(result.user.uid);
        
        if (!userData) {
          const userRef = doc(db, 'users', result.user.uid);
          await setDoc(userRef, {
            uid: result.user.uid,
            email: result.user.email || '',
            displayName: result.user.displayName || '',
            photoURL: result.user.photoURL || '',
            userType: 'both',
            profileCompleted: false,
            bio: '',
            skills: [],
            hourlyRate: 0,
            companyName: '',
            isAvailable: true,
            rating: 0,
            reviewCount: 0,
            completedProjects: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          navigate('/complete-profile', { replace: true });
        } else {
          navigate('/home', { replace: true });
        }
      }
    } catch (error: any) {
      if (error?.code && error.code !== 'auth/popup-closed-by-user') {
        console.error('Redirect result error:', error);
      }
    }
  };
  
  handleRedirectResult();
}, [navigate]);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!formData.email || !formData.password) {
    toast.error('Please fill in all fields');
    return;
  }
  
  const user = await signInWithEmail(formData.email, formData.password);
  if (user) {
    await user.getIdToken();
    navigate('/home', { replace: true });
  }
};

const handleGoogleSignIn = async () => {
  try {
    const provider = new GoogleAuthProvider();
    
    // Force account selection - crucial for mobile
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    // Clear any existing auth state first
    if (auth.currentUser) {
      await auth.signOut();
    }
    
    // Always use popup for native experience
    const result = await signInWithPopup(auth, provider);
    
    if (result?.user) {
      // Ensure auth token is ready
      await result.user.getIdToken(true); // Force token refresh
      
      // Add a small delay to ensure Firestore is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if user data exists
      const userData = await firebaseService.UserService.getUser(result.user.uid);
      
      if (!userData) {
        // Create user document directly with Firestore
        const userRef = doc(db, 'users', result.user.uid);
        await setDoc(userRef, {
          uid: result.user.uid,
          email: result.user.email || '',
          displayName: result.user.displayName || '',
          photoURL: result.user.photoURL || '',
          userType: 'both',
          profileCompleted: false,
          bio: '',
          skills: [],
          hourlyRate: 0,
          companyName: '',
          isAvailable: true,
          rating: 0,
          reviewCount: 0,
          completedProjects: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        navigate('/complete-profile', { replace: true });
      } else {
        navigate('/home', { replace: true });
      }
    }
  } catch (error: any) {
    // Handle specific error codes
    if (error?.code === 'auth/popup-blocked-by-browser') {
      toast.error('Please allow popups for this site to sign in with Google');
    } else if (error?.code === 'auth/cancelled-popup-request') {
      // User closed the popup - don't show error
      return;
    } else if (error?.code === 'auth/popup-closed-by-user') {
      // User closed the popup - don't show error
      return;
    } else if (error?.code === 'auth/unauthorized-domain') {
      toast.error('This domain is not authorized for Google sign-in');
    } else if (error?.code === 'auth/operation-not-allowed') {
      toast.error('Google sign-in is not enabled. Please contact support.');
    } else {
      console.error('Google sign in error:', error);
      toast.error('Failed to sign in with Google. Please try again.');
    }
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400">Sign in to continue to Beamly</p>
        </div>

        {/* Login Form */}
        <Card className="glass-effect border-none">
          <CardBody className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="form-field">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  variant="bordered"
                  size="lg"
                  classNames={{
                    input: "text-white",
                    inputWrapper: "bg-white/5 border-white/20 hover:border-white/30 data-[hover=true]:bg-white/10"
                  }}
                  startContent={
                    <Icon icon="solar:letter-bold" className="text-gray-400 text-xl" />
                  }
                />
              </div>

              {/* Password Field */}
              <div className="form-field">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  variant="bordered"
                  size="lg"
                  classNames={{
                    input: "text-white",
                    inputWrapper: "bg-white/5 border-white/20 hover:border-white/30 data-[hover=true]:bg-white/10"
                  }}
                  startContent={
                    <Icon icon="solar:lock-password-bold" className="text-gray-400 text-xl" />
                  }
                  endContent={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <Icon 
                        icon={showPassword ? "solar:eye-closed-bold" : "solar:eye-bold"} 
                        className="text-xl"
                      />
                    </button>
                  }
                />
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <Checkbox
                  isSelected={formData.rememberMe}
                  onValueChange={(checked) => setFormData({ ...formData, rememberMe: checked })}
                  size="sm"
                  classNames={{
                    label: "text-gray-300 text-sm"
                  }}
                >
                  Remember me
                </Checkbox>
                <Link 
                  to="/forgot-password" 
                  className="text-beamly-secondary hover:text-beamly-secondary/80 text-sm transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                color="primary"
                size="lg"
                className="w-full bg-beamly-secondary text-beamly-primary font-semibold"
                isLoading={loading}
              >
                Sign In
              </Button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-900 text-gray-400">OR</span>
                </div>
              </div>

              {/* Social Login */}
              <div className="space-y-3">
                <Button
                  variant="bordered"
                  size="lg"
                  className="w-full border-white/20 text-white hover:bg-white/5"
                  onPress={handleGoogleSignIn}
                  startContent={
                    <Icon icon="flat-color-icons:google" className="text-xl" />
                  }
                >
                  Continue with Google
                </Button>
              </div>

              {/* Sign Up Link */}
              <div className="text-center mt-6">
                <span className="text-gray-400">Don't have an account? </span>
                <Link 
                  to="/signup" 
                  className="text-beamly-secondary hover:text-beamly-secondary/80 font-medium transition-colors"
                >
                  Sign up
                </Link>
              </div>
            </form>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
};