import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { UserData } from '../types/user.types';

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  isFreelancer: boolean;
  isClient: boolean;
  canPostJobs: boolean;
  canApplyToJobs: boolean;
  canPostProjects: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  isFreelancer: false,
  isClient: false,
  canPostJobs: false,
  canApplyToJobs: false,
  canPostProjects: false,
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

    let unsubscribeUserData: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      // Clean up previous user data subscription
      if (unsubscribeUserData) {
        unsubscribeUserData();
        unsubscribeUserData = null;
      }
      
      if (!firebaseUser) {
        setUserData(null);
        setLoading(false);
        return;
      }

      // Subscribe to user data changes
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      unsubscribeUserData = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
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
            companyName: data.companyName || '',
            isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
            portfolio: data.portfolio || '',
            experienceLevel: data.experienceLevel || 'intermediate',
            languages: data.languages || ['English'],
            rating: data.rating || 0,
            completedProjects: data.completedProjects || 0,
            activeJobs: data.activeJobs || 0,
            industry: data.industry || '',
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            lastActive: data.lastActive?.toDate() || new Date(),
            isVerified: data.isVerified || false,
            isBlocked: data.isBlocked || false,
            notifications: data.notifications || {
              email: true,
              push: true,
              sms: false
            },
            subscription: data.subscription
          });
        }
        setLoading(false);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserData) {
        unsubscribeUserData();
      }
    };
  }, []);

  const value = {
    user,
    userData,
    loading,
    isFreelancer: userData?.userType === 'freelancer' || userData?.userType === 'both',
    isClient: userData?.userType === 'client' || userData?.userType === 'both',
    canPostJobs: userData?.userType === 'client' || userData?.userType === 'both',
    canApplyToJobs: userData?.userType === 'freelancer' || userData?.userType === 'both',
    canPostProjects: userData?.userType === 'freelancer' || userData?.userType === 'both',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};