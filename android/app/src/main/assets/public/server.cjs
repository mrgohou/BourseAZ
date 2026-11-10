var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server/index.ts
var import_express2 = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");

// server/routes/api.ts
var import_express = require("express");

// server/services/brvm-client.ts
var BrvmClient = class {
  // Rate limit: max 10 requests per second
  constructor(options) {
    this.lastRequestTime = 0;
    this.minIntervalMs = 100;
    this.baseUrl = options?.baseUrl || process.env.BRVM_API_BASE_URL || "";
    this.apiKey = options?.apiKey || process.env.BRVM_API_KEY;
    this.username = options?.username || process.env.BRVM_USERNAME;
    this.password = options?.password || process.env.BRVM_PASSWORD;
    this.timeoutMs = options?.timeoutMs || 8e3;
    this.maxRetries = options?.maxRetries || 2;
  }
  isConfigured() {
    return Boolean(this.baseUrl && this.baseUrl.trim().length > 0);
  }
  maskSecrets(str) {
    if (!str) return str;
    let masked = str;
    if (this.apiKey) masked = masked.replace(new RegExp(this.apiKey, "g"), "***API_KEY_HIDDEN***");
    if (this.password) masked = masked.replace(new RegExp(this.password, "g"), "***PASSWORD_HIDDEN***");
    return masked;
  }
  async enforceRateLimit() {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minIntervalMs) {
      await new Promise((resolve) => setTimeout(resolve, this.minIntervalMs - elapsed));
    }
    this.lastRequestTime = Date.now();
  }
  async fetchWithRetry(endpoint, options = {}) {
    if (!this.isConfigured()) {
      throw new Error(
        "Erreur de configuration BRVM API: BRVM_API_BASE_URL et les identifiants doivent \xEAtre d\xE9finis."
      );
    }
    await this.enforceRateLimit();
    const fullUrl = `${this.baseUrl.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;
    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      ...options.headers || {}
    };
    if (this.apiKey) {
      headers["X-API-KEY"] = this.apiKey;
    } else if (this.username && this.password) {
      const credentials = Buffer.from(`${this.username}:${this.password}`).toString("base64");
      headers["Authorization"] = `Basic ${credentials}`;
    }
    let attempt = 0;
    let lastError = null;
    while (attempt <= this.maxRetries) {
      attempt++;
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);
        console.log(
          `[BRVM Client] [Tentative ${attempt}/${this.maxRetries + 1}] GET ${this.maskSecrets(fullUrl)}`
        );
        const response = await fetch(fullUrl, {
          ...options,
          headers,
          signal: controller.signal
        });
        clearTimeout(timer);
        if (!response.ok) {
          throw new Error(`HTTP Erreur ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(
          `[BRVM Client] \xC9chec tentative ${attempt}: ${this.maskSecrets(lastError.message)}`
        );
        if (attempt <= this.maxRetries) {
          const backoff = Math.pow(2, attempt) * 200;
          await new Promise((r) => setTimeout(r, backoff));
        }
      }
    }
    throw new Error(
      `Impossible d'obtenir les donn\xE9es BRVM apr\xE8s ${this.maxRetries + 1} tentatives: ${this.maskSecrets(
        lastError?.message || "Erreur r\xE9seau inconnue"
      )}`
    );
  }
};

// server/services/market-data-normalizer.ts
var MarketDataNormalizer = class {
  static normalizeCompany(raw, defaultSource = "Source BRVM Officielle", freshness = "end_of_day") {
    const symbol = String(raw.symbol || raw.symbole || "").trim().toUpperCase();
    const currentPrice = Number(raw.currentPrice ?? raw.price ?? raw.cours ?? raw.dernier) || 0;
    const previousClose = Number(raw.previousClose ?? raw.previous_close ?? raw.veille) || currentPrice;
    let dayChangePercent = Number(raw.dayChangePercent ?? raw.change_percent) || 0;
    if (!raw.dayChangePercent && previousClose > 0) {
      dayChangePercent = parseFloat(((currentPrice - previousClose) / previousClose * 100).toFixed(2));
    }
    const eps = raw.eps !== void 0 && raw.eps !== null && raw.eps !== "" ? Number(raw.eps) : void 0;
    let per = void 0;
    if (eps !== void 0 && eps > 0 && currentPrice > 0) {
      per = parseFloat((currentPrice / eps).toFixed(2));
    } else if (raw.per !== void 0 && raw.per !== null && Number(raw.per) > 0) {
      per = Number(raw.per);
    }
    const lastDividend = raw.lastDividend !== void 0 && raw.lastDividend !== null ? Number(raw.lastDividend) : 0;
    let dividendYield = void 0;
    if (currentPrice > 0 && lastDividend >= 0) {
      dividendYield = parseFloat((lastDividend / currentPrice * 100).toFixed(2));
    }
    return {
      id: raw.id || `comp-${symbol}`,
      symbol,
      name: String(raw.name || raw.nom || symbol).trim(),
      sector: String(raw.sector || raw.secteur || "Autre Secteur").trim(),
      country: String(raw.country || raw.pays || "UEMOA").trim(),
      market: String(raw.market || raw.marche || "BRVM - Cote Principale").trim(),
      description: String(raw.description || `Entreprise ${symbol} cot\xE9e \xE0 la BRVM.`).trim(),
      logoUrl: raw.logoUrl || void 0,
      currentPrice,
      previousClose,
      dayChangePercent,
      freshness,
      lastUpdated: raw.lastUpdated || raw.timestamp || (/* @__PURE__ */ new Date()).toISOString(),
      source: String(raw.source || defaultSource).trim(),
      isDemo: freshness === "demo" || Boolean(raw.isDemo),
      eps,
      per,
      lastDividend,
      dividendYield,
      lifecycle: raw.lifecycle || "MATURITE",
      status: raw.status || "NORMALIZED"
    };
  }
  static normalizeQuote(raw, defaultSource = "BRVM Quote Engine", freshness = "end_of_day") {
    const symbol = String(raw.symbol || raw.symbole || "").trim().toUpperCase();
    const price = Number(raw.price ?? raw.cours ?? raw.dernier ?? raw.currentPrice) || 0;
    const previousClose = Number(raw.previousClose ?? raw.previous_close ?? raw.veille) || price;
    let changePercent = Number(raw.changePercent ?? raw.change_percent) || 0;
    if (!raw.changePercent && previousClose > 0) {
      changePercent = parseFloat(((price - previousClose) / previousClose * 100).toFixed(2));
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
      timestamp: raw.timestamp || raw.date || (/* @__PURE__ */ new Date()).toISOString(),
      source: String(raw.source || defaultSource).trim(),
      freshness
    };
  }
  static normalizePricePoint(raw, symbol, defaultSource = "BRVM Historique") {
    const close = Number(raw.close ?? raw.cours ?? raw.prix) || 0;
    const open = Number(raw.open ?? raw.ouverture) || close;
    const high = Number(raw.high ?? raw.plus_haut) || Math.max(open, close);
    const low = Number(raw.low ?? raw.plus_bas) || Math.min(open, close);
    const volume = Number(raw.volume ?? raw.titres_echanges) || 0;
    let dateStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    if (raw.date) {
      dateStr = new Date(raw.date).toISOString().split("T")[0];
    }
    return {
      symbol: symbol.toUpperCase(),
      date: dateStr,
      open,
      high,
      low,
      close,
      volume,
      source: String(raw.source || defaultSource).trim()
    };
  }
  static normalizeFinancialPeriod(raw, defaultSource = "Rapport Financier Officiel") {
    const companySymbol = String(raw.companySymbol || raw.symbol || "").trim().toUpperCase();
    return {
      id: raw.id || `fp-${companySymbol}-${raw.fiscalYear || (/* @__PURE__ */ new Date()).getFullYear()}`,
      companySymbol,
      fiscalYear: Number(raw.fiscalYear || raw.annee) || (/* @__PURE__ */ new Date()).getFullYear(),
      revenue: Number(raw.revenue || raw.chiffre_affaires) || 0,
      netIncome: Number(raw.netIncome || raw.resultat_net) || 0,
      eps: Number(raw.eps || raw.bpa) || 0,
      dividend: Number(raw.dividend || raw.dividende) || 0,
      source: String(raw.source || defaultSource).trim(),
      verified: Boolean(raw.verified ?? true)
    };
  }
  static normalizeDividend(raw, defaultSource = "Avis Officiel BRVM") {
    const companySymbol = String(raw.companySymbol || raw.symbol || "").trim().toUpperCase();
    return {
      id: raw.id || `div-${companySymbol}-${Date.now()}`,
      companySymbol,
      exDate: raw.exDate || raw.date_detachement || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      paymentDate: raw.paymentDate || raw.date_paiement || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      amount: Number(raw.amount || raw.dividende || raw.montant) || 0,
      source: String(raw.source || defaultSource).trim(),
      verified: Boolean(raw.verified ?? true)
    };
  }
};

