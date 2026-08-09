import { MarketDataProvider } from './MarketDataProvider';
import { DemoMarketDataProvider } from './DemoMarketDataProvider';
import { BrvmApiMarketDataProvider } from './BrvmApiMarketDataProvider';
import { BrvmFileImportProvider } from './BrvmFileImportProvider';
import { BrvmGithubPlatformProvider } from './BrvmGithubPlatformProvider';

export function getActiveMarketDataProvider(): MarketDataProvider {
  const providerType = (process.env.BRVM_DATA_PROVIDER || 'brvm-data-platform').toLowerCase().trim();

  if (providerType === 'api') {
    const baseUrl = process.env.BRVM_API_BASE_URL;
    if (baseUrl && baseUrl.trim().length > 0) {
      return new BrvmApiMarketDataProvider();
    }
  }

  if (providerType === 'file') {
    return new BrvmFileImportProvider();
  }

  // Default real BRVM data provider (Kyac99/brvm-data-platform)
  return new BrvmGithubPlatformProvider();
}

export * from './MarketDataProvider';
export * from './DemoMarketDataProvider';
export * from './BrvmApiMarketDataProvider';
export * from './BrvmFileImportProvider';
export * from './BrvmGithubPlatformProvider';

