import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:html/parser.dart' as html;
import '../core/store.dart';
import '../data/market.dart';
import '../data/official_feeds.dart';
import '../portfolio/add_purchase_page.dart' show StockPicker;
import 'widgets.dart';
import 'official.dart';
import 'bridge_services.dart';

String officialDate(DateTime? date) => date == null
    ? 'Date non affichée par la source'
    : DateFormat('dd/MM/yyyy', 'fr').format(date);

class OfficialUpdatesLinks extends StatelessWidget {
  final AppStore store;
  const OfficialUpdatesLinks(this.store, {super.key});
  @override
  Widget build(BuildContext context) => Card(
    child: Column(
      children: [
        _link(
          context,
          Icons.newspaper_outlined,
          'Actualités et avis officiels',
          () => OfficialFeedPage(store, OfficialFeedKind.news),
        ),
        _link(
          context,
          Icons.event_note_outlined,
          'Calendrier et dividendes',
          () => OfficialCalendarPage(store),
        ),
        _link(
          context,
          Icons.description_outlined,
          'Rapports d’activités',
          () => ActivityReportsPage(store),
        ),
        _link(
          context,
          Icons.receipt_long_outlined,
          'Coûts et barèmes officiels',
          () => OfficialFeedPage(store, OfficialFeedKind.tariffs),
        ),
      ],
    ),
  );
  Widget _link(
    BuildContext c,
    IconData icon,
    String title,
    Widget Function() page,
  ) => ListTile(
    leading: Icon(icon),
    title: Text(title),
    trailing: const Icon(Icons.chevron_right),
    onTap: () =>
        Navigator.push(c, MaterialPageRoute<void>(builder: (_) => page())),
  );
}

enum OfficialFeedKind { news, notices, tariffs, meetings }

class OfficialFeedPage extends StatefulWidget {
  final AppStore store;
  final OfficialFeedKind kind;
  const OfficialFeedPage(this.store, this.kind, {super.key});
  @override
  State<OfficialFeedPage> createState() => _OfficialFeedPageState();
}

class _OfficialFeedPageState extends State<OfficialFeedPage> {
  int page = 0;
  DateTime? consulted;
  String get source => switch (widget.kind) {
    OfficialFeedKind.news => newsUrl,
    OfficialFeedKind.notices => noticesUrl,
    OfficialFeedKind.tariffs => tariffsUrl,
    OfficialFeedKind.meetings => meetingsUrl,
  };
  String get title => switch (widget.kind) {
    OfficialFeedKind.news => 'Actualités et avis BRVM',
    OfficialFeedKind.notices => 'Avis officiels',
    OfficialFeedKind.tariffs => 'Coûts et barèmes',
    OfficialFeedKind.meetings => 'Assemblées générales',
  };
  late Future<FeedPage<OfficialEntry>> future = load();
  Future<FeedPage<OfficialEntry>> load() async {
    final feed = OfficialFeeds(widget.store.repository);
    final FeedPage<OfficialEntry> value;
    if (widget.kind == OfficialFeedKind.news) {
      final parts = await Future.wait([
        feed.news(page),
        feed.documents(noticesUrl, page),
      ]);
      value = FeedPage([
        ...parts[1].items,
        ...parts[0].items,
      ], parts.any((p) => p.hasNext));
    } else {
      value = await feed.documents(source, page);
    }
    consulted = DateTime.now();
    return value;
  }

  void reload([int? next]) {
    widget.store.repository.invalidatePublicCaches();
    setState(() {
      page = next ?? page;
      future = load();
    });
  }

