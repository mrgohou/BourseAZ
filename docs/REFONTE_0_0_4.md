# Bourse Facile 0.0.4 — accents, graphiques et microanimations

## Périmètre respecté

La structure visuelle 0.0.3 reste la référence : écrans, hiérarchie, typographie Manrope, marges, grille, navigation et rayons de cartes sont conservés. La palette vert profond / citron reste dominante. Les ajouts se limitent aux accents demandés, aux icônes, à de courts retours de mouvement et à l’enrichissement interne des graphiques.

## Accents secondaires

| Ton | Surface claire | Texte / trait clair | Usage |
| --- | --- | --- | --- |
| Bleu clair | `#E3F2FC` | `#235674` | Marché, graphique et contrôles de lecture |
| Rose clair | `#FBE9F0` | `#81445E` | Actualités, simulation et indicateurs secondaires |
| Marron clair | `#F2E9DF` | `#705035` | Portefeuille, frais et versements |
| Jaune clair | `#FFF5CD` | `#705A12` | Calendrier, apprentissage et réussite d’un quiz |

Les variantes sombres disposent de leurs propres surfaces et textes. Les statuts financiers positifs/négatifs conservent leurs signes, flèches et couleurs sémantiques ; un accent décoratif ne remplace pas un signal de perte. Les cartes chiffrées, les raccourcis, les contrôles secondaires et les onglets sélectionnés emploient les accents.

## Icônes 3D et mouvement

Six objets 3D originaux ont été générés : marché, portefeuille, calendrier, actualités, livre et trophée. L’atlas PNG transparent est embarqué localement ; les six cellules partagent le même fichier et le cache d’image Flutter. Des icônes Material de repli restent disponibles si le décodage échoue. Aucun personnage, logo ou fichier de Duolingo n’est repris.

L’inspiration Duolingo concerne la qualité du retour : appui doux sur une carte (120 ms), progression pédagogique animée (440 ms), retour encourageant de quiz (220–340 ms) et vibration légère après une réponse correcte. Les animations ne bouclent pas et ne retardent pas l’action. La préférence système de réduction des animations supprime ces transitions et la vibration de célébration. La disposition ne dépend pas d’un mouvement pour être comprise.

## Graphiques et courbes

Le graphique de simulation reste à son emplacement dans le résultat et présente désormais :

- une courbe à segments arrondis ou des barres sélectionnables ;
- une échelle commune depuis zéro et des axes annuels en FCFA ;
- une série « valeur simulée » et une série distincte en pointillés « versements bruts » ;
- un repère et un curseur de lecture pour chaque année calculée ;
- une valeur exacte affichée pour l’année sélectionnée, en complément des graduations compactes ;
- une légende et une alternative de lecture accessible au toucher et au clavier.

Les points viennent exclusivement des valeurs annuelles du calcul existant. Aucun lissage ne crée de nouveau sommet ou creux et aucun historique boursier n’est inventé. Les versements bruts sont `capital initial + mensualité × 12 × année`. La courbe de valeur tient compte des hypothèses de rendement et frais du modèle déjà utilisé, sans modification de ses formules.

Les barres du marché affichent le nombre et la part des actions dans chaque catégorie, sur le total de la séance. La comparaison des cours publiés garde une échelle commune depuis zéro et distingue visuellement cours précédent, ouverture et clôture.

## Vérification et livraison

Contrôles : contrastes des quatre accents dans les deux thèmes, courbes de perte et versements sur une même échelle, valeurs absentes/infinies rejetées, sélection annuelle et changement de vue à 200 % de texte, mouvement réduit immédiat et parcours existants.

Les captures emploient les publications BRVM de référence du 11 novembre 2026 et des comptes / achats réservés à la revue. Les montants de simulation sont des hypothèses entrées dans cet outil de revue. Ces données ne sont pas des valeurs initiales dans l’APK. Les cours de l’application restent chargés depuis ses sources officielles.

La signature Android et le package restent identiques. Les ZIP publics utilisent les archives natives du dépôt `mrgohou/BourseAZ` avec téléchargement forcé ; les sources et rapports techniques restent locaux.
