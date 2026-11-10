import { Company, InvestorProfileType, InvestorProfileData } from '../../types';
import { DEMO_COMPANIES } from '../../data/demo-data';

export interface ProfileDefinition {
  id: InvestorProfileType;
  name: string;
  shortName: string;
  tagline: string;
  badgeBg: string;
  badgeBorder: string;
  textColor: string;
  accentBg: string;
  iconName: 'Shield' | 'Scale' | 'Zap';
  riskLevel: 'Faible' | 'Modéré' | 'Élevé';
  recommendedHorizon: string;
  targetExpectedReturn: string;
  description: string;
  idealFor: string;
  allocation: {
    category: string;
    percentage: number;
    color: string;
    description: string;
  }[];
  strategicAdvice: string[];
}

export interface PersonalizedStockSuggestion {
  company: Company;
  matchScore: number; // 0 - 100%
  highlightReason: string;
  profileFitReason: string;
  keyMetricLabel: string;
  keyMetricValue: string;
  suggestedWeightPercent: number;
  category: 'dividende' | 'croissance' | 'valeur' | 'stabilite';
}

export const PROFILE_DEFINITIONS: Record<InvestorProfileType, ProfileDefinition> = {
  prudent: {
    id: 'prudent',
    name: 'Investisseur Prudent / Conservateur',
    shortName: 'Prudent',
    tagline: 'Priorité absolue à la sécurité du capital et aux dividendes réguliers',
    badgeBg: 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300',
    badgeBorder: 'border-blue-300 dark:border-blue-700',
    textColor: 'text-blue-700 dark:text-blue-400',
    accentBg: 'bg-blue-50 dark:bg-blue-950/40',
    iconName: 'Shield',
    riskLevel: 'Faible',
    recommendedHorizon: 'Court à Moyen terme (1 à 3 ans+)',
    targetExpectedReturn: '7% à 10% par an (Dividendes + Coupons)',
    description:
      'Vous privilégiez la sérénité et la préservation de votre épargne. Vous visez des revenus passifs stables par des dividendes réguliers issus des piliers historiques de la BRVM et des emprunts obligataires garantis.',
    idealFor: 'Épargnants cherchant une alternative rentable aux livrets bancaires avec un risque de perte en capital très limité.',
    allocation: [
      {
        category: 'Obligations d’État & Emprunts Garantis',
        percentage: 45,
        color: 'bg-blue-600',
        description: 'Coupons garantis à taux fixe (6% - 7,5% nets d’impôt) sans volatilité sur cours.',
      },
      {
        category: 'Actions Leaders "Bon Père de Famille"',
        percentage: 45,
        color: 'bg-emerald-600',
        description: 'Entreprises incontournables distribuant de gros dividendes depuis plus de 10 ans (Sonatel, Solibra, Onatel).',
      },
      {
        category: 'Trésorerie & Cash de Réserve',
        percentage: 10,
        color: 'bg-amber-500',
        description: 'Liquidités sur compte SGI pour saisir des opportunités ponctuelles.',
      },
    ],
    strategicAdvice: [
      'Privilégiez les sociétés affichant un historique ininterrompu de dividendes sur au moins 5 ans.',
      'Ne vendez pas vos actions lors des baisses passagères du marché si les dividendes restent solides.',
      'Complétez votre portefeuille d’actions avec des emprunts obligataires du Trésor Public (TPCI, TPBF).',
    ],
  },
  equilibre: {
    id: 'equilibre',
    name: 'Investisseur Équilibré',
    shortName: 'Équilibré',
    tagline: 'Compromis idéal entre flux de dividendes et appréciation du capital',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300',
    badgeBorder: 'border-emerald-300 dark:border-emerald-700',
    textColor: 'text-emerald-700 dark:text-emerald-400',
    accentBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    iconName: 'Scale',
    riskLevel: 'Modéré',
    recommendedHorizon: 'Moyen à Long terme (3 à 5 ans+)',
    targetExpectedReturn: '11% à 15% par an (Plus-values + Dividendes réinvestis)',
    description:
      'Vous acceptez des variations modérées des cours à court terme pour bénéficier d’une croissance attractive de votre patrimoine sur le moyen-long terme, tout en encaissant de solides dividendes réinvestissables.',
    idealFor: 'Investisseurs visant l’indépendance financière avec un portefeuille diversifié entre valeurs de rendement et de croissance.',
    allocation: [
      {
        category: 'Actions à Fort Dividende & Résilientes',
        percentage: 50,
        color: 'bg-emerald-600',
        description: 'Socle de rendement régulier (Sonatel, Solibra) pour amortir la volatilité.',
      },
      {
        category: 'Actions Bancaires & Croissance Régionale',
        percentage: 35,
        color: 'bg-indigo-600',
        description: 'Groupes bancaires et industriels en forte expansion (SGBCI, Coris Bank, Sicable).',
      },
      {
        category: 'Obligations & Bons du Trésor',
        percentage: 15,
        color: 'bg-blue-600',
        description: 'Matelas de sécurité et stabilité globale du portefeuille.',
      },
    ],
    strategicAdvice: [
      'Appliquez la stratégie du DCA (Dollar Cost Averaging) : investissez un montant fixe chaque mois.',
      'Réinvestissez systématiquement vos dividendes annuels pour actionner la puissance des intérêts composés.',
      'Diversifiez vos positions sur au moins 4 secteurs économiques différents (Banque, Télécom, Industrie, Agroalimentaire).',
    ],
  },
  dynamique: {
    id: 'dynamique',
    name: 'Investisseur Dynamique / Offensif',
    shortName: 'Dynamique',
    tagline: 'Maximisation des plus-values et recherche d’une forte expansion du capital',
    badgeBg: 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300',
    badgeBorder: 'border-purple-300 dark:border-purple-700',
    textColor: 'text-purple-700 dark:text-purple-400',
    accentBg: 'bg-purple-50 dark:bg-purple-950/40',
    iconName: 'Zap',
    riskLevel: 'Élevé',
    recommendedHorizon: 'Long terme (5 ans et plus)',
    targetExpectedReturn: '16% à 25%+ par an',
    description:
      'Vous disposez d’un horizon de placement lointain et d’une forte tolérance au risque. Vous cherchez à capter le dynamisme économique de la zone UEMOA en ciblant les actions sous-évaluées, cycliques et en forte croissance.',
    idealFor: 'Investisseurs aguerris ou jeunes actifs préparant leur capital à long terme avec un profil axé sur la valorisation boursière.',
    allocation: [
      {
        category: 'Actions de Forte Croissance & Banques',
        percentage: 65,
        color: 'bg-purple-600',
        description: 'Sociétés à fort potentiel de hausse des cours et expansion régionale (SGBCI, ETIT, BOA).',
      },
      {
        category: 'Actions Décotées / Opportunités Value',
        percentage: 20,
        color: 'bg-amber-500',
        description: 'Titres à faible PER avec un fort levier de revalorisation par le marché.',
      },
      {
        category: 'Actions à Haut Rendement (Dividendes réinvestis)',
        percentage: 15,
        color: 'bg-emerald-600',
        description: 'Cash-flow réinjecté immédiatement dans les meilleures opportunités.',
      },
    ],
    strategicAdvice: [
      'Exploitez les baisses de marché pour renforcer massivement vos positions sur les champions régionaux.',
      'Surveillez les ratios fondamentaux clés : PER inférieur à la moyenne du secteur et ROE supérieur à 18%.',
      'Conservez vos titres sur plusieurs années pour laisser le temps aux entreprises de décupler leurs bénéfices.',
    ],
  },
};