  @override
  Widget build(BuildContext c) => Scaffold(
    appBar: AppBar(
      title: Text(title),
      actions: [
        IconButton(
          tooltip: 'Actualiser',
          onPressed: reload,
          icon: const Icon(Icons.refresh),
        ),
      ],
    ),
    body: PageBody(
      children: [
        Text(title, style: Theme.of(c).textTheme.headlineMedium),
        const SizedBox(height: 12),
        Text(switch (widget.kind) {
          OfficialFeedKind.news =>
            'Derniers avis du marché et articles publiés par la BRVM. Les dates affichées sont celles de la source, jamais la date de consultation présentée comme une date d’actualité.',
          OfficialFeedKind.tariffs =>
            'Barèmes publiés par la BRVM et le DC/BR, avec leur date de publication. Ils ne remplacent pas le contrat de ta SGI : courtage, minimum, garde et fiscalité peuvent s’ajouter. Aucun tarif de SGI n’est présumé.',
          OfficialFeedKind.meetings =>
            'Avis de convocation officiels. La date affichée est celle de publication de l’avis ; la date, le lieu et les résolutions de l’assemblée figurent dans le document.',
          OfficialFeedKind.notices =>
            'Suspensions, opérations sur titres et autres avis publiés par la BRVM.',
        }),
        SourceButton('Consulter la source BRVM', source),
        if (widget.kind == OfficialFeedKind.tariffs)
          BridgeServicesCard(widget.store),
        if (widget.kind == OfficialFeedKind.news)
          TextButton.icon(
            onPressed: () => Navigator.push(
              c,
              MaterialPageRoute<void>(
                builder: (_) =>
                    OfficialFeedPage(widget.store, OfficialFeedKind.notices),
              ),
            ),
            icon: const Icon(Icons.campaign_outlined),
            label: const Text('Voir les avis et opérations sur titres'),
          ),
        FutureBuilder<FeedPage<OfficialEntry>>(
          future: future,
          builder: (c, s) {
            if (s.connectionState != ConnectionState.done) {
              return const Padding(
                padding: EdgeInsets.all(24),
                child: Center(child: CircularProgressIndicator()),
              );
            }
            if (s.hasError) return FeedFailure(onRetry: reload);
            final data = s.data!;
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Consulté le ${DateFormat('dd/MM/yyyy à HH:mm', 'fr').format(consulted!)}',
                  style: Theme.of(c).textTheme.bodySmall,
                ),
                if (data.items.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 20),
                    child: Text(
                      'Aucune publication lisible sur cette page. Consulte la source officielle ; aucune donnée de remplacement n’est affichée.',
                    ),
                  ),
                for (final entry in data.items)
                  Card(
                    margin: const EdgeInsets.symmetric(vertical: 8),
                    child: ListTile(
                      contentPadding: const EdgeInsets.all(18),
                      title: Text(entry.title),
                      subtitle: Text(
                        '${entry.date == null ? 'Date non affichée' : 'Publication : ${officialDate(entry.date)}'}${entry.summary.isEmpty ? '' : '\n\n${entry.summary}'}\n\nBRVM · source officielle',
                      ),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () => Navigator.push(
                        c,
                        MaterialPageRoute<void>(
                          builder: (_) =>
                              Uri.parse(
                                entry.url,
                              ).path.toLowerCase().endsWith('.pdf')
                              ? ReportReader(entry.document, widget.store)
                              : OfficialArticlePage(widget.store, entry),
                        ),
                      ),
                    ),
                  ),
                FeedPagination(
                  page: page,
                  hasNext: data.hasNext,
                  onPage: reload,
                ),
              ],
            );
          },
        ),
      ],
    ),
  );
}

class FeedFailure extends StatelessWidget {
  final VoidCallback onRetry;
  const FeedFailure({required this.onRetry, super.key});
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 24),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'La source officielle est momentanément indisponible. Réessaie ou ouvre la page originale.',
        ),
        TextButton.icon(
          onPressed: onRetry,
          icon: const Icon(Icons.refresh),
          label: const Text('Réessayer'),
        ),
      ],
    ),
  );
}

