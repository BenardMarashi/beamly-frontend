import React from "react";
import { SignupPage as SignupPageComponent } from "../components/signup-page";
import { useSignUp } from '../hooks/use-auth';

interface SignupPageProps {
  onSignup?: () => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({ onSignup }) => {
  const { signUp, loading, error: authError } = useSignUp();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ... existing validation ...
    
    try {
      const user = await signUp(email, password, name);
      if (user) {
        onSignup();
      }
    } catch (error) {
      console.error('Signup error:', error);
    }
  };
  
  return <SignupPageComponent onSignup={onSignup} />;
};

export default SignupPage;