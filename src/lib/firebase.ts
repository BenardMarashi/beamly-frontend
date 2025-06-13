import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';
import { getAnalytics } from 'firebase/analytics'; // Add this import

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'demo-app-id',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-DEMO'
};

// Initialize Firebase with error handling
let app;
let auth;
let db;
let fns;
let storage;
let analytics;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  fns = getFunctions(app);
  storage = getStorage(app);
  
  // Analytics might not work in all environments
  try {
    analytics = getAnalytics(app);
  } catch (e) {
    console.log("Analytics not available in this environment");
  }
  
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization error:", error);
  console.log("Running in demo mode without Firebase");
}

export { app, auth, db, fns, storage, analytics };

// Initialize messaging if supported
export const getMessagingIfSupported = async () => {
  try {
    if (await isSupported()) {
      return getMessaging(app);
    }
  } catch (error) {
    console.error("Firebase messaging not supported:", error);
  }
  return null;
};

console.log("Firebase initialized successfully");