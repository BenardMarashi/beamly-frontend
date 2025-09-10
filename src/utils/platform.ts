// src/utils/platform.ts

/**
 * Platform detection utility for App Store compliance
 * Detects iOS/Android based on User Agent patterns
 */

export interface PlatformInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  isWeb: boolean;
  userAgent: string;
}

/**
 * Detect platform from User Agent string
 * iOS UA: Mozilla/5.0 iOS(iPhoCPU iPhone OS 16_6 like Mac OS X) App{VERSION_CODE} AppleWebKit/605.1.15
 * Android UA: Mozilla/5.0 android(Linux; Android; K) App{VERSION_CODE} AppleWebKit/537.36
 */
export function detectPlatform(userAgent?: string): PlatformInfo {
  const ua = (userAgent || navigator.userAgent || '').toLowerCase();
  
  // Match the exact patterns provided (case-insensitive)
  const isIOS = /mozilla\/5\.0\s+ios\s*\(iphocpu/i.test(ua) || 
                /iphone\s+os/i.test(ua) ||
                // Fallback patterns for variations
                /\bios\b.*app/i.test(ua) ||
                (typeof window !== 'undefined' && 
                 'standalone' in window.navigator && 
                 /iphone|ipad|ipod/i.test(ua));
  
  const isAndroid = /mozilla\/5\.0\s+android\s*\(linux/i.test(ua) || 
                    /android.*app/i.test(ua) ||
                    // Fallback patterns
                    /android/i.test(ua);
  
  const isMobile = isIOS || isAndroid;
  const isWeb = !isMobile || (!ua.includes('app') && !ua.includes('App'));
  
  return {
    isIOS,
    isAndroid,
    isMobile,
    isWeb,
    userAgent: ua
  };
}

/**
 * Get billing URL based on platform
 */
export function getBillingURL(): string {
  const platform = detectPlatform();
  
  // Use iOS-specific URL if available and on iOS
  if (platform.isIOS) {
    return import.meta.env.VITE_BILLING_WEB_IOS_URL || 
           import.meta.env.VITE_BILLING_WEB_URL || 
           'https://billing.beamlyapp.com';
  }
  
  // Default billing URL for other platforms
  return import.meta.env.VITE_BILLING_WEB_URL || 'https://billing.beamlyapp.com';
}

/**
 * Check if in-app billing should be shown
 */
export function shouldShowInAppBilling(): boolean {
  const platform = detectPlatform();
  // Only show in-app billing on Android or web
  return !platform.isIOS;
}

/**
 * Server-side platform detection (for SSR if needed)
 */
export function detectPlatformServer(userAgent: string): PlatformInfo {
  return detectPlatform(userAgent);
}

// Export for testing
export const UA_PATTERNS = {
  IOS: 'Mozilla/5.0 iOS(iPhoCPU iPhone OS 16_6 like Mac OS X) App{VERSION_CODE} AppleWebKit/605.1.15',
  ANDROID: 'Mozilla/5.0 android(Linux; Android; K) App{VERSION_CODE} AppleWebKit/537.36'
};