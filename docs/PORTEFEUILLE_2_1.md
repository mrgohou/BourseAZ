# Connexion et portefeuille personnel — version 0.0.1

## Périmètre réalisé

Connexion au projet Firebase déjà utilisé par le site, via e-mail/mot de passe ou identité Google. Les mots de passe ne sont pas conservés. Firebase vérifie les identités ; un UID ou un JWT décodé localement ne suffit jamais à connecter un utilisateur. Une adresse e-mail doit être vérifiée avant l’ouverture du portefeuille.

Chaque UID Firebase dispose d’une sauvegarde chiffrée distincte : Android KeyStore/AES-GCM, trousseau iOS sur cet appareil. La déconnexion retire immédiatement les achats de l’affichage. Les anciennes saisies anonymes de la v2 ne sont pas rattachées automatiquement à un compte. Cette version ne synchronise pas encore les achats avec le web ou d’autres appareils : cette limite est affichée dans le portefeuille. Une désinstallation peut supprimer les achats locaux.

Le lien et le paramétrage du portefeuille sont réservés à l’espace personnel connecté avec adresse vérifiée. La déconnexion masque aussi un formulaire ou un sélecteur déjà ouvert et efface les saisies en cours.

Ajout : sélection explicite dans le catalogue BRVM, symbole en premier et dénomination sous le symbole, quantité entière, prix d’achat unitaire, validation. Aucun prix d’achat n’est deviné depuis le cours actuel. Plusieurs achats du même titre restent distincts et sont regroupés pour le cours moyen.

## Calculs vérifiés et validés

Les formules initialement demandées confondent un prix unitaire et un montant total. Les calculs suivants ont été vérifiés mathématiquement et par les tests automatisés ; leur adoption a été confirmée par l’utilisateur :

1. Montant investi pour un achat = quantité × prix d’achat unitaire.
2. Cours moyen pondéré d’un titre = somme des montants investis dans ce titre ÷ quantité totale de ce titre.
3. Plus-value par action = cours actuel publié − cours moyen.
4. Plus-value totale du titre = plus-value par action × quantité détenue.
5. Plus-value totale du portefeuille = somme des plus-values des titres.
6. Rentabilité latente = plus-value ÷ montant investi × 100.

Vérification : pour un titre, si `Q = somme des quantités` et `I = somme(quantité × prix unitaire)`, alors le cours moyen est `I / Q`. Avec le cours actuel `P`, la plus-value totale vaut `Q × (P − I/Q) = Q × P − I`, soit exactement la valeur actuelle moins le capital investi. Les calculs de gain utilisent cette dernière égalité afin de ne pas multiplier un cours moyen préalablement arrondi.

Exemple de contrôle, uniquement documentaire et testé : 10 actions à 4 000 FCFA puis 20 à 5 000 FCFA représentent 140 000 FCFA investis pour 30 actions. Le cours moyen exact est 140 000 / 30 (affiché 4 666,67 FCFA). À 6 000 FCFA, la valeur actuelle est 180 000 FCFA et la plus-value totale est exactement 40 000 FCFA.

Ces définitions concernent les positions saisies encore détenues, sans frais, fiscalité ni dividendes. Une vente partielle ou une opération sur titres nécessite une mise à jour des positions ; ces opérations ne sont pas reconstituées automatiquement.


L’écran présente les trois sections demandées et affiche les formules pédagogiques dans les sections 2 et 3. Les calculs conservent la précision complète, même si le cours moyen affiché est arrondi. Un cours absent rend le total concerné indisponible, jamais nul par défaut. Frais, fiscalité et dividendes ne sont pas inclus dans ces plus-values. Aucun ajustement automatique des fractionnements n’est inventé.

## Activation de Google — intervention du propriétaire Firebase

La configuration publique du projet `third-storm-9w532` a été vérifiée en lecture seule. Aucun compte réel ni e-mail n’a été créé ou envoyé pendant les tests. L’activation réelle de Google sur mobile nécessite l’enregistrement de l’application et de sa signature dans la console du propriétaire :

- Console : https://console.firebase.google.com/project/third-storm-9w532/settings/general
- Android : `ci.boursefacile.bourse_facile_mobile`.
- SHA-1 de la signature de développement des APK de test : `80:C2:C5:37:3B:9D:72:A8:8C:56:27:AB:CD:5F:74:61:9E:64:20:B9`.
- Pour une publication, enregistrer également la signature de production/Play App Signing correspondante.
- Vérifier que les méthodes Google et E-mail/mot de passe sont activées dans https://console.firebase.google.com/project/third-storm-9w532/authentication/providers.

Le client OAuth web public existant est fourni comme `serverClientId`. Aucun fichier de compte de service ou secret administrateur ne doit être intégré à l’application.

Pour iOS : enregistrer `ci.boursefacile.bourseFacileMobile` dans le même projet, obtenir son client OAuth de type iOS et exécuter :

```sh
python tool/configure_google_ios.py --client-id VOTRE_CLIENT_IOS.apps.googleusercontent.com
```

Le script ajoute les identifiants publics Google et le schéma de retour dans Info.plist. Les entitlements du trousseau sont configurés. La compilation et la validation iOS nécessitent macOS/Xcode et la signature Apple du propriétaire.

## Contrôles

Les tests couvrent la vérification Firebase, l’absence de connexion par simple cache local, l’isolation entre comptes, les réponses tardives après déconnexion, les pannes de stockage, la saisie et la sélection des titres, les achats multiples, pertes, cours manquants, arrondis et grands montants, ainsi que l’affichage à 320 px avec texte à 200 %.

Les faux fournisseurs d’identité utilisés par les tests et la prévisualisation sont exclusivement dans `test/` et dans le point d’entrée de revue `tool/review_main.dart`. Le point d’entrée de l’APK est `lib/main.dart` et utilise le véritable fournisseur Firebase. Aucun compte fictif ni portefeuille prérempli n’est intégré au parcours de production.
