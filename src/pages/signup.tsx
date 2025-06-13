import React from "react";
import { SignupPage as SignupPageComponent } from "../components/signup-page";
import { useSignUp, useSignIn } from '../hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
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
    const user = await signUp(email, password, fullName);
    if (user) {
      // Update user document with account type and additional data
      await updateDoc(doc(db, 'users', user.uid), {
        userType: accountType,
        ...additionalData
      });
      
      if (onSignup) onSignup();
      navigate('/dashboard');
    }
  };
  
  const handleGoogleSignup = async () => {
    const user = await signInWithGoogle();
    if (user) {
      if (onSignup) onSignup();
      navigate('/dashboard');
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