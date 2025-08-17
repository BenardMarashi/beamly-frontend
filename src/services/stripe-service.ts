// src/services/stripe-service.ts
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, fns } from '../lib/firebase';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface StripeConnectAccount {
  accountId: string;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

export const StripeService = {
  // UPDATED: Add country parameter to createConnectAccount
  async createConnectAccount(userId: string, country: string = 'CZ') {
    try {
      const createAccount = httpsCallable(fns, 'createStripeConnectAccount');
      const result = await createAccount({ 
        userId,
        country, // NOW PASSING COUNTRY
        businessType: 'individual'
      }) as any;
      
      if (result.data.success) {
        // Save account ID and country to user profile
        await updateDoc(doc(db, 'users', userId), {
          stripeConnectAccountId: result.data.accountId,
          stripeConnectStatus: 'pending',
          stripeConnectCountry: result.data.country,
          updatedAt: serverTimestamp()
        });
        
        return {
          success: true,
          accountId: result.data.accountId,
          onboardingUrl: result.data.onboardingUrl,
          country: result.data.country
        };
      }
      
      return { success: false, error: result.data.error };
    } catch (error) {
      console.error('Error creating Connect account:', error);
      return { success: false, error };
    }
  },

  // NEW: Get supported countries for Stripe Connect
  async getSupportedCountries() {
    try {
      const getCountries = httpsCallable(fns, 'getStripeSupportedCountries');
      const result = await getCountries() as any;
      
      if (result.data.success) {
        return {
          success: true,
          countries: result.data.countries
        };
      }
      
      return { success: false, countries: [] };
    } catch (error) {
      console.error('Error getting countries:', error);
      // Return hardcoded list as fallback
      return {
        success: true,
        countries: [
          { code: 'US', name: 'United States', currency: 'USD' },
          { code: 'CA', name: 'Canada', currency: 'CAD' },
          { code: 'GB', name: 'United Kingdom', currency: 'GBP' },
          { code: 'AU', name: 'Australia', currency: 'AUD' },
          { code: 'AT', name: 'Austria', currency: 'EUR' },
          { code: 'BE', name: 'Belgium', currency: 'EUR' },
          { code: 'BG', name: 'Bulgaria', currency: 'BGN' },
          { code: 'HR', name: 'Croatia', currency: 'HRK' },
          { code: 'CY', name: 'Cyprus', currency: 'EUR' },
          { code: 'CZ', name: 'Czech Republic', currency: 'CZK' },
          { code: 'DK', name: 'Denmark', currency: 'DKK' },
          { code: 'EE', name: 'Estonia', currency: 'EUR' },
          { code: 'FI', name: 'Finland', currency: 'EUR' },
          { code: 'FR', name: 'France', currency: 'EUR' },
          { code: 'DE', name: 'Germany', currency: 'EUR' },
          { code: 'GR', name: 'Greece', currency: 'EUR' },
          { code: 'HU', name: 'Hungary', currency: 'HUF' },
          { code: 'IE', name: 'Ireland', currency: 'EUR' },
          { code: 'IT', name: 'Italy', currency: 'EUR' },
          { code: 'LV', name: 'Latvia', currency: 'EUR' },
          { code: 'LT', name: 'Lithuania', currency: 'EUR' },
          { code: 'LU', name: 'Luxembourg', currency: 'EUR' },
          { code: 'MT', name: 'Malta', currency: 'EUR' },
          { code: 'NL', name: 'Netherlands', currency: 'EUR' },
          { code: 'NO', name: 'Norway', currency: 'NOK' },
          { code: 'PL', name: 'Poland', currency: 'PLN' },
          { code: 'PT', name: 'Portugal', currency: 'EUR' },
          { code: 'RO', name: 'Romania', currency: 'RON' },
          { code: 'SK', name: 'Slovakia', currency: 'EUR' },
          { code: 'SI', name: 'Slovenia', currency: 'EUR' },
          { code: 'ES', name: 'Spain', currency: 'EUR' },
          { code: 'SE', name: 'Sweden', currency: 'SEK' },
          { code: 'CH', name: 'Switzerland', currency: 'CHF' },
          { code: 'NZ', name: 'New Zealand', currency: 'NZD' },
          { code: 'SG', name: 'Singapore', currency: 'SGD' },
          { code: 'HK', name: 'Hong Kong', currency: 'HKD' },
          { code: 'JP', name: 'Japan', currency: 'JPY' },
          { code: 'MX', name: 'Mexico', currency: 'MXN' },
          { code: 'MY', name: 'Malaysia', currency: 'MYR' },
          { code: 'TH', name: 'Thailand', currency: 'THB' },
          { code: 'BR', name: 'Brazil', currency: 'BRL' },
          { code: 'IN', name: 'India', currency: 'INR' }
        ]
      };
    }
  },

  async releasePaymentToFreelancer(jobId: string, freelancerId: string) {
    try {
      const releasePayment = httpsCallable(fns, 'releasePaymentToFreelancer');
      const result = await releasePayment({
        jobId,
        freelancerId
      }) as any;
      
      if (result.data.success) {
        return {
          success: true,
          transferId: result.data.transferId,
          freelancerPayout: result.data.freelancerPayout,
          platformTotal: result.data.platformTotal
        };
      }
      
      return { 
        success: false, 
        error: result.data.error || 'Failed to release payment' 
      };
    } catch (error) {
      console.error('Error releasing payment:', error);
      return { success: false, error };
    }
  },

  async getConnectAccountStatus(userId: string) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();
      
      if (!userData?.stripeConnectAccountId) {
        return { success: false, error: 'No Connect account found' };
      }
      
      const checkStatus = httpsCallable(fns, 'checkStripeConnectStatus');
      const result = await checkStatus({ 
        accountId: userData.stripeConnectAccountId 
      }) as any;
      
      return {
        success: true,
        status: result.data.status,
        detailsSubmitted: result.data.detailsSubmitted,
        chargesEnabled: result.data.chargesEnabled,
        payoutsEnabled: result.data.payoutsEnabled
      };
    } catch (error) {
      console.error('Error checking Connect status:', error);
      return { success: false, error };
    }
  },
