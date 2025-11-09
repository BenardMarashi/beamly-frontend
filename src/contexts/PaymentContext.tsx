// src/contexts/PaymentContext.tsx
/**
 * Payment Context for managing payment methods across the app
 * Automatically selects Apple IAP for iOS or Stripe for web/Android
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  detectPlatform, 
  shouldUseAppleIAP, 
  getPaymentMethod,
  logPlatformInfo,
  type PlatformInfo 
} from '../utils/platform-detection';

interface PaymentContextType {
  paymentMethod: 'apple_iap' | 'stripe';
  platform: PlatformInfo;
  isIOS: boolean;
  isAndroid: boolean;
  isWeb: boolean;
  shouldUseAppleIAP: boolean;
  isLoading: boolean;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

interface PaymentProviderProps {
  children: ReactNode;
}

export const PaymentProvider: React.FC<PaymentProviderProps> = ({ children }) => {
  const [platform, setPlatform] = useState<PlatformInfo>(() => detectPlatform());
  const [paymentMethod, setPaymentMethod] = useState<'apple_iap' | 'stripe'>(() => getPaymentMethod());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Detect platform on mount
    const platformInfo = detectPlatform();
    setPlatform(platformInfo);
    
    // Set payment method based on platform
    const method = getPaymentMethod();
    setPaymentMethod(method);

    // Log platform info for debugging
    if (import.meta.env.DEV) {
      logPlatformInfo();
    }

    setIsLoading(false);

    // Log payment method selection
    console.log(`💳 Payment Method Selected: ${method.toUpperCase()}`);
    if (platformInfo.shouldUseAppleIAP) {
      console.log('🍎 Apple In-App Purchase is ACTIVE (iOS detected)');
    } else {
      console.log('💰 Stripe Payment is ACTIVE (Web/Android detected)');
    }
  }, []);

  // Re-detect platform if user agent changes (rare, but possible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const newPlatform = detectPlatform();
        const newMethod = getPaymentMethod();
        
        if (newMethod !== paymentMethod) {
          console.log(`🔄 Payment method changed: ${paymentMethod} → ${newMethod}`);
          setPlatform(newPlatform);
          setPaymentMethod(newMethod);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [paymentMethod]);

  const value: PaymentContextType = {
    paymentMethod,
    platform,
    isIOS: platform.isIOS,
    isAndroid: platform.isAndroid,
    isWeb: platform.isWeb,
    shouldUseAppleIAP: platform.shouldUseAppleIAP,
    isLoading
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};

/**
 * Hook to use payment context
 */
export const usePayment = (): PaymentContextType => {
  const context = useContext(PaymentContext);
  
  if (context === undefined) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  
  return context;
};

/**
 * HOC to wrap components that need payment context
 */
export function withPayment<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return function WithPaymentComponent(props: P) {
    return (
      <PaymentProvider>
        <Component {...props} />
      </PaymentProvider>
    );
  };
}

export default PaymentContext;