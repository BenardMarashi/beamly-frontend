import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth, 
  connectAuthEmulator,
  setPersistence,
  browserLocalPersistence 
} from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, Functions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';
import { getAnalytics, Analytics } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let functions: Functions;
let storage: FirebaseStorage;
let analytics: Analytics | null = null;

try {
  app = initializeApp(firebaseConfig);
  
  // Initialize services
  auth = getAuth(app);
  db = getFirestore(app);
  functions = getFunctions(app, 'us-central1');
  storage = getStorage(app);
  
  // Set auth persistence to LOCAL (persists even after browser close)
  setPersistence(auth, browserLocalPersistence).catch(console.error);
  
  // Analytics - only in production
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    analytics = getAnalytics(app);
  }
  
  // Connect to emulators in development
  if (import.meta.env.DEV) {
    const shouldUseEmulator = localStorage.getItem('useEmulator') === 'true';
    
    if (shouldUseEmulator) {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, 'localhost', 8080);
      connectFunctionsEmulator(functions, 'localhost', 5001);
      connectStorageEmulator(storage, 'localhost', 9199);
      console.log('🔧 Connected to Firebase emulators');
    }
  }
  
  console.log('✅ Firebase initialized successfully');
  
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  throw error;
}

export { app, auth, db, functions, storage, analytics };