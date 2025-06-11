import { useState } from 'react';
    import { 
      signInWithEmailAndPassword, 
      createUserWithEmailAndPassword, 
      signOut as firebaseSignOut,
      GoogleAuthProvider,
      signInWithPopup,
      updateProfile,
      UserCredential
    } from 'firebase/auth';
    import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
    import { auth, db } from '../lib/firebase';
    import { useFirebase } from '../contexts/firebase-context';
    import { getFCMToken } from '../lib/messaging';
    
    export const useSignIn = () => {
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState<string | null>(null);
      
      const signInWithEmail = async (email: string, password: string) => {
        setLoading(true);
        setError(null);
        
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          await updateFCMToken(userCredential);
          return userCredential.user;
        } catch (err: any) {
          setError(err.message);
          return null;
        } finally {
          setLoading(false);
        }
      };
      
      const signInWithGoogle = async () => {
        setLoading(true);
        setError(null);
        
        try {
          const provider = new GoogleAuthProvider();
          const userCredential = await signInWithPopup(auth, provider);
          
          // Check if this is a new user
          const isNewUser = userCredential.additionalUserInfo?.isNewUser;
          
          if (isNewUser) {
            // Create user document
            await createUserDocument(userCredential);
          }
          
          await updateFCMToken(userCredential);
          return userCredential.user;
        } catch (err: any) {
          setError(err.message);
          return null;
        } finally {
          setLoading(false);
        }
      };
      
      return {
        signInWithEmail,
        signInWithGoogle,
        loading,
        error
      };
    };
    
    export const useSignUp = () => {
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState<string | null>(null);
      
      const signUp = async (email: string, password: string, displayName: string) => {
        setLoading(true);
        setError(null);
        
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          
          // Update profile
          await updateProfile(userCredential.user, { displayName });
          
          // Create user document
          await createUserDocument(userCredential, { displayName });
          
          await updateFCMToken(userCredential);
          return userCredential.user;
        } catch (err: any) {
          setError(err.message);
          return null;
        } finally {
          setLoading(false);
        }
      };
      
      return {
        signUp,
        loading,
        error
      };
    };
    
    export const useSignOut = () => {
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState<string | null>(null);
      
      const signOut = async () => {
        setLoading(true);
        setError(null);
        
        try {
          await firebaseSignOut(auth);
          return true;
        } catch (err: any) {
          setError(err.message);
          return false;
        } finally {
          setLoading(false);
        }
      };
      
      return {
        signOut,
        loading,
        error
      };
    };
    
    export const useAuth = () => {
      const { user, loading, error } = useFirebase();
      
      return {
        user,
        isAuthenticated: !!user,
        loading,
        error
      };
    };
    
    // Helper functions
    const createUserDocument = async (userCredential: UserCredential, additionalData = {}) => {
      const { user } = userCredential;
      const userRef = doc(db, 'users', user.uid);
      
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName || additionalData.displayName || '',
        photoURL: user.photoURL || '',
        createdAt: serverTimestamp(),
        ...additionalData
      }, { merge: true });
    };
    
    const updateFCMToken = async (userCredential: UserCredential) => {
      try {
        const token = await getFCMToken();
        if (token) {
          const userRef = doc(db, 'users', userCredential.user.uid);
          await setDoc(userRef, {
            fcmTokens: {
              [token]: true
            }
          }, { merge: true });
        }
      } catch (error) {
        console.error('Error updating FCM token:', error);
      }
    };
