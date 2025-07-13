// Environment variable validation and configuration

interface EnvConfig {
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
  };
  stripe?: {
    publishableKey: string;
  };
  app: {
    env: 'development' | 'production' | 'test';
    url: string;
  };
  features: {
    enableAnalytics: boolean;
    enableErrorReporting: boolean;
  };
}

class EnvironmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvironmentError';
  }
}

// Type-safe environment variable access
const viteEnv = import.meta.env as ImportMetaEnv;

function getRequiredEnvVar(key: keyof ImportMetaEnv): string {
  const value = viteEnv[key];
  if (!value || value === '') {
    throw new EnvironmentError(
      `Missing required environment variable: ${key}. Please check your .env file.`
    );
  }
  return value;
}

function getOptionalEnvVar(key: keyof ImportMetaEnv, defaultValue?: string): string | undefined {
  const value = viteEnv[key];
  return value || defaultValue;
}

function getBooleanEnvVar(key: keyof ImportMetaEnv, defaultValue: boolean = false): boolean {
  const value = viteEnv[key];
  if (value === undefined || value === '') return defaultValue;
  return value === 'true' || value === '1';
}

// Validate and export environment configuration
export const envConfig: EnvConfig = {
  firebase: {
    apiKey: getRequiredEnvVar('VITE_FIREBASE_API_KEY'),
    authDomain: getRequiredEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: getRequiredEnvVar('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: getRequiredEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: getRequiredEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: getRequiredEnvVar('VITE_FIREBASE_APP_ID'),
    measurementId: getOptionalEnvVar('VITE_FIREBASE_MEASUREMENT_ID'),
  },
  stripe: viteEnv.VITE_STRIPE_PUBLISHABLE_KEY ? {
    publishableKey: getRequiredEnvVar('VITE_STRIPE_PUBLISHABLE_KEY'),
  } : undefined,
  app: {
    env: (getOptionalEnvVar('VITE_APP_ENV', 'development') as 'development' | 'production' | 'test'),
    url: getOptionalEnvVar('VITE_APP_URL', 'http://localhost:5173') || 'http://localhost:5173',
  },
  features: {
    enableAnalytics: getBooleanEnvVar('VITE_ENABLE_ANALYTICS', false),
    enableErrorReporting: getBooleanEnvVar('VITE_ENABLE_ERROR_REPORTING', false),
  },
};

// Log environment info (but not sensitive data)
console.log('🚀 Environment:', {
  env: envConfig.app.env,
  url: envConfig.app.url,
  features: envConfig.features,
});

// Export individual configs for convenience
export const firebaseConfig = envConfig.firebase;
export const stripeConfig = envConfig.stripe;
export const appConfig = envConfig.app;
export const featureFlags = envConfig.features;

// Export env for backward compatibility
export const env = envConfig;