/**
 * Generates tailored BRVM stock suggestions for a given investor profile type.
 */
export function getPersonalizedStockSuggestions(
  profileType: InvestorProfileType,
  companies: Company[] = DEMO_COMPANIES
): PersonalizedStockSuggestion[] {
  const companyMap = new Map<string, Company>();
  companies.forEach(c => companyMap.set(c.symbol, c));

  const getCompany = (symbol: string): Company => {
    return (
      companyMap.get(symbol) ||
      DEMO_COMPANIES.find(c => c.symbol === symbol) || {
        id: `c-${symbol.toLowerCase()}`,
        symbol,
        name: symbol,
        sector: 'Services Financiers',
        country: 'UEMOA',
        market: 'BRVM',
        description: 'Société cotée à la BRVM',
        currentPrice: 15000,
        previousClose: 15000,
        dayChangePercent: 0,
        freshness: 'delayed',
        lastUpdated: new Date().toISOString(),
        source: 'BRVM',
        isDemo: false,
        dividendYield: 6.5,
        per: 9.5,
        roe: 18.0,
        lifecycle: 'MATURITE',
        status: 'VERIFIED',
      }
    );
  };

  switch (profileType) {
    case 'prudent':
      return [
        {
          company: getCompany('SNTS'),
          matchScore: 98,
          highlightReason: 'Leader incontournable de la cote BRVM avec un dividende annuel garanti et un flux de trésorerie massif.',
          profileFitReason: 'Préservation maximale du capital, volatilité très faible et distribution de dividendes ininterrompue depuis plus de 25 ans.',
          keyMetricLabel: 'Rendement Dividende',
          keyMetricValue: `${getCompany('SNTS').dividendYield || 4.92}% net`,
          suggestedWeightPercent: 40,
          category: 'stabilite',
        },
        {
          company: getCompany('SLBC'),
          matchScore: 95,
          highlightReason: 'Rendement exceptionnel de plus de 10% par an sur le secteur défensif des boissons.',
          profileFitReason: 'Idéal pour générer des revenus passifs élevés et récurrents sans dépendre de la hausse du cours.',
          keyMetricLabel: 'Rendement Dividende',
          keyMetricValue: `${getCompany('SLBC').dividendYield || 10.94}%`,
          suggestedWeightPercent: 30,
          category: 'dividende',
        },
        {
          company: getCompany('ONTBF'),
          matchScore: 91,
          highlightReason: 'Monopole de télécommunication rentable avec une politique de distribution généreuse (>80% des bénéfices).',
          profileFitReason: 'Titres résilients face aux crises économiques grâce aux besoins essentiels en data et télécoms.',
          keyMetricLabel: 'Distribution de Cash',
          keyMetricValue: `${getCompany('ONTBF').dividendYield || 8.5}%`,
          suggestedWeightPercent: 20,
          category: 'dividende',
        },
        {
          company: getCompany('CBIBF'),
          matchScore: 88,
          highlightReason: 'Banque modèle de solidité financière avec une gouvernance rigoureuse et un portefeuille de crédit sain.',
          profileFitReason: 'Stabilité remarquable du cours et progression constante des dividendes versés.',
          keyMetricLabel: 'Rentabilité ROE',
          keyMetricValue: `${getCompany('CBIBF').roe || 22.1}%`,
          suggestedWeightPercent: 10,
          category: 'stabilite',
        },
      ];

    case 'equilibre':
      return [
        {
          company: getCompany('SGBC'),
          matchScore: 97,
          highlightReason: 'Première banque privée de Côte d’Ivoire, alliant croissance soutenue du PNB et dividendes réguliers.',
          profileFitReason: 'Le pilier par excellence d’un portefeuille équilibré : croissance pérenne + rendement annuel attrayant.',
          keyMetricLabel: 'PER / Rendement',
          keyMetricValue: `${getCompany('SGBC').per || 6.7}x • ${getCompany('SGBC').dividendYield || 7.2}%`,
          suggestedWeightPercent: 35,
          category: 'croissance',
        },
        {
          company: getCompany('SNTS'),
          matchScore: 94,
          highlightReason: 'Moteur de résilience régionale avec une expansion rapide dans les services financiers mobiles (Orange Money).',
          profileFitReason: 'Apporte l’ancrage défensif et la régularité des liquidités nécessaires pour réinvestir sereinement.',
          keyMetricLabel: 'Rendement Dividende',
          keyMetricValue: `${getCompany('SNTS').dividendYield || 4.92}%`,
          suggestedWeightPercent: 30,
          category: 'stabilite',
        },
        {
          company: getCompany('CBIBF'),
          matchScore: 92,
          highlightReason: 'Groupe bancaire panafricain en forte dynamique dans l’UEMOA avec un bénéfice net en constante progression.',
          profileFitReason: 'Parfaite combinaison de dividende régulier et d’appréciation du cours boursier à moyen terme.',
          keyMetricLabel: 'ROE Exceptionnel',
          keyMetricValue: `${getCompany('CBIBF').roe || 22.4}%`,
          suggestedWeightPercent: 20,
          category: 'croissance',
        },
        {
          company: getCompany('SICC'),
          matchScore: 87,
          highlightReason: 'Fournisseur clé des infrastructures électriques de la sous-région, profitant du boom de l’urbanisation.',
          profileFitReason: 'Diversification industrielle avec un excellent levier sur le développement énergétique régional.',
          keyMetricLabel: 'Ratio PBR',
          keyMetricValue: `${getCompany('SICC').pbr || 1.8}x`,
          suggestedWeightPercent: 15,
          category: 'valeur',
        },
      ];

    case 'dynamique':
      return [
        {
          company: getCompany('ETIT'),
          matchScore: 98,
          highlightReason: 'Plus fort volume de transactions de la BRVM avec une implantation dans plus de 33 pays d’Afrique.',
          profileFitReason: 'Action à fort effet de levier et fort potentiel de plus-value lors des phases de reprise de marché.',
          keyMetricLabel: 'Volume & Liquidité',
          keyMetricValue: 'Top 1 BRVM • Cours accessible',
          suggestedWeightPercent: 35,
          category: 'croissance',
        },
        {
          company: getCompany('SGBC'),
          matchScore: 95,
          highlightReason: 'Champion bancaire ivoirien avec une rentabilité record (ROE > 20%) et un PER très attractif (< 7x).',
          profileFitReason: 'Permet de surperformer l’indice BRVM Composite grâce à des résultats financiers records.',
          keyMetricLabel: 'PER de Décote',
          keyMetricValue: `${getCompany('SGBC').per || 6.7}x (Sous-évalué)`,
          suggestedWeightPercent: 30,
          category: 'valeur',
        },
        {
          company: getCompany('BOAB'),
          matchScore: 91,
          highlightReason: 'Filiale la plus rentable du groupe Bank Of Africa avec une dynamique de crédit et de marge d’intermédiation agressive.',
          profileFitReason: 'Croissance à deux chiffres des bénéfices et forte capacité de redistribution aux actionnaires.',
          keyMetricLabel: 'Rentabilité Capitaux',
          keyMetricValue: `${getCompany('BOAB').roe || 24.8}% ROE`,
          suggestedWeightPercent: 20,
          category: 'croissance',
        },
        {
          company: getCompany('SLBC'),
          matchScore: 86,
          highlightReason: 'Rendement en cash-flow géant pour réinjecter immédiatement des capitaux frais dans les actions en hausse.',
          profileFitReason: 'Génération de cash tactique pour financer les opportunités spéculatives et de swing trading.',
          keyMetricLabel: 'Rendement Cash',
          keyMetricValue: `${getCompany('SLBC').dividendYield || 10.94}%`,
          suggestedWeightPercent: 15,
          category: 'dividende',
        },
      ];
  }
}

