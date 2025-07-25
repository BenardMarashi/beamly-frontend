// src/components/payments/StripeConnectOnboarding.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button, Chip, Progress } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useAuth } from '../../contexts/AuthContext';
import { StripeService } from '../../services/stripe-service';
import toast from 'react-hot-toast';

interface StripeConnectOnboardingProps {
  onComplete?: () => void;
}

export const StripeConnectOnboarding: React.FC<StripeConnectOnboardingProps> = ({ onComplete }) => {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    checkAccountStatus();
  }, [user?.uid]);

  const checkAccountStatus = async () => {
    if (!user?.uid) return;
    
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
        const result = await StripeService.createConnectAccount(user.uid);
        if (result.success && result.onboardingUrl) {
          window.location.href = result.onboardingUrl;
          return;
        }
      }
      
      // Create account link for existing account
      const returnUrl = `${window.location.origin}/billing?stripe_connect=success`;
      const refreshUrl = `${window.location.origin}/billing?stripe_connect=refresh`;
      
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
        variant="flat"
        color={enabled ? "success" : "warning"}
      >
        {label}
      </Chip>
    );
  };

  const getProgress = () => {
    let progress = 0;
    if (accountStatus.exists) progress += 25;
    if (accountStatus.detailsSubmitted) progress += 25;
    if (accountStatus.chargesEnabled) progress += 25;
    if (accountStatus.payoutsEnabled) progress += 25;
    return progress;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex gap-3">
        <div className="bg-primary/10 p-3 rounded-full">
          <Icon icon="lucide:credit-card" className="text-2xl text-primary" />
        </div>
        <div className="flex flex-col">
          <p className="text-lg font-semibold">Payment Account Setup</p>
          <p className="text-sm text-gray-500">Set up your account to receive payments</p>
        </div>
      </CardHeader>
      <CardBody className="gap-4">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">Setup Progress</span>
              <span className="text-sm font-medium">{getProgress()}%</span>
            </div>
            <Progress 
              value={getProgress()} 
              color={getProgress() === 100 ? "success" : "primary"}
              className="mb-4"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {getStatusChip(accountStatus.exists, "Account Created")}
            {getStatusChip(accountStatus.detailsSubmitted, "Details Submitted")}
            {getStatusChip(accountStatus.chargesEnabled, "Payments Enabled")}
            {getStatusChip(accountStatus.payoutsEnabled, "Payouts Enabled")}
          </div>

          {getProgress() < 100 && (
            <>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                <h4 className="font-medium mb-2">Why set up payments?</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex gap-2">
                    <Icon icon="lucide:check" className="text-green-500 mt-0.5" />
                    <span>Receive payments directly to your bank account</span>
                  </li>
                  <li className="flex gap-2">
                    <Icon icon="lucide:check" className="text-green-500 mt-0.5" />
                    <span>Automatic invoicing and tax documentation</span>
                  </li>
                  <li className="flex gap-2">
                    <Icon icon="lucide:check" className="text-green-500 mt-0.5" />
                    <span>Secure payment processing with Stripe</span>
                  </li>
                  <li className="flex gap-2">
                    <Icon icon="lucide:check" className="text-green-500 mt-0.5" />
                    <span>Fast payouts (usually within 2-7 days)</span>
                  </li>
                </ul>
              </div>

              <Button
                color="primary"
                size="lg"
                className="w-full"
                onPress={handleStartOnboarding}
                isLoading={loading}
                startContent={!loading && <Icon icon="lucide:arrow-right" />}
              >
                {accountStatus.exists ? 'Complete Setup' : 'Start Setup'}
              </Button>
            </>
          )}

          {getProgress() === 100 && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
              <Icon icon="lucide:check-circle" className="text-4xl text-green-500 mb-2" />
              <h4 className="font-medium text-green-700 dark:text-green-300">
                Payment account fully set up!
              </h4>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                You can now receive payments for your work.
              </p>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};