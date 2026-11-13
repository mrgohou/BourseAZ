# Réparation de la connexion — APK 0.0.2

Les deux captures montrent un retour Google interrompu et un refus de création de compte par e-mail. L’APK utilise le même projet Firebase et le même client web que le site. Les paramètres d’authentification du projet et l’enregistrement OAuth Android doivent être contrôlés par son propriétaire.

## Constats vérifiés

- Projet : `third-storm-9w532`, numéro `633926810372`.
- Le 11 novembre 2026, `accounts:createAuthUri` renvoie HTTP 200, le fournisseur `google.com`, le domaine `accounts.google.com` et le client web attendu. Aucun utilisateur n’a été connecté.
- Le domaine `boursefacile.ai.studio` figure dans les domaines autorisés renvoyés par l’API publique. Il n’est pas nécessaire de supprimer ou de remplacer cette liste.
- Le message e-mail affiché dans la capture est produit pour `OPERATION_NOT_ALLOWED` ou `CONFIGURATION_NOT_FOUND`. L’application ne dispose pas des paramètres administratifs permettant de distinguer la configuration exacte à partir de cette seule capture.
- Les requêtes de diagnostic avec une adresse syntaxiquement invalide ont répondu `INVALID_EMAIL`. Ce résultat ne prouve pas que le fournisseur e-mail est activé : la validation de l’adresse peut précéder celle du fournisseur. Aucun compte de test n’a été créé.
- Le SDK Google peut renvoyer `canceled` pour une annulation volontaire **ou** certains défauts de configuration Android. La capture ne permet donc pas de conclure que l’utilisateur a annulé ou que le SHA-1 est forcément absent.
- Aucun accès administrateur Firebase / Google Cloud n’est configuré dans l’environnement de travail. Aucun réglage du projet n’a encore été modifié et aucune connexion sur téléphone n’a été validée.

## Correction depuis la console Firebase

1. Ouvrir [Authentication → Fournisseurs de connexion](https://console.firebase.google.com/project/third-storm-9w532/authentication/providers). Dans **Adresse e-mail/Mot de passe**, activer le mode par mot de passe puis enregistrer. Le lien magique par e-mail est facultatif et ne remplace pas cette méthode. Vérifier aussi que l’inscription de nouveaux utilisateurs est autorisée si une restriction a été configurée.
2. Dans cette même page, vérifier **Google** et conserver son client web existant. Ne pas régénérer son secret ni créer un autre projet pour contourner la configuration.
3. Ouvrir les [paramètres généraux du projet](https://console.firebase.google.com/project/third-storm-9w532/settings/general). Enregistrer ou sélectionner l’application **Android** dont le package exact est :

   ```text
   ci.boursefacile.bourse_facile_mobile
   ```

4. Ajouter les deux empreintes du certificat qui signe l’APK 0.0.2 déjà téléchargé :

   **SHA-1**

   ```text
   80:C2:C5:37:3B:9D:72:A8:8C:56:27:AB:CD:5F:74:61:9E:64:20:B9
   ```

   **SHA-256**

   ```text
   A5:EC:D7:EC:8E:27:3C:A1:F5:2E:9C:6B:D2:25:60:5C:E8:7D:50:7A:06:A4:9D:40:BE:8F:1A:BA:D2:5D:40:15
   ```

5. Télécharger le `google-services.json` de cette application Android et le vérifier avec `python tool/check_google_android.py --config chemin/vers/google-services.json`. Le fichier doit comporter le client OAuth Android du même package et SHA-1, ainsi que le client OAuth web déjà utilisé :

   ```text
   633926810372-llrqiu8i3jsk22v0mvm6vjf98lbeomts.apps.googleusercontent.com
   ```

   Si le client OAuth Android n’a pas été créé, le vérifier dans [Google Auth Platform → Clients](https://console.cloud.google.com/auth/clients?project=third-storm-9w532), puis créer le client Android avec le package et le SHA-1 ci-dessus. Le client web reste celui du site. Une empreinte d’une autre machine ou d’une autre clé ne correspond pas à l’APK installé.
6. Sur le téléphone, fermer puis rouvrir Bourse Facile et tester l’APK existant. Les réglages ci-dessus sont côté serveur ; le fichier JSON ne se copie pas dans le téléphone et sa présence dans le code ne remplace pas l’enregistrement du certificat.

## Outil facultatif depuis Google Cloud Shell

Le fichier `tool/repair_firebase_auth.py` utilise uniquement les API officielles Firebase Management et Identity Toolkit Admin v2, avec le compte Google déjà authentifié dans Cloud Shell. Il ne demande ni mot de passe, ni clé de compte de service, ni secret OAuth ; aucun jeton n’est enregistré ou imprimé.

Téléverser ce fichier dans [Cloud Shell du projet](https://console.cloud.google.com/cloudshell/editor?project=third-storm-9w532), puis lancer d’abord le diagnostic **en lecture seule** :

```sh
python3 repair_firebase_auth.py
```

Après lecture du résultat, appliquer la réparation ciblée :

```sh
python3 repair_firebase_auth.py --apply
```

Le mode `--apply` active l’authentification e-mail si nécessaire, autorise l’inscription si elle est bloquée, active le fournisseur Google existant, enregistre le package Android exact s’il est absent et ajoute les empreintes manquantes. Les mises à jour utilisent des masques de champs précis. Les autres fournisseurs, domaines autorisés, règles de base de données, secrets Google et paramètres de lien e-mail sont conservés. L’outil refuse un autre projet ou un client Google web différent de celui de l’APK ; il ne remplace pas ces éléments silencieusement.

Il relit les paramètres après modification et contrôle le client Android dans la configuration publique. Si la création du client OAuth Android ne se fait pas automatiquement, son indicateur `android_oauth_matches_apk` reste faux ; terminer alors l’étape 5 dans la console. Un HTTP 401/403 nécessite le compte administrateur du bon projet. Ne pas transmettre le jeton d’accès dans une conversation.

Les 8 tests unitaires du réparateur passent avec un service simulé : lecture seule par défaut, champs conservés, pagination de l’annuaire des applications, idempotence, refus du mauvais projet ou client, absence de faux succès si OAuth Android manque et arrêt en cas de création refusée. Ces tests ne constituent pas une exécution administrative réelle.

## Validation sur le téléphone

- Créer un compte e-mail avec sa propre adresse, ouvrir le lien de vérification, confirmer dans l’application et vérifier l’accès au portefeuille.
- Se déconnecter et vérifier que le portefeuille privé n’est plus accessible, puis se reconnecter par e-mail.
- Tester Google en choisissant un compte. Si la fenêtre se ferme encore, vérifier le client Android, le package et le certificat avant de demander un journal filtré du SDK ; ne jamais partager de jetons ni de mots de passe.
- Vérifier qu’une annulation volontaire n’ouvre pas une session et qu’un échec n’efface pas les positions déjà enregistrées.

La réparation reste à appliquer par le propriétaire ou via un accès administrateur officiellement connecté. Aucune nouvelle version d’APK n’est présentée comme une solution à des paramètres serveur encore non vérifiés.
