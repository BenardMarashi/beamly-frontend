import React from "react";
import { LoginPage as LoginPageComponent } from "../components/login-page";
import { useSignIn } from '../hooks/use-auth';

interface LoginPageProps {
  onLogin?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  // Make sure we properly import the component
  const { signInWithEmail, signInWithGoogle, loading, error: authError } = useSignIn();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ... existing validation ...
    
    try {
      const user = await signInWithEmail(email, password);
      if (user) {
        onLogin();
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };
  
  const handleGoogleSignIn = async () => {
    try {
      const user = await signInWithGoogle();
      if (user) {
        onLogin();
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
    }
  };
  
  return <LoginPageComponent onLogin={onLogin} />;
};

export default LoginPage;