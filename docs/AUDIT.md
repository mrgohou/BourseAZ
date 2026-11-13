# Inspection du dépôt BourseAZ

> Rapport initial conservé comme référence. Les corrections de la deuxième livraison sont décrites dans [CORRECTIONS.md](../../docs/CORRECTIONS.md), avec leur procédure Google AI Studio. Les constats ci-dessous correspondent au commit d’origine, pas à une affirmation que toutes ces erreurs restent présentes.

Inspection statique du commit `9944fa867f665ef98a1569e470a2d5a625f7b65d`, le 10 novembre 2026. Aucun test d’exploitation ou de charge contre le site réel, aucun envoi d’e-mail et aucune lecture de données privées. Le dépôt ne prouve pas les règles effectivement déployées.

| Priorité | Repère | Constat | Correction recommandée |
|---|---|---|---|
| Critique côté interface | `src/features/auth/AuthContext.tsx`, `loginGoogle`, lignes 580–728 | Une adresse passée en argument crée une identité sans OAuth ; un échec de popup fabrique un profil local ADMIN. | Supprimer ces chemins, utiliser uniquement l’identité Firebase et ses claims vérifiés. Ceci ne démontre pas un accès administrateur serveur : `requireAdmin` vérifie un jeton Firebase. |
| Élevée | Même fichier, `loginEmail`, lignes 448–477 | Après échec Firebase, une adresse contenant `boursefacileapp` peut obtenir un rôle administrateur local. | Isoler les exemples de toute authentification et de toute API privée. |
| Élevée | Même fichier, `verifyOtpPhone`, lignes 546–577 | Le code OTP est vérifié sur son format, puis un profil est créé localement. | Vérification effective via Firebase Phone Auth ou suppression de ce mode. |
| Élevée | `server/routes/api.ts`, lignes 759 et suivantes | `/auth/email-history` lit `mail_deliveries` avec Admin SDK sans middleware d’authentification. | Si la base est configurée, exposition possible de métadonnées. Authentifier et filtrer par propriétaire ; réserver l’audit global aux administrateurs. |
| Élevée | Même fichier, lignes 717 et suivantes | `/auth/send-confirmation` accepte un destinataire sans session obligatoire ni quota dédié visible. | Déduire le destinataire du jeton vérifié, limiter les envois et utiliser une file durable. |
| Élevée sous charge | Même fichier, `/news/refresh`, `/market/refresh`, paramètres `force` publics | Un visiteur peut forcer une collecte. | Collecte réservée au planificateur, lecture d’un instantané partagé pour les utilisateurs. |
| Élevée pour plusieurs instances | `market-data-publisher.ts`, `market-data-cache.ts`, `market-sync-engine.ts` | Publications, historique, file de validation, cache et verrous en mémoire ; moteurs démarrés dans chaque processus. | Stockage durable et planificateur séparé pour éviter pertes, divergences et collectes multipliées. |
| Moyenne | `firestore.rules`, `user_analytics` | Création anonyme autorisée sans validation visible. | Retirer la collecte inutile ou imposer schéma, App Check et quotas d’ingestion. |
| Moyenne | `firestore.rules`, `user_sessions` | La mise à jour vérifie le propriétaire de la nouvelle donnée, pas celui du document existant. | Contrôler les deux et rendre `userId` immuable. |
| Moyenne | `firestore.rules`, simulations/alertes/portefeuilles | La mise à jour vérifie le propriétaire existant mais ne contraint pas le futur `userId`. | Identité propriétaire immuable, champs autorisés et types contrôlés. |
| Moyenne | `server/middleware/auth.ts`, `firestore.rules` | Listes administrateurs différentes ; clé partagée facultative ; `Boolean(decodedToken.admin)`. | Politique commune, custom claim `admin === true`, révocation et journal d’audit. Vérifier l’e-mail s’il intervient dans la politique. |
| Moyenne | `server/routes/api.ts`, `server/index.ts` | Quotas IA par IP en mémoire ; corps JSON jusqu’à 25 Mo globalement. | Quotas distribués, limites par route et séparation des traitements coûteux. |
| Qualité des données | `getBrvmSessionInfo` | Les horaires/jours servent à déduire la séance, sans calendrier des jours fériés ni preuve de fraîcheur. | Afficher source et date ; ne pas annoncer « direct » sur cette seule base. |

## Points utiles

Les routes d’import/validation utilisent déjà `requireAdmin`. Fournisseurs, normalisation et validation sont séparés : base utile pour un pipeline durable. Le dépôt dispose d’une enveloppe Capacitor Android ; la nouvelle variante Flutter est indépendante, dans `mobile/`.

## Portée de cette livraison

Lors de la première livraison, aucun fichier du site n’avait été modifié. La deuxième livraison fournit maintenant les correctifs locaux décrits dans le rapport lié ci-dessus ; les règles de production ne sont toujours pas déployées. Le statut actuel et les limites restantes sont indiqués dans CORRECTIONS.md. La variante mobile ne reprend pas ces chemins d’authentification, n’envoie pas ses scénarios au serveur et n’expose aucune API privée. Sa passerelle accepte seulement la lecture publique d’un instantané ; aucun visiteur ne peut y déclencher scraping, IA ou e-mail. La qualité et les droits d’utilisation de la source sont à valider avant activation ; les données déclarées démo sont rejetées.
