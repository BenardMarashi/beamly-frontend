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
  // Stripe Connect for Freelancers
  async createConnectAccount(userId: string) {
    try {
      const createAccount = httpsCallable(fns, 'createStripeConnectAccount');
      const result = await createAccount({ userId }) as any;
      
      if (result.data.success) {
        // Save account ID to user profile
        await updateDoc(doc(db, 'users', userId), {
          stripeConnectAccountId: result.data.accountId,
          stripeConnectStatus: 'pending',
          updatedAt: serverTimestamp()
        });
        
        return {
          success: true,
          accountId: result.data.accountId,
          onboardingUrl: result.data.onboardingUrl
        };
      }
      
      return { success: false, error: result.data.error };
    } catch (error) {
      console.error('Error creating Connect account:', error);
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
        await setDoc(doc(db, 'payments', result.data.paymentIntentId), {
          id: result.data.paymentIntentId,
          jobId,
          proposalId,
          amount,
          currency: 'usd',
          status: 'pending',
          type: 'job_payment',
          createdAt: serverTimestamp()
        });
        
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
      if (!stripe) throw new Error('Stripe not loaded');
      
      // Get payment intent details
      const paymentDoc = await getDoc(doc(db, 'payments', paymentIntentId));
      const paymentData = paymentDoc.data();
      
      if (!paymentData) throw new Error('Payment not found');
      
      // Update payment status
      await updateDoc(doc(db, 'payments', paymentIntentId), {
        status: 'held_in_escrow',
        heldAt: serverTimestamp()
      });
      
      // Update job status
      await updateDoc(doc(db, 'jobs', paymentData.jobId), {
        status: 'in_progress',
        paymentStatus: 'escrow',
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error confirming payment:', error);
      return { success: false, error };
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
        // Update job status
        await updateDoc(doc(db, 'jobs', jobId), {
          status: 'completed',
          paymentStatus: 'released',
          completedAt: serverTimestamp()
        });
        
        return { success: true, transferId: result.data.transferId };
      }
      
      return { success: false, error: result.data.error };
    } catch (error) {
      console.error('Error releasing payment:', error);
      return { success: false, error };
    }
  },

  // Subscription Management
  async createSubscriptionCheckout(userId: string, plan: 'monthly' | 'quarterly' | 'yearly') {
    try {
      const prices = {
        monthly: import.meta.env.VITE_STRIPE_MONTHLY_PRICE_ID,
        quarterly: import.meta.env.VITE_STRIPE_QUARTERLY_PRICE_ID,
        yearly: import.meta.env.VITE_STRIPE_YEARLY_PRICE_ID
      };
      
      const createCheckout = httpsCallable(fns, 'createSubscriptionCheckout');
      const result = await createCheckout({
        userId,
        priceId: prices[plan],
        successUrl: `${window.location.origin}/dashboard?subscription=success`,
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

  async cancelSubscription(userId: string) {
    try {
      const cancel = httpsCallable(fns, 'cancelSubscription');
      const result = await cancel({ userId }) as any;
      
      if (result.data.success) {
        await updateDoc(doc(db, 'users', userId), {
          subscriptionStatus: 'cancelled',
          subscriptionEndDate: result.data.endDate,
          updatedAt: serverTimestamp()
        });
        
        return { success: true };
      }
      
      return { success: false, error: result.data.error };
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return { success: false, error };
    }
  },

  async getSubscriptionStatus(userId: string) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();
      
      return {
        success: true,
        isActive: userData?.subscriptionStatus === 'active',
        plan: userData?.subscriptionPlan,
        endDate: userData?.subscriptionEndDate
      };
    } catch (error) {
      console.error('Error getting subscription status:', error);
      return { success: false, error };
    }
  },

  // Withdrawal Management
  async createPayout(userId: string, amount: number) {
    try {
      const createPayout = httpsCallable(fns, 'createStripePayout');
      const result = await createPayout({
        userId,
        amount
      }) as any;
      
      if (result.data.success) {
        // Record transaction
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

  // Add this after getBalance method (after line 195)
  
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
      // You can actually use your existing createJobPayment method
      const result = await this.createJobPayment(
        params.jobId,
        params.proposalId,
        params.amount
      );
      
      if (result.success) {
        // Return checkout URL format for redirect
        return {
          success: true,
          checkoutUrl: `/payment/checkout?client_secret=${result.clientSecret}&proposal=${params.proposalId}`
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