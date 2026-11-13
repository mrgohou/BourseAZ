# Bridge Securities — sources vérifiées et intégration

Priorité confirmée par l’utilisateur : **Bridge Securities**. Vérification du 11 novembre 2026.

## Identité et plateforme officielles

- Référencement BRVM : https://www.brvm.org/fr/intervenants/sgi/tous?page=1 — entrée « BRIDGE SECURITIES », domaine `www.bridge-securities.com`.
- Présentation de l’application par la SGI : https://www.bridge-securities.com/nos-offres/nos-outils.
- Nom annoncé : **BS Trade** ; lien officiel : https://bstrade.bridge-securities.com/.
- La page publique BS Trade a répondu HTTP 503 depuis cet environnement. Cela ne démontre ni une panne pour tous les clients ni l’absence d’une API partenaire.

Le nom « Bridge Bourse Direct » figurant dans les anciennes données du site Bourse Facile n’est pas retenu comme preuve : la source de Bridge annonce BS Trade.

## Barème publié

Page de référence : https://www.bridge-securities.com/devenir-client.

PDF officiel : https://www.bridge-securities.com/images/documents/tarification-compte-titre.pdf.

Le fichier téléchargé répond HTTP 200, type PDF, 281 454 octets. SHA-256 du document consulté : `aa73b7041359d2e00a775fd8e5c23ee143cdaf3a5b99e8eab35c7f01a5909f8c`.

Extraits de l’annexe II « Tarification », tels qu’ils apparaissent dans ce document :

| Rubrique | Base indiquée | Valeur publiée |
| --- | --- | --- |
| Courtage sur transactions ordinaires | Montant de la transaction | Fourchette 0,80 % à 1 % |
| Courtage sur transaction sur dossier | Montant de la transaction | Fourchette 0,50 % à 0,80 % |
| Conservation | Valeur du portefeuille d’actifs | Fourchette 0,10 % à 0,20 % |
| Tenue de compte | Forfait par ligne | Gratuit |
| Ouverture de compte | Forfait par ligne | Gratuit |
| Clôture de compte | Forfait par ligne | 15 000 FCFA |
| Transfert de titres | Forfait par ligne | 10 000 FCFA |
| Bourse en ligne | Mensuel | 1 000 FCFA |

L’annexe consultée ne donne pas de date d’effet explicite ni de périodicité claire pour la conservation ; aucun caractère annuel ou trimestriel n’est ajouté. Les fourchettes ne permettent pas de déduire le taux négocié d’un client. Vérifier la fiscalité, l’assiette et les conditions applicables dans son contrat.

Les anciennes estimations de tenue de compte à 2 500 FCFA/trimestre et de garde à 0,50 %/an ne sont pas reprises dans l’application comme tarifs officiels. Le minimum de dépôt affiché dans les données du site n’est pas validé par cette seule annexe.

L’application charge le PDF officiel dans son lecteur. Les taux ne sont pas codés comme des tarifs clients universels ou garantis, et ne sont pas automatiquement appliqués au portefeuille. Le bouton de BS Trade ouvre le navigateur chez la SGI ; il n’effectue ni connexion déléguée ni synchronisation.

## API de synchronisation

Aucune documentation publique d’API tierce de positions ou transactions n’a été identifiée dans les pages officielles consultées. Un portail client et les API internes qu’il pourrait utiliser ne constituent pas une autorisation d’intégration pour Bourse Facile. La possibilité d’une API partenaire reste à confirmer directement avec Bridge.

Éléments nécessaires avant une implémentation réelle :

1. Accord d’intégration et documentation officielle des accès en lecture seule, conditions d’usage, coûts et quotas.
2. Méthode d’autorisation prévue par Bridge, environnement de test et procédure de consentement/révocation par le client. Aucun mot de passe BS Trade à collecter dans Bourse Facile.
3. Schémas des positions, transactions, prix d’exécution, frais, taxes et opérations sur titres ; identifiants stables, pagination/cursor et date de dernière mise à jour.
4. Traitement des fractionnements et rapprochement des quantités. Si l’API ne fournit qu’un PRU agrégé, conserver une position agrégée plutôt que d’inventer des achats historiques ; distinguer le PRU communiqué par la SGI du cours moyen calculé hors frais dans l’application.
5. Serveur de synchronisation avec secrets protégés, accès par UID, imports idempotents et journal de consentement. Réessais limités et dernière synchronisation réussie visible. Aucun ordre d’achat/vente dans ce périmètre.

Le contact `serviceclients@bridge-securities.com` est publié sur le site officiel. Aucun message ni demande n’a été envoyé en ton nom.
