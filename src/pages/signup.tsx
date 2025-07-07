import React from "react";
import { SignupPage as SignupPageComponent } from "../components/signup-page";
import { useSignUp, useSignIn } from '../hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface SignupPageProps {
  onSignup?: () => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({ onSignup }) => {
  const navigate = useNavigate();
  const { signUp, loading: signupLoading, error: signupError } = useSignUp();
  const { signInWithGoogle, loading: googleLoading } = useSignIn();
  
  const handleEmailSignup = async (
    email: string, 
    password: string, 
    fullName: string, 
    accountType: string,
    additionalData?: any
  ) => {
    // Map account type from form to database userType
    const userType = accountType === 'freelancer' ? 'freelancer' : 
                    accountType === 'company' ? 'client' : 
                    'both';
    
    const user = await signUp(email, password, fullName, userType);
    if (user) {
      try {
        // Create complete user profile
        const userProfileData = {
          uid: user.uid,
          email: user.email || '',
          displayName: fullName,
          photoURL: user.photoURL || '',
          userType: userType,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastActive: serverTimestamp(),
          completedProjects: 0,
          rating: 0,
          totalEarnings: 0,
          totalSpent: 0,
          isVerified: false,
          isBlocked: false,
          isAvailable: userType === 'freelancer' || userType === 'both',
          skills: additionalData?.skills || [],
          bio: additionalData?.bio || '',
          hourlyRate: additionalData?.hourlyRate || 0,
          location: additionalData?.location || '',
          companyName: additionalData?.companyName || '',
          industry: additionalData?.industry || '',
          profileCompleted: false,
          notifications: {
            email: true,
            push: true,
            sms: false
          }
        };
        
        // Use setDoc to ensure all fields are set
        await setDoc(doc(db, 'users', user.uid), userProfileData);
        
        console.log('User profile created with type:', userType);
        
        if (onSignup) onSignup();
        navigate('/dashboard');
      } catch (error) {
        console.error('Error creating user profile:', error);
        navigate('/profile-setup');
      }
    }
  };
  
  const handleGoogleSignup = async (accountType: string) => {
    const user = await signInWithGoogle();
    if (user) {
      try {
        // Check if user profile exists
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          // New user - create profile with selected account type
          const userType = accountType === 'freelancer' ? 'freelancer' : 
                          accountType === 'company' ? 'client' : 
                          'both';
          
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            userType: userType,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastActive: serverTimestamp(),
            completedProjects: 0,
            rating: 0,
            totalEarnings: 0,
            totalSpent: 0,
            isVerified: false,
            isBlocked: false,
            isAvailable: true,
            skills: [],
            bio: '',
            hourlyRate: 0,
            location: '',
            companyName: '',
            industry: '',
            profileCompleted: false,
            notifications: {
              email: true,
              push: true,
              sms: false
            }
          });
          
          console.log('Google user profile created with type:', userType);
        } else {
          // Existing user - check if they have userType set
          const userData = userSnap.data();
          if (!userData.userType) {
            // Update existing user with userType
            await updateDoc(userRef, {
              userType: accountType === 'freelancer' ? 'freelancer' : 
                       accountType === 'company' ? 'client' : 
                       'both',
              updatedAt: serverTimestamp()
            });
          }
        }
        
        if (onSignup) onSignup();
        navigate('/dashboard');
      } catch (error) {
        console.error('Error handling Google signup:', error);
        navigate('/profile-setup');
      }
    }
  };
  
  const loading = signupLoading || googleLoading;
  const error = signupError;
  
  return (
    <SignupPageComponent 
      onSignup={onSignup}
      onEmailSignup={handleEmailSignup}
      onGoogleSignup={handleGoogleSignup}
      loading={loading}
      error={error}
    />
  );
};

export default SignupPage;