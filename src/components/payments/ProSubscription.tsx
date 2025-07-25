// src/components/payments/ProSubscription.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button, Chip, RadioGroup, Radio } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useAuth } from '../../contexts/AuthContext';
import { StripeService } from '../../services/stripe-service';
import toast from 'react-hot-toast';

const SUBSCRIPTION_PLANS = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: 19.99,
    interval: 'month',
    savings: 0,
    features: [
      'Appear first in search results',
      'Priority proposal visibility',
      'Advanced analytics',
      'Unlimited proposals',
      'Profile badge',
      'Direct client contact'
    ]
  },
  {
    id: 'quarterly',
    name: 'Quarterly',
    price: 49.99,
    interval: '3 months',
    savings: 10,
    features: [
      'All Monthly features',
      'Save 17% compared to monthly',
      'Featured profile highlight',
      'Priority support'
    ]
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: 179.99,
    interval: 'year',
    savings: 25,
    isPopular: true,
    features: [
      'All Quarterly features',
      'Save 25% compared to monthly',
      'Annual profile boost',
      'Exclusive job opportunities',
      'Premium badge'
    ]
  }
];

export const ProSubscription: React.FC = () => {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [loading, setLoading] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<{
    isActive: boolean;
    plan?: string;
    endDate?: Date;
  }>({ isActive: false });

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
    
    setLoading(true);
    try {
      const result = await StripeService.createSubscriptionCheckout(
        user.uid,
        selectedPlan as 'monthly' | 'quarterly' | 'yearly'
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
    if (!user?.uid || !window.confirm('Are you sure you want to cancel your subscription?')) return;
    
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
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="flex gap-3">
          <div className="bg-primary/10 p-3 rounded-full">
            <Icon icon="lucide:crown" className="text-2xl text-primary" />
          </div>
          <div className="flex flex-col">
            <p className="text-lg font-semibold">Pro Subscription Active</p>
            <p className="text-sm text-gray-500">
              {currentSubscription.plan} plan • Renews {currentSubscription.endDate?.toLocaleDateString()}
            </p>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <h4 className="font-medium text-green-700 dark:text-green-300 mb-2">
                Your Pro Benefits
              </h4>
              <ul className="space-y-2 text-sm">
                {SUBSCRIPTION_PLANS.find(p => p.id === currentSubscription.plan)?.features.map((feature, index) => (
                  <li key={index} className="flex gap-2 text-green-600 dark:text-green-400">
                    <Icon icon="lucide:check-circle" className="mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <Button
              color="danger"
              variant="light"
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
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex gap-3">
        <div className="bg-primary/10 p-3 rounded-full">
          <Icon icon="lucide:crown" className="text-2xl text-primary" />
        </div>
        <div className="flex flex-col">
          <p className="text-lg font-semibold">Upgrade to Pro</p>
          <p className="text-sm text-gray-500">Stand out and get more clients</p>
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
                className={`relative cursor-pointer transition-all ${
                  selectedPlan === plan.id
                    ? 'ring-2 ring-primary shadow-lg'
                    : 'hover:shadow-md'
                }`}
                isPressable
                onPress={() => setSelectedPlan(plan.id)}
              >
                {plan.isPopular && (
                  <Chip
                    color="primary"
                    size="sm"
                    className="absolute -top-2 right-4 z-10"
                  >
                    Most Popular
                  </Chip>
                )}
                <CardBody className="p-6">
                  <Radio
                    value={plan.id}
                    className="absolute top-4 right-4"
                  />
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold">{plan.name}</h3>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">${plan.price}</span>
                      <span className="text-gray-500">/{plan.interval}</span>
                    </div>
                    {plan.savings > 0 && (
                      <Chip color="success" size="sm" className="mt-2">
                        Save {plan.savings}%
                      </Chip>
                    )}
                  </div>
                  <ul className="space-y-2 text-sm">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex gap-2">
                        <Icon icon="lucide:check" className="text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
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
            color="primary"
            size="lg"
            className="w-full"
            onPress={handleSubscribe}
            isLoading={loading}
            startContent={!loading && <Icon icon="lucide:credit-card" />}
          >
            Subscribe to {SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan)?.name} Plan
          </Button>
          
          <p className="text-center text-sm text-gray-500">
            Cancel anytime • Secure payment by Stripe • Instant activation
          </p>
        </div>
      </CardBody>
    </Card>
  );
};