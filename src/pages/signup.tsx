import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardBody, Input, Button, RadioGroup, Radio, Checkbox, Tabs, Tab } from "@nextui-org/react";
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
    accountType: "freelancer",
    // Add freelancer/company fields to state
    skills: "",
    experience: "",
    companyName: "",
    industry: "",
    agreeToTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  
  const loading = signupLoading || googleLoading;
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Common fields validation
    if (!formData.fullName || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Role-specific validation
    if (formData.accountType === "freelancer") {
      if (!formData.skills || !formData.experience) {
        toast.error('Please fill in skills and experience');
        return;
      }
    } else if (formData.accountType === "client") {
      if (!formData.companyName || !formData.industry) {
        toast.error('Please fill in company name and industry');
        return;
      }
    }
    
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    if (!formData.agreeToTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }
    
    // Determine user type
    const userType = formData.accountType === "freelancer" ? "freelancer" : "client";
    
    const result = await signUp(
      formData.email,
      formData.password,
      formData.fullName,
      userType
    );
    
    if (result) {
      // Store additional profile data for the create-profile page
      const profileData = {
        userType,
        ...(formData.accountType === "freelancer" 
          ? { 
              skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
              experience: parseInt(formData.experience) || 0
            }
          : { 
              companyName: formData.companyName,
              industry: formData.industry
            }
        )
      };
      
      localStorage.setItem('pendingProfileData', JSON.stringify(profileData));
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
    <div className="min-h-[calc(100vh-64px)] overflow-hidden flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="relative bg-mesh w-full">
        <div className="blue-accent blue-accent-1"></div>
        <div className="yellow-accent yellow-accent-2"></div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md w-full mx-auto"
        >
          <div className="text-center mb-8">
            <h2 className="mt-6 text-3xl font-bold text-white font-outfit">
              Join <span className="text-white">Beamly</span> today
            </h2>
            <p className="mt-2 text-gray-300 font-outfit font-light">
              Create your account and start your journey
            </p>
          </div>

          <div className="glass-effect p-8 rounded-2xl">
            <Tabs 
              aria-label="Account type"
              selectedKey={formData.accountType}
              onSelectionChange={(key) => setFormData({ ...formData, accountType: key as string })}
              color="secondary"
              variant="light"
              className="mb-6"
              classNames={{
                tab: "data-[selected=true]:text-beamly-secondary data-[selected=true]:font-medium",
                cursor: "bg-beamly-secondary/20",
                tabList: "bg-white/5 p-1 rounded-xl"
              }}
            >
              <Tab 
                key="freelancer" 
                title={
                  <div className="flex items-center gap-2 px-2">
                    <Icon icon="lucide:briefcase" />
                    <span>Freelancer</span>
                  </div>
                }
              />
              <Tab 
                key="client" 
                title={
                  <div className="flex items-center gap-2 px-2">
                    <Icon icon="lucide:building" />
                    <span>Company</span>
                  </div>
                }
              />
            </Tabs>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-200 mb-1 font-outfit">
                  Full Name
                </label>
                <Input
                  id="fullName"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onValueChange={(value) => setFormData({ ...formData, fullName: value })}
                  startContent={<Icon icon="lucide:user" className="text-gray-400" />}
                  className="bg-white/10 border-white/20"
                  variant="bordered"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-1 font-outfit">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onValueChange={(value) => setFormData({ ...formData, email: value })}
                  startContent={<Icon icon="lucide:mail" className="text-gray-400" />}
                  className="bg-white/10 border-white/20"
                  variant="bordered"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-1 font-outfit">
                  Password
                </label>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onValueChange={(value) => setFormData({ ...formData, password: value })}
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
                  className="bg-white/10 border-white/20"
                  variant="bordered"
                />
                <p className="mt-1 text-xs text-gray-400 font-outfit">
                  Password must be at least 6 characters
                </p>
              </div>

              {formData.accountType === "freelancer" && (
                <>
                  <div>
                    <label htmlFor="skills" className="block text-sm font-medium text-gray-200 mb-1 font-outfit">
                      Skills (separated by commas)
                    </label>
                    <Input
                      id="skills"
                      placeholder="e.g. Web Design, Logo Design"
                      value={formData.skills}
                      onValueChange={(value) => setFormData({ ...formData, skills: value })}
                      startContent={<Icon icon="lucide:code" className="text-gray-400" />}
                      className="bg-white/10 border-white/20"
                      variant="bordered"
                    />
                  </div>
                  <div>
                    <label htmlFor="experience" className="block text-sm font-medium text-gray-200 mb-1 font-outfit">
                      Years of Experience
                    </label>
                    <Input
                      id="experience"
                      type="number"
                      placeholder="Years of experience"
                      value={formData.experience}
                      onValueChange={(value) => setFormData({ ...formData, experience: value })}
                      startContent={<Icon icon="lucide:briefcase" className="text-gray-400" />}
                      className="bg-white/10 border-white/20"
                      variant="bordered"
                    />
                  </div>
                </>
              )}

              {formData.accountType === "client" && (
                <>
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-200 mb-1 font-outfit">
                      Company Name
                    </label>
                    <Input
                      id="company"
                      placeholder="Your company name"
                      value={formData.companyName}
                      onValueChange={(value) => setFormData({ ...formData, companyName: value })}
                      startContent={<Icon icon="lucide:building" className="text-gray-400" />}
                      className="bg-white/10 border-white/20"
                      variant="bordered"
                    />
                  </div>
                  <div>
                    <label htmlFor="industry" className="block text-sm font-medium text-gray-200 mb-1 font-outfit">
                      Industry
                    </label>
                    <Input
                      id="industry"
                      placeholder="e.g. Technology, Healthcare"
                      value={formData.industry}
                      onValueChange={(value) => setFormData({ ...formData, industry: value })}
                      startContent={<Icon icon="lucide:layers" className="text-gray-400" />}
                      className="bg-white/10 border-white/20"
                      variant="bordered"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center">
                <Checkbox 
                  isSelected={formData.agreeToTerms}
                  onValueChange={(value) => setFormData({ ...formData, agreeToTerms: value })}
                  color="secondary"
                  className="text-gray-300"
                >
                  <span className="text-sm font-outfit">
                    I agree to the{" "}
                    <Link to="/terms-of-service" className="text-beamly-secondary hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy-policy" className="text-beamly-secondary hover:underline">
                      Privacy Policy
                    </Link>
                  </span>
                </Checkbox>
              </div>

              <div>
                <Button 
                  color="secondary" 
                  size="lg"
                  className="w-full font-medium font-outfit text-beamly-third"
                  type="submit"
                  isLoading={loading}
                  isDisabled={loading || !formData.agreeToTerms}
                >
                  Create Account
                </Button>
              </div>

              <div className="mt-8 text-center">
                <p className="text-gray-300 font-outfit">
                  Already have an account?{" "}
                  <Link to="/login" className="text-beamly-secondary hover:underline font-medium">
                    Log in
                  </Link>
                </p>
                
                <Button 
                  variant="light" 
                  color="default"
                  startContent={<Icon icon="lucide:arrow-left" />}
                  className="mt-4 text-white"
                  onPress={() => navigate(-1)}
                >
                  Go Back
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SignupPage;