import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardBody, Input, Button, Checkbox, Divider } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { Link, useNavigate } from "react-router-dom";
import { BeamlyLogo } from "../components/beamly-logo";
import { useAuth } from "../contexts/AuthContext";
import { useSignIn } from '../hooks/use-auth';
import { toast } from 'react-hot-toast';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { signInWithEmail, signInWithGoogle, loading } = useSignIn();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    const result = await signInWithEmail(formData.email, formData.password);
    if (result) {
      navigate('/dashboard');
    }
  };
  
  const handleGoogleLogin = async () => {
    const result = await signInWithGoogle();
    if (result) {
      navigate('/dashboard');
    }
  };
  
  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-6">
            <BeamlyLogo />
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400">Sign in to continue to Beamly</p>
        </div>
        
        <Card className="glass-effect border-none">
          <CardBody className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
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
                placeholder="Enter your password"
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
              
              <div className="flex justify-between items-center">
                <Checkbox
                  isSelected={formData.rememberMe}
                  onValueChange={(checked) => setFormData({ ...formData, rememberMe: checked })}
                  size="sm"
                  className="text-gray-400"
                >
                  Remember me
                </Checkbox>
                <Link 
                  to="/forgot-password" 
                  className="text-primary hover:underline text-sm"
                >
                  Forgot password?
                </Link>
              </div>
              
              <Button
                type="submit"
                color="primary"
                size="lg"
                fullWidth
                isLoading={loading}
              >
                Sign In
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
                onClick={handleGoogleLogin}
                isLoading={loading}
              >
                Continue with Google
              </Button>
              
              <Button
                variant="bordered"
                size="lg"
                fullWidth
                startContent={<Icon icon="lucide:github" className="text-white" />}
                isDisabled
              >
                Continue with GitHub
              </Button>
            </div>
          </CardBody>
        </Card>
        
        <div className="mt-8 text-center">
          <p className="text-gray-400">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;