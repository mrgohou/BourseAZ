# Bourse Facile 0.0.2 — données officielles et profil SGI

## Vérification du site et des sources — 11 novembre 2026

Le site https://boursefacile.ai.studio a été relu, ainsi que son bundle public et son endpoint public `/api/news`. Le projet Firebase, le domaine d’authentification et le client OAuth web correspondent à ceux de l’application. Le flux d’actualités du site renvoie huit articles préenregistrés (`news-snts-1`, etc.) ; sa date `lastUpdated` ne constitue pas une date de publication des articles. Les tarifs estimatifs, notes de SGI et calendriers codés dans les données du site ne sont pas utilisés comme preuves officielles dans l’application.

Les nouvelles rubriques chargent les pages et documents officiels suivants :

| Données | Source officielle utilisée | Règle d’affichage |
| --- | --- | --- |
| Cours | https://www.brvm.org/fr/cours-actions/0 et bulletin officiel | Date de séance et source visibles ; aucun cours inventé en cas de panne |
| Dividendes | https://www.brvm.org/fr/esv/paiement-de-dividendes | Émetteur, exercice, montant **net** par action, date de détachement, date de paiement et avis PDF repris du tableau |
| Avis de marché | https://www.brvm.org/fr/marche/avis-et-publications/avis | Date de publication de la ligne officielle, distincte de la date dans le nom du PDF |
| Actualités | https://www.brvm.org/fr/mediacentre/actualites | Article et extrait officiels ; aucune date de publication supposée lorsqu’elle n’est pas affichée |
| Rapports d’activité | https://www.brvm.org/fr/rapports-societes-cotees | Sélection d’un émetteur, rapports référencés, lecteur PDF et original accessibles |
| Assemblées | https://www.brvm.org/fr/emetteurs/type-annonces/convocations-assemblees-generales | Date de publication de la convocation ; la date de réunion doit être lue dans l’avis |
| Jours fériés | https://www.brvm.org/fr/jours-feries | Dates et astérisques conditionnels de la source ; pas d’extrapolation à une autre année |
| Coûts | https://www.brvm.org/fr/textes-reglementaires/tarification | Barèmes datés et PDF originaux BRVM / DC/BR ; pas de commission SGI ni de taxe présumée |
| SGI | https://www.brvm.org/fr/intervenants/sgi/tous | Dénomination et coordonnées de l’annuaire, pagination réelle |

Exemples de contrôles sur les publications réelles, réservés aux tests : AGL/Bolloré exercice 2025, net 92 FCFA/action, détachement du 26 octobre et paiement du 27 octobre 2026 ; avis TPCI publié le 11 novembre dont le fichier est daté du 10 novembre. Ces valeurs ne sont pas des données initiales embarquées dans l’application.

Les pages publiques sont mises en cache cinq minutes, avec regroupement des lectures simultanées et limite de taille. Le bouton d’actualisation des nouvelles rubriques invalide les caches ; la mise à jour des cours relit réellement les pages officielles. Les PDF conservent leurs limites de taille et de lecture. Aucun article généré, dividende extrapolé, rendement garanti ou barème fictif ne remplace une source absente. Le lecteur accepte aussi le seul PDF de tarification Bridge vérifié, via une liste fermée de ressources ; les API privées de BS Trade restent interdites au client HTTP et les sources des cours restent limitées à la BRVM. L’accès public à une page ne vaut pas contrat de flux temps réel ou droit de redistribution à grande échelle : la collecte mutualisée et les droits devront être contractualisés avant un lancement à 1 000 utilisateurs.

## Google : correction applicative et configuration à vérifier

La version précédente ignorait les retours `canceled` du SDK Google. Le SDK officiel explique que certains défauts de configuration Android sont également remontés sous ce code, sans pouvoir les distinguer d’une annulation volontaire :

https://github.com/flutter/packages/tree/main/packages/google_sign_in/google_sign_in_android#troubleshooting

Le retour interrompu affiche maintenant une explication persistante en haut de la page et un message visible après le retour. La page ne se ferme qu’après une session vérifiée. Un échec d’initialisation n’empêche plus les tentatives suivantes. Les erreurs Google de configuration ou de service ne sont plus présentées comme un défaut du stockage sécurisé ou un mauvais mot de passe. Le jeton Google doit toujours être échangé auprès de Firebase, et l’identité reçue est vérifiée par `accounts:lookup` avant connexion.

Le fournisseur Google et son client web ont également été vérifiés via `accounts:createAuthUri` : l’URL officielle Google est disponible et son identifiant client correspond à celui de l’application. Cette vérification ne connecte aucun utilisateur et ne crée aucun compte. Elle ne permet pas de contrôler l’enregistrement OAuth Android ni sa signature. Cela ne constitue pas une preuve que la configuration OAuth mobile du propriétaire est complète. L’environnement ne dispose d’aucune identité administratrice Firebase et aucun compte Google réel sur téléphone n’a été utilisé.

À vérifier dans le projet **third-storm-9w532** :

1. Ouvrir https://console.firebase.google.com/project/third-storm-9w532/settings/general et enregistrer l’application Android `ci.boursefacile.bourse_facile_mobile` si elle n’existe pas.
2. Ajouter le SHA-1 de l’APK de test : `80:C2:C5:37:3B:9D:72:A8:8C:56:27:AB:CD:5F:74:61:9E:64:20:B9`.
3. Vérifier dans Google Cloud que le client OAuth Android a exactement ce package et ce SHA-1, dans le même projet que le client web existant.
4. Google est déjà disponible côté projet, comme vérifié ci-dessus. Contrôler les réglages dans https://console.firebase.google.com/project/third-storm-9w532/authentication/providers et confirmer les paramètres requis par Google pour les utilisateurs réels.
5. Contrôle facultatif : télécharger la configuration Android publique et exécuter `python tool/check_google_android.py --config chemin/vers/google-services.json`. Le script ne modifie rien et n’affiche aucune clé d’API.
6. Tester sur un téléphone avec les services Google disponibles. L’enregistrement du package et du SHA-1 se fait côté projet : cet APK utilise déjà le bon client web et ne nécessite pas l’ajout d’un fichier de configuration dans le téléphone. Une signature de production ou Play App Signing nécessite son propre enregistrement.

