// src/components/payments/ProSubscriptionDual.tsx
/**
 * Enhanced Pro Subscription Component
 * Supports both Apple In-App Purchase (iOS) and Stripe (Web/Android)
 */

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Button, 
  Chip, 
  RadioGroup, 
  Radio,
  Spinner 
} from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useAuth } from '../../contexts/AuthContext';
import { usePayment } from '../../contexts/PaymentContext';
import { StripeService } from '../../services/stripe-service';
import AppleIAPService from '../../services/apple-iap-service';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { httpsCallable } from 'firebase/functions';
import { fns } from '../../lib/firebase';

// Stripe Price IDs
const STRIPE_PRICE_IDS = {
  messages: 'price_1SH4I0DtB4sjDNJy2iNybsuv',
  monthly: 'price_1RoqOADtB4sjDNJywCzlCHBM',
  sixmonths: 'price_1Rt9g9DtB4sjDNJy5eXZpg7d',
  quarterly: 'price_1RoqOADtB4sjDNJyCiGCXLZx',
  yearly: 'price_1RoqOADtB4sjDNJyGYfrEVTu'
};

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: string;
  savings?: number;
  isPopular?: boolean;
  features: string[];
  stripePriceId?: string;
  appleProductId?: string;
}

export const ProSubscriptionDual: React.FC = () => {
  const { user, userData } = useAuth();
  const { paymentMethod, isIOS, platform } = usePayment();
  const { t } = useTranslation();
  
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<{
    isActive: boolean;
    plan?: string;
    endDate?: Date;
  }>({ isActive: false });

  const isFreePlan = !currentSubscription.isActive;

  // Define subscription plans
  const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    {
      id: 'free',
      name: t('proSubscription.plans.free.name'),
      price: 0,
      interval: '',
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
      features: [
        t('proSubscription.plans.messages.feature1'),
        t('proSubscription.plans.messages.feature2'),
        t('proSubscription.plans.messages.feature3'),
        t('proSubscription.plans.messages.feature4')
      ],
      stripePriceId: STRIPE_PRICE_IDS.messages,
      appleProductId: '03' // Messages product from App Store Connect
    },
    {
      id: 'monthly',
      name: t('proSubscription.plans.monthly.name'),
      price: 9.99,
      interval: t('proSubscription.intervals.month'),
      features: [
        t('proSubscription.plans.monthly.feature1'),
        t('proSubscription.plans.monthly.feature2'),
        t('proSubscription.plans.monthly.feature3'),
        t('proSubscription.plans.monthly.feature4'),
        t('proSubscription.plans.monthly.feature5'),
        t('proSubscription.plans.monthly.feature6')
      ],
      stripePriceId: STRIPE_PRICE_IDS.monthly,
      appleProductId: '01' // Pro Monthly product from App Store Connect
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
      ],
      stripePriceId: STRIPE_PRICE_IDS.sixmonths,
      appleProductId: '02' // Pro 6 Months product from App Store Connect
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

  /**
   * Handle Apple IAP Purchase
   */
  const handleAppleIAPPurchase = async (plan: SubscriptionPlan) => {
    if (!user?.uid) {
      toast.error('Please login to continue');
      return;
    }

    setLoading(true);
    
    try {
      console.log(`🍎 Starting Apple IAP purchase for: ${plan.name}`);

      // Map plan ID to purchase method
      let iapResponse;
      if (plan.id === 'monthly') {
        iapResponse = await AppleIAPService.purchaseProMonthly();
      } else if (plan.id === 'sixmonths') {
        iapResponse = await AppleIAPService.purchasePro6Months();
      } else if (plan.id === 'messages') {
        iapResponse = await AppleIAPService.purchaseMessages();
      } else {
        throw new Error('Invalid plan selected');
      }

      console.log('✅ Apple IAP Response:', iapResponse);

      if (iapResponse.status && iapResponse.receipt) {
        // Validate receipt on backend
        await validateAppleReceipt({
          userId: user.uid,
          receiptData: iapResponse.receipt,
          transactionId: iapResponse.transactionId || '',
          productId: plan.appleProductId || '',
          planType: plan.id
        });

        toast.success('Subscription activated successfully! 🎉');
        
        // Refresh user data
        await checkSubscriptionStatus();
        
        // Refresh page to update UI
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error('Purchase was not completed');
      }

    } catch (error: any) {
      console.error('Apple IAP Purchase Error:', error);
      
      if (error.message?.includes('timeout')) {
        toast.error('Purchase timed out. Please check your purchase history.');
      } else if (error.message?.includes('cancelled')) {
        toast('Purchase cancelled', { icon: 'ℹ️' });
      } else {
        toast.error(`Purchase failed: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle Stripe Purchase
   */
  const handleStripePurchase = async (plan: SubscriptionPlan) => {
    if (!user?.uid) {
      toast.error('Please login to continue');
      return;
    }

    if (!plan.stripePriceId) {
      toast.error('Invalid plan configuration');
      return;
    }

    setLoading(true);
    
    try {
      console.log(`💰 Starting Stripe checkout for: ${plan.name}`);
      
      const result = await StripeService.createSubscriptionCheckout(
        user.uid,
        plan.stripePriceId
      );
      
      if (result.success && result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error: any) {
      console.error('Stripe Purchase Error:', error);
      toast.error(`Checkout failed: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Validate Apple Receipt on Backend
   */
  const validateAppleReceipt = async (data: {
    userId: string;
    receiptData: string;
    transactionId: string;
    productId: string;
    planType: string;
  }) => {
    try {
      const validateReceipt = httpsCallable(fns, 'validateAppleReceipt');
      const result = await validateReceipt(data);
      console.log('✅ Receipt validated:', result.data);
      return result.data;
    } catch (error) {
      console.error('Receipt validation error:', error);
      throw new Error('Failed to validate purchase. Please contact support.');
    }
  };

  /**
   * Handle subscription purchase based on payment method
   */
  const handleSubscribe = async () => {
    if (!user?.uid) {
      toast.error('Please login to continue');
      return;
    }
    
    if (selectedPlan === 'free') {
      toast(t('proSubscription.messages.alreadyFree'));
      return;
    }
    
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan);
    if (!plan) {
      toast.error('Invalid plan selected');
      return;
    }

    // Route to correct payment method based on platform
    if (paymentMethod === 'apple_iap') {
      await handleAppleIAPPurchase(plan);
    } else {
      await handleStripePurchase(plan);
    }
  };

  /**
   * Handle subscription cancellation
   */
  const handleCancelSubscription = async () => {
    if (!user?.uid) return;
    
    const confirmMessage = paymentMethod === 'apple_iap'
      ? 'Cancel your subscription? You can manage Apple subscriptions in iOS Settings.'
      : t('proSubscription.messages.cancelConfirm');
    
    if (!window.confirm(confirmMessage)) return;
    
    if (paymentMethod === 'apple_iap') {
      // Direct user to iOS Settings for Apple subscriptions
      toast('Please manage your subscription in iOS Settings → Apple ID → Subscriptions', {
        duration: 6000,
        icon: 'ℹ️'
      });
      return;
    }

    // Handle Stripe cancellation
    setLoading(true);
    try {
      const result = await StripeService.cancelSubscription(user.uid);
      if (result.success) {
        toast.success(t('proSubscription.messages.cancelSuccess'));
        checkSubscriptionStatus();
      }
    } catch (error) {
      console.error('Subscription cancellation error:', error);
      toast.error(t('proSubscription.messages.cancelFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Show active subscription info if user has one
  if (currentSubscription.isActive) {
    const planName = currentSubscription.plan === 'sixmonths' 
      ? t('proSubscription.plans.sixmonths.name')
      : currentSubscription.plan === 'messages'
      ? t('proSubscription.plans.messages.name')
      : t('proSubscription.plans.monthly.name');

    const endDateFormatted = currentSubscription.endDate 
      ? new Date(currentSubscription.endDate).toLocaleDateString()
      : 'N/A';

    return (
      <Card className="w-full max-w-4xl mx-auto glass-effect">
        <CardBody className="p-8">
          <div className="text-center">
            <Icon icon="lucide:check-circle" className="text-6xl text-green-400 mb-4 mx-auto" />
            <h2 className="text-2xl font-bold text-white mb-2">
              {t('proSubscription.status.activeTitle')}
            </h2>
            <p className="text-lg text-gray-300 mb-4">
              {planName}
            </p>
            <p className="text-sm text-gray-400 mb-6">
              {t('proSubscription.status.renewsOn', { date: endDateFormatted })}
            </p>

            {paymentMethod === 'apple_iap' && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-300">
                  <Icon icon="lucide:info" className="inline mr-2" />
                  Manage your subscription in iOS Settings → Apple ID → Subscriptions
                </p>
              </div>
            )}

            <Button
              color="danger"
              variant="flat"
              onClick={handleCancelSubscription}
              isLoading={loading}
              startContent={<Icon icon="lucide:x" />}
            >
              {t('proSubscription.buttons.cancel')}
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
        <div className="flex flex-col flex-1">
          <p className="text-lg font-semibold text-white">
            {t('proSubscription.header.title')}
          </p>
          <p className="text-sm text-gray-400">
            {t('proSubscription.header.subtitle')}
          </p>
        </div>
        {/* Payment Method Badge */}
        <Chip
          color={paymentMethod === 'apple_iap' ? 'primary' : 'secondary'}
          variant="flat"
          size="sm"
          startContent={
            <Icon 
              icon={paymentMethod === 'apple_iap' ? 'lucide:apple' : 'lucide:credit-card'} 
            />
          }
        >
          {paymentMethod === 'apple_iap' ? 'Apple IAP' : 'Stripe'}
        </Chip>
      </CardHeader>

      <CardBody>
        {/* Platform Info (Debug) */}
        {import.meta.env.DEV && (
          <div className="mb-4 p-3 bg-gray-800/50 rounded-lg text-xs text-gray-400">
            <p><strong>Platform:</strong> {isIOS ? 'iOS' : platform.isAndroid ? 'Android' : 'Web'}</p>
            <p><strong>User Agent:</strong> {platform.userAgent}</p>
            <p><strong>Payment Method:</strong> {paymentMethod}</p>
          </div>
        )}

        <RadioGroup
          value={selectedPlan}
          onValueChange={setSelectedPlan}
          className="w-full"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <Card
                key={plan.id}
                className={`relative cursor-pointer transition-all glass-card h-auto ${
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

                <CardBody className="p-4 md:p-6">
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
                        <p className="text-2xl font-bold text-gray-400">
                          {t('proSubscription.pricing.free')}
                        </p>
                      ) : (
                        <>
                          <p className="text-2xl font-bold text-primary">
                            ${plan.price}
                          </p>
                          <p className="text-sm text-gray-400">
                            {plan.interval && `per ${plan.interval}`}
                          </p>
                          {plan.savings && (
                            <p className="text-xs text-green-400 mt-1">
                              {t('proSubscription.pricing.saveVsMonthly', { savings: plan.savings })}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-2 mb-4">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start text-sm text-gray-300">
                        <Icon
                          icon="lucide:check"
                          className="text-green-400 mt-0.5 mr-2 flex-shrink-0"
                          width={16}
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            ))}
          </div>
        </RadioGroup>

        {/* Subscribe Button */}
        <div className="mt-6 text-center">
          <Button
            color="primary"
            size="lg"
            onClick={handleSubscribe}
            isLoading={loading}
            isDisabled={selectedPlan === 'free' || !user}
            startContent={
              !loading && (
                <Icon 
                  icon={paymentMethod === 'apple_iap' ? 'lucide:apple' : 'lucide:credit-card'} 
                />
              )
            }
            className="min-w-[250px]"
          >
            {loading ? (
              <span>Processing...</span>
            ) : selectedPlan === 'free' ? (
              t('proSubscription.buttons.alreadyFree')
            ) : (
              `Subscribe ${paymentMethod === 'apple_iap' ? 'via Apple' : 'with Stripe'}`
            )}
          </Button>

          {/* Info Text */}
          <p className="text-xs text-gray-500 mt-3">
            {t('proSubscription.footer')}
          </p>

          {paymentMethod === 'apple_iap' && (
            <p className="text-xs text-blue-400 mt-2">
              <Icon icon="lucide:info" className="inline mr-1" />
              Subscription managed through your Apple ID
            </p>
          )}
        </div>

        {/* Commission Info */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-300 mb-2">
            <Icon icon="lucide:info" className="inline mr-2" />
            {t('proSubscription.info.commissionTitle')}
          </h4>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• {t('proSubscription.info.freePlan')}</li>
            <li>• {t('proSubscription.info.proPlan')}</li>
          </ul>
        </div>
      </CardBody>
    </Card>
  );
};

export default ProSubscriptionDual;