class FeedPagination extends StatelessWidget {
  final int page;
  final bool hasNext;
  final ValueChanged<int> onPage;
  const FeedPagination({
    required this.page,
    required this.hasNext,
    required this.onPage,
    super.key,
  });
  @override
  Widget build(BuildContext c) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 20),
    child: Wrap(
      spacing: 8,
      runSpacing: 8,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        if (page > 0)
          OutlinedButton(
            onPressed: () => onPage(page - 1),
            child: const Text('Précédent'),
          ),
        Text('Page ${page + 1}'),
        if (hasNext && page < 100)
          OutlinedButton(
            onPressed: () => onPage(page + 1),
            child: const Text('Suivant'),
          ),
      ],
    ),
  );
}

class OfficialArticlePage extends StatefulWidget {
  final AppStore store;
  final OfficialEntry entry;
  const OfficialArticlePage(this.store, this.entry, {super.key});
  @override
  State<OfficialArticlePage> createState() => _OfficialArticlePageState();
}

class _OfficialArticlePageState extends State<OfficialArticlePage> {
  late final future = widget.store.repository.page(widget.entry.url);
  @override
  Widget build(BuildContext c) => Scaffold(
    appBar: AppBar(title: const Text('Actualité officielle')),
    body: PageBody(
      children: [
        Text(widget.entry.title, style: Theme.of(c).textTheme.headlineSmall),
        SourceButton('Article original BRVM', widget.entry.url),
        FutureBuilder<String>(
          future: future,
          builder: (c, s) {
            if (s.connectionState != ConnectionState.done) {
              return const Center(child: CircularProgressIndicator());
            }
            if (s.hasError) {
              return const Text(
                'Lecture intégrée indisponible. Ouvre l’article original ci-dessus.',
              );
            }
            final p = html.parse(s.data!),
                body = p.querySelector('.field-name-body .field-item');
            final text = body?.text.trim() ?? '';
            return SelectableText(
              text.isEmpty
                  ? 'Le texte n’a pas pu être extrait. L’article original reste accessible.'
                  : text,
            );
          },
        ),
      ],
    ),
  );
}

