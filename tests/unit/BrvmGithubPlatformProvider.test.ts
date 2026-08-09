import { describe, it, expect } from 'vitest';
import { BrvmGithubPlatformProvider } from '../../server/providers/BrvmGithubPlatformProvider';
import { GithubRepoMarketDataProvider } from '../../src/services/market-data/GithubRepoMarketDataProvider';

describe('BRVM Github Data Platform Integration (Kyac99/brvm-data-platform)', () => {
  it('BrvmGithubPlatformProvider recupère les entreprises et cotations', async () => {
    const provider = new BrvmGithubPlatformProvider();
    const companies = await provider.getCompanies();
    expect(companies.length).toBeGreaterThan(0);

    const quote = await provider.getQuote('SNTS');
    expect(quote).not.toBeNull();
    expect(quote?.symbol).toBe('SNTS');
    expect(quote?.source).toContain('Kyac99/brvm-data-platform');
  });

  it('GithubRepoMarketDataProvider (Client) recupère les entreprises et cotations', async () => {
    const provider = new GithubRepoMarketDataProvider();
    const companies = await provider.getCompanies();
    expect(companies.length).toBeGreaterThan(0);

    const quote = await provider.getQuote('SNTS');
    expect(quote).not.toBeNull();
    expect(quote?.symbol).toBe('SNTS');
    expect(quote?.source).toContain('Kyac99/brvm-data-platform');
  });
});
