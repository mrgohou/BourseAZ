import 'package:flutter/material.dart';
import '../core/store.dart';
import '../data/market.dart';
import 'widgets.dart';
import 'design.dart';
import 'official.dart';
import 'official_updates.dart';

class MarketPage extends StatefulWidget {
  final AppStore store;
  const MarketPage(this.store, {super.key});
  @override
  State<MarketPage> createState() => _MarketPageState();
}

class _MarketPageState extends State<MarketPage> {
  String search = '', sector = 'Tous', order = 'Variation';
  bool favorites = false, showFilters = false;
  final compare = <String>{};
  @override
  Widget build(BuildContext context) {
    final store = widget.store;
    final stocks = store.market.stocks
        .where(
          (s) =>
              ('${s.name} ${s.symbol}').toLowerCase().contains(
                search.toLowerCase(),
              ) &&
              (sector == 'Tous' || s.sector == sector) &&
              (!favorites || store.favorites.contains(s.symbol)),
        )
        .toList();
    stocks.sort(
      (a, b) => switch (order) {
        'Volume' => b.volume.compareTo(a.volume),
        'Nom' => a.name.compareTo(b.name),
        'Cours' => b.price.compareTo(a.price),
        'Année' => (b.ytd ?? double.negativeInfinity).compareTo(
          a.ytd ?? double.negativeInfinity,
        ),
        _ => b.change.compareTo(a.change),
      },
    );
    return RefreshIndicator(
      onRefresh: store.refresh,
      child: PageBody(
        children: [
          const PageHeading(
            'Explorer le marché.',
            'Les cours publiés et les entreprises de la BRVM.',
          ),
          MarketNotice(store),
          TextField(
            decoration: const InputDecoration(
              labelText: 'Rechercher une action',
              prefixIcon: Icon(Icons.search),
            ),
            onChanged: (v) => setState(() => search = v),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              FilterChip(
                label: const Text('Mes favoris'),
                selected: favorites,
                onSelected: (v) => setState(() => favorites = v),
              ),
              FilterChip(
                avatar: const Icon(Icons.tune_rounded, size: 18),
                label: Text(sector == 'Tous' ? 'Filtres et tri' : sector),
                selected: showFilters || sector != 'Tous',
                onSelected: (_) => setState(() => showFilters = !showFilters),
              ),
            ],
          ),
          if (showFilters) ...[
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final s in [
                  'Tous',
                  ...store.market.stocks
                      .map((s) => s.sector)
                      .where((s) => s != 'Non classé')
                      .toSet(),
                ])
                  ChoiceChip(
                    label: Text(s),
                    selected: sector == s,
                    onSelected: (_) => setState(() => sector = s),
                  ),
              ],
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              isExpanded: true,
              itemHeight: null,
              initialValue: order,
              decoration: const InputDecoration(labelText: 'Trier les actions'),
              items: ['Variation', 'Volume', 'Nom', 'Cours', 'Année']
                  .map(
                    (v) => DropdownMenuItem(
                      value: v,
                      child: Text(
                        v == 'Année' ? 'Performance annuelle' : v,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  )
                  .toList(),
              onChanged: (v) => setState(() => order = v!),
            ),
          ],
          SectionTitle(
            '${stocks.length} actions',
            trailing: TextButton.icon(
              onPressed: compare.length < 2
                  ? null
                  : () => Navigator.push(
                      context,
                      MaterialPageRoute<void>(
                        builder: (_) => ComparisonPage(store, compare.toList()),
                      ),
                    ),
              icon: const Icon(Icons.compare_arrows),
              label: Text('Comparer (${compare.length}/4)'),
            ),
          ),
          const Text(
            'Coche 2 à 4 titres pour comparer leurs indicateurs publiés.',
            style: TextStyle(fontSize: 12),
          ),
          const SizedBox(height: 12),
          if (stocks.isEmpty)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  store.market.empty
                      ? 'Aucun cours officiel chargé. Tire pour actualiser.'
                      : 'Aucune action ne correspond à ces filtres.',
                ),
              ),
            ),
          for (final s in stocks)
            Card(
              margin: const EdgeInsets.only(bottom: 10),
              child: Column(
                children: [
                  StockTile(s, store),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Row(
                      children: [
                        Checkbox(
                          value: compare.contains(s.symbol),
                          semanticLabel: 'Comparer ${s.symbol}',
                          onChanged:
                              !compare.contains(s.symbol) && compare.length >= 4
                              ? null
                              : (v) => setState(
                                  () => v == true
                                      ? compare.add(s.symbol)
                                      : compare.remove(s.symbol),
                                ),
                        ),
                        Expanded(
                          child: Text(
                            '${money(s.volume)} titres · ${s.sector}',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ),
                        IconButton(
                          tooltip: 'Favori ${s.symbol}',
                          onPressed: () => store.toggleFavorite(s.symbol),
                          icon: Icon(
                            store.favorites.contains(s.symbol)
                                ? Icons.bookmark
                                : Icons.bookmark_border,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class ComparisonPage extends StatelessWidget {
  final AppStore store;
  final List<String> symbols;
  const ComparisonPage(this.store, this.symbols, {super.key});
  @override
  Widget build(BuildContext context) {
    final stocks = store.market.stocks
        .where((s) => symbols.contains(s.symbol))
        .toList();
    String val(double? n, {String unit = '%'}) =>
        n == null ? 'Non publié' : '${n.toStringAsFixed(2)} $unit';
    return Scaffold(
      appBar: AppBar(title: const Text('Comparer les entreprises')),
      body: PageBody(
        children: [
          const Text('Même séance. Sources vérifiables.'),
          MarketNotice(store),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: DataTable(
              columns: [
                const DataColumn(label: Text('Indicateur')),
                for (final s in stocks) DataColumn(label: Text(s.symbol)),
              ],
              rows: [
                DataRow(
                  cells: [
                    const DataCell(Text('Clôture FCFA')),
                    for (final s in stocks) DataCell(Text(money(s.price))),
                  ],
                ),
                DataRow(
                  cells: [
                    const DataCell(Text('Variation séance')),
                    for (final s in stocks) DataCell(Text(val(s.change))),
                  ],
                ),
                DataRow(
                  cells: [
                    const DataCell(Text('Variation annuelle')),
                    for (final s in stocks) DataCell(Text(val(s.ytd))),
                  ],
                ),
                DataRow(
                  cells: [
                    const DataCell(Text('PER publié')),
                    for (final s in stocks)
                      DataCell(Text(val(s.per, unit: '×'))),
                  ],
                ),
                DataRow(
                  cells: [
                    const DataCell(Text('Rendement net publié')),
                    for (final s in stocks) DataCell(Text(val(s.yieldPercent))),
                  ],
                ),
                DataRow(
                  cells: [
                    const DataCell(Text('Dernier dividende net')),
                    for (final s in stocks)
                      DataCell(Text(val(s.dividend, unit: 'FCFA'))),
                  ],
                ),
                DataRow(
                  cells: [
                    const DataCell(Text('Volume titres')),
                    for (final s in stocks) DataCell(Text(money(s.volume))),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'Un multiple plus bas ou un rendement passé plus élevé ne suffit pas à désigner une meilleure action. Compare les secteurs, les risques, les périodes comptables et les opérations sur titres.',
          ),
          for (final s in stocks)
            ListTile(
              title: Text(s.name),
              subtitle: Text(s.sector),
              trailing: const Icon(Icons.arrow_forward),
              onTap: () => showStock(context, s, store),
            ),
          const SourceButton('Cours officiels BRVM', quotesUrl),
          if (store.market.bulletin != null)
            SourceButton(
              'Bulletin utilisé pour les ratios',
              store.market.bulletin!,
            ),
        ],
      ),
    );
  }
}

class DividendsPage extends StatelessWidget {
  final AppStore store;
  const DividendsPage(this.store, {super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Dividendes publiés')),
    body: ListenableBuilder(
      listenable: store,
      builder: (context, _) => PageBody(
        children: [
          Text(
            'Les distributions.\nAvec leur date.',
            style: Theme.of(context).textTheme.headlineLarge,
          ),
          MarketNotice(store),
          FilledButton.icon(
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute<void>(
                builder: (_) => DividendCalendarPage(store),
              ),
            ),
            icon: const Icon(Icons.event_note),
            label: const Text('Calendrier officiel des dividendes'),
          ),
          const Text(
            'Derniers paiements figurant au bulletin officiel. Des montants peuvent concerner un exercice ancien. Aucun futur versement n’est déduit des paiements passés.',
          ),
          const SizedBox(height: 20),
          if (store.market.bulletin == null)
            const Text(
              'Le bulletin n’a pas encore pu être lu. Aucun montant inventé ne remplace ces données.',
            ),
          for (final s in store.market.stocks.where((s) => s.dividend != null))
            Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: ListTile(
                contentPadding: const EdgeInsets.all(18),
                title: Text(
                  '${s.symbol} · ${s.dividend!.toStringAsFixed(2)} FCFA net / action',
                ),
                subtitle: Text(
                  '${s.name}\nPaiement publié : ${s.dividendDate ?? 'non indiqué'}\nRendement au bulletin : ${s.yieldPercent?.toStringAsFixed(2) ?? 'non publié'} %',
                ),
                isThreeLine: true,
                onTap: () => showStock(context, s, store),
              ),
            ),
          if (store.market.bulletin != null)
            SourceButton(
              'Vérifier le bulletin original',
              store.market.bulletin!,
            ),
        ],
      ),
    ),
  );
}
