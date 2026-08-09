import { Company, Quote, FinancialPeriod, Dividend, DataStatus } from '../../src/types';
import { HistoricalPrice } from '../providers/MarketDataProvider';
import { MarketDataNormalizer } from './market-data-normalizer';
import { MarketDataValidator } from './market-data-validator';
import { globalMarketCache } from './market-data-cache';

export interface DataReviewItem {
  id: string;
  type: 'COMPANY' | 'QUOTE' | 'PRICE' | 'FINANCIAL' | 'DIVIDEND';
  symbol: string;
  rawPayload: any;
  normalizedData: any;
  errors: string[];
  anomalies: string[];
  status: DataStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewerNotes?: string;
  source: string;
}

export interface AuditRecord {
  id: string;
  reviewItemId: string;
  action: 'CREATED' | 'APPROVED' | 'REJECTED' | 'MANUALLY_EDITED';
  timestamp: string;
  actor: string;
  details: string;
}

export class MarketDataPublisher {
  private static reviewQueue: DataReviewItem[] = [];
  private static auditLogs: AuditRecord[] = [];

  // Published stores
  private static publishedCompanies = new Map<string, Company>();
  private static publishedQuotes = new Map<string, Quote>();
  private static publishedPrices = new Map<string, HistoricalPrice[]>();
  private static publishedFinancials = new Map<string, FinancialPeriod[]>();
  private static publishedDividends = new Map<string, Dividend[]>();

  public static requireAdminReview(): boolean {
    return process.env.BRVM_REQUIRE_ADMIN_REVIEW !== 'false';
  }

