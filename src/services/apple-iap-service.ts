// src/services/apple-iap-service.ts
/**
 * Apple In-App Purchase Service for Appilix Framework
 * Handles all Apple IAP transactions through Appilix's postMessage API
 */

interface ApplixProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  rawPrice: number;
  currencyCode: string;
}

interface ApplixResponse {
  type: string;
  response: {
    status: boolean;
    message?: string;
    product?: ApplixProduct;
    transactionId?: string;
    receipt?: string;
  };
}

interface IAPInitRequest {
  product_id: string;
  product_type: 'consumable' | 'non-consumable' | 'auto-renewable-subscription';
}

// Product ID mapping based on App Store Connect configuration
const APPLE_PRODUCT_IDS = {
  proMonthly: '01',  // Pro Monthly subscription
  pro6Months: '02',  // Pro 6 Months subscription
  messages: '03'     // Messages subscription
} as const;

export class AppleIAPService {
  
  /**
   * Check if Appilix IAP is available
   */
  private static isApplixAvailable(): boolean {
    return typeof window !== 'undefined' && 
           window.hasOwnProperty('appilix') &&
           typeof window.appilix?.postMessage === 'function';
  }

  /**
   * Initialize an In-App Purchase with Appilix
   */
  private static async initializePurchase(request: IAPInitRequest): Promise<ApplixResponse['response']> {
    if (!this.isApplixAvailable()) {
      throw new Error('Apple IAP not available. This feature only works in the iOS app.');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        window.appilix!.onmessage = null;
        reject(new Error('Purchase request timed out. Please try again.'));
      }, 45000); // 45 second timeout

      // Set up listener for Appilix response
      window.appilix!.onmessage = function(event: MessageEvent) {
        clearTimeout(timeout);
        
        try {
          const response: ApplixResponse = JSON.parse(event.data);
          
          if (response.type === 'apple_iap_init') {
            // Remove listener after receiving response
            window.appilix!.onmessage = null;
            
            if (response.response.status) {
              resolve(response.response);
            } else {
              reject(new Error(response.response.message || 'Purchase failed'));
            }
          }
        } catch (error) {
          window.appilix!.onmessage = null;
          reject(new Error('Failed to parse IAP response'));
        }
      };

      // Send purchase request to Appilix
      try {
        window.appilix!.postMessage(JSON.stringify({
          type: "apple_iap_init",
          props: request
        }));
      } catch (error) {
        clearTimeout(timeout);
        window.appilix!.onmessage = null;
        reject(new Error('Failed to send purchase request'));
      }
    });
  }

  /**
   * Purchase Pro Monthly subscription
   */
  static async purchaseProMonthly(): Promise<ApplixResponse['response']> {
    console.log('🍎 Initiating Pro Monthly subscription purchase...');
    
    const response = await this.initializePurchase({
      product_id: APPLE_PRODUCT_IDS.proMonthly,
      product_type: 'auto-renewable-subscription'
    });

    console.log('✅ Pro Monthly purchase response:', response);
    return response;
  }

  /**
   * Purchase Pro 6 Months subscription
   */
  static async purchasePro6Months(): Promise<ApplixResponse['response']> {
    console.log('🍎 Initiating Pro 6 Months subscription purchase...');
    
    const response = await this.initializePurchase({
      product_id: APPLE_PRODUCT_IDS.pro6Months,
      product_type: 'auto-renewable-subscription'
    });

    console.log('✅ Pro 6 Months purchase response:', response);
    return response;
  }

  /**
   * Purchase Messages subscription
   */
  static async purchaseMessages(): Promise<ApplixResponse['response']> {
    console.log('🍎 Initiating Messages subscription purchase...');
    
    const response = await this.initializePurchase({
      product_id: APPLE_PRODUCT_IDS.messages,
      product_type: 'auto-renewable-subscription'
    });

    console.log('✅ Messages purchase response:', response);
    return response;
  }

  /**
   * Generic purchase method by plan type
   */
  static async purchaseSubscription(
    planType: 'monthly' | 'sixmonths' | 'messages'
  ): Promise<ApplixResponse['response']> {
    switch (planType) {
      case 'monthly':
        return this.purchaseProMonthly();
      case 'sixmonths':
        return this.purchasePro6Months();
      case 'messages':
        return this.purchaseMessages();
      default:
        throw new Error(`Invalid plan type: ${planType}`);
    }
  }

  /**
   * Check if device supports Apple IAP
   */
  static isSupported(): boolean {
    return this.isApplixAvailable();
  }

  /**
   * Get product information (if needed for display)
   */
  static getProductInfo(productId: string): { id: string; name: string } {
    const productMap: Record<string, { id: string; name: string }> = {
      [APPLE_PRODUCT_IDS.proMonthly]: { id: '01', name: 'Pro Monthly' },
      [APPLE_PRODUCT_IDS.pro6Months]: { id: '02', name: 'Pro 6 Months' },
      [APPLE_PRODUCT_IDS.messages]: { id: '03', name: 'Messages' }
    };

    return productMap[productId] || { id: productId, name: 'Unknown Product' };
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    appilix?: {
      postMessage: (message: string) => void;
      onmessage: ((event: MessageEvent) => void) | null;
    };
  }
}

export default AppleIAPService;