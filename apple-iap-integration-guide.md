# Apple In-App Purchase Integration Guide

## **Overview & Requirements**

### **Current System Analysis**
- **Stripe Integration**: Subscriptions, job payments, message bundles
- **Firebase Functions**: Payment processing backend
- **Billing System**: Earnings, withdrawals, balance tracking
- **Pro Subscriptions**: Monthly, quarterly, 6-months, yearly plans
- **Revenue Model**: 15% platform fee (5% for Pro users)

### **Apple IAP Requirements**
- **Digital Products**: Must use Apple IAP on iOS (App Store requirement)
- **Commission**: Apple takes 30% of all IAP transactions
- **Restrictions**: Cannot withdraw IAP funds directly, must provide digital value
- **Compliance**: Required for App Store approval

## **Implementation Strategy**

### **Phase 1: iOS Detection & UI Switching**

#### **1. iOS User Agent Detection**

**File:** `/home/benard/src/beamly-frontend/src/utils/platform-detection.ts`

```typescript
interface PlatformInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isWeb: boolean;
  isApplixApp: boolean;
  userAgent: string;
}

export const detectPlatform = (): PlatformInfo => {
  const userAgent = navigator.userAgent || '';
  
  // Check if running in Appilix app (custom user agent from your PWA app)
  const isApplixApp = userAgent.includes('Appilix') || 
                     userAgent.includes('YourAppName') ||
                     window.hasOwnProperty('appilix');
  
  // iOS detection (including iPad)
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  const isAndroid = /Android/.test(userAgent);
  const isWeb = !isIOS && !isAndroid;

  return {
    isIOS,
    isAndroid, 
    isWeb,
    isApplixApp,
    userAgent
  };
};

export const shouldUseIAP = (): boolean => {
  const platform = detectPlatform();
  return platform.isIOS && platform.isApplixApp;
};
```

#### **2. Payment Method Context**

**File:** `/home/benard/src/beamly-frontend/src/contexts/PaymentContext.tsx`

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { detectPlatform, shouldUseIAP } from '../utils/platform-detection';

interface PaymentContextType {
  paymentMethod: 'stripe' | 'apple_iap';
  platform: any;
  canWithdraw: boolean;
  commission: number; // Platform commission after Apple's cut
}

const PaymentContext = createContext<PaymentContextType | null>(null);

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) throw new Error('usePayment must be used within PaymentProvider');
  return context;
};

export const PaymentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [platform, setPlatform] = useState(detectPlatform());
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'apple_iap'>('stripe');

  useEffect(() => {
    const platformInfo = detectPlatform();
    setPlatform(platformInfo);
    
    if (shouldUseIAP()) {
      setPaymentMethod('apple_iap');
    } else {
      setPaymentMethod('stripe');
    }
  }, []);

  const value: PaymentContextType = {
    paymentMethod,
    platform,
    canWithdraw: paymentMethod === 'stripe', // Can only withdraw Stripe earnings
    commission: paymentMethod === 'apple_iap' ? 0.70 : 1.0 // Apple takes 30%, we get 70%
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};
```

### **Phase 2: Apple IAP Service Implementation**

#### **3. Apple IAP Service**

**File:** `/home/benard/src/beamly-frontend/src/services/apple-iap-service.ts`

```typescript
interface IAPProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  rawPrice: number;
  currencyCode: string;
}

interface IAPResponse {
  status: boolean;
  message?: string;
  product?: IAPProduct;
  receipt?: string;
  transactionId?: string;
}

interface IAPInitRequest {
  product_id: string;
  product_type: 'consumable' | 'non-consumable' | 'auto-renewable-subscription';
}

export class AppleIAPService {
  private static isApplixAvailable(): boolean {
    return typeof window !== 'undefined' && 
           window.hasOwnProperty('appilix') && 
           shouldUseIAP();
  }

