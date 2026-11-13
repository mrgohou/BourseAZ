import 'package:flutter/material.dart';
import '../account/account_page.dart';
import '../core/store.dart';
import '../data/market.dart';
import '../data/official_feeds.dart';
import '../features/widgets.dart';
import '../features/official.dart';
import '../features/official_updates.dart';
import '../features/bridge_services.dart';
import '../data/bridge_resources.dart';
import 'portfolio_controller.dart';
import 'broker_selection.dart';

class BrokerProfilePage extends StatefulWidget {
  final AppStore store;
  final PortfolioController portfolio;
  const BrokerProfilePage(this.store, this.portfolio, {super.key});
  @override
  State<BrokerProfilePage> createState() => _BrokerProfilePageState();
}

class _BrokerProfilePageState extends State<BrokerProfilePage> {
  int page = 0;
  String query = '';
  late Future<FeedPage<BrokerEntry>> future = load();
  Future<FeedPage<BrokerEntry>> load() =>
      OfficialFeeds(widget.store.repository).brokers(page);
  void reload([int? value]) {
    widget.store.repository.invalidatePublicCaches();
    setState(() {
      page = value ?? page;
      future = load();
    });
  }

  @override
  Widget build(BuildContext c) => ListenableBuilder(
    listenable: Listenable.merge([widget.portfolio, widget.portfolio.account]),
    builder: (c, _) {
      final ledger = widget.portfolio;
      if (!ledger.account.portfolioAllowed) return AccountPage(ledger.account);
      return Scaffold(
        appBar: AppBar(
          title: const Text('Ma SGI'),
          actions: [
            IconButton(
              tooltip: 'Actualiser l’annuaire',
              onPressed: reload,
              icon: const Icon(Icons.refresh),
            ),
          ],
        ),
        body: PageBody(
          children: [
            Text(
              'La SGI de ton\nportefeuille.',
              style: Theme.of(c).textTheme.headlineLarge,
            ),
            const SizedBox(height: 16),
            const Text(
              'Choisis ton intermédiaire dans l’annuaire officiel BRVM. Cette déclaration ne transmet pas tes achats à la SGI et ne connecte pas ton compte de courtage.',
            ),
            if (ledger.broker != null)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        ledger.broker!.name,
                        style: Theme.of(c).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'SGI déclarée · sauvegarde chiffrée pour ce compte',
                      ),
                      SourceButton(
                        'Vérifier dans l’annuaire',
                        ledger.broker!.source,
                      ),
                      TextButton(
                        onPressed: ledger.canEdit
                            ? () => ledger.setBroker(null)
                            : null,
                        child: const Text('Retirer cette SGI'),
                      ),
                    ],
                  ),
                ),
              ),
            if (isBridgeBroker(ledger.broker?.name))
              BridgeServicesCard(widget.store),
            const SectionTitle('Synchronisation du compte SGI'),
            const Text(
              'La synchronisation automatique n’est pas activée. Elle nécessite une connexion officielle autorisée par ta SGI. Aucun identifiant ni mot de passe SGI n’est demandé dans Bourse Facile.',
            ),
            const SizedBox(height: 12),
            const Text(
              'En attendant, renseigne tes achats dans ton portefeuille et utilise ton barème contractuel pour les simulations. Les cours publics BRVM ne donnent pas accès à tes avoirs privés chez ta SGI.',
            ),
            const SourceButton('Barèmes BRVM et DC/BR', tariffsUrl),
            const SectionTitle('Choisir ou modifier ma SGI'),
            TextField(
              decoration: const InputDecoration(
                labelText: 'Rechercher une SGI',
                helperText: 'Filtre limité à la page courante',
                helperMaxLines: 2,
                prefixIcon: Icon(Icons.search),
              ),
              onChanged: (v) => setState(() => query = v.toLowerCase().trim()),
            ),
            const SizedBox(height: 12),
            if (ledger.loading || ledger.saving)
              const LinearProgressIndicator(),
            if (ledger.error != null)
              Text(
                ledger.error!,
                style: TextStyle(color: Theme.of(c).colorScheme.error),
              ),
            FutureBuilder<FeedPage<BrokerEntry>>(
              future: future,
              builder: (c, s) {
                if (s.connectionState != ConnectionState.done) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (s.hasError) return FeedFailure(onRetry: reload);
                final items = s.data!.items
                    .where((b) => b.name.toLowerCase().contains(query))
                    .toList();
                return Column(
                  children: [
                    if (items.isEmpty)
                      const Text(
                        'Aucune SGI trouvée sur cette page. Essaie les autres pages de l’annuaire.',
                      ),
                    for (final b in items)
                      Card(
                        child: ListTile(
                          title: Text(b.name),
                          subtitle: Text(b.details),
                          trailing: Icon(
                            ledger.broker?.name == b.name
                                ? Icons.check_circle
                                : Icons.chevron_right,
                          ),
                          onTap: ledger.canEdit
                              ? () async {
                                  final ok = await ledger.setBroker(
                                    BrokerSelection(b.name, b.source),
                                  );
                                  if (ok && mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text(
                                          'SGI enregistrée dans ton profil.',
                                        ),
                                      ),
                                    );
                                  }
                                }
                              : null,
                        ),
                      ),
                    FeedPagination(
                      page: page,
                      hasNext: s.data!.hasNext,
                      onPage: reload,
                    ),
                  ],
                );
              },
            ),
            const SourceButton('Annuaire officiel BRVM', sgiUrl),
          ],
        ),
      );
    },
  );
}

class BrokerProfileShortcut extends StatelessWidget {
  final AppStore store;
  final PortfolioController portfolio;
  const BrokerProfileShortcut(this.store, this.portfolio, {super.key});
  @override
  Widget build(BuildContext c) => ListenableBuilder(
    listenable: portfolio,
    builder: (c, _) => Card(
      child: ListTile(
        leading: const Icon(Icons.account_balance_outlined),
        title: const Text('Ma SGI et ma synchronisation'),
        subtitle: Text(
          portfolio.broker?.name ?? 'Choisir ma SGI dans l’annuaire officiel',
        ),
        trailing: const Icon(Icons.chevron_right),
        onTap: portfolio.account.portfolioAllowed
            ? () => Navigator.push(
                c,
                MaterialPageRoute<void>(
                  builder: (_) => BrokerProfilePage(store, portfolio),
                ),
              )
            : null,
      ),
    ),
  );
}
