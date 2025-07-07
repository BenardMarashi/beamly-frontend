import React, { useState } from "react";
import { motion } from "framer-motion";
import { Input, Button, Card, CardBody, Link, RadioGroup, Radio, Textarea } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { BeamlyLogo } from "./beamly-logo";

interface SignupPageProps {
  onSignup?: () => void;
  onEmailSignup?: (email: string, password: string, fullName: string, accountType: string, additionalData?: any) => Promise<void>;
  onGoogleSignup?: (accountType: string) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export const SignupPage: React.FC<SignupPageProps> = ({ 
  onSignup,
  onEmailSignup,
  onGoogleSignup,
  loading = false,
  error = null
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form data
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [accountType, setAccountType] = useState("freelancer");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [skills, setSkills] = useState("");
  const [bio, setBio] = useState("");
  const [validationError, setValidationError] = useState("");
  
  const handleNext = () => {
    setValidationError("");
    
    if (step === 1) {
      if (!email || !password || !confirmPassword || !fullName) {
        setValidationError("Please fill in all fields");
        return;
      }
      
      if (password !== confirmPassword) {
        setValidationError("Passwords do not match");
        return;
      }
      
      if (password.length < 6) {
        setValidationError("Password must be at least 6 characters");
        return;
      }
      
      setStep(2);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");
    
    if (accountType === 'company' && !companyName) {
      setValidationError("Please enter your company name");
      return;
    }
    
    const additionalData: any = {};
    
    if (accountType === 'company') {
      additionalData.companyName = companyName;
      additionalData.industry = industry;
    } else if (accountType === 'freelancer') {
      additionalData.skills = skills.split(',').map(s => s.trim()).filter(s => s);
      additionalData.bio = bio;
    }
    
    if (onEmailSignup) {
      await onEmailSignup(email, password, fullName, accountType, additionalData);
    }
  };
  
  const handleGoogleSignup = async () => {
    if (onGoogleSignup) {
      await onGoogleSignup(accountType);
    }
  };

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center relative px-4 py-8">
      <div className="blue-accent blue-accent-1"></div>
      <div className="blue-accent blue-accent-2"></div>
      <div className="yellow-accent yellow-accent-1"></div>
      <div className="yellow-accent yellow-accent-2"></div>
      
      <motion.div 
        className="w-full max-w-md z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="glass-card">
          <CardBody className="p-8">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <BeamlyLogo />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                {t('signup.createAccount')}
              </h1>
              <p className="text-gray-400">
                {step === 1 ? t('signup.getStarted') : t('signup.chooseAccountType')}
              </p>
            </div>

            {(error || validationError) && (
              <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg">
                <p className="text-danger text-sm">{error || validationError}</p>
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-4">
                <Input
                  label={t('signup.fullName')}
                  placeholder="John Doe"
                  value={fullName}
                  onValueChange={setFullName}
                  variant="bordered"
                  classNames={{
                    input: "bg-transparent",
                    inputWrapper: "bg-white/5 border-white/20"
                  }}
                  startContent={
                    <Icon icon="lucide:user" className="text-gray-400" />
                  }
                />
                
                <Input
                  type="email"
                  label={t('signup.email')}
                  placeholder="john@example.com"
                  value={email}
                  onValueChange={setEmail}
                  variant="bordered"
                  classNames={{
                    input: "bg-transparent",
                    inputWrapper: "bg-white/5 border-white/20"
                  }}
                  startContent={
                    <Icon icon="lucide:mail" className="text-gray-400" />
                  }
                />
                
                <Input
                  type={showPassword ? "text" : "password"}
                  label={t('signup.password')}
                  placeholder="••••••••"
                  value={password}
                  onValueChange={setPassword}
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
                />
                
                <Input
                  type={showPassword ? "text" : "password"}
                  label={t('signup.confirmPassword')}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onValueChange={setConfirmPassword}
                  variant="bordered"
                  classNames={{
                    input: "bg-transparent",
                    inputWrapper: "bg-white/5 border-white/20"
                  }}
                  startContent={
                    <Icon icon="lucide:lock" className="text-gray-400" />
                  }
                />
                
                <Button 
                  type="submit"
                  color="secondary" 
                  size="lg"
                  className="w-full font-medium"
                  isDisabled={loading}
                >
                  {t('signup.next')}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <RadioGroup
                  label={t('signup.accountType')}
                  value={accountType}
                  onValueChange={setAccountType}
                  className="mb-4"
                >
                  <Radio 
                    value="freelancer" 
                    description="Find work and offer services"
                  >
                    {t('signup.freelancer')}
                  </Radio>
                  <Radio 
                    value="company" 
                    description="Post jobs and hire freelancers"
                  >
                    {t('signup.company')}
                  </Radio>
                  <Radio 
                    value="both" 
                    description="Both post jobs and work as a freelancer"
                  >
                    Both
                  </Radio>
                </RadioGroup>
                
                {accountType === 'company' && (
                  <>
                    <Input
                      label={t('signup.companyName')}
                      placeholder="Acme Inc."
                      value={companyName}
                      onValueChange={setCompanyName}
                      variant="bordered"
                      classNames={{
                        input: "bg-transparent",
                        inputWrapper: "bg-white/5 border-white/20"
                      }}
                    />
                    
                    <Input
                      label={t('signup.industry')}
                      placeholder="Technology"
                      value={industry}
                      onValueChange={setIndustry}
                      variant="bordered"
                      classNames={{
                        input: "bg-transparent",
                        inputWrapper: "bg-white/5 border-white/20"
                      }}
                    />
                  </>
                )}
                
                {accountType === 'freelancer' && (
                  <>
                    <Input
                      label={t('signup.skills')}
                      placeholder="React, Node.js, Design"
                      value={skills}
                      onValueChange={setSkills}
                      variant="bordered"
                      classNames={{
                        input: "bg-transparent",
                        inputWrapper: "bg-white/5 border-white/20"
                      }}
                    />
                    
                    <Textarea
                      label="Brief Bio (Optional)"
                      placeholder="Tell us about yourself..."
                      value={bio}
                      onValueChange={setBio}
                      variant="bordered"
                      classNames={{
                        input: "bg-transparent",
                        inputWrapper: "bg-white/5 border-white/20"
                      }}
                    />
                  </>
                )}
                
                <div className="flex gap-2">
                  <Button 
                    variant="flat"
                    size="lg"
                    className="flex-1"
                    onPress={() => setStep(1)}
                    isDisabled={loading}
                  >
                    {t('signup.back')}
                  </Button>
                  
                  <Button 
                    type="submit"
                    color="secondary" 
                    size="lg"
                    className="flex-1 font-medium"
                    isLoading={loading}
                    isDisabled={loading}
                  >
                    {t('signup.createAccount')}
                  </Button>
                </div>
              </form>
            )}

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-gray-400">
                  {t('signup.orContinueWith')}
                </span>
              </div>
            </div>

            <Button
              variant="bordered"
              size="lg"
              className="w-full border-white/20 text-white"
              startContent={<Icon icon="flat-color-icons:google" width={20} />}
              onPress={handleGoogleSignup}
              isDisabled={loading}
            >
              {t('signup.signUpWithGoogle')}
            </Button>

            <div className="mt-8 text-center">
              <p className="text-gray-400">
                {t('signup.haveAccount')}{" "}
                <Link 
                  className="text-beamly-secondary font-medium"
                  onPress={() => navigate('/login')}
                >
                  {t('signup.login')}
                </Link>
              </p>
            </div>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
};