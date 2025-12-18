import { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  User,
  sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, query, collection, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import { OAuthProvider } from 'firebase/auth';

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();
const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');
export const useSignIn = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const signInWithEmail = async (email: string, password: string): Promise<User | null> => {
  setLoading(true);
  setError(null);
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get user document from Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    // Check if this is a NEW user (created after implementation date)
    const implementationDate = new Date('2025-10-03T00:00:00'); // ← SET TO TODAY
    let isNewUser = true;
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const userCreatedAt = userData.createdAt?.toDate?.() || new Date(0);
      isNewUser = userCreatedAt >= implementationDate;
    }
    
    // ONLY block NEW users who haven't verified their email
    if (isNewUser && !user.emailVerified) {
      toast.error(
        'Please verify your email before signing in. Check your inbox for the verification link.',
        { duration: 8000 }
      );
      await signOut(auth);
      setError('Email not verified');
      return null;
    }
    
    // Update last active timestamp
    await setDoc(doc(db, 'users', user.uid), {
      lastActive: serverTimestamp()
    }, { merge: true });
    
    toast.success('Successfully signed in!');
    return user;
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
        // Check if email is already used with another account
        const emailQuery = query(
          collection(db, 'users'),
          where('email', '==', user.email)
        );
        const emailSnapshot = await getDocs(emailQuery);
        
        if (!emailSnapshot.empty) {
          // Email already exists with different auth method
          await auth.currentUser?.delete();
          throw new Error('This email is already registered. Please sign in with your password.');
        }
        
        // New user - prompt for account type selection
        toast('Please complete your profile setup', {
          icon: 'ℹ️',
          duration: 4000
        });
        
        // Create initial user document with pending status
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || '')}&background=0F43EE&color=fff`,
          userType: 'pending', // Will be set during onboarding
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
          authProvider: 'google',
          notifications: {
            email: true,
            push: true,
            sms: false
          }
        });
      } else {
        // Existing user - update last active
        await setDoc(doc(db, 'users', user.uid), {
          lastActive: serverTimestamp(),
          photoURL: user.photoURL || userDoc.data().photoURL // Update photo if changed
        }, { merge: true });
        
        if (userDoc.data().userType === 'pending') {
          toast('Please complete your profile setup', {
            icon: 'ℹ️',
            duration: 4000
          });
        } else {
          toast.success('Welcome back!');
        }
      }
      
      return user;
    } catch (err: any) {
      console.error('Google sign in error:', err);
      let errorMessage = 'Failed to sign in with Google';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.code === 'auth/popup-closed-by-user') {
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
  
  const signInWithApple = async (): Promise<User | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await signInWithPopup(auth, appleProvider);
      const user = result.user;
      
      // Check if user exists in database
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // Check if email is already used with another account
        if (user.email) {  // Apple might hide email
          const emailQuery = query(
            collection(db, 'users'),
            where('email', '==', user.email)
          );
          const emailSnapshot = await getDocs(emailQuery);
          
          if (!emailSnapshot.empty) {
            await auth.currentUser?.delete();
            throw new Error('This email is already registered. Please sign in with your password.');
          }
        }
        
        // New user - prompt for account type selection
        toast('Please complete your profile setup', {
          icon: 'ℹ️',
          duration: 4000
        });
        
        // Create initial user document with pending status
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email || `${user.uid}@privaterelay.appleid.com`, // Apple may hide email
          displayName: user.displayName || 'Apple User',
          photoURL: user.photoURL || `https://ui-avatars.com/api/?name=Apple+User&background=000000&color=fff`,
          userType: 'pending',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastActive: serverTimestamp(),
          profileCompleted: false,
          isVerified: true, // Apple users are pre-verified
          completedProjects: 0,
          rating: 0,
          totalEarnings: 0,
          totalSpent: 0,
          isBlocked: false,
          authProvider: 'apple',
          notifications: {
            email: true,
            push: true,
            sms: false
          }
        });
      } else {
        // Existing user - update last active
        await setDoc(doc(db, 'users', user.uid), {
          lastActive: serverTimestamp()
        }, { merge: true });
        
        if (userDoc.data().userType === 'pending') {
          toast('Please complete your profile setup', {
            icon: 'ℹ️',
            duration: 4000
          });
        } else {
          toast.success('Welcome back!');
        }
      }
      
      return user;
    } catch (err: any) {
      console.error('Apple sign in error:', err);
      let errorMessage = 'Failed to sign in with Apple';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.code === 'auth/popup-closed-by-user') {
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

  return { signInWithEmail, signInWithGoogle, signInWithApple, loading, error };
};

export const useSignUp = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const signUp = async (
    email: string, 
    password: string, 
    displayName: string, 
    userType: 'freelancer' | 'client'
  ): Promise<User | null> => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if email already exists
      const emailQuery = query(
        collection(db, 'users'),
        where('email', '==', email)
      );
      const emailSnapshot = await getDocs(emailQuery);
      
      if (!emailSnapshot.empty) {
        throw new Error('This email is already registered');
      }
      
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      toast.success('Account created! Please verify your email to continue.', {
        duration: 6000
      });

      // Update display name
      await updateProfile(user, { displayName });
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName,
        photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0F43EE&color=fff`,
        userType, // Set the specific type, not 'both'
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
        authProvider: 'email',
        notifications: {
          email: true,
          push: true,
          sms: false
        }
      });
      
      // If freelancer, create a basic profile
      if (userType === 'freelancer') {
        await setDoc(doc(db, 'freelancerProfiles', user.uid), {
          userId: user.uid,
          displayName,
          bio: '',
          skills: [],
          hourlyRate: 0,
          location: '',
          portfolio: '',
          experienceLevel: 'entry',
          languages: ['English'],
          isAvailable: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      
      toast.success('Account created successfully!');
      return user;
    } catch (err: any) {
      console.error('Sign up error:', err);
      let errorMessage = 'Failed to create account';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
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