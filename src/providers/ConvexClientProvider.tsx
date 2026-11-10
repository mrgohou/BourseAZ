import React, { ReactNode } from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';

const convexUrl = (import.meta.env.VITE_CONVEX_URL as string) || '';

let convexClient: ConvexReactClient | null = null;
if (convexUrl && convexUrl.trim().length > 0) {
  try {
    convexClient = new ConvexReactClient(convexUrl);
  } catch (err) {
    console.warn('Convex Client initialization skipped or failed:', err);
  }
}

interface ConvexClientProviderProps {
  children: ReactNode;
}

export const ConvexClientProvider: React.FC<ConvexClientProviderProps> = ({ children }) => {
  if (!convexClient) {
    return <>{children}</>;
  }

  return <ConvexProvider client={convexClient}>{children}</ConvexProvider>;
};
