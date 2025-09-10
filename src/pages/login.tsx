// src/pages/login.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input, Button, Checkbox, Card, CardBody } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useSignIn } from '../hooks/use-auth';
import { signInWithPopup, signInWithRedirect, GoogleAuthProvider, OAuthProvider, getRedirectResult } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { firebaseService } from '../services/firebase-services';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useTranslation } from 'react-i18next';

export default function LoginPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { signInWithEmail, signInWithGoogle, signInWithApple, loading } = useSignIn();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [checkingRedirect, setCheckingRedirect] = useState(true);
  const [authInProgress, setAuthInProgress] = useState(false);

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
              userType: 'freelancer',
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
          } finally {
      setCheckingRedirect(false); // THIS WAS MISSING
    }
    };
    
    handleRedirectResult();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error(t('login.errors.fillFields'));
      return;
    }
    
    const user = await signInWithEmail(formData.email, formData.password);
    if (user) {
      await user.getIdToken();
      navigate('/home', { replace: true });
    }
  };

  const handleGoogleSignIn = async () => {
    if (authInProgress) return;
    
    try {
      setAuthInProgress(true);
      
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      if (auth.currentUser) {
        await auth.signOut();
      }
      
      const result = await signInWithPopup(auth, provider);
      
      if (result?.user) {
        console.log('Google sign-in successful, UID:', result.user.uid);
        
        const userRef = doc(db, 'users', result.user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          console.log('Creating new user document...');
          
          await setDoc(userRef, {
            uid: result.user.uid,
            email: result.user.email || '',
            displayName: result.user.displayName || t('common.googleUser'),
            photoURL: result.user.photoURL || `https://ui-avatars.com/api/?name=User&background=FCE90D&color=011241`,
            userType: 'freelancer',
            profileCompleted: false,
            bio: '',
            skills: [],
            hourlyRate: 0,
            companyName: '',
            isAvailable: true,
            rating: 0,
            reviewCount: 0,
            completedProjects: 0,
            totalEarnings: 0,
            totalSpent: 0,
            isBlocked: false,
            authProvider: 'google.com',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastActive: serverTimestamp()
          });
          
          console.log('User document created successfully');
        } else {
          console.log('User document already exists');
          
          await setDoc(userRef, {
            lastActive: serverTimestamp()
          }, { merge: true });
        }
        
        // Use window.location.replace instead of navigate to ensure popup closes
        await new Promise(resolve => setTimeout(resolve, 200));
        window.location.replace('/home');
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      
      if (error?.code === 'auth/popup-blocked-by-browser') {
        toast.error(t('login.errors.allowPopups'));
      } else if (error?.code === 'auth/cancelled-popup-request' || 
                error?.code === 'auth/popup-closed-by-user') {
        // User cancelled, silent return
      } else {
        toast.error(t('login.errors.failed', { message: error.message }));
      }
    } finally {
      setAuthInProgress(false);
    }
  };

const handleAppleSignIn = async () => {
  if (authInProgress) return;
  
  try {
    setAuthInProgress(true);
    
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');
    
    const result = await signInWithPopup(auth, provider);
    
    if (result?.user) {
      console.log('Apple sign-in successful, UID:', result.user.uid);
      
      const userRef = doc(db, 'users', result.user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        console.log('Creating new user document...');
        
        await setDoc(userRef, {
          uid: result.user.uid,
          email: result.user.email || `${result.user.uid}@privaterelay.appleid.com`,
          displayName: result.user.displayName || t('common.appleUser'),
          photoURL: result.user.photoURL || `https://ui-avatars.com/api/?name=User&background=FCE90D&color=011241`,
          userType: 'freelancer',
          profileCompleted: false,
          bio: '',
          skills: [],
          hourlyRate: 0,
          companyName: '',
          isAvailable: true,
          rating: 0,
          reviewCount: 0,
          completedProjects: 0,
          totalEarnings: 0,
          totalSpent: 0,
          isBlocked: false,
          authProvider: 'apple.com',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastActive: serverTimestamp()
        });
        
        console.log('User document created successfully');
      } else {
        console.log('User document already exists');
        
        await setDoc(userRef, {
          lastActive: serverTimestamp()
        }, { merge: true });
      }
      
      // Use window.location.replace instead of navigate to ensure popup closes
      await new Promise(resolve => setTimeout(resolve, 200));
      window.location.replace('/home');
    }
  } catch (error: any) {
    console.error('Apple sign-in error:', error);
    toast.error(t('login.errors.failed', { message: error.message }));
  } finally {
    setAuthInProgress(false);
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
          <h1 className="text-3xl font-bold text-white mb-2">{t('login.title')}</h1>
          <p className="text-gray-400">{t('login.subtitle')}</p>
        </div>

        {/* Login Form */}
        <Card className="glass-effect border-none">
          <CardBody className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="form-field">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('login.email')}
                </label>
                <Input
                  type="email"
                  placeholder={t('login.emailPlaceholder')}
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
                  {t('login.password')}
                </label>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={t('login.passwordPlaceholder')}
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
                  {t('login.rememberMe')}
                </Checkbox>
                <Link 
                  to="/forgot-password" 
                  className="text-beamly-secondary hover:text-beamly-secondary/80 text-sm transition-colors"
                >
                  {t('login.forgotPassword')}
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
                {t('login.signIn')}
              </Button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-900 text-gray-400">{t('login.or')}</span>
                </div>
              </div>

              {/* Social Login */}
              <div className="space-y-3">
                {/* Apple Sign In - MUST BE FIRST */}
                <Button
                  variant="flat"
                  size="lg"
                  className="w-full bg-black text-white hover:bg-gray-900 border-none"
                  onPress={handleAppleSignIn}
                  isDisabled={authInProgress}
                  isLoading={authInProgress}
                  startContent={
                    !authInProgress && <Icon icon="simple-icons:apple" className="text-xl" />
                  }
                >
                  {authInProgress ? t('login.signingIn', 'Signing in...') : t('login.continueWithApple')}
                </Button>

                {/* Google Sign In */}
                <Button
                  variant="bordered"
                  size="lg"
                  className="w-full border-white/20 text-white hover:bg-white/5"
                  onPress={handleGoogleSignIn}
                  isDisabled={authInProgress}
                  isLoading={authInProgress}
                  startContent={
                    !authInProgress && <Icon icon="flat-color-icons:google" className="text-xl" />
                  }
                >
                  {authInProgress ? t('login.signingIn', 'Signing in...') : t('login.continueWithGoogle')}
                </Button>
              </div>

              {/* Sign Up Link */}
              <div className="text-center mt-6">
                <span className="text-gray-400">{t('login.noAccount')} </span>
                <Link 
                  to="/signup" 
                  className="text-beamly-secondary hover:text-beamly-secondary/80 font-medium transition-colors"
                >
                  {t('login.signUp')}
                </Link>
              </div>
            </form>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
}