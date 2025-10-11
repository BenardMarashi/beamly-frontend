// src/components/payments/ProSubscription.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button, Chip, RadioGroup, Radio } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useAuth } from '../../contexts/AuthContext';
import { StripeService } from '../../services/stripe-service';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const STRIPE_PRICE_IDS = {
  messages: 'price_1SH4I0DtB4sjDNJy2iNybsuv',
  monthly: 'price_1RoqOADtB4sjDNJywCzlCHBM',
  sixmonths: 'price_1Rt9g9DtB4sjDNJy5eXZpg7d',
  quarterly: 'price_1RoqOADtB4sjDNJyCiGCXLZx',
  yearly: 'price_1RoqOADtB4sjDNJyGYfrEVTu'
};

export const ProSubscription: React.FC = () => {
  const { user, userData } = useAuth();
  const { t } = useTranslation();
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<{
    isActive: boolean;
    plan?: string;
    endDate?: Date;
  }>({ isActive: false });

  const isFreePlan = !currentSubscription.isActive;

  // Define plans with translations
  const SUBSCRIPTION_PLANS = [
    {
      id: 'free',
      name: t('proSubscription.plans.free.name'),
      price: 0,
      interval: '',
      savings: 0,
      features: [
        t('proSubscription.plans.free.feature1'),
        t('proSubscription.plans.free.feature2'),
        t('proSubscription.plans.free.feature3'),
        t('proSubscription.plans.free.feature4')
      ]
    },
    {
      id: 'messages',
      name: t('proSubscription.plans.messages.name'),
      price: 3,
      interval: t('proSubscription.intervals.month'),
      savings: 0,
      features: [
        t('proSubscription.plans.messages.feature1'),
        t('proSubscription.plans.messages.feature2'),
        t('proSubscription.plans.messages.feature3'),
        t('proSubscription.plans.messages.feature4')
      ]
    },
    {
      id: 'monthly',
      name: t('proSubscription.plans.monthly.name'),
      price: 9.99,
      interval: t('proSubscription.intervals.month'),
      savings: 0,
      features: [
        t('proSubscription.plans.monthly.feature1'),
        t('proSubscription.plans.monthly.feature2'),
        t('proSubscription.plans.monthly.feature3'),
        t('proSubscription.plans.monthly.feature4'),
        t('proSubscription.plans.monthly.feature5'),
        t('proSubscription.plans.monthly.feature6')
      ]
    },
    {
      id: 'sixmonths',
      name: t('proSubscription.plans.sixmonths.name'),
      price: 47.99,
      interval: t('proSubscription.intervals.sixmonths'),
      savings: 20,
      isPopular: true,
      features: [
        t('proSubscription.plans.sixmonths.feature1'),
        t('proSubscription.plans.sixmonths.feature2'),
        t('proSubscription.plans.sixmonths.feature3'),
        t('proSubscription.plans.sixmonths.feature4'),
        t('proSubscription.plans.sixmonths.feature5')
      ]
    }
  ];

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
      toast(t('proSubscription.messages.alreadyFree'));
      return;
    }
    
    setLoading(true);
    try {
      let priceId = '';
      switch(selectedPlan) {
        case 'messages':
          priceId = STRIPE_PRICE_IDS.messages;
          break;
        case 'monthly':
          priceId = STRIPE_PRICE_IDS.monthly;
          break;
        case 'sixmonths':
          priceId = STRIPE_PRICE_IDS.sixmonths;
          break;
        default:
          toast.error(t('proSubscription.messages.invalidPlan'));
          setLoading(false);
          return;
      }

      const result = await StripeService.createSubscriptionCheckout(
        user.uid,
        priceId
      );
      
      if (result.success && result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error(t('proSubscription.messages.checkoutFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user?.uid || !window.confirm(t('proSubscription.messages.cancelConfirm'))) return;
    
    setLoading(true);
    try {
      const result = await StripeService.cancelSubscription(user.uid);
      if (result.success) {
        toast.success(t('proSubscription.messages.cancelSuccess'));
        checkSubscriptionStatus();
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error(t('proSubscription.messages.cancelFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (currentSubscription.isActive) {
    const planName = currentSubscription.plan === 'sixmonths' 
      ? t('proSubscription.plans.sixmonths.name')
      : currentSubscription.plan === 'messages'
      ? t('proSubscription.plans.messages.name')
      : t('proSubscription.plans.monthly.name');

    return (
      <Card className="w-full max-w-2xl mx-auto glass-effect">
        <CardHeader className="flex gap-3">
          <div className="bg-yellow-400/20 p-3 rounded-full">
            <Icon icon="lucide:crown" className="text-2xl text-yellow-400" />
          </div>
          <div className="flex flex-col">
            <p className="text-lg font-semibold text-white">
              {t('proSubscription.active.title')}
            </p>
            <p className="text-sm text-gray-400">
              {planName} {t('proSubscription.active.plan')} • {t('proSubscription.active.renews')} {currentSubscription.endDate?.toLocaleDateString()}
            </p>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div className="bg-green-500/10 rounded-lg p-4">
              <h4 className="font-medium text-green-400 mb-2">
                {t('proSubscription.active.benefits')}
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
              {t('proSubscription.active.cancelButton')}
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
          <p className="text-lg font-semibold text-white">
            {t('proSubscription.header.title')}
          </p>
          <p className="text-sm text-gray-400">
            {t('proSubscription.header.subtitle')}
          </p>
        </div>
      </CardHeader>
      <CardBody>
        <RadioGroup
          value={selectedPlan}
          onValueChange={setSelectedPlan}
          className="w-full"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <Card
                key={plan.id}
                className={`relative cursor-pointer transition-all glass-card h-auto min-h-fit ${
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
                    {t('proSubscription.badges.save20')}
                  </Chip>
                )}
                {isFreePlan && plan.id === 'free' && (
                  <Chip
                    color="default"
                    size="sm"
                    className="absolute -top-2 left-4 z-10"
                  >
                    {t('proSubscription.badges.currentPlan')}
                  </Chip>
                )}
                <CardBody className="p-4 md:p-6 h-auto">
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
                        <span className="text-3xl font-bold text-white">
                          {t('proSubscription.pricing.free')}
                        </span>
                      ) : (
                        <>
                          <span className="text-3xl font-bold text-white">€{plan.price}</span>
                          <span className="text-gray-400">/{plan.interval}</span>
                        </>
                      )}
                    </div>
                    {plan.savings > 0 && (
                      <p className="text-sm text-green-400 mt-1">
                        {t('proSubscription.pricing.saveVsMonthly', { savings: plan.savings })}
                      </p>
                    )}
                  </div>
                  <ul className="space-y-3 text-sm">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex gap-2 items-start">
                        <Icon 
                          icon="lucide:check" 
                          className={`mt-0.5 flex-shrink-0 min-w-[16px] ${
                            feature.includes('15%') ? 'text-red-400' : 'text-green-400'
                          }`}
                        />
                        <span className={
                          feature.includes('15%') ? 'text-gray-400' : 
                          feature.includes('0%') ? 'text-green-400 font-medium' : 
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
              ? t('proSubscription.buttons.alreadyFree')
              : t('proSubscription.buttons.subscribe', { 
                  plan: SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan)?.name 
                })}
          </Button>
          
          <div className="bg-blue-500/10 rounded-lg p-4">
            <div className="flex gap-3">
              <Icon icon="lucide:info" className="text-blue-400 mt-0.5" />
              <div className="text-sm text-gray-300">
                <p className="font-medium mb-1">{t('proSubscription.info.commissionTitle')}</p>
                <p>{t('proSubscription.info.freePlan')}</p>
                <p>{t('proSubscription.info.proPlan')}</p>
              </div>
            </div>
          </div>
          
          <p className="text-center text-sm text-gray-500">
            {t('proSubscription.footer')}
          </p>
        </div>
      </CardBody>
    </Card>
  );
};