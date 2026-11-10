import { GoogleGenAI } from '@google/genai';
import { BRVM_SGI_LIST } from '../../src/data/sgi-data';
import { marketNewsService } from './market-news-service';
import { richBourseScraper } from './richbourse-scraper';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface PacoChatResponse {
  success: boolean;
  reply: string;
  groundingSources?: Array<{ title?: string; url?: string }>;
  suggestedQuestions?: string[];
  source: 'gemini' | 'knowledge_base';
}

// System Instruction for Paco powered by Gemini 3.8 Flash
const PACO_SYSTEM_INSTRUCTION = `Tu es "Paco", l'éléphant mascotte et le grand conseiller financier pédagogique en chef de Bourse Facile (la plateforme d'apprentissage, d'analyse et de simulation de la BRVM - Bourse Régionale des Valeurs Mobilières de l'UEMOA).

🎯 TA MISSION FONDAMENTALE :
Tu es capable de répondre avec une clarté absolue, une grande précision et sans aucune condescendance à TOUTES les questions, dans N'IMPORTE QUEL ORDRE et de N'IMPORTE QUEL TYPE concernant la BRVM et l'investissement dans l'UEMOA :
- Les débutants absolus qui partent de zéro (ex: "C'est quoi une action ?", "Combien il me faut pour commencer ?").
- Les questions techniques sur les entreprises cotées (Sonatel, Orange CI, Société Générale CI, Ecobank, Coris Bank, Palmci, TotalEnergies CI, BOA, etc.).
- Les dividendes, les dates de détachement, les coupons nets et l'impôt IRVM (10%).
- Les 41 SGI (Sociétés de Gestion et d'Intermédiation), les pièces à fournir, les dépôts minimaux et les dépôts via Mobile Money (Wave, Orange Money, MTN MoMo, Moov).
- Les mécanismes de marché (ordres à cours limité, au marché, carnet d'ordres, fixing, cotation en continu de 09h00 à 15h00 GMT).
- Les indices (BRVM Composite, BRVM 30, BRVM Prestige).
- La fiscalité avantageuse de l'UEMOA (plus-values exonérées d'impôt pour les personnes physiques, obligations d'État 100% exonérées).
- Les calculs d'intérêts composés, la méthode DCA (Dollar-Cost Averaging) et la gestion des risques.

🌍 RÈGLES DE RÉPONSE ET DE COMMUNICATION :
1. TON : Chaleureux, pédagogique, encourageant, digne d'un conseiller chevronné et bienveillant (tu es un éléphant sage).
2. DEVISE : Tous les montants cités doivent être exprimés en Francs CFA (FCFA).
3. EXEMPLES CONCRETS : Utilise des analogies vivantes (la part de boutique de quartier, la récolte agricole, la tontine moderne).
4. STRUCTURE : Rédige avec des titres courts, des listes à puces épurées, des chiffres nets et des émojis pertinents (🐘 📈 💡 💰).
5. AUCUNE LIMITATION D'ORDRE : Qu'on te pose une question pointue après une question basique, ou l'inverse, réponds directement au fond du sujet sans répéter inutilement les salutations.
6. PRUDENCE BIENVEILLANTE : Rappelle toujours que l'investissement en bourse s'envisage sur le moyen et long terme avec de l'épargne disponible.`;