// Add these methods to your StripeService object:

  // Get subscription status
  async getSubscriptionStatus(userId: string) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();
      
      if (!userData) {
        return { success: false, isActive: false };
      }
      
      return {
        success: true,
        isActive: userData.subscriptionStatus === 'active',
        plan: userData.subscriptionPlan,
        endDate: userData.subscriptionEndDate,
        isPro: userData.isPro || false
      };
    } catch (error) {
      console.error('Error getting subscription status:', error);
      return { success: false, isActive: false };
    }
  },

  // Create subscription checkout
  async createSubscriptionCheckout(userId: string, planType: 'monthly' | 'quarterly' | 'yearly') {
    try {
      const createCheckout = httpsCallable(fns, 'createSubscriptionCheckout');
      
      // Map plan types to your Stripe price IDs
      const priceIds = {
        monthly: 'price_monthly_id', // Replace with your actual Stripe price ID
        quarterly: 'price_quarterly_id', // Replace with your actual Stripe price ID
        yearly: 'price_yearly_id' // Replace with your actual Stripe price ID
      };
      
      const result = await createCheckout({
        userId,
        priceId: priceIds[planType],
        successUrl: `${window.location.origin}/billing?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/billing`
      }) as any;
      
      if (result.data.success) {
        return {
          success: true,
          checkoutUrl: result.data.url
        };
      }
      
      return { success: false, error: result.data.error };
    } catch (error) {
      console.error('Error creating subscription checkout:', error);
      return { success: false, error };
    }
  },

  // Cancel subscription
  async cancelSubscription(userId: string) {
    try {
      const cancelSub = httpsCallable(fns, 'cancelSubscription');
      const result = await cancelSub({ userId }) as any;
      
      if (result.data.success) {
        // Update local user data
        await updateDoc(doc(db, 'users', userId), {
          subscriptionStatus: 'cancelled',
          isPro: false,
          updatedAt: serverTimestamp()
        });
        
        return {
          success: true,
          endDate: result.data.endDate
        };
      }
      
      return { success: false, error: result.data.error };
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return { success: false, error };
    }
  }, 
  async createConnectAccountLink(userId: string, returnUrl: string, refreshUrl: string) {
    try {
      const createLink = httpsCallable(fns, 'createStripeAccountLink');
      const result = await createLink({ 
        userId,
        returnUrl,
        refreshUrl
      }) as any;
      
      return {
        success: true,
        url: result.data.url
      };
    } catch (error) {
      console.error('Error creating account link:', error);
      return { success: false, error };
    }
  },

  // Job Payment Flow
  async createJobPayment(jobId: string, proposalId: string, amount: number) {
    try {
      const createPayment = httpsCallable(fns, 'createJobPaymentIntent');
      const result = await createPayment({
        jobId,
        proposalId,
        amount
      }) as any;
      
      if (result.data.success) {
        // Save payment intent to database
        
        return {
          success: true,
          clientSecret: result.data.clientSecret,
          paymentIntentId: result.data.paymentIntentId
        };
      }
      
      return { success: false, error: result.data.error };
    } catch (error) {
      console.error('Error creating job payment:', error);
      return { success: false, error };
    }
  },

  async confirmJobPayment(paymentIntentId: string) {
    try {
      const stripe = await stripePromise;
      
      // Update payment status in database
      await updateDoc(doc(db, 'payments', paymentIntentId), {
        status: 'succeeded',
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error confirming payment:', error);
      return { success: false, error };
    }
  },

  // Get freelancer balance
  async getBalance(userId: string) {
    try {
      const getBalance = httpsCallable(fns, 'getStripeBalance');
      const result = await getBalance({ userId }) as any;
      
      return {
        success: true,
        available: result.data.available,
        pending: result.data.pending
      };
    } catch (error) {
      console.error('Error getting balance:', error);
      return { success: false, error, available: 0, pending: 0 };
    }
  },

  // Create payout
  async createPayout(userId: string, amount: number) {
    try {
      const createPayout = httpsCallable(fns, 'createStripePayout');
      const result = await createPayout({ userId, amount }) as any;
      
      if (result.data.success) {
        // Create transaction record
        await setDoc(doc(collection(db, 'transactions')), {
          type: 'withdrawal',
          userId,
          amount,
          currency: 'usd',
          status: 'pending',
          stripePayoutId: result.data.payoutId,
          createdAt: serverTimestamp()
        });
        
        return { success: true, payoutId: result.data.payoutId };
      }
      
      return { success: false, error: result.data.error };
    } catch (error) {
      console.error('Error creating payout:', error);
      return { success: false, error };
    }
  },

  // Create payment for accepting a proposal
  async createProjectPayment(params: {
    clientId: string;
    freelancerId: string;
    proposalId: string;
    jobId: string;
    amount: number;
    description: string;
  }) {
    try {
      // Use the existing createJobPayment method
      const result = await this.createJobPayment(
        params.jobId,
        params.proposalId,
        params.amount
      );
      
      if (result.success) {
        return {
          success: true,
          clientSecret: result.clientSecret,
          paymentIntentId: result.paymentIntentId
        };
      }
      
      return { success: false, error: 'Failed to create payment' };
    } catch (error) {
      console.error('Error creating project payment:', error);
      return { success: false, error: 'Payment creation failed' };
    }
  }
};

export default StripeService;