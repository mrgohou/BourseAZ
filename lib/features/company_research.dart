import 'package:flutter/material.dart';
import '../core/store.dart';
import '../data/market.dart';
import '../data/company_facts.dart';
import '../data/official_feeds.dart';
import 'company.dart';
import 'official.dart';
import 'widgets.dart';

class CompanyResearchPanel extends StatelessWidget {
  final Future<CompanyFacts> facts;
  final Stock stock;
  final AppStore store;
  final bool dividends;
  const CompanyResearchPanel({
    super.key,
    required this.facts,
    required this.stock,
    required this.store,
    this.dividends = false,
  });
  @override
  Widget build(BuildContext context) => FutureBuilder<CompanyFacts>(
    future: facts,
    builder: (context, snapshot) {
      if (snapshot.connectionState != ConnectionState.done) {
        return const Padding(
          padding: EdgeInsets.all(16),
          child: Column(
            children: [
              LinearProgressIndicator(),
              SizedBox(height: 12),
              Text('Lecture des publications officielles BRVM…'),
            ],
          ),
        );
      }
      final data = snapshot.data;
      if (data == null) {
        return const Text(
          'Publications indisponibles. Réessaie en rouvrant cette fiche.',
        );
      }
      final b = data.bulletin, a = data.annual;
      final row = Map<String, dynamic>.from(
        b?.rows[stock.symbol] as Map? ?? {},
      );
      String metric(String key, String suffix) {
        final n = bulletinNumber(row[key]);
        return n == null ? 'Non publié' : '${n.toStringAsFixed(2)} $suffix';
      }

      String date(DateTime d) =>
          '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            dividends ? 'Dividendes officiels' : 'Valorisation & rentabilité',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 16),
          if (dividends) ...[
            Metrics([
              ('Dernier net / action au BOC', metric('dividend', 'FCFA')),
              (
                'Date de paiement au BOC',
                row['dividendDate'] as String? ?? 'Non publiée',
              ),
              ('Rendement net au BOC', metric('yield', '%')),
            ]),
            const SizedBox(height: 12),
            const Text(
              'Le montant du bulletin peut être ajusté après un fractionnement. Les avis ci-dessous conservent le montant et l’exercice annoncés à la date du paiement. Un dividende passé ne garantit pas un paiement futur.',
            ),
          ] else ...[
            Metrics([
              ('PER publié · BOC', metric('per', '×')),
              ('Variation annuelle · BOC', metric('ytd', '%')),
              (
                'BPA annuel ajusté',
                a == null
                    ? 'Non vérifié'
                    : '${a.epsAt(store.market.asOf).toStringAsFixed(2)} FCFA',
              ),
              (
                'PBR calculé',
                a == null
                    ? 'Non vérifié'
                    : '${a.pbr(stock.price, store.market.asOf).toStringAsFixed(2)} ×',
              ),
              (
                'ROE annuel calculé',
                a == null ? 'Non vérifié' : '${a.roe.toStringAsFixed(2)} %',
              ),
            ]),
            const SizedBox(height: 12),
            const Text(
              'PER = cours / bénéfice par action positif. PBR = cours / actif net par action. ROE = résultat net part du groupe / capitaux propres moyens part du groupe × 100.',
            ),
            if (a != null) ...[
              const SizedBox(height: 16),
              Text(
                'Comptes annuels ${a.year} · part des propriétaires de la société mère. Transcription vérifiée le ${a.data['reviewedAt']}, pages ${(a.data['sourcePages'] as List).join(' et ')}. Cette observation annuelle ne constitue pas un flux comptable en temps réel.',
              ),
              const SizedBox(height: 8),
              Text(
                'BPA publié : ${money(a.eps)} FCFA ; BPA après fractionnement : ${a.epsAt(store.market.asOf).toStringAsFixed(2)} FCFA. Actif net par action ajusté : ${a.bookValueAt(store.market.asOf).toStringAsFixed(2)} FCFA.',
              ),
              Text(
                'ROE : ${money(a.profit)} / ((${money(a.equity)} + ${money(a.priorEquity)}) / 2) × 100. Résultat et capitaux propres en millions de FCFA, périmètre consolidé part du groupe.',
              ),
              Text(
                'PBR : ${money(stock.price)} / ${a.bookValueAt(store.market.asOf).toStringAsFixed(2)}. Cours du ${date(store.market.asOf)}, capitaux propres au 31/12/${a.year}. Nombre de titres ajusté selon l’avis officiel ; titres auto-détenus non retraités.',
              ),
              SourceButton('Comptes annuels ${a.year} · BRVM', a.source),
              SourceButton('Avis de fractionnement · BRVM', a.actionSource),
              const Text(
                'Le PER du bulletin est repris tel que publié. Son périmètre de bénéfice peut différer du BPA consolidé part du groupe : ne pas les recomposer entre eux.',
              ),
            ] else ...[
              const SizedBox(height: 12),
              const Text(
                'BPA, PBR et ROE : aucune extraction comptable vérifiée pour cette société dans cette version. Consulte les rapports de l’onglet Finances. Aucun chiffre de remplacement n’est utilisé.',
              ),
            ],
          ],
          const SizedBox(height: 16),
          if (b != null) ...[
            Text(
              'Bulletin du ${date(b.date)} · cours de référence et ratios de cette séance. Les cours affichés en tête de fiche peuvent être plus récents.',
            ),
            SourceButton('Ouvrir le bulletin source · BRVM', b.url),
          ] else
            const Text(
              'Bulletin momentanément indisponible : aucun indicateur de marché n’est estimé.',
            ),
          if (dividends) ...[
            const SectionTitle('Avis de paiement'),
            if (data.notices.isEmpty)
              const Text(
                'Aucun avis correspondant trouvé dans les six pages récentes consultées. Cela ne signifie pas que cette société ne verse pas de dividendes.',
              ),
            for (final n in data.notices)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${n.issuer} · exercice ${n.year}',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      Text(
                        '${n.netPerShare.toStringAsFixed(2)} FCFA net par action',
                      ),
                      Text('Paiement : ${date(n.paymentDate)}'),
                      if (n.exDate != null)
                        Text('Détachement : ${date(n.exDate!)}'),
                      SourceButton('Avis officiel de paiement', n.noticeUrl),
                    ],
                  ),
                ),
              ),
            if (!data.dividendHistoryComplete)
              const Text(
                'Historique partiel : six pages récentes au maximum. Les avis annoncent un paiement ; ils ne prouvent pas le crédit sur un compte personnel.',
              ),
            const SourceButton(
              'Tous les avis de dividendes · BRVM',
              dividendsUrl,
            ),
          ],
        ],
      );
    },
  );
}