  // PIPELINE PROCESSOR
  public static processIncomingRecord(
    type: 'COMPANY' | 'QUOTE' | 'PRICE' | 'FINANCIAL' | 'DIVIDEND',
    rawPayload: any,
    sourceName = 'Import BRVM'
  ): DataReviewItem {
    const reviewId = `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    let symbol = (rawPayload.symbol || rawPayload.symbole || rawPayload.companySymbol || '').toUpperCase();
    let normalized: any;
    let errors: string[] = [];
    let anomalies: string[] = [];

    // 1. Normalize
    if (type === 'COMPANY') {
      normalized = MarketDataNormalizer.normalizeCompany(rawPayload, sourceName);
      symbol = normalized.symbol;
      const val = MarketDataValidator.validateCompany(normalized);
      errors = val.errors;
      anomalies = val.anomalies;
    } else if (type === 'QUOTE') {
      normalized = MarketDataNormalizer.normalizeQuote(rawPayload, sourceName);
      symbol = normalized.symbol;
      const val = MarketDataValidator.validateQuote(normalized);
      errors = val.errors;
      anomalies = val.anomalies;
    } else if (type === 'PRICE') {
      symbol = (rawPayload.symbol || symbol).toUpperCase();
      const existing = this.publishedPrices.get(symbol) || [];
      normalized = MarketDataNormalizer.normalizePricePoint(rawPayload, symbol, sourceName);
      const val = MarketDataValidator.validateHistoricalPrice(normalized, existing);
      errors = val.errors;
      anomalies = val.anomalies;
    } else if (type === 'FINANCIAL') {
      normalized = MarketDataNormalizer.normalizeFinancialPeriod(rawPayload, sourceName);
      symbol = normalized.companySymbol;
    } else if (type === 'DIVIDEND') {
      normalized = MarketDataNormalizer.normalizeDividend(rawPayload, sourceName);
      symbol = normalized.companySymbol;
    }

    // Determine status
    const requireReview = this.requireAdminReview() || errors.length > 0 || anomalies.length > 0;
    const initialStatus: DataStatus = requireReview ? 'PENDING_REVIEW' : 'PUBLISHED';

    const reviewItem: DataReviewItem = {
      id: reviewId,
      type,
      symbol: symbol || 'UNKNOWN',
      rawPayload,
      normalizedData: normalized,
      errors,
      anomalies,
      status: initialStatus,
      createdAt: new Date().toISOString(),
      source: sourceName,
    };

    this.reviewQueue.push(reviewItem);

    this.addAuditLog(reviewId, 'CREATED', 'system', `Enregistrement reçu depuis ${sourceName}. Statut: ${initialStatus}`);

    // Auto publish if review is not required and no validation errors exist
    if (!requireReview && errors.length === 0) {
      this.publishItem(reviewItem);
    }

    return reviewItem;
  }

  public static publishItem(item: DataReviewItem): void {
    item.status = 'PUBLISHED';

    if (item.type === 'COMPANY') {
      const comp: Company = { ...item.normalizedData, status: 'PUBLISHED' };
      this.publishedCompanies.set(comp.symbol, comp);
    } else if (item.type === 'QUOTE') {
      const quote: Quote = item.normalizedData;
      this.publishedQuotes.set(quote.symbol, quote);

      // Update currentPrice in company record if exists
      const comp = this.publishedCompanies.get(quote.symbol);
      if (comp) {
        comp.currentPrice = quote.price;
        comp.previousClose = quote.previousClose;
        comp.dayChangePercent = quote.changePercent;
        comp.lastUpdated = quote.timestamp;
        comp.source = quote.source;
        this.publishedCompanies.set(comp.symbol, comp);
      }
    } else if (item.type === 'PRICE') {
      const hp: HistoricalPrice = item.normalizedData;
      const list = this.publishedPrices.get(hp.symbol) || [];
      // Replace or insert date
      const filtered = list.filter(p => p.date !== hp.date);
      filtered.push(hp);
      filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      this.publishedPrices.set(hp.symbol, filtered);
    } else if (item.type === 'FINANCIAL') {
      const fp: FinancialPeriod = item.normalizedData;
      const list = this.publishedFinancials.get(fp.companySymbol) || [];
      const filtered = list.filter(f => f.fiscalYear !== fp.fiscalYear);
      filtered.push(fp);
      this.publishedFinancials.set(fp.companySymbol, filtered);
    } else if (item.type === 'DIVIDEND') {
      const div: Dividend = item.normalizedData;
      const list = this.publishedDividends.get(div.companySymbol) || [];
      const filtered = list.filter(d => d.id !== div.id);
      filtered.push(div);
      this.publishedDividends.set(div.companySymbol, filtered);
    }

    globalMarketCache.invalidate();
  }

  public static approveReviewItem(id: string, reviewer = 'Admin', notes?: string): boolean {
    const item = this.reviewQueue.find(r => r.id === id);
    if (!item) return false;

    item.status = 'VERIFIED';
    item.reviewedAt = new Date().toISOString();
    item.reviewedBy = reviewer;
    item.reviewerNotes = notes || 'Approuvé par administrateur';

    this.publishItem(item);
    this.addAuditLog(id, 'APPROVED', reviewer, `Approuvé et publié. Notes: ${notes || 'N/A'}`);
    return true;
  }

  public static rejectReviewItem(id: string, reviewer = 'Admin', notes?: string): boolean {
    const item = this.reviewQueue.find(r => r.id === id);
    if (!item) return false;

    item.status = 'REJECTED';
    item.reviewedAt = new Date().toISOString();
    item.reviewedBy = reviewer;
    item.reviewerNotes = notes || 'Rejeté par administrateur';

    this.addAuditLog(id, 'REJECTED', reviewer, `Rejeté par administrateur. Notes: ${notes || 'N/A'}`);
    return true;
  }

  public static getPendingReviews(): DataReviewItem[] {
    return this.reviewQueue.filter(r => r.status === 'PENDING_REVIEW');
  }

  public static getAllReviews(): DataReviewItem[] {
    return [...this.reviewQueue];
  }

  public static getAuditLogs(): AuditRecord[] {
    return [...this.auditLogs];
  }

  private static addAuditLog(reviewItemId: string, action: AuditRecord['action'], actor: string, details: string) {
    this.auditLogs.push({
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      reviewItemId,
      action,
      timestamp: new Date().toISOString(),
      actor,
      details,
    });
  }

  // Published Getters
  public static getCompanies(): Company[] {
    return Array.from(this.publishedCompanies.values());
  }

  public static getQuote(symbol: string): Quote | null {
    return this.publishedQuotes.get(symbol.toUpperCase()) || null;
  }

  public static getHistoricalPrices(symbol: string): HistoricalPrice[] {
    return this.publishedPrices.get(symbol.toUpperCase()) || [];
  }

  public static getFinancials(symbol: string): FinancialPeriod[] {
    return this.publishedFinancials.get(symbol.toUpperCase()) || [];
  }

  public static getDividends(symbol: string): Dividend[] {
    return this.publishedDividends.get(symbol.toUpperCase()) || [];
  }

  public static clearAll(): void {
    this.reviewQueue = [];
    this.auditLogs = [];
    this.publishedCompanies.clear();
    this.publishedQuotes.clear();
    this.publishedPrices.clear();
    this.publishedFinancials.clear();
    this.publishedDividends.clear();
  }
}
