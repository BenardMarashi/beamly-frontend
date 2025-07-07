import { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { toast } from 'react-hot-toast';

// Updated Google Auth configuration
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account' // Always prompt for account selection
});

// Helper to create/update user document
async function createOrUpdateUserDocument(user: any, additionalData?: any) {
  const userRef = doc(db, 'users', user.uid);
  
  try {
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      // New user - create complete profile
      const userData = {
        uid: user.uid,
        email: user.email || '',
        displayName: additionalData?.displayName || user.displayName || '',
        photoURL: user.photoURL || '',
        userType: additionalData?.userType || 'both',
        profileCompleted: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        
        // Initialize all fields
        bio: '',
        skills: [],
        hourlyRate: 0,
        location: '',
        companyName: '',
        industry: '',
        
        // System fields
        completedProjects: 0,
        rating: 0,
        totalEarnings: 0,
        totalSpent: 0,
        isVerified: false,
        isBlocked: false,
        isAvailable: true,
        
        // Notification preferences
        notifications: {
          email: true,
          push: true,
          sms: false
        },
        
        ...additionalData
      };
      
      await setDoc(userRef, userData);
      console.log('User document created with type:', userData.userType);
    } else {
      // Existing user - update last active
      const updates: any = {
        lastActive: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // If userType is missing, add it
      const existingData = userSnap.data();
      if (!existingData.userType) {
        updates.userType = additionalData?.userType || 'both';
      }
      
      await setDoc(userRef, updates, { merge: true });
    }
  } catch (error) {
    console.error('Error creating/updating user document:', error);
    throw error;
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
      await setPersistence(auth, browserLocalPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Update last active
      await createOrUpdateUserDocument(userCredential.user);
      
      return userCredential.user;
    } catch (err: any) {
      const errorMessage = getAuthErrorMessage(err.code);
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInWithPopup(auth, googleProvider);
      
      // Create or update user document
      await createOrUpdateUserDocument(result.user);
      
      return result.user;
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        const errorMessage = getAuthErrorMessage(err.code);
        setError(errorMessage);
        toast.error(errorMessage);
      }
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
  
  const signUp = async (
    email: string, 
    password: string, 
    displayName: string, 
    userType: 'freelancer' | 'client' | 'both' = 'both'
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      await setPersistence(auth, browserLocalPersistence);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name
      await updateProfile(userCredential.user, { displayName });
      
      // Create user document with correct type
      await createOrUpdateUserDocument(userCredential.user, { 
        displayName, 
        userType
      });
      
      return userCredential.user;
    } catch (err: any) {
      const errorMessage = getAuthErrorMessage(err.code);
      setError(errorMessage);
      toast.error(errorMessage);
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
    } catch (err: any) {
      const errorMessage = getAuthErrorMessage(err.code);
      setError(errorMessage);
      toast.error(errorMessage);
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

// Error message helper
function getAuthErrorMessage(code: string): string {
  const errorMap: { [key: string]: string } = {
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/invalid-email': 'Invalid email address.',
    'auth/operation-not-allowed': 'Email/password accounts are not enabled.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.'
  };
  
  return errorMap[code] || 'An error occurred. Please try again.';
}