  static async initializePurchase(request: IAPInitRequest): Promise<IAPResponse> {
    if (!this.isApplixAvailable()) {
      throw new Error('Apple IAP not available on this platform');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('IAP initialization timeout'));
      }, 30000); // 30 second timeout

      // Set up listener for response
      window.appilix.onmessage = function(event: MessageEvent) {
        clearTimeout(timeout);
        
        try {
          const response = JSON.parse(event.data);
          
          if (response.type === 'apple_iap_init') {
            window.appilix.onmessage = null; // Remove listener
            resolve(response.response);
          }
        } catch (error) {
          reject(new Error('Failed to parse IAP response'));
        }
      };

      // Send purchase request
      window.appilix.postMessage(JSON.stringify({
        type: "apple_iap_init",
        props: request
      }));
    });
  }

  static async purchaseSubscription(planType: 'monthly' | 'quarterly' | '6months' | 'yearly'): Promise<IAPResponse> {
    const productMapping = {
      monthly: 'com.beamly.pro.monthly',
      quarterly: 'com.beamly.pro.quarterly', 
      '6months': 'com.beamly.pro.6months',
      yearly: 'com.beamly.pro.yearly'
    };

    return this.initializePurchase({
      product_id: productMapping[planType],
      product_type: 'auto-renewable-subscription'
    });
  }

  static async purchaseMessageBundle(): Promise<IAPResponse> {
    return this.initializePurchase({
      product_id: 'com.beamly.messages.bundle',
      product_type: 'consumable'
    });
  }

  static async purchaseJobPayment(amount: number): Promise<IAPResponse> {
    // For job payments, we might need dynamic pricing or predefined tiers
    const tierMapping = this.getJobPaymentTier(amount);
    
    return this.initializePurchase({
      product_id: tierMapping.productId,
      product_type: 'consumable'
    });
  }

  private static getJobPaymentTier(amount: number) {
    // Define payment tiers for App Store Connect
    const tiers = [
      { min: 0, max: 50, productId: 'com.beamly.job.tier1' },
      { min: 50, max: 100, productId: 'com.beamly.job.tier2' },
      { min: 100, max: 250, productId: 'com.beamly.job.tier3' },
      { min: 250, max: 500, productId: 'com.beamly.job.tier4' },
      { min: 500, max: 1000, productId: 'com.beamly.job.tier5' },
      { min: 1000, max: 9999999, productId: 'com.beamly.job.tier6' }
    ];

    return tiers.find(tier => amount >= tier.min && amount < tier.max) || tiers[0];
  }
}