/**
 * Calculates simulated budget split for the suggested stocks based on a monthly budget.
 */
export function calculateBudgetPortfolio(
  monthlyBudget: number,
  suggestions: PersonalizedStockSuggestion[]
) {
  let totalAllocated = 0;
  const items = suggestions.map(sug => {
    const targetAmount = (monthlyBudget * sug.suggestedWeightPercent) / 100;
    const price = sug.company.currentPrice || 1000;
    const shareCount = Math.max(1, Math.floor(targetAmount / price));
    const actualCost = shareCount * price;
    totalAllocated += actualCost;

    const estimatedAnnualDividend = (sug.company.lastDividend || 0) * shareCount;

    return {
      symbol: sug.company.symbol,
      name: sug.company.name,
      price,
      shareCount,
      targetPercent: sug.suggestedWeightPercent,
      actualCost,
      estimatedAnnualDividend,
    };
  });

  const remainingCash = Math.max(0, monthlyBudget - totalAllocated);
  const totalAnnualDividends = items.reduce((acc, curr) => acc + curr.estimatedAnnualDividend, 0);

  return {
    monthlyBudget,
    totalAllocated,
    remainingCash,
    totalAnnualDividends,
    estimatedYieldPercent: monthlyBudget > 0 ? (totalAnnualDividends / totalAllocated) * 100 : 0,
    items,
  };
}
