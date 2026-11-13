import 'package:flutter/material.dart';
import '../core/store.dart';
import '../core/theme.dart';
import '../data/lessons.dart';
import '../portfolio/portfolio_page.dart';
import 'official_updates.dart';
import 'widgets.dart';
import 'company.dart';
import 'design.dart';
import '../core/accents.dart';
import 'motion.dart';

class HomePage extends StatelessWidget {
  final AppStore store;
  final void Function(int) navigate;
  const HomePage(this.store, this.navigate, {super.key});
  @override
  Widget build(BuildContext c) {
    final stocks = store.market.stocks;
    final volume = [...stocks]..sort((a, b) => b.volume.compareTo(a.volume));
    final up = stocks.where((s) => s.change > 0).length;
    final down = stocks.where((s) => s.change < 0).length;
    void go(Widget page) =>
        Navigator.push(c, MaterialPageRoute<void>(builder: (_) => page));
    return RefreshIndicator(
      onRefresh: store.refresh,
      child: PageBody(
        children: [
          const PageHeading(
            'Ta bourse, en clair.',
            'Comprendre le marché. Construire ton parcours.',
          ),
          _MarketHero(store, () => navigate(1)),
          MarketNotice(store),
          const SizedBox(height: 8),
          AdaptiveTiles(
            children: [
              ActionTile(
                tone: AccentTone.blue,
                symbol: FriendlySymbol.market,
                icon: Icons.candlestick_chart_outlined,
                title: 'Les actions',
                subtitle: 'Cours et entreprises',
                onTap: () => navigate(1),
              ),
              ActionTile(
                tone: AccentTone.brown,
                symbol: FriendlySymbol.wallet,
                icon: Icons.account_balance_wallet_outlined,
                title: 'Portefeuille',
                subtitle: 'Suivre mes investissements',
                onTap: () => go(PortfolioPage(store)),
              ),
              ActionTile(
                tone: AccentTone.yellow,
                symbol: FriendlySymbol.calendar,
                icon: Icons.event_available_outlined,
                title: 'Dividendes',
                subtitle: 'Montants et calendrier',
                onTap: () => go(DividendCalendarPage(store)),
              ),
              ActionTile(
                tone: AccentTone.pink,
                symbol: FriendlySymbol.news,
                icon: Icons.newspaper_outlined,
                title: 'Actualités',
                subtitle: 'Les publications officielles',
                onTap: () => go(OfficialFeedPage(store, OfficialFeedKind.news)),
              ),
            ],
          ),
          if (stocks.isEmpty) ...[
            const SectionTitle('Les cours à la source'),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.cloud_off_outlined),
                    const SizedBox(height: 12),
                    const Text('Les données de marché sont indisponibles.'),
                    const SizedBox(height: 8),
                    const Text(
                      'Actualise pour recevoir les publications officielles de la BRVM.',
                    ),
                    TextButton(
                      onPressed: store.refreshing ? null : store.refresh,
                      child: const Text('Réessayer'),
                    ),
                  ],
                ),
              ),
            ),
          ] else ...[
            const SectionTitle('Le pouls de la séance'),
            _SessionBreadth(up, down, stocks.length - up - down),
            const SizedBox(height: 12),
            Metrics([
              ('Actions suivies', '${stocks.length}'),
              (
                'Volumes échangés',
                '${money(stocks.fold<int>(0, (n, s) => n + s.volume))} titres',
              ),
            ]),
            SectionTitle(
              'Les plus échangées',
              trailing: TextButton(
                onPressed: () => navigate(1),
                child: const Text('Tout voir'),
              ),
            ),
            Card(
              child: Column(
                children: [
                  for (var i = 0; i < volume.take(4).length; i++) ...[
                    if (i > 0)
                      const Divider(height: 1, indent: 16, endIndent: 16),
                    StockTile(volume[i], store),
                  ],
                ],
              ),
            ),
          ],
          SectionTitle(
            'Ta sélection',
            trailing: TextButton(
              onPressed: () => navigate(1),
              child: const Text('Gérer'),
            ),
          ),
          Card(
            child: store.favorites.isEmpty
                ? const Padding(
                    padding: EdgeInsets.all(20),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.bookmark_border_rounded),
                        SizedBox(width: 14),
                        Expanded(
                          child: Text(
                            'Retrouve ici tes entreprises favorites. Ajoute-les depuis le marché.',
                          ),
                        ),
                      ],
                    ),
                  )
                : Column(
                    children: stocks
                        .where((s) => store.favorites.contains(s.symbol))
                        .map((s) => StockTile(s, store))
                        .toList(),
                  ),
          ),
          const SectionTitle('Les sources pour comprendre'),
          OfficialUpdatesLinks(store),
          const SectionTitle('Un peu plus loin, chaque jour'),
          ProgressSummary(
            completed: store.completed.length,
            total: lessons.length,
            title: 'Fais grandir ton savoir.',
            action: FilledButton.icon(
              onPressed: () => navigate(3),
              icon: const Icon(Icons.arrow_forward_rounded),
              label: const Text('Continuer mon parcours'),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Information, apprentissage et simulation. Les performances passées ne garantissent pas les résultats futurs.',
            style: Theme.of(c).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}

class _MarketHero extends StatelessWidget {
  final AppStore store;
  final VoidCallback onExplore;
  const _MarketHero(this.store, this.onExplore);
  @override
  Widget build(BuildContext c) {
    final index = store.market.indices.firstOrNull;
    return Card(
      color: Brand.lime,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: DefaultTextStyle.merge(
          style: const TextStyle(color: Brand.ink),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.public_rounded, color: Brand.ink, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      index?.name ?? 'BRVM Composite',
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                  ),
                  const Icon(
                    Icons.north_east_rounded,
                    color: Brand.ink,
                    size: 20,
                  ),
                ],
              ),
              const SizedBox(height: 22),
              Text(
                index?.value.toStringAsFixed(2) ?? '—',
                style: TextStyle(
                  fontSize: MediaQuery.textScalerOf(c).scale(16) > 23 ? 34 : 44,
                  height: 1.15,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -1.8,
                  fontFeatures: [FontFeature.tabularFigures()],
                ),
              ),
              const SizedBox(height: 10),
              if (index != null)
                Wrap(
                  spacing: 10,
                  runSpacing: 8,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    ChangeBadge(index.change),
                    const Text('sur la séance', style: TextStyle(fontSize: 13)),
                  ],
                )
              else
                const Text('En attente d’une publication officielle'),
              if (store.market.indices.length > 1) ...[
                const Divider(color: Color(0xFFB4D176), height: 40),
                LayoutBuilder(
                  builder: (c, box) {
                    final large = MediaQuery.textScalerOf(c).scale(16) > 23;
                    return Wrap(
                      spacing: 16,
                      runSpacing: 18,
                      children: [
                        for (final item in store.market.indices.skip(1))
                          SizedBox(
                            width: large
                                ? box.maxWidth
                                : (box.maxWidth - 16) / 2,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item.name,
                                  style: const TextStyle(fontSize: 12),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  item.value.toStringAsFixed(2),
                                  style: const TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.w700,
                                    fontFeatures: [
                                      FontFeature.tabularFigures(),
                                    ],
                                  ),
                                ),
                                Text(
                                  '${item.change > 0 ? '+' : ''}${item.change.toStringAsFixed(2)} %',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                      ],
                    );
                  },
                ),
              ],
              const SizedBox(height: 16),
              TextButton.icon(
                onPressed: onExplore,
                style: TextButton.styleFrom(
                  foregroundColor: Brand.ink,
                  padding: EdgeInsets.zero,
                ),
                icon: const Icon(Icons.arrow_forward_rounded, size: 18),
                label: const Text('Explorer le marché'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SessionBreadth extends StatelessWidget {
  final int up, down, unchanged;
  const _SessionBreadth(this.up, this.down, this.unchanged);
  @override
  Widget build(BuildContext c) {
    final s = Theme.of(c).colorScheme;
    final total = up + down + unchanged;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Répartition des actions',
              style: Theme.of(c).textTheme.titleMedium,
            ),
            const SizedBox(height: 6),
            Text(
              'Nombre de titres par variation de cours',
              style: Theme.of(c).textTheme.bodySmall,
            ),
            const SizedBox(height: 22),
            for (final row in [
              (Icons.north_east_rounded, 'En hausse', up, s.primary),
              (Icons.south_east_rounded, 'En baisse', down, s.error),
              (Icons.east_rounded, 'Inchangées', unchanged, s.onSurfaceVariant),
            ])
              Padding(
                padding: const EdgeInsets.only(bottom: 14),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Icon(row.$1, size: 16, color: row.$4),
                        const SizedBox(width: 8),
                        Expanded(child: Text(row.$2)),
                        Flexible(
                          child: Text(
                            '${row.$3} · ${total == 0 ? '0' : (row.$3 * 100 / total).toStringAsFixed(0)} %',
                            textAlign: TextAlign.end,
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Semantics(
                      label: '${row.$2} : ${row.$3} actions',
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: LinearProgressIndicator(
                          value: total == 0 ? 0 : row.$3 / total,
                          minHeight: 8,
                          color: row.$4,
                          backgroundColor: s.surfaceContainerLow,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
