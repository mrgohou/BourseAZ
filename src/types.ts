export type DataFreshness = 'real_time' | 'delayed' | 'end_of_day' | 'historical' | 'manual' | 'demo' | 'REALTIME' | 'DELAYED' | 'END_OF_DAY' | 'MANUAL' | 'DEMO';
export type DataStatus = 'COLLECTED' | 'NORMALIZED' | 'PENDING_REVIEW' | 'VERIFIED' | 'PUBLISHED' | 'REJECTED';
export type CompanyLifecycle = 'CROISSANCE' | 'MATURITE' | 'DECLIN' | 'INDETERMINE';

export interface Quote {
  symbol: string;
  price: number;
  previousClose: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  volume: number;
  timestamp: string;
  source: string;
  freshness: DataFreshness;
}

export interface Dividend {
  id: string;
  companySymbol: string;
  exDate: string;
  paymentDate: string;
  amount: number; // in FCFA
  source: string;
  verified: boolean;
}

export interface Company {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  country: string;
  market: string;
  description: string;
  logoUrl?: string;
  currentPrice: number;
  previousClose: number;
  dayChangePercent: number;
  freshness: DataFreshness;
  lastUpdated: string;
  source: string;
  isDemo: boolean;
  eps?: number; // BPA (Bénéfice Par Action) in FCFA
  per?: number; // Price Earning Ratio
  roe?: number; // Return on Equity (% - Rentabilité des capitaux propres)
  pbr?: number; // Price to Book Ratio (PBR / Ratio Cours / Valeur Comptable)
  bookValuePerShare?: number; // Valeur comptable par action (Actif Net par Action in FCFA)
  lastDividend?: number; // Dividend in FCFA
  dividendYield?: number; // %
  ipoPrice?: number; // Prix d'introduction en Bourse / Coût intrinsèque d'entrée (in FCFA)
  ipoDate?: string; // Date ou année d'introduction en Bourse
  lifecycle: CompanyLifecycle;
  status: DataStatus;
}

export interface MarketPricePoint {
  date: string; // ISO date format YYYY-MM-DD
  close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
}

export interface FinancialPeriod {
  id: string;
  companySymbol: string;
  fiscalYear: number;
  revenue: number; // in FCFA
  netIncome: number; // in FCFA
  eps: number; // BPA in FCFA
  dividend: number; // in FCFA
  source: string;
  verified: boolean;
}

export interface DividendHistory {
  id: string;
  companySymbol: string;
  exDate: string;
  paymentDate: string;
  amount: number; // in FCFA
  source: string;
  verified: boolean;
}

export type DividendMode = 'NONE' | 'KEEP' | 'REINVEST';

export interface SimulationOperation {
  id: string;
  type: 'BUY' | 'SELL' | 'DIVIDEND_PAYMENT' | 'DIVIDEND_REINVEST';
  date: string;
  quantity: number;
  price: number; // in FCFA
  fees: number; // in FCFA
  notes?: string;
}

export interface SimulationResult {
  id: string;
  title: string;
  companySymbol: string;
  companyName: string;
  startDate: string;
  endDate: string;
  initialAmount: number; // in FCFA
  dividendMode: DividendMode;
  initialPrice: number;
  finalPrice: number;
  sharesBought: number;
  totalDividendsReceived: number;
  finalValue: number; // in FCFA
  netGainOrLoss: number; // in FCFA
  performancePercent: number; // %
  annualizedReturnPercent?: number; // %
  operations: SimulationOperation[];
  createdAt: string;
  hypotheses: string[];
}

export interface SavedAnalysis {
  id: string;
  symbol: string;
  companyName: string;
  title: string;
  notes: string;
  snapshotPrice: number;
  snapshotPer?: number;
  snapshotEps?: number;
  createdAt: string;
}

export interface PriceAlert {
  id: string;
  companySymbol: string;
  companyName: string;
  targetPrice: number; // in FCFA
  condition: 'ABOVE' | 'BELOW';
  notificationType: 'EMAIL' | 'PUSH' | 'BOTH';
  emailRecipient?: string;
  phoneRecipient?: string;
  active: boolean;
  triggered: boolean;
  triggeredAt?: string;
  triggeredPrice?: number;
  notes?: string;
  createdAt: string;
}

export interface LearningModule {
  id: string;
  slug: string;
  title: string;
  durationMinutes: number;
  description: string;
  iconName: string;
  lessonsCount: number;
  content: {
    summary: string;
    keyTakeaway: string;
    fullText: string[];
    exampleFcfa?: string;
    quizQuestion: {
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    };
  };
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'USER' | 'ADMIN';
  authProvider: 'EMAIL' | 'GOOGLE' | 'PHONE' | 'RICHBOURSE';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  timestamp: string;
}

export interface DataAnomaly {
  id: string;
  companySymbol: string;
  metric: string;
  issue: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  detectedAt: string;
  resolved: boolean;
}

export interface ImportJob {
  id: string;
  source: string;
  startedAt: string;
  completedAt?: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  recordsProcessed: number;
  errorMessage?: string;
}