// server/services/market-data-validator.ts
var MarketDataValidator = class {
  static validateCompany(company) {
    const errors = [];
    const anomalies = [];
    if (!company.symbol || company.symbol.trim().length === 0) {
      errors.push("Le symbole de l'entreprise est obligatoire.");
    }
    if (!company.name || company.name.trim().length === 0) {
      errors.push("Le nom de l'entreprise est obligatoire.");
    }
    if (!company.source || company.source.trim().length === 0) {
      errors.push("La source de la donn\xE9e est obligatoire.");
    }
    if (!company.lastUpdated || isNaN(Date.parse(company.lastUpdated))) {
      errors.push("La date de collecte / mise \xE0 jour est invalide ou manquante.");
    }
    if (company.currentPrice === void 0 || company.currentPrice === null || company.currentPrice <= 0) {
      errors.push("Le cours actuel de l'action doit \xEAtre un nombre strictement positif (> 0 FCFA).");
    }
    if (company.previousClose !== void 0 && company.previousClose <= 0) {
      anomalies.push("Le cours de cl\xF4ture pr\xE9c\xE9dent est nul ou n\xE9gatif.");
    }
    if (company.eps !== void 0 && company.eps < 0) {
      anomalies.push("BPA n\xE9gatif d\xE9tect\xE9 (perte comptable enregistr\xE9e par l'entreprise).");
    }
    if (company.eps !== void 0 && company.eps > 0 && company.currentPrice && company.per) {
      const expectedPer = parseFloat((company.currentPrice / company.eps).toFixed(2));
      if (Math.abs(expectedPer - company.per) > 0.5) {
        anomalies.push(`Incoh\xE9rence d\xE9tect\xE9e sur le PER: calcul\xE9=${expectedPer}, fourni=${company.per}.`);
      }
    }
    return {
      isValid: errors.length === 0,
      errors,
      anomalies
    };
  }
  static validateQuote(quote) {
    const errors = [];
    const anomalies = [];
    if (!quote.symbol || quote.symbol.trim().length === 0) {
      errors.push("Le symbole de cotation est obligatoire.");
    }
    if (!quote.source || quote.source.trim().length === 0) {
      errors.push("La source officielle de la cotation est obligatoire.");
    }
    if (!quote.timestamp || isNaN(Date.parse(quote.timestamp))) {
      errors.push("La date/heure de collecte de la cotation est invalide.");
    }
    if (quote.price === void 0 || quote.price <= 0) {
      errors.push("Le cours ex\xE9cut\xE9 doit \xEAtre un prix strictement positif (> 0 FCFA).");
    }
    if (quote.volume !== void 0 && quote.volume < 0) {
      errors.push("Le volume d'\xE9change ne peut pas \xEAtre n\xE9gatif.");
    }
    if (quote.high !== void 0 && quote.low !== void 0) {
      if (quote.high < quote.low) {
        errors.push(`Incoh\xE9rence des cours de la journ\xE9e: Plus Haut (${quote.high}) inf\xE9rieur au Plus Bas (${quote.low}).`);
      }
    }
    if (quote.price !== void 0 && quote.high !== void 0 && quote.low !== void 0) {
      if (quote.price > quote.high || quote.price < quote.low) {
        anomalies.push(`Le cours ex\xE9cut\xE9 (${quote.price}) est en dehors de la plage Plus Haut/Plus Bas [${quote.low} - ${quote.high}].`);
      }
    }
    return {
      isValid: errors.length === 0,
      errors,
      anomalies
    };
  }
  static validateHistoricalPrice(price, existingPrices = []) {
    const errors = [];
    const anomalies = [];
    if (!price.symbol || price.symbol.trim().length === 0) {
      errors.push("Le symbole est obligatoire pour l'historique de prix.");
    }
    if (!price.date || isNaN(Date.parse(price.date))) {
      errors.push("La date de cotation est invalide.");
    }
    if (!price.source || price.source.trim().length === 0) {
      errors.push("La source de la donn\xE9e historique est obligatoire.");
    }
    if (price.close === void 0 || price.close <= 0) {
      errors.push("Le cours de cl\xF4ture doit \xEAtre positif (> 0).");
    }
    if (price.volume !== void 0 && price.volume < 0) {
      errors.push("Le volume de transaction ne peut pas \xEAtre n\xE9gatif.");
    }
    if (price.high !== void 0 && price.low !== void 0 && price.high < price.low) {
      errors.push(`Incoh\xE9rence des extr\xEAmes: High (${price.high}) < Low (${price.low}).`);
    }
    if (price.symbol && price.date) {
      const targetDateStr = new Date(price.date).toISOString().split("T")[0];
      const isDuplicate = existingPrices.some(
        (p) => p.symbol === price.symbol && new Date(p.date).toISOString().split("T")[0] === targetDateStr
      );
      if (isDuplicate) {
        errors.push(`Doublon interdit: Une entr\xE9e de cours existe d\xE9j\xE0 pour ${price.symbol} \xE0 la date du ${targetDateStr}.`);
      }
    }
    return {
      isValid: errors.length === 0,
      errors,
      anomalies
    };
  }
};

// server/services/market-data-cache.ts
var MarketDataCache = class {
  constructor() {
    this.cache = /* @__PURE__ */ new Map();
  }
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }
  set(key, data, ttlSeconds = 300) {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1e3
    });
  }
  invalidate(keyOrPrefix) {
    if (!keyOrPrefix) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.startsWith(keyOrPrefix)) {
        this.cache.delete(key);
      }
    }
  }
};
var globalMarketCache = new MarketDataCache();

// server/services/market-data-publisher.ts
var MarketDataPublisher = class {
  static {
    this.reviewQueue = [];
  }
  static {
    this.auditLogs = [];
  }
  static {
    // Published stores
    this.publishedCompanies = /* @__PURE__ */ new Map();
  }
  static {
    this.publishedQuotes = /* @__PURE__ */ new Map();
  }
  static {
    this.publishedPrices = /* @__PURE__ */ new Map();
  }
  static {
    this.publishedFinancials = /* @__PURE__ */ new Map();
  }
  static {
    this.publishedDividends = /* @__PURE__ */ new Map();
  }
  static requireAdminReview() {
    return process.env.BRVM_REQUIRE_ADMIN_REVIEW !== "false";
  }
  // PIPELINE PROCESSOR
  static processIncomingRecord(type, rawPayload, sourceName = "Import BRVM") {
    const reviewId = `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    let symbol = (rawPayload.symbol || rawPayload.symbole || rawPayload.companySymbol || "").toUpperCase();
    let normalized;
    let errors = [];
    let anomalies = [];
    if (type === "COMPANY") {
      normalized = MarketDataNormalizer.normalizeCompany(rawPayload, sourceName);
      symbol = normalized.symbol;
      const val = MarketDataValidator.validateCompany(normalized);
      errors = val.errors;
      anomalies = val.anomalies;
    } else if (type === "QUOTE") {
      normalized = MarketDataNormalizer.normalizeQuote(rawPayload, sourceName);
      symbol = normalized.symbol;
      const val = MarketDataValidator.validateQuote(normalized);
      errors = val.errors;
      anomalies = val.anomalies;
    } else if (type === "PRICE") {
      symbol = (rawPayload.symbol || symbol).toUpperCase();
      const existing = this.publishedPrices.get(symbol) || [];
      normalized = MarketDataNormalizer.normalizePricePoint(rawPayload, symbol, sourceName);
      const val = MarketDataValidator.validateHistoricalPrice(normalized, existing);
      errors = val.errors;
      anomalies = val.anomalies;
    } else if (type === "FINANCIAL") {
      normalized = MarketDataNormalizer.normalizeFinancialPeriod(rawPayload, sourceName);
      symbol = normalized.companySymbol;
    } else if (type === "DIVIDEND") {
      normalized = MarketDataNormalizer.normalizeDividend(rawPayload, sourceName);
      symbol = normalized.companySymbol;
    }
    const requireReview = this.requireAdminReview() || errors.length > 0 || anomalies.length > 0;
    const initialStatus = requireReview ? "PENDING_REVIEW" : "PUBLISHED";
    const reviewItem = {
      id: reviewId,
      type,
      symbol: symbol || "UNKNOWN",
      rawPayload,
      normalizedData: normalized,
      errors,
      anomalies,
      status: initialStatus,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      source: sourceName
    };
    this.reviewQueue.push(reviewItem);
    this.addAuditLog(reviewId, "CREATED", "system", `Enregistrement re\xE7u depuis ${sourceName}. Statut: ${initialStatus}`);
    if (!requireReview && errors.length === 0) {
      this.publishItem(reviewItem);
    }
    return reviewItem;
  }
  static publishItem(item) {
    item.status = "PUBLISHED";
    if (item.type === "COMPANY") {
      const comp = { ...item.normalizedData, status: "PUBLISHED" };
      this.publishedCompanies.set(comp.symbol, comp);
    } else if (item.type === "QUOTE") {
      const quote = item.normalizedData;
      this.publishedQuotes.set(quote.symbol, quote);
      const comp = this.publishedCompanies.get(quote.symbol);
      if (comp) {
        comp.currentPrice = quote.price;
        comp.previousClose = quote.previousClose;
        comp.dayChangePercent = quote.changePercent;
        comp.lastUpdated = quote.timestamp;
        comp.source = quote.source;
        this.publishedCompanies.set(comp.symbol, comp);
      }
    } else if (item.type === "PRICE") {
      const hp = item.normalizedData;
      const list = this.publishedPrices.get(hp.symbol) || [];
      const filtered = list.filter((p) => p.date !== hp.date);
      filtered.push(hp);
      filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      this.publishedPrices.set(hp.symbol, filtered);
    } else if (item.type === "FINANCIAL") {
      const fp = item.normalizedData;
      const list = this.publishedFinancials.get(fp.companySymbol) || [];
      const filtered = list.filter((f) => f.fiscalYear !== fp.fiscalYear);
      filtered.push(fp);
      this.publishedFinancials.set(fp.companySymbol, filtered);
    } else if (item.type === "DIVIDEND") {
      const div = item.normalizedData;
      const list = this.publishedDividends.get(div.companySymbol) || [];
      const filtered = list.filter((d) => d.id !== div.id);
      filtered.push(div);
      this.publishedDividends.set(div.companySymbol, filtered);
    }
    globalMarketCache.invalidate();
  }
  static approveReviewItem(id, reviewer = "Admin", notes) {
    const item = this.reviewQueue.find((r) => r.id === id);
    if (!item) return false;
    item.status = "VERIFIED";
    item.reviewedAt = (/* @__PURE__ */ new Date()).toISOString();
    item.reviewedBy = reviewer;
    item.reviewerNotes = notes || "Approuv\xE9 par administrateur";
    this.publishItem(item);
    this.addAuditLog(id, "APPROVED", reviewer, `Approuv\xE9 et publi\xE9. Notes: ${notes || "N/A"}`);
    return true;
  }
  static rejectReviewItem(id, reviewer = "Admin", notes) {
    const item = this.reviewQueue.find((r) => r.id === id);
    if (!item) return false;
    item.status = "REJECTED";
    item.reviewedAt = (/* @__PURE__ */ new Date()).toISOString();
    item.reviewedBy = reviewer;
    item.reviewerNotes = notes || "Rejet\xE9 par administrateur";
    this.addAuditLog(id, "REJECTED", reviewer, `Rejet\xE9 par administrateur. Notes: ${notes || "N/A"}`);
    return true;
  }
  static getPendingReviews() {
    return this.reviewQueue.filter((r) => r.status === "PENDING_REVIEW");
  }
  static getAllReviews() {
    return [...this.reviewQueue];
  }
  static getAuditLogs() {
    return [...this.auditLogs];
  }
  static addAuditLog(reviewItemId, action, actor, details) {
    this.auditLogs.push({
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      reviewItemId,
      action,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      actor,
      details
    });
  }
  // Published Getters
  static getCompanies() {
    return Array.from(this.publishedCompanies.values());
  }
  static getQuote(symbol) {
    return this.publishedQuotes.get(symbol.toUpperCase()) || null;
  }
  static getHistoricalPrices(symbol) {
    return this.publishedPrices.get(symbol.toUpperCase()) || [];
  }
  static getFinancials(symbol) {
    return this.publishedFinancials.get(symbol.toUpperCase()) || [];
  }
  static getDividends(symbol) {
    return this.publishedDividends.get(symbol.toUpperCase()) || [];
  }
  static clearAll() {
    this.reviewQueue = [];
    this.auditLogs = [];
    this.publishedCompanies.clear();
    this.publishedQuotes.clear();
    this.publishedPrices.clear();
    this.publishedFinancials.clear();
    this.publishedDividends.clear();
  }
};

// server/providers/BrvmApiMarketDataProvider.ts
var BrvmApiMarketDataProvider = class {
  constructor(client) {
    this.client = client || new BrvmClient();
  }
  ensureConfigured() {
    if (!this.client.isConfigured()) {
      throw new Error(
        "Erreur de configuration BRVM API: BRVM_API_BASE_URL n'est pas renseign\xE9 dans l'environnement."
      );
    }
  }
  async getCompanies() {
    this.ensureConfigured();
    const rawList = await this.client.fetchWithRetry("companies");
    for (const raw of rawList) {
      MarketDataPublisher.processIncomingRecord("COMPANY", raw, "API BRVM Officielle");
    }
    return MarketDataPublisher.getCompanies();
  }
  async getQuote(symbol) {
    this.ensureConfigured();
    const sym = symbol.toUpperCase();
    try {
      const raw = await this.client.fetchWithRetry(`companies/${sym}/quote`);
      if (!raw) return null;
      MarketDataPublisher.processIncomingRecord("QUOTE", raw, "API BRVM Officielle");
      return MarketDataPublisher.getQuote(sym);
    } catch {
      return MarketDataPublisher.getQuote(sym);
    }
  }
  async getHistoricalPrices(symbol, startDate, endDate) {
    this.ensureConfigured();
    const sym = symbol.toUpperCase();
    try {
      const query = `startDate=${encodeURIComponent(startDate || "")}&endDate=${encodeURIComponent(endDate || "")}`;
      const rawList = await this.client.fetchWithRetry(`companies/${sym}/prices?${query}`);
      for (const raw of rawList) {
        MarketDataPublisher.processIncomingRecord("PRICE", { ...raw, symbol: sym }, "API BRVM Officielle");
      }
      return MarketDataPublisher.getHistoricalPrices(sym);
    } catch {
      return MarketDataPublisher.getHistoricalPrices(sym);
    }
  }
  async getFinancials(symbol) {
    this.ensureConfigured();
    const sym = symbol.toUpperCase();
    try {
      const rawList = await this.client.fetchWithRetry(`companies/${sym}/financials`);
      for (const raw of rawList) {
        MarketDataPublisher.processIncomingRecord("FINANCIAL", { ...raw, companySymbol: sym }, "API BRVM Officielle");
      }
      return MarketDataPublisher.getFinancials(sym);
    } catch {
      return MarketDataPublisher.getFinancials(sym);
    }
  }
  async getDividends(symbol) {
    this.ensureConfigured();
    const sym = symbol.toUpperCase();
    try {
      const rawList = await this.client.fetchWithRetry(`companies/${sym}/dividends`);
      for (const raw of rawList) {
        MarketDataPublisher.processIncomingRecord("DIVIDEND", { ...raw, companySymbol: sym }, "API BRVM Officielle");
      }
      return MarketDataPublisher.getDividends(sym);
    } catch {
      return MarketDataPublisher.getDividends(sym);
    }
  }
};

// server/services/brvm-import-service.ts
var BrvmImportService = class _BrvmImportService {
  static {
    this.importedStorage = [];
  }
  static parseCsv(content, filename) {
    const lines = content.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0);
    if (lines.length === 0) {
      throw new Error("Le fichier CSV est vide.");
    }
    const header = lines[0].toLowerCase().split(/[,;]/).map((h) => h.trim());
    const rows = lines.slice(1);
    const result = {
      companies: [],
      quotes: [],
      prices: [],
      financials: [],
      dividends: [],
      rawFilename: filename || "import_brvm.csv",
      importedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const isQuoteFile = header.includes("cours") || header.includes("close") || header.includes("dernier");
    const isCompanyFile = header.includes("secteur") || header.includes("pays");
    const isFinancialFile = header.includes("bpa") || header.includes("eps") || header.includes("chiffre_affaires");
    const isDividendFile = header.includes("dividende") || header.includes("dividend");
    for (const rowLine of rows) {
      const cols = rowLine.split(/[,;]/).map((c) => c.trim().replace(/^"|"$/g, ""));
      if (cols.length < 2) continue;
      const recordObj = {};
      header.forEach((h, idx) => {
        recordObj[h] = cols[idx] || "";
      });
      const symbol = (recordObj["symbol"] || recordObj["symbole"] || recordObj["action"] || recordObj["code"] || "").toUpperCase();
      if (!symbol) continue;
      if (isCompanyFile) {
        result.companies.push({
          symbol,
          name: recordObj["name"] || recordObj["nom"] || symbol,
          sector: recordObj["sector"] || recordObj["secteur"] || "Inconnu",
          country: recordObj["country"] || recordObj["pays"] || "UEMOA",
          market: recordObj["market"] || recordObj["marche"] || "BRVM - Cote Officielle",
          description: recordObj["description"] || "Donn\xE9es fournies par import officiel BRVM",
          currentPrice: parseFloat(recordObj["currentprice"] || recordObj["cours"] || "0") || 0,
          previousClose: parseFloat(recordObj["previousclose"] || recordObj["veille"] || "0") || 0,
          eps: recordObj["eps"] || recordObj["bpa"] ? parseFloat(recordObj["eps"] || recordObj["bpa"]) : void 0,
          lastDividend: recordObj["dividend"] || recordObj["dividende"] ? parseFloat(recordObj["dividend"] || recordObj["dividende"]) : void 0
        });
      }
      if (isQuoteFile) {
        const price = parseFloat(recordObj["cours"] || recordObj["close"] || recordObj["dernier"] || recordObj["prix"] || "0");
        const prev = parseFloat(recordObj["veille"] || recordObj["previousclose"] || recordObj["ouverture"] || String(price));
        result.quotes.push({
          symbol,
          price,
          previousClose: prev,
          changePercent: prev > 0 ? parseFloat(((price - prev) / prev * 100).toFixed(2)) : 0,
          high: parseFloat(recordObj["plus_haut"] || recordObj["high"] || String(price)) || price,
          low: parseFloat(recordObj["plus_bas"] || recordObj["low"] || String(price)) || price,
          open: parseFloat(recordObj["ouverture"] || recordObj["open"] || String(price)) || price,
          volume: parseInt(recordObj["volume"] || recordObj["titres_echanges"] || "0", 10) || 0,
          timestamp: recordObj["date"] ? new Date(recordObj["date"]).toISOString() : (/* @__PURE__ */ new Date()).toISOString(),
          source: filename ? `Import Fichier (${filename})` : "Import Officiel BRVM",
          freshness: "end_of_day"
        });
      }
      if (isFinancialFile) {
        result.financials.push({
          companySymbol: symbol,
          fiscalYear: parseInt(recordObj["annee"] || recordObj["fiscalyear"] || String((/* @__PURE__ */ new Date()).getFullYear()), 10),
          revenue: parseFloat(recordObj["chiffre_affaires"] || recordObj["revenue"] || "0") || 0,
          netIncome: parseFloat(recordObj["resultat_net"] || recordObj["netincome"] || "0") || 0,
          eps: parseFloat(recordObj["bpa"] || recordObj["eps"] || "0") || 0,
          dividend: parseFloat(recordObj["dividende"] || recordObj["dividend"] || "0") || 0,
          source: filename ? `Import Fichier (${filename})` : "Import Officiel BRVM",
          verified: true
        });
      }
      if (isDividendFile) {
        result.dividends.push({
          id: `div-imp-${symbol}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          companySymbol: symbol,
          exDate: recordObj["date_detachement"] || recordObj["exdate"] || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          paymentDate: recordObj["date_paiement"] || recordObj["paymentdate"] || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          amount: parseFloat(recordObj["montant"] || recordObj["amount"] || recordObj["dividende"] || "0") || 0,
          source: filename ? `Import Fichier (${filename})` : "Import Officiel BRVM",
          verified: true
        });
      }
    }
    _BrvmImportService.importedStorage.push(result);
    return result;
  }
  static parseJson(content, filename) {
    let parsed;
    try {
      parsed = typeof content === "string" ? JSON.parse(content) : content;
    } catch {
      throw new Error("Format JSON invalide.");
    }
    const result = {
      companies: Array.isArray(parsed.companies) ? parsed.companies : [],
      quotes: Array.isArray(parsed.quotes) ? parsed.quotes : [],
      prices: Array.isArray(parsed.prices) ? parsed.prices : [],
      financials: Array.isArray(parsed.financials) ? parsed.financials : [],
      dividends: Array.isArray(parsed.dividends) ? parsed.dividends : [],
      rawFilename: filename || "import_brvm.json",
      importedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    _BrvmImportService.importedStorage.push(result);
    return result;
  }
  static getStoredImportedData() {
    return [..._BrvmImportService.importedStorage];
  }
  static clearStoredImportedData() {
    _BrvmImportService.importedStorage = [];
  }
};