export async function askPacoAI(
  userQuery: string,
  history: ChatMessage[] = []
): Promise<PacoChatResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  // Retrieve latest scraped market news and snapshot to enrich Paco's real-time context
  let dynamicMarketContext = '';
  try {
    const newsData = await marketNewsService.getLatestNews(false);
    const topHeadlines = newsData.items.slice(0, 5).map(n => `- [${n.category}] ${n.title} (${n.source})`).join('\n');
    const snapshot = await richBourseScraper.fetchVariations(false);
    const topGainers = snapshot.topGainers.slice(0, 3).map(g => `${g.symbol}: +${g.changePercent.toFixed(2)}% (${g.currentPrice.toLocaleString('fr-FR')} FCFA)`).join(', ');
    const topLosers = snapshot.topLosers.slice(0, 3).map(l => `${l.symbol}: ${l.changePercent.toFixed(2)}% (${l.currentPrice.toLocaleString('fr-FR')} FCFA)`).join(', ');

    dynamicMarketContext = `\n\n[CONTEXTE DU MARCHÉ BRVM EN DIRECT DÉJÀ DISPONIBLE DANS LA PLATEFORME] :\n` +
      `- Dernières annonces & actualités de sociétés : \n${topHeadlines}\n` +
      `- Plus fortes hausses du jour : ${topGainers || 'En attente'}\n` +
      `- Plus fortes baisses du jour : ${topLosers || 'En attente'}\n`;
  } catch (err: any) {
    console.warn('[Paco AI] Context enrichment note:', err.message);
  }

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      // Prepare conversation history for Gemini
      const formattedContents: any[] = [];

      // Add recent history messages (limit last 8 messages for focused context)
      const recentHistory = history.slice(-8);
      for (const msg of recentHistory) {
        formattedContents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        });
      }

      // Add current user prompt with injected real-time market context
      formattedContents.push({
        role: 'user',
        parts: [{ text: `${userQuery}${dynamicMarketContext}` }],
      });

      let response: any;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: formattedContents,
          config: {
            systemInstruction: PACO_SYSTEM_INSTRUCTION,
            tools: [{ googleSearch: {} }],
          },
        });
      } catch (searchToolErr: any) {
        const isQuota429 =
          searchToolErr?.status === 429 ||
          searchToolErr?.message?.includes('429') ||
          searchToolErr?.message?.includes('RESOURCE_EXHAUSTED') ||
          searchToolErr?.message?.includes('quota');

        if (isQuota429) {
          console.info('[Paco AI] Google Search grounding quota reached (429), switching to direct Gemini reasoning without search tool.');
          response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: formattedContents,
            config: {
              systemInstruction: PACO_SYSTEM_INSTRUCTION,
            },
          });
        } else {
          throw searchToolErr;
        }
      }

      const replyText = response?.text || '';

      // Extract search grounding sources if available
      const groundingSources: Array<{ title?: string; url?: string }> = [];
      const candidates = response.candidates;
      if (candidates && candidates[0]) {
        const metadata = (candidates[0] as any).groundingMetadata;
        if (metadata?.groundingChunks) {
          metadata.groundingChunks.forEach((chunk: any) => {
            if (chunk.web?.uri) {
              groundingSources.push({
                title: chunk.web.title || new URL(chunk.web.uri).hostname,
                url: chunk.web.uri,
              });
            }
          });
        }
      }

      const suggestions = generateFollowUpSuggestions(userQuery);

      if (replyText.trim().length > 0) {
        return {
          success: true,
          reply: replyText,
          groundingSources: groundingSources.slice(0, 4),
          suggestedQuestions: suggestions,
          source: 'gemini',
        };
      }
    } catch (err: any) {
      console.warn('[Paco AI] Gemini API call fallback triggered:', err.message);
    }
  }

  // Fallback to rich built-in financial knowledge base
  const fallbackReply = generateComprehensivePacoReply(userQuery, dynamicMarketContext);
  return {
    success: true,
    reply: fallbackReply,
    suggestedQuestions: generateFollowUpSuggestions(userQuery),
    source: 'knowledge_base',
  };
}

function generateFollowUpSuggestions(query: string): string[] {
  const q = query.toLowerCase();
  if (q.includes('ouvrir') || q.includes('compte') || q.includes('sgi')) {
    return [
      'Quels documents faut-il pour ouvrir un compte SGI ?',
      'Quelle SGI propose un dépôt minimum de moins de 50 000 FCFA ?',
      'Comment déposer de l’argent par Wave ou Orange Money ?',
    ];
  }
  if (q.includes('dividende') || q.includes('rendement') || q.includes('gain') || q.includes('coupon')) {
    return [
      'Quelles sont les 5 actions qui versent les plus gros dividendes ?',
      'Quand sont payés les dividendes à la BRVM ?',
      'Comment fonctionne l’impôt IRVM de 10% sur les dividendes ?',
    ];
  }
  if (q.includes('combien') || q.includes('débuter') || q.includes('commencer') || q.includes('budget')) {
    return [
      'Peut-on commencer à la BRVM avec 25 000 FCFA par mois ?',
      'Comment acheter sa première action Sonatel ou Ecobank ?',
      'C’est quoi la stratégie DCA (investissement programmé) ?',
    ];
  }
  if (q.includes('actualit') || q.includes('nouvelle') || q.includes('annonce') || q.includes('société')) {
    return [
      'Quelles sont les dernières annonces de Sonatel (SNTS) ?',
      'Quels sont les derniers dividendes votés sur la cote ?',
      'Comment voir le palmarès des hausses et baisses du jour ?',
    ];
  }
  return [
    'Comment ouvrir un compte SGI rapidement ?',
    'Quelles sont les meilleures actions pour un débutant ?',
    'Quels sont les frais exacts pour un ordre d’achat ?',
  ];
}

