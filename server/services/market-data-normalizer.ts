import { Company, Quote, FinancialPeriod, Dividend, DataFreshness } from '../../src/types';
import { HistoricalPrice } from '../providers/MarketDataProvider';

export class MarketDataNormalizer {
  public static normalizeCompany(raw: any, defaultSource = 'Source BRVM Officielle', freshness: DataFreshness = 'end_of_day'): Company {
    const symbol = String(raw.symbol || raw.symbole || '').trim().toUpperCase();
    const currentPrice = Number(raw.currentPrice ?? raw.price ?? raw.cours ?? raw.dernier) || 0;
    const previousClose = Number(raw.previousClose ?? raw.previous_close ?? raw.veille) || currentPrice;
    
    let dayChangePercent = Number(raw.dayChangePercent ?? raw.change_percent) || 0;
    if (!raw.dayChangePercent && previousClose > 0) {
      dayChangePercent = parseFloat((((currentPrice - previousClose) / previousClose) * 100).toFixed(2));
    }

    const eps = raw.eps !== undefined && raw.eps !== null && raw.eps !== '' ? Number(raw.eps) : undefined;
    
    // PER calculation rule: calculated ONLY if EPS > 0!
    let per: number | undefined = undefined;
    if (eps !== undefined && eps > 0 && currentPrice > 0) {
      per = parseFloat((currentPrice / eps).toFixed(2));
    } else if (raw.per !== undefined && raw.per !== null && Number(raw.per) > 0) {
      per = Number(raw.per);
    }

    const lastDividend = raw.lastDividend !== undefined && raw.lastDividend !== null ? Number(raw.lastDividend) : 0;
    let dividendYield: number | undefined = undefined;
    if (currentPrice > 0 && lastDividend >= 0) {
      dividendYield = parseFloat(((lastDividend / currentPrice) * 100).toFixed(2));
    }

    return {
      id: raw.id || `comp-${symbol}`,
      symbol,
      name: String(raw.name || raw.nom || symbol).trim(),
      sector: String(raw.sector || raw.secteur || 'Autre Secteur').trim(),
      country: String(raw.country || raw.pays || 'UEMOA').trim(),
      market: String(raw.market || raw.marche || 'BRVM - Cote Principale').trim(),
      description: String(raw.description || `Entreprise ${symbol} cotée à la BRVM.`).trim(),
      logoUrl: raw.logoUrl || undefined,
      currentPrice,
      previousClose,
      dayChangePercent,
      freshness,
      lastUpdated: raw.lastUpdated || raw.timestamp || new Date().toISOString(),
      source: String(raw.source || defaultSource).trim(),
      isDemo: freshness === 'demo' || Boolean(raw.isDemo),
      eps,
      per,
      lastDividend,
      dividendYield,
      lifecycle: raw.lifecycle || 'MATURITE',
      status: raw.status || 'NORMALIZED',
    };
  }

  public static normalizeQuote(raw: any, defaultSource = 'BRVM Quote Engine', freshness: DataFreshness = 'end_of_day'): Quote {
    const symbol = String(raw.symbol || raw.symbole || '').trim().toUpperCase();
    const price = Number(raw.price ?? raw.cours ?? raw.dernier ?? raw.currentPrice) || 0;
    const previousClose = Number(raw.previousClose ?? raw.previous_close ?? raw.veille) || price;
    
    let changePercent = Number(raw.changePercent ?? raw.change_percent) || 0;
    if (!raw.changePercent && previousClose > 0) {
      changePercent = parseFloat((((price - previousClose) / previousClose) * 100).toFixed(2));
    }

    const open = Number(raw.open ?? raw.ouverture) || price;
    const high = Number(raw.high ?? raw.plus_haut) || Math.max(open, price);
    const low = Number(raw.low ?? raw.plus_bas) || Math.min(open, price);
    const volume = Number(raw.volume ?? raw.titres_echanges) || 0;

    return {
      symbol,
      price,
      previousClose,
      changePercent,
      high,
      low,
      open,
      volume,
      timestamp: raw.timestamp || raw.date || new Date().toISOString(),
      source: String(raw.source || defaultSource).trim(),
      freshness,
    };
  }

  public static normalizePricePoint(raw: any, symbol: string, defaultSource = 'BRVM Historique'): HistoricalPrice {
    const close = Number(raw.close ?? raw.cours ?? raw.prix) || 0;
    const open = Number(raw.open ?? raw.ouverture) || close;
    const high = Number(raw.high ?? raw.plus_haut) || Math.max(open, close);
    const low = Number(raw.low ?? raw.plus_bas) || Math.min(open, close);
    const volume = Number(raw.volume ?? raw.titres_echanges) || 0;

    let dateStr = new Date().toISOString().split('T')[0];
    if (raw.date) {
      dateStr = new Date(raw.date).toISOString().split('T')[0];
    }

    return {
      symbol: symbol.toUpperCase(),
      date: dateStr,
      open,
      high,
      low,
      close,
      volume,
      source: String(raw.source || defaultSource).trim(),
    };
  }

  public static normalizeFinancialPeriod(raw: any, defaultSource = 'Rapport Financier Officiel'): FinancialPeriod {
    const companySymbol = String(raw.companySymbol || raw.symbol || '').trim().toUpperCase();
    return {
      id: raw.id || `fp-${companySymbol}-${raw.fiscalYear || new Date().getFullYear()}`,
      companySymbol,
      fiscalYear: Number(raw.fiscalYear || raw.annee) || new Date().getFullYear(),
      revenue: Number(raw.revenue || raw.chiffre_affaires) || 0,
      netIncome: Number(raw.netIncome || raw.resultat_net) || 0,
      eps: Number(raw.eps || raw.bpa) || 0,
      dividend: Number(raw.dividend || raw.dividende) || 0,
      source: String(raw.source || defaultSource).trim(),
      verified: Boolean(raw.verified ?? true),
    };
  }

  public static normalizeDividend(raw: any, defaultSource = 'Avis Officiel BRVM'): Dividend {
    const companySymbol = String(raw.companySymbol || raw.symbol || '').trim().toUpperCase();
    return {
      id: raw.id || `div-${companySymbol}-${Date.now()}`,
      companySymbol,
      exDate: raw.exDate || raw.date_detachement || new Date().toISOString().split('T')[0],
      paymentDate: raw.paymentDate || raw.date_paiement || new Date().toISOString().split('T')[0],
      amount: Number(raw.amount || raw.dividende || raw.montant) || 0,
      source: String(raw.source || defaultSource).trim(),
      verified: Boolean(raw.verified ?? true),
    };
  }
}