// Extend window interface for TypeScript
declare global {
  interface Window {
    appilix: {
      postMessage: (message: string) => void;
      onmessage: ((event: MessageEvent) => void) | null;
    };
  }
}
```

### **Phase 3: Backend Integration**

#### **4. Firebase Functions for IAP Receipt Validation**

**File:** `/home/benard/src/beamly-frontend/functions/src/apple-iap.ts`

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

interface AppleReceiptValidationRequest {
  receiptData: string;
  password?: string; // App-specific shared secret
  excludeOldTransactions?: boolean;
}

interface AppleReceiptValidationResponse {
  status: number;
  receipt: any;
  latest_receipt_info?: any[];
  pending_renewal_info?: any[];
}

// Validate Apple IAP receipt
export const validateAppleReceipt = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { receiptData, transactionId, productId, amount } = data;

  try {
    // First try production, then sandbox if needed
    let response = await validateWithApple(receiptData, false);
    
    if (response.status === 21007) {
      // Receipt is from sandbox, try sandbox environment
      response = await validateWithApple(receiptData, true);
    }

    if (response.status !== 0) {
      throw new functions.https.HttpsError('invalid-argument', `Apple receipt validation failed: ${response.status}`);
    }

    // Process the validated purchase
    await processValidatedPurchase({
      userId: context.auth.uid,
      receiptData: response.receipt,
      transactionId,
      productId,
      amount
    });

    return { success: true, receipt: response.receipt };

  } catch (error) {
    console.error('Apple IAP validation error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to validate receipt');
  }
});

async function validateWithApple(receiptData: string, sandbox: boolean): Promise<AppleReceiptValidationResponse> {
  const url = sandbox 
    ? 'https://sandbox.itunes.apple.com/verifyReceipt'
    : 'https://buy.itunes.apple.com/verifyReceipt';

  const requestData: AppleReceiptValidationRequest = {
    'receipt-data': receiptData,
    password: functions.config().apple.shared_secret, // Set in Firebase config
    'exclude-old-transactions': true
  };

  const response = await axios.post(url, requestData);
  return response.data;
}

async function processValidatedPurchase(purchaseData: {
  userId: string;
  receiptData: any;
  transactionId: string;
  productId: string;
  amount: number;
}) {
  const db = admin.firestore();
  const batch = db.batch();

  // Determine purchase type and handle accordingly
  if (purchaseData.productId.includes('pro')) {
    // Handle subscription
    await handleSubscriptionPurchase(purchaseData, batch);
  } else if (purchaseData.productId.includes('messages')) {
    // Handle message bundle
    await handleMessageBundlePurchase(purchaseData, batch);
  } else if (purchaseData.productId.includes('job')) {
    // Handle job payment
    await handleJobPaymentPurchase(purchaseData, batch);
  }

  // Record transaction
  const transactionRef = db.collection('transactions').doc();
  batch.set(transactionRef, {
    userId: purchaseData.userId,
    type: 'apple_iap',
    productId: purchaseData.productId,
    transactionId: purchaseData.transactionId,
    amount: purchaseData.amount,
    platformFee: purchaseData.amount * 0.30, // Apple's 30%
    netAmount: purchaseData.amount * 0.70,   // Platform receives 70%
    status: 'completed',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    receiptData: purchaseData.receiptData
  });

  await batch.commit();
}

async function handleSubscriptionPurchase(purchaseData: any, batch: any) {
  const db = admin.firestore();
  const userRef = db.collection('users').doc(purchaseData.userId);

  // Update user subscription status
  batch.update(userRef, {
    isPro: true,
    subscriptionStatus: 'active',
    subscriptionPlatform: 'apple',
    subscriptionProductId: purchaseData.productId,
    subscriptionStartDate: admin.firestore.FieldValue.serverTimestamp(),
    // Note: For Apple subscriptions, expiry is managed by Apple
  });
}

async function handleMessageBundlePurchase(purchaseData: any, batch: any) {
  const db = admin.firestore();
  const userRef = db.collection('users').doc(purchaseData.userId);

  // Add message credits (assuming 10 messages per bundle)
  batch.update(userRef, {
    messageCredits: admin.firestore.FieldValue.increment(10)
  });
}

async function handleJobPaymentPurchase(purchaseData: any, batch: any) {
  // This would need additional context about which job is being paid for
  // Implementation depends on how job payments are initiated
}
```

### **Phase 4: UI Component Updates**

#### **5. Subscription Page with IAP Support**

**File:** `/home/benard/src/beamly-frontend/src/components/subscription/SubscriptionPlans.tsx`