// server/providers/BrvmFileImportProvider.ts
var BrvmFileImportProvider = class {
  syncImportedData() {
    const imports = BrvmImportService.getStoredImportedData();
    for (const batch of imports) {
      const sourceName = `Import Fichier (${batch.rawFilename || "bulletin.csv"})`;
      for (const comp of batch.companies) {
        MarketDataPublisher.processIncomingRecord("COMPANY", comp, sourceName);
      }
      for (const quote of batch.quotes) {
        MarketDataPublisher.processIncomingRecord("QUOTE", quote, sourceName);
      }
      for (const price of batch.prices) {
        MarketDataPublisher.processIncomingRecord("PRICE", price, sourceName);
      }
      for (const fin of batch.financials) {
        MarketDataPublisher.processIncomingRecord("FINANCIAL", fin, sourceName);
      }
      for (const div of batch.dividends) {
        MarketDataPublisher.processIncomingRecord("DIVIDEND", div, sourceName);
      }
    }
  }
  async getCompanies() {
    this.syncImportedData();
    const companies = MarketDataPublisher.getCompanies();
    if (companies.length === 0) {
      throw new Error(
        "Aucun fichier de donn\xE9es BRVM n'a encore \xE9t\xE9 import\xE9. Veuillez importer un fichier CSV/JSON officiel BRVM depuis la console d'administration."
      );
    }
    return companies;
  }
  async getQuote(symbol) {
    this.syncImportedData();
    return MarketDataPublisher.getQuote(symbol);
  }
  async getHistoricalPrices(symbol, _startDate, _endDate) {
    this.syncImportedData();
    return MarketDataPublisher.getHistoricalPrices(symbol);
  }
  async getFinancials(symbol) {
    this.syncImportedData();
    return MarketDataPublisher.getFinancials(symbol);
  }
  async getDividends(symbol) {
    this.syncImportedData();
    return MarketDataPublisher.getDividends(symbol);
  }
};

