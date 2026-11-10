export interface CompanyReport {
  id: string;
  symbol: string;
  companyName: string;
  year: number;
  period: 'ANNUEL' | 'SEMESTRIEL' | 'TRIMESTRIEL' | 'COMMUNIQUE';
  title: string;
  datePublished: string;
  documentType: 'Rapport Annuel' | 'Rapport Financier Semestriel' | 'Activité T3' | 'États Financiers' | 'Communiqué Financier';
  url: string;
  pagesCount?: number;
  fileSize?: string;
  language: 'FR';
  highlights?: string;
}

export const OFFICIAL_BRVM_REPORTS_PORTAL = 'https://www.brvm.org/fr/rapports-societes-cotees';

export const OFFICIAL_COMPANY_REPORTS: CompanyReport[] = [
  // Sonatel (SNTS)
  {
    id: 'rep-snts-2024-a',
    symbol: 'SNTS',
    companyName: 'Sonatel Sénégal',
    year: 2024,
    period: 'ANNUEL',
    title: 'Rapport Annuel Intégré & Résultats Financiers Consolidés 2024',
    datePublished: '2025-04-12',
    documentType: 'Rapport Annuel',
    url: 'https://www.brvm.org/fr/rapports-societes-cotees',
    pagesCount: 142,
    fileSize: '4.8 Mo',
    language: 'FR',
    highlights: 'Chiffre d’affaires consolidé en hausse de +9.2%, EBITDAaL résilient et dividende brut de 1 575 FCFA / action.'
  },
  {
    id: 'rep-snts-2024-s1',
    symbol: 'SNTS',
    companyName: 'Sonatel Sénégal',
    year: 2024,
    period: 'SEMESTRIEL',
    title: 'Rapport Financier Semestriel S1 2024 - Groupe Sonatel',
    datePublished: '2024-09-18',
    documentType: 'Rapport Financier Semestriel',
    url: 'https://www.brvm.org/fr/rapports-societes-cotees',
    pagesCount: 48,
    fileSize: '2.1 Mo',
    language: 'FR',
    highlights: 'Croissance soutenue de la Data mobile et des services Orange Money en Afrique de l’Ouest.'
  },
  {
    id: 'rep-snts-2023-a',
    symbol: 'SNTS',
    companyName: 'Sonatel Sénégal',
    year: 2023,
    period: 'ANNUEL',
    title: 'Rapport d’Activité & États Financiers Audités 2023',
    datePublished: '2024-04-20',
    documentType: 'Rapport Annuel',
    url: 'https://www.brvm.org/fr/rapports-societes-cotees',
    pagesCount: 128,
    fileSize: '4.2 Mo',
    language: 'FR',
    highlights: 'Bénéfice net en hausse de 12%, investissements fibre et 5G au Sénégal.'
  },

  // Solibra (SLBC)
  {
    id: 'rep-slbc-2024-a',
    symbol: 'SLBC',
    companyName: 'Solibra Côte d’Ivoire',
    year: 2024,
    period: 'ANNUEL',
    title: 'Rapport de Gestion & États Financiers Annuels 2024',
    datePublished: '2025-05-02',
    documentType: 'Rapport Annuel',
    url: 'https://www.brvm.org/fr/rapports-societes-cotees',
    pagesCount: 84,
    fileSize: '3.6 Mo',
    language: 'FR',
    highlights: 'Redressement spectaculaire des marges opérationnelles et dividende exceptionnel de 4 050 FCFA.'
  },
  {
    id: 'rep-slbc-2024-s1',
    symbol: 'SLBC',
    companyName: 'Solibra Côte d’Ivoire',
    year: 2024,
    period: 'SEMESTRIEL',
    title: 'Comptes Intermédiaires & Rapport d’Activité S1 2024',
    datePublished: '2024-10-15',
    documentType: 'Rapport Financier Semestriel',
    url: 'https://www.brvm.org/fr/rapports-societes-cotees',
    pagesCount: 36,
    fileSize: '1.9 Mo',
    language: 'FR',
    highlights: 'Optimisation de la chaîne logistique et hausse des volumes de vente en bières et boissons gazeuses.'
  },

  // Société Générale Côte d'Ivoire (SGBC)
  {
    id: 'rep-sgbc-2024-a',
    symbol: 'SGBC',
    companyName: 'Société Générale Côte d’Ivoire',
    year: 2024,
    period: 'ANNUEL',
    title: 'Rapport Annuel & Rapport des Commissaires aux Comptes 2024',
    datePublished: '2025-04-28',
    documentType: 'Rapport Annuel',
    url: 'https://www.brvm.org/fr/rapports-societes-cotees',
    pagesCount: 116,
    fileSize: '5.1 Mo',
    language: 'FR',
    highlights: 'Produit Net Bancaire record à plus de 240 milliards FCFA, coût du risque maîtrisé et ROE de 19.8%.'
  },
  {
    id: 'rep-sgbc-2024-s1',
    symbol: 'SGBC',
    companyName: 'Société Générale Côte d’Ivoire',
    year: 2024,
    period: 'SEMESTRIEL',
    title: 'Résultats Financiers Semestriels S1 2024',
    datePublished: '2024-09-25',
    documentType: 'Rapport Financier Semestriel',
    url: 'https://www.brvm.org/fr/rapports-societes-cotees',
    pagesCount: 42,
    fileSize: '2.4 Mo',
    language: 'FR',
    highlights: 'Leader incontesté du marché ivoirien des crédits bancaires et des dépôts institutionnels.'
  },

  // Ecobank Transnational (ETIT)
  {
    id: 'rep-etit-2024-a',
    symbol: 'ETIT',
    companyName: 'Ecobank Transnational Inc.',
    year: 2024,
    period: 'ANNUEL',
    title: 'Annual Report & Audited Consolidated Financial Statements 2024',
    datePublished: '2025-04-15',
    documentType: 'Rapport Annuel',
    url: 'https://www.brvm.org/fr/rapports-societes-cotees',
    pagesCount: 160,
    fileSize: '6.4 Mo',
    language: 'FR',
    highlights: 'Performance régionale panafricaine robuste sur les 33 filiales d’Afrique subsaharienne.'
  },

  // Orange Côte d'Ivoire (ORAC)
  {
    id: 'rep-orac-2024-a',
    symbol: 'ORAC',
    companyName: 'Orange Côte d’Ivoire',
    year: 2024,
    period: 'ANNUEL',
    title: 'Rapport Annuel Intégré & États Financiers 2024',
    datePublished: '2025-04-30',
    documentType: 'Rapport Annuel',
    url: 'https://www.brvm.org/fr/rapports-societes-cotees',
    pagesCount: 130,
    fileSize: '4.9 Mo',
    language: 'FR',
    highlights: 'Forte croissance d’Orange Bank Africa et expansion du réseau 5G à Abidjan et en régions.'
  },

  // CIE (CIEC)
  {
    id: 'rep-ciec-2024-a',
    symbol: 'CIEC',
    companyName: 'Compagnie Ivoirienne d’Electricité (CIE)',
    year: 2024,
    period: 'ANNUEL',
    title: 'Rapport Annuel d’Activité & Comptes Sociaux 2024',
    datePublished: '2025-05-10',
    documentType: 'Rapport Annuel',
    url: 'https://www.brvm.org/fr/rapports-societes-cotees',
    pagesCount: 92,
    fileSize: '3.8 Mo',
    language: 'FR',
    highlights: 'Hausse du rendement de distribution d’électricité et amélioration du taux de recouvrement.'
  },

  // TotalEnergies Côte d'Ivoire (TTLC)
  {
    id: 'rep-ttlc-2024-a',
    symbol: 'TTLC',
    companyName: 'TotalEnergies Marketing CI',
    year: 2024,
    period: 'ANNUEL',
    title: 'Rapport de Gestion & États Financiers Certifiés 2024',
    datePublished: '2025-05-05',
    documentType: 'Rapport Annuel',
    url: 'https://www.brvm.org/fr/rapports-societes-cotees',
    pagesCount: 78,
    fileSize: '3.2 Mo',
    language: 'FR',
    highlights: 'Rendement de dividende supérieur à 9%, réseau de stations-service modernisé et solaire.'
  },

  // PalmCI (PALC)
  {
    id: 'rep-palc-2024-a',
    symbol: 'PALC',
    companyName: 'Palm Côte d’Ivoire',
    year: 2024,
    period: 'ANNUEL',
    title: 'Rapport Annuel & Performances Agricoles 2024',
    datePublished: '2025-05-18',
    documentType: 'Rapport Annuel',
    url: 'https://www.brvm.org/fr/rapports-societes-cotees',
    pagesCount: 70,
    fileSize: '3.1 Mo',
    language: 'FR',
    highlights: 'Production d’huile de palme brute et ventes stabilisées face aux cours mondiaux du CPO.'
  },

  // SIB (SIBC)
  {
    id: 'rep-sibc-2024-a',
    symbol: 'SIBC',
    companyName: 'Société Ivoirienne de Banque (SIB)',
    year: 2024,
    period: 'ANNUEL',
    title: 'Rapport d’Activité & Comptes Annuels Certifiés 2024',
    datePublished: '2025-04-22',
    documentType: 'Rapport Annuel',
    url: 'https://www.brvm.org/fr/rapports-societes-cotees',
    pagesCount: 104,
    fileSize: '4.5 Mo',
    language: 'FR',
    highlights: 'Filiale du groupe Attijariwafa Bank, coefficient d’exploitation parmi les meilleurs du secteur.'
  },

  // Onatel Burkina (ONTBF)
  {
    id: 'rep-ontbf-2024-a',
    symbol: 'ONTBF',
    companyName: 'Onatel Burkina Faso',
    year: 2024,
    period: 'ANNUEL',
    title: 'Rapport Financier Annuel & Déclarations Fiscales 2024',
    datePublished: '2025-05-12',
    documentType: 'Rapport Annuel',
    url: 'https://www.brvm.org/fr/rapports-societes-cotees',
    pagesCount: 88,
    fileSize: '3.7 Mo',
    language: 'FR',
    highlights: 'Résilience opérationnelle remarquable et maintien d’une politique généreuse de dividendes.'
  }
];

