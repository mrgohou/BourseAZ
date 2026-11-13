import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/store.dart';
import '../data/market.dart';
import '../data/bridge_resources.dart';
import 'widgets.dart';

Future<void> openOfficial(BuildContext context, String url) async {
  if (!officialUrl(url) && !verifiedBrokerPublicLink(url)) return;
  try {
    if (await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication)) {
      return;
    }
  } catch (_) {
    /* Present a recoverable failure. */
  }
  if (context.mounted) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text(
          'Ouverture impossible. Vérifie ta connexion ou ton navigateur.',
        ),
      ),
    );
  }
}

class SourceButton extends StatelessWidget {
  final String title, url;
  const SourceButton(this.title, this.url, {super.key});
  @override
  Widget build(BuildContext context) => TextButton.icon(
    onPressed: () => openOfficial(context, url),
    icon: const Icon(Icons.open_in_new, size: 18),
    label: Text(title),
  );
}

class DocumentList extends StatelessWidget {
  final List<OfficialDocument> documents;
  final AppStore store;
  const DocumentList(this.documents, this.store, {super.key});
  @override
  Widget build(BuildContext context) => Column(
    children: [
      for (final d in documents)
        Card(
          margin: const EdgeInsets.only(bottom: 10),
          child: ListTile(
            contentPadding: const EdgeInsets.all(16),
            leading: const Icon(Icons.description_outlined),
            title: Text(d.title),
            subtitle: const Text('Publication BRVM · source officielle'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => d.url.toLowerCase().contains('.pdf')
                ? Navigator.push(
                    context,
                    MaterialPageRoute<void>(
                      builder: (_) => ReportReader(d, store),
                    ),
                  )
                : openOfficial(context, d.url),
          ),
        ),
    ],
  );
}

class ReportReader extends StatefulWidget {
  final OfficialDocument document;
  final AppStore store;
  const ReportReader(this.document, this.store, {super.key});
  @override
  State<ReportReader> createState() => _ReportReaderState();
}

class _ReportReaderState extends State<ReportReader> {
  late final Future<Map<String, dynamic>> future = widget.store.repository
      .readPdf(widget.document.url);
  String search = '';
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Publication officielle')),
    body: PageBody(
      children: [
        Text(
          widget.document.title,
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        SourceButton('Ouvrir le PDF original', widget.document.url),
        const Text(
          'Texte extrait du document. Vérifie les tableaux, unités et notes dans le PDF original avant toute comparaison.',
        ),
        const SizedBox(height: 16),
        TextField(
          decoration: const InputDecoration(
            labelText: 'Rechercher dans le document',
            helperText: 'Commission, frais, dividende, croissance…',
            helperMaxLines: 2,
            prefixIcon: Icon(Icons.search),
          ),
          onChanged: (v) => setState(() => search = v.toLowerCase()),
        ),
        const SizedBox(height: 20),
        FutureBuilder<Map<String, dynamic>>(
          future: future,
          builder: (context, s) {
            if (s.connectionState != ConnectionState.done) {
              return const Padding(
                padding: EdgeInsets.all(32),
                child: Center(child: CircularProgressIndicator()),
              );
            }
            if (s.hasError) {
              return const Text(
                'La lecture intégrée est indisponible pour ce document. Le PDF original reste accessible avec le bouton ci-dessus.',
              );
            }
            final text = s.data!['text'] as String? ?? '';
            if (text.trim().isEmpty) {
              return const Text(
                'Aucun texte extractible. Consulte le PDF original, qui peut contenir des pages numérisées.',
              );
            }
            final paragraphs = text.split('\n');
            final matches = <String>[];
            if (search.isNotEmpty) {
              for (var i = 0; i < paragraphs.length; i++) {
                if (paragraphs[i].toLowerCase().contains(search)) {
                  matches.add(
                    paragraphs
                        .sublist(
                          i > 1 ? i - 2 : 0,
                          (i + 5).clamp(0, paragraphs.length),
                        )
                        .join('\n'),
                  );
                }
              }
            }
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  search.isEmpty
                      ? 'Texte du document · extraction limitée aux 100 premières pages'
                      : '${matches.length} passages trouvés',
                ),
                const SizedBox(height: 16),
                SelectableText(
                  search.isEmpty ? text : matches.join('\n\n────────\n\n'),
                ),
              ],
            );
          },
        ),
      ],
    ),
  );
}

