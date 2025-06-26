// src/lib/firebase.ts
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getFunctions, Functions } from 'firebase/functions';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getMessaging, isSupported, Messaging } from 'firebase/messaging';
import { getAnalytics, Analytics } from 'firebase/analytics';

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase with proper types
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let fns: Functions;
let storage: FirebaseStorage;
let analytics: Analytics | null = null;
let messaging: Messaging | null = null;

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  
  // Initialize services
  auth = getAuth(app);
  db = getFirestore(app);
  fns = getFunctions(app, 'europe-west1'); // Match your firebase.json region
  storage = getStorage(app);
  
  // Analytics - only in production and in browser
  if (typeof window !== 'undefined' && import.meta.env.PROD) {
    try {
      analytics = getAnalytics(app);
    } catch (e) {
      console.log("Analytics not available:", e);
    }
  }
  
  console.log("✅ Firebase initialized successfully");
  
} catch (error) {
  console.error("❌ Firebase initialization error:", error);
  throw new Error("Failed to initialize Firebase. Check your configuration.");
}

// Export typed instances directly
export { app, auth, db, fns, storage, analytics };

// Helper to get messaging (only works in browser with HTTPS)
export const getMessagingIfSupported = async (): Promise<Messaging | null> => {
  try {
    if (typeof window !== 'undefined' && await isSupported()) {
      if (!messaging) {
        messaging = getMessaging(app);
      }
      return messaging;
    }
  } catch (error) {
    console.error("Firebase messaging not supported:", error);
  }
  return null;
};

// Helper to check if Firebase is properly initialized
export const isFirebaseInitialized = (): boolean => {
  return !!(app && auth && db && storage);
};