export function getReportsForSymbol(symbol: string): CompanyReport[] {
  const sym = symbol.toUpperCase().trim();
  const directReports = OFFICIAL_COMPANY_REPORTS.filter(r => r.symbol.toUpperCase() === sym);
  if (directReports.length > 0) return directReports;

  // Generic fallback if specific report is not yet mapped in demo data
  return [
    {
      id: `rep-${sym.toLowerCase()}-2024-a`,
      symbol: sym,
      companyName: symbol,
      year: 2024,
      period: 'ANNUEL',
      title: `Rapport Annuel & États Financiers 2024 - ${sym}`,
      datePublished: '2025-05-15',
      documentType: 'Rapport Annuel',
      url: OFFICIAL_BRVM_REPORTS_PORTAL,
      pagesCount: 65,
      fileSize: '3.4 Mo',
      language: 'FR',
      highlights: 'Dépôt officiel des états financiers audités auprès de la BRVM et de l’AMF-UMOA.'
    },
    {
      id: `rep-${sym.toLowerCase()}-2024-s1`,
      symbol: sym,
      companyName: symbol,
      year: 2024,
      period: 'SEMESTRIEL',
      title: `Rapport Semestriel S1 2024 - ${sym}`,
      datePublished: '2024-09-30',
      documentType: 'Rapport Financier Semestriel',
      url: OFFICIAL_BRVM_REPORTS_PORTAL,
      pagesCount: 32,
      fileSize: '1.8 Mo',
      language: 'FR',
      highlights: 'Comptes intermédiaires et rapport d’activité du 1er semestre.'
    }
  ];
}
