import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../core/store.dart';
import '../core/theme.dart';
import '../data/market.dart';
export 'projection_chart.dart';
import 'company.dart';
import 'design.dart';

String money(num value) =>
    NumberFormat.decimalPattern('fr_FR').format(value.round());

class PageBody extends StatelessWidget {
  final List<Widget> children;
  const PageBody({super.key, required this.children});
  @override
  Widget build(BuildContext context) => Align(
    alignment: Alignment.topCenter,
    child: ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 720),
      child: ListView(
        primary: false,
        physics: const AlwaysScrollableScrollPhysics(),
        padding: EdgeInsets.fromLTRB(
          MediaQuery.sizeOf(context).width < 360 ? 16 : 20,
          12,
          MediaQuery.sizeOf(context).width < 360 ? 16 : 20,
          32,
        ),
        children: children,
      ),
    ),
  );
}

class SectionTitle extends StatelessWidget {
  final String title;
  final Widget? trailing;
  const SectionTitle(this.title, {super.key, this.trailing});
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(top: 28, bottom: 14),
    child: Wrap(
      alignment: WrapAlignment.spaceBetween,
      crossAxisAlignment: WrapCrossAlignment.center,
      spacing: 12,
      runSpacing: 4,
      children: [
        Text(
          title,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 18),
        ),
        ?trailing,
      ],
    ),
  );
}

class MarketNotice extends StatelessWidget {
  final AppStore store;
  const MarketNotice(this.store, {super.key});
  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).colorScheme;
    final label = store.market.empty
        ? 'Cours officiels indisponibles'
        : '${store.offline
              ? 'Hors connexion · '
              : store.stale
              ? 'Publication ancienne · '
              : ''}BRVM · ${DateFormat('dd MMM yyyy · HH:mm', 'fr_FR').format(store.market.asOf.toUtc())} UTC';
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.verified_outlined, size: 18, color: c.onSurfaceVariant),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                color: c.onSurfaceVariant,
                fontSize: 12,
                fontWeight: FontWeight.w500,
                height: 1.5,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class StockTile extends StatelessWidget {
  final Stock stock;
  final AppStore store;
  const StockTile(this.stock, this.store, {super.key});
  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, box) {
      final theme = Theme.of(context);
      final compact =
          box.maxWidth < 310 || MediaQuery.textScalerOf(context).scale(16) > 23;
      final identity = Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            stock.symbol,
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 3),
          Text(stock.name, style: theme.textTheme.bodySmall),
        ],
      );
      final price = Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Text(
            money(stock.price),
            style: theme.textTheme.titleMedium?.copyWith(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              fontFeatures: const [FontFeature.tabularFigures()],
            ),
          ),
          Text(
            'FCFA',
            style: theme.textTheme.bodySmall?.copyWith(fontSize: 10),
          ),
          const SizedBox(height: 6),
          ChangeBadge(stock.change),
        ],
      );
      return InkWell(
        onTap: () => showStock(context, stock, store),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: compact
              ? Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [identity, const SizedBox(height: 12), price],
                )
              : Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Container(
                      width: 42,
                      height: 42,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: theme.colorScheme.surfaceContainerLow,
                        borderRadius: BorderRadius.circular(15),
                      ),
                      child: Text(
                        stock.symbol.substring(0, 2),
                        style: TextStyle(
                          color: theme.colorScheme.primary,
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(child: identity),
                    const SizedBox(width: 12),
                    price,
                  ],
                ),
        ),
      );
    },
  );
}

void showStock(BuildContext context, Stock stock, AppStore store) {
  Navigator.push(
    context,
    MaterialPageRoute<void>(builder: (_) => CompanyPage(stock.symbol, store)),
  );
}

class LimePanel extends StatelessWidget {
  final Widget child;
  const LimePanel({super.key, required this.child});
  @override
  Widget build(BuildContext context) => Card(
    color: Brand.lime,
    child: Theme(
      data: Brand.theme(
        Brightness.light,
      ).copyWith(cardTheme: const CardThemeData(color: Brand.lime)),
      child: DefaultTextStyle.merge(
        style: const TextStyle(color: Brand.ink),
        child: Padding(padding: const EdgeInsets.all(24), child: child),
      ),
    ),
  );
}
