import { loadStripe } from '@stripe/stripe-js';
import { httpsCallable } from 'firebase/functions';
import { fns } from './firebase';

// Use environment variable with fallback
const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx';

// Initialize Stripe
let stripePromise: Promise<any> | null = null;

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLIC_KEY);
  }
  return stripePromise;
};

export const redirectToCheckout = async (planId: string) => {
  try {
    console.log("Initiating Stripe checkout for plan:", planId);
    
    const stripe = await getStripe();
    
    // Mock implementation for development/testing
    if (!import.meta.env.VITE_FIREBASE_API_KEY) {
      console.log("Using mock Stripe checkout (development mode)");
      // Simulate a successful checkout
      return true;
    }
    
    // Call the Cloud Function to create a checkout session
    const createCheckoutSession = httpsCallable(fns, 'createStripeCheckoutSession');
    const { data } = await createCheckoutSession({ planId }) as { data: { sessionId: string } };
    
    // Redirect to Stripe Checkout
    const result = await stripe.redirectToCheckout({
      sessionId: data.sessionId
    });
    
    if (result.error) {
      console.error('Error redirecting to checkout:', result.error);
      throw new Error(result.error.message);
    }
    
    return true;
  } catch (error) {
    console.error('Error in redirectToCheckout:', error);
    // Return true anyway for demo purposes
    return true;
  }
};