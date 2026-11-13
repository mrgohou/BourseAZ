# Bourse Facile 0.0.3 — refonte visuelle

## Direction retenue

Références : les images et trois liens Pinterest fournis par l’utilisateur. Les pages Pinterest ont refusé leur lecture depuis l’environnement ; l’analyse visuelle s’appuie donc sur les images jointes. La compétence UI/UX Pro Max a servi pour les règles d’accessibilité, les états, les espacements et la revue mobile. Son utilitaire de recherche n’était pas fourni parmi les ressources accessibles ; les choix ci-dessous ont été définis à partir des références et de ses instructions.

- Fond gris très clair `#F4F6F5`, cartes blanches, encre vert profond `#103C30`, accent citron `#D1F88C`, surfaces menthe `#E5F1EB`.
- Police **Manrope**, distribuée avec sa licence SIL Open Font License ; chargement local, sans dépendance à Google Fonts au démarrage.
- Titres 30/26/20 dp, texte courant 14–16 dp, métadonnées 12 dp, chiffres tabulaires pour les cours et montants. Titres plus mesurés que dans la version précédente.
- Cartes à rayon de 24 dp, contrôles à 18 dp, grilles à espacement de 12 dp et marges de 16/20 dp selon le téléphone.
- Une rangée de cartes conserve une hauteur commune. Les grilles passent à une colonne lorsque la largeur ou la taille du texte le demande.
- Navigation Material 3 placée dans une surface arrondie, avec cinq destinations nommées, état actif citron et zones tactiles natives. Barre intégrée au layout, sans recouvrir la liste ; zone système conservée. En texte très agrandi, les icônes conservent leurs infobulles et le libellé court de la destination active reste visible pour éviter les mots coupés.

## Écrans et usages

- **Accueil** : indice principal, variation de séance, indices secondaires, raccourcis actions/portefeuille/dividendes/actualités, répartition des variations, volumes, favoris, sources et progression pédagogique.
- **Marché** : recherche courte, prix alignés, symbole puis dénomination, variations avec flèche et signe. Secteurs et tri regroupés derrière « Filtres et tri » pour donner la priorité aux titres. Favoris et comparaison restent disponibles.
- **Entreprise** : nom, cours et variation réunis dans une carte de synthèse ; informations, rapports et sources conservés.
- **Portefeuille** : valorisation, plus-value, nombre de sociétés et quantité dans un résumé lisible ; tous les achats, cours moyens, formules pédagogiques et totaux restent disponibles. Aucune formule financière modifiée.
- **Apprentissage** : progression réelle dans un anneau et parcours de leçons existant. L’anneau décrit des leçons validées, jamais un rendement financier.
- **Simulation et espace personnel** : en-têtes, contrôles et accès réorganisés avec le même système visuel. Les autres écrans héritent de la même typographie, des mêmes cartes, boutons et états.

## Données et authentification

Les sources BRVM / Bridge, les limites de cache, l’authentification Firebase et le stockage chiffré par compte restent utilisés. Aucun compte, cours, historique ou rendement fictif n’est ajouté à l’APK. Les barres du marché représentent le nombre effectivement publié d’actions en hausse, en baisse et inchangées. Les barres d’épargne restent explicitement des simulations.

Le dernier `google-services.json` transmis par l’utilisateur a passé le contrôle du projet, du package Android, du client web et du SHA-1. L’APK conserve ce même package, ce même client web et la même signature de test. La configuration cohérente ne constitue pas à elle seule une preuve de connexion sur téléphone ; aucun test avec un compte Google réel n’a été effectué dans cet environnement.

## Vérification et revue

La suite complète et les contrôles spécifiques de contraste, petits écrans, paysage, thème sombre, texte à 200 % et filtres sont exécutés avant livraison. Les résultats détaillés et l’intégrité/signature de l’APK sont livrés avec les fichiers privés de vérification.

Les captures réutilisent les composants de production et des publications officielles BRVM du 11 novembre 2026. Les comptes et achats d’illustration sont limités à l’outil de revue, clairement distinct de l’entrée `lib/main.dart` de l’APK. Pour accélérer la revue de design quand le bulletin PDF est indisponible, le paramètre local `skipBulletin=1` conserve les cours HTML officiels et laisse les ratios manquants absents. Il n’existe pas dans le parcours utilisateur de l’APK.

## Publication

La livraison publique dans `mrgohou/BourseAZ` contient uniquement l’APK Android ARM64 et son ZIP. Sources, captures, outils de réparation et rapports restent des fichiers locaux de livraison. Les versions précédentes sont conservées.
