import 'package:flutter/material.dart';
import '../core/store.dart';
import '../data/market.dart';
import 'widgets.dart';
import 'design.dart';
import '../core/accents.dart';
import 'official.dart';
import '../data/company_facts.dart';
import 'company_research.dart';

class CompanyPage extends StatefulWidget {
  final String symbol;
  final AppStore store;
  const CompanyPage(this.symbol, this.store, {super.key});
  @override
  State<CompanyPage> createState() => _CompanyPageState();
}

class _CompanyPageState extends State<CompanyPage> {
  int tab = 0;
  late Future<List<OfficialDocument>> docs = widget.store.repository.documents(
    widget.symbol,
  );
  Future<CompanyFacts>? facts;
  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: widget.store,
    builder: (context, _) {
      final store = widget.store;
      final found = store.market.stocks.where((s) => s.symbol == widget.symbol);
      if (found.isEmpty) {
        return Scaffold(
          appBar: AppBar(),
          body: const Center(child: Text('Cotation indisponible.')),
        );
      }
      final s = found.first;
      facts ??= store.repository.companyFacts(s);
      return Scaffold(
        appBar: AppBar(
          title: Text(s.symbol),
          actions: [
            IconButton(
              tooltip: 'Suivre cette action',
              onPressed: () => store.toggleFavorite(s.symbol),
              icon: Icon(
                store.favorites.contains(s.symbol)
                    ? Icons.bookmark
                    : Icons.bookmark_border,
              ),
            ),
          ],
        ),
        body: PageBody(
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(22),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      s.sector,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      s.name,
                      style: Theme.of(context).textTheme.headlineMedium,
                    ),
                    const SizedBox(height: 24),
                    Text(
                      '${money(s.price)} FCFA',
                      style: Theme.of(context).textTheme.headlineLarge
                          ?.copyWith(
                            fontFeatures: const [FontFeature.tabularFigures()],
                          ),
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 12,
                      runSpacing: 8,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        ChangeBadge(s.change),
                        const Text('Variation de la séance'),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            MarketNotice(store),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (var i = 0; i < 4; i++)
                  ChoiceChip(
                    label: Text(
                      [
                        'Vue d’ensemble',
                        'Performance',
                        'Dividendes',
                        'Finances',
                      ][i],
                    ),
                    selectedColor: Accents.surface(
                      context,
                      AccentTone.values[i],
                    ),
                    labelStyle: TextStyle(
                      color: tab == i
                          ? Accents.ink(context, AccentTone.values[i])
                          : Theme.of(context).colorScheme.onSurface,
                    ),
                    selected: tab == i,
                    onSelected: (_) => setState(() => tab = i),
                  ),
              ],
            ),
            const SizedBox(height: 24),
            if (tab == 0) ...[
              Metrics([
                ('Clôture', '${money(s.price)} FCFA'),
                (
                  'Cours précédent',
                  s.previous > 0 ? '${money(s.previous)} FCFA' : 'Non publié',
                ),
                (
                  'Ouverture',
                  s.opening > 0
                      ? '${money(s.opening)} FCFA'
                      : 'Pas d’échange publié',
                ),
                ('Volume', '${money(s.volume)} titres'),
                ('Variation séance', '${s.change.toStringAsFixed(2)} %'),
                (
                  'PER publié',
                  s.per == null
                      ? 'Non disponible'
                      : '${s.per!.toStringAsFixed(2)} ×',
                ),
              ]),
              const SectionTitle('Lire cette séance'),
              Text(
                s.volume == 0
                    ? 'Aucun échange signalé sur la séance. Le cours peut reprendre une référence antérieure.'
                    : '${money(s.volume)} titres échangés. La variation publiée par la BRVM peut utiliser une référence ajustée lors d’une opération sur titres.',
              ),
              const SizedBox(height: 12),
              const Text(
                'La cotation est une publication de marché, pas un prix d’exécution garanti.',
              ),
            ],
            if (tab == 1) ...[
              CompanyResearchPanel(facts: facts!, stock: s, store: store),
              const SectionTitle('Comparer les cours publiés'),
              const Text(
                'Échelle commune depuis zéro · FCFA',
                style: TextStyle(fontSize: 12),
              ),
              const SizedBox(height: 12),
              for (final entry in [
                ('Cours précédent', s.previous),
                ('Ouverture', s.opening),
                ('Clôture', s.price),
              ])
                if (entry.$2 > 0)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('${entry.$1} · ${money(entry.$2)} FCFA'),
                        const SizedBox(height: 6),
                        LinearProgressIndicator(
                          color: entry.$1 == 'Clôture'
                              ? Theme.of(context).colorScheme.primary
                              : Accents.ink(
                                  context,
                                  entry.$1 == 'Ouverture'
                                      ? AccentTone.brown
                                      : AccentTone.blue,
                                ),
                          backgroundColor: Accents.surface(
                            context,
                            AccentTone.blue,
                          ),
                          value:
                              (entry.$2 /
                                      [
                                        s.price,
                                        s.previous,
                                        s.opening,
                                      ].reduce((a, b) => a > b ? a : b))
                                  .clamp(0, 1),
                          minHeight: 14,
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ],
                    ),
                  ),
              const Text(
                'Comparaison des références d’une seule séance. Aucun historique artificiel. La performance annuelle est celle publiée au bulletin ; elle ne mesure pas la croissance du bénéfice.',
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute<void>(
                    builder: (_) => ArchivePage(store, s),
                  ),
                ),
                icon: const Icon(Icons.history),
                label: const Text('Consulter une séance antérieure'),
              ),
            ],
            if (tab == 2)
              CompanyResearchPanel(
                facts: facts!,
                stock: s,
                store: store,
                dividends: true,
              ),
            if (tab == 3) ...[
              Text(
                'Résultats & croissance',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 10),
              const Text(
                'Rapports annuels, résultats semestriels et communications de la société, mis à disposition par la BRVM. Ouvre un rapport pour rechercher le chiffre d’affaires, le résultat ou la croissance et vérifier la période ainsi que les unités.',
              ),
              const SizedBox(height: 18),
              FinancialHighlights(store, docs),
              FutureBuilder<List<OfficialDocument>>(
                future: docs,
                builder: (c, snapshot) {
                  if (snapshot.connectionState != ConnectionState.done) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  if (snapshot.hasError) {
                    return Column(
                      children: [
                        const Text('Documents momentanément indisponibles.'),
                        TextButton(
                          onPressed: () => setState(
                            () => docs = store.repository.documents(s.symbol),
                          ),
                          child: const Text('Réessayer'),
                        ),
                        const SourceButton(
                          'Annuaire officiel des rapports',
                          reportsUrl,
                        ),
                      ],
                    );
                  }
                  return DocumentList(snapshot.data!, store);
                },
              ),
            ],
            const SectionTitle('Traçabilité'),
            const SourceButton('Cours officiels · BRVM', quotesUrl),
            if (store.market.bulletin != null)
              SourceButton(
                'Bulletin officiel de la séance',
                store.market.bulletin!,
              ),
            if (s.ytd == null && tab != 3)
              const Text(
                'Les indicateurs sourcés et leurs dates figurent dans les onglets Performance et Dividendes.',
              ),
          ],
        ),
      );
    },
  );
}

