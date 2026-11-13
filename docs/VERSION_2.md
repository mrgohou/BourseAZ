# Bourse Facile 2.0 — contenu et sources

Version Android ARM64 de test, 11 novembre 2026. Flutter Material 3, cinq onglets. Aucun ordre réel, aucun paiement. Le code iOS est fourni mais sa compilation et sa validation exigent macOS/Xcode.

## Contenu repris et développé

| Site web | Application mobile 2.0 |
| --- | --- |
| Accueil, recherche, fiches sociétés | Indices, répartition de séance, volumes, hausses/baisses, recherche, filtres sectoriels, favoris, fiches complètes |
| Analyse et comparaisons | Comparaison de 2 à 4 actions : cours, variation quotidienne/annuelle, PER, rendement net et dividende publiés |
| Croissance et finances des sociétés | Dernières publications financières officielles, extraits textuels des résultats/croissance, lecteur PDF, recherche dans le rapport et lien original |
| Dividendes | Derniers paiements mentionnés au bulletin, montants nets et dates ; aucun futur versement inventé |
| Historique | Consultation d’une séance choisie dans les archives des bulletins ; aucun graphique aléatoire ou historique reconstitué sans source |
| Simulations, DCA et capitalisation | Versements réguliers, scénarios négatifs ou positifs, frais saisis, courbe de projection explicitement hypothétique, sauvegardes locales |
| Calculateur de frais | Aucun barème universel présumé ; calcul selon les taux, minimums et assiettes saisis |
| Profil investisseur | Questionnaire éducatif sans rendement cible ni promesse de garantie |
| Académie et parcours guidé | Les 6 modules du site repris et relus, 4 leçons d’approfondissement et 5 étapes du premier investissement, 15 quiz expliqués |
| Lexique | 23 notions reprises, corrigées pour retirer les chiffres non vérifiés et les affirmations de rendement garanti |
| SGI, informations et suivi personnel | Annuaire BRVM en ligne, avis/communiqués officiels, portefeuille saisi par l’utilisateur, seuils de cours locaux |

Les interfaces d’administration du web et les fausses données qu’il contient ne sont pas transportées dans l’application grand public. L’IA ne produit ni cours, ni statistiques financières, ni recommandations présentées comme officielles.

## Provenance et actualisation

- Cours : https://www.brvm.org/fr/cours-actions/0 ; clôture, ouverture, cours précédent et volumes sont distingués. Indices : page d’accueil BRVM. Les dates des deux publications doivent correspondre.
- Compléments : bulletin officiel https://bfin.brvm.org/boc/BOC_JOUR/BOC_AAAAMMJJ.pdf. La date du texte est vérifiée. Les colonnes sont extraites par coordonnées, puis la clôture et la variation sont rapprochées des cours officiels HTML. Une modification de maquette ou une discordance laisse les indicateurs concernés indisponibles.
- Les titres sans échange peuvent présenter « SP » dans le PDF : la référence précédente n’est retenue que lorsque le volume publié est nul, et l’interface indique l’absence d’échange.
- Dernier dividende payé ≠ dividende futur. Le rendement publié peut concerner une ancienne distribution ou une opération exceptionnelle. La croissance des résultats ≠ performance du cours.
- Rapports : pages BRVM des émetteurs, documents officiels liés. Les extraits de texte conservent les libellés ; les tableaux et notes du PDF original font référence. Les documents numérisés peuvent ne pas être extractibles. Limites : 18 Mo, 100 premières pages de texte, documents de 350 pages maximum.
- Académie : rédaction Bourse Facile, revue le 11/11/2026, avec références BRVM ; il ne s’agit pas de quiz officiellement publiés par la BRVM. Aucune hypothèse chiffrée n’est présentée comme une donnée actuelle d’un émetteur.
- Chargement au lancement et à la reprise, vérification périodique après environ 15 minutes pendant l’utilisation, actualisation manuelle. Les données officielles peuvent être différées : aucune promesse de temps réel.
- Cache HTML de 15 minutes, regroupement des requêtes simultanées, caches PDF limités, deux lectures PDF simultanées maximum. L’application ne télécharge pas à nouveau le même bulletin à chaque geste.
- Aucun jeu de cours incorporé à l’APK. Au premier lancement hors connexion, aucun cours ne s’affiche. Seuls les derniers instantanés officiels déjà reçus peuvent être conservés ; date et état réseau restent visibles. Le cache de démonstration de la v1 est ignoré.

## Limites opérationnelles

L’APK fonctionne directement avec les publications HTTPS BRVM et ne dépend pas du serveur Google AI Studio actuel. Aucun secret n’est intégré. Les anciens flux web/gateway v1 ne sont pas utilisés par cette version et ne constituent pas une source financière validée pour elle.

Cette intégration ne constitue pas un flux boursier sous contrat et reste dépendante de la disponibilité et du format des publications officielles. La capacité de la BRVM à servir 1 000 clients simultanés n’est pas garantie ni testée. Avant une diffusion à cette échelle, prévoir une collecte centralisée autorisée et un cache partagé/CDN ; vérifier les droits de redistribution. Aucun déploiement de serveur ni modification du site en production n’a été effectué ici.

Le portefeuille et les seuils restent sur l’appareil. Les seuils ne déclenchent aucune notification en arrière-plan. Les données personnelles ne sont pas synchronisées avec le site. Les simulations ne sont pas des cours de démonstration : ce sont des calculs à partir d’hypothèses saisies par l’utilisateur.

## Paquet de téléchargement

Le téléchargement public de la version 2 est une archive ZIP contenant l’APK signé intact. Extraire `BourseFacile.apk` avant de l’installer. L’archive permet de respecter la limite de taille de traitement des fichiers individuels de l’API GitHub, sans modifier le programme Android.
