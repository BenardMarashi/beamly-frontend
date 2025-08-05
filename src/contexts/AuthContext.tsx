// src/contexts/AuthContext.tsx
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
            rating: data.rating || 0,
            reviewCount: data.reviewCount || 0,
            completedProjects: data.completedProjects || 0,
            industry: data.industry || '',
            activeJobs: data.activeJobs || 0,
            experienceLevel: data.experienceLevel || 'entry',
            experience: data.experience || '',
            languages: data.languages || [],
            savedProfiles: data.savedProfiles || [],
            viewCount: data.viewCount || 0,
            
            // Stripe Connect fields
            stripeConnectAccountId: data.stripeConnectAccountId,
            stripeConnectStatus: data.stripeConnectStatus,
            stripeConnectChargesEnabled: data.stripeConnectChargesEnabled,
            stripeConnectPayoutsEnabled: data.stripeConnectPayoutsEnabled,
            stripeConnectDetailsSubmitted: data.stripeConnectDetailsSubmitted,
            totalEarnings: data.totalEarnings || 0,
            availableBalance: data.availableBalance || 0,
            pendingBalance: data.pendingBalance || 0,
            
            // Stripe Customer fields
            stripeCustomerId: data.stripeCustomerId,
            
            // Subscription fields
            isPro: data.isPro || false,
            subscriptionStatus: data.subscriptionStatus,
            subscriptionPlan: data.subscriptionPlan,
            stripeSubscriptionId: data.stripeSubscriptionId,
            subscriptionStartDate: data.subscriptionStartDate?.toDate(),
            subscriptionEndDate: data.subscriptionEndDate?.toDate(),
            
            // Notification settings
            notifications: data.notifications || {
              email: true,
              push: true,
              sms: false,
            },
            
            // System fields
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            lastActive: data.lastActive?.toDate(),
            isVerified: data.isVerified || false,
            isBlocked: data.isBlocked || false,
            joinedAt: data.joinedAt?.toDate() || data.createdAt?.toDate(),
          });
        } else {
          setUserData(null);
        }
        setLoading(false);
      }, (error) => {
        console.error('Error fetching user data:', error);
        setUserData(null);
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

  const isFreelancer = userData?.userType === 'freelancer' || userData?.userType === 'both';
  const isClient = userData?.userType === 'client' || userData?.userType === 'both';
  const canPostJobs = isClient;
  const canApplyToJobs = isFreelancer;
  const canPostProjects = isFreelancer;

  return (
    <AuthContext.Provider value={{
      user,
      userData,
      loading,
      isFreelancer,
      isClient,
      canPostJobs,
      canApplyToJobs,
      canPostProjects,
    }}>
      {children}
    </AuthContext.Provider>
  );
};