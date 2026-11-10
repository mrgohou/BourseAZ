import { Router, Request, Response } from 'express';
import { getActiveMarketDataProvider } from '../providers';
import { BrvmImportService } from '../services/brvm-import-service';
import { MarketDataPublisher } from '../services/market-data-publisher';
import { globalMarketCache } from '../services/market-data-cache';
import { marketSyncEngine } from '../services/market-sync-engine';
import { marketAnalysisEngine } from '../services/market-analysis-engine';
import { richBourseScraper } from '../services/richbourse-scraper';
import { marketNewsService } from '../services/market-news-service';
import { emailService } from '../services/email-service';
import { requireAdmin } from '../middleware/auth';

export const apiRouter = Router();

// In-memory rate limiting map for Paco chatbot
const chatRateLimits = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(ip: string, limit = 20, windowMs = 60000): boolean {
  const now = Date.now();
  const record = chatRateLimits.get(ip);
  if (!record || now > record.resetAt) {
    chatRateLimits.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }
  if (record.count >= limit) {
    return true;
  }
  record.count++;
  return false;
}

// Periodically clean expired rate-limit buckets
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of chatRateLimits.entries()) {
    if (now > record.resetAt) chatRateLimits.delete(ip);
  }
}, 300000);

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

// GET /api/mascot-image - Proxy Google Drive mascot image
apiRouter.get('/mascot-image', async (_req: Request, res: Response) => {
  const fileId = '1BvOjQAFlIOZyNPrv7Jp1sqaAl9Huujrv';
  const urls = [
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`,
    `https://lh3.googleusercontent.com/d/${fileId}`,
    `https://drive.google.com/uc?export=download&id=${fileId}`
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('image')) {
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        const buffer = await response.arrayBuffer();
        return res.send(Buffer.from(buffer));
      }
    } catch (err) {
      console.error('Mascot fetch error for', url, err);
    }
  }

  // Fallback 302 redirect to Google Drive direct thumbnail link
  res.redirect(`https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`);
});

// ------------------------------------------------------------------
// REAL-TIME FINANCIAL NEWS & CORPORATE ANNOUNCEMENTS (BRVM)
// ------------------------------------------------------------------

// GET /api/news - Get live scraped news and corporate announcements
apiRouter.get('/news', async (req: Request, res: Response) => {
  try {
    const force = req.query.force === 'true';
    const category = req.query.category as string | undefined;
    const symbol = req.query.symbol as string | undefined;

    const result = await marketNewsService.getLatestNews(force);
    let items = result.items;

    if (category && category !== 'ALL') {
      items = items.filter(i => i.category === category);
    }

    if (symbol) {
      const symUpper = symbol.toUpperCase();
      items = items.filter(i => i.companySymbol === symUpper || i.tags.includes(symUpper));
    }

    res.json({
      success: true,
      data: {
        lastUpdated: result.lastUpdated,
        total: items.length,
        sourcesScraped: result.sourcesScraped,
        items,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'NEWS_FETCH_ERROR',
      message: err.message || 'Erreur lors de la récupération des actualités BRVM.',
    });
  }
});

// POST /api/news/refresh - Trigger on-demand live scraping of news
apiRouter.post('/news/refresh', async (_req: Request, res: Response) => {
  try {
    const result = await marketNewsService.getLatestNews(true);
    res.json({
      success: true,
      message: 'Actualités financières BRVM actualisées en direct.',
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'NEWS_REFRESH_ERROR',
      message: err.message || 'Erreur lors de l’actualisation des flux.',
    });
  }
});

// ------------------------------------------------------------------
// PUBLIC ENDPOINTS
// ------------------------------------------------------------------

// Helper to determine BRVM market trading session state
function getBrvmSessionInfo(snapshotTimestamp?: string) {
  const now = new Date();
  const utcDay = now.getUTCDay(); // 0 = Sun, 6 = Sat
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const utcTimeVal = utcHours * 60 + utcMinutes;

  const isWeekend = utcDay === 0 || utcDay === 6;
  const isMarketHours = !isWeekend && utcTimeVal >= 9 * 60 && utcTimeVal < 15 * 60;
  
  let status: 'SESSION_ACTIVE' | 'SESSION_CLOSED' | 'WEEKEND' | 'PRE_OPENING' = 'SESSION_CLOSED';
  let statusLabel = 'Séance clôturée (Cours officiels du jour)';

  if (isWeekend) {
    status = 'WEEKEND';
    statusLabel = 'Week-end (Dernière séance de clôture)';
  } else if (isMarketHours) {
    status = 'SESSION_ACTIVE';
    statusLabel = 'Séance en cours (Cotations en direct)';
  } else if (utcTimeVal < 9 * 60) {
    status = 'PRE_OPENING';
    statusLabel = 'Pré-ouverture (Clôture précédente)';
  }

  // Format session date in French e.g. "9 novembre 2026"
  const sessionDateFormatted = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now);

  const isoDate = now.toISOString().split('T')[0];

  return {
    status,
    statusLabel,
    isMarketOpen: isMarketHours,
    sessionDate: isoDate,
    sessionDateFormatted,
    serverTimeUtc: now.toISOString(),
    lastUpdated: snapshotTimestamp || now.toISOString(),
  };
}