L’application utilise le client OAuth **web** existant comme `serverClientId`, conformément à la méthode officielle sans plugin `google-services.json`. La simple configuration OAuth du site ne remplace pas l’enregistrement Android. Le script sans argument affiche les références publiques requises. Ne jamais fournir de mot de passe Google, code de connexion ou clé de compte de service dans une conversation ou l’APK.

## Profil SGI et simulations

La sélection d’une SGI de l’annuaire est sauvegardée avec les positions dans le stockage chiffré du compte vérifié. Elle disparaît à la déconnexion et n’est pas partagée avec un autre compte. Les anciennes sauvegardes sans champ SGI restent lisibles. Choisir sa SGI ne prouve pas une connexion au courtier et ne change pas la provenance des achats saisis.

Le scénario « Simuler mes titres » reprend un titre et sa quantité réellement saisis dans le portefeuille, puis demande un cours futur hypothétique, un dividende net éventuel et le montant des frais/taxes à déduire. Il ne modifie aucune position et ne passe aucun ordre. Le résultat suit : valeur future + dividendes nets hypothétiques − investissement saisi − frais/taxes saisis. Les cours moyens et plus-values de suivi continuent à utiliser les formules validées, sans arrondi intermédiaire.

## Faisabilité d’une API SGI

La synchronisation automatique n’est pas activée dans cette version. La priorité Bridge Securities a été confirmée ; [les vérifications Bridge et BS Trade](BRIDGE_SECURITIES.md) détaillent le barème officiel et les conditions nécessaires à une API. Les sources publiques consultées ne permettent pas de déclarer un connecteur de compte client opérationnel :

| SGI / source | Constat vérifié | Conclusion limitée à cette inspection |
| --- | --- | --- |
| Bridge Securities — https://www.bridge-securities.com/nos-offres/nos-outils | BS Trade et PDF de tarification officiels vérifiés ; portail HTTP 503 depuis cet environnement | Pas de documentation publique d’API tierce validée ; accès partenaire à confirmer |
| Coris Bourse — https://www.coris-bourse.com/ et son lien officiel https://client.coris-bourse.net/ | Portail My Coris Bourse et espace client identifiés | Un portail n’est pas une documentation d’API tierce ni une autorisation d’intégration |
| CGF Bourse — https://www.cgfbourse.com/fr/ | Application publique et ressources du site accessibles | Aucun contrat/documentation publique d’API de compte client validé dans cette inspection |
| BOA Capital — https://www.boacapital.com | Réponse HTTP 503 pendant la vérification | Disponibilité et API non vérifiables à ce stade |
| BRVM | Annuaire et informations publiques disponibles | Ces données n’exposent pas les avoirs privés d’un client chez sa SGI |

Une API partenaire peut exister sans documentation publique. Il faut identifier la SGI prioritaire et obtenir ses modalités officielles, son accord d’intégration, un environnement de test et les coûts/licences. Aucun endpoint interne découvert dans un site ou une application cliente n’est utilisé comme API officielle. Aucun mot de passe SGI n’est demandé ou stocké.

Architecture à mettre en œuvre **après accord documenté** : autorisation déléguée dans le navigateur du fournisseur, permissions limitées à la lecture des positions/transactions, échange des secrets côté serveur, jetons chiffrés et révocables, accès isolé par UID, horodatage de dernière synchronisation et reprise avec curseur. Les opérations de bourse restent hors périmètre. Les identifiants de transactions externes permettent un import idempotent ; rapprochement des quantités, fractionnements, devises et frais obligatoire avant confirmation. Aucune vente ou position inconnue ne doit être inventée ou écrasée silencieusement.

À défaut d’API, un export officiel CSV de la SGI peut constituer une piste d’import manuel avec prévisualisation et confirmation. Cet import CSV n’est pas implémenté dans cette livraison ; la saisie manuelle des achats reste disponible.

## Compilation et vérification

Outillage utilisé : Flutter 3.47.9 stable, Dart 3.13.7, Java 21, SDK Android 36 et NDK 28.2.13676358. Le correctif Gradle des trois plugins Android officiels documenté dans la livraison précédente est conservé ; leur code Dart et natif reste inchangé.

Sous Windows : `tool/build_android.ps1`. Le script vérifie aussi la présence de la bibliothèque Dart AOT, afin de refuser un APK incomplet. Le contrôle portable `python tool/verify_apk.py chemin/vers/app-arm64-v8a-profile.apk` peut être exécuté séparément. Conserver `build` et `.dart_tool/flutter_build` comme dossiers réguliers pour cette chaîne de compilation : une tentative de déplacement par liens symboliques dans l’environnement de travail a été écartée après détection de sorties natives manquantes.

63 tests passent, deux captures facultatives sont hors de la suite standard. L’analyse de `lib` et `test` ne signale aucune anomalie. Les captures utilisent les composants réels et les publications BRVM du 11 novembre ; les comptes et achats d’illustration existent seulement dans l’outil de revue. Aucun test de connexion Google réelle sur téléphone ni de synchronisation SGI réelle n’est prétendu.
