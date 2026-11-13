# Bourse Facile — v0.0.1

## Contenu

Cette livraison reprend l’application mobile existante et intègre le portefeuille personnel validé. Marché et publications officiels, fiches d’entreprises, apprentissage, quiz et simulations restent accessibles dans leurs rubriques. Aucun cours fictif, compte de démonstration ou portefeuille prérempli n’est inclus dans l’APK.

Le portefeuille apparaît dans l’espace personnel après connexion avec une adresse vérifiée. Sélection explicite du symbole et du nom complet BRVM, quantité, prix d’achat unitaire, validation ; correction et suppression des achats. Une déconnexion masque les achats, les formulaires et les sélecteurs ouverts, et efface les saisies en cours.

Les trois sections montrent les achats individuels, les cours moyens pondérés par titre et les plus-values consolidées. Les sections 2 et 3 expliquent les formules :

- Investissement = quantité × prix d’achat unitaire.
- Cours moyen = somme des investissements du même titre ÷ quantité totale de ce titre.
- Plus-value du titre = (cours actuel − cours moyen exact) × quantité totale.
- Plus-value du portefeuille = somme des plus-values des titres.

Montants hors frais, fiscalité et dividendes. Le calcul exact utilise valeur actuelle moins montant investi, sans multiplier un cours moyen arrondi. Un cours absent rend le total indisponible. Les dates et sources BRVM restent visibles : il s’agit des derniers cours publiés, pas d’une promesse de cotation en temps réel.

## Connexion et stockage

Le code utilise le projet Firebase du site et vérifie les identités auprès de Firebase. Les mots de passe ne sont pas stockés. Le portefeuille et le jeton de session sont sauvegardés dans le stockage sécurisé de l’appareil, isolés par UID. Pas de synchronisation entre appareils ni avec le site dans cette livraison. Les anciennes saisies anonymes ne sont pas importées automatiquement. Sauvegarder ses informations avant une désinstallation.

L’activation et le test réels de Google nécessitent la configuration OAuth Android/iOS du propriétaire. Voir PORTEFEUILLE_2_1.md. Aucun compte réel n’a été créé pendant les tests automatisés. La capacité à connecter 1 000 personnes et les droits de redistribution des cours ne sont pas validés par une compilation locale.

## Installation Android

L’APK fourni vise Android ARM64 (arm64-v8a). C’est une compilation `profile` signée avec la clé de développement utilisée pour les APK de test précédents. Elle sert aux essais directs et n’est pas une version signée pour publication commerciale.

1. Copier l’APK sur le téléphone Android ARM64.
2. Ouvrir le fichier et autoriser cette source pour l’installation si Android le demande.
3. Choisir Installer ou Mettre à jour. La version affichée est 0.0.1 ; le numéro interne de compilation est 4 (2004 pour l’APK ARM64 séparé).
4. Si Android refuse la mise à jour, vérifier la compatibilité et la signature avant de désinstaller : les saisies locales peuvent être perdues.

Aucun IPA n’est compilé sur Linux : les sources iOS sont incluses, leur compilation et leur signature nécessitent macOS/Xcode et les identifiants Apple du propriétaire.

## Recompiler

Prérequis : Flutter stable compatible avec le SDK Dart du pubspec, Java 21, SDK/NDK Android demandés par Flutter, accès aux dépôts de dépendances. Depuis le dossier mobile :

```sh
flutter pub get
flutter analyze lib test
flutter test
flutter build apk --profile --split-per-abi --target-platform android-arm64
```

Le profil utilise une signature de développement propre à la machine. Pour publier, fournir sa signature de production via android/key.properties (ne jamais la partager) puis compiler en release. Les variantes release ne reprennent pas silencieusement la signature de développement.

Les outils `tool/review_main.dart` et les fournisseurs de test servent seulement à la revue : l’APK utilise `lib/main.dart`, avec Firebase réel et sans achats d’exemple. Les identifiants Firebase publics font partie des sources ; aucune clé privée de signature ou de compte de service ne fait partie de l’archive.

## Vérifications de cette livraison

42 tests passent ; 2 captures facultatives ne sont pas exécutées par la suite standard. L’analyse de `lib` et `test` ne signale aucune anomalie. Les tests couvrent les calculs, l’isolation des comptes, la saisie, les déconnexions pendant une saisie et l’accessibilité à 200 % de taille de texte. Ils ne remplacent pas une connexion Google réelle ni un essai sur téléphone après configuration OAuth.

Sous Windows, le script `tool/build_android_v0_0_1.ps1` enchaîne les contrôles et la compilation avec Flutter installé.

## Compatibilité du système de compilation Android

Les trois plugins Android officiels Google Sign-In, Shared Preferences et URL Launcher sont inclus dans `third_party` aux versions verrouillées. Le seul correctif de leurs sources est une ligne de configuration `compileSdk` : ils reçoivent le même entier fourni par Flutter à l’application, plutôt que de charger l’accesseur Kotlin DSL `FlutterExtension` qui échoue avec cet outillage. Leurs implémentations Dart/natives, dépendances et licences sont conservées. Chaque correctif est documenté dans `BOURSE_BUILD_PATCH.md`. Les dépendances pointent explicitement vers ces copies pour que la correction soit reproductible.

## APK produit et contrôlé

Compilation Android réussie le 11 novembre 2026. APK ARM64 de 42 960 067 octets, version Android 0.0.1 / code 2004, Android 7.0 (API 24) minimum, SDK cible 36. Signature vérifiée et identique à celle de l’APK de test précédent ; archive interne et alignement des bibliothèques à 16 Ko vérifiés. Les plugins Google Sign-In et stockage sécurisé sont présents ; les fixtures de test ne sont pas embarquées. L’installation physique sur téléphone et la connexion Google réelle ne sont pas exécutées dans cet environnement.

SHA-256 de l’APK : `184d564920e0ebb4c7fe8f2e1dd8da019e2a08e5cfebeaad6ba0e1ba66175e33`.
