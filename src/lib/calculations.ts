import { DividendMode, SimulationOperation, SimulationResult } from '../types';

export interface PERCalculationResult {
  per: number | null;
  status: 'VALID' | 'NEGATIVE_EPS' | 'ZERO_EPS' | 'MISSING_DATA';
  explanation: string;
}

/**
 * Calculates Price-Earning Ratio (PER / P/E).
 * Rule: Calculate PER ONLY if EPS (BPA) is strictly positive (> 0).
 */
export function calculatePER(currentPrice: number, eps: number | undefined | null): PERCalculationResult {
  if (eps === undefined || eps === null || isNaN(eps)) {
    return {
      per: null,
      status: 'MISSING_DATA',
      explanation: 'Le PER ne peut pas être calculé car le Bénéfice Par Action (BPA) n’est pas disponible.',
    };
  }

  if (eps === 0) {
    return {
      per: null,
      status: 'ZERO_EPS',
      explanation: 'Le PER ne peut pas être calculé car l’entreprise a réalisé un bénéfice par action nul.',
    };
  }

  if (eps < 0) {
    return {
      per: null,
      status: 'NEGATIVE_EPS',
      explanation: `BPA négatif (${eps} FCFA). L’entreprise affiche une perte nette sur la période. Le PER n’est pas défini pour des résultats négatifs.`,
    };
  }

  const per = currentPrice / eps;
  return {
    per: Number(per.toFixed(2)),
    status: 'VALID',
    explanation: `À un cours de ${currentPrice} FCFA et un BPA de ${eps} FCFA, le PER est de ${per.toFixed(2)}. Cela signifie que l’action se paie ${per.toFixed(1)} fois ses bénéfices annuels.`,
  };
}

export interface ROECalculationResult {
  roe: number | null;
  status: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'NEGATIVE' | 'MISSING_DATA';
  explanation: string;
}

/**
 * Calculates / evaluates Return on Equity (ROE - Rentabilité des Capitaux Propres)
 */
export function calculateROE(roeValue?: number | null, netIncome?: number, equity?: number): ROECalculationResult {
  let roe: number | null = null;

  if (roeValue !== undefined && roeValue !== null && !isNaN(roeValue)) {
    roe = roeValue;
  } else if (netIncome !== undefined && equity !== undefined && equity > 0) {
    roe = Number(((netIncome / equity) * 100).toFixed(2));
  }

  if (roe === null) {
    return {
      roe: null,
      status: 'MISSING_DATA',
      explanation: 'Le ROE ne peut pas être évalué car les capitaux propres ou le bénéfice net ne sont pas renseignés.',
    };
  }

  if (roe < 0) {
    return {
      roe,
      status: 'NEGATIVE',
      explanation: `ROE négatif (${roe}%). L’entreprise détruit de la valeur nette sur la période en enregistrant des pertes.`,
    };
  }

  if (roe >= 20) {
    return {
      roe,
      status: 'EXCELLENT',
      explanation: `Un ROE exceptionnel de ${roe}% indique que l’entreprise génère un très fort rendement sur chaque FCFA de fonds propres apporté par ses actionnaires (supérieur à la moyenne du marché de 15%).`,
    };
  }

  if (roe >= 12) {
    return {
      roe,
      status: 'GOOD',
      explanation: `Un ROE solide de ${roe}% témoigne d'une bonne efficacité de gestion et d'une rentabilité financière satisfaisante.`,
    };
  }

  return {
    roe,
    status: 'MODERATE',
    explanation: `Un ROE de ${roe}% est modéré. Il convient de vérifier si le secteur présente des marges plus faibles ou si l'endettement est conservateur.`,
  };
}

export interface PBRCalculationResult {
  pbr: number | null;
  status: 'BELOW_BOOK_VALUE' | 'FAIR_VALUED' | 'HIGH_PREMIUM' | 'MISSING_DATA';
  explanation: string;
}

/**
 * Calculates Price-to-Book Ratio (PBR / Ratio Cours sur Valeur Comptable)
 */
export function calculatePBR(
  currentPrice: number,
  bookValuePerShare?: number | null,
  pbrOverride?: number | null
): PBRCalculationResult {
  let pbr: number | null = null;

  if (pbrOverride !== undefined && pbrOverride !== null && !isNaN(pbrOverride)) {
    pbr = pbrOverride;
  } else if (bookValuePerShare && bookValuePerShare > 0 && currentPrice > 0) {
    pbr = Number((currentPrice / bookValuePerShare).toFixed(2));
  }

  if (pbr === null) {
    return {
      pbr: null,
      status: 'MISSING_DATA',
      explanation: 'Le PBR ne peut pas être calculé car la valeur comptable par action (Actif Net Tangible) n’est pas disponible.',
    };
  }

  if (pbr < 1.0) {
    return {
      pbr,
      status: 'BELOW_BOOK_VALUE',
      explanation: `Un PBR de ${pbr}x (< 1.0) indique que l'action se traite en-dessous de la valeur brute de ses fonds propres comptables (décote d'actif net). Cela peut signaler une belle opportunité de sous-évaluation.`,
    };
  }

  if (pbr <= 2.5) {
    return {
      pbr,
      status: 'FAIR_VALUED',
      explanation: `Un PBR de ${pbr}x reflète une valorisation équilibrée par rapport à l'actif net comptable de la société.`,
    };
  }

  return {
    pbr,
    status: 'HIGH_PREMIUM',
    explanation: `Un PBR élevé de ${pbr}x signifie que le marché paie une forte prime sur l'actif comptable, anticipant une croissance future soutenue ou une rentabilité exceptionnelle (ROE élevé).`,
  };
}

