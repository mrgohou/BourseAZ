# Bourse Facile iOS — version 0.0.5+8

Le projet iOS cible iOS 15 ou supérieur, identifiant ci.boursefacile.bourseFacileMobile. Le design, les données BRVM, les quiz, les flashcards et le portefeuille sont ceux de la base Flutter v0.0.5. Les limites de couverture des données de cette version restent applicables.

## Compilation Mac

Le workflow .github/workflows/ios-build.yml utilise macOS et la révision officielle Flutter 3.47.9. Il compile une application ARM64 sans signature et une application pour simulateur. Ces résultats vérifient la compilation ; **ils ne constituent pas un IPA installable sur un iPhone physique**.

Sur Mac avec Flutter et Xcode :

```sh
flutter pub get --enforce-lockfile
python3 tool/configure_ios.py
flutter build ios --release --no-codesign
flutter build ios --simulator --debug --no-codesign
```

## Connexion Google

La configuration Google fournie précédemment correspond à Android. Créer/enregistrer une application iOS dans le même projet Firebase, avec le bundle iOS exact ci-dessus, puis récupérer son GoogleService-Info.plist (configuration client publique, sans clé de service).

```sh
python3 tool/configure_ios.py --google-plist /chemin/GoogleService-Info.plist
flutter build ios --release --no-codesign --dart-define=GOOGLE_IOS_CLIENT_ID=IDENTIFIANT_IOS.apps.googleusercontent.com
```

Le même identifiant doit être utilisé pour la configuration native et le --dart-define Flutter. Le script vérifie le projet et le bundle, puis configure le schéma de retour Google. Sur GitHub Actions, définir la variable de dépôt GOOGLE_IOS_CLIENT_ID. Sans cet identifiant, Google est désactivé sur iOS et la connexion e-mail reste disponible. Aucun identifiant fictif n'est utilisé.

## Installer sur iPhone et distribuer

Une application iPhone doit être signée par Apple. Pour TestFlight/App Store, il faut l'abonnement Apple Developer du propriétaire, l'enregistrement du bundle et de l'application App Store Connect, un certificat/profil valides et les informations de distribution. Aucune de ces clés privées ne doit être publiée dans le dépôt public ni partagée en clair dans une conversation.

Sur le Mac autorisé : ouvrir ios/Runner.xcworkspace, sélectionner l'équipe Apple dans Signing & Capabilities, puis archiver via Xcode ou flutter build ipa --release avec la configuration Google iOS si activée. Exporter et envoyer avec l'identité Apple autorisée. La fiche de confidentialité doit refléter l'utilisation Firebase Auth et les fonctions réellement activées ; la connexion Apple doit être évaluée avant une publication App Store proposant une connexion tierce.

Un identifiant Apple gratuit peut permettre un test personnel signé depuis Xcode avec les limites Apple ; il ne permet pas une distribution TestFlight publique. Ne pas renommer un ZIP ou un APK en IPA : cela ne crée pas une application iPhone installable.
