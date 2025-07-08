import { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { toast } from 'react-hot-toast';

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();

export const useSignIn = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const signInWithEmail = async (email: string, password: string): Promise<User | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Update last active timestamp
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        lastActive: serverTimestamp()
      }, { merge: true });
      
      toast.success('Successfully signed in!');
      return userCredential.user;
    } catch (err: any) {
      console.error('Sign in error:', err);
      let errorMessage = 'Failed to sign in';
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const signInWithGoogle = async (): Promise<User | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user exists in database
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // New user - create profile
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          userType: 'both', // Default to both for new Google users
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastActive: serverTimestamp(),
          profileCompleted: false,
          isVerified: user.emailVerified || false,
          completedProjects: 0,
          rating: 0,
          totalEarnings: 0,
          totalSpent: 0,
          isBlocked: false,
          notifications: {
            email: true,
            push: true,
            sms: false
          }
        });
        toast.success('Account created successfully!');
      } else {
        // Existing user - update last active
        await setDoc(doc(db, 'users', user.uid), {
          lastActive: serverTimestamp(),
          photoURL: user.photoURL || userDoc.data().photoURL // Update photo if changed
        }, { merge: true });
        toast.success('Welcome back!');
      }
      
      return user;
    } catch (err: any) {
      console.error('Google sign in error:', err);
      let errorMessage = 'Failed to sign in with Google';
      
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign in cancelled';
      } else if (err.code === 'auth/popup-blocked') {
        errorMessage = 'Popup blocked by browser. Please allow popups for this site';
      } else if (err.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Another popup is already open';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  return { signInWithEmail, signInWithGoogle, loading, error };
};

export const useSignUp = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const signUp = async (
    email: string, 
    password: string, 
    displayName: string, 
    userType: 'freelancer' | 'client' | 'both'
  ): Promise<User | null> => {
    setLoading(true);
    setError(null);
    
    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update display name
      await updateProfile(user, { displayName });
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName,
        photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0F43EE&color=fff`,
        userType,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        profileCompleted: false,
        isVerified: false,
        completedProjects: 0,
        rating: 0,
        totalEarnings: 0,
        totalSpent: 0,
        isBlocked: false,
        notifications: {
          email: true,
          push: true,
          sms: false
        }
      });
      
      toast.success('Account created successfully!');
      return user;
    } catch (err: any) {
      console.error('Sign up error:', err);
      let errorMessage = 'Failed to create account';
      
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  return { signUp, loading, error };
};

export const useSignOut = () => {
  const [loading, setLoading] = useState(false);
  
  const signOutUser = async () => {
    setLoading(true);
    
    try {
      await signOut(auth);
      toast.success('Signed out successfully');
    } catch (err) {
      console.error('Sign out error:', err);
      toast.error('Failed to sign out');
    } finally {
      setLoading(false);
    }
  };
  
  return { signOut: signOutUser, loading };
};