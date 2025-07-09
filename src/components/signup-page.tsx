import React from "react";
import { motion } from "framer-motion";
import { Input, Button, Link, Tabs, Tab, Checkbox } from "@nextui-org/react";
import { Icon } from "@iconify/react";

interface SignupPageProps {
  onSignup?: () => void;
  setCurrentPage?: (page: string) => void;
}

// BeamlyLogo component
const BeamlyLogo: React.FC = () => (
  <div className="flex items-center gap-2">
    <div className="w-10 h-10 rounded-full bg-[#FFE000] flex items-center justify-center">
      <span className="text-black font-bold text-xl">b</span>
    </div>
    <span className="text-white font-bold text-2xl">Beamly</span>
  </div>
);

export const SignupPage: React.FC<SignupPageProps> = ({ onSignup, setCurrentPage }) => {
  const [selected, setSelected] = React.useState("freelancer");
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [companyName, setCompanyName] = React.useState("");
  const [industry, setIndustry] = React.useState("");
  const [agreeTerms, setAgreeTerms] = React.useState(false);
  
  const handleSubmit = () => {
    console.log("Signup attempt with:", { fullName, email, password, agreeTerms, selected });
    
    // Validate form
    if (!fullName || !email || !password || !confirmPassword || !agreeTerms) {
      console.error("All fields are required and terms must be accepted");
      return;
    }
    
    if (password !== confirmPassword) {
      console.error("Passwords do not match");
      return;
    }
    
    // Additional validation for company accounts
    if (selected === "company" && (!companyName || !industry)) {
      console.error("Company name and industry are required for company accounts");
      return;
    }
    
    // Call the onSignup prop to handle account creation
    if (onSignup) onSignup();
  };

  const handleGoBack = () => {
    if (setCurrentPage) {
      setCurrentPage('home');
    } else {
      window.history.back();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0d1a] flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full mx-auto"
      >
        <div className="text-center mb-8">
          <div className="inline-block mb-6">
            <BeamlyLogo />
          </div>
          <h2 className="text-3xl font-bold text-white">
            Join <span className="text-[#FFE000]">Beamly</span> today
          </h2>
          <p className="mt-2 text-gray-300">
            Create your account and start connecting
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur p-8 rounded-2xl border border-white/10">
          <Tabs 
            aria-label="Account type"
            selectedKey={selected}
            onSelectionChange={setSelected as any}
            color="warning"
            variant="light"
            className="mb-6"
            classNames={{
              tab: "data-[selected=true]:text-[#FFE000] text-white",
              cursor: "bg-[#FFE000]/20",
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
              key="company" 
              title={
                <div className="flex items-center gap-2 px-2">
                  <Icon icon="lucide:building" />
                  <span>Company</span>
                </div>
              }
            />
          </Tabs>

          <div className="space-y-6">
            <div>
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                value={fullName}
                onValueChange={setFullName}
                startContent={<Icon icon="lucide:user" className="text-gray-400" />}
                variant="bordered"
                classNames={{
                  label: "text-gray-300",
                  input: "text-white",
                  inputWrapper: "bg-white/5 border-white/20 hover:border-white/30"
                }}
              />
            </div>

            <div>
              <Input
                label="Email Address"
                type="email"
                placeholder="Enter your email"
                value={email}
                onValueChange={setEmail}
                startContent={<Icon icon="lucide:mail" className="text-gray-400" />}
                variant="bordered"
                classNames={{
                  label: "text-gray-300",
                  input: "text-white",
                  inputWrapper: "bg-white/5 border-white/20 hover:border-white/30"
                }}
              />
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                placeholder="Create a strong password"
                value={password}
                onValueChange={setPassword}
                startContent={<Icon icon="lucide:lock" className="text-gray-400" />}
                variant="bordered"
                classNames={{
                  label: "text-gray-300",
                  input: "text-white",
                  inputWrapper: "bg-white/5 border-white/20 hover:border-white/30"
                }}
              />
              <p className="mt-1 text-xs text-gray-400">
                Password must be at least 8 characters with numbers and special characters
              </p>
            </div>

            <div>
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onValueChange={setConfirmPassword}
                startContent={<Icon icon="lucide:lock" className="text-gray-400" />}
                variant="bordered"
                classNames={{
                  label: "text-gray-300",
                  input: "text-white",
                  inputWrapper: "bg-white/5 border-white/20 hover:border-white/30"
                }}
              />
            </div>

            {selected === "company" && (
              <>
                <div>
                  <Input
                    label="Company Name"
                    placeholder="Your company name"
                    value={companyName}
                    onValueChange={setCompanyName}
                    startContent={<Icon icon="lucide:building" className="text-gray-400" />}
                    variant="bordered"
                    classNames={{
                      label: "text-gray-300",
                      input: "text-white",
                      inputWrapper: "bg-white/5 border-white/20 hover:border-white/30"
                    }}
                  />
                </div>
                <div>
                  <Input
                    label="Industry"
                    placeholder="e.g., Technology, Marketing, Healthcare"
                    value={industry}
                    onValueChange={setIndustry}
                    startContent={<Icon icon="lucide:layers" className="text-gray-400" />}
                    variant="bordered"
                    classNames={{
                      label: "text-gray-300",
                      input: "text-white",
                      inputWrapper: "bg-white/5 border-white/20 hover:border-white/30"
                    }}
                  />
                </div>
              </>
            )}

            <div className="flex items-center">
              <Checkbox 
                isSelected={agreeTerms}
                onValueChange={setAgreeTerms}
                color="warning"
                classNames={{
                  label: "text-gray-300 text-sm",
                  wrapper: "before:border-white/20"
                }}
              >
                <span className="text-sm">
                  I agree to the{" "}
                  <Link className="text-[#FFE000] hover:underline cursor-pointer">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link className="text-[#FFE000] hover:underline cursor-pointer">
                    Privacy Policy
                  </Link>
                </span>
              </Checkbox>
            </div>

            <div>
              <Button 
                color="warning"
                size="lg"
                className="w-full bg-[#FFE000] text-black font-medium"
                type="button"
                isDisabled={!agreeTerms}
                onPress={handleSubmit}
              >
                Create Account
              </Button>
            </div>

            <div className="mt-8 text-center">
              <p className="text-gray-300">
                Already have an account?{" "}
                <Link 
                  className="text-[#FFE000] hover:underline cursor-pointer"
                  onPress={() => setCurrentPage && setCurrentPage('login')}
                >
                  Log in
                </Link>
              </p>
              
              <Button 
                variant="light" 
                color="default"
                startContent={<Icon icon="lucide:arrow-left" />}
                className="mt-4 text-white"
                onPress={handleGoBack}
              >
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};