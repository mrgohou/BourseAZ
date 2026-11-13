# Bourse Facile 0.0.5 — Apprendre et fiches officielles

## Apprendre

Rubrique « Quiz & flashcards » : 23 cartes du lexique, 15 questions des leçons, recto/verso, auto-évaluation de session, navigation précédente/suivante, explications et références BRVM. Seule une réponse correcte valide la leçon correspondante ; aucune validation au simple retournement. Design, accents pastel, illustrations originales et animations à mouvement réduit conservés.

## Sources du marché

Relecture du site boursefacile.ai.studio le 12 novembre 2026. Son endpoint de cotations indiquait RichBourse comme fournisseur et comportait des valeurs d'initialisation : il n'est pas utilisé comme preuve officielle. Les cours restent tirés des pages BRVM.

La découverte des bulletins utilise maintenant les liens PDF réellement publiés sur la liste officielle, plutôt qu'une adresse bfin déduite. Date du PDF vérifiée et au moins 30 lignes reconnues. Enrichissement du tableau courant uniquement pour la même séance et un cours/une variation concordants. La fiche entreprise peut présenter un bulletin plus ancien, avec sa date séparée du cours actuel. Les références de paiement, rendement, PER et variation annuelle sont reprises du bulletin, sans reconstruire un BPA à partir d'un PER arrondi. Rejet des cellules ambiguës comportant un chiffre de note accolé (par exemple « 704 1 »).

## Dividendes

Les six pages récentes des avis BRVM sont consultées, requêtes mutualisées et cache HTML de cinq minutes. Rapprochement par nom canonique exact et quelques alias contrôlés, sans correspondance approximative entre banques de pays différents. Avis, exercice, net par action, dates de paiement/détachement et PDF officiel. Historique explicitement partiel ; aucun résultat ne signifie pas zéro dividende. Les avis annoncent le paiement, sans attester le crédit au compte personnel.

## Comptes annuels et limites de couverture

**BPA, PBR et ROE vérifiés : Sonatel uniquement dans cette version.** Aucun ratio inventé pour compléter les autres sociétés. Leurs PER et dividendes peuvent être disponibles au BOC, et les rapports officiels restent accessibles dans Finances.

L'observation Sonatel est une transcription revue des comptes consolidés 2025 publiés par la BRVM le 16/02/2026, pages PDF 20 et 23. Il ne s'agit pas d'une extraction générique ni d'une synchronisation automatique des comptes annuels. L'année et la date de revue sont visibles ; une nouvelle publication exige une nouvelle validation de l'observation. Les cours, bulletins et avis de dividendes sont eux récupérés sur le réseau.

- BPA de base publié : 3 420 FCFA ; après fractionnement du 26/10/2026 : 342 FCFA.
- Résultat net part des propriétaires : 341 963 millions FCFA.
- Capitaux propres part des propriétaires : 1 160 715 millions fin 2025 ; 1 050 347 millions fin 2024.
- ROE calculé sur capitaux moyens : 30,9320 %.
- Actif net/action ajusté : 1 160,715 FCFA. PBR = cours courant / cet actif net/action ; date du cours et clôture comptable affichées. Actions auto-détenues non retraitées.
- Avis 304/2026 BRVM : 100 millions deviennent 1 milliard d'actions (10 pour 1), effet le 26/10/2026.
- Avis de paiement 2025 : 1 740 FCFA nets, paiement 26/05/2026 ; BOC du 11/11/2026 : 174 FCFA sur base ajustée.
- PER officiel du BOC conservé tel que publié : il peut employer un autre périmètre de résultat que le BPA part du groupe ; les deux ne sont pas recomposés entre eux.

Les sources exactes, pages, unités et empreintes SHA-256 figurent dans assets/content/annual_observations.json et dans le dossier privé de vérification. Aucune donnée de démonstration n'est intégrée dans le flux de marché.

## Distribution

APK Android ARM64, version 0.0.5+8, code APK 2008, Android 7 minimum. Signature de test conservée pour la mise à jour des versions précédentes. La connexion Google sur téléphone et l'installation matérielle ne sont pas déclarées testées. Le ZIP des captures peut montrer des portefeuilles fictifs uniquement dans l'outil de revue ; ces comptes et achats ne sont pas inclus dans l'APK.
