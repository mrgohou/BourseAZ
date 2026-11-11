import {
  VirtualPortfolio,
  VirtualPosition,
  VirtualTransaction,
  VirtualPositionCalculated,
  Company,
} from '../../types';
import { DEMO_COMPANIES } from '../../data/demo-data';
import { db, doc, getDoc, setDoc } from '../../lib/firebase';

const STORAGE_PREFIX = 'bourseclair_virtual_portfolio_';

export interface PortfolioKPIs {
  totalValue: number;
  currentCash: number;
  totalInvested: number;
  unrealizedGainLoss: number;
  unrealizedGainLossPercent: number;
  realizedGainLoss: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  dailyGainLoss: number;
  dailyGainLossPercent: number;
  positionsCount: number;
  cashWeightPercent: number;
  stocksWeightPercent: number;
  bestPerformer?: { symbol: string; name: string; gainPercent: number };
  worstPerformer?: { symbol: string; name: string; gainPercent: number };
  sectorAllocation: { sector: string; value: number; percent: number; color: string }[];
}

const SECTOR_COLORS: Record<string, string> = {
  'Télécommunications': '#10b981', // emerald
  'Services Financiers / Banque': '#6366f1', // indigo
  'Agroalimentaire & Boissons': '#f59e0b', // amber
  'Énergie & Pétrole': '#ef4444', // rose
  'Distribution & Commerce': '#06b6d4', // cyan
  'Services Publics (Eau & Électricité)': '#8b5cf6', // purple
  'Agriculture': '#84cc16', // lime
  'Industrie': '#f97316', // orange
  'Transport & Logistique': '#14b8a6', // teal
  'Autre': '#64748b', // slate
};

/**
 * Creates default initial portfolio with 10M FCFA starting balance and 2 starter positions
 */
