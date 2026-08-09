# BourseClair - Application Web Pédagogique d'Analyse et de Simulation Boursière (BRVM)

BourseClair est une plateforme web moderne, responsive et pédagogique conçue pour démocratiser l'investissement à la **Bourse Régionale des Valeurs Mobilières (BRVM)** pour la communauté financière de l'UEMOA (Sénégal, Côte d'Ivoire, Burkina Faso, Togo, Mali, Bénin, Niger, Guinée-Bissau).

---

## 1. Stack Technique

- **Frontend** : React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Recharts (graphiques boursiers), jsPDF (exports PDF)
- **Backend API** : Node.js, Express
- **Ratios & Calculs** : Moteur de simulation sur mesure en FCFA, Zod pour la validation des schémas
- **Données** : Modèle de données de démonstration internes clairement identifiées **DEMO**

---

## 2. Fonctionnalités Clés

1. **Découverte & Fiches Actions** : Consultations des cours, secteur, statut de fraîcheur (Temps Réel, Différé, DEMO), historique des prix et des dividendes.
2. **Indicateurs Rentabilité & Valorisation** :
   - **BPA (Bénéfice Par Action / EPS)**
   - **PER (Price Earning Ratio)** avec gestion stricte des cas particuliers (PER non disponible si BPA négatif)
   - **Rendement des dividendes (%)**
3. **Simulateur d'Investissement** :
   - **Simulation Rapide** : Calcul du capital final en FCFA, plus-value et traitement des dividendes (conservés en cash ou réinvestis en nouvelles actions).
   - **Simulation Avancée** : Timeline d'opérations successives avec frais de courtage.
4. **Comparateur d'Entreprises** : Mise en concurrence de 2 à 3 actions avec identification automatique de la valeur à la plus forte progression historique.
5. **Académie Débutant** : 10 modules pédagogiques pas à pas avec mini-quizzes interactifs et suivi de progression.
6. **Authentification Multi-Canaux** :
   - Connexion E-mail / Mot de passe
   - Connexion Téléphone avec code OTP (SMS)
   - Connexion Google OAuth
   - Intégration partenaire Richbourse sous Feature Flag (`FEATURE_RICHBOURSE_AUTH`)
7. **Espace Personnel** : Sauvegarde des simulations, mémorisation des analyses et exportation en **CSV** et **PDF**.
8. **Espace Administration Protected** : Interface de contrôle de la qualité des données, détection automatique des anomalies financières (BPA négatif, retards de publication) et journal d'audit (`AuditLog`).

---

## 3. Architecture du Projet

```
/
├── server/
│   └── index.ts               # Serveur Express & middleware Vite
├── src/
│   ├── components/
│   │   ├── ui/                # Composants accessibles (Button, Modal, Tooltip, Alert, FreshnessBadge)
│   │   ├── navigation/        # Navbar, BottomNav mobile, Footer
│   │   ├── finance/           # CompanyCard, FinancialMetricCard, LifecycleStageCard, PERExplanationModal
│   │   └── charts/            # PriceHistoryChart, ComparisonChart, DividendHistoryChart
│   ├── features/
│   │   └── auth/              # AuthContext, gestion de session et feature flags
│   ├── lib/
│   │   ├── calculations.ts    # Formules PER, BPA, rendement et moteur de simulation
│   │   ├── formatters.ts      # Formateurs FCFA, %, dates en français
│   │   ├── export.ts          # Générateur CSV et PDF (jsPDF)
│   │   ├── validation.ts      # Schémas Zod
│   │   └── feature-flags.ts   # Gestion des variables d'environnement
│   ├── data/
│   │   └── demo-data.ts       # Données de démonstration boursières DEMO (SNTS, SLBC, ETIT, SGBC, etc.)
│   ├── pages/                 # Accueil, Recherche, Fiche Action, Simulation, Comparaison, Apprentissage, Auth, Profil, Admin
│   ├── App.tsx                # App principal et routage réactif
│   └── main.tsx               # Point d'entrée React
├── tests/
│   └── unit/                  # Tests unitaires des calculs financiers et formatters
├── metadata.json              # Métadonnées plateforme
└── .env.example               # Exemples de variables d'environnement
```

---

## 4. Feature Flags

```env
FEATURE_RICHBOURSE_AUTH=false
FEATURE_GOOGLE_AUTH=true
FEATURE_PHONE_AUTH=true
```

---

## 5. Commandes de Développement

```bash
# Lancement en mode dev (Serveur Express + Vite sur port 3000)
npm run dev

# Compilation pour la production
npm run build

# Démarrage de l'application compilée
npm run start

# Vérification du typage TypeScript
npm run lint
```

---

## 6. Mentions Légales & Avertissement

Les simulations, analyses et données présentées dans BourseClair sont fournies à titre strictement pédagogique et éducatif. Elles ne constituent en aucun cas un conseil en investissement ou une incitation à acheter ou vendre des titres financiers à la BRVM.
