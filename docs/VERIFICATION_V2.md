# Vérification de la version 2.0

Contrôles effectués le 11 novembre 2026 :

- Analyse Flutter/Dart sans erreur ni avertissement.
- 19 tests : parsing du vrai HTML BRVM, rapprochement des 48 lignes du bulletin, dates et provenance, rejet des démos et sources non officielles, absence de faux chiffres hors connexion, regroupement de 50 appels simultanés dans une même instance, cache, sauvegardes, académie et quiz validé, navigation et écran de 320 px avec texte à 200 %, mathématiques de simulation.
- Contrôle HTTPS réel : 48 actions et 3 indices reçus de la BRVM ; dernière publication disponible lors du contrôle : 10/11/2026 à 22:45 UTC. 21 liens/documents de la page Sonatel consultés, dont la publication du troisième trimestre 2026.
- Bulletin du 10/11/2026 téléchargé réellement ; extraction de référence de ses 48 lignes avec PDFBox et validation des colonnes. Exemple de contrôle, pas de données incorporées : SNTS clôture 4 000 FCFA, variation −3,61 %, performance annuelle publiée +53,14 %, dernier dividende net 174 FCFA. Les valeurs manquantes restent absentes.
- Compilation Kotlin/Gradle et Flutter ARM64 terminée. APK profil de test, application `ci.boursefacile.bourse_facile_mobile`, version 2.0.0, code 2002, Android minimum 24, cible 36.
- Signature vérifiée et identique à celle de l’ancien APK de test : une mise à jour est possible sans changement de signature.
- Inspection de l’archive APK : seule ABI ARM64, 15 leçons intégrées, aucun fichier de fixtures financières dans le paquet.
- Captures de contrôle produites avec le moteur de test Flutter et les polices Roboto chargées. Elles servent au contrôle de disposition ; certains libellés de composants peuvent garder la police technique de test. Elles ne constituent pas un test sur un téléphone physique.

Les jeux d’essai financiers sont des captures réelles de publications officielles, stockées uniquement dans `test/fixtures`. Ils ne sont pas utilisés comme données de repli dans l’application.

Non vérifié ici : installation et exécution sur un téléphone Android physique, compilation iOS/Xcode, capacité des serveurs BRVM pour 1 000 clients simultanés, déploiement d’un agrégateur ou d’un cache partagé. Le test de 50 appels simultanés concerne le regroupement des appels sur une instance de l’application, pas une charge distribuée de 1 000 utilisateurs.
