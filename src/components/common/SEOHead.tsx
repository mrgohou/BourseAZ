import React, { useEffect } from 'react';
import { DEMO_COMPANIES } from '../../data/demo-data';
import { liveMarketService } from '../../services/market-data/liveMarketService';

interface SEOHeadProps {
  currentPath: string;
}

export const SEOHead: React.FC<SEOHeadProps> = ({ currentPath }) => {
  useEffect(() => {
    const [pathOnly, searchOnly] = currentPath.split('?');
    const queryParams = new URLSearchParams(searchOnly || '');
    const canonicalBase = 'https://boursefacile.app';
    const canonicalUrl = `${canonicalBase}${pathOnly}`;

    let title = "Bourse Facile - Investir à la BRVM | Cours, Dividendes & Simulateur UEMOA";
    let description = "Plateforme n°1 pour comprendre et investir en bourse à la BRVM (Côte d'Ivoire, Sénégal, Burkina, Mali, Bénin, Togo, Niger, Guinée-Bissau). 36 actions cotées, dividendes, simulateur gratuit.";
    let jsonLdData: any = null;

    // Route-specific SEO optimization
    if (pathOnly === '/' || pathOnly === '') {
      title = "Bourse Facile | Investir en Bourse à la BRVM (Côte d'Ivoire, Sénégal, UEMOA) - Guide & Simulateur";
      description = "Apprenez à investir à la BRVM sans jargon. Suivez en direct les 36 actions cotées (Sonatel, Solibra, SGBC, Ecobank), calculez vos dividendes et simulez vos gains d'épargne.";
    } else if (pathOnly === '/search') {
      const q = queryParams.get('q');
      if (q) {
        title = `Recherche BRVM : "${q}" | Cotations & Fiches Entreprises - Bourse Facile`;
        description = `Résultats de recherche pour "${q}" sur la BRVM. Consultez les cours, dividendes, PER et bilans financiers des 36 actions cotées.`;
      } else {
        title = "Marché & Actions BRVM | Cotations des 36 Sociétés Cotées en Direct - Bourse Facile";
        description = "Consultez l'ensemble des 36 entreprises cotées à la BRVM (Sénégal, Côte d'Ivoire, Burkina, etc.). Cours actualisés, rendements de dividendes et filtres sectoriels.";
      }
    } else if (pathOnly.startsWith('/company/')) {
      const symbol = pathOnly.split('/company/')[1]?.toUpperCase() || 'SNTS';
      const company = liveMarketService.getCachedCompanies().find(c => c.symbol === symbol) || DEMO_COMPANIES.find(c => c.symbol === symbol) || DEMO_COMPANIES[0];
      
      title = `${company.name} (${company.symbol}) : Cours ${company.currentPrice.toLocaleString('fr-FR')} FCFA, Dividendes & Analyse BRVM`;
      description = `Fiche d'analyse complète ${company.name} (${company.symbol}) à la BRVM. Cours de clôture (${company.currentPrice.toLocaleString('fr-FR')} FCFA), rendement dividende (${company.dividendYield}%), secteur ${company.sector} (${company.country}).`;

      jsonLdData = {
        "@context": "https://schema.org",
        "@type": "Corporation",
        "name": company.name,
        "tickerSymbol": `BRVM:${company.symbol}`,
        "description": company.description,
        "address": {
          "@type": "PostalAddress",
          "addressCountry": company.country
        },
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "Titres Financiers",
          "itemListElement": [
            {
              "@type": "FinancialProduct",
              "name": `Action ${company.name}`,
              "tickerSymbol": company.symbol,
              "offers": {
                "@type": "Offer",
                "price": company.currentPrice,
                "priceCurrency": "XOF",
                "availability": "https://schema.org/InStock"
              }
            }
          ]
        }
      };
    } else if (pathOnly === '/simulation') {
      title = "Simulateur d'Épargne & Rendement BRVM | Calculez vos Gains & Dividendes - Bourse Facile";
      description = "Simulez vos investissements mensuels à la BRVM avec réinvestissement des dividendes et intérêts composés. Intègre les frais de SGI et l'impôt IRVM (7%).";
      
      jsonLdData = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Simulateur d'Investissement BRVM",
        "applicationCategory": "FinanceApplication",
        "operatingSystem": "All",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "XOF"
        },
        "description": "Calculateur d'intérêts composés et de rentabilité pour l'investissement programmé en actions BRVM."
      };
    } else if (pathOnly === '/comparison') {
      title = "Comparateur d'Actions BRVM | Comparez les Sociétés et Dividendes - Bourse Facile";
      description = "Mettez en concurrence les 36 sociétés cotées à la BRVM. Comparez leurs dividendes, leur rentabilité (PER), leur chiffre d'affaires et leur solidité financière.";
    } else if (pathOnly === '/learning' || pathOnly.startsWith('/learning/')) {
      title = "Guide & Académie BRVM | Tout Comprendre pour Débuter en Bourse en Afrique de l'Ouest";
      description = "Modules pédagogiques étape par étape pour débuter à la BRVM : ouvrir un compte SGI, comprendre les dividendes, passer un ordre d'achat et bâtir son patrimoine.";
    } else if (pathOnly === '/sgi') {
      title = "Annuaire Officiel des SGI BRVM | 30+ Sociétés de Bourse Agréées AMF-UMOA";
      description = "Répertoire des Sociétés de Gestion et d'Intermédiation (SGI) agréées en Côte d'Ivoire, Sénégal, Bénin, Burkina, Mali, Togo, Niger. Contacts directs et démarches.";
    } else if (pathOnly === '/profil-investisseur') {
      title = "Test de Profil Investisseur BRVM | Quelle Stratégie Choisir ? - Bourse Facile";
      description = "Faites le test en 5 questions pour déterminer votre profil de risque (Prudent, Équilibré, Audacieux) et obtenir une allocation d'actifs personnalisée pour la zone UEMOA.";
    }

    // Apply Meta Tags to DOM
    document.title = title;

    // Helper to set or update meta tag
    const setMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let tag = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, name);
        document.head.appendChild(tag);
      }
      tag.content = content;
    };

    setMeta('description', description);
    setMeta('title', title);
    setMeta('og:title', title, true);
    setMeta('og:description', description, true);
    setMeta('og:url', canonicalUrl, true);
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);

    // Update Canonical link
    let canonicalTag = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.rel = 'canonical';
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.href = canonicalUrl;

    // Inject dynamic JSON-LD if provided
    let dynamicLdScript = document.getElementById('dynamic-page-jsonld') as HTMLScriptElement | null;
    if (jsonLdData) {
      if (!dynamicLdScript) {
        dynamicLdScript = document.createElement('script');
        dynamicLdScript.id = 'dynamic-page-jsonld';
        dynamicLdScript.type = 'application/ld+json';
        document.head.appendChild(dynamicLdScript);
      }
      dynamicLdScript.text = JSON.stringify(jsonLdData);
    } else if (dynamicLdScript) {
      dynamicLdScript.remove();
    }
  }, [currentPath]);

  return null;
};
