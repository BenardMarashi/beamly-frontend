// Firebase configuration example
    // Copy this file to .env with your actual Firebase credentials
    
    export const firebaseConfig = {
      apiKey: "YOUR_API_KEY",
      authDomain: "your-project-id.firebaseapp.com",
      projectId: "your-project-id",
      storageBucket: "your-project-id.appspot.com",
      messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
      appId: "YOUR_APP_ID",
      measurementId: "YOUR_MEASUREMENT_ID"
    };
    
    // Payment provider configuration
    export const PAYMENT_PROVIDER = "stripe"; // or "paddle"
    
    // Stripe configuration
    export const STRIPE_PUBLIC_KEY = "pk_test_your_stripe_public_key";
    
    // Paddle configuration
    export const PADDLE_CLIENT_TOKEN = "your_paddle_client_token";
    export const PADDLE_ENVIRONMENT = "sandbox"; // or "production"
