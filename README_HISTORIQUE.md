# Mise à jour 0.0.4

Accents pastel, icônes 3D et microanimations : [périmètre et contrôles](docs/REFONTE_0_0_4.md).

# Refonte 0.0.3

Voir [la direction visuelle et les contrôles](docs/REFONTE_0_0_3.md).

# Bourse Facile mobile — 0.0.2

Application Flutter Android/iOS d’information, d’apprentissage et de simulation BRVM. Material 3, cinq onglets, thèmes clair/sombre, favoris et progression locale.

**Cette version n’embarque aucun cours de démonstration.** Elle charge les publications officielles de la BRVM. Au premier lancement sans réseau, le marché reste vide. L’académie et les simulateurs restent disponibles.

Voir [la livraison v0.0.1](docs/VERSION_0_0_1.md), [le portefeuille personnel et la connexion](docs/PORTEFEUILLE_2_1.md) et [les contenus et sources du socle marché](docs/VERSION_2.md). Les documents d’audit et captures de la version 1 sont historiques et ne décrivent pas le contenu actuel.

Voir [les nouveautés, sources officielles, diagnostic Google et faisabilité SGI](docs/ACTUALISATION_0_0_2.md).

## Développement

```sh
flutter pub get
flutter analyze lib test
flutter test
flutter run
```

Le marché ne nécessite aucune clé d’API ni URL Google AI Studio. La connexion utilise la configuration publique Firebase dans `lib/data/account_config.dart` ; les fournisseurs et identités OAuth mobiles doivent être activés dans le projet du propriétaire. Les flux v1 du dossier `gateway` ne sont pas utilisés par cette version. Les fixtures officielles datées sont exclusivement dans `test/fixtures`, jamais dans les assets livrés. Seul le contenu pédagogique est embarqué.

## Android

```sh
flutter build apk --profile --split-per-abi --target-platform android-arm64
```

APK de test signé avec la clé de développement locale ; même identifiant d’application que les APK précédents. Le nom de version est 0.0.2 ; le numéro de compilation interne passe à 5 pour permettre une mise à jour. Une publication commerciale nécessite une clé de signature de production conservée par le propriétaire. Les variantes release ne basculent pas silencieusement vers la signature de développement.

Le filtre ARM64 s’applique aussi aux tâches CMake des bibliothèques Android quand `target-platform=android-arm64` est demandé. Le lecteur officiel utilise PDFBox Android, avec un traitement hors du fil d’interface, des limites de taille et une seule passe de colonnes par page.

## iOS

Le canal PDF utilise PDFKit. Compiler et tester sous macOS/Xcode avec l’identité Apple du propriétaire. Aucun IPA validé n’est produit depuis cet environnement Linux.

## Sécurité et limites

HTTPS uniquement vers les hôtes BRVM autorisés pour les données financières, redirections réseau refusées, tailles et délais bornés, aucun secret administrateur côté client. Les identifiants Firebase/OAuth publics ne sont pas des secrets. Aucun compte fictif, aucun paiement et aucune exécution d’ordre. Le jeton de session et le portefeuille personnel sont conservés dans le stockage sécurisé du système, séparément par compte. Les favoris, quiz et simulations restent dans les préférences locales. Le portefeuille n’est pas synchronisé entre appareils.

Les publications peuvent être différées ou indisponibles. Leur date et leur source sont visibles. L’APK direct ne garantit pas un flux de marché sous contrat ni la capacité de la source à desservir 1 000 clients simultanés. Pour un lancement à cette échelle : collecte centralisée, cache partagé et validation des droits de redistribution.
