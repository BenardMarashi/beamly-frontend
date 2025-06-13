import React from "react";
import { LoginPage as LoginPageComponent } from "../components/login-page";
import { useSignIn } from '../hooks/use-auth';
import { useNavigate } from 'react-router-dom';

interface LoginPageProps {
  onLogin?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const { signInWithEmail, signInWithGoogle, loading, error: authError } = useSignIn();
  
  const handleEmailLogin = async (email: string, password: string) => {
    const user = await signInWithEmail(email, password);
    if (user) {
      if (onLogin) onLogin();
      navigate('/dashboard');
    }
  };
  
  const handleGoogleLogin = async () => {
    const user = await signInWithGoogle();
    if (user) {
      if (onLogin) onLogin();
      navigate('/dashboard');
    }
  };
  
  return (
    <LoginPageComponent 
      onLogin={onLogin}
      onEmailLogin={handleEmailLogin}
      onGoogleLogin={handleGoogleLogin}
      loading={loading}
      error={authError}
    />
  );
};

export default LoginPage;