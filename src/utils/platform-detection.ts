// src/utils/platform-detection.ts
/**
 * Enhanced Platform Detection for Apple IAP Compliance
 * Detects iOS devices based on user agent to determine payment method
 */

export interface PlatformInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  isWeb: boolean;
  isApplixApp: boolean;
  shouldUseAppleIAP: boolean;
  userAgent: string;
}

/**
 * Detect platform from User Agent
 * iOS detection is critical for App Store compliance
 */
export function detectPlatform(): PlatformInfo {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isIOS: false,
      isAndroid: false,
      isMobile: false,
      isWeb: true,
      isApplixApp: false,
      shouldUseAppleIAP: false,
      userAgent: ''
    };
  }

  const userAgent = navigator.userAgent || '';
  const ua = userAgent.toLowerCase();

  // iOS Detection - Multiple patterns for reliability
  const isIOS = 
    // Primary pattern: Check for "ios" in user agent (case insensitive)
    /\bios\b/i.test(userAgent) ||
    // Standard iOS patterns
    /iPad|iPhone|iPod/.test(userAgent) ||
    // iPad Pro on iOS 13+ detection
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
    // Appilix iOS app patterns
    /mozilla\/5\.0\s+ios\s*\(iphocpu/i.test(ua) ||
    /iphone\s+os/i.test(ua);

  // Android Detection
  const isAndroid = 
    /android/i.test(userAgent) ||
    /mozilla\/5\.0\s+android\s*\(linux/i.test(ua);

  // Check if running in Appilix app (has appilix global object)
  const isApplixApp = typeof window !== 'undefined' && 
                      (window.hasOwnProperty('appilix') || 
                      /appilix/i.test(userAgent) ||
                      /app{/i.test(userAgent));

  const isMobile = isIOS || isAndroid;
  const isWeb = !isMobile || (!isApplixApp && !ua.includes('app'));

  // CRITICAL: Only use Apple IAP if on iOS
  // This is the key compliance requirement
  const shouldUseAppleIAP = isIOS && isApplixApp;

  return {
    isIOS,
    isAndroid,
    isMobile,
    isWeb,
    isApplixApp,
    shouldUseAppleIAP,
    userAgent
  };
}

/**
 * Simple check if should use Apple IAP
 * Returns true ONLY if user agent contains "iOS"
 */
export function shouldUseAppleIAP(): boolean {
  if (typeof navigator === 'undefined') return false;
  
  const userAgent = navigator.userAgent || '';
  
  // Primary check: iOS in user agent (case insensitive)
  return /\bios\b/i.test(userAgent);
}

/**
 * Check if Appilix IAP functionality is available
 */
export function isApplixIAPAvailable(): boolean {
  return typeof window !== 'undefined' && 
         window.hasOwnProperty('appilix') &&
         shouldUseAppleIAP();
}

/**
 * Get payment method based on platform
 */
export function getPaymentMethod(): 'apple_iap' | 'stripe' {
  return shouldUseAppleIAP() ? 'apple_iap' : 'stripe';
}

/**
 * Get platform-specific billing URL
 */
export function getBillingURL(): string {
  const platform = detectPlatform();
  
  if (platform.isIOS) {
    return import.meta.env.VITE_BILLING_WEB_IOS_URL || 
           import.meta.env.VITE_BILLING_WEB_URL || 
           'https://billing.beamlyapp.com';
  }
  
  return import.meta.env.VITE_BILLING_WEB_URL || 'https://billing.beamlyapp.com';
}

/**
 * Log platform detection for debugging
 */
export function logPlatformInfo(): void {
  const info = detectPlatform();
  console.log('🔍 Platform Detection:', {
    isIOS: info.isIOS,
    isAndroid: info.isAndroid,
    isMobile: info.isMobile,
    isWeb: info.isWeb,
    isApplixApp: info.isApplixApp,
    shouldUseAppleIAP: info.shouldUseAppleIAP,
    userAgent: info.userAgent,
    paymentMethod: getPaymentMethod()
  });
}

// Export for testing
export const TEST_USER_AGENTS = {
  IOS_APPILIX: 'Mozilla/5.0 iOS(iPhoCPU iPhone OS 16_6 like Mac OS X) App{VERSION_CODE} AppleWebKit/605.1.15',
  ANDROID_APPILIX: 'Mozilla/5.0 android(Linux; Android; K) App{VERSION_CODE} AppleWebKit/537.36',
  IOS_SAFARI: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15',
  ANDROID_CHROME: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36',
  WEB_CHROME: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
};

export default {
  detectPlatform,
  shouldUseAppleIAP,
  isApplixIAPAvailable,
  getPaymentMethod,
  getBillingURL,
  logPlatformInfo,
  TEST_USER_AGENTS
};