import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardBody, Input, Button, RadioGroup, Radio, Checkbox, Divider } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useSignUp, useSignIn } from '../hooks/use-auth';
import { toast } from 'react-hot-toast';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { signUp, loading: signupLoading } = useSignUp();
  const { signInWithGoogle, loading: googleLoading } = useSignIn();
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    accountType: "freelancer",
    agreeToTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const loading = signupLoading || googleLoading;
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    if (!formData.agreeToTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }
    
    // Map account type
    const userType = formData.accountType === 'both' ? 'both' : 
                    formData.accountType === 'freelancer' ? 'freelancer' : 'client';
    
    const result = await signUp(
      formData.email, 
      formData.password, 
      formData.fullName,
      userType
    );
    
    if (result) {
      navigate('/dashboard');
    }
  };
  
  const handleGoogleSignup = async () => {
    const result = await signInWithGoogle();
    if (result) {
      navigate('/dashboard');
    }
  };
  
  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-gray-400">Join Beamly to start your journey</p>
        </div>
        
        <Card className="glass-effect border-none">
          <CardBody className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                variant="bordered"
                className="text-white"
                startContent={<Icon icon="lucide:user" className="text-gray-400" />}
                isRequired
              />
              
              <Input
                type="email"
                label="Email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                variant="bordered"
                className="text-white"
                startContent={<Icon icon="lucide:mail" className="text-gray-400" />}
                isRequired
              />
              
              <Input
                type={showPassword ? "text" : "password"}
                label="Password"
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                variant="bordered"
                className="text-white"
                startContent={<Icon icon="lucide:lock" className="text-gray-400" />}
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Icon icon={showPassword ? "lucide:eye-off" : "lucide:eye"} />
                  </button>
                }
                isRequired
              />
              
              <Input
                type={showConfirmPassword ? "text" : "password"}
                label="Confirm Password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                variant="bordered"
                className="text-white"
                startContent={<Icon icon="lucide:lock" className="text-gray-400" />}
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Icon icon={showConfirmPassword ? "lucide:eye-off" : "lucide:eye"} />
                  </button>
                }
                isRequired
              />
              
              <div>
                <p className="text-sm text-gray-400 mb-3">I want to:</p>
                <RadioGroup
                  value={formData.accountType}
                  onValueChange={(value) => setFormData({ ...formData, accountType: value })}
                  color="primary"
                >
                  <Radio value="freelancer" className="text-gray-300">
                    Work as a Freelancer
                  </Radio>
                  <Radio value="client" className="text-gray-300">
                    Hire Freelancers
                  </Radio>
                  <Radio value="both" className="text-gray-300">
                    Both (Freelance & Hire)
                  </Radio>
                </RadioGroup>
              </div>
              
              <Checkbox
                isSelected={formData.agreeToTerms}
                onValueChange={(checked) => setFormData({ ...formData, agreeToTerms: checked })}
                size="sm"
                className="text-gray-400"
              >
                I agree to the{" "}
                <Link to="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </Checkbox>
              
              <Button
                type="submit"
                color="primary"
                size="lg"
                fullWidth
                isLoading={loading}
              >
                Create Account
              </Button>
            </form>
            
            <div className="my-6">
              <div className="relative">
                <Divider />
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-4 text-gray-400 text-sm">
                  OR
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <Button
                variant="bordered"
                size="lg"
                fullWidth
                startContent={
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                }
                onClick={handleGoogleSignup}
                isLoading={loading}
              >
                Sign up with Google
              </Button>
              
              <Button
                variant="bordered"
                size="lg"
                fullWidth
                startContent={<Icon icon="lucide:github" className="text-white" />}
                isDisabled
              >
                Sign up with GitHub
              </Button>
            </div>
          </CardBody>
        </Card>
        
        <div className="mt-8 text-center">
          <p className="text-gray-400">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SignupPage;