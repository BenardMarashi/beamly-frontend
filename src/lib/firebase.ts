import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';
import { getAnalytics } from 'firebase/analytics';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate config
const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'] as const;
const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig]);

if (missingFields.length > 0) {
  console.error('Missing Firebase configuration fields:', missingFields);
  console.error('Make sure your .env file contains all required VITE_FIREBASE_* variables');
}

// Initialize Firebase
let app: any;
let analytics: any;
let messaging: any;

try {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized successfully');
  
  // Initialize analytics if measurementId is provided and we're in browser
  if (firebaseConfig.measurementId && typeof window !== 'undefined' && import.meta.env.PROD) {
    try {
      analytics = getAnalytics(app);
      console.log('✅ Firebase Analytics initialized');
    } catch (analyticsError) {
      console.warn('⚠️ Failed to initialize Firebase Analytics:', analyticsError);
    }
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase:', error);
  throw error;
}

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Initialize messaging with browser support check
export const getMessagingIfSupported = async () => {
  try {
    const isSupportedBrowser = await isSupported();
    if (isSupportedBrowser && 'Notification' in window) {
      if (!messaging) {
        messaging = getMessaging(app);
        console.log('✅ Firebase Messaging initialized');
      }
      return messaging;
    }
    console.log('⚠️ Firebase Messaging not supported in this browser');
    return null;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Messaging:', error);
    return null;
  }
};

// Connect to emulators if in development
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  try {
    // Check if emulators are already connected
    if (!auth.emulatorConfig) {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    }
    
    // @ts-ignore - Firestore doesn't expose emulator connection status
    if (!db._settings?.host?.includes('localhost:8081')) {
      connectFirestoreEmulator(db, 'localhost', 8081);
    }
    
    // @ts-ignore - Storage doesn't expose emulator connection status
    if (!storage._delegate?._host?.includes('localhost:9199')) {
      connectStorageEmulator(storage, 'localhost', 9199);
    }
    
    // Connect Functions emulator
    connectFunctionsEmulator(functions, 'localhost', 5001);
    
    console.log('✅ Connected to Firebase emulators');
  } catch (error) {
    console.warn('⚠️ Failed to connect to Firebase emulators:', error);
  }
}

// Export for backward compatibility
export const fns = functions;

export { app, analytics, messaging };
export default app;