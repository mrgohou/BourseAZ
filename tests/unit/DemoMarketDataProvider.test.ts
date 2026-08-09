import { describe, it, expect } from 'vitest';
import { DemoMarketDataProvider } from '../../src/services/market-data';

describe('DemoMarketDataProvider Service', () => {
  const provider = new DemoMarketDataProvider();

  it('fournit la liste des entreprises', async () => {
    const companies = await provider.getCompanies();
    expect(companies.length).toBeGreaterThan(0);
    expect(companies.some(c => c.symbol === 'SNTS')).toBe(true);
  });

  it('fournit une cotation (quote) valide pour un symbole connu', async () => {
    const quote = await provider.getQuote('SNTS');
    expect(quote).not.toBeNull();
    expect(quote?.symbol).toBe('SNTS');
    expect(quote?.price).toBeGreaterThan(0);
    expect(quote?.freshness).toBe('delayed');
  });

  it('fournit un fallback de cotation pour un symbole inconnu', async () => {
    const quote = await provider.getQuote('UNKNOWN_SYM');
    expect(quote).not.toBeNull();
    expect(quote?.symbol).toBe('UNKNOWN_SYM');
    expect(quote?.price).toBe(1000);
  });

  it('fournit l’historique des cours', async () => {
    const prices = await provider.getHistoricalPrices('SNTS');
    expect(prices.length).toBeGreaterThan(0);
    expect(prices[0].symbol).toBe('SNTS');
  });

  it('fournit les données financières et de dividendes', async () => {
    const financials = await provider.getFinancials('SNTS');
    expect(financials.length).toBeGreaterThan(0);

    const dividends = await provider.getDividends('SNTS');
    expect(dividends.length).toBeGreaterThan(0);
  });
});