export function createDefaultVirtualPortfolio(userId: string = 'guest'): VirtualPortfolio {
  const now = new Date().toISOString();
  const initialCash = 10000000; // 10 000 000 FCFA

  // Starter positions: Sonatel (500 actions à 4 100 FCFA) & Orange CI (100 actions à 14 500 FCFA)
  const pos1Shares = 500;
  const pos1Price = 4100;
  const pos1Invested = pos1Shares * pos1Price; // 2 050 000
  const pos1Fee = Math.round(pos1Invested * 0.006); // 12 300

  const pos2Shares = 100;
  const pos2Price = 14500;
  const pos2Invested = pos2Shares * pos2Price; // 1 450 000
  const pos2Fee = Math.round(pos2Invested * 0.006); // 8 700

  const remainingCash = initialCash - (pos1Invested + pos1Fee) - (pos2Invested + pos2Fee);

  const initialPositions: VirtualPosition[] = [
    {
      id: 'pos-snts-init',
      symbol: 'SNTS',
      companyName: 'Sonatel Sénégal',
      sector: 'Télécommunications',
      shares: pos1Shares,
      averageBuyPrice: pos1Price,
      totalInvested: pos1Invested,
      totalFeesPaid: pos1Fee,
      firstBuyDate: new Date(Date.now() - 14 * 86400000).toISOString(),
      lastBuyDate: new Date(Date.now() - 14 * 86400000).toISOString(),
    },
    {
      id: 'pos-orac-init',
      symbol: 'ORAC',
      companyName: 'Orange Côte d\'Ivoire',
      sector: 'Télécommunications',
      shares: pos2Shares,
      averageBuyPrice: pos2Price,
      totalInvested: pos2Invested,
      totalFeesPaid: pos2Fee,
      firstBuyDate: new Date(Date.now() - 7 * 86400000).toISOString(),
      lastBuyDate: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
  ];

  const initialTransactions: VirtualTransaction[] = [
    {
      id: 'tx-orac-init',
      type: 'BUY',
      symbol: 'ORAC',
      companyName: 'Orange Côte d\'Ivoire',
      shares: pos2Shares,
      pricePerShare: pos2Price,
      grossAmount: pos2Invested,
      fee: pos2Fee,
      netAmount: pos2Invested + pos2Fee,
      timestamp: new Date(Date.now() - 7 * 86400000).toISOString(),
      notes: 'Ordre d\'achat d\'initiation - Orange CI',
    },
    {
      id: 'tx-snts-init',
      type: 'BUY',
      symbol: 'SNTS',
      companyName: 'Sonatel Sénégal',
      shares: pos1Shares,
      pricePerShare: pos1Price,
      grossAmount: pos1Invested,
      fee: pos1Fee,
      netAmount: pos1Invested + pos1Fee,
      timestamp: new Date(Date.now() - 14 * 86400000).toISOString(),
      notes: 'Ordre d\'achat d\'initiation - Sonatel post-split',
    },
  ];

  return {
    id: `port_${userId}`,
    userId,
    name: 'Mon Portefeuille Virtuel BRVM',
    initialCash,
    currentCash: remainingCash,
    positions: initialPositions,
    transactions: initialTransactions,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Loads virtual portfolio from localStorage with fallback to Firestore or default template
 */
export async function loadVirtualPortfolio(userId: string = 'guest'): Promise<VirtualPortfolio> {
  const storageKey = `${STORAGE_PREFIX}${userId}`;
  const localData = localStorage.getItem(storageKey);

  if (localData) {
    try {
      const parsed = JSON.parse(localData);
      if (parsed && parsed.positions && Array.isArray(parsed.positions)) {
        return parsed;
      }
    } catch (e) {
      console.warn('Erreur lecture portfolio local, fallback Firestore/Template:', e);
    }
  }

  // Try Firestore if userId is valid and not guest
  if (userId && userId !== 'guest') {
    try {
      const snap = await getDoc(doc(db, 'virtual_portfolios', userId));
      if (snap.exists()) {
        const firestoreData = snap.data() as VirtualPortfolio;
        localStorage.setItem(storageKey, JSON.stringify(firestoreData));
        return firestoreData;
      }
    } catch (err) {
      console.warn('Erreur chargement portfolio Firestore:', err);
    }
  }

  // Fallback to default portfolio
  const defaultPort = createDefaultVirtualPortfolio(userId);
  localStorage.setItem(storageKey, JSON.stringify(defaultPort));
  return defaultPort;
}

/**
 * Saves virtual portfolio to localStorage and Firestore
 */
export async function saveVirtualPortfolio(portfolio: VirtualPortfolio): Promise<void> {
  const updatedPortfolio = {
    ...portfolio,
    updatedAt: new Date().toISOString(),
  };

  const storageKey = `${STORAGE_PREFIX}${portfolio.userId}`;
  localStorage.setItem(storageKey, JSON.stringify(updatedPortfolio));

  if (portfolio.userId && portfolio.userId !== 'guest') {
    try {
      await setDoc(doc(db, 'virtual_portfolios', portfolio.userId), updatedPortfolio, { merge: true });
    } catch (err) {
      console.warn('Sauvegarde portfolio Firestore différée:', err);
    }
  }
}

/**
 * Computes all metrics and calculated positions for the portfolio using latest market prices
 */
export function calculatePortfolioKPIs(
  portfolio: VirtualPortfolio,
  companies: Company[] = DEMO_COMPANIES
): {
  calculatedPositions: VirtualPositionCalculated[];
  kpis: PortfolioKPIs;
} {
  const companiesMap = new Map<string, Company>();
  companies.forEach(c => companiesMap.set(c.symbol.toUpperCase(), c));

  let totalStockValue = 0;
  let totalInvested = 0;
  let dailyGainLoss = 0;

  // Calculate each position
  const calculatedPositions: VirtualPositionCalculated[] = portfolio.positions.map(pos => {
    const company = companiesMap.get(pos.symbol.toUpperCase());
    const currentPrice = company ? company.currentPrice : pos.averageBuyPrice;
    const previousClose = company ? company.previousClose : pos.averageBuyPrice;
    const dayChangePercent = company ? company.dayChangePercent : 0;

    const currentValue = pos.shares * currentPrice;
    const unrealizedGainLoss = currentValue - pos.totalInvested;
    const unrealizedGainLossPercent = pos.totalInvested > 0
      ? (unrealizedGainLoss / pos.totalInvested) * 100
      : 0;

    const previousValue = pos.shares * previousClose;
    const positionDailyGainLoss = currentValue - previousValue;

    totalStockValue += currentValue;
    totalInvested += pos.totalInvested;
    dailyGainLoss += positionDailyGainLoss;

    return {
      ...pos,
      currentPrice,
      previousClose,
      dayChangePercent,
      currentValue,
      unrealizedGainLoss,
      unrealizedGainLossPercent: Math.round(unrealizedGainLossPercent * 100) / 100,
      dailyGainLoss: positionDailyGainLoss,
      weightPercent: 0, // Will be computed in second pass
    };
  });

  const totalPortfolioValue = portfolio.currentCash + totalStockValue;

  // Second pass: compute weight
  calculatedPositions.forEach(p => {
    p.weightPercent = totalPortfolioValue > 0
      ? Math.round((p.currentValue / totalPortfolioValue) * 1000) / 10
      : 0;
  });

  // Sort positions by currentValue descending
  calculatedPositions.sort((a, b) => b.currentValue - a.currentValue);

  // Realized gain/loss from sell transactions
  const realizedGainLoss = portfolio.transactions
    .filter(tx => tx.type === 'SELL')
    .reduce((sum, tx) => sum + (tx.realizedGainLoss || 0), 0);

  const unrealizedGainLoss = totalStockValue - totalInvested;
  const unrealizedGainLossPercent = totalInvested > 0
    ? (unrealizedGainLoss / totalInvested) * 100
    : 0;

  const totalGainLoss = totalPortfolioValue - portfolio.initialCash;
  const totalGainLossPercent = portfolio.initialCash > 0
    ? (totalGainLoss / portfolio.initialCash) * 100
    : 0;

  const previousPortfolioTotal = totalPortfolioValue - dailyGainLoss;
  const dailyGainLossPercent = previousPortfolioTotal > 0
    ? (dailyGainLoss / previousPortfolioTotal) * 100
    : 0;

  const cashWeightPercent = totalPortfolioValue > 0
    ? Math.round((portfolio.currentCash / totalPortfolioValue) * 1000) / 10
    : 0;

  const stocksWeightPercent = totalPortfolioValue > 0
    ? Math.round((totalStockValue / totalPortfolioValue) * 1000) / 10
    : 0;

  // Best & worst performer
  let bestPerformer: { symbol: string; name: string; gainPercent: number } | undefined;
  let worstPerformer: { symbol: string; name: string; gainPercent: number } | undefined;

  if (calculatedPositions.length > 0) {
    const sortedByPerf = [...calculatedPositions].sort(
      (a, b) => b.unrealizedGainLossPercent - a.unrealizedGainLossPercent
    );
    bestPerformer = {
      symbol: sortedByPerf[0].symbol,
      name: sortedByPerf[0].companyName,
      gainPercent: sortedByPerf[0].unrealizedGainLossPercent,
    };
    worstPerformer = {
      symbol: sortedByPerf[sortedByPerf.length - 1].symbol,
      name: sortedByPerf[sortedByPerf.length - 1].companyName,
      gainPercent: sortedByPerf[sortedByPerf.length - 1].unrealizedGainLossPercent,
    };
  }

  // Sector allocation breakdown
  const sectorMap = new Map<string, number>();
  calculatedPositions.forEach(p => {
    const sector = p.sector || 'Autre';
    sectorMap.set(sector, (sectorMap.get(sector) || 0) + p.currentValue);
  });

  const sectorAllocation = Array.from(sectorMap.entries()).map(([sector, value]) => ({
    sector,
    value,
    percent: totalStockValue > 0 ? Math.round((value / totalStockValue) * 1000) / 10 : 0,
    color: SECTOR_COLORS[sector] || '#64748b',
  })).sort((a, b) => b.value - a.value);

  const kpis: PortfolioKPIs = {
    totalValue: Math.round(totalPortfolioValue),
    currentCash: Math.round(portfolio.currentCash),
    totalInvested: Math.round(totalInvested),
    unrealizedGainLoss: Math.round(unrealizedGainLoss),
    unrealizedGainLossPercent: Math.round(unrealizedGainLossPercent * 100) / 100,
    realizedGainLoss: Math.round(realizedGainLoss),
    totalGainLoss: Math.round(totalGainLoss),
    totalGainLossPercent: Math.round(totalGainLossPercent * 100) / 100,
    dailyGainLoss: Math.round(dailyGainLoss),
    dailyGainLossPercent: Math.round(dailyGainLossPercent * 100) / 100,
    positionsCount: calculatedPositions.length,
    cashWeightPercent,
    stocksWeightPercent,
    bestPerformer,
    worstPerformer,
    sectorAllocation,
  };

  return { calculatedPositions, kpis };
}

/**
 * Executes a simulated BUY order
 */
export function executeBuyOrder(
  portfolio: VirtualPortfolio,
  company: Company,
  shares: number,
  customPrice?: number,
  notes?: string
): VirtualPortfolio {
  if (shares <= 0) {
    throw new Error('Le nombre d\'actions doit être supérieur à zéro.');
  }

  const pricePerShare = customPrice || company.currentPrice;
  const grossAmount = shares * pricePerShare;
  // Standard BRVM / SGI brokerage fee: 0.6% (min 100 FCFA)
  const fee = Math.max(100, Math.round(grossAmount * 0.006));
  const totalCost = grossAmount + fee;

  if (totalCost > portfolio.currentCash) {
    throw new Error(
      `Liquidités insuffisantes : vous disposez de ${portfolio.currentCash.toLocaleString('fr-FR')} FCFA, mais l'ordre requiert ${totalCost.toLocaleString('fr-FR')} FCFA (titres + courtage).`
    );
  }

  const now = new Date().toISOString();
  const symbolUpper = company.symbol.toUpperCase();

  // Check if position already exists
  const existingPosIndex = portfolio.positions.findIndex(
    p => p.symbol.toUpperCase() === symbolUpper
  );

  let newPositions: VirtualPosition[];

  if (existingPosIndex >= 0) {
    const existing = portfolio.positions[existingPosIndex];
    const newShares = existing.shares + shares;
    const newTotalInvested = existing.totalInvested + grossAmount;
    const newPRU = Math.round(newTotalInvested / newShares);
    const newFees = existing.totalFeesPaid + fee;

    const updatedPos: VirtualPosition = {
      ...existing,
      shares: newShares,
      averageBuyPrice: newPRU,
      totalInvested: newTotalInvested,
      totalFeesPaid: newFees,
      lastBuyDate: now,
    };

    newPositions = [...portfolio.positions];
    newPositions[existingPosIndex] = updatedPos;
  } else {
    const newPos: VirtualPosition = {
      id: `pos-${symbolUpper.toLowerCase()}-${Date.now()}`,
      symbol: symbolUpper,
      companyName: company.name,
      sector: company.sector,
      shares,
      averageBuyPrice: pricePerShare,
      totalInvested: grossAmount,
      totalFeesPaid: fee,
      firstBuyDate: now,
      lastBuyDate: now,
    };
    newPositions = [newPos, ...portfolio.positions];
  }

  const newTransaction: VirtualTransaction = {
    id: `tx-buy-${Date.now()}`,
    type: 'BUY',
    symbol: symbolUpper,
    companyName: company.name,
    shares,
    pricePerShare,
    grossAmount,
    fee,
    netAmount: totalCost,
    timestamp: now,
    notes: notes || `Achat de ${shares} action(s) ${company.name} à ${pricePerShare.toLocaleString('fr-FR')} FCFA`,
  };

  return {
    ...portfolio,
    currentCash: portfolio.currentCash - totalCost,
    positions: newPositions,
    transactions: [newTransaction, ...portfolio.transactions],
    updatedAt: now,
  };
}

/**
 * Executes a simulated SELL order
 */
export function executeSellOrder(
  portfolio: VirtualPortfolio,
  symbol: string,
  sharesToSell: number,
  customPrice?: number,
  notes?: string,
  company?: Company
): VirtualPortfolio {
  if (sharesToSell <= 0) {
    throw new Error('Le nombre d\'actions à vendre doit être supérieur à zéro.');
  }

  const symbolUpper = symbol.toUpperCase();
  const existingPosIndex = portfolio.positions.findIndex(
    p => p.symbol.toUpperCase() === symbolUpper
  );

  if (existingPosIndex < 0) {
    throw new Error(`Aucune position trouvée pour le symbole ${symbol}.`);
  }

  const position = portfolio.positions[existingPosIndex];

  if (sharesToSell > position.shares) {
    throw new Error(
      `Quantité excessive : vous détenez ${position.shares} action(s) ${position.symbol}, vous ne pouvez pas en vendre ${sharesToSell}.`
    );
  }

  // Lookup market price if not provided
  const matchedComp = company || DEMO_COMPANIES.find(c => c.symbol.toUpperCase() === symbolUpper);
  const pricePerShare = customPrice || (matchedComp ? matchedComp.currentPrice : position.averageBuyPrice);

  const grossAmount = sharesToSell * pricePerShare;
  const fee = Math.max(100, Math.round(grossAmount * 0.006));
  const netProceeds = grossAmount - fee;

  // Realized gain/loss calculation
  const costBasis = sharesToSell * position.averageBuyPrice;
  const realizedGainLoss = netProceeds - costBasis;
  const realizedGainLossPercent = costBasis > 0 ? (realizedGainLoss / costBasis) * 100 : 0;

  const now = new Date().toISOString();
  let newPositions: VirtualPosition[];

  if (sharesToSell === position.shares) {
    // Sold entire position
    newPositions = portfolio.positions.filter((_, idx) => idx !== existingPosIndex);
  } else {
    // Partial sell
    const remainingShares = position.shares - sharesToSell;
    const remainingInvested = remainingShares * position.averageBuyPrice;

    const updatedPos: VirtualPosition = {
      ...position,
      shares: remainingShares,
      totalInvested: remainingInvested,
    };
    newPositions = [...portfolio.positions];
    newPositions[existingPosIndex] = updatedPos;
  }

  const newTransaction: VirtualTransaction = {
    id: `tx-sell-${Date.now()}`,
    type: 'SELL',
    symbol: symbolUpper,
    companyName: position.companyName,
    shares: sharesToSell,
    pricePerShare,
    grossAmount,
    fee,
    netAmount: netProceeds,
    realizedGainLoss: Math.round(realizedGainLoss),
    realizedGainLossPercent: Math.round(realizedGainLossPercent * 100) / 100,
    timestamp: now,
    notes: notes || `Vente de ${sharesToSell} action(s) ${position.companyName} à ${pricePerShare.toLocaleString('fr-FR')} FCFA`,
  };

  return {
    ...portfolio,
    currentCash: portfolio.currentCash + netProceeds,
    positions: newPositions,
    transactions: [newTransaction, ...portfolio.transactions],
    updatedAt: now,
  };
}

/**
 * Resets portfolio with fresh initial capital
 */
export function resetVirtualPortfolio(
  portfolio: VirtualPortfolio,
  newInitialCash: number = 10000000,
  newName?: string
): VirtualPortfolio {
  const now = new Date().toISOString();
  const resetTx: VirtualTransaction = {
    id: `tx-reset-${Date.now()}`,
    type: 'BUY',
    symbol: 'LIQUIDITES',
    companyName: 'Allocation Initiale',
    shares: 1,
    pricePerShare: newInitialCash,
    grossAmount: newInitialCash,
    fee: 0,
    netAmount: newInitialCash,
    timestamp: now,
    notes: `Réinitialisation du portefeuille avec un capital simulé de ${newInitialCash.toLocaleString('fr-FR')} FCFA`,
  };

  return {
    id: portfolio.id,
    userId: portfolio.userId,
    name: newName || portfolio.name,
    initialCash: newInitialCash,
    currentCash: newInitialCash,
    positions: [],
    transactions: [resetTx],
    createdAt: portfolio.createdAt || now,
    updatedAt: now,
  };
}

/**
 * Deletes a position from the portfolio and refunds the invested cash
 */
export function deletePositionFromPortfolio(
  portfolio: VirtualPortfolio,
  symbol: string
): VirtualPortfolio {
  const symbolUpper = symbol.toUpperCase();
  const existing = portfolio.positions.find(p => p.symbol.toUpperCase() === symbolUpper);
  if (!existing) return portfolio;

  const refundAmount = existing.totalInvested;
  const newPositions = portfolio.positions.filter(p => p.symbol.toUpperCase() !== symbolUpper);

  return {
    ...portfolio,
    currentCash: portfolio.currentCash + refundAmount,
    positions: newPositions,
    updatedAt: new Date().toISOString(),
  };
}

