# Bourse Facile — préparation iOS v0.0.5+8

Projet Flutter complet issu de la version v0.0.5, avec préparation de compilation sur Mac, configuration Google iOS validée et groupe de trousseau sécurisé propre à l'application.

Voir **docs/IOS_DISTRIBUTION.md** pour compiler et signer la version iPhone. Le workflow GitHub Actions **Bourse Facile iOS** produit une application non signée et une application pour simulateur si sa compilation réussit. Sans certificat/profil Apple, aucun IPA installable ou envoi TestFlight n'est déclaré produit.

Les identifiants Google iOS ne sont pas encore fournis. La connexion par e-mail reste disponible ; Google est désactivé sur iOS jusqu'à sa configuration. Aucune clé privée n'est incluse. Le dossier review/ contient les captures de la base v0.0.5, pas des captures prises sur un iPhone natif.

README_SOURCE_V005.md et les documents précédents sont historiques. Le code Android de référence reste sur la branche downloads/bourse-facile-v0.0.5-sources. Cette variante ajoute une correction de disponibilité Google spécifique à iOS, sans livrer un nouvel APK Android.