// GET /api/market/daily-quotes - Comprehensive daily BRVM quotes and session statistics
apiRouter.get('/market/daily-quotes', async (req: Request, res: Response) => {
  const provider = getProvider(res);
  if (!provider) return;

  const force = req.query.force === 'true';
  const cacheKey = `daily_quotes_${process.env.BRVM_DATA_PROVIDER || 'richbourse'}`;

  if (!force) {
    const cached = globalMarketCache.get(cacheKey);
    if (cached) {
      return res.json({ success: true, sourceCache: true, ...(cached as Record<string, any>) });
    }
  }

  try {
    const snapshot = await richBourseScraper.fetchVariations(force);
    const companies = await provider.getCompanies();
    const sessionInfo = getBrvmSessionInfo(snapshot.timestamp);

    const payload = {
      session: sessionInfo,
      metrics: {
        totalSessionValueFcfa: snapshot.totalSessionValueFcfa,
        totalSessionVolume: snapshot.totalSessionVolume,
        totalMarketCapFcfa: snapshot.totalMarketCapFcfa,
        advancesCount: snapshot.advancesCount,
        declinesCount: snapshot.declinesCount,
        unchangedCount: snapshot.unchangedCount,
        totalSecurities: companies.length,
      },
      topGainers: snapshot.topGainers,
      topLosers: snapshot.topLosers,
      mostActiveByValue: snapshot.mostActiveByValue,
      mostActiveByVolume: snapshot.mostActiveByVolume,
      companies,
      source: 'RichBourse / BRVM Marché Officiel',
      provider: process.env.BRVM_DATA_PROVIDER || 'richbourse',
    };

    // Cache for 60 seconds
    globalMarketCache.set(cacheKey, payload, 60);

    res.json({
      success: true,
      ...payload,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'DAILY_QUOTES_FETCH_ERROR',
      message: err.message || 'Erreur lors de la récupération des cours quotidiens BRVM.',
    });
  }
});

// POST /api/market/refresh - Force live scrape of quotes and bust all market caches
apiRouter.post('/market/refresh', async (_req: Request, res: Response) => {
  try {
    globalMarketCache.invalidate();
    const snapshot = await richBourseScraper.fetchVariations(true);
    const provider = getActiveMarketDataProvider();
    const companies = await provider.getCompanies();
    const sessionInfo = getBrvmSessionInfo(snapshot.timestamp);

    res.json({
      success: true,
      message: 'Cours de la séance BRVM actualisés avec succès.',
      session: sessionInfo,
      updatedCount: companies.length,
      totalSessionVolume: snapshot.totalSessionVolume,
      totalSessionValueFcfa: snapshot.totalSessionValueFcfa,
      companies,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'MARKET_REFRESH_ERROR',
      message: err.message || 'Erreur lors du rafraîchissement des cours.',
    });
  }
});

