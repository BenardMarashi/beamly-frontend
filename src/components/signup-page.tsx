import React from "react";
import { motion } from "framer-motion";
import { Input, Button, Link, Tabs, Tab, Checkbox } from "@heroui/react";
import { Icon } from "@iconify/react";
import { BeamlyLogo } from "./beamly-logo";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/theme-context";

interface SignupPageProps {
  onSignup?: () => void;
  onEmailSignup?: (email: string, password: string, fullName: string, accountType: string, additionalData?: any) => Promise<void>;
  onGoogleSignup?: () => Promise<void>;
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
  const [selected, setSelected] = React.useState("freelancer");
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [agreeTerms, setAgreeTerms] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  
  // Additional fields
  const [skills, setSkills] = React.useState("");
  const [experience, setExperience] = React.useState("");
  const [companyName, setCompanyName] = React.useState("");
  const [industry, setIndustry] = React.useState("");
  
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName || !email || !password || !agreeTerms) {
      return;
    }
    
    if (onEmailSignup) {
      const additionalData = selected === "freelancer" 
        ? { skills: skills.split(',').map(s => s.trim()), experience }
        : { companyName, industry };
        
      await onEmailSignup(email, password, fullName, selected, additionalData);
    }
  };

  const handleGoogleSignup = async () => {
    if (onGoogleSignup) {
      await onGoogleSignup();
    }
  };

  const freelancerFields = (
    <>
      <div>
        <label htmlFor="skills" className="block text-sm font-medium text-gray-200 mb-1 font-outfit">
          {t('signup.skills')}
        </label>
        <Input
          id="skills"
          placeholder={t('signup.skillsPlaceholder')}
          value={skills}
          onValueChange={setSkills}
          startContent={<Icon icon="lucide:code" className="text-gray-400" />}
          className="bg-white/10 border-white/20"
          variant="bordered"
        />
      </div>
      <div>
        <label htmlFor="experience" className="block text-sm font-medium text-gray-200 mb-1 font-outfit">
          {t('signup.experience')}
        </label>
        <Input
          id="experience"
          type="number"
          placeholder={t('signup.experiencePlaceholder')}
          value={experience}
          onValueChange={setExperience}
          startContent={<Icon icon="lucide:briefcase" className="text-gray-400" />}
          className="bg-white/10 border-white/20"
          variant="bordered"
        />
      </div>
    </>
  );

  const companyFields = (
    <>
      <div>
        <label htmlFor="company" className="block text-sm font-medium text-gray-200 mb-1 font-outfit">
          {t('signup.companyName')}
        </label>
        <Input
          id="company"
          placeholder={t('signup.companyNamePlaceholder')}
          value={companyName}
          onValueChange={setCompanyName}
          startContent={<Icon icon="lucide:building" className="text-gray-400" />}
          className="bg-white/10 border-white/20"
          variant="bordered"
        />
      </div>
      <div>
        <label htmlFor="industry" className="block text-sm font-medium text-gray-200 mb-1 font-outfit">
          {t('signup.industry')}
        </label>
        <Input
          id="industry"
          placeholder={t('signup.industryPlaceholder')}
          value={industry}
          onValueChange={setIndustry}
          startContent={<Icon icon="lucide:layers" className="text-gray-400" />}
          className="bg-white/10 border-white/20"
          variant="bordered"
        />
      </div>
    </>
  );

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
              {t('signup.join')} <span className={isDarkMode ? "text-white" : "text-gray-900"}>Beamly</span> {t('signup.today')}
            </h2>
            <p className="mt-2 text-gray-300 font-outfit font-light">
              {t('signup.subtitle')}
            </p>
          </div>

          <div className="glass-effect p-8 rounded-2xl">
            <Tabs 
              aria-label={t('signup.accountType')}
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
                    <span>{t('signup.freelancer')}</span>
                  </div>
                }
              />
              <Tab 
                key="company" 
                title={
                  <div className="flex items-center gap-2 px-2">
                    <Icon icon="lucide:building" />
                    <span>{t('signup.company')}</span>
                  </div>
                }
              />
            </Tabs>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-200 mb-1 font-outfit">
                  {t('signup.fullName')}
                </label>
                <Input
                  id="fullName"
                  placeholder={t('signup.fullNamePlaceholder')}
                  value={fullName}
                  onValueChange={setFullName}
                  startContent={<Icon icon="lucide:user" className="text-gray-400" />}
                  className="bg-white/10 border-white/20"
                  variant="bordered"
                  isRequired
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-1 font-outfit">
                  {t('signup.emailAddress')}
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('signup.emailPlaceholder')}
                  value={email}
                  onValueChange={setEmail}
                  startContent={<Icon icon="lucide:mail" className="text-gray-400" />}
                  className="bg-white/10 border-white/20"
                  variant="bordered"
                  isRequired
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-1 font-outfit">
                  {t('signup.password')}
                </label>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t('signup.passwordPlaceholder')}
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
                <p className="mt-1 text-xs text-gray-400 font-outfit">
                  {t('signup.passwordHint')}
                </p>
              </div>

              {selected === "freelancer" ? freelancerFields : companyFields}

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-red-500 text-sm flex items-center gap-2">
                    <Icon icon="lucide:alert-circle" />
                    {error}
                  </p>
                </div>
              )}

              <div className="flex items-center">
                <Checkbox 
                  isSelected={agreeTerms}
                  onValueChange={setAgreeTerms}
                  color="secondary"
                  className="text-gray-300"
                >
                  <span className="text-sm font-outfit">
                    {t('signup.agreeTerms')}{" "}
                    <Link href="/terms-of-service" className="text-beamly-secondary hover:underline">
                      {t('signup.termsOfService')}
                    </Link>{" "}
                    {t('signup.and')}{" "}
                    <Link href="/privacy-policy" className="text-beamly-secondary hover:underline">
                      {t('signup.privacyPolicy')}
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
                  isDisabled={!agreeTerms || loading}
                  isLoading={loading}
                >
                  {t('signup.createAccount')}
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
              onPress={handleGoogleSignup}
              isDisabled={loading}
            >
              Sign up with Google
            </Button>

            <div className="mt-8 text-center">
              <p className="text-gray-300 font-outfit">
                {t('signup.haveAccount')}{" "}
                <Link href="/login" className="text-beamly-secondary hover:underline font-medium">
                  {t('signup.login')}
                </Link>
              </p>
              
              <Button 
                variant="light" 
                color="default"
                startContent={<Icon icon="lucide:arrow-left" />}
                className="mt-4 text-white"
                onPress={() => window.history.back()}
              >
                {t('signup.goBack')}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};