```typescript
import React from 'react';
import { Button, Card, CardBody, Chip } from '@nextui-org/react';
import { usePayment } from '../../contexts/PaymentContext';
import { AppleIAPService } from '../../services/apple-iap-service';
import { StripeService } from '../../services/stripe-service';
import { toast } from 'react-hot-toast';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration: string;
  features: string[];
  stripePriceId?: string;
  applePriceId?: string;
}

export const SubscriptionPlans: React.FC = () => {
  const { paymentMethod, platform } = usePayment();

  const plans: SubscriptionPlan[] = [
    {
      id: 'monthly',
      name: 'Monthly Pro',
      price: 29.99,
      duration: 'month',
      features: ['Unlimited proposals', '5% platform fee', 'Priority support'],
      stripePriceId: 'price_monthly',
      applePriceId: 'com.beamly.pro.monthly'
    },
    {
      id: 'quarterly',
      name: 'Quarterly Pro', 
      price: 79.99,
      duration: '3 months',
      features: ['Unlimited proposals', '5% platform fee', 'Priority support', '11% savings'],
      stripePriceId: 'price_quarterly',
      applePriceId: 'com.beamly.pro.quarterly'
    },
    // ... other plans
  ];

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    try {
      if (paymentMethod === 'apple_iap') {
        await handleAppleSubscription(plan);
      } else {
        await handleStripeSubscription(plan);
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Subscription failed. Please try again.');
    }
  };

  const handleAppleSubscription = async (plan: SubscriptionPlan) => {
    const response = await AppleIAPService.purchaseSubscription(plan.id as any);
    
    if (response.status) {
      // Validate receipt on backend
      const result = await fetch('/api/validateAppleReceipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiptData: response.receipt,
          productId: plan.applePriceId,
          amount: plan.price
        })
      });

      if (result.ok) {
        toast.success('Subscription activated successfully!');
        // Refresh user data
        window.location.reload();
      }
    } else {
      throw new Error(response.message || 'Purchase failed');
    }
  };

  const handleStripeSubscription = async (plan: SubscriptionPlan) => {
    // Existing Stripe logic
    const result = await StripeService.createSubscription(plan.stripePriceId!);
    // Handle Stripe response...
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {plans.map((plan) => (
        <Card key={plan.id} className="glass-effect">
          <CardBody className="p-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
              <div className="text-3xl font-bold text-primary mb-1">
                ${plan.price}
              </div>
              <p className="text-gray-400">per {plan.duration}</p>
              
              {paymentMethod === 'apple_iap' && (
                <Chip color="primary" variant="flat" className="mt-2">
                  Apple In-App Purchase
                </Chip>
              )}
            </div>

            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center text-gray-300">
                  <span className="text-green-400 mr-2">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <Button
              color="primary"
              className="w-full"
              onClick={() => handleSubscribe(plan)}
            >
              {paymentMethod === 'apple_iap' ? 'Subscribe via App Store' : 'Subscribe'}
            </Button>

            {paymentMethod === 'apple_iap' && (
              <p className="text-xs text-gray-400 mt-2 text-center">
                Subscription managed through your Apple ID
              </p>
            )}
          </CardBody>
        </Card>
      ))}
    </div>
  );
};
```

#### **6. Enhanced Billing Page**

**File:** `/home/benard/src/beamly-frontend/src/pages/billing.tsx`

```typescript
// Add these updates to the existing billing page

const { paymentMethod, canWithdraw, commission } = usePayment();

// Update earnings calculation to account for Apple's commission
const calculateNetEarnings = (transactions: any[]) => {
  return transactions.reduce((total, transaction) => {
    if (transaction.type === 'apple_iap') {
      // Apple IAP transactions already have commission deducted
      return total + transaction.netAmount;
    } else {
      // Stripe transactions - apply platform commission
      return total + (transaction.amount * 0.85); // 15% platform fee
    }
  }, 0);
};

// Update withdrawal section
const renderWithdrawalSection = () => {
  if (!canWithdraw) {
    return (
      <Card className="glass-effect border-none">
        <CardBody className="p-6">
          <div className="text-center">
            <Icon icon="lucide:info" className="text-yellow-400 mb-4 mx-auto" width={48} />
            <h3 className="text-lg font-semibold text-white mb-2">
              Withdrawal Restrictions
            </h3>
            <p className="text-gray-400 mb-4">
              Earnings from Apple In-App Purchases cannot be withdrawn directly. 
              These funds can only be used for platform features and services.
            </p>
            <p className="text-sm text-gray-500">
              To receive withdrawable earnings, use the web version for job payments.
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  // Existing withdrawal UI for Stripe earnings
  return (
    // ... existing withdrawal component
  );
};
```

### **Phase 5: App Store Connect Configuration**

#### **7. Product Configuration Checklist**

**Required Products in App Store Connect:**

1. **Subscription Products:**
   - `com.beamly.pro.monthly` - Monthly Pro Subscription ($29.99)
   - `com.beamly.pro.quarterly` - Quarterly Pro Subscription ($79.99) 
   - `com.beamly.pro.6months` - 6-Month Pro Subscription ($149.99)
   - `com.beamly.pro.yearly` - Yearly Pro Subscription ($299.99)