// GET /api/public/companies
apiRouter.get('/public/companies', async (req: Request, res: Response) => {
  const provider = getProvider(res);
  if (!provider) return;

  const force = req.query.force === 'true';
  const cacheKey = `pub_companies_${process.env.BRVM_DATA_PROVIDER || 'richbourse'}`;

  if (!force) {
    const cached = globalMarketCache.get(cacheKey);
    if (cached) {
      return res.json({ success: true, sourceCache: true, data: cached });
    }
  }

  try {
    const companies = await provider.getCompanies();
    globalMarketCache.set(cacheKey, companies, 120); // 2 min cache

    const sessionInfo = getBrvmSessionInfo();

    res.json({
      success: true,
      provider: process.env.BRVM_DATA_PROVIDER || 'richbourse',
      count: companies.length,
      sessionDate: sessionInfo.sessionDate,
      sessionDateFormatted: sessionInfo.sessionDateFormatted,
      isMarketOpen: sessionInfo.isMarketOpen,
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
apiRouter.get('/admin/data-review', requireAdmin as any, (req: Request, res: Response) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 50, 1), 150);
  const reviews = MarketDataPublisher.getAllReviews(limit);
  const pending = MarketDataPublisher.getPendingReviews(limit);
  const auditLogs = MarketDataPublisher.getAuditLogs(limit);

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
apiRouter.post('/admin/data-review/:id/approve', requireAdmin as any, (req: Request, res: Response) => {
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
apiRouter.post('/admin/data-review/:id/reject', requireAdmin as any, (req: Request, res: Response) => {
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
apiRouter.post('/admin/imports', requireAdmin as any, (req: Request, res: Response) => {
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

// ------------------------------------------------------------------
// PACO AI ADVISOR CHATBOT ENDPOINT (Powered by Gemini 3.7 + Search Grounding)
// ------------------------------------------------------------------
apiRouter.post('/chat/paco', async (req: Request, res: Response) => {
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  if (isRateLimited(clientIp, 25, 60000)) {
    return res.status(429).json({
      success: false,
      error: 'TOO_MANY_REQUESTS',
      message: 'Trop de requêtes envoyées à Paco. Veuillez patienter une minute avant de poser une nouvelle question.',
    });
  }

  const { message, history } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'MISSING_MESSAGE',
      message: 'Le champ message est obligatoire.',
    });
  }

  try {
    const { askPacoAI } = await import('../services/paco-gemini');
    const response = await askPacoAI(message.trim(), Array.isArray(history) ? history : []);
    return res.json(response);
  } catch (err: any) {
    console.error('Error in /api/chat/paco route:', err);
    return res.status(500).json({
      success: false,
      error: 'CHAT_ERROR',
      message: err.message || 'Erreur lors du traitement de la question par Paco.',
    });
  }
});


// ------------------------------------------------------------------
// AUTOMATIC 5-MIN MARKET SYNC & WATCHDOG ENDPOINTS
// ------------------------------------------------------------------

// GET /api/market-sync/status - Real-time sync engine & watchdog status
apiRouter.get('/market-sync/status', (_req: Request, res: Response) => {
  const status = marketSyncEngine.getStatus();
  res.json({
    success: true,
    data: status,
  });
});

// POST /api/market-sync/trigger - Trigger an immediate sync run
apiRouter.post('/market-sync/trigger', requireAdmin as any, async (req: Request, res: Response) => {
  const reason = req.body?.reason || 'MANUAL_TRIGGER';
  try {
    const log = await marketSyncEngine.triggerSync('MANUAL_TRIGGER');
    res.json({
      success: log.status !== 'ERROR',
      message: log.message,
      data: log,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'SYNC_TRIGGER_ERROR',
      message: err.message || 'Erreur lors du déclenchement de la synchronisation.',
    });
  }
});

// POST /api/market-sync/recover - Force watchdog recovery, break lock, reset caches & resync
apiRouter.post('/market-sync/recover', requireAdmin as any, async (req: Request, res: Response) => {
  const reason = req.body?.reason || 'Déblocage et relance de synchronisation manuelle';
  try {
    const log = await marketSyncEngine.recoverAndForceSync(reason);
    res.json({
      success: true,
      message: 'Procédure de déblocage et relance de synchronisation exécutée avec succès.',
      data: log,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'RECOVERY_ERROR',
      message: err.message || 'Erreur lors du processus de déblocage/récupération.',
    });
  }
});

// ------------------------------------------------------------------
// AUTOMATIC 15-MIN MARKET ANALYSIS ENDPOINTS
// ------------------------------------------------------------------

// GET /api/market-analysis/latest - Get the most recent 15-minute market analysis report
apiRouter.get('/market-analysis/latest', async (_req: Request, res: Response) => {
  try {
    const report = await marketAnalysisEngine.getLatestAnalysis();
    res.json({
      success: true,
      data: report,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'ANALYSIS_ERROR',
      message: err.message || 'Erreur lors de la récupération de l\'analyse.',
    });
  }
});

// GET /api/market-analysis/history - Get past 15-minute reports
apiRouter.get('/market-analysis/history', (_req: Request, res: Response) => {
  const history = marketAnalysisEngine.getHistory();
  const status = marketAnalysisEngine.getStatus();
  res.json({
    success: true,
    total: history.length,
    status,
    data: history,
  });
});

// POST /api/market-analysis/run - Force an on-demand analysis
apiRouter.post('/market-analysis/run', requireAdmin as any, async (_req: Request, res: Response) => {
  try {
    const report = await marketAnalysisEngine.runAnalysis('MANUAL_ON_DEMAND');
    res.json({
      success: true,
      message: 'Analyse des cours et valeurs exécutée avec succès.',
      data: report,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'ANALYSIS_RUN_ERROR',
      message: err.message || 'Erreur lors de l\'exécution de l\'analyse.',
    });
  }
});

// ------------------------------------------------------------------
// RICHBOURSE DIRECT ENDPOINT (https://www.richbourse.com/common/variation/index)
// ------------------------------------------------------------------

// GET /api/market-data/richbourse - Direct access to live variations and session stats
apiRouter.get('/market-data/richbourse', async (req: Request, res: Response) => {
  const force = req.query.force === 'true';
  try {
    const snapshot = await richBourseScraper.fetchVariations(force);
    res.json({
      success: true,
      data: snapshot,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'RICHBOURSE_SCRAPE_ERROR',
      message: err.message || 'Erreur lors de la récupération des données RichBourse.',
    });
  }
});
// ------------------------------------------------------------------
// AUTHENTICATION & CONFIRMATION EMAIL ENDPOINTS
// ------------------------------------------------------------------

// POST /api/auth/send-confirmation - Send official connection / registration confirmation email
apiRouter.post('/auth/send-confirmation', async (req: Request, res: Response) => {
  const { email, name, type, authProvider, userId } = req.body;

  if (!email || !email.includes('@')) {
    res.status(400).json({
      success: false,
      error: 'INVALID_EMAIL',
      message: 'Adresse e-mail invalide pour l\'envoi de la confirmation.',
    });
    return;
  }

  try {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Navigateur Web';

    const result = await emailService.sendConfirmationEmail({
      email: email.trim().toLowerCase(),
      name: name?.trim() || email.split('@')[0],
      type: type || 'LOGIN_GOOGLE',
      authProvider: authProvider || 'GOOGLE',
      userId,
      ip: clientIp,
      userAgent,
    });

    res.json({
      success: true,
      data: result,
      message: `E-mail de confirmation expédié avec succès à ${email}`,
    });
  } catch (err: any) {
    console.error('[API /auth/send-confirmation] Error:', err);
    res.status(500).json({
      success: false,
      error: 'EMAIL_SEND_FAILED',
      message: err.message || 'Échec lors de l\'envoi de l\'e-mail de confirmation.',
    });
  }
});

// GET /api/auth/email-history - Query recent confirmation emails for a user or admin audit
apiRouter.get('/auth/email-history', async (req: Request, res: Response) => {
  const email = (req.query.email as string)?.toLowerCase()?.trim();

  try {
    // If db (firebase-admin) is available
    const { db } = await import('../lib/firebase-admin');
    if (!db) {
      res.json({ success: true, deliveries: [] });
      return;
    }

    let q: any = db.collection('mail_deliveries').orderBy('sentAt', 'desc').limit(20);
    if (email) {
      q = db.collection('mail_deliveries').where('recipient', '==', email).limit(10);
    }

    const snapshot = await q.get();
    const deliveries = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({
      success: true,
      deliveries,
    });
  } catch (err: any) {
    res.json({
      success: true,
      deliveries: [],
      notice: err.message,
    });
  }
});



