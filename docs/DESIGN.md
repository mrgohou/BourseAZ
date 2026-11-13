# Design system

Inspiration des références fournies : vert citron, vert profond, surfaces claires, chiffres lisibles, espaces généreux et formes arrondies. Identité Bourse Facile ; aucune reprise de logo Wise. Compétence UI/UX Pro Max appliquée à l’accessibilité, au tactile et à la hiérarchie ; Flutter/Material 3 sont les choix validés.

| Token | Clair | Sombre |
|---|---|---|
| Primary | `#163300` | `#B9EF70` |
| Accent | `#B9EF70` | `#B9EF70` |
| Texte sur accent | `#163300` | `#163300` |
| Fond | `#F4F6F0` | `#10170D` |
| Surface | blanc | `#151D12` |
| Texte secondaire | `#52614A` | `#BAC8AF` |

Tokens dans `lib/core/theme.dart`. Pas de texte blanc sur citron. Typographie système Material, corps de 16 px, chiffres tabulaires pour les cours, unités FCFA explicites. Espacement 4/8 dp, marges 24 dp, arrondis 28 dp, contenu limité à 720 dp sur tablette.

Quatre destinations : Accueil, Marché, Simuler, Apprendre. Recherche, filtre sectoriel et favoris ; simulation locale avec hypothèses, frais et sauvegarde ; quatre leçons hors ligne et quiz ; préférences d’apparence et effacement local confirmé.

- Navigation Material 3, retour Android prévisible, état conservé entre onglets.
- Cibles tactiles de 48 dp, zones sûres natives, claviers numériques et validation près des champs.
- Chargement, coupure réseau et date source visibles ; exemples explicitement étiquetés.
- Mode clair/sombre, taille de texte système ; pas de réduction forcée du texte.
- Signes +/− en complément des couleurs ; résumé textuel des projections pour lecteur d’écran ; actions nommées.
- Pas de geste indispensable sans alternative visible, ni d’animation décorative imposée.
- Les graphiques montrent des scénarios calculés, jamais une courbe de marché inventée.

Le script de recherche du skill cloud n’est pas installé dans le dépôt. Ses règles ont été appliquées directement ; aucune sortie fictive du script n’est présentée.
