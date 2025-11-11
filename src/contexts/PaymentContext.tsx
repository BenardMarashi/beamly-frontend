// src/contexts/PaymentContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  detectPlatform, 
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

const defaultPlatform: PlatformInfo = {
  isIOS: false,
  isAndroid: false,
  isMobile: false,
  isWeb: true,
  isApplixApp: false,
  shouldUseAppleIAP: false,
  userAgent: ''
};

export const PaymentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [platform, setPlatform] = useState<PlatformInfo>(defaultPlatform);
  const [paymentMethod, setPaymentMethod] = useState<'apple_iap' | 'stripe'>('stripe');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      // Detect platform safely
      const platformInfo = detectPlatform();
      setPlatform(platformInfo);
      
      // Determine payment method
      const method = platformInfo.shouldUseAppleIAP ? 'apple_iap' : 'stripe';
      setPaymentMethod(method);

      setIsLoading(false);

      // Safe logging
      if (typeof console !== 'undefined') {
        console.log('💳 Payment Method:', method.toUpperCase());
        console.log('📱 Platform:', platformInfo.isIOS ? 'iOS' : platformInfo.isAndroid ? 'Android' : 'Web');
      }
    } catch (error) {
      // Fallback to safe defaults if anything fails
      console.error('PaymentContext initialization error:', error);
      setPlatform(defaultPlatform);
      setPaymentMethod('stripe');
      setIsLoading(false);
    }
  }, []);

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

export const usePayment = (): PaymentContextType => {
  const context = useContext(PaymentContext);
  
  if (context === undefined) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  
  return context;
};

export default PaymentContext;