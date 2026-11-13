# Bourse Facile — sources complètes v0.0.5+8

Projet Flutter de l'application mobile Android/iOS, avec ses ressources graphiques, polices et licences, contenus pédagogiques, code natif PDF, tests, documentation, plugins locaux et fichiers de compilation. Le dossier web/ est le support Flutter Web, pas le site React d'origine.

## Ouvrir et compiler

Installer Flutter et Android Studio, puis ouvrir ce dossier dans Android Studio ou VS Code. Chaîne utilisée pour l'APK v0.0.5 : Flutter 3.47.9, Dart 3.13.7, Java 21, Android SDK 36, NDK 28.2.13676358, Gradle 9.3.1. Les versions des dépendances figurent dans pubspec.lock ; conserver les trois plugins third_party/ et les dependency_overrides.

Depuis la racine extraite :

```sh
flutter doctor
flutter pub get
flutter analyze lib test
flutter test
flutter run
flutter build apk --profile --split-per-abi --target-platform android-arm64
```

Sous Windows, préférer un chemin court comme C:/Dev/BourseFacile. Flutter/Android Studio régénèrent android/local.properties avec les chemins de votre machine. Une connexion Internet est requise pour télécharger les SDK et dépendances manquants ; ceux-ci ne sont pas embarqués dans l'archive.

## Configuration et signature

La configuration publique Firebase/OAuth utilisée se trouve dans lib/data/account_config.dart. Aucun identifiant de compte utilisateur, jeton de session, compte de service administrateur ou clé privée de signature n'est livré. Une compilation de test sur une autre machine utilise sa propre clé Android : enregistrer son SHA dans Firebase/OAuth pour Google et utiliser la même clé que l'installation existante pour pouvoir la mettre à jour. Les paramètres distants Firebase ne sont pas exportables dans un simple ZIP de sources.

Pour une version commerciale, configurer android/key.properties et la clé de production en privé ; ne jamais les publier sur GitHub. La compilation release n'utilise pas silencieusement une signature de test.

iOS nécessite macOS/Xcode et la signature Apple du propriétaire. Définir GOOGLE_IOS_CLIENT_ID via --dart-define pour la connexion Google, avec l'identité OAuth iOS correspondante. Aucun IPA testé n'est inclus.

## Contenu

- lib/ : application Flutter, authentification, portefeuille, marché, quiz et flashcards.
- android/ et ios/ : projets natifs, lecteur PDF et configuration.
- assets/ : illustrations 3D, polices, licences, leçons, lexique et observation financière sourcée.
- test/ : tests et publications de référence ; les comptes fictifs de test ne sont pas intégrés dans l'application.
- third_party/ : plugins locaux, sources originales, licences et explication des correctifs de compilation.
- tool/ : outil local de revue et snapshots officiels, séparés du produit.
- review/ : 29 captures de la version et index HTML ; comptes illustratifs réservés à la revue.
- gateway/ : ancien service de marché v1, conservé pour complétude, non utilisé par l'application actuelle. Son déploiement éventuel exige sa propre configuration ; ses anciens flux ne constituent pas le flux BRVM actuel.
- docs/ : architecture, sources, limitations et historique.

## Revue locale des écrans

Installer Python 3 et Poppler (commande pdftotext), puis :

```sh
flutter build web --profile --no-wasm-dry-run --no-web-resources-cdn --target tool/review_main.dart
python tool/review_server.py
```

Ouvrir http://127.0.0.1:8844/?scenario=home&skipBulletin=1 ; autres scénarios : study et company. Le serveur écoute uniquement en local. Les snapshots correspondent aux publications datées de la revue ; ils ne remplacent pas le flux de production. FLUTTER_ROOT permet au serveur de retrouver les polices de votre SDK.

## État vérifié et limites

L'application v0.0.5 a passé 83 tests automatisés et l'analyse statique le 12 novembre 2026. Le ZIP de sources est vérifié le 13 novembre 2026 ; le code de production est identique à celui de l'APK v0.0.5. Seuls le README et la portabilité de l'outil local de revue sont adaptés dans cet export.

Les PER et dividendes proviennent des publications BRVM avec leurs dates. BPA/PBR/ROE : couverture annuelle vérifiée limitée à Sonatel, comptes 2025, observation revue manuellement ; pas d'actualisation automatique des comptes annuels. Voir docs/REFONTE_0_0_5.md. Pas de synchronisation SGI ni de portefeuille interappareils opérationnels.

MANIFEST_SOURCES.json contient les empreintes SHA-256 des fichiers. Les caches, compilations générées et clés privées sont exclus ; ils ne sont pas du code source nécessaire à transmettre.
