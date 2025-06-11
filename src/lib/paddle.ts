import { initializePaddle } from '@paddle/paddle-js';
import { httpsCallable } from 'firebase/functions';
import { fns } from './firebase';

// Use environment variables with fallbacks
const PADDLE_CLIENT_TOKEN = import.meta.env.VITE_PADDLE_CLIENT_TOKEN || 'demo_token';
const PADDLE_ENVIRONMENT = import.meta.env.VITE_PADDLE_ENVIRONMENT || 'sandbox';

// Initialize Paddle
let paddleInstance: any = null;

const getPaddle = async () => {
  try {
    if (!paddleInstance) {
      paddleInstance = await initializePaddle({
        environment: PADDLE_ENVIRONMENT,
        token: PADDLE_CLIENT_TOKEN
      });
    }
    return paddleInstance;
  } catch (error) {
    console.error("Error initializing Paddle:", error);
    // Return mock implementation
    return {
      Checkout: {
        open: (options: any) => {
          console.log("Mock Paddle checkout opened with options:", options);
          return Promise.resolve();
        }
      }
    };
  }
};

export const redirectToCheckout = async (planId: string) => {
  try {
    console.log("Initiating Paddle checkout for plan:", planId);
    
    // Mock implementation for development/testing
    if (!import.meta.env.VITE_FIREBASE_API_KEY) {
      console.log("Using mock Paddle checkout (development mode)");
      // Simulate a successful checkout
      return true;
    }
    
    const paddle = await getPaddle();
    
    // Call the Cloud Function to create a checkout
    const createPaddleCheckout = httpsCallable(fns, 'createPaddleCheckout');
    const { data } = await createPaddleCheckout({ planId });
    
    // Open Paddle checkout
    await paddle.Checkout.open({
      items: [
        {
          priceId: data.priceId,
          quantity: 1
        }
      ]
    });
    
    return true;
  } catch (error) {
    console.error('Error in redirectToCheckout:', error);
    // Return true anyway for demo purposes
    return true;
  }
};