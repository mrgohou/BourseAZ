export interface GlossaryTermData {
  id: string;
  term: string;
  abbreviation?: string;
  category: 'ratios' | 'market' | 'instruments' | 'regulation' | 'analysis' | 'strategy';
  categoryLabel: string;
  simplifiedDefinition: string; // Définition sans jargon en 1-2 phrases
  fullExplanation: string;
  formula?: string;
  example?: string;
  brvmContext?: string;
  aliases: string[]; // Termes et synonymes à détecter dans le texte
  beginnerTip?: string;
}

export const GLOSSARY_TERMS: GlossaryTermData[] = [
  {
    id: 'brvm',
    term: 'BRVM (Bourse Régionale des Valeurs Mobilières)',
    abbreviation: 'BRVM',
    category: 'market',
    categoryLabel: 'Marché & Bourse',
    simplifiedDefinition: 'Le marché officiel unique où s’achètent et se vendent les actions et obligations des 8 pays de l’Afrique de l’Ouest (UEMOA) en Francs CFA.',
    fullExplanation: 'Créée en 1998 et basée à Abidjan, la BRVM est une bourse électronique commune à la Côte d’Ivoire, au Sénégal, au Burkina Faso, au Mali, au Bénin, au Togo, au Niger et à la Guinée-Bissau. Elle permet aux entreprises de lever des capitaux et aux citoyens d’investir dans de grandes sociétés régionales.',
    brvmContext: 'C’est la seule bourse régionale entièrement intégrée au monde avec une devise commune (le Franc CFA XOF).',
    beginnerTip: 'Toutes les transactions se font en Francs CFA : aucun risque de conversion ou de change entre les 8 pays.',
    aliases: ['BRVM', 'Bourse Régionale des Valeurs Mobilières', 'Bourse Régionale']
  },
  {
    id: 'sgi',
    term: 'SGI (Société de Gestion et d’Intermédiation)',
    abbreviation: 'SGI',
    category: 'market',
    categoryLabel: 'Intermédiaires Agréés',
    simplifiedDefinition: 'L’agence de bourse officielle et réglementée obligatoire pour ouvrir un compte-titres et acheter vos actions à la BRVM en toute sécurité.',
    fullExplanation: 'Pour acheter des actions ou des obligations à la BRVM, la loi interdit les achats directs. Vous devez obligatoirement ouvrir un compte auprès d’une SGI agréée par les autorités financières (AMF-UMOA). La SGI conserve vos titres, exécute vos achats/ventes et verse vos dividendes sur votre compte.',
    example: 'Sociétés de bourse connues : BOA Capital Securities, CGF Bourse, BICI Bourse, Coris Bourse, Africabourse, Hudson & Cie, etc.',
    brvmContext: 'Il existe plus de 30 SGI agréées réparties dans les différents pays de l’Union.',
    beginnerTip: 'Vous pouvez ouvrir un compte chez une SGI située dans n’importe quel pays de l’UEMOA, même à distance.',
    aliases: ['SGI', 'Société de Gestion et d’Intermédiation', 'Sociétés de Gestion et d’Intermédiation', 'Société de bourse', 'Sociétés de bourse']
  },
  {
    id: 'dividende',
    term: 'Dividende',
    abbreviation: 'Dividende',
    category: 'ratios',
    categoryLabel: 'Revenus & Rendement',
    simplifiedDefinition: 'La part des bénéfices nets qu’une entreprise distribue en argent liquide chaque année à ses actionnaires.',
    fullExplanation: 'Quand une entreprise fait des bénéfices, l’assemblée générale des actionnaires décide d’en reverser une partie. Le dividende est versé directement en FCFA sur le compte-titres de l’investisseur pour chaque action qu’il possède.',
    example: 'Si vous avez 50 actions Sonatel et que le dividende voté est de 1 575 FCFA par action, vous recevrez 78 750 FCFA sur votre compte.',
    brvmContext: 'La BRVM est réputée pour offrir des dividendes parmi les plus élevés au monde (souvent 6% à 10% par an).',
    beginnerTip: 'Réinvestir vos dividendes chaque année crée un puissant effet boule de neige sur votre patrimoine.',
    aliases: ['dividende', 'dividendes', 'Dividende', 'Dividendes']
  },
  {
    id: 'rendement-dividende',
    term: 'Rendement du Dividende (Dividend Yield)',
    abbreviation: 'Rendement',
    category: 'ratios',
    categoryLabel: 'Ratios & Rentabilité',
    simplifiedDefinition: 'Le pourcentage de gain annuel que vous rapporte une action uniquement grâce à ses dividendes par rapport à son prix d’achat.',
    fullExplanation: 'Il permet de comparer le gain annuel d’une action avec un compte d’épargne classique. Par exemple, un compte bancaire rapporte 3,5% alors que certaines actions BRVM rapportent 8% à 10% de dividendes par an.',
    formula: 'Rendement (%) = (Dividende annuel par action / Prix de l’action) × 100',
    example: 'Une action achetée à 10 000 FCFA qui verse 800 FCFA de dividende a un rendement de (800 / 10 000) × 100 = 8,0% par an.',
    brvmContext: 'Le rendement moyen des dividendes à la BRVM tourne historiquement autour de 7,5%.',
    aliases: ['rendement du dividende', 'rendement de dividende', 'rendements de dividendes', 'Dividend Yield', 'taux de rendement']
  },
  {
    id: 'per',
    term: 'PER (Price Earnings Ratio)',
    abbreviation: 'PER / P/E',
    category: 'ratios',
    categoryLabel: 'Valorisation & Prix',
    simplifiedDefinition: 'Indique combien de fois l’action vaut son bénéfice annuel. Plus il est bas, plus l’action est réputée bon marché.',
    fullExplanation: 'Le PER compare le cours d’une action au bénéfice réalisé par action (BPA). Un PER de 7x signifie que vous payez l’action 7 fois son bénéfice annuel (ou qu’il faudra 7 ans de bénéfices pour rentabiliser le prix d’achat).',
    formula: 'PER = Prix actuel de l’action / Bénéfice Par Action (BPA)',
    example: 'Si Sonatel coûte 18 000 FCFA et gagne 1 800 FCFA par action, son PER est de 18 000 / 1 800 = 10x.',
    brvmContext: 'À la BRVM, un PER inférieur à 8x est généralement considéré comme très attractif (décote), tandis qu’un PER supérieur à 18x est jugé élevé.',
    beginnerTip: 'Ne comparez le PER que d’entreprises du même secteur (ex: comparer deux banques entre elles).',
    aliases: ['PER', 'Price Earnings Ratio', 'ratio P/E', 'ratios P/E', 'cours sur bénéfice']
  },
  {
    id: 'bpa',
    term: 'BPA (Bénéfice Par Action)',
    abbreviation: 'BPA / EPS',
    category: 'ratios',
    categoryLabel: 'Performance Financière',
    simplifiedDefinition: 'Le montant exact du bénéfice net annuel réalisé par l’entreprise pour une seule action.',
    fullExplanation: 'Le BPA montre la capacité d’une entreprise à générer des profits concrets pour chaque part détenue par un investisseur. Un BPA qui augmente chaque année est le signe d’une entreprise en bonne santé financière.',
    formula: 'BPA = Bénéfice Net Total / Nombre Total d’Actions',
    example: 'Si Ecobank CI réalise 40 milliards FCFA de bénéfices avec 80 millions d’actions, son BPA est de 500 FCFA par action.',
    brvmContext: 'Les BPA sont officiellement publiés après chaque assemblée générale des sociétés cotées.',
    aliases: ['BPA', 'Bénéfice Par Action', 'Bénéfice par action', 'EPS']
  },
  {
    id: 'compte-titres',
    term: 'Compte-Titres',
    abbreviation: 'Compte-titres',
    category: 'market',
    categoryLabel: 'Compte & Démarrage',
    simplifiedDefinition: 'Votre compte bancaire spécialisé qui stocke vos actions et reçoit automatiquement vos dividendes en FCFA.',
    fullExplanation: 'De même qu’un compte courant conserve votre argent, le compte-titres conserve vos parts d’entreprises (Sonatel, SGBC, etc.). Il est ouvert auprès d’une SGI et rattaché à votre compte bancaire pour les dépôts et retraits.',
    brvmContext: 'L’ouverture nécessite généralement une pièce d’identité, un justificatif de domicile et un RIB bancaire.',
    aliases: ['compte-titres', 'compte titres', 'comptes-titres', 'Compte-titres']
  },
  {
    id: 'irvm',
    term: 'IRVM (Impôt sur le Revenu des Valeurs Mobilières)',
    abbreviation: 'IRVM',
    category: 'regulation',
    categoryLabel: 'Fiscalité UEMOA',
    simplifiedDefinition: 'L’impôt prélevé directement à la source sur les dividendes perçus (taux réduit très avantageux de 7% pour les sociétés cotées).',
    fullExplanation: 'Pour encourager l’investissement en bourse, les gouvernements de l’UEMOA appliquent un taux d’imposition réduit de seulement 7% sur les dividendes d’entreprises cotées à la BRVM (au lieu de 10% à 15% pour les entreprises non cotées). Cet impôt est prélevé avant que l’argent n’arrive sur votre compte, vous n’avez rien à déclarer.',
    example: 'Sur 100 000 FCFA de dividendes bruts, la banque retient 7% (7 000 FCFA) et vous crédite 93 000 FCFA nets directement.',
    brvmContext: 'De plus, dans la quasi-totalité des pays UEMOA, les plus-values de revente d’actions BRVM sont 100% exonérées d’impôts.',
    aliases: ['IRVM', 'taxe IRVM', 'impôt IRVM']
  },
  {
    id: 'amf-umoa',
    term: 'AMF-UMOA (Autorité des Marchés Financiers de l’UMOA)',
    abbreviation: 'AMF-UMOA',
    category: 'regulation',
    categoryLabel: 'Régulation & Sécurité',
    simplifiedDefinition: 'L’organisme public officiel ("gendarme financier") qui surveille la BRVM, protège les épargnants et valide les sociétés autorisées.',
    fullExplanation: 'Anciennement appelé CREPMF, l’AMF-UMOA est l’institution sous-régionale chargée de faire respecter les lois boursières, d’agréer les SGI et d’auditer les comptes des entreprises cotées pour éviter les fraudes.',
    brvmContext: 'Son siège est situé à Abidjan et son autorité s’applique aux 8 pays de l’UEMOA.',
    aliases: ['AMF-UMOA', 'AMF UMOA', 'CREPMF', 'gendarme boursier']
  },
  {
    id: 'dcbr',
    term: 'DC/BR (Dépositaire Central / Banque de Règlement)',
    abbreviation: 'DC/BR',
    category: 'regulation',
    categoryLabel: 'Sécurité & Transactions',
    simplifiedDefinition: 'L’institution centrale qui garantit que vos actions vous appartiennent légalement et sécurise les échanges d’argent entre acheteurs et vendeurs.',
    fullExplanation: 'Le DC/BR tient le registre infalsifiable de tous les propriétaires d’actions de la BRVM. Lors d’un achat, il s’assure que les actions sont transférées sur votre compte et que l’argent est versé au vendeur sous 2 jours ouvrés (T+2).',
    brvmContext: 'Garantit qu’aucune action ne peut être volée ou perdue en cas de faillite d’un intermédiaire.',
    aliases: ['DC/BR', 'DCBR', 'Dépositaire Central']
  },
  {
    id: 'interets-composes',
    term: 'Intérêts Composés (Effet Boule de Neige)',
    abbreviation: 'Intérêts composés',
    category: 'strategy',
    categoryLabel: 'Stratégie & Croissance',
    simplifiedDefinition: 'Le mécanisme magique où les gains générés par votre argent produisent à leur tour de nouveaux gains chaque année.',
    fullExplanation: 'En réinvestissant systématiquement les dividendes perçus pour racheter de nouvelles actions, votre capital grossit de plus en plus vite avec le temps, sans effort supplémentaire.',
    example: '50 000 FCFA investis par mois pendant 10 ans à 8% de rendement génèrent 6 millions d’épargne versée... mais plus de 11,8 millions FCFA au total grâce aux intérêts composés !',
    aliases: ['intérêts composés', 'intérêt composé', 'effet boule de neige', 'gains composés']
  },
  {
    id: 'dca',
    term: 'DCA (Investissement Régulier Programmé)',
    abbreviation: 'DCA',
    category: 'strategy',
    categoryLabel: 'Stratégie d’Épargne',
    simplifiedDefinition: 'Méthode consistant à investir une même petite somme fixe chaque mois (ex: 25 000 FCFA) sans se soucier des variations du marché.',
    fullExplanation: 'Le DCA (Dollar Cost Averaging) élimine le stress d’essayer de "deviner le meilleur moment". Quand les cours baissent, vous achetez plus d’actions pour le même montant ; quand ils montent, votre portefeuille prend de la valeur.',
    brvmContext: 'Idéal pour les salariés et entrepreneurs de l’UEMOA souhaitant transformer une fraction de leur revenu mensuel en patrimoine solide.',
    aliases: ['DCA', 'investissement programmé', 'épargne programmée', 'versements réguliers']
  },
  {
    id: 'obligation',
    term: 'Obligation (Titre de Dette)',
    abbreviation: 'Obligation',
    category: 'instruments',
    categoryLabel: 'Instruments Sécurisés',
    simplifiedDefinition: 'Un prêt d’argent rémunéré que vous accordez à un État (ex: Côte d’Ivoire, Sénégal) ou à une grande entreprise en échange d’un taux d’intérêt garanti.',
    fullExplanation: 'Contrairement à l’action qui fait de vous propriétaire d’une part d’entreprise, l’obligation fait de vous un créancier. L’émetteur s’engage à vous verser un intérêt régulier (appelé coupon, ex: 6% par an) et à vous rembourser 100% de votre capital à la fin.',
    example: 'TPCI 5.90% 2021-2031 : obligation émise par l’État ivoirien versant 5,90% d’intérêt par an.',
    brvmContext: 'Le marché obligataire BRVM est très sûr et offre des rendements garantis souvent supérieurs à 6% par an.',
    aliases: ['obligation', 'obligations', 'Obligation', 'Obligations', 'titre de créance', 'titres de créance']
  },
  {
    id: 'plus-value',
    term: 'Plus-Value (Gain en Capital)',
    abbreviation: 'Plus-value',
    category: 'ratios',
    categoryLabel: 'Gains & Performance',
    simplifiedDefinition: 'Le gain réalisé quand vous revendez une action à un prix supérieur à son prix d’achat initial.',
    fullExplanation: 'Si vous achetez une action à 5 000 FCFA et que vous la revendez 2 ans plus tard à 8 000 FCFA, vous réalisez une plus-value de 3 000 FCFA (+60%).',
    brvmContext: 'Dans la zone UEMOA, les plus-values sur les actions cotées à la BRVM sont totalement exonérées d’impôts pour les particuliers dans la plupart des États membres.',
    aliases: ['plus-value', 'plus-values', 'Plus-value', 'gain en capital', 'plus-values de cession']
  },
  {
    id: 'capitalisation-boursiere',
    term: 'Capitalisation Boursière',
    abbreviation: 'Cap. Boursière',
    category: 'analysis',
    categoryLabel: 'Taille d’Entreprise',
    simplifiedDefinition: 'La valeur marchande totale de l’ensemble d’une entreprise calculée à partir du prix de ses actions en bourse.',
    fullExplanation: 'Elle permet de classer les entreprises par taille (grandes capitalisations comme Sonatel, moyennes ou petites capitalisations).',
    formula: 'Capitalisation = Prix de l’action × Nombre total d’actions en circulation',
    example: 'Sonatel avec 100 millions d’actions valant 18 000 FCFA a une capitalisation boursière de 1 800 milliards FCFA.',
    brvmContext: 'La capitalisation totale de toutes les entreprises cotées à la BRVM dépasse 9 500 milliards FCFA.',
    aliases: ['capitalisation boursière', 'capitalisation', 'capitalisations', 'Market Cap']
  },
  {
    id: 'flottant',
    term: 'Flottant (Free Float)',
    abbreviation: 'Flottant',
    category: 'analysis',
    categoryLabel: 'Échangeabilité',
    simplifiedDefinition: 'La proportion d’actions d’une entreprise réellement disponible à l’achat pour le grand public sur le marché.',
    fullExplanation: 'Certaines parts d’entreprises appartiennent pour toujours à l’État ou aux fondateurs et ne sont jamais vendues. Le flottant représente uniquement les actions qui circulent librement entre les acheteurs et les vendeurs.',
    brvmContext: 'L’AMF-UMOA exige généralement au moins 20% de flottant pour qu’une entreprise soit admise à la cote.',
    aliases: ['flottant', 'Flottant', 'Free Float', 'capital flottant']
  },
  {
    id: 'carnet-ordres',
    term: 'Carnet d’Ordres',
    abbreviation: 'Carnet d’ordres',
    category: 'market',
    categoryLabel: 'Marché en Direct',
    simplifiedDefinition: 'La liste en temps réel de tous les acheteurs et vendeurs avec les prix et quantités qu’ils proposent.',
    fullExplanation: 'Comme sur un marché traditionnel, le carnet d’ordres regroupe ceux qui veulent acheter (avec leur prix max) et ceux qui veulent vendre (avec leur prix min). Quand un prix coïncide, la transaction s’effectue automatiquement.',
    aliases: ['carnet d’ordres', 'carnet d\'ordres', 'carnets d’ordres', 'Order Book']
  },
  {
    id: 'ordre-de-bourse',
    term: 'Ordre de Bourse',
    abbreviation: 'Ordre',
    category: 'market',
    categoryLabel: 'Passage d’Ordre',
    simplifiedDefinition: 'L’instruction que vous donnez à votre SGI pour acheter ou vendre un nombre précis d’actions à un prix donné.',
    fullExplanation: 'Vous pouvez passer un "ordre à cours limité" (vous fixez le prix maximum que vous acceptez de payer) ou un "ordre au marché" (exécuté immédiatement au meilleur prix disponible).',
    aliases: ['ordre de bourse', 'ordres de bourse', 'ordre d’achat', 'ordres d’achat', 'ordre de vente']
  },
  {
    id: 'split',
    term: 'Split (Fractionnement d’Actions)',
    abbreviation: 'Split',
    category: 'market',
    categoryLabel: 'Opérations sur Titres',
    simplifiedDefinition: 'La division du prix d’une action par un nombre (ex: diviser par 10) pour la rendre beaucoup plus accessible aux petits épargnants.',
    fullExplanation: 'Lors d’un split (ex: 1 pour 10), une action valant 60 000 FCFA est transformée en 10 nouvelles actions valant 6 000 FCFA chacune. La valeur de votre portefeuille ne change pas, mais l’action devient bien plus facile à acheter pour tout le monde.',
    example: 'Sonatel et Solibra ont déjà procédé à des splits majeurs pour permettre aux épargnants individuels d’acheter facilement leurs titres.',
    aliases: ['split', 'splits', 'Split', 'Splits', 'fractionnement', 'fractionnements']
  },
  {
    id: 'indices-brvm',
    term: 'Indices BRVM Composite & BRVM 30',
    abbreviation: 'BRVM-C / BRVM-30',
    category: 'market',
    categoryLabel: 'Baromètre Général',
    simplifiedDefinition: 'Le "thermomètre" qui mesure si la bourse de l’Afrique de l’Ouest est globalement en hausse ou en baisse dans la journée.',
    fullExplanation: 'Au lieu de regarder les 36 entreprises une par une, l’indice BRVM Composite donne la moyenne pondérée de tout le marché. Le BRVM 30 suit spécifiquement les 30 entreprises les plus actives.',
    aliases: ['BRVM Composite', 'BRVM 30', 'indices BRVM', 'indice BRVM', 'BRVM-C']
  },
  {
    id: 'sukuk',
    term: 'Sukuk (Obligation Islamique)',
    abbreviation: 'Sukuk',
    category: 'instruments',
    categoryLabel: 'Finance Participative',
    simplifiedDefinition: 'Un titre d’investissement conforme aux règles de la finance islamique (sans intérêt usurain), adossé à un actif réel.',
    fullExplanation: 'Au lieu d’un taux d’intérêt d’emprunt, le souscripteur d’un Sukuk perçoit une quote-part des loyers ou profits réels générés par des infrastructures tangibles (routes, bâtiments, etc.).',
    brvmContext: 'Les États du Sénégal, de Côte d’Ivoire, du Togo et du Mali ont émis plusieurs Sukuks cotés avec succès à la BRVM.',
    aliases: ['sukuk', 'sukuks', 'Sukuk', 'Sukuks']
  },
  {
    id: 'pbr',
    term: 'PBR (Price-to-Book Ratio / Valeur Comptable)',
    abbreviation: 'PBR / P/B',
    category: 'ratios',
    categoryLabel: 'Valeur d’Actif',
    simplifiedDefinition: 'Compare le prix de l’action sur le marché à la valeur réelle des biens et bâtiments possédés par l’entreprise.',
    fullExplanation: 'Un PBR inférieur à 1,0 signifie que vous pouvez acheter l’entreprise pour moins cher que ce que valent ses bâtiments, équipements et terrains au bilan comptable.',
    formula: 'PBR = Prix de l’action / Actif net comptable par action',
    aliases: ['PBR', 'Price-to-Book', 'Price to Book', 'valeur comptable']
  },
  {
    id: 'roe',
    term: 'ROE (Return on Equity / Rentabilité des Capitaux)',
    abbreviation: 'ROE',
    category: 'ratios',
    categoryLabel: 'Efficacité de Gestion',
    simplifiedDefinition: 'Mesure la capacité des dirigeants à transformer chaque Franc CFA apporté par les actionnaires en bénéfices nets.',
    fullExplanation: 'Un ROE supérieur à 15% indique une entreprise très bien gérée et hautement rentable. Le secteur bancaire de la BRVM affiche régulièrement des ROE supérieurs à 18%.',
    formula: 'ROE (%) = (Bénéfice Net / Capitaux Propres) × 100',
    aliases: ['ROE', 'Return on Equity', 'rentabilité des capitaux propres']
  }
];

export const GLOSSARY_CATEGORIES = [
  { id: 'all', label: 'Toutes les catégories' },
  { id: 'ratios', label: 'Ratios & Rendement' },
  { id: 'market', label: 'Marché & Intermédiaires' },
  { id: 'instruments', label: 'Actions & Obligations' },
  { id: 'regulation', label: 'Régulation & Sécurité' },
  { id: 'analysis', label: 'Analyse & Valorisation' },
  { id: 'strategy', label: 'Stratégie d’Épargne' },
];

/**
 * Recherche rapide d'un terme dans le glossaire par ID ou alias
 */
export function getGlossaryTermById(id: string): GlossaryTermData | undefined {
  return GLOSSARY_TERMS.find(t => t.id.toLowerCase() === id.toLowerCase());
}

/**
 * Trouve un terme correspondant à une chaîne de texte
 */
export function findGlossaryTermByText(text: string): GlossaryTermData | undefined {
  const normalized = text.trim().toLowerCase();
  return GLOSSARY_TERMS.find(t =>
    t.term.toLowerCase() === normalized ||
    (t.abbreviation && t.abbreviation.toLowerCase() === normalized) ||
    t.aliases.some(a => a.toLowerCase() === normalized)
  );
}
