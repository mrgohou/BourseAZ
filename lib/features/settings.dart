import 'package:flutter/material.dart';

import '../core/store.dart';
import 'widgets.dart';

class SettingsPage extends StatelessWidget {
  final AppStore store;
  const SettingsPage(this.store, {super.key});
  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: store,
    builder: (context, _) => Scaffold(
      appBar: AppBar(title: const Text('Tes préférences')),
      body: PageBody(
        children: [
          Text(
            'Simple. Et personnel.',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 16),
          const Text(
            'Un compte Google ou e-mail est nécessaire pour le portefeuille. Les achats sont liés à ce compte et protégés par le stockage sécurisé de cet appareil. Les favoris, scénarios et quiz restent locaux.',
          ),
          const SectionTitle('Apparence'),
          RadioGroup<ThemeMode>(
            groupValue: store.themeMode,
            onChanged: (v) {
              if (v != null) store.setTheme(v);
            },
            child: const Card(
              child: Column(
                children: [
                  RadioListTile(
                    value: ThemeMode.system,
                    title: Text('Comme mon téléphone'),
                  ),
                  RadioListTile(value: ThemeMode.light, title: Text('Clair')),
                  RadioListTile(value: ThemeMode.dark, title: Text('Sombre')),
                ],
              ),
            ),
          ),
          const SectionTitle('Données de marché'),
          Text(
            store.configured
                ? 'Un flux HTTPS est configuré. Les données reçues affichent leur source et leur date. Les derniers cours sont gardés sur l’appareil pour les coupures réseau.'
                : 'Les cours proviennent des publications officielles de la BRVM.',
          ),
          const SizedBox(height: 12),
          Text('Source affichée : ${store.market.source}'),
          const SectionTitle('Confidentialité'),
          const Text(
            'Aucune publicité ni outil d’analyse comportementale dans cette variante. Aucun mot de passe n’est conservé. Le jeton de session et le nouveau portefeuille utilisent le stockage sécurisé du système. Le service de marché reçoit les métadonnées réseau habituelles, dont l’adresse IP, lorsque le flux est configuré.\n\nLes favoris, quiz, simulations et anciennes saisies de la version 2 utilisent les préférences locales du système ; ils ne constituent pas un coffre chiffré. Le portefeuille personnel ajouté après connexion utilise une sauvegarde chiffrée distincte. Une désinstallation ou un effacement peut supprimer ta progression.',
          ),
          const SectionTitle('Réinitialiser les autres outils'),
          OutlinedButton.icon(
            onPressed: () async {
              final confirm = await showDialog<bool>(
                context: context,
                builder: (context) => AlertDialog(
                  title: const Text('Effacer favoris, quiz et scénarios ?'),
                  content: const Text(
                    'Cette action efface les favoris, scénarios et leçons validées de cet appareil. Le portefeuille personnel possède une sauvegarde distincte.',
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context, false),
                      child: const Text('Annuler'),
                    ),
                    TextButton(
                      onPressed: () => Navigator.pop(context, true),
                      child: const Text('Tout effacer'),
                    ),
                  ],
                ),
              );
              if (confirm != true) return;
              final ok = await store.reset();
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      ok
                          ? 'Données locales effacées.'
                          : 'Effacement impossible.',
                    ),
                  ),
                );
              }
            },
            icon: const Icon(Icons.delete_outline),
            label: const Text('Effacer favoris, quiz et scénarios'),
          ),
          const SizedBox(height: 28),
          const Text(
            'Bourse Facile · version 0.0.5\nInformation, apprentissage et simulation. Aucun achat d’action ni paiement dans l’application.',
            style: TextStyle(fontSize: 12),
          ),
        ],
      ),
    ),
  );
}