class PublicationsPage extends StatefulWidget {
  final AppStore store;
  const PublicationsPage(this.store, {super.key});
  @override
  State<PublicationsPage> createState() => _PublicationsPageState();
}

class _PublicationsPageState extends State<PublicationsPage> {
  late Future<List<OfficialDocument>> future = widget.store.repository
      .announcements();
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Fil des publications')),
    body: PageBody(
      children: [
        Text('À la source.', style: Theme.of(context).textTheme.headlineLarge),
        const SizedBox(height: 10),
        const Text(
          'Avis, communiqués et documents disponibles sur le site officiel. La date figurant dans chaque publication fait référence.',
        ),
        const SourceButton('Toutes les publications BRVM', '$officialRoot/fr'),
        FutureBuilder<List<OfficialDocument>>(
          future: future,
          builder: (c, s) {
            if (s.connectionState != ConnectionState.done) {
              return const Center(child: CircularProgressIndicator());
            }
            if (s.hasError || s.data!.isEmpty) {
              return OutlinedButton.icon(
                onPressed: () => setState(
                  () => future = widget.store.repository.announcements(),
                ),
                icon: const Icon(Icons.refresh),
                label: const Text('Publications indisponibles · réessayer'),
              );
            }
            return DocumentList(s.data!, widget.store);
          },
        ),
      ],
    ),
  );
}

class FinancialHighlights extends StatefulWidget {
  final AppStore store;
  final Future<List<OfficialDocument>> documents;
  const FinancialHighlights(this.store, this.documents, {super.key});
  @override
  State<FinancialHighlights> createState() => _FinancialHighlightsState();
}

class _FinancialHighlightsState extends State<FinancialHighlights> {
  late final Future<(OfficialDocument, List<String>)> future = _load();
  Future<(OfficialDocument, List<String>)> _load() async {
    final docs = await widget.documents;
    final report = docs.firstWhere(
      (d) =>
          d.url.toLowerCase().contains('.pdf') &&
          RegExp(r'rapport|resultat|financier').hasMatch(d.url.toLowerCase()),
    );
    final data = await widget.store.repository.readPdf(report.url);
    final lines = (data['text'] as String? ?? '').split('\n');
    final excerpts = <String>[];
    final keywords = RegExp(
      r'chiffre d.affaires|produit net bancaire|r[ée]sultat net|croissance|ebitda',
      caseSensitive: false,
    );
    for (var i = 0; i < lines.length && excerpts.length < 5; i++) {
      if (keywords.hasMatch(lines[i])) {
        final quote = lines
            .sublist(i > 0 ? i - 1 : 0, (i + 5).clamp(0, lines.length))
            .join('\n')
            .trim();
        if (quote.length > 20 && !excerpts.contains(quote)) {
          excerpts.add(quote.length > 900 ? quote.substring(0, 900) : quote);
        }
      }
    }
    return (report, excerpts);
  }

  @override
  Widget build(
    BuildContext context,
  ) => FutureBuilder<(OfficialDocument, List<String>)>(
    future: future,
    builder: (context, s) {
      if (s.connectionState != ConnectionState.done) {
        return const Padding(
          padding: EdgeInsets.symmetric(vertical: 24),
          child: Row(
            children: [
              SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
              SizedBox(width: 12),
              Expanded(
                child: Text('Lecture de la dernière publication financière…'),
              ),
            ],
          ),
        );
      }
      if (s.hasError || s.data!.$2.isEmpty) {
        return const Padding(
          padding: EdgeInsets.symmetric(vertical: 16),
          child: Text(
            'Les chiffres de croissance doivent être vérifiés dans les rapports ci-dessous. Aucun taux estimé ne remplace une publication absente ou non lisible.',
          ),
        );
      }
      final data = s.data!;
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 20),
          Text(
            'Dans la dernière publication',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Text(data.$1.title),
          const SizedBox(height: 12),
          const Text(
            'Extraits du texte officiel. Consulte le tableau original pour les unités, périodes, périmètres et notes. Ces passages ne sont pas une analyse ni une recommandation.',
            style: TextStyle(fontSize: 12),
          ),
          for (final quote in data.$2)
            Card(
              margin: const EdgeInsets.symmetric(vertical: 8),
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: SelectableText(quote),
              ),
            ),
          SourceButton('Vérifier le rapport original', data.$1.url),
          const SectionTitle('Tous les documents'),
        ],
      );
    },
  );
}
