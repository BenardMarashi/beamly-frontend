// src/components/payments/ProSubscription.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button, Chip, RadioGroup, Radio } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useAuth } from '../../contexts/AuthContext';
import { StripeService } from '../../services/stripe-service';
import toast from 'react-hot-toast';

const SUBSCRIPTION_PLANS = [
  {
    id: 'free',
    name: 'Free Forever',
    price: 0,
    interval: '',
    savings: 0,
    features: [
      '5 proposals per month',
      'Partial analytics',
      'Basic profile visibility',
      '15% commission on earnings'
    ]
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: 9.99,
    interval: 'month',
    savings: 0,
    features: [
      'Unlimited proposals per month',
      'Profile promotion',
      'Full analytics dashboard',
      '0% commission - keep 100% of earnings',
      'Priority support'
    ]
  },
  {
    id: 'sixmonths',
    name: '6 Months',
    price: 47.99,
    interval: '6 months',
    savings: 20,
    isPopular: true,
    features: [
      'Everything in Monthly plan',
      'Save 20% compared to monthly',
      'Extended profile promotion',
      '0% commission - keep 100% of earnings',
      'Premium support'
    ]
  }
];

export const ProSubscription: React.FC = () => {
  const { user, userData } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<{
    isActive: boolean;
    plan?: string;
    endDate?: Date;
  }>({ isActive: false });

  // Check if user is on free plan (no active subscription)
  const isFreePlan = !currentSubscription.isActive;

  useEffect(() => {
    checkSubscriptionStatus();
  }, [user?.uid]);

  const checkSubscriptionStatus = async () => {
    if (!user?.uid) return;
    
    const result = await StripeService.getSubscriptionStatus(user.uid);
    if (result.success) {
      setCurrentSubscription({
        isActive: result.isActive || false,
        plan: result.plan,
        endDate: result.endDate?.toDate()
      });
    }
  };

  const handleSubscribe = async () => {
    if (!user?.uid) return;
    
    if (selectedPlan === 'free') {
      toast('You are already on the free plan');
      return;
    }
    
    setLoading(true);
    try {
// Map our plan IDs to what StripeService expects
      const stripePlanId = selectedPlan === 'sixmonths' ? 'quarterly' : selectedPlan;

      const result = await StripeService.createSubscriptionCheckout(
        user.uid,
        stripePlanId as 'monthly' | 'quarterly' | 'yearly'
      );
      
      if (result.success && result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to create checkout session');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user?.uid || !window.confirm('Are you sure you want to cancel your subscription? You will return to the free plan with 15% commission.')) return;
    
    setLoading(true);
    try {
      const result = await StripeService.cancelSubscription(user.uid);
      if (result.success) {
        toast.success('Subscription cancelled successfully');
        checkSubscriptionStatus();
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  if (currentSubscription.isActive) {
    return (
      <Card className="w-full max-w-2xl mx-auto glass-effect">
        <CardHeader className="flex gap-3">
          <div className="bg-yellow-400/20 p-3 rounded-full">
            <Icon icon="lucide:crown" className="text-2xl text-yellow-400" />
          </div>
          <div className="flex flex-col">
            <p className="text-lg font-semibold text-white">Pro Subscription Active</p>
            <p className="text-sm text-gray-400">
              {currentSubscription.plan === 'sixmonths' ? '6 Months' : 'Monthly'} plan • Renews {currentSubscription.endDate?.toLocaleDateString()}
            </p>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div className="bg-green-500/10 rounded-lg p-4">
              <h4 className="font-medium text-green-400 mb-2">
                Your Pro Benefits
              </h4>
              <ul className="space-y-2 text-sm">
                {SUBSCRIPTION_PLANS.find(p => p.id === currentSubscription.plan)?.features.map((feature, index) => (
                  <li key={index} className="flex gap-2 text-gray-300">
                    <Icon icon="lucide:check-circle" className="mt-0.5 text-green-400" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <Button
              color="danger"
              variant="flat"
              className="w-full"
              onPress={handleCancelSubscription}
              isLoading={loading}
            >
              Cancel Subscription
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto glass-effect">
      <CardHeader className="flex gap-3">
        <div className="bg-yellow-400/20 p-3 rounded-full">
          <Icon icon="lucide:crown" className="text-2xl text-yellow-400" />
        </div>
        <div className="flex flex-col">
          <p className="text-lg font-semibold text-white">Upgrade to Pro</p>
          <p className="text-sm text-gray-400">Remove commission fees and unlock unlimited proposals</p>
        </div>
      </CardHeader>
      <CardBody>
        <RadioGroup
          value={selectedPlan}
          onValueChange={setSelectedPlan}
          className="w-full"
        >
          <div className="grid md:grid-cols-3 gap-4">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <Card
                key={plan.id}
                className={`relative cursor-pointer transition-all glass-card ${
                  selectedPlan === plan.id
                    ? 'ring-2 ring-yellow-400 shadow-lg'
                    : 'hover:shadow-md'
                } ${isFreePlan && plan.id === 'free' ? 'ring-2 ring-gray-500' : ''}`}
                isPressable
                onPress={() => plan.id !== 'free' && setSelectedPlan(plan.id)}
              >
                {plan.isPopular && (
                  <Chip
                    color="warning"
                    size="sm"
                    className="absolute -top-2 right-4 z-10"
                  >
                    Save 20%
                  </Chip>
                )}
                {isFreePlan && plan.id === 'free' && (
                  <Chip
                    color="default"
                    size="sm"
                    className="absolute -top-2 left-4 z-10"
                  >
                    Current Plan
                  </Chip>
                )}
                <CardBody className="p-6">
                  {plan.id !== 'free' && (
                    <Radio
                      value={plan.id}
                      className="absolute top-4 right-4"
                    />
                  )}
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                    <div className="mt-2">
                      {plan.price === 0 ? (
                        <span className="text-3xl font-bold text-white">Free</span>
                      ) : (
                        <>
                          <span className="text-3xl font-bold text-white">${plan.price}</span>
                          <span className="text-gray-400">/{plan.interval}</span>
                        </>
                      )}
                    </div>
                    {plan.savings > 0 && (
                      <p className="text-sm text-green-400 mt-1">
                        Save {plan.savings}% vs monthly
                      </p>
                    )}
                  </div>
                  <ul className="space-y-2 text-sm">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex gap-2">
                        <Icon 
                          icon="lucide:check" 
                          className={`mt-0.5 flex-shrink-0 ${
                            feature.includes('15% commission') ? 'text-red-400' : 'text-green-400'
                          }`}
                        />
                        <span className={
                          feature.includes('15% commission') ? 'text-gray-400' : 
                          feature.includes('0% commission') ? 'text-green-400 font-medium' : 
                          'text-gray-300'
                        }>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            ))}
          </div>
        </RadioGroup>
        
        <div className="mt-8 space-y-4">
          <Button
            color="secondary"
            size="lg"
            className="w-full"
            onPress={handleSubscribe}
            isLoading={loading}
            isDisabled={selectedPlan === 'free'}
            startContent={!loading && <Icon icon="lucide:credit-card" />}
          >
            {selectedPlan === 'free' 
              ? 'Already on Free Plan' 
              : `Subscribe to ${SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan)?.name} Plan`}
          </Button>
          
          <div className="bg-blue-500/10 rounded-lg p-4">
            <div className="flex gap-3">
              <Icon icon="lucide:info" className="text-blue-400 mt-0.5" />
              <div className="text-sm text-gray-300">
                <p className="font-medium mb-1">Commission Information</p>
                <p>Free plan: 15% commission on all earnings</p>
                <p>Paid plans: 0% commission - keep 100% of your earnings</p>
              </div>
            </div>
          </div>
          
          <p className="text-center text-sm text-gray-500">
            Cancel anytime • Secure payment by Stripe • Instant activation
          </p>
        </div>
      </CardBody>
    </Card>
  );
};