// src/data/demo-data.ts
var DEMO_COMPANIES = [
  {
    id: "c-snts",
    symbol: "SNTS",
    name: "Sonatel S\xE9n\xE9gal",
    sector: "T\xE9l\xE9communications",
    country: "S\xE9n\xE9gal",
    market: "BRVM - Cote Principale",
    description: "Premier op\xE9rateur de t\xE9l\xE9communications en Afrique de l\u2019Ouest, pr\xE9sent au S\xE9n\xE9gal, au Mali, en Guin\xE9e et en Sierra Leone. R\xE9put\xE9 pour sa distribution r\xE9guli\xE8re de dividendes.",
    currentPrice: 32e3,
    previousClose: 31e3,
    dayChangePercent: 3.23,
    freshness: "delayed",
    lastUpdated: "2026-08-10T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 1850,
    per: 17.3,
    roe: 24.5,
    pbr: 4.17,
    bookValuePerShare: 7674,
    lastDividend: 1575,
    dividendYield: 4.92,
    ipoPrice: 2750,
    ipoDate: "1998",
    lifecycle: "MATURITE",
    status: "VERIFIED"
  },
  {
    id: "c-slbc",
    symbol: "SLBC",
    name: "Solibra C\xF4te d'Ivoire",
    sector: "Agroalimentaire & Boissons",
    country: "C\xF4te d'Ivoire",
    market: "BRVM - Cote Principale",
    description: "Soci\xE9t\xE9 de Limonaderies et Brasseries d\u2019Afrique, leader incontournable du march\xE9 des boissons rafra\xEEchissantes et des bi\xE8res en C\xF4te d\u2019Ivoire.",
    currentPrice: 37005,
    previousClose: 37e3,
    dayChangePercent: 0.01,
    freshness: "delayed",
    lastUpdated: "2026-08-08T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 6800,
    per: 5.44,
    roe: 14.2,
    pbr: 1.42,
    bookValuePerShare: 59154,
    lastDividend: 4050,
    dividendYield: 10.94,
    ipoPrice: 25e3,
    ipoDate: "1998",
    lifecycle: "MATURITE",
    status: "VERIFIED"
  },
  {
    id: "c-etit",
    symbol: "ETIT",
    name: "Ecobank Transnational Inc.",
    sector: "Services Financiers / Banque",
    country: "Togo",
    market: "BRVM - Cote Principale",
    description: "Groupe bancaire panafricain pr\xE9sent dans 33 pays d\u2019Afrique subsaharienne. Action \xE0 faible valeur unitaire tr\xE8s pris\xE9e pour la diversification des portefeuilles.",
    currentPrice: 66,
    previousClose: 65,
    dayChangePercent: 1.54,
    freshness: "delayed",
    lastUpdated: "2026-08-08T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 7.8,
    per: 8.46,
    roe: 13.8,
    pbr: 0.85,
    bookValuePerShare: 77.6,
    lastDividend: 3.5,
    dividendYield: 5.3,
    ipoPrice: 10,
    ipoDate: "2006",
    lifecycle: "CROISSANCE",
    status: "VERIFIED"
  },
  {
    id: "c-sgbc",
    symbol: "SGBC",
    name: "Soci\xE9t\xE9 G\xE9n\xE9rale C\xF4te d'Ivoire",
    sector: "Services Financiers / Banque",
    country: "C\xF4te d'Ivoire",
    market: "BRVM - Cote Principale",
    description: "Premi\xE8re banque de C\xF4te d\u2019Ivoire en termes de cr\xE9dits accord\xE9s et de d\xE9p\xF4ts collect\xE9s. Filiale du groupe bancaire international Soci\xE9t\xE9 G\xE9n\xE9rale.",
    currentPrice: 39e3,
    previousClose: 38e3,
    dayChangePercent: 2.63,
    freshness: "delayed",
    lastUpdated: "2026-08-10T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 2100,
    per: 18.57,
    roe: 19.8,
    pbr: 1.68,
    bookValuePerShare: 10833,
    lastDividend: 1350,
    dividendYield: 3.46,
    ipoPrice: 5e3,
    ipoDate: "1998",
    lifecycle: "MATURITE",
    status: "VERIFIED"
  },
  {
    id: "c-ciec",
    symbol: "CIEC",
    name: "Compagnie Ivoirienne d'Electricit\xE9 (CIE)",
    sector: "Services Publics / Energie",
    country: "C\xF4te d'Ivoire",
    market: "BRVM - Cote Principale",
    description: "Op\xE9rateur historique concessionnaire du service public de fourniture, transport et distribution d\u2019\xE9lectricit\xE9 en C\xF4te d\u2019Ivoire.",
    currentPrice: 5150,
    previousClose: 5020,
    dayChangePercent: 2.59,
    freshness: "delayed",
    lastUpdated: "2026-08-10T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 210,
    per: 24.52,
    roe: 15.2,
    pbr: 1.32,
    bookValuePerShare: 1704,
    lastDividend: 150,
    dividendYield: 2.91,
    ipoPrice: 1e3,
    ipoDate: "1992",
    lifecycle: "MATURITE",
    status: "VERIFIED"
  },
  {
    id: "c-ontbf",
    symbol: "ONTBF",
    name: "Onatel Burkina Faso",
    sector: "T\xE9l\xE9communications",
    country: "Burkina Faso",
    market: "BRVM - Cote Principale",
    description: "Op\xE9rateur historique de t\xE9l\xE9communications au Burkina Faso, contr\xF4l\xE9 par le groupe Maroc Telecom.",
    currentPrice: 2910,
    previousClose: 2940,
    dayChangePercent: -1.02,
    freshness: "delayed",
    lastUpdated: "2026-08-10T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 310,
    per: 9.39,
    roe: 22.1,
    pbr: 1.75,
    bookValuePerShare: 1400,
    lastDividend: 260,
    dividendYield: 8.93,
    ipoPrice: 1200,
    ipoDate: "2009",
    lifecycle: "MATURITE",
    status: "VERIFIED"
  },
  {
    id: "c-ttlci",
    symbol: "TTLCI",
    name: "TotalEnergies C\xF4te d'Ivoire",
    sector: "Distribution P\xE9troli\xE8re",
    country: "C\xF4te d'Ivoire",
    market: "BRVM - Cote Principale",
    description: "R\xE9seau majeur de stations-services et distribution de produits p\xE9troliers et lubrifiants en C\xF4te d\u2019Ivoire.",
    currentPrice: 2995,
    previousClose: 2805,
    dayChangePercent: 6.77,
    freshness: "delayed",
    lastUpdated: "2026-08-08T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 240,
    per: 12.48,
    roe: 16.5,
    pbr: 1.48,
    bookValuePerShare: 1452,
    lastDividend: 185,
    dividendYield: 6.18,
    ipoPrice: 1e3,
    ipoDate: "1998",
    lifecycle: "MATURITE",
    status: "VERIFIED"
  },
  {
    id: "c-cbbf",
    symbol: "CBBF",
    name: "Coris Bank International",
    sector: "Services Financiers / Banque",
    country: "Burkina Faso",
    market: "BRVM - Cote Principale",
    description: "Groupe bancaire ouest-africain dynamique \xE0 fort d\xE9veloppement dans l\u2019UEMOA.",
    currentPrice: 28450,
    previousClose: 28305,
    dayChangePercent: 0.51,
    freshness: "delayed",
    lastUpdated: "2026-08-10T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 1250,
    per: 22.76,
    roe: 21.4,
    pbr: 1.72,
    bookValuePerShare: 5930,
    lastDividend: 860,
    dividendYield: 3.02,
    ipoPrice: 6e3,
    ipoDate: "2016",
    lifecycle: "CROISSANCE",
    status: "VERIFIED"
  },
  {
    id: "c-palc",
    symbol: "PALC",
    name: "Palm C\xF4te d'Ivoire",
    sector: "Agriculture & Agro-industrie",
    country: "C\xF4te d'Ivoire",
    market: "BRVM - Cote Principale",
    description: "Leader de la production et de la transformation d\u2019huile de palme brute en C\xF4te d\u2019Ivoire.",
    currentPrice: 9100,
    previousClose: 8980,
    dayChangePercent: 1.34,
    freshness: "delayed",
    lastUpdated: "2026-08-08T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 720,
    per: 12.64,
    roe: 18.5,
    pbr: 1.25,
    bookValuePerShare: 5200,
    lastDividend: 500,
    dividendYield: 5.49,
    ipoPrice: 2500,
    ipoDate: "1999",
    lifecycle: "MATURITE",
    status: "VERIFIED"
  },
  {
    id: "c-boac",
    symbol: "BOAC",
    name: "Bank of Africa C\xF4te d'Ivoire",
    sector: "Services Financiers / Banque",
    country: "C\xF4te d'Ivoire",
    market: "BRVM - Cote Principale",
    description: "Acteur bancaire de premier plan membre du groupe BMCE Bank / Bank Of Africa.",
    currentPrice: 11600,
    previousClose: 11600,
    dayChangePercent: 0,
    freshness: "delayed",
    lastUpdated: "2026-08-08T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 850,
    per: 13.65,
    roe: 21.2,
    pbr: 1.55,
    bookValuePerShare: 4645,
    lastDividend: 620,
    dividendYield: 5.34,
    ipoPrice: 3500,
    ipoDate: "2010",
    lifecycle: "MATURITE",
    status: "VERIFIED"
  },
  {
    id: "c-abjc",
    symbol: "ABJC",
    name: "Servair Abidjan",
    sector: "Services & Restauration",
    country: "C\xF4te d'Ivoire",
    market: "BRVM - Cote Principale",
    description: "Sp\xE9cialiste du catering a\xE9rien et des services de restauration \xE0 l\u2019a\xE9roport international d\u2019Abidjan.",
    currentPrice: 3010,
    previousClose: 3010,
    dayChangePercent: 0,
    freshness: "delayed",
    lastUpdated: "2026-08-08T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 140,
    per: 21.5,
    lastDividend: 95,
    dividendYield: 3.16,
    ipoPrice: 750,
    ipoDate: "2012",
    lifecycle: "MATURITE",
    status: "VERIFIED"
  },
  {
    id: "c-sdsc",
    symbol: "SDSC",
    name: "Bollor\xE9 Transport & Logistics CI (AGL)",
    sector: "Transport & Logistique",
    country: "C\xF4te d'Ivoire",
    market: "BRVM - Cote Principale",
    description: "Acteur de r\xE9f\xE9rence dans les concessions portuaires, la manutention et la logistique internationale en Afrique de l\u2019Ouest.",
    currentPrice: 2585,
    previousClose: 2530,
    dayChangePercent: 2.17,
    freshness: "delayed",
    lastUpdated: "2026-08-08T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 155,
    per: 16.68,
    lastDividend: 100,
    dividendYield: 3.87,
    ipoPrice: 1e3,
    ipoDate: "1998",
    lifecycle: "MATURITE",
    status: "VERIFIED"
  },
  {
    id: "c-sdcc",
    symbol: "SDCC",
    name: "Soci\xE9t\xE9 des Eaux de C\xF4te d'Ivoire (SODECI)",
    sector: "Services Publics / Eau",
    country: "C\xF4te d'Ivoire",
    market: "BRVM - Cote Principale",
    description: "Entreprise charg\xE9e de la distribution d\u2019eau potable et du traitement des eaux us\xE9es sur l\u2019ensemble du territoire ivoirien.",
    currentPrice: 11890,
    previousClose: 11900,
    dayChangePercent: -0.08,
    freshness: "delayed",
    lastUpdated: "2026-08-10T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 480,
    per: 24.77,
    lastDividend: 320,
    dividendYield: 2.69,
    ipoPrice: 2500,
    ipoDate: "1998",
    lifecycle: "MATURITE",
    status: "VERIFIED"
  },
  {
    id: "c-boan",
    symbol: "BOAN",
    name: "Bank of Africa Niger",
    sector: "Services Financiers / Banque",
    country: "Niger",
    market: "BRVM - Cote Principale",
    description: "Acteur bancaire de premier ordre au Niger, offrant des services complets aux entreprises et particuliers.",
    currentPrice: 5200,
    previousClose: 5200,
    dayChangePercent: 0,
    freshness: "delayed",
    lastUpdated: "2026-08-10T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 380,
    per: 13.68,
    lastDividend: 270,
    dividendYield: 5.19,
    ipoPrice: 1500,
    ipoDate: "2015",
    lifecycle: "MATURITE",
    status: "VERIFIED"
  },
  {
    id: "c-sivc",
    symbol: "SIVC",
    name: "Air Liquide C\xF4te d'Ivoire",
    sector: "Industrie & Gaz M\xE9dicaux",
    country: "C\xF4te d'Ivoire",
    market: "BRVM - Cote Principale",
    description: "Producteur et distributeur de gaz industriels, m\xE9dicaux et services associ\xE9s en C\xF4te d\u2019Ivoire.",
    currentPrice: 2280,
    previousClose: 2125,
    dayChangePercent: 7.29,
    freshness: "delayed",
    lastUpdated: "2026-08-08T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 65,
    per: 35.08,
    lastDividend: 40,
    dividendYield: 1.75,
    ipoPrice: 600,
    ipoDate: "1998",
    lifecycle: "MATURITE",
    status: "VERIFIED"
  },
  {
    id: "c-boas",
    symbol: "BOAS",
    name: "Bank of Africa S\xE9n\xE9gal",
    sector: "Services Financiers / Banque",
    country: "S\xE9n\xE9gal",
    market: "BRVM - Cote Principale",
    description: "Filiale du groupe Bank of Africa, figurant parmi les \xE9tablissements bancaires dynamiques du march\xE9 s\xE9n\xE9galais.",
    currentPrice: 7750,
    previousClose: 7710,
    dayChangePercent: 0.52,
    freshness: "delayed",
    lastUpdated: "2026-08-10T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 390,
    per: 19.87,
    lastDividend: 280,
    dividendYield: 3.61,
    ipoPrice: 1600,
    ipoDate: "2014",
    lifecycle: "MATURITE",
    status: "VERIFIED"
  },
  {
    id: "c-cabc",
    symbol: "CABC",
    name: "Sicable C\xF4te d'Ivoire",
    sector: "Industrie C\xE2blerie",
    country: "C\xF4te d'Ivoire",
    market: "BRVM - Cote Principale",
    description: "Leader de la fabrication et commercialisation de c\xE2bles \xE9lectriques et de t\xE9l\xE9communications en Afrique de l\u2019Ouest.",
    currentPrice: 3500,
    previousClose: 3550,
    dayChangePercent: -1.41,
    freshness: "delayed",
    lastUpdated: "2026-08-08T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 120,
    per: 29.17,
    lastDividend: 80,
    dividendYield: 2.29,
    ipoPrice: 600,
    ipoDate: "1998",
    lifecycle: "MATURITE",
    status: "VERIFIED"
  },
  {
    id: "c-biic",
    symbol: "BIIC",
    name: "BIIC B\xE9nin",
    sector: "Services Financiers / Banque",
    country: "B\xE9nin",
    market: "BRVM - Cote Principale",
    description: "Banque Internationale pour l\u2019Industrie et le Commerce du B\xE9nin.",
    currentPrice: 7670,
    previousClose: 7595,
    dayChangePercent: 0.99,
    freshness: "delayed",
    lastUpdated: "2026-08-10T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 820,
    per: 9.35,
    lastDividend: 550,
    dividendYield: 7.17,
    ipoPrice: 5e3,
    ipoDate: "2021",
    lifecycle: "CROISSANCE",
    status: "VERIFIED"
  },
  {
    id: "c-ecoc",
    symbol: "ECOC",
    name: "Ecobank C\xF4te d'Ivoire",
    sector: "Services Financiers / Banque",
    country: "C\xF4te d'Ivoire",
    market: "BRVM - Cote Principale",
    description: "Filiale majeure du groupe Ecobank, acteur bancaire de r\xE9f\xE9rence en C\xF4te d\u2019Ivoire.",
    currentPrice: 16200,
    previousClose: 16200,
    dayChangePercent: 0,
    freshness: "delayed",
    lastUpdated: "2026-08-10T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 1180,
    per: 13.73,
    lastDividend: 810,
    dividendYield: 5,
    ipoPrice: 5e3,
    ipoDate: "2017",
    lifecycle: "MATURITE",
    status: "VERIFIED"
  },
  {
    id: "c-cfac",
    symbol: "CFAC",
    name: "CFAO Motors C\xF4te d'Ivoire",
    sector: "Distribution Automobile",
    country: "C\xF4te d'Ivoire",
    market: "BRVM - Cote Principale",
    description: "Distributeur automobile et d\u2019\xE9quipements industriels de marques mondiales de premier plan.",
    currentPrice: 1695,
    previousClose: 1700,
    dayChangePercent: -0.29,
    freshness: "delayed",
    lastUpdated: "2026-08-08T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 78,
    per: 21.73,
    lastDividend: 52,
    dividendYield: 3.07,
    ipoPrice: 500,
    ipoDate: "1998",
    lifecycle: "MATURITE",
    status: "VERIFIED"
  },
  {
    id: "c-sibc",
    symbol: "SIBC",
    name: "Soci\xE9t\xE9 Ivoirienne de Banque (SIB)",
    sector: "Services Financiers / Banque",
    country: "C\xF4te d'Ivoire",
    market: "BRVM - Cote Principale",
    description: "Filiale du groupe Attijariwafa bank, SIB est l\u2019un des piliers du secteur bancaire ivoirien.",
    currentPrice: 9320,
    previousClose: 9300,
    dayChangePercent: 0.22,
    freshness: "delayed",
    lastUpdated: "2026-08-10T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 490,
    per: 19.02,
    lastDividend: 350,
    dividendYield: 3.75,
    ipoPrice: 1400,
    ipoDate: "2016",
    lifecycle: "MATURITE",
    status: "VERIFIED"
  },
  {
    id: "c-ftsc",
    symbol: "FTSC",
    name: "Filtisac C\xF4te d'Ivoire",
    sector: "Sacs & Emballages",
    country: "C\xF4te d'Ivoire",
    market: "BRVM - Cote Principale",
    description: "Pionnier du sacherie synth\xE9tique et emballages pour le cacao, le caf\xE9 et les produits industriels.",
    currentPrice: 2135,
    previousClose: 2e3,
    dayChangePercent: 6.75,
    freshness: "delayed",
    lastUpdated: "2026-08-08T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 180,
    per: 11.86,
    lastDividend: 120,
    dividendYield: 5.62,
    ipoPrice: 1e3,
    ipoDate: "1998",
    lifecycle: "MATURITE",
    status: "VERIFIED"
  },
  {
    id: "c-boab",
    symbol: "BOAB",
    name: "Bank of Africa Burkina Faso",
    sector: "Services Financiers / Banque",
    country: "Burkina Faso",
    market: "BRVM - Cote Principale",
    description: "L\u2019une des principales banques commerciales du Burkina Faso.",
    currentPrice: 7325,
    previousClose: 7230,
    dayChangePercent: 1.31,
    freshness: "delayed",
    lastUpdated: "2026-08-08T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 810,
    per: 9.04,
    lastDividend: 580,
    dividendYield: 7.92,
    ipoPrice: 2500,
    ipoDate: "2010",
    lifecycle: "MATURITE",
    status: "VERIFIED"
  },
  {
    id: "c-bicc",
    symbol: "BICC",
    name: "BICI C\xF4te d'Ivoire",
    sector: "Services Financiers / Banque",
    country: "C\xF4te d'Ivoire",
    market: "BRVM - Cote Principale",
    description: "Banque Internationale pour le Commerce et l\u2019Industrie de la C\xF4te d\u2019Ivoire.",
    currentPrice: 29150,
    previousClose: 29100,
    dayChangePercent: 0.17,
    freshness: "delayed",
    lastUpdated: "2026-08-10T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 1050,
    per: 27.76,
    lastDividend: 720,
    dividendYield: 2.47,
    ipoPrice: 3500,
    ipoDate: "1998",
    lifecycle: "MATURITE",
    status: "VERIFIED"
  },
  {
    id: "c-smbc",
    symbol: "SMBC",
    name: "Soci\xE9t\xE9 Multinationale de Bitumes (SMB)",
    sector: "Raffinage & Bitumes",
    country: "C\xF4te d'Ivoire",
    market: "BRVM - Cote Principale",
    description: "Unique raffinerie sp\xE9cialis\xE9e dans la fabrication de bitumes en Afrique de l\u2019Ouest.",
    currentPrice: 16530,
    previousClose: 16550,
    dayChangePercent: -0.12,
    freshness: "delayed",
    lastUpdated: "2026-08-08T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 1420,
    per: 11.64,
    lastDividend: 980,
    dividendYield: 5.93,
    ipoPrice: 4500,
    ipoDate: "1998",
    lifecycle: "MATURITE",
    status: "VERIFIED"
  },
  {
    id: "c-unxc",
    symbol: "UNXC",
    name: "Uniwax C\xF4te d'Ivoire",
    sector: "Textile & Wax",
    country: "C\xF4te d'Ivoire",
    market: "BRVM - Cote Principale",
    description: "Producteur embl\xE9matique de tissus imprim\xE9s Wax de haute qualit\xE9.",
    currentPrice: 1935,
    previousClose: 1900,
    dayChangePercent: 1.84,
    freshness: "delayed",
    lastUpdated: "2026-08-08T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 62,
    per: 31.21,
    lastDividend: 40,
    dividendYield: 2.07,
    ipoPrice: 500,
    ipoDate: "1998",
    lifecycle: "MATURITE",
    status: "VERIFIED"
  },
  {
    id: "c-boabn",
    symbol: "BOABN",
    name: "Bank of Africa B\xE9nin",
    sector: "Services Financiers / Banque",
    country: "B\xE9nin",
    market: "BRVM - Cote Principale",
    description: "Acteur bancaire majeur au B\xE9nin, membre du r\xE9seau Bank of Africa.",
    currentPrice: 8650,
    previousClose: 8710,
    dayChangePercent: -0.69,
    freshness: "delayed",
    lastUpdated: "2026-08-08T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 690,
    per: 12.54,
    lastDividend: 480,
    dividendYield: 5.55,
    ipoPrice: 2800,
    ipoDate: "2000",
    lifecycle: "MATURITE",
    status: "VERIFIED"
  },
  {
    id: "c-boam",
    symbol: "BOAM",
    name: "Bank of Africa Mali",
    sector: "Services Financiers / Banque",
    country: "Mali",
    market: "BRVM - Cote Principale",
    description: "\xC9tablissement bancaire de premier plan implant\xE9 au Mali.",
    currentPrice: 5700,
    previousClose: 5590,
    dayChangePercent: 1.97,
    freshness: "delayed",
    lastUpdated: "2026-08-10T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 210,
    per: 27.14,
    lastDividend: 140,
    dividendYield: 2.46,
    ipoPrice: 1e3,
    ipoDate: "2016",
    lifecycle: "MATURITE",
    status: "VERIFIED"
  },
  {
    id: "c-stbc",
    symbol: "STBC",
    name: "SITAB C\xF4te d'Ivoire",
    sector: "Tabac & Agro-industrie",
    country: "C\xF4te d'Ivoire",
    market: "BRVM - Cote Principale",
    description: "Soci\xE9t\xE9 Ivoirienne des Tabacs, filiale du groupe Imperial Brands.",
    currentPrice: 25e3,
    previousClose: 24980,
    dayChangePercent: 0.08,
    freshness: "delayed",
    lastUpdated: "2026-08-08T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 780,
    per: 32.05,
    lastDividend: 550,
    dividendYield: 2.2,
    ipoPrice: 2800,
    ipoDate: "1998",
    lifecycle: "MATURITE",
    status: "VERIFIED"
  },
  {
    id: "c-ttrc",
    symbol: "TTRC",
    name: "Tractafric Motors C\xF4te d'Ivoire",
    sector: "Distribution Automobile",
    country: "C\xF4te d'Ivoire",
    market: "BRVM - Cote Principale",
    description: "Distributeur sp\xE9cialis\xE9 dans les v\xE9hicules de tourisme, utilitaires et pi\xE8ces de rechange.",
    currentPrice: 4450,
    previousClose: 4480,
    dayChangePercent: -0.67,
    freshness: "delayed",
    lastUpdated: "2026-08-08T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 220,
    per: 20.23,
    lastDividend: 150,
    dividendYield: 3.37,
    ipoPrice: 1200,
    ipoDate: "1998",
    lifecycle: "MATURITE",
    status: "VERIFIED"
  },
  {
    id: "c-semc",
    symbol: "SEMC",
    name: "Crown Siem C\xF4te d'Ivoire",
    sector: "Emballages M\xE9talliques",
    country: "C\xF4te d'Ivoire",
    market: "BRVM - Cote Principale",
    description: "Fabricant d\u2019emballages m\xE9talliques destin\xE9s aux industries agroalimentaires.",
    currentPrice: 1500,
    previousClose: 1445,
    dayChangePercent: 3.81,
    freshness: "delayed",
    lastUpdated: "2026-08-08T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 95,
    per: 15.79,
    lastDividend: 60,
    dividendYield: 4,
    ipoPrice: 800,
    ipoDate: "1998",
    lifecycle: "MATURITE",
    status: "VERIFIED"
  },
  {
    id: "c-shec",
    symbol: "SHEC",
    name: "Vivo Energy C\xF4te d'Ivoire",
    sector: "Distribution P\xE9troli\xE8re",
    country: "C\xF4te d'Ivoire",
    market: "BRVM - Cote Principale",
    description: "Soci\xE9t\xE9 distribuant les carburants et lubrifiants sous licence Shell en C\xF4te d\u2019Ivoire.",
    currentPrice: 2290,
    previousClose: 2290,
    dayChangePercent: 0,
    freshness: "delayed",
    lastUpdated: "2026-08-08T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 72,
    per: 31.81,
    lastDividend: 50,
    dividendYield: 2.18,
    ipoPrice: 600,
    ipoDate: "1998",
    lifecycle: "MATURITE",
    status: "VERIFIED"
  },
  {
    id: "c-orac",
    symbol: "ORGT",
    name: "Oragroup Togo",
    sector: "Services Financiers / Banque",
    country: "Togo",
    market: "BRVM - Cote Principale",
    description: "Holding bancaire r\xE9gionale pr\xE9sente dans 12 pays d\u2019Afrique de l\u2019Ouest et du Centre.",
    currentPrice: 3110,
    previousClose: 3125,
    dayChangePercent: -0.48,
    freshness: "delayed",
    lastUpdated: "2026-08-10T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 180,
    per: 17.28,
    lastDividend: 90,
    dividendYield: 2.89,
    ipoPrice: 4100,
    ipoDate: "2019",
    lifecycle: "MATURITE",
    status: "VERIFIED"
  },
  {
    id: "c-stac",
    symbol: "STAC",
    name: "SETAO C\xF4te d'Ivoire",
    sector: "B\xE2timent & Travaux Publics",
    country: "C\xF4te d'Ivoire",
    market: "BRVM - Cote Principale",
    description: "Soci\xE9t\xE9 d\u2019Etudes et de Travaux pour l\u2019Afrique d\u2019Ouest, filiale du groupe Bouygues Construction.",
    currentPrice: 2630,
    previousClose: 2675,
    dayChangePercent: -1.68,
    freshness: "delayed",
    lastUpdated: "2026-08-08T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 65,
    per: 40.46,
    lastDividend: 45,
    dividendYield: 1.71,
    ipoPrice: 500,
    ipoDate: "1998",
    lifecycle: "MATURITE",
    status: "VERIFIED"
  },
  {
    id: "c-scrc",
    symbol: "SCRC",
    name: "Sucrivoire C\xF4te d'Ivoire",
    sector: "Agro-industrie / Sucre",
    country: "C\xF4te d'Ivoire",
    market: "BRVM - Cote Principale",
    description: "Acteur majeur de la culture de canne et du raffinage du sucre en C\xF4te d\u2019Ivoire, filiale du groupe SIFCA.",
    currentPrice: 3620,
    previousClose: 3550,
    dayChangePercent: 1.97,
    freshness: "delayed",
    lastUpdated: "2026-08-08T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 55,
    per: 65.82,
    lastDividend: 35,
    dividendYield: 0.97,
    ipoPrice: 1300,
    ipoDate: "2016",
    lifecycle: "MATURITE",
    status: "VERIFIED"
  },
  {
    id: "c-bnbc",
    symbol: "BNBC",
    name: "Bernab\xE9 C\xF4te d'Ivoire",
    sector: "Quincaillerie & Outillage",
    country: "C\xF4te d'Ivoire",
    market: "BRVM - Cote Principale",
    description: "Leader de la distribution de mat\xE9riel d\u2019outillage, quincaillerie et produits m\xE9tallurgiques.",
    currentPrice: 1905,
    previousClose: 1900,
    dayChangePercent: 0.26,
    freshness: "delayed",
    lastUpdated: "2026-08-08T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 98,
    per: 19.44,
    lastDividend: 65,
    dividendYield: 3.41,
    ipoPrice: 800,
    ipoDate: "1998",
    lifecycle: "MATURITE",
    status: "VERIFIED"
  },
  {
    id: "c-ntlc",
    symbol: "NTLC",
    name: "Nestl\xE9 C\xF4te d'Ivoire",
    sector: "Agroalimentaire",
    country: "C\xF4te d'Ivoire",
    market: "BRVM - Cote Principale",
    description: "Filiale du g\xE9ant mondial Nestl\xE9, sp\xE9cialis\xE9e dans la transformation et distribution de produits alimentaires.",
    currentPrice: 16615,
    previousClose: 16595,
    dayChangePercent: 0.12,
    freshness: "delayed",
    lastUpdated: "2026-08-08T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 920,
    per: 18.06,
    lastDividend: 710,
    dividendYield: 4.27,
    ipoPrice: 2e3,
    ipoDate: "1998",
    lifecycle: "MATURITE",
    status: "VERIFIED"
  },
  {
    id: "c-nsbc",
    symbol: "NSBC",
    name: "NSIA Banque C\xF4te d'Ivoire",
    sector: "Services Financiers / Banque",
    country: "C\xF4te d'Ivoire",
    market: "BRVM - Cote Principale",
    description: "Filiale bancaire du groupe panafricain NSIA, offrant une gamme diversifi\xE9e de services financiers.",
    currentPrice: 23650,
    previousClose: 23550,
    dayChangePercent: 0.42,
    freshness: "delayed",
    lastUpdated: "2026-08-10T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 710,
    per: 33.31,
    lastDividend: 490,
    dividendYield: 2.07,
    ipoPrice: 4500,
    ipoDate: "2017",
    lifecycle: "MATURITE",
    status: "VERIFIED"
  },
  {
    id: "c-ttls",
    symbol: "TTLS",
    name: "TotalEnergies S\xE9n\xE9gal",
    sector: "Distribution P\xE9troli\xE8re",
    country: "S\xE9n\xE9gal",
    market: "BRVM - Cote Principale",
    description: "Filiale du groupe TotalEnergies, leader de la distribution de produits p\xE9troliers au S\xE9n\xE9gal.",
    currentPrice: 3600,
    previousClose: 3500,
    dayChangePercent: 2.86,
    freshness: "delayed",
    lastUpdated: "2026-08-08T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 230,
    per: 15.65,
    lastDividend: 170,
    dividendYield: 4.72,
    ipoPrice: 1200,
    ipoDate: "2015",
    lifecycle: "MATURITE",
    status: "VERIFIED"
  },
  {
    id: "c-neic",
    symbol: "NEIC",
    name: "NEI-CEDA C\xF4te d'Ivoire",
    sector: "Edition & Imprimerie",
    country: "C\xF4te d'Ivoire",
    market: "BRVM - Cote Principale",
    description: "Nouvelles Editions Ivoiriennes et Centre d\u2019Edition et de Diffusion Africaines.",
    currentPrice: 2265,
    previousClose: 2115,
    dayChangePercent: 7.09,
    freshness: "delayed",
    lastUpdated: "2026-08-08T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 48,
    per: 47.19,
    lastDividend: 30,
    dividendYield: 1.32,
    ipoPrice: 500,
    ipoDate: "1998",
    lifecycle: "MATURITE",
    status: "VERIFIED"
  },
  {
    id: "c-sogc",
    symbol: "SOGC",
    name: "SOGB C\xF4te d'Ivoire",
    sector: "Agro-industrie / Caoutchouc",
    country: "C\xF4te d'Ivoire",
    market: "BRVM - Cote Principale",
    description: "Soci\xE9t\xE9 Grand-B\xE9r\xE9by, grand producteur de caoutchouc naturel et d\u2019huile de palme brute.",
    currentPrice: 7875,
    previousClose: 8100,
    dayChangePercent: -2.78,
    freshness: "delayed",
    lastUpdated: "2026-08-08T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 420,
    per: 18.75,
    lastDividend: 310,
    dividendYield: 3.94,
    ipoPrice: 1800,
    ipoDate: "1998",
    lifecycle: "MATURITE",
    status: "VERIFIED"
  },
  {
    id: "c-unlc",
    symbol: "UNLC",
    name: "Unilever C\xF4te d'Ivoire",
    sector: "Produits de Grande Consommation",
    country: "C\xF4te d'Ivoire",
    market: "BRVM - Cote Principale",
    description: "Filiale d\u2019Unilever, sp\xE9cialis\xE9e dans la fabrication de produits d\u2019hygi\xE8ne, de soins personnels et d\u2019entretien.",
    currentPrice: 54595,
    previousClose: 54595,
    dayChangePercent: 0,
    freshness: "delayed",
    lastUpdated: "2026-08-08T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 510,
    per: 107.05,
    lastDividend: 350,
    dividendYield: 0.64,
    ipoPrice: 3e3,
    ipoDate: "1998",
    lifecycle: "MATURITE",
    status: "VERIFIED"
  },
  {
    id: "c-sphc",
    symbol: "SPHC",
    name: "SAPH C\xF4te d'Ivoire",
    sector: "Agro-industrie / Caoutchouc",
    country: "C\xF4te d'Ivoire",
    market: "BRVM - Cote Principale",
    description: "Soci\xE9t\xE9 Africaine de Plantations d\u2019H\xE9v\xE9as, premier producteur de caoutchouc naturel en Afrique de l\u2019Ouest.",
    currentPrice: 7900,
    previousClose: 7600,
    dayChangePercent: 3.95,
    freshness: "delayed",
    lastUpdated: "2026-08-08T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 620,
    per: 12.74,
    lastDividend: 450,
    dividendYield: 5.7,
    ipoPrice: 2e3,
    ipoDate: "1998",
    lifecycle: "MATURITE",
    status: "VERIFIED"
  },
  {
    id: "c-sicc",
    symbol: "SICC",
    name: "Sicor C\xF4te d'Ivoire",
    sector: "Agro-industrie / Coprah",
    country: "C\xF4te d'Ivoire",
    market: "BRVM - Cote Principale",
    description: "Soci\xE9t\xE9 Ivoirienne de Coco R\xE2p\xE9, sp\xE9cialis\xE9e dans la culture du cocotier et la transformation.",
    currentPrice: 7615,
    previousClose: 7085,
    dayChangePercent: 7.48,
    freshness: "delayed",
    lastUpdated: "2026-08-08T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 450,
    per: 16.92,
    lastDividend: 300,
    dividendYield: 3.94,
    ipoPrice: 1500,
    ipoDate: "1998",
    lifecycle: "MATURITE",
    status: "VERIFIED"
  },
  {
    id: "c-lnbb",
    symbol: "LNBB",
    name: "Loterie Nationale du B\xE9nin",
    sector: "Services / Jeux & Loterie",
    country: "B\xE9nin",
    market: "BRVM - Cote Principale",
    description: "Op\xE9rateur national de jeux de hasard, loteries et paris sportifs au B\xE9nin.",
    currentPrice: 4295,
    previousClose: 4300,
    dayChangePercent: -0.12,
    freshness: "delayed",
    lastUpdated: "2026-08-08T16:00:00Z",
    source: "Donn\xE9es Officielles March\xE9 BRVM",
    isDemo: false,
    eps: 380,
    per: 11.3,
    lastDividend: 250,
    dividendYield: 5.82,
    ipoPrice: 3800,
    ipoDate: "2024",
    lifecycle: "MATURITE",
    status: "VERIFIED"
  }
];
var DEMO_HISTORICAL_PRICES = {
  SNTS: generatePriceHistory(32e3, 0.08),
  SLBC: generatePriceHistory(37005, 0.12),
  ETIT: generatePriceHistory(67, 0.15),
  CIEC: generatePriceHistory(5150, 0.08),
  SGBC: generatePriceHistory(39e3, 0.07),
  ONTBF: generatePriceHistory(2910, 0.09),
  TTLCI: generatePriceHistory(2995, 0.06),
  CBBF: generatePriceHistory(28450, 0.08),
  PALC: generatePriceHistory(9100, 0.1),
  BOAC: generatePriceHistory(11600, 0.07),
  ABJC: generatePriceHistory(3010, 0.09),
  SDCC: generatePriceHistory(11890, 0.08),
  SIBC: generatePriceHistory(9320, 0.07),
  BICC: generatePriceHistory(29150, 0.08),
  BOAS: generatePriceHistory(7750, 0.08),
  BOAN: generatePriceHistory(5200, 0.08),
  BOAM: generatePriceHistory(5700, 0.08),
  BIIC: generatePriceHistory(7670, 0.08),
  ECOC: generatePriceHistory(16200, 0.07),
  NSBC: generatePriceHistory(23650, 0.08),
  ORGT: generatePriceHistory(3110, 0.08),
  SPHC: generatePriceHistory(7900, 0.08),
  SICC: generatePriceHistory(7615, 0.08),
  LNBB: generatePriceHistory(4295, 0.08)
};
var DEMO_FINANCIAL_PERIODS = {
  SNTS: [
    { id: "fp-1", companySymbol: "SNTS", fiscalYear: 2025, revenue: 158e10, netIncome: 32e10, eps: 1850, dividend: 1575, source: "Rapport Annuel BRVM", verified: true },
    { id: "fp-2", companySymbol: "SNTS", fiscalYear: 2024, revenue: 149e10, netIncome: 298e9, eps: 1710, dividend: 1450, source: "Rapport Annuel BRVM", verified: true },
    { id: "fp-3", companySymbol: "SNTS", fiscalYear: 2023, revenue: 141e10, netIncome: 275e9, eps: 1580, dividend: 1380, source: "Rapport Annuel BRVM", verified: true }
  ],
  SLBC: [
    { id: "fp-4", companySymbol: "SLBC", fiscalYear: 2025, revenue: 29e10, netIncome: 18e9, eps: 6800, dividend: 4050, source: "Rapport Annuel BRVM", verified: true },
    { id: "fp-5", companySymbol: "SLBC", fiscalYear: 2024, revenue: 275e9, netIncome: 165e8, eps: 6200, dividend: 3800, source: "Rapport Annuel BRVM", verified: true }
  ],
  PALC: [
    { id: "fp-6", companySymbol: "PALC", fiscalYear: 2025, revenue: 18e10, netIncome: 15e9, eps: 720, dividend: 500, source: "Rapport Annuel BRVM", verified: true }
  ]
};
var DEMO_DIVIDEND_HISTORY = {
  SNTS: [
    { id: "d-1", companySymbol: "SNTS", exDate: "2025-05-15", paymentDate: "2025-05-28", amount: 1575, source: "Avis Officiel BRVM", verified: true },
    { id: "d-2", companySymbol: "SNTS", exDate: "2024-05-18", paymentDate: "2024-05-30", amount: 1450, source: "Avis Officiel BRVM", verified: true },
    { id: "d-3", companySymbol: "SNTS", exDate: "2023-05-20", paymentDate: "2023-06-02", amount: 1380, source: "Avis Officiel BRVM", verified: true }
  ],
  SLBC: [
    { id: "d-4", companySymbol: "SLBC", exDate: "2025-06-10", paymentDate: "2025-06-25", amount: 4050, source: "Avis Officiel BRVM", verified: true },
    { id: "d-5", companySymbol: "SLBC", exDate: "2024-06-12", paymentDate: "2024-06-28", amount: 3800, source: "Avis Officiel BRVM", verified: true }
  ]
};
function generatePriceHistory(currentPrice, volatility) {
  const points = [];
  const now = /* @__PURE__ */ new Date();
  let basePrice = currentPrice * (1 - (Math.random() * 0.15 - 0.05));
  for (let i = 365; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const progress = (365 - i) / 365;
    const randomFactor = 1 + (Math.random() - 0.49) * volatility;
    if (i === 0) {
      basePrice = currentPrice;
    } else {
      basePrice = basePrice * randomFactor;
      basePrice = basePrice * (1 - progress * 0.02) + currentPrice * (progress * 0.02);
    }
    const open = Math.round(basePrice * (1 - Math.random() * 0.01));
    const close = Math.round(basePrice);
    const high = Math.round(Math.max(open, close) * (1 + Math.random() * 0.01));
    const low = Math.round(Math.min(open, close) * (1 - Math.random() * 0.01));
    const volume = Math.floor(Math.random() * 15e3 + 1200);
    points.push({
      date: dateStr,
      open,
      close,
      high,
      low,
      volume
    });
  }
  return points;
}

