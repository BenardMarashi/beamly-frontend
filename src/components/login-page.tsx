import React, { useState } from "react";
import { motion } from "framer-motion";
import { Input, Button, Card, CardBody, Link } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";


interface LoginPageProps {
  onEmailLogin?: (email: string, password: string) => Promise<void>;
  onGoogleLogin?: () => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export const LoginPage: React.FC<LoginPageProps> = ({ 
  onEmailLogin,
  onGoogleLogin,
  loading = false,
  error = null
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState("");
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");
    
    if (!email || !password) {
      setValidationError("Please fill in all fields");
      return;
    }
    
    if (onEmailLogin) {
      await onEmailLogin(email, password);
    }
  };
  
  const handleGoogleSignIn = async () => {
    if (onGoogleLogin) {
      await onGoogleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center relative px-4">
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
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                {t('login.welcomeBack')}
              </h1>
              <p className="text-gray-400">
                {t('login.signInToContinue')}
              </p>
            </div>

            {(error || validationError) && (
              <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg">
                <p className="text-danger text-sm">{error || validationError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                label={t('login.email')}
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
                label={t('login.password')}
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
              
              <div className="flex justify-end">
                <Link 
                  size="sm" 
                  className="text-beamly-secondary"
                  onPress={() => navigate('/forgot-password')}
                >
                  {t('login.forgotPassword')}
                </Link>
              </div>
              
              <Button 
                type="submit"
                color="secondary" 
                size="lg"
                className="w-full font-medium"
                isLoading={loading}
                isDisabled={loading}
              >
                {t('login.loginButton')}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-gray-400">
                  {t('login.orContinueWith')}
                </span>
              </div>
            </div>

            <Button
              variant="bordered"
              size="lg"
              className="w-full border-white/20 text-white"
              startContent={<Icon icon="flat-color-icons:google" width={20} />}
              onPress={handleGoogleSignIn}
              isDisabled={loading}
            >
              {t('login.signInWithGoogle')}
            </Button>

            <div className="mt-8 text-center">
              <p className="text-gray-400">
                {t('login.noAccount')}{" "}
                <Link 
                  className="text-beamly-secondary font-medium"
                  onPress={() => navigate('/signup')}
                >
                  {t('login.signUp')}
                </Link>
              </p>
            </div>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
};