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

// Helper to create user document with proper fields
async function createUserDocument(user: User, additionalData?: any) {
  const userRef = doc(db, 'users', user.uid);
  
  // Check if document already exists
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    console.log('User document already exists');
    return;
  }
  
  // Determine userType from additionalData or default to 'both'
  const userType = additionalData?.userType || 'both';
  
  const userData = {
    uid: user.uid,
    email: user.email || '',
    displayName: additionalData?.displayName || user.displayName || '',
    photoURL: user.photoURL || '',
    userType: userType, // CRITICAL: Ensure userType is set
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastActive: serverTimestamp(),
    completedProjects: 0,
    rating: 0,
    totalEarnings: 0,
    totalSpent: 0,
    isVerified: false,
    isBlocked: false,
    isAvailable: userType === 'freelancer' || userType === 'both',
    skills: [],
    bio: '',
    hourlyRate: 0,
    location: '',
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    ...additionalData // Spread any additional data
  };
  
  try {
    await setDoc(userRef, userData);
    console.log('User document created successfully with type:', userType);
  } catch (error) {
    console.error('Error creating user document:', error);
    throw error;
  }
}

// Helper to update FCM token
async function updateFCMToken(user: User) {
  try {
    // TODO: Implement FCM token update when MessagingService is ready
    console.log('FCM token update skipped - MessagingService not implemented');
  } catch (error) {
    console.error('Error updating FCM token:', error);
  }
}

// Helper to get auth error messages
function getAuthErrorMessage(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/operation-not-allowed':
      return 'Email/password accounts are not enabled.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    default:
      return 'An error occurred. Please try again.';
  }
}

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
      
      // Check if this is a new user
      const userRef = doc(db, 'users', result.user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        // New user - create with default userType 'both'
        await createUserDocument(result.user, { userType: 'both' });
      } else {
        // Existing user - ensure they have userType
        const userData = userSnap.data();
        if (!userData.userType) {
          await setDoc(userRef, { 
            ...userData, 
            userType: 'both',
            updatedAt: serverTimestamp()
          });
        }
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
  
  const signUp = async (email: string, password: string, displayName: string, userType: 'freelancer' | 'client' | 'both' = 'both') => {
    setLoading(true);
    setError(null);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      await updateProfile(userCredential.user, { displayName });
      
      // Create user document with specified userType
      await createUserDocument(userCredential.user, { 
        displayName, 
        userType // Pass the userType
      });
      
      await updateFCMToken(userCredential.user);
      console.log('User signed up with type:', userType);
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
      setSuccess(true);
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

// Export auth instance for direct use if needed
export { auth };