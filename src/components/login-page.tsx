import React from "react";
import { motion } from "framer-motion";
import { Input, Button, Link, Tabs, Tab, Checkbox } from "@heroui/react";
import { Icon } from "@iconify/react";
import { BeamlyLogo } from "./beamly-logo";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/theme-context";

interface LoginPageProps {
  onLogin?: () => void;
  onEmailLogin?: (email: string, password: string) => Promise<void>;
  onGoogleLogin?: () => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export const LoginPage: React.FC<LoginPageProps> = ({ 
  onLogin,
  onEmailLogin,
  onGoogleLogin,
  loading = false,
  error = null
}) => {
  const [selected, setSelected] = React.useState("freelancer");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [rememberMe, setRememberMe] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
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
            <Link href="/" className="inline-block">
              <BeamlyLogo />
            </Link>
            <h2 className="mt-6 text-3xl font-bold text-white font-outfit">
              {t('login.welcomeBack')} <span className={isDarkMode ? "text-white" : "text-gray-900"}>Beamly</span>
            </h2>
            <p className="mt-2 text-gray-300 font-outfit font-light">
              {t('login.subtitle')}
            </p>
          </div>

          <div className="glass-effect p-8 rounded-2xl">
            <Tabs 
              aria-label={t('login.accountType')}
              selectedKey={selected}
              onSelectionChange={setSelected as any}
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
                    <span>{t('login.freelancer')}</span>
                  </div>
                }
              />
              <Tab 
                key="company" 
                title={
                  <div className="flex items-center gap-2 px-2">
                    <Icon icon="lucide:building" />
                    <span>{t('login.company')}</span>
                  </div>
                }
              />
            </Tabs>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-1 font-outfit">
                  {t('login.emailAddress')}
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('login.emailPlaceholder')}
                  value={email}
                  onValueChange={setEmail}
                  startContent={<Icon icon="lucide:mail" className="text-gray-400" />}
                  endContent={
                    showPassword && (
                      <button
                        type="button"
                        onClick={() => setShowPassword(false)}
                        className="text-gray-400"
                      >
                        <Icon icon="lucide:eye-off" />
                      </button>
                    )
                  }
                  className="bg-white/10 border-white/20"
                  variant="bordered"
                  isRequired
                />
              </div>

              <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-200 font-outfit">
                  {t('login.password')}
                </label>
                <Button
                  variant="light"
                  size="sm"
                  className="text-sm text-beamly-secondary hover:underline font-outfit p-0 h-auto min-w-0"
                  onPress={() => {
                    console.log("Forgot password link clicked");
                    // Later you can implement password reset
                    // navigate('/forgot-password');
                  }}
                >
                  {t('login.forgotPassword')}
                </Button>
              </div>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={t('login.passwordPlaceholder')}
                value={password}
                onValueChange={setPassword}
                startContent={<Icon icon="lucide:lock" className="text-gray-400" />}
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400"
                  >
                    <Icon icon={showPassword ? "lucide:eye-off" : "lucide:eye"} />
                  </button>
                }
                className="bg-white/10 border-white/20"
                variant="bordered"
                isRequired
              />
            </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-red-500 text-sm flex items-center gap-2">
                    <Icon icon="lucide:alert-circle" />
                    {error}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Checkbox 
                  isSelected={rememberMe}
                  onValueChange={setRememberMe}
                  color="secondary"
                  className="text-gray-300"
                >
                  <span className="text-sm font-outfit">{t('login.rememberMe')}</span>
                </Checkbox>
              </div>

              <div>
                <Button 
                  color="secondary" 
                  size="lg"
                  className="w-full font-medium font-outfit text-beamly-third"
                  type="submit"
                  isLoading={loading}
                  isDisabled={loading || !email || !password}
                >
                  {t('login.loginButton')}
                </Button>
              </div>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#010b29] text-gray-400">Or continue with</span>
              </div>
            </div>

            <Button
              variant="bordered"
              className="w-full border-white/20 text-white"
              startContent={<Icon icon="flat-color-icons:google" width={20} />}
              onPress={handleGoogleSignIn}
              isDisabled={loading}
            >
              Sign in with Google
            </Button>

            <div className="mt-8 text-center">
              <p className="text-gray-300 font-outfit">
                {t('login.noAccount')}{" "}
                <Link href="/signup" className="text-beamly-secondary hover:underline font-medium">
                  {t('login.signUp')}
                </Link>
              </p>
              
              <Button 
                variant="light" 
                color="default"
                startContent={<Icon icon="lucide:arrow-left" />}
                className="mt-4 text-white"
                onPress={() => window.history.back()}
              >
                {t('login.goBack')}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};