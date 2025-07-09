import React, { useState } from "react";
import { motion } from "framer-motion";
import { Input, Button, Card, CardBody, Link, RadioGroup, Radio, Checkbox } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { BeamlyLogo } from "./beamly-logo";

interface SignupPageProps {
  loading?: boolean;
  error?: string | null;
}

export const SignupPage: React.FC<SignupPageProps> = ({ 
  loading = false,
  error
}) => {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountType, setAccountType] = useState("freelancer");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle signup logic
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
              <BeamlyLogo className="h-12 w-auto mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">
                {t('signup.join')} <span className="text-beamly-secondary">Beamly</span> {t('signup.today')}
              </h1>
              <p className="text-gray-400">{t('signup.subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label={t('signup.fullName')}
                placeholder={t('signup.fullNamePlaceholder')}
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
                label={t('signup.emailAddress')}
                placeholder={t('signup.emailPlaceholder')}
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
                label="Confirm Password"
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

              <RadioGroup
                label="I want to:"
                value={accountType}
                onValueChange={setAccountType}
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
                isSelected={agreeToTerms}
                onValueChange={setAgreeToTerms}
                classNames={{
                  label: "text-gray-300 text-sm"
                }}
              >
                {t('signup.agreeTerms')} <Link href="/terms" className="text-beamly-secondary">{t('signup.termsOfService')}</Link> {t('signup.and')} <Link href="/privacy" className="text-beamly-secondary">{t('signup.privacyPolicy')}</Link>
              </Checkbox>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-red-500 text-sm">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                color="secondary"
                size="lg"
                className="w-full text-beamly-third font-medium"
                isLoading={loading}
                disabled={loading || !agreeToTerms}
              >
                {t('signup.createAccount')}
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
              startContent={<Icon icon="flat-color-icons:google" width={20} />}
              disabled={loading}
            >
              Continue with Google
            </Button>

            <p className="text-center mt-6 text-gray-400">
              {t('signup.haveAccount')}{' '}
              <Link href="/login" className="text-beamly-secondary hover:underline">
                {t('login.loginButton')}
              </Link>
            </p>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
};