/**
 * Calculate Dividend Yield in %
 */
export function calculateDividendYield(currentPrice: number, lastDividend: number | undefined | null): number | null {
  if (!lastDividend || lastDividend <= 0 || !currentPrice || currentPrice <= 0) {
    return null;
  }
  return Number(((lastDividend / currentPrice) * 100).toFixed(2));
}

/**
 * Quick Simulation calculation engine
 */
export function runQuickSimulation(params: {
  symbol: string;
  companyName: string;
  initialAmount: number; // in FCFA
  initialPrice: number; // in FCFA
  finalPrice: number; // in FCFA
  startDate: string;
  endDate: string;
  dividendMode: DividendMode;
  dividendsPerShareInPeriod: number; // Total dividend per share during period
}): SimulationResult {
  const {
    symbol,
    companyName,
    initialAmount,
    initialPrice,
    finalPrice,
    startDate,
    endDate,
    dividendMode,
    dividendsPerShareInPeriod,
  } = params;

  if (initialPrice <= 0 || initialAmount <= 0) {
    throw new Error('Le montant initial et le prix d’achat doivent être strictement positifs.');
  }

  let sharesBought = Math.floor(initialAmount / initialPrice);
  const remainingCash = initialAmount - sharesBought * initialPrice;

  const rawDividendsReceived = sharesBought * dividendsPerShareInPeriod;
  let reinvestedShares = 0;
  let extraCashFromDividends = rawDividendsReceived;

  const operations: SimulationOperation[] = [
    {
      id: `op-buy-${Date.now()}`,
      type: 'BUY',
      date: startDate,
      quantity: sharesBought,
      price: initialPrice,
      fees: 0,
      notes: `Achat initial de ${sharesBought} titres au cours de ${initialPrice} FCFA (Reste cash: ${remainingCash} FCFA)`,
    },
  ];

  if (dividendsPerShareInPeriod > 0) {
    operations.push({
      id: `op-div-${Date.now()}`,
      type: 'DIVIDEND_PAYMENT',
      date: endDate,
      quantity: sharesBought,
      price: dividendsPerShareInPeriod,
      fees: 0,
      notes: `Dividendes encaissés: ${rawDividendsReceived} FCFA (${dividendsPerShareInPeriod} FCFA / action)`,
    });

    if (dividendMode === 'REINVEST') {
      reinvestedShares = Math.floor((rawDividendsReceived + remainingCash) / finalPrice);
      extraCashFromDividends = (rawDividendsReceived + remainingCash) - (reinvestedShares * finalPrice);
      if (reinvestedShares > 0) {
        operations.push({
          id: `op-reinvest-${Date.now()}`,
          type: 'DIVIDEND_REINVEST',
          date: endDate,
          quantity: reinvestedShares,
          price: finalPrice,
          fees: 0,
          notes: `Réinvestissement des dividendes: achat de ${reinvestedShares} titre(s) supplémentaires au cours de ${finalPrice} FCFA`,
        });
      }
    }
  }

  const totalSharesFinal = sharesBought + reinvestedShares;
  const portfolioValueAtEnd = totalSharesFinal * finalPrice;
  let finalValue = portfolioValueAtEnd;

  if (dividendMode === 'KEEP') {
    finalValue += rawDividendsReceived + remainingCash;
  } else if (dividendMode === 'REINVEST') {
    finalValue += extraCashFromDividends;
  } else {
    finalValue += remainingCash;
  }

  const netGainOrLoss = finalValue - initialAmount;
  const performancePercent = Number(((netGainOrLoss / initialAmount) * 100).toFixed(2));

  const hypotheses = [
    `Données basées sur les cours historiques DEMO du ${startDate} au ${endDate}.`,
    `Prix d'achat initial: ${initialPrice} FCFA le ${startDate}.`,
    `Prix final du titre: ${finalPrice} FCFA le ${endDate}.`,
    dividendMode === 'REINVEST'
      ? `Les dividendes (${rawDividendsReceived} FCFA) ont été réinvestis à la fin de la période au prix du marché.`
      : dividendMode === 'KEEP'
      ? `Les dividendes encaissées (${rawDividendsReceived} FCFA) sont conservés en trésorerie.`
      : `Les dividendes n'ont pas été pris en compte dans ce scénario.`,
    `Hors frais de courtage et hors fiscalité (à titre strictement pédagogique).`,
  ];

  return {
    id: `sim-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: `Simulation ${symbol} (${dividendMode})`,
    companySymbol: symbol,
    companyName,
    startDate,
    endDate,
    initialAmount,
    dividendMode,
    initialPrice,
    finalPrice,
    sharesBought: totalSharesFinal,
    totalDividendsReceived: rawDividendsReceived,
    finalValue: Math.round(finalValue),
    netGainOrLoss: Math.round(netGainOrLoss),
    performancePercent,
    operations,
    createdAt: new Date().toISOString(),
    hypotheses,
  };
}
