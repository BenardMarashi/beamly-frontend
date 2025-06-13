import { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
  confirmPasswordReset,
  User
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useFirebase } from '../contexts/firebase-context';
import { MessagingService } from '../lib/messaging';

// Sign In Hook
export const useSignIn = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await updateFCMToken(userCredential.user);
      console.log('User signed in:', userCredential.user.uid);
      return userCredential.user;
    } catch (err: any) {
      const errorMessage = getAuthErrorMessage(err.code);
      setError(errorMessage);
      console.error('Sign in error:', err);
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
      const result = await signInWithPopup(auth, provider);
      
      // Check if this is a new user using metadata
      const isNewUser = result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
      
      if (isNewUser) {
        // Create user document
        await createUserDocument(result.user);
      }
      
      await updateFCMToken(result.user);
      console.log('User signed in with Google:', result.user.uid);
      return result.user;
    } catch (err: any) {
      const errorMessage = getAuthErrorMessage(err.code);
      setError(errorMessage);
      console.error('Google sign in error:', err);
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

// Sign Up Hook
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
      await createUserDocument(userCredential.user, { displayName });
      
      await updateFCMToken(userCredential.user);
      console.log('User signed up:', userCredential.user.uid);
      return userCredential.user;
    } catch (err: any) {
      const errorMessage = getAuthErrorMessage(err.code);
      setError(errorMessage);
      console.error('Sign up error:', err);
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

// Sign Out Hook
export const useSignOut = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const signOut = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await firebaseSignOut(auth);
      console.log('User signed out');
      return true;
    } catch (err: any) {
      const errorMessage = getAuthErrorMessage(err.code);
      setError(errorMessage);
      console.error('Sign out error:', err);
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

// Password Reset Hook
export const usePasswordReset = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const sendResetEmail = async (email: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
      console.log('Password reset email sent');
      return true;
    } catch (err: any) {
      const errorMessage = getAuthErrorMessage(err.code);
      setError(errorMessage);
      console.error('Password reset error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const confirmReset = async (oobCode: string, newPassword: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      console.log('Password reset confirmed');
      return true;
    } catch (err: any) {
      const errorMessage = getAuthErrorMessage(err.code);
      setError(errorMessage);
      console.error('Password reset confirmation error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    sendResetEmail,
    confirmReset,
    loading,
    error,
    success
  };
};

// Main Auth Hook
export const useAuth = () => {
  const { user, loading, error } = useFirebase();
  
  return {
    user,
    isAuthenticated: !!user,
    loading,
    error
  };
};

// Helper Functions
const createUserDocument = async (user: User, additionalData: any = {}) => {
  const userRef = doc(db, 'users', user.uid);
  
  // Check if user document already exists
  const userDoc = await getDoc(userRef);
  if (userDoc.exists()) {
    console.log('User document already exists');
    return;
  }
  
  await setDoc(userRef, {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || additionalData.displayName || '',
    photoURL: user.photoURL || '',
    userType: 'both', // Default to both, user can change later
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    completedJobs: 0,
    rating: 0,
    fcmTokens: {},
    ...additionalData
  });
  
  console.log('User document created');
};

const updateFCMToken = async (user: User) => {
  try {
    const token = await MessagingService.getFCMToken();
    if (token) {
      await MessagingService.saveFCMToken(user.uid, token);
      console.log('FCM token saved');
    }
  } catch (error) {
    console.error('Error updating FCM token:', error);
  }
};

// Error message helper
const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in or use a different email.';
    case 'auth/invalid-email':
      return 'Invalid email address. Please check and try again.';
    case 'auth/operation-not-allowed':
      return 'Email/password accounts are not enabled. Please contact support.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please sign up first.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check and try again.';
    case 'auth/popup-closed-by-user':
      return 'Sign in was cancelled. Please try again.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/requires-recent-login':
      return 'This operation requires recent authentication. Please sign in again.';
    case 'auth/popup-blocked':
      return 'Popup was blocked by your browser. Please allow popups and try again.';
    default:
      return 'An error occurred. Please try again.';
  }
};