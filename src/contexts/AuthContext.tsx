import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  userType: 'freelancer' | 'client' | 'both';
  profileCompleted?: boolean;
  bio?: string;
  skills?: string[];
  hourlyRate?: number;
  location?: string;
  companyName?: string;
  isAvailable?: boolean;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  isFreelancer: boolean;
  isClient: boolean;
  canPostJobs: boolean;
  canApplyToJobs: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  isFreelancer: false,
  isClient: false,
  canPostJobs: false,
  canApplyToJobs: false,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set persistence to LOCAL (persists even after browser close)
    setPersistence(auth, browserLocalPersistence).catch(console.error);

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (!firebaseUser) {
        setUserData(null);
        setLoading(false);
        return;
      }

      // Subscribe to user data changes
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const unsubscribeUserData = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data() as UserData;
          setUserData({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: data.displayName || firebaseUser.displayName || '',
            photoURL: data.photoURL || firebaseUser.photoURL || '',
            userType: data.userType || 'both',
            profileCompleted: data.profileCompleted || false,
            bio: data.bio || '',
            skills: data.skills || [],
            hourlyRate: data.hourlyRate || 0,
            location: data.location || '',
            companyName: data.companyName || '',
            isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
          });
        }
        setLoading(false);
      });

      return () => unsubscribeUserData();
    });

    return () => unsubscribeAuth();
  }, []);

  const value = {
    user,
    userData,
    loading,
    isFreelancer: userData?.userType === 'freelancer' || userData?.userType === 'both',
    isClient: userData?.userType === 'client' || userData?.userType === 'both',
    canPostJobs: userData?.userType === 'client' || userData?.userType === 'both',
    canApplyToJobs: userData?.userType === 'freelancer' || userData?.userType === 'both',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};