class Metrics extends StatelessWidget {
  final List<(String, String)> items;
  const Metrics(this.items, {super.key});
  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, c) => Wrap(
      spacing: 12,
      runSpacing: 12,
      children: items.indexed
          .map(
            (entry) => SizedBox(
              width:
                  c.maxWidth < 310 ||
                      MediaQuery.textScalerOf(context).scale(16) > 22
                  ? c.maxWidth
                  : (c.maxWidth - 12) / 2,
              child: Card(
                color: Accents.surface(
                  context,
                  AccentTone.values[entry.$1 % 4],
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        entry.$2.$1,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Accents.ink(
                            context,
                            AccentTone.values[entry.$1 % 4],
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        entry.$2.$2,
                        style: const TextStyle(
                          fontSize: 19,
                          fontWeight: FontWeight.w700,
                          fontFeatures: [FontFeature.tabularFigures()],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          )
          .toList(),
    ),
  );
}

class ArchivePage extends StatefulWidget {
  final AppStore store;
  final Stock stock;
  const ArchivePage(this.store, this.stock, {super.key});
  @override
  State<ArchivePage> createState() => _ArchivePageState();
}

class _ArchivePageState extends State<ArchivePage> {
  DateTime? date;
  bool loading = false;
  String? result;
  Future<void> choose() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: widget.store.market.asOf.subtract(const Duration(days: 1)),
      firstDate: DateTime(2010),
      lastDate: widget.store.market.asOf,
    );
    if (picked == null) return;
    setState(() {
      date = picked;
      loading = true;
      result = null;
    });
    try {
      final stamp =
          '${picked.year}${picked.month.toString().padLeft(2, '0')}${picked.day.toString().padLeft(2, '0')}';
      final data = await widget.store.repository.readPdf(
        'https://bfin.brvm.org/boc/BOC_JOUR/BOC_$stamp.pdf',
      );
      final row = (data['rows'] as Map?)?[widget.stock.symbol] as Map?;
      if (row == null || number(row['price']) == null) {
        throw const FormatException();
      }
      if (mounted) {
        setState(
          () => result =
              '${widget.stock.symbol} · cours publié : ${row['price']} FCFA\nVariation séance : ${row['change']} %\nVariation annuelle publiée : ${row['ytd']} %',
        );
      }
    } catch (_) {
      if (mounted) {
        setState(
          () => result =
              'Bulletin absent ou lecture indisponible pour cette date. Les jours sans séance n’ont pas de bulletin.',
        );
      }
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Archives officielles')),
    body: PageBody(
      children: [
        Text(
          widget.stock.name,
          style: Theme.of(context).textTheme.headlineMedium,
        ),
        const SizedBox(height: 16),
        const Text(
          'Choisis une séance. Le cours est extrait du bulletin officiel correspondant. Les cours ne sont pas retraités des fractionnements, droits et dividendes : une comparaison brute peut être trompeuse.',
        ),
        const SizedBox(height: 24),
        FilledButton.icon(
          onPressed: loading ? null : choose,
          icon: const Icon(Icons.calendar_month),
          label: Text(
            date == null
                ? 'Choisir une date'
                : '${date!.day}/${date!.month}/${date!.year}',
          ),
        ),
        const SizedBox(height: 24),
        if (loading) const Center(child: CircularProgressIndicator()),
        if (result != null) SelectableText(result!),
        const SizedBox(height: 20),
        const SourceButton(
          'Archives des bulletins BRVM',
          '$officialRoot/fr/bulletins-officiels-de-la-cote',
        ),
      ],
    ),
  );
}