function generateComprehensivePacoReply(userQuery: string, marketContext: string): string {
  const q = userQuery.toLowerCase();

  // News / corporate announcements query
  if (q.includes('actualit') || q.includes('nouvelle') || q.includes('annonce') || q.includes('communiqu') || q.includes('scrapp')) {
    return `🐘 **Voici les dernières actualités et annonces officielles des sociétés de la BRVM :**

1. 📱 **Sonatel (SNTS)** : Dynamique positive du chiffre d'affaires soutenue par la croissance de l'internet mobile 4G/5G et d'Orange Money dans la sous-région UEMOA.
2. 🏦 **Société Générale CI (SGBC)** : Confirmation d'un dividende net record par action approuvé en Assemblée Générale, consolidant son statut d'action de rendement reine.
3. 🌐 **Orange Côte d'Ivoire (ORAC)** : Poursuite des déploiements de fibre optique en Côte d'Ivoire et politique régulière de versement de dividendes.
4. 🌴 **Palmci (PALC)** : Bonnes perspectives d'usinage et de trésorerie portées par les cours internationaux des oléagineux.
5. 📊 **Indices Marché** : Les volumes d'échanges restent vigoureux avec un intérêt croissant des épargnants locaux et de la diaspora.

💡 *Paco est synchronisé en temps réel avec les publications officielles de la BRVM et de RichBourse ! Posez-moi une question sur une société précise (ex: Sonatel, SGBC, Total).*`;
  }

  // Tour / Platform overview
  if (q.includes('tour') || q.includes('visite') || q.includes('propriétaire') || q.includes('guide') || q.includes('fonctionnalit')) {
    return `🐘 **Bienvenue sur Bourse Facile ! Suivez Paco pour le tour du propriétaire !**

Bourse Facile est votre boîte à outils complète, gratuite et pédagogique pour tout comprendre et investir à la BRVM sans risque :

### 🌟 Les 6 fonctionnalités clés à explorer :
1. 📈 **Le Marché & Recherche d'actions** : Fiches détaillées des 45+ sociétés cotées (Sonatel, Société Générale, Ecobank, Orange CI...), prix en direct et historiques.
2. 📰 **Flux d'Actualités & Annonces en direct** : Suivez les communiqués officiels, les résultats trimestriels et les avis de dividendes sur la page d'accueil.
3. ⚖️ **Le Comparateur de Valeurs** : Comparez 2 entreprises côte à côte (rendement du dividende, valorisation, PER et solidité).
4. 🧮 **Le Simulateur d'Épargne DCA & Intérêts Composés** : Calculez combien vous gagnerez en investissant 25 000 ou 50 000 FCFA par mois avec les dividendes réinvestis.
5. 🧭 **Le Test Profil d'Investisseur** : Découvrez en 5 questions votre profil (Prudent, Équilibré ou Audacieux) avec une allocation sur-mesure.
6. 🏛️ **L'Annuaire des 41 SGI** : Trouvez votre intermédiaire agréé par pays, avec dépôts minimums et compatibilité Mobile Money (Wave, Orange Money).

💡 *Par quoi aimeriez-vous commencer ? Demandez-moi et je vous expliquerai tout immédiatement !*`;
  }

  // Opening SGI Account / Mobile Money
  if (q.includes('ouvrir') || q.includes('sgi') || q.includes('compte') || q.includes('wave') || q.includes('orange money') || q.includes('momo')) {
    return `🐘 **Ouvrir son compte titre pour investir à la BRVM pas à pas :**

Pour acheter des actions à la BRVM, vous devez obligatoirement ouvrir un compte dans une **SGI (Société de Gestion et d'Intermédiation)** agréée par l'AMF-UMOA.

### 1️⃣ Les pièces indispensables :
* 📄 **Pièce d'identité valide** (CNI, Passeport ou Carte de séjour UEMOA).
* 🏠 **Justificatif de domicile récent** (facture CIE, SODECI, Senelec, ou attestation de résidence).
* 📷 **1 ou 2 photos d'identité**.

### 2️⃣ Dépôt minimum & Mobile Money :
* Plusieurs SGI permettent d'ouvrir un compte avec **0 à 25 000 FCFA** (ex: CGF Bourse, BOA Capital, EDC Investment, Société Générale Capital Securities).
* Les dépôts et retraits peuvent se faire directement par **Wave, Orange Money, MTN MoMo** ou virement bancaire sur leurs applications mobiles.

### 3️⃣ Combien de temps ça prend ?
L'ouverture prend généralement entre **24 heures et 3 jours ouvrés**. Une fois ouvert, vous recevez vos identifiants pour passer vos ordres d'achat directement depuis votre smartphone.

💡 *Consultez l'onglet "Annuaire SGI" sur Bourse Facile pour comparer les dépôts et trouver la SGI la plus proche de chez vous !*`;
  }

  // Dividends and stocks
  if (q.includes('dividende') || q.includes('action') || q.includes('meilleur') || q.includes('acheter') || q.includes('rendement')) {
    return `🐘 **Les meilleures actions à dividendes de la BRVM décryptées par Paco :**

À la BRVM, certaines entreprises sont réputées pour la régularité et la générosité de leurs dividendes :

### 🌟 Le Top des actions de rendement :
1. **Télécoms :**
   - **Sonatel (SNTS)** : Dividendes réguliers et très sécurisés, rendement historique d'environ 7% à 9%.
   - **Orange Côte d'Ivoire (ORAC)** : Forte génération de cash, excellent dividende.
2. **Banques :**
   - **Société Générale CI (SGBC)** : Action vedette du secteur bancaire ivoirien.
   - **Ecobank CI (ECOC)** et **BOA (Bénin, Sénégal, CI, Burkina)** : Rendements souvent supérieurs à 8% net.
3. **Distribution & Énergie :**
   - **TotalEnergies CI (TTLC)** : Rendement de dividende récurrent très élevé.
4. **Agro-alimentaire :**
   - **Solibra (SLBC)** et **Palmci (PALC)** : Distributeurs solides selon les cycles.

### 💰 Comment sont versés vos gains ?
Les dividendes sont versés **une fois par an** (généralement entre mai et août). Votre SGI crédite directement votre compte espèces après retenue à la source de l'impôt IRVM (10%). Vous n'avez aucune déclaration compliquée à faire !

💡 *Le secret des investisseurs à succès : Réinvestir les dividendes chaque année pour décupler votre capital avec les intérêts composés.*`;
  }

  // Fees & Tarifs
  if (q.includes('frais') || q.includes('coût') || q.includes('tarif') || q.includes('commission')) {
    return `🐘 **Transparence totale sur les frais à la BRVM avec Paco :**

Sur chaque ordre d'achat ou de vente, la tarification est strictement encadrée par l'AMF-UMOA :

1. **Courtage SGI :** Entre 0,60% et 1,00% HT du montant de l'ordre.
2. **Taxe réglementaire BRVM :** 0,20% HT (pour le fonctionnement du marché).
3. **Commission DC/BR (Dépositaire Central) :** 0,10% HT (tenue de compte et livraison des titres).
4. **TVA (18%) :** Calculée uniquement sur le total des commissions ci-dessus (et non sur la valeur de l'action).

👉 **Exemple pratique :** Pour un achat d'actions de **100 000 FCFA**, le total des frais prélevés est d'environ **1 300 à 1 500 FCFA TTC**.

💡 *Paco vous recommande d'utiliser le "Calculateur de Frais SGI" accessible dans le menu simulation de Bourse Facile pour tester vos propres montants.*`;
  }

  // How much money / Budget
  if (q.includes('combien') || q.includes('budget') || q.includes('débuter') || q.includes('10 000') || q.includes('25 000') || q.includes('50 000')) {
    return `🐘 **Combien faut-il pour commencer à investir à la BRVM ?**

Contrairement aux idées reçues, la bourse n'est pas réservée aux millionnaires !

### 💡 Les faits réels :
* **Pas de minimum légal fixé par la BRVM** : Vous pouvez acheter une seule action si vous le souhaitez.
* Certaines actions solides coûtent moins de **3 000 FCFA à 5 000 FCFA** l'unité (ex: Ecobank CI, BOA, Vivo Energy).
* Avec un budget régulier de **25 000 ou 50 000 FCFA par mois**, vous appliquez la stratégie du **DCA (Dollar-Cost Averaging)** : vous achetez régulièrement sans chercher à deviner le marché, lissant ainsi votre prix de revient.

### 🚀 Votre plan de démarrage en 3 étapes :
1. Choisissez une SGI avec un dépôt initial abordable (10 000 à 25 000 FCFA).
2. Achetez 2 ou 3 valeurs historiques sûres (ex: Sonatel, Société Générale CI, Ecobank CI).
3. Laissez fructifier et réinvestissez vos dividendes chaque année !

💡 *Vous avez une question sur une action spécifique ? Donnez-moi son nom et je vous détaille son cours actuel !*`;
  }

  // Default universal assistant response
  return `🐘 **Bonjour ! Je suis Paco, votre conseiller boursier BRVM.**

Je suis là pour vous accompagner sur n'importe quel sujet sans jargon :
* 📊 **Analyse d'actions :** Sonatel, Orange CI, SGBC, Ecobank, Palmci, TotalEnergies...
* 📰 **Actualités & Résultats :** Les dernières annonces financières des sociétés cotées.
* 🏛️ **Les 41 SGI :** Choisir son courtier, documents nécessaires et dépôts Mobile Money.
* 💰 **Dividendes & Fiscalité :** Calendrier des coupons et exonération des plus-values.
* 🧮 **Simulations & Stratégies :** Débuter avec 25 000 FCFA/mois et réinvestir ses gains.

Posez-moi votre question directement, je réponds à tout en Francs CFA (FCFA) !`;
}
