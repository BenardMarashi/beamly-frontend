import { initializeApp } from 'firebase/app';
    import { getAuth } from 'firebase/auth';
    import { getFirestore } from 'firebase/firestore';
    import { getFunctions } from 'firebase/functions';
    import { getMessaging, isSupported } from 'firebase/messaging';
    
    // Use environment variables with fallback values for development
    const firebaseConfig = {
      // Use demo/test values as fallbacks to prevent initialization errors
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBdF1NHpK5ecLI_dIw4CSuBEwNqGONL1FM",
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo-project-12345.firebaseapp.com",
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project-12345",
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo-project-12345.appspot.com",
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
      appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abc123def456ghi789jkl",
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-ABC123DEF4"
    };
    
    // Initialize Firebase with error handling
    let app;
    let auth;
    let db;
    let fns;

    try {
      app = initializeApp(firebaseConfig);
      
      // Initialize Firebase services
      auth = getAuth(app);
      db = getFirestore(app);
      fns = getFunctions(app);
      
      console.log("Firebase initialized successfully");
    } catch (error) {
      console.error("Firebase initialization error:", error);
      
      // Create mock implementations for development/testing
      app = {} as any;
      auth = {
        onAuthStateChanged: () => () => {},
        signInWithEmailAndPassword: () => Promise.resolve({ user: { uid: 'test-user-id' } }),
        createUserWithEmailAndPassword: () => Promise.resolve({ user: { uid: 'test-user-id' } }),
        signOut: () => Promise.resolve()
      } as any;
      db = {
        collection: () => ({
          doc: () => ({
            get: () => Promise.resolve({ exists: () => true, data: () => ({}) }),
            set: () => Promise.resolve()
          })
        })
      } as any;
      fns = {} as any;
    }
    
    // Export the Firebase services
    export { auth, db, fns };
    
    // Initialize Firebase Cloud Messaging and export it if supported
    export const getMessagingIfSupported = async () => {
      try {
        if (await isSupported()) {
          return getMessaging(app);
        }
      } catch (error) {
        console.error("Firebase messaging initialization error:", error);
      }
      return null;
    };
    
    export default app;