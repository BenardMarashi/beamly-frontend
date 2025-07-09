import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardBody, Input, Button, RadioGroup, Radio, Checkbox } from "@nextui-org/react";
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
    
    // Map account type - ensure proper type
    let userType: 'freelancer' | 'client' | 'both';
    
    if (formData.accountType === 'freelancer') {
      userType = 'freelancer';
    } else if (formData.accountType === 'client') {
      userType = 'client';
    } else {
      userType = 'both';
    }
    
    // Fix: Convert 'both' to 'client' for the signUp function
    // The signUp function only accepts 'freelancer' | 'client'
    const signUpUserType: 'freelancer' | 'client' = 
      userType === 'both' ? 'client' : userType;
    
    const result = await signUp(
      formData.email,
      formData.password,
      formData.fullName,
      signUpUserType  // Use the converted type here
    );
    
    if (result) {
      navigate('/create-profile');
    }
  };
  
  const handleGoogleSignup = async () => {
    const result = await signInWithGoogle();
    if (result) {
      navigate('/create-profile');
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="glass-effect">
          <CardBody className="p-8">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Icon icon="lucide:message-circle" className="text-3xl text-beamly-primary" />
                <span className="text-2xl font-bold font-outfit text-white">Beamly</span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Join <span className="text-beamly-secondary">Beamly</span> today
              </h1>
              <p className="text-gray-400">Create your account and start connecting</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                variant="bordered"
                classNames={{
                  input: "bg-transparent",
                  inputWrapper: "bg-white/5 border-white/20"
                }}
                startContent={
                  <Icon icon="lucide:user" className="text-gray-400" />
                }
                required
              />

              <Input
                type="email"
                label="Email Address"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                variant="bordered"
                classNames={{
                  input: "bg-transparent",
                  inputWrapper: "bg-white/5 border-white/20"
                }}
                startContent={
                  <Icon icon="lucide:mail" className="text-gray-400" />
                }
                required
              />

              <Input
                type={showPassword ? "text" : "password"}
                label="Password"
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                variant="bordered"
                classNames={{
                  input: "bg-transparent",
                  inputWrapper: "bg-white/5 border-white/20"
                }}
                startContent={
                  <Icon icon="lucide:lock" className="text-gray-400" />
                }
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-white"
                  >
                    <Icon icon={showPassword ? "lucide:eye-off" : "lucide:eye"} />
                  </button>
                }
                required
              />

              <Input
                type={showConfirmPassword ? "text" : "password"}
                label="Confirm Password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                variant="bordered"
                classNames={{
                  input: "bg-transparent",
                  inputWrapper: "bg-white/5 border-white/20"
                }}
                startContent={
                  <Icon icon="lucide:lock" className="text-gray-400" />
                }
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-400 hover:text-white"
                  >
                    <Icon icon={showConfirmPassword ? "lucide:eye-off" : "lucide:eye"} />
                  </button>
                }
                required
              />

              <RadioGroup
                label="I want to:"
                value={formData.accountType}
                onValueChange={(value) => setFormData({ ...formData, accountType: value })}
                classNames={{
                  label: "text-white"
                }}
              >
                <Radio value="freelancer" classNames={{ label: "text-gray-300" }}>
                  Work as a freelancer
                </Radio>
                <Radio value="client" classNames={{ label: "text-gray-300" }}>
                  Hire for projects
                </Radio>
                <Radio value="both" classNames={{ label: "text-gray-300" }}>
                  Both hire and work
                </Radio>
              </RadioGroup>

              <Checkbox
                isSelected={formData.agreeToTerms}
                onValueChange={(value) => setFormData({ ...formData, agreeToTerms: value })}
                classNames={{
                  label: "text-gray-300 text-sm"
                }}
              >
                I agree to the <Link to="/terms" className="text-beamly-secondary hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-beamly-secondary hover:underline">Privacy Policy</Link>
              </Checkbox>

              <Button
                type="submit"
                color="secondary"
                size="lg"
                className="w-full text-beamly-third font-medium"
                isLoading={loading}
                disabled={loading || !formData.agreeToTerms}
              >
                Create Account
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-gray-400">Or</span>
              </div>
            </div>

            <Button
              variant="bordered"
              size="lg"
              className="w-full"
              onPress={handleGoogleSignup}
              startContent={<Icon icon="flat-color-icons:google" width={20} />}
              disabled={loading}
            >
              Continue with Google
            </Button>

            <p className="text-center mt-6 text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-beamly-secondary hover:underline">
                Log in
              </Link>
            </p>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
};

export default SignupPage;