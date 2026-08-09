import { describe, it, expect, beforeEach } from 'vitest';
import { MarketDataNormalizer } from '../services/market-data-normalizer';
import { MarketDataValidator } from '../services/market-data-validator';
import { BrvmImportService } from '../services/brvm-import-service';
import { MarketDataPublisher } from '../services/market-data-publisher';
import { DemoMarketDataProvider } from '../providers/DemoMarketDataProvider';
import { BrvmApiMarketDataProvider } from '../providers/BrvmApiMarketDataProvider';

describe('BRVM Market Data Pipeline Tests', () => {
  beforeEach(() => {
    MarketDataPublisher.clearAll();
    BrvmImportService.clearStoredImportedData();
  });

  describe('1. MarketDataNormalizer', () => {
    it('normalise correctement une entreprise et calcule PER uniquement si BPA > 0', () => {
      const rawPos = {
        symbol: 'snts',
        name: 'Sonatel',
        currentPrice: 16500,
        eps: 1850,
        lastDividend: 1575,
      };

      const normalizedPos = MarketDataNormalizer.normalizeCompany(rawPos);
      expect(normalizedPos.symbol).toBe('SNTS');
      expect(normalizedPos.per).toBe(8.92); // 16500 / 1850
      expect(normalizedPos.dividendYield).toBe(9.55); // (1575 / 16500) * 100

      // Case with negative EPS: PER must be undefined!
      const rawNeg = {
        symbol: 'TECH',
        name: 'TechInnov',
        currentPrice: 1400,
        eps: -280,
      };

      const normalizedNeg = MarketDataNormalizer.normalizeCompany(rawNeg);
      expect(normalizedNeg.per).toBeUndefined();
    });
  });

  describe('2. MarketDataValidator', () => {
    it('valide la présence du symbole, le prix positif et de la source', () => {
      const validCompany = MarketDataNormalizer.normalizeCompany({
        symbol: 'SLBC',
        name: 'Solibra',
        currentPrice: 84000,
        source: 'BRVM Officiel',
      });

      const resValid = MarketDataValidator.validateCompany(validCompany);
      expect(resValid.isValid).toBe(true);

      const invalidCompany = MarketDataNormalizer.normalizeCompany({
        symbol: '',
        name: 'Anonyme',
        currentPrice: -500,
      });

      const resInvalid = MarketDataValidator.validateCompany(invalidCompany);
      expect(resInvalid.isValid).toBe(false);
      expect(resInvalid.errors.length).toBeGreaterThan(0);
    });

    it('interdit les doublons de cotation pour un même symbole et même date', () => {
      const existing = [
        { symbol: 'SNTS', date: '2026-08-08', open: 16000, high: 16600, low: 15900, close: 16500, volume: 1000, source: 'BRVM' },
      ];

      const duplicate = { symbol: 'SNTS', date: '2026-08-08', close: 16500, source: 'BRVM' };
      const res = MarketDataValidator.validateHistoricalPrice(duplicate, existing);
      expect(res.isValid).toBe(false);
      expect(res.errors.some(e => e.includes('Doublon interdit'))).toBe(true);
    });
  });

  describe('3. BrvmImportService (CSV / JSON)', () => {
    it('analyse correctement un fichier CSV d\'import de cotations BRVM', () => {
      const csv = `symbol;cours;veille;ouverture;plus_haut;plus_bas;volume;date
SNTS;16500;16200;16200;16600;16100;4500;2026-08-08
SLBC;84000;85000;85000;85500;83500;320;2026-08-08`;

      const parsed = BrvmImportService.parseCsv(csv, 'bulletin_test.csv');
      expect(parsed.quotes.length).toBe(2);
      expect(parsed.quotes[0].symbol).toBe('SNTS');
      expect(parsed.quotes[0].price).toBe(16500);
    });
  });

  describe('4. DemoMarketDataProvider', () => {
    it('fournit la liste des entreprises en mode DEMO', async () => {
      const provider = new DemoMarketDataProvider();
      const companies = await provider.getCompanies();
      expect(companies.length).toBeGreaterThan(0);
      expect(companies.some(c => c.symbol === 'SNTS')).toBe(true);
    });
  });

  describe('5. BrvmApiMarketDataProvider', () => {
    it('lève une erreur de configuration explicite si l\'URL de base n\'est pas configurée', async () => {
      delete process.env.BRVM_API_BASE_URL;
      const apiProvider = new BrvmApiMarketDataProvider();
      await expect(apiProvider.getCompanies()).rejects.toThrow('BRVM_API_BASE_URL');
    });
  });
});