class OfficialCalendarPage extends StatelessWidget {
  final AppStore store;
  const OfficialCalendarPage(this.store, {super.key});
  @override
  Widget build(BuildContext c) => Scaffold(
    appBar: AppBar(title: const Text('Calendrier officiel')),
    body: PageBody(
      children: [
        Text(
          'Les dates.\nÀ la source.',
          style: Theme.of(c).textTheme.headlineLarge,
        ),
        const SizedBox(height: 16),
        const Text(
          'Dates annoncées par la BRVM. Un avis rectificatif peut les modifier : vérifie le document avant toute décision.',
        ),
        const SizedBox(height: 16),
        Card(
          child: Column(
            children: [
              ListTile(
                leading: const Icon(Icons.payments_outlined),
                title: const Text('Dividendes : paiements et détachements'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => Navigator.push(
                  c,
                  MaterialPageRoute<void>(
                    builder: (_) => DividendCalendarPage(store),
                  ),
                ),
              ),
              ListTile(
                leading: const Icon(Icons.groups_outlined),
                title: const Text('Convocations aux assemblées'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => Navigator.push(
                  c,
                  MaterialPageRoute<void>(
                    builder: (_) =>
                        OfficialFeedPage(store, OfficialFeedKind.meetings),
                  ),
                ),
              ),
              ListTile(
                leading: const Icon(Icons.event_busy_outlined),
                title: const Text('Jours fériés et horaires de cotation'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => Navigator.push(
                  c,
                  MaterialPageRoute<void>(
                    builder: (_) => OfficialHolidaysPage(store),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

class DividendCalendarPage extends StatefulWidget {
  final AppStore store;
  const DividendCalendarPage(this.store, {super.key});
  @override
  State<DividendCalendarPage> createState() => _DividendCalendarPageState();
}

class _DividendCalendarPageState extends State<DividendCalendarPage> {
  int page = 0;
  String query = '';
  bool upcoming = false;
  late Future<FeedPage<DividendNotice>> future = load();
  Future<FeedPage<DividendNotice>> load() =>
      OfficialFeeds(widget.store.repository).dividends(page);
  void reload([int? next]) {
    widget.store.repository.invalidatePublicCaches();
    setState(() {
      page = next ?? page;
      future = load();
    });
  }

  @override
  Widget build(BuildContext c) => Scaffold(
    appBar: AppBar(
      title: const Text('Calendrier des dividendes'),
      actions: [
        IconButton(
          tooltip: 'Actualiser',
          onPressed: reload,
          icon: const Icon(Icons.refresh),
        ),
      ],
    ),
    body: PageBody(
      children: [
        const Text(
          'Montants nets par action, exercice, détachement et paiement repris du tableau officiel. Un paiement passé ne garantit aucun versement futur. Vérifie les éventuels fractionnements dans l’avis.',
        ),
        const SourceButton('Calendrier original BRVM', dividendsUrl),
        TextField(
          decoration: const InputDecoration(
            labelText: 'Rechercher une société',
            helperText: 'Filtre limité à la page courante',
            helperMaxLines: 2,
            prefixIcon: Icon(Icons.search),
          ),
          onChanged: (v) => setState(() => query = v.toLowerCase().trim()),
        ),
        SwitchListTile(
          contentPadding: EdgeInsets.zero,
          title: const Text('Paiements à venir uniquement'),
          value: upcoming,
          onChanged: (v) => setState(() => upcoming = v),
        ),
        FutureBuilder<FeedPage<DividendNotice>>(
          future: future,
          builder: (c, s) {
            if (s.connectionState != ConnectionState.done) {
              return const Center(child: CircularProgressIndicator());
            }
            if (s.hasError) return FeedFailure(onRetry: reload);
            final now = DateTime.now().toUtc(),
                today = DateTime.utc(now.year, now.month, now.day);
            final items = s.data!.items
                .where(
                  (d) =>
                      d.issuer.toLowerCase().contains(query) &&
                      (!upcoming || !d.paymentDate.isBefore(today)),
                )
                .toList();
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (items.isEmpty)
                  const Padding(
                    padding: EdgeInsets.all(16),
                    child: Text(
                      'Aucun résultat sur cette page pour ces filtres. Les pages suivantes peuvent contenir d’autres annonces.',
                    ),
                  ),
                for (final d in items)
                  Card(
                    margin: const EdgeInsets.symmetric(vertical: 8),
                    child: Padding(
                      padding: const EdgeInsets.all(18),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            d.issuer,
                            style: Theme.of(c).textTheme.titleLarge,
                          ),
                          const SizedBox(height: 10),
                          Text(
                            '${NumberFormat.decimalPattern('fr_FR').format(d.netPerShare)} FCFA net / action',
                            style: Theme.of(c).textTheme.headlineSmall,
                          ),
                          const SizedBox(height: 10),
                          Text(
                            'Exercice : ${d.year}\nDétachement : ${officialDate(d.exDate)}\nPaiement : ${officialDate(d.paymentDate)}\n${d.paymentDate.isBefore(today) ? 'Date de paiement passée' : 'Paiement annoncé · vérifier l’avis'}',
                          ),
                          TextButton.icon(
                            onPressed: () => Navigator.push(
                              c,
                              MaterialPageRoute<void>(
                                builder: (_) => ReportReader(
                                  OfficialDocument(
                                    'Dividende · ${d.issuer} · exercice ${d.year}',
                                    d.noticeUrl,
                                  ),
                                  widget.store,
                                ),
                              ),
                            ),
                            icon: const Icon(Icons.description_outlined),
                            label: const Text('Lire l’avis officiel'),
                          ),
                        ],
                      ),
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
      ],
    ),
  );
}

class OfficialHolidaysPage extends StatefulWidget {
  final AppStore store;
  const OfficialHolidaysPage(this.store, {super.key});
  @override
  State<OfficialHolidaysPage> createState() => _OfficialHolidaysPageState();
}

class _OfficialHolidaysPageState extends State<OfficialHolidaysPage> {
  late Future<String> future = widget.store.repository.page(holidaysUrl);
  void reload() {
    widget.store.repository.invalidatePublicCaches();
    setState(() => future = widget.store.repository.page(holidaysUrl));
  }

  @override
  Widget build(BuildContext c) => Scaffold(
    appBar: AppBar(
      title: const Text('Jours fériés BRVM'),
      actions: [
        IconButton(
          tooltip: 'Actualiser',
          onPressed: reload,
          icon: const Icon(Icons.refresh),
        ),
      ],
    ),
    body: PageBody(
      children: [
        const Text(
          'Calendrier publié par la BRVM, sans extrapolation à d’autres années. Les dates marquées d’un astérisque restent susceptibles de modification.',
        ),
        const SourceButton('Calendrier original', holidaysUrl),
        const SourceButton(
          'Horaires officiels de cotation',
          '$officialRoot/fr/horaires-de-cotation',
        ),
        FutureBuilder<String>(
          future: future,
          builder: (c, s) {
            if (s.connectionState != ConnectionState.done) {
              return const Center(child: CircularProgressIndicator());
            }
            if (s.hasError) return FeedFailure(onRetry: reload);
            final rows = parseOfficialHolidays(s.data!);
            return Column(
              children: [
                if (rows.isEmpty)
                  const Text(
                    'Aucune date lisible. Consulte le calendrier original.',
                  ),
                for (final row in rows)
                  Card(
                    child: ListTile(
                      title: Text(row.$2),
                      subtitle: Text(officialDate(row.$1)),
                    ),
                  ),
              ],
            );
          },
        ),
      ],
    ),
  );
}

class ActivityReportsPage extends StatefulWidget {
  final AppStore store;
  const ActivityReportsPage(this.store, {super.key});
  @override
  State<ActivityReportsPage> createState() => _ActivityReportsPageState();
}

class _ActivityReportsPageState extends State<ActivityReportsPage> {
  Stock? selected;
  Future<List<OfficialDocument>>? future;
  Future<void> choose() async {
    final value = await showModalBottomSheet<Stock>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (c) => FractionallySizedBox(
        heightFactor: .9,
        child: StockPicker(widget.store.market.stocks),
      ),
    );
    if (value != null && mounted) {
      setState(() {
        selected = value;
        future = widget.store.repository.documents(value.symbol);
      });
    }
  }

  @override
  Widget build(BuildContext c) => Scaffold(
    appBar: AppBar(title: const Text('Rapports d’activités')),
    body: PageBody(
      children: [
        const Text(
          'Rapports trimestriels, semestriels, annuels et états financiers publiés par les émetteurs et référencés par la BRVM.',
        ),
        const SourceButton('Tous les émetteurs BRVM', reportsUrl),
        Card(
          child: ListTile(
            leading: const Icon(Icons.search),
            title: Text(selected?.symbol ?? 'Choisir une société'),
            subtitle: Text(
              selected?.name ?? 'Symbole et dénomination officielle',
            ),
            trailing: const Icon(Icons.chevron_right),
            onTap: widget.store.market.empty ? null : choose,
          ),
        ),
        if (widget.store.market.empty)
          TextButton(
            onPressed: widget.store.refresh,
            child: const Text('Charger la liste des actions'),
          ),
        if (future != null)
          FutureBuilder<List<OfficialDocument>>(
            future: future,
            builder: (c, s) {
              if (s.connectionState != ConnectionState.done) {
                return const Center(child: CircularProgressIndicator());
              }
              if (s.hasError) {
                return FeedFailure(
                  onRetry: () => setState(
                    () => future = widget.store.repository.documents(
                      selected!.symbol,
                    ),
                  ),
                );
              }
              return Column(
                children: [
                  TextButton.icon(
                    onPressed: () => setState(
                      () => future = widget.store.repository.documents(
                        selected!.symbol,
                      ),
                    ),
                    icon: const Icon(Icons.refresh),
                    label: const Text('Actualiser les rapports'),
                  ),
                  DocumentList(s.data!, widget.store),
                ],
              );
            },
          ),
      ],
    ),
  );
}
