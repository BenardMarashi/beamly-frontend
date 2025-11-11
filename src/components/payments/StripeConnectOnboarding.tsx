// src/components/payments/StripeConnectOnboarding.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button, Chip, Progress, Select, SelectItem } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useAuth } from '../../contexts/AuthContext';
import { StripeService } from '../../services/stripe-service';
import toast from 'react-hot-toast';

interface StripeConnectOnboardingProps {
  onComplete?: () => void;
}

interface Country {
  code: string;
  name: string;
  currency: string;
}

export const StripeConnectOnboarding: React.FC<StripeConnectOnboardingProps> = ({ onComplete }) => {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  //const [countries, setCountries] = useState<Country[]>([]);
  //const [selectedCountry, setSelectedCountry] = useState('CZ');
  const [accountStatus, setAccountStatus] = useState<{
    exists: boolean;
    detailsSubmitted: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
  }>({
    exists: false,
    detailsSubmitted: false,
    chargesEnabled: false,
    payoutsEnabled: false,
  });

  /*useEffect(() => {
    checkAccountStatus();
    fetchCountries();
  }, [user?.uid]);*/

  // Check for success return from Stripe
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('stripe_connect') === 'success') {
      toast.success('Payment setup completed successfully!');
      checkAccountStatus();
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      if (onComplete) {
        onComplete();
      }
    }
  }, []);

  /*const fetchCountries = async () => {
    const result = await StripeService.getSupportedCountries();
    if (result.success && result.countries) {
      setCountries(result.countries);
    }
  };*/

  const checkAccountStatus = async () => {
    if (!user?.uid || !userData?.stripeConnectAccountId) return;
    
    setLoading(true);
    try {
      const result = await StripeService.getConnectAccountStatus(user.uid);
      if (result.success) {
        setAccountStatus({
          exists: true,
          detailsSubmitted: result.detailsSubmitted || false,
          chargesEnabled: result.chargesEnabled || false,
          payoutsEnabled: result.payoutsEnabled || false,
        });
        
        if (result.chargesEnabled && result.payoutsEnabled && onComplete) {
          onComplete();
        }
      }
    } catch (error) {
      console.error('Error checking account status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartOnboarding = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      let accountId = userData?.stripeConnectAccountId;
      
      // Create account if doesn't exist
      if (!accountId) {
        const result = await StripeService.createConnectAccount(user.uid, 'CZ');
        if (result.success && result.onboardingUrl) {
          window.location.href = result.onboardingUrl;
          return;
        } else if (!result.success) {
          toast.error(result.error?.message || 'Failed to create payment account');
          setLoading(false);
          return;
        }
      }
      
      // Create account link for existing account
      const returnUrl = `${window.location.origin}/profile/edit?stripe_connect=success`;
      const refreshUrl = `${window.location.origin}/profile/edit?stripe_connect=refresh`;
      
      const result = await StripeService.createConnectAccountLink(
        user.uid,
        returnUrl,
        refreshUrl
      );
      
      if (result.success && result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error('Error starting onboarding:', error);
      toast.error('Failed to start onboarding process');
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (enabled: boolean, label: string) => {
    return (
      <Chip
        startContent={<Icon icon={enabled ? "lucide:check" : "lucide:x"} />}
        color={enabled ? "success" : "default"}
        variant="flat"
        size="sm"
      >
        {label}
      </Chip>
    );
  };

  // If account already exists and is active
  if (userData?.stripeConnectAccountId && accountStatus.chargesEnabled) {
    return (
      <Card className="glass-effect border-none">
        <CardBody>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Icon icon="lucide:check-circle" className="text-2xl text-green-500" />
              </div>
              <div>
                <h4 className="font-semibold">Payment Account Active</h4>
                <p className="text-sm text-gray-400">
                  You can receive payments for your work
                  {userData.stripeConnectCountry && ` • Country: ${userData.stripeConnectCountry}`}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              {getStatusChip(accountStatus.chargesEnabled, "Charges Enabled")}
              {getStatusChip(accountStatus.payoutsEnabled, "Payouts Enabled")}
              {getStatusChip(accountStatus.detailsSubmitted, "Details Submitted")}
            </div>
            
            <Button
              variant="light"
              onPress={() => window.location.href = '/profile/payment-settings'}
              endContent={<Icon icon="lucide:arrow-right" />}
            >
              Manage Payment Settings
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  // If account exists but onboarding incomplete
  if (userData?.stripeConnectAccountId && !accountStatus.chargesEnabled) {
    return (
      <Card className="glass-effect border-none">
        <CardBody>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Icon icon="lucide:alert-circle" className="text-2xl text-yellow-500" />
              </div>
              <div>
                <h4 className="font-semibold">Complete Your Payment Setup</h4>
                <p className="text-sm text-gray-400">
                  Your account needs additional information to receive payments
                </p>
              </div>
            </div>
            
            {loading ? (
              <Progress size="sm" isIndeterminate className="max-w-md" />
            ) : (
              <Button
                color="primary"
                onPress={handleStartOnboarding}
                startContent={<Icon icon="lucide:external-link" />}
              >
                Continue Setup
              </Button>
            )}
          </div>
        </CardBody>
      </Card>
    );
  }

  // Initial setup - no account yet
  return (
    <Card className="glass-effect border-none">
      <CardBody>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon icon="lucide:credit-card" className="text-2xl text-primary" />
            </div>
            <div>
              <h4 className="font-semibold">Set Up Payment Account</h4>
              <p className="text-sm text-gray-400">
                Required to receive payments for your work
              </p>
            </div>
          </div>
          
          <div className="bg-white/5 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Icon icon="lucide:check" className="text-green-500" />
              <span>Secure payments powered by Stripe</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Icon icon="lucide:check" className="text-green-500" />
              <span>Get paid directly to your bank account</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Icon icon="lucide:check" className="text-green-500" />
              <span>10% platform fee on completed projects</span>
            </div>
          </div>

          {/*/<Select
            label="Select Your Country"
            placeholder="Choose your country"
            selectedKeys={[selectedCountry]}
            onSelectionChange={(keys) => setSelectedCountry(Array.from(keys)[0] as string)}
            className="max-w-md"
            classNames={{
              trigger: "bg-white/5 border-white/20 hover:border-white/30",
              value: "text-white"
            }}
          >
            {countries.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                <div className="flex items-center justify-between w-full">
                  <span>{country.name}</span>
                  <span className="text-sm text-gray-400">{country.currency}</span>
                </div>
              </SelectItem>
            ))}
          </Select>*/}
          
          <Button
            color="primary"
            size="lg"
            onPress={handleStartOnboarding}
            isLoading={loading}
            startContent={<Icon icon="lucide:arrow-right" />}
            className="w-full sm:w-auto"
          >
            Start Setup
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};

export default StripeConnectOnboarding;