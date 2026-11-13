# Vérifications effectuées

Exécution le 10 novembre 2026, Linux, Flutter 3.47.9 / Dart 3.13.7, Node 24.22.1, Chromium, Wrangler 4.160.0. Sources auditées : commit `9944fa867f665ef98a1569e470a2d5a625f7b65d`. Les résultats ci-dessous distinguent les contrôles locaux de ce qui demande un environnement de production.

## Flutter

- **20 tests Flutter passés** ; analyse statique sans problème.
- Tests de projection : conservation du capital à taux nul, frais, formule analytique des intérêts composés, versements en fin de mois, pertes, bornes et sérialisation.
- Tests réseau/stockage : coalescence de 50 rafraîchissements concurrents, limitation des reprises, refus HTTP, conservation du dernier instantané en erreur, sauvegardes concurrentes et restauration.
- Parcours : recherche/favori, calcul/sauvegarde, quiz correct et incorrect, navigation.
- Mise en page : 320×640, 844×390 et 768×1024, modes clair/sombre, texte système à 200 %. Résultats et préférences également vérifiés à 320×740 / 200 %.
- Build web release du même code Flutter : effectué ; ressources de rendu locales (`--no-web-resources-cdn`).

## Prévisualisation Chromium

Parcours vérifiés sur le build Flutter release : recherche et favori, calcul et sauvegarde du scénario, quiz, thème sombre et conservation de la progression après rechargement. Aucune erreur JavaScript détectée. Les captures dans `screenshots/` proviennent de cette prévisualisation, pas d’un appareil physique.

## Android

APK ARM64 compilé en mode profile (28,6 Mo), version 1.0.0, code Android 2001 (dérivé du build 1 pour la séparation ARM64), Android 7 / API 24 minimum, cible API 36. Signature APK v2 vérifiée avec `apksigner`, une seule ABI déclarée (`arm64-v8a`). Le mode profile compile le code Dart et permet les essais de performance ; ce paquet de test n’est pas un paquet de publication store. Aucune installation sur téléphone physique n’a été effectuée ici.

Commande reproductible : `flutter build apk --profile --split-per-abi --target-platform android-arm64`. Ajouter `--dart-define=MARKET_API_URL=...` uniquement après activation du flux validé.

SHA-256 du paquet livré : `0d7051e447ea87c179e35e4c92eb24576492b4064dc59d7bda6ab6b82665e607`.

## Passerelle

Huit tests unitaires passés : validation des cours, données absentes/anciennes, refus des méthodes privées et paramètres de forçage, données synthétiques/dupliquées/futures, date source conservée, collecte invalide sans écrasement, cache préparé, HEAD et OPTIONS.

`wrangler deploy --dry-run` a compilé le Worker sans publication. Identifiants KV et URL source restent des paramètres à renseigner.

| Test local, cache préparé | Requêtes simultanées | Échecs | Durée totale | p95 |
|---|---:|---:|---:|---:|
| Serveur HTTP Node, cache simulé | 1 000 | 0 | 1 694 ms | 1 483 ms |
| Runtime Cloudflare workerd, KV et Cache API locaux | 1 000 | 0 | 3 128 ms | 3 051 ms |

Le test Node a confirmé zéro lecture KV supplémentaire et zéro appel source pendant le pic. Le test workerd utilise le véritable handler avec les API locales KV et Cache. Il n’a pas contacté le serveur BRVM. Ce sont des pointes instantanées sur une machine de développement partagée, pas une certification de production. L’objectif p95 de 800 ms proposé pour la préproduction n’est pas atteint dans ce pic local ; il reste à mesurer sur l’infrastructure déployée avec des scénarios de trafic représentatifs.

Pour reproduire le test workerd : créer un JSON d’instantané de test avec `version: 1`, `demo: false`, `source: "LOCAL TEST FIXTURE"`, une date `asOf` actuelle et une liste de cours ; le placer uniquement dans le namespace local :

```sh
cd mobile/gateway
npx wrangler kv key put snapshot:v1 --binding MARKET --path /tmp/market-fixture.json --local --persist-to /tmp/bourse-worker-state
npx wrangler dev --local --ip 127.0.0.1 --port 8787 --persist-to /tmp/bourse-worker-state
# Dans un autre terminal :
node test/load-runtime.mjs
```

Ne pas publier cet instantané de test.

## Limites de validation

Pas de compte Cloudflare configuré, pas de source de production activée, pas de souscription, pas de push ni de publication store. Les exemples visibles dans l’app sont explicitement pédagogiques.

La compilation et la signature iOS nécessitent macOS/Xcode. Le job CI prévu pour iOS est fourni mais n’a pas été exécuté ici. VoiceOver/TalkBack sur appareils physiques, reprise après interruption native, consommation énergétique et compilation iOS restent à valider avant publication. Le test Chromium concerne la prévisualisation Flutter, pas un iPhone ou un Android physique.

## Deuxième livraison

Le code Dart et l’APK pédagogique sont inchangés. La deuxième livraison corrige le serveur web, ses autorisations et la provenance des données. Elle ajoute 45 tests web/serveur, neuf tests Firestore passés dans l’émulateur et porte la suite de passerelle à neuf tests. Le flux public observé contenait 49 lignes ; le nouveau normaliseur en conserve 39 et exclut 10 initialisations. Ces chiffres décrivent ce relevé, pas un nombre garanti de sociétés disponibles à chaque collecte.

Le nouveau `GET /api/mobile/market` est prêt dans le code mais n’est pas publié sur le site réel. L’activation et le nouveau build configuré sont décrits dans `docs/GOOGLE_AI_STUDIO.md` à la racine.
