import { MarketDataProvider } from './MarketDataProvider';
import { DemoMarketDataProvider } from './DemoMarketDataProvider';
import { BrvmApiMarketDataProvider } from './BrvmApiMarketDataProvider';
import { BrvmFileImportProvider } from './BrvmFileImportProvider';
import { BrvmGithubPlatformProvider } from './BrvmGithubPlatformProvider';
import { RichBourseMarketDataProvider } from './RichBourseMarketDataProvider';

export function getActiveMarketDataProvider(): MarketDataProvider {
  const providerType = (process.env.BRVM_DATA_PROVIDER || 'richbourse').toLowerCase().trim();

  if (providerType === 'api') {
    const baseUrl = process.env.BRVM_API_BASE_URL;
    if (baseUrl && baseUrl.trim().length > 0) {
      return new BrvmApiMarketDataProvider();
    }
  }

  if (providerType === 'file') {
    return new BrvmFileImportProvider();
  }

  if (providerType === 'github' || providerType === 'brvm-data-platform') {
    return new BrvmGithubPlatformProvider();
  }

  if (providerType === 'demo') {
    return new DemoMarketDataProvider();
  }

  // Default provider: RichBourse Live Variations (https://www.richbourse.com/common/variation/index)
  return new RichBourseMarketDataProvider();
}

export * from './MarketDataProvider';
export * from './DemoMarketDataProvider';
export * from './BrvmApiMarketDataProvider';
export * from './BrvmFileImportProvider';
export * from './BrvmGithubPlatformProvider';
export * from './RichBourseMarketDataProvider';

