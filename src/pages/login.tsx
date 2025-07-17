// src/pages/login.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input, Button, Checkbox, Card, CardBody } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { BeamlyLogo } from '../components/beamly-logo';
import { useSignIn } from '../hooks/use-auth';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { firebaseService } from '../services/firebase-services';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signInWithEmail, loading } = useSignIn(); // Changed from signIn to signInWithEmail
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    const user = await signInWithEmail(formData.email, formData.password); // Changed from signIn
    if (user) {
      navigate('/dashboard');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if user exists in Firestore - Fixed path
      const userData = await firebaseService.UserService.getUser(result.user.uid); // Changed from firebaseService.getUser
      
      if (!userData) {
        // New user - redirect to complete profile
        navigate('/complete-profile');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      toast.error('Failed to sign in with Google');
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
        {/* Logo */}
        <div className="text-center mb-8">
          <BeamlyLogo className="mx-auto mb-6" />
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
                
                <Button
                  variant="bordered"
                  size="lg"
                  className="w-full border-white/20 text-white hover:bg-white/5"
                  isDisabled
                  startContent={
                    <Icon icon="mdi:github" className="text-xl" />
                  }
                >
                  Continue with GitHub
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