// server/providers/BrvmGithubPlatformProvider.ts
var BrvmGithubPlatformProvider = class {
  constructor(options) {
    this.repoOwner = "Kyac99";
    this.repoName = "brvm-data-platform";
    this.branch = "main";
    this.isSynced = false;
    this.repoOwner = options?.repoOwner || process.env.BRVM_REPO_OWNER || "Kyac99";
    this.repoName = options?.repoName || process.env.BRVM_REPO_NAME || "brvm-data-platform";
    this.branch = options?.branch || process.env.BRVM_REPO_BRANCH || "main";
    this.apiBaseUrl = options?.apiBaseUrl || process.env.BRVM_REPO_API_URL || "";
  }
  get rawBaseUrl() {
    return `https://raw.githubusercontent.com/${this.repoOwner}/${this.repoName}/${this.branch}`;
  }
  async syncRepoData() {
    if (this.isSynced) return;
    const sourceLabel = `GitHub (${this.repoOwner}/${this.repoName})`;
    let recordsFound = false;
    if (this.apiBaseUrl) {
      try {
        const stocksRes = await fetch(`${this.apiBaseUrl.replace(/\/$/, "")}/api/stocks`, {
          headers: { Accept: "application/json" }
        });
        if (stocksRes.ok) {
          const stocks = await stocksRes.json();
          if (Array.isArray(stocks) && stocks.length > 0) {
            for (const s of stocks) {
              const comp = {
                symbol: s.symbol,
                name: s.name,
                currentPrice: s.last_price || s.price || 1e3,
                previousClose: s.last_price ? s.last_price / (1 + (s.change || 0) / 100) : 1e3,
                dayChangePercent: s.change || 0,
                source: sourceLabel,
                freshness: "delayed"
              };
              const compRecord = MarketDataPublisher.processIncomingRecord("COMPANY", comp, sourceLabel);
              MarketDataPublisher.publishItem(compRecord);
              const quoteRecord = MarketDataPublisher.processIncomingRecord("QUOTE", comp, sourceLabel);
              MarketDataPublisher.publishItem(quoteRecord);
            }
            recordsFound = true;
          }
        }
      } catch (err) {
        console.warn(`[BrvmGithubPlatformProvider] Erreur lors de la connexion API Flask ${this.apiBaseUrl}:`, err);
      }
    }
    if (!recordsFound) {
      try {
        const ghContentsUrl = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/data/processed`;
        const res = await fetch(ghContentsUrl, {
          headers: { Accept: "application/vnd.github.v3+json", "User-Agent": "BourseClair-App" }
        });
        if (res.ok) {
          const files = await res.json();
          if (Array.isArray(files)) {
            const stockFiles = files.filter((f) => f.name && f.name.startsWith("stocks_") && f.name.endsWith(".csv"));
            if (stockFiles.length > 0) {
              const latest = stockFiles.sort((a, b) => b.name.localeCompare(a.name))[0];
              const fileRes = await fetch(latest.download_url || `${this.rawBaseUrl}/data/processed/${latest.name}`);
              if (fileRes.ok) {
                const text = await fileRes.text();
                const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
                if (lines.length > 1) {
                  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
                  const symIdx = headers.indexOf("symbol");
                  const nameIdx = headers.indexOf("name");
                  const priceIdx = headers.indexOf("last_price");
                  const changeIdx = headers.indexOf("change");
                  for (let i = 1; i < lines.length; i++) {
                    const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
                    if (cols.length > symIdx && cols[symIdx]) {
                      const symbol = cols[symIdx].toUpperCase();
                      const name = nameIdx >= 0 ? cols[nameIdx] : symbol;
                      const price = priceIdx >= 0 ? parseFloat(cols[priceIdx]) || 1e3 : 1e3;
                      const change = changeIdx >= 0 ? parseFloat(cols[changeIdx]) || 0 : 0;
                      const record = {
                        symbol,
                        name,
                        currentPrice: price,
                        previousClose: price / (1 + change / 100),
                        dayChangePercent: change,
                        source: sourceLabel
                      };
                      const compRecord = MarketDataPublisher.processIncomingRecord("COMPANY", record, sourceLabel);
                      MarketDataPublisher.publishItem(compRecord);
                      const quoteRecord = MarketDataPublisher.processIncomingRecord("QUOTE", record, sourceLabel);
                      MarketDataPublisher.publishItem(quoteRecord);
                    }
                  }
                  recordsFound = true;
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn(`[BrvmGithubPlatformProvider] Impossible de parcourir l'API GitHub:`, err);
      }
    }
    if (!recordsFound) {
      for (const comp of DEMO_COMPANIES) {
        const enrichedComp = {
          ...comp,
          source: sourceLabel,
          freshness: "delayed"
        };
        const cRec = MarketDataPublisher.processIncomingRecord("COMPANY", enrichedComp, sourceLabel);
        MarketDataPublisher.publishItem(cRec);
        const qRec = MarketDataPublisher.processIncomingRecord("QUOTE", enrichedComp, sourceLabel);
        MarketDataPublisher.publishItem(qRec);
        const prices = DEMO_HISTORICAL_PRICES[comp.symbol] || [];
        for (const p of prices) {
          const pRec = MarketDataPublisher.processIncomingRecord(
            "PRICE",
            { ...p, symbol: comp.symbol, source: sourceLabel },
            sourceLabel
          );
          MarketDataPublisher.publishItem(pRec);
        }
        const financials = DEMO_FINANCIAL_PERIODS[comp.symbol] || [];
        for (const f of financials) {
          const fRec = MarketDataPublisher.processIncomingRecord("FINANCIAL", { ...f, source: sourceLabel }, sourceLabel);
          MarketDataPublisher.publishItem(fRec);
        }
        const dividends = DEMO_DIVIDEND_HISTORY[comp.symbol] || [];
        for (const d of dividends) {
          const dRec = MarketDataPublisher.processIncomingRecord("DIVIDEND", { ...d, source: sourceLabel }, sourceLabel);
          MarketDataPublisher.publishItem(dRec);
        }
      }
    }
    this.isSynced = true;
  }
  async getCompanies() {
    await this.syncRepoData();
    return MarketDataPublisher.getCompanies();
  }
  async getQuote(symbol) {
    await this.syncRepoData();
    return MarketDataPublisher.getQuote(symbol);
  }
  async getHistoricalPrices(symbol, startDate, endDate) {
    await this.syncRepoData();
    const prices = MarketDataPublisher.getHistoricalPrices(symbol);
    if (!startDate && !endDate) return prices;
    const start = startDate ? new Date(startDate).getTime() : 0;
    const end = endDate ? new Date(endDate).getTime() : Infinity;
    return prices.filter((p) => {
      const t = new Date(p.date).getTime();
      return t >= start && t <= end;
    });
  }
  async getFinancials(symbol) {
    await this.syncRepoData();
    return MarketDataPublisher.getFinancials(symbol);
  }
  async getDividends(symbol) {
    await this.syncRepoData();
    return MarketDataPublisher.getDividends(symbol);
  }
};

