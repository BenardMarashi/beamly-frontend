import React from "react";
import { motion } from "framer-motion";
import { Input, Button, Link, Tabs, Tab, Checkbox } from "@heroui/react";
import { Icon } from "@iconify/react";
import { BeamlyLogo } from "./beamly-logo";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/theme-context";

interface LoginPageProps {
  onLogin?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [selected, setSelected] = React.useState("freelancer");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [rememberMe, setRememberMe] = React.useState(false);
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login attempt with:", { email, password, rememberMe });
    // Validate form
    if (!email || !password) {
      // Add validation and error handling
      console.error("Email and password are required");
      return;
    }
    // Call the onLogin prop to handle authentication
    if (onLogin) onLogin();
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
                  className="bg-white/10 border-white/20"
                  variant="bordered"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-200 font-outfit">
                    {t('login.password')}
                  </label>
                  <Link href="/forgot-password" className="text-sm text-beamly-secondary hover:underline font-outfit"
                    onPress={(e) => {
                      e.preventDefault();
                      console.log("Forgot password link clicked");
                      // No navigation, just a log
                    }}
                  >
                    {t('login.forgotPassword')}
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('login.passwordPlaceholder')}
                  value={password}
                  onValueChange={setPassword}
                  startContent={<Icon icon="lucide:lock" className="text-gray-400" />}
                  className="bg-white/10 border-white/20"
                  variant="bordered"
                />
              </div>

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
                  onPress={() => {
                    if (onLogin) onLogin(); // Add this line to fix the login button
                  }}
                >
                  {t('login.loginButton')}
                </Button>
              </div>
            </form>

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