import { Router, Request, Response } from 'express';
import { getActiveMarketDataProvider } from '../providers';
import { BrvmImportService } from '../services/brvm-import-service';
import { MarketDataPublisher } from '../services/market-data-publisher';
import { globalMarketCache } from '../services/market-data-cache';

export const apiRouter = Router();

// Middleware: Provider instance retriever with error catch
function getProvider(res: Response) {
  try {
    return getActiveMarketDataProvider();
  } catch (err: any) {
    res.status(503).json({
      success: false,
      error: 'CONFIGURATION_ERROR',
      message: err.message || 'Erreur de configuration du fournisseur de données BRVM.',
      provider: process.env.BRVM_DATA_PROVIDER || 'demo',
    });
    return null;
  }
}

// ------------------------------------------------------------------
// PUBLIC ENDPOINTS
// ------------------------------------------------------------------

// GET /api/public/companies
apiRouter.get('/public/companies', async (req: Request, res: Response) => {
  const provider = getProvider(res);
  if (!provider) return;

  const cacheKey = `pub_companies_${process.env.BRVM_DATA_PROVIDER}`;
  const cached = globalMarketCache.get(cacheKey);
  if (cached) {
    return res.json({ success: true, sourceCache: true, data: cached });
  }

  try {
    const companies = await provider.getCompanies();
    globalMarketCache.set(cacheKey, companies, 180); // 3 min cache

    res.json({
      success: true,
      provider: process.env.BRVM_DATA_PROVIDER || 'demo',
      count: companies.length,
      data: companies,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'DATA_FETCH_ERROR',
      message: err.message || 'Impossible de récupérer les entreprises.',
    });
  }
});

// GET /api/public/companies/:symbol/quote
apiRouter.get('/public/companies/:symbol/quote', async (req: Request, res: Response) => {
  const provider = getProvider(res);
  if (!provider) return;

  const symbol = req.params.symbol.toUpperCase();
  const cacheKey = `pub_quote_${symbol}`;
  const cached = globalMarketCache.get(cacheKey);
  if (cached) {
    return res.json({ success: true, sourceCache: true, data: cached });
  }

  try {
    const quote = await provider.getQuote(symbol);
    if (!quote) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: `Aucune cotation disponible pour le symbole ${symbol}.`,
        data: null,
      });
    }

    globalMarketCache.set(cacheKey, quote, 60); // 1 min cache
    res.json({ success: true, data: quote });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'QUOTE_FETCH_ERROR',
      message: err.message || `Erreur lors de la récupération du cours pour ${symbol}.`,
    });
  }
});

// GET /api/public/companies/:symbol/prices
apiRouter.get('/public/companies/:symbol/prices', async (req: Request, res: Response) => {
  const provider = getProvider(res);
  if (!provider) return;

  const symbol = req.params.symbol.toUpperCase();
  const startDate = String(req.query.startDate || '');
  const endDate = String(req.query.endDate || '');

  const cacheKey = `pub_prices_${symbol}_${startDate}_${endDate}`;
  const cached = globalMarketCache.get(cacheKey);
  if (cached) {
    return res.json({ success: true, sourceCache: true, data: cached });
  }

  try {
    const prices = await provider.getHistoricalPrices(symbol, startDate, endDate);
    globalMarketCache.set(cacheKey, prices, 300); // 5 min cache
    res.json({ success: true, count: prices.length, data: prices });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'PRICES_FETCH_ERROR',
      message: err.message || `Erreur lors de la récupération de l'historique pour ${symbol}.`,
    });
  }
});

// GET /api/public/companies/:symbol/financials
apiRouter.get('/public/companies/:symbol/financials', async (req: Request, res: Response) => {
  const provider = getProvider(res);
  if (!provider) return;

  const symbol = req.params.symbol.toUpperCase();
  const cacheKey = `pub_financials_${symbol}`;
  const cached = globalMarketCache.get(cacheKey);
  if (cached) {
    return res.json({ success: true, sourceCache: true, data: cached });
  }

  try {
    const financials = await provider.getFinancials(symbol);
    globalMarketCache.set(cacheKey, financials, 600); // 10 min cache
    res.json({ success: true, count: financials.length, data: financials });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'FINANCIALS_FETCH_ERROR',
      message: err.message || `Erreur lors de la récupération des états financiers pour ${symbol}.`,
    });
  }
});