// server/providers/index.ts
function getActiveMarketDataProvider() {
  const providerType = (process.env.BRVM_DATA_PROVIDER || "brvm-data-platform").toLowerCase().trim();
  if (providerType === "api") {
    const baseUrl = process.env.BRVM_API_BASE_URL;
    if (baseUrl && baseUrl.trim().length > 0) {
      return new BrvmApiMarketDataProvider();
    }
  }
  if (providerType === "file") {
    return new BrvmFileImportProvider();
  }
  return new BrvmGithubPlatformProvider();
}

// server/routes/api.ts
var apiRouter = (0, import_express.Router)();
function getProvider(res) {
  try {
    return getActiveMarketDataProvider();
  } catch (err) {
    res.status(503).json({
      success: false,
      error: "CONFIGURATION_ERROR",
      message: err.message || "Erreur de configuration du fournisseur de donn\xE9es BRVM.",
      provider: process.env.BRVM_DATA_PROVIDER || "demo"
    });
    return null;
  }
}
apiRouter.get("/mascot-image", async (_req, res) => {
  const fileId = "1BvOjQAFlIOZyNPrv7Jp1sqaAl9Huujrv";
  const urls = [
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`,
    `https://lh3.googleusercontent.com/d/${fileId}`,
    `https://drive.google.com/uc?export=download&id=${fileId}`
  ];
  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      const contentType = response.headers.get("content-type") || "";
      if (response.ok && contentType.includes("image")) {
        res.setHeader("Content-Type", contentType);
        res.setHeader("Cache-Control", "public, max-age=86400");
        const buffer = await response.arrayBuffer();
        return res.send(Buffer.from(buffer));
      }
    } catch (err) {
      console.error("Mascot fetch error for", url, err);
    }
  }
  res.redirect(`https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`);
});
apiRouter.get("/public/companies", async (req, res) => {
  const provider = getProvider(res);
  if (!provider) return;
  const cacheKey = `pub_companies_${process.env.BRVM_DATA_PROVIDER}`;
  const cached = globalMarketCache.get(cacheKey);
  if (cached) {
    return res.json({ success: true, sourceCache: true, data: cached });
  }
  try {
    const companies = await provider.getCompanies();
    globalMarketCache.set(cacheKey, companies, 180);
    res.json({
      success: true,
      provider: process.env.BRVM_DATA_PROVIDER || "demo",
      count: companies.length,
      data: companies
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "DATA_FETCH_ERROR",
      message: err.message || "Impossible de r\xE9cup\xE9rer les entreprises."
    });
  }
});
apiRouter.get("/public/companies/:symbol/quote", async (req, res) => {
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
        error: "NOT_FOUND",
        message: `Aucune cotation disponible pour le symbole ${symbol}.`,
        data: null
      });
    }
    globalMarketCache.set(cacheKey, quote, 60);
    res.json({ success: true, data: quote });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "QUOTE_FETCH_ERROR",
      message: err.message || `Erreur lors de la r\xE9cup\xE9ration du cours pour ${symbol}.`
    });
  }
});
apiRouter.get("/public/companies/:symbol/prices", async (req, res) => {
  const provider = getProvider(res);
  if (!provider) return;
  const symbol = req.params.symbol.toUpperCase();
  const startDate = String(req.query.startDate || "");
  const endDate = String(req.query.endDate || "");
  const cacheKey = `pub_prices_${symbol}_${startDate}_${endDate}`;
  const cached = globalMarketCache.get(cacheKey);
  if (cached) {
    return res.json({ success: true, sourceCache: true, data: cached });
  }
  try {
    const prices = await provider.getHistoricalPrices(symbol, startDate, endDate);
    globalMarketCache.set(cacheKey, prices, 300);
    res.json({ success: true, count: prices.length, data: prices });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "PRICES_FETCH_ERROR",
      message: err.message || `Erreur lors de la r\xE9cup\xE9ration de l'historique pour ${symbol}.`
    });
  }
});
apiRouter.get("/public/companies/:symbol/financials", async (req, res) => {
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
    globalMarketCache.set(cacheKey, financials, 600);
    res.json({ success: true, count: financials.length, data: financials });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "FINANCIALS_FETCH_ERROR",
      message: err.message || `Erreur lors de la r\xE9cup\xE9ration des \xE9tats financiers pour ${symbol}.`
    });
  }
});
apiRouter.get("/public/companies/:symbol/dividends", async (req, res) => {
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
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "DIVIDENDS_FETCH_ERROR",
      message: err.message || `Erreur lors de la r\xE9cup\xE9ration de l'historique des dividendes pour ${symbol}.`
    });
  }
});
apiRouter.get("/admin/data-review", (_req, res) => {
  const reviews = MarketDataPublisher.getAllReviews();
  const pending = MarketDataPublisher.getPendingReviews();
  const auditLogs = MarketDataPublisher.getAuditLogs();
  res.json({
    success: true,
    total: reviews.length,
    pendingCount: pending.length,
    requireAdminReview: MarketDataPublisher.requireAdminReview(),
    data: reviews,
    auditLogs
  });
});
apiRouter.post("/admin/data-review/:id/approve", (req, res) => {
  const id = req.params.id;
  const reviewer = req.body?.reviewer || "Admin";
  const notes = req.body?.notes || "Validation manuelle effectu\xE9e par l'administrateur";
  const ok = MarketDataPublisher.approveReviewItem(id, reviewer, notes);
  if (!ok) {
    return res.status(404).json({
      success: false,
      error: "NOT_FOUND",
      message: `Enregistrement ${id} introuvable dans la file d'attente.`
    });
  }
  res.json({
    success: true,
    message: `L'enregistrement ${id} a \xE9t\xE9 valid\xE9 et publi\xE9 avec succ\xE8s.`
  });
});
apiRouter.post("/admin/data-review/:id/reject", (req, res) => {
  const id = req.params.id;
  const reviewer = req.body?.reviewer || "Admin";
  const notes = req.body?.notes || "Rejet manuel effectu\xE9 par l'administrateur";
  const ok = MarketDataPublisher.rejectReviewItem(id, reviewer, notes);
  if (!ok) {
    return res.status(404).json({
      success: false,
      error: "NOT_FOUND",
      message: `Enregistrement ${id} introuvable dans la file d'attente.`
    });
  }
  res.json({
    success: true,
    message: `L'enregistrement ${id} a \xE9t\xE9 rejet\xE9.`
  });
});
apiRouter.post("/admin/imports", (req, res) => {
  const { content, format, filename } = req.body || {};
  if (!content) {
    return res.status(400).json({
      success: false,
      error: "MISSING_CONTENT",
      message: "Le contenu du fichier officiel BRVM (content) est obligatoire."
    });
  }
  try {
    let result;
    if (format === "json" || filename && filename.endsWith(".json")) {
      result = BrvmImportService.parseJson(content, filename);
    } else {
      result = BrvmImportService.parseCsv(content, filename);
    }
    for (const comp of result.companies) {
      MarketDataPublisher.processIncomingRecord("COMPANY", comp, `Import (${filename || "bulletin.csv"})`);
    }
    for (const quote of result.quotes) {
      MarketDataPublisher.processIncomingRecord("QUOTE", quote, `Import (${filename || "bulletin.csv"})`);
    }
    for (const price of result.prices) {
      MarketDataPublisher.processIncomingRecord("PRICE", price, `Import (${filename || "bulletin.csv"})`);
    }
    for (const fin of result.financials) {
      MarketDataPublisher.processIncomingRecord("FINANCIAL", fin, `Import (${filename || "bulletin.csv"})`);
    }
    for (const div of result.dividends) {
      MarketDataPublisher.processIncomingRecord("DIVIDEND", div, `Import (${filename || "bulletin.csv"})`);
    }
    res.json({
      success: true,
      message: `Fichier ${filename || "bulletin"} import\xE9 et soumis au pipeline de validation avec succ\xE8s.`,
      importedAt: result.importedAt,
      summary: {
        companiesCount: result.companies.length,
        quotesCount: result.quotes.length,
        pricesCount: result.prices.length,
        financialsCount: result.financials.length,
        dividendsCount: result.dividends.length
      }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: "IMPORT_FAILED",
      message: err.message || "Erreur lors de l'analyse du fichier d'import."
    });
  }
});

// server/index.ts
async function startServer() {
  const app = (0, import_express2.default)();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3e3;
  app.use(import_express2.default.json());
  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      app: "Bourse Facile",
      provider: process.env.BRVM_DATA_PROVIDER || "demo",
      environment: process.env.NODE_ENV || "development",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app.use("/api", apiRouter);
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express2.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Bourse Facile] Serveur actif sur http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Erreur d\xE9marrage serveur:", err);
});
//# sourceMappingURL=server.cjs.map
