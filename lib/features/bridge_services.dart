import 'package:flutter/material.dart';
import '../core/store.dart';
import '../data/market.dart';
import '../data/bridge_resources.dart';
import 'official.dart';

class BridgeServicesCard extends StatelessWidget {
  final AppStore store;
  const BridgeServicesCard(this.store, {super.key});
  @override
  Widget build(BuildContext c) => Card(
    child: Padding(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Bridge Securities · BS Trade',
            style: Theme.of(c).textTheme.titleLarge,
          ),
          const SizedBox(height: 10),
          const Text(
            'Le barème est publié par Bridge Securities. Vérifie les fourchettes, assiettes, périodicités et conditions de ton contrat avant de renseigner tes frais de simulation.',
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () => Navigator.push(
              c,
              MaterialPageRoute<void>(
                builder: (_) => ReportReader(
                  const OfficialDocument(
                    'Bridge Securities · Tarification du compte-titres',
                    bridgeTariffUrl,
                  ),
                  store,
                ),
              ),
            ),
            icon: const Icon(Icons.picture_as_pdf_outlined),
            label: const Text('Lire le barème officiel Bridge'),
          ),
          const SourceButton('Page officielle du barème', bridgeClientInfoUrl),
          const SourceButton('Ouvrir BS Trade', bridgePortalUrl),
          const Text(
            'BS Trade s’ouvre sur le site de ta SGI. Cette ouverture ne synchronise pas tes avoirs avec Bourse Facile ; aucun mot de passe SGI n’est demandé ici.',
            style: TextStyle(fontSize: 12),
          ),
          const SourceButton(
            'Présentation officielle de BS Trade',
            bridgeToolsUrl,
          ),
        ],
      ),
    ),
  );
}