2. **Consumable Products:**
   - `com.beamly.messages.bundle` - Message Bundle (10 messages, $4.99)
   - `com.beamly.job.tier1` - Job Payment Tier 1 ($0.99 - $49.99)
   - `com.beamly.job.tier2` - Job Payment Tier 2 ($49.99 - $99.99)
   - `com.beamly.job.tier3` - Job Payment Tier 3 ($99.99 - $249.99)
   - `com.beamly.job.tier4` - Job Payment Tier 4 ($249.99 - $499.99)
   - `com.beamly.job.tier5` - Job Payment Tier 5 ($499.99 - $999.99)
   - `com.beamly.job.tier6` - Job Payment Tier 6 ($999.99+)

#### **8. Firebase Configuration**

**Set Firebase environment variables:**

```bash
firebase functions:config:set apple.shared_secret="YOUR_APP_SPECIFIC_SHARED_SECRET"
firebase functions:config:set apple.bundle_id="com.yourapp.beamly"
```

### **Phase 6: Revenue & Analytics Updates**

#### **9. Analytics Service Updates**

**File:** `/home/benard/src/beamly-frontend/functions/src/analytics.ts`

```typescript
// Update daily analytics to track IAP vs Stripe revenue

const calculateDailyRevenue = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Query transactions for today
  const transactionsQuery = await db.collection('transactions')
    .where('createdAt', '>=', today)
    .where('createdAt', '<', tomorrow)
    .where('status', '==', 'completed')
    .get();

  let stripeRevenue = 0;
  let appleRevenue = 0;
  let totalTransactions = 0;

  transactionsQuery.forEach(doc => {
    const data = doc.data();
    totalTransactions++;

    if (data.type === 'apple_iap') {
      appleRevenue += data.netAmount; // Already has Apple's commission deducted
    } else {
      stripeRevenue += data.amount * 0.15; // Platform's 15% commission
    }
  });

  return {
    totalRevenue: stripeRevenue + appleRevenue,
    stripeRevenue,
    appleRevenue,
    totalTransactions
  };
};
```

### **Phase 7: Testing & Deployment**

#### **10. Testing Checklist**

**iOS Testing (TestFlight Required):**
- [ ] Platform detection works correctly
- [ ] IAP products load successfully  
- [ ] Subscription purchase flow completes
- [ ] Message bundle purchase works
- [ ] Receipt validation succeeds
- [ ] User subscription status updates
- [ ] Billing page shows correct earnings
- [ ] Withdrawal restrictions display properly

**Web Testing:**
- [ ] Stripe payments still work normally
- [ ] No IAP code interferes with web functionality
- [ ] Platform detection identifies web correctly

**Backend Testing:**
- [ ] Receipt validation function works
- [ ] Database updates occur correctly
- [ ] Analytics include IAP revenue
- [ ] Firebase config variables set

#### **11. Deployment Strategy**

1. **Phase 1**: Deploy backend functions and test with sandbox receipts
2. **Phase 2**: Update frontend with platform detection (feature flag)
3. **Phase 3**: Test with TestFlight build
4. **Phase 4**: Full production deployment after App Store approval

### **Revenue Impact Analysis**

**Before IAP (Stripe Only):**
- Job Payment: $100 → Platform gets $15
- User Withdrawal: $85

**After IAP (iOS):**
- Job Payment: $100 → Apple gets $30 → Platform gets $70
- User Withdrawal: $0 (IAP funds cannot be withdrawn)
- Platform Benefit: $55 more per transaction (but user cannot withdraw)

**Recommendation:**
- Use IAP for subscriptions and message bundles
- Consider keeping job payments on Stripe (if Apple allows) for better user experience
- Clearly communicate withdrawal limitations to iOS users

This implementation provides a complete dual-payment system that complies with Apple's requirements while maintaining existing Stripe functionality for web users.