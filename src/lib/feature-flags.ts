/// <reference types="vite/client" />

/**
 * BourseClair Feature Flags Management
 */

export interface FeatureFlags {
  FEATURE_GOOGLE_AUTH: boolean;
  FEATURE_PHONE_AUTH: boolean;
}

export const getFeatureFlags = (): FeatureFlags => {
  return {
    FEATURE_GOOGLE_AUTH: import.meta.env.VITE_FEATURE_GOOGLE_AUTH !== 'false', // enabled by default
    FEATURE_PHONE_AUTH: import.meta.env.VITE_FEATURE_PHONE_AUTH !== 'false', // enabled by default
  };
};
