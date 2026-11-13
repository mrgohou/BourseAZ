import 'package:flutter/material.dart';
import '../account/account_controller.dart';
import '../account/account_page.dart';
import '../core/store.dart';
import '../core/theme.dart';
import '../features/company.dart' show Metrics;
import '../features/widgets.dart';
import 'add_purchase_page.dart';
import 'portfolio_controller.dart';
import 'portfolio_math.dart';
import 'broker_profile_page.dart';
import 'portfolio_scenario_page.dart';
import 'purchase.dart';

class PortfolioPage extends StatelessWidget {
  final AppStore store;
  const PortfolioPage(this.store, {super.key});
  @override
  Widget build(BuildContext context) {
    final account = AccountScope.maybeOf(context),
        portfolio = PortfolioScope.maybeOf(context);
    if (account == null || portfolio == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Mon portefeuille')),
        body: const Center(
          child: Text(
            'Le service de compte est indisponible. Relance l’application.',
          ),
        ),
      );
    }
    return ListenableBuilder(
      listenable: Listenable.merge([account, portfolio, store]),
      builder: (context, _) {
        if (account.initializing) {
          return Scaffold(
            appBar: AppBar(title: const Text('Mon portefeuille')),
            body: const Center(child: CircularProgressIndicator()),
          );
        }
        if (account.identity == null) {
          return Scaffold(
            appBar: AppBar(title: const Text('Mon portefeuille')),
            body: AccountPrompt(account),
          );
        }
        if (!account.portfolioAllowed) {
          return AccountPage(account, store: store);
        }
        final prices = <String, int>{}, names = <String, String>{};
        for (final stock in store.market.stocks) {
          final value = parseUnitPrice(stock.price.toStringAsFixed(2));
          if (value != null) prices[stock.symbol] = value;
          names[stock.symbol] = stock.name;
        }
        final positions = consolidate(portfolio.entries, prices, names),
            totals = PortfolioTotals(
              consolidate(portfolio.entries, prices, names),
            );
        void add([PurchaseEntry? entry]) => Navigator.push(
          context,
          MaterialPageRoute<void>(
            builder: (_) => AddPurchasePage(store, portfolio, editing: entry),
          ),
        );
        return Scaffold(
          appBar: AppBar(
            title: const Text('Mon portefeuille'),
            actions: [
              IconButton(
                tooltip: 'Mon compte',
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute<void>(
                    builder: (_) => AccountPage(account, store: store),
                  ),
                ),
                icon: const Icon(Icons.account_circle_outlined),
              ),
            ],
          ),
          body: RefreshIndicator(
            onRefresh: store.refresh,
            child: PageBody(
              children: [
                Text(
                  'Mes investissements.',
                  style: Theme.of(context).textTheme.headlineLarge,
                ),
                const SizedBox(height: 8),
                Text(
                  account.identity!.email,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const SizedBox(height: 24),
                if (positions.isNotEmpty) ...[
                  Card(
                    color: Brand.lime,
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: DefaultTextStyle.merge(
                        style: const TextStyle(color: Brand.ink),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Row(
                              children: [
                                Icon(
                                  Icons.account_balance_wallet_outlined,
                                  size: 20,
                                  color: Brand.ink,
                                ),
                                SizedBox(width: 8),
                                Expanded(
                                  child: Text('Valeur de mon portefeuille'),
                                ),
                              ],
                            ),
                            const SizedBox(height: 20),
                            Text(
                              totals.value == null
                                  ? 'Cours incomplets'
                                  : amount(totals.value!),
                              style: const TextStyle(
                                fontSize: 32,
                                height: 1.2,
                                fontWeight: FontWeight.w700,
                                letterSpacing: -.8,
                                fontFeatures: [FontFeature.tabularFigures()],
                              ),
                            ),
                            if (totals.value != null)
                              const Text(
                                'FCFA',
                                style: TextStyle(fontSize: 13),
                              ),
                            const SizedBox(height: 16),
                            Text(
                              totals.gain == null
                                  ? 'Plus-value indisponible'
                                  : '${amount(totals.gain!, signed: true)} FCFA · ${percentage(totals.gain!, totals.invested)}',
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              '${positions.length} sociétés · ${money(totals.quantity)} actions',
                            ),
                            const SizedBox(height: 6),
                            const Text(
                              'Plus-value latente, hors frais et dividendes',
                              style: TextStyle(fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                ],
                MarketNotice(store),
                BrokerProfileShortcut(store, portfolio),
                const SizedBox(height: 12),
                if (portfolio.entries.isNotEmpty)
                  OutlinedButton.icon(
                    onPressed: () => Navigator.push(
                      context,
                      MaterialPageRoute<void>(
                        builder: (_) => PortfolioScenarioPage(store, portfolio),
                      ),
                    ),
                    icon: const Icon(Icons.calculate_outlined),
                    label: const Text('Simuler mes titres'),
                  ),
                if (portfolio.entries.isNotEmpty) const SizedBox(height: 12),
                if (portfolio.loading) ...[
                  const LinearProgressIndicator(),
                  const SizedBox(height: 16),
                  const Text('Ouverture de ton portefeuille sécurisé…'),
                ],
                if (portfolio.error != null) ...[
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(18),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(portfolio.error!),
                          TextButton(
                            onPressed: portfolio.loading || portfolio.saving
                                ? null
                                : portfolio.load,
                            child: const Text('Réessayer'),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
                FilledButton.icon(
                  onPressed:
                      !portfolio.canEdit ||
                          store.market.empty ||
                          portfolio.entries.length >= 500
                      ? null
                      : () => add(),
                  icon: const Icon(Icons.add),
                  label: const Text('Ajouter une action'),
                ),
                if (store.market.empty)
                  const Padding(
                    padding: EdgeInsets.only(top: 12),
                    child: Text(
                      'Actualise le marché pour retrouver la liste officielle des actions. Les cours manquants ne sont pas remplacés par zéro.',
                    ),
                  ),
                const SizedBox(height: 16),
                const Text(
                  'Les montants ci-dessous suivent les derniers cours publiés. Les plus-values sont latentes, hors frais, fiscalité et dividendes. Ce portefeuille n’exécute aucune opération de bourse.',
                  style: TextStyle(fontSize: 12),
                ),
                if (portfolio.entries.isEmpty &&
                    !portfolio.loading &&
                    portfolio.error == null) ...[
                  const SizedBox(height: 28),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(
                            Icons.account_balance_wallet_outlined,
                            size: 40,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'Ton portefeuille commence ici.',
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          const SizedBox(height: 10),
                          const Text(
                            'Choisis une société de la BRVM, indique le nombre d’actions et leur prix unitaire à l’achat, puis valide.',
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
                const SectionTitle('1. Mes achats et leur valeur actuelle'),
                if (portfolio.entries.isEmpty)
                  const Text('Les détails de chaque achat apparaîtront ici.'),
                for (final entry in portfolio.entries)
                  _purchase(
                    context,
                    entry,
                    prices[entry.symbol],
                    names[entry.symbol] ?? entry.companyName,
                    portfolio,
                    () => add(entry),
                  ),
                const SectionTitle('2. Comprendre mon cours moyen'),
                const FormulaPanel(
                  title: 'Cours moyen pondéré d’un titre',
                  formula:
                      'Montant total investi dans ce titre ÷ nombre total d’actions de ce titre',
                  explanation:
                      'Pour plusieurs achats, additionne les montants payés et les quantités. Le cours moyen se calcule séparément pour chaque société ; on ne mélange pas les prix d’actions différentes.',
                ),
                for (final position in positions)
                  Padding(
                    padding: const EdgeInsets.only(top: 14),
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            AssetHeading(position.symbol, position.name),
                            const SizedBox(height: 16),
                            Metrics([
                              (
                                'Cours moyen pondéré',
                                '${amount(position.averageRounded)} FCFA',
                              ),
                              (
                                'Quantité détenue',
                                '${money(position.quantity)} actions',
                              ),
                              (
                                'Montant total investi',
                                '${amount(position.invested)} FCFA',
                              ),
                            ]),
                            const SizedBox(height: 16),
                            const Text(
                              'Tes prix d’achat unitaires',
                              style: TextStyle(fontWeight: FontWeight.w700),
                            ),
                            for (final p in position.purchases)
                              Padding(
                                padding: const EdgeInsets.only(top: 6),
                                child: Text(
                                  '${money(p.quantity)} actions à ${amount(BigInt.from(p.unitPriceMinor))} FCFA',
                                ),
                              ),
                            const SizedBox(height: 16),
                            SelectableText(
                              'Calcul pour ${position.symbol} :\n${amount(position.invested)} FCFA ÷ ${money(position.quantity)} actions = ${amount(position.averageRounded)} FCFA par action',
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                const SizedBox(height: 12),
                const Text(
                  'Les cours moyens affichés sont arrondis à 2 décimales. Les calculs de plus-value conservent la précision complète.',
                  style: TextStyle(fontSize: 12),
                ),
                const SectionTitle('3. Plus-values et performance totale'),
                const FormulaPanel(
                  title: 'De la plus-value par action au total',
                  formula:
                      'Plus-value par action = cours actuel − cours moyen\n\nPlus-value du titre = plus-value par action × quantité détenue\n\nPlus-value du portefeuille = somme des plus-values des titres',
                  explanation:
                      'Une hausse donne une plus-value positive ; une baisse, une moins-value. Tant que les titres ne sont pas vendus, cette variation reste latente.',
                ),
                for (final position in positions)
                  Padding(
                    padding: const EdgeInsets.only(top: 14),
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            AssetHeading(position.symbol, position.name),
                            const SizedBox(height: 16),
                            Metrics([
                              (
                                'Quantité détenue',
                                '${money(position.quantity)} actions',
                              ),
                              (
                                'Cours actuel publié',
                                position.currentPriceMinor == null
                                    ? 'Indisponible'
                                    : '${amount(BigInt.from(position.currentPriceMinor!))} FCFA',
                              ),
                              (
                                'Cours moyen',
                                '${amount(position.averageRounded)} FCFA',
                              ),
                              (
                                'Plus-value par action',
                                position.perShareGainRounded == null
                                    ? 'Indisponible'
                                    : '${amount(position.perShareGainRounded!, signed: true)} FCFA',
                              ),
                            ]),
                            const SizedBox(height: 18),
                            GainLabel(
                              position.gain,
                              label: 'Plus-value totale du titre',
                            ),
                            if (position.gain != null)
                              Text(
                                'Rentabilité latente : ${percentage(position.gain!, position.invested)}',
                              ),
                          ],
                        ),
                      ),
                    ),
                  ),
                if (positions.isNotEmpty) ...[
                  const SectionTitle('L’ensemble de ton portefeuille'),
                  Metrics([
                    (
                      'Montant total investi',
                      '${amount(totals.invested)} FCFA',
                    ),
                    (
                      'Valorisation actuelle',
                      totals.value == null
                          ? 'Incomplète'
                          : '${amount(totals.value!)} FCFA',
                    ),
                    ('Quantité totale', '${money(totals.quantity)} actions'),
                    ('Sociétés différentes', '${positions.length}'),
                  ]),
                  const SizedBox(height: 18),
                  GainLabel(totals.gain, label: 'Plus-value latente totale'),
                  if (totals.gain != null)
                    Text(
                      'Rentabilité latente totale : ${percentage(totals.gain!, totals.invested)}',
                    ),
                  if (totals.missingPrices > 0)
                    Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: Text(
                        '${totals.missingPrices} titre(s) n’ont pas de cours chargé. La valorisation totale et la plus-value totale restent indisponibles pour éviter un total trompeur.',
                      ),
                    ),
                ],
                const SizedBox(height: 28),
                const Text(
                  'Sauvegarde chiffrée sur cet appareil, pour le compte connecté. Ce portefeuille n’est pas synchronisé avec le site ou tes autres appareils ; une désinstallation peut supprimer les saisies locales.',
                  style: TextStyle(fontSize: 12),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _purchase(
    BuildContext context,
    PurchaseEntry p,
    int? current,
    String name,
    PortfolioController portfolio,
    VoidCallback edit,
  ) {
    final invested = investment(p);
    final value = current == null
        ? null
        : BigInt.from(p.quantity) * BigInt.from(current);
    final gain = value == null ? null : value - invested;
    return Card(
      margin: const EdgeInsets.only(bottom: 14),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(child: AssetHeading(p.symbol, name)),
                PopupMenuButton<String>(
                  tooltip: 'Gérer cet achat',
                  enabled: !portfolio.saving,
                  onSelected: (value) async {
                    if (value == 'edit') {
                      edit();
                      return;
                    }
                    final confirmed = await showDialog<bool>(
                      context: context,
                      builder: (context) => AlertDialog(
                        title: const Text('Supprimer cet achat ?'),
                        content: Text(
                          '${money(p.quantity)} actions ${p.symbol} à ${amount(BigInt.from(p.unitPriceMinor))} FCFA seront retirées du suivi.',
                        ),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(context, false),
                            child: const Text('Annuler'),
                          ),
                          FilledButton(
                            onPressed: () => Navigator.pop(context, true),
                            child: const Text('Supprimer'),
                          ),
                        ],
                      ),
                    );
                    if (confirmed == true) await portfolio.remove(p.id);
                  },
                  itemBuilder: (_) => const [
                    PopupMenuItem(
                      value: 'edit',
                      child: Text('Corriger cet achat'),
                    ),
                    PopupMenuItem(
                      value: 'delete',
                      child: Text('Supprimer cet achat'),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),
            Metrics([
              ('Nombre d’actions', (money(p.quantity))),
              (
                'Cours à l’achat',
                '${amount(BigInt.from(p.unitPriceMinor))} FCFA',
              ),
              (
                'Cours actuel publié',
                current == null
                    ? 'Indisponible'
                    : '${amount(BigInt.from(current))} FCFA',
              ),
              ('Montant investi', '${amount(invested)} FCFA'),
            ]),
            const SizedBox(height: 16),
            GainLabel(gain, label: 'Plus-value de cet achat'),
            if (gain != null)
              Text('Rentabilité latente : ${percentage(gain, invested)}'),
          ],
        ),
      ),
    );
  }
}

class AssetHeading extends StatelessWidget {
  final String symbol, name;
  const AssetHeading(this.symbol, this.name, {super.key});
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(symbol, style: Theme.of(context).textTheme.titleLarge),
      const SizedBox(height: 3),
      Text(name, style: Theme.of(context).textTheme.bodyMedium),
    ],
  );
}

class GainLabel extends StatelessWidget {
  final BigInt? gain;
  final String label;
  const GainLabel(this.gain, {required this.label, super.key});
  @override
  Widget build(BuildContext context) {
    final color = gain == null
        ? Theme.of(context).colorScheme.onSurfaceVariant
        : gain!.isNegative
        ? Theme.of(context).colorScheme.error
        : Theme.of(context).colorScheme.primary;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.w700)),
        const SizedBox(height: 6),
        Text(
          gain == null ? 'Indisponible' : '${amount(gain!, signed: true)} FCFA',
          style: TextStyle(
            fontSize: 25,
            fontWeight: FontWeight.w800,
            color: color,
          ),
        ),
      ],
    );
  }
}

class FormulaPanel extends StatelessWidget {
  final String title, formula, explanation;
  const FormulaPanel({
    required this.title,
    required this.formula,
    required this.explanation,
    super.key,
  });
  @override
  Widget build(BuildContext context) => Card(
    color: Theme.of(context).colorScheme.primaryContainer,
    child: Padding(
      padding: const EdgeInsets.all(22),
      child: DefaultTextStyle.merge(
        style: TextStyle(
          color: Theme.of(context).colorScheme.onPrimaryContainer,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(Icons.school_outlined),
            const SizedBox(height: 10),
            Text(
              title,
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
            ),
            const SizedBox(height: 12),
            SelectableText(
              formula,
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 14),
            Text(explanation),
          ],
        ),
      ),
    ),
  );
}