// GET /api/public/companies/:symbol/dividends
apiRouter.get('/public/companies/:symbol/dividends', async (req: Request, res: Response) => {
  const provider = getProvider(res);
  if (!provider) return;

  const symbol = req.params.symbol.toUpperCase();
  const cacheKey = `pub_dividends_${symbol}`;
  const cached = globalMarketCache.get(cacheKey);
  if (cached) {
    return res.json({ success: true, sourceCache: true, data: cached });
  }

  try {
    const dividends = await provider.getDividends(symbol);
    globalMarketCache.set(cacheKey, dividends, 600);
    res.json({ success: true, count: dividends.length, data: dividends });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'DIVIDENDS_FETCH_ERROR',
      message: err.message || `Erreur lors de la récupération de l'historique des dividendes pour ${symbol}.`,
    });
  }
});

// ------------------------------------------------------------------
// ADMIN ENDPOINTS
// ------------------------------------------------------------------

// GET /api/admin/data-review
apiRouter.get('/admin/data-review', (_req: Request, res: Response) => {
  const reviews = MarketDataPublisher.getAllReviews();
  const pending = MarketDataPublisher.getPendingReviews();
  const auditLogs = MarketDataPublisher.getAuditLogs();

  res.json({
    success: true,
    total: reviews.length,
    pendingCount: pending.length,
    requireAdminReview: MarketDataPublisher.requireAdminReview(),
    data: reviews,
    auditLogs,
  });
});

// POST /api/admin/data-review/:id/approve
apiRouter.post('/admin/data-review/:id/approve', (req: Request, res: Response) => {
  const id = req.params.id;
  const reviewer = req.body?.reviewer || 'Admin';
  const notes = req.body?.notes || 'Validation manuelle effectuée par l\'administrateur';

  const ok = MarketDataPublisher.approveReviewItem(id, reviewer, notes);
  if (!ok) {
    return res.status(404).json({
      success: false,
      error: 'NOT_FOUND',
      message: `Enregistrement ${id} introuvable dans la file d'attente.`,
    });
  }

  res.json({
    success: true,
    message: `L'enregistrement ${id} a été validé et publié avec succès.`,
  });
});

// POST /api/admin/data-review/:id/reject
apiRouter.post('/admin/data-review/:id/reject', (req: Request, res: Response) => {
  const id = req.params.id;
  const reviewer = req.body?.reviewer || 'Admin';
  const notes = req.body?.notes || 'Rejet manuel effectué par l\'administrateur';

  const ok = MarketDataPublisher.rejectReviewItem(id, reviewer, notes);
  if (!ok) {
    return res.status(404).json({
      success: false,
      error: 'NOT_FOUND',
      message: `Enregistrement ${id} introuvable dans la file d'attente.`,
    });
  }

  res.json({
    success: true,
    message: `L'enregistrement ${id} a été rejeté.`,
  });
});

// POST /api/admin/imports
apiRouter.post('/admin/imports', (req: Request, res: Response) => {
  const { content, format, filename } = req.body || {};

  if (!content) {
    return res.status(400).json({
      success: false,
      error: 'MISSING_CONTENT',
      message: 'Le contenu du fichier officiel BRVM (content) est obligatoire.',
    });
  }

  try {
    let result;
    if (format === 'json' || (filename && filename.endsWith('.json'))) {
      result = BrvmImportService.parseJson(content, filename);
    } else {
      result = BrvmImportService.parseCsv(content, filename);
    }

    // Pass batch through publisher pipeline
    for (const comp of result.companies) {
      MarketDataPublisher.processIncomingRecord('COMPANY', comp, `Import (${filename || 'bulletin.csv'})`);
    }
    for (const quote of result.quotes) {
      MarketDataPublisher.processIncomingRecord('QUOTE', quote, `Import (${filename || 'bulletin.csv'})`);
    }
    for (const price of result.prices) {
      MarketDataPublisher.processIncomingRecord('PRICE', price, `Import (${filename || 'bulletin.csv'})`);
    }
    for (const fin of result.financials) {
      MarketDataPublisher.processIncomingRecord('FINANCIAL', fin, `Import (${filename || 'bulletin.csv'})`);
    }
    for (const div of result.dividends) {
      MarketDataPublisher.processIncomingRecord('DIVIDEND', div, `Import (${filename || 'bulletin.csv'})`);
    }

    res.json({
      success: true,
      message: `Fichier ${filename || 'bulletin'} importé et soumis au pipeline de validation avec succès.`,
      importedAt: result.importedAt,
      summary: {
        companiesCount: result.companies.length,
        quotesCount: result.quotes.length,
        pricesCount: result.prices.length,
        financialsCount: result.financials.length,
        dividendsCount: result.dividends.length,
      },
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: 'IMPORT_FAILED',
      message: err.message || 'Erreur lors de l\'analyse du fichier d\'import.',
    });
  }
});
