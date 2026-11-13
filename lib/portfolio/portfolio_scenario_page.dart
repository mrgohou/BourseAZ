import 'package:flutter/material.dart';
import '../account/account_page.dart';
import '../core/store.dart';
import '../features/widgets.dart';
import '../features/company.dart' show Metrics;
import '../features/official.dart';
import '../data/official_feeds.dart';
import 'portfolio_controller.dart';
import 'portfolio_math.dart';
import 'purchase.dart';

class PortfolioScenarioPage extends StatefulWidget {
  final AppStore store;
  final PortfolioController portfolio;
  const PortfolioScenarioPage(this.store, this.portfolio, {super.key});
  @override
  State<PortfolioScenarioPage> createState() => _PortfolioScenarioPageState();
}

class _PortfolioScenarioPageState extends State<PortfolioScenarioPage> {
  final form = GlobalKey<FormState>();
  final target = TextEditingController(),
      dividend = TextEditingController(),
      fees = TextEditingController();
  late final String? owner = widget.portfolio.account.identity?.uid;
  String? symbol;
  bool showResult = false, revoked = false;
  @override
  void initState() {
    super.initState();
    widget.portfolio.account.addListener(accountChanged);
  }

  void accountChanged() {
    if (!widget.portfolio.account.portfolioAllowed ||
        widget.portfolio.account.identity?.uid != owner) {
      target.clear();
      dividend.clear();
      fees.clear();
      if (mounted) {
        setState(() {
          showResult = false;
          revoked = true;
        });
      }
    }
  }

  @override
  void dispose() {
    widget.portfolio.account.removeListener(accountChanged);
    target.dispose();
    dividend.dispose();
    fees.dispose();
    super.dispose();
  }

  int? nonnegative(String input) {
    final text = input.trim();
    if (RegExp(r'^0(?:[,.]0{1,2})?$').hasMatch(text)) return 0;
    return parseUnitPrice(text);
  }

  @override
  Widget build(BuildContext c) => ListenableBuilder(
    listenable: Listenable.merge([
      widget.portfolio,
      widget.portfolio.account,
      widget.store,
    ]),
    builder: (c, _) {
      final ledger = widget.portfolio;
      if (!ledger.account.portfolioAllowed) return AccountPage(ledger.account);
      if (revoked) {
        return Scaffold(
          appBar: AppBar(title: const Text('Simulation')),
          body: const Center(
            child: Text('Session modifiée. Reviens à ton portefeuille.'),
          ),
        );
      }
      final positions = consolidate(ledger.entries, {}, {});
      final selected = positions.where((p) => p.symbol == symbol).firstOrNull;
      return Scaffold(
        appBar: AppBar(title: const Text('Simuler mes titres')),
        body: PageBody(
          children: [
            Text(
              'Tes titres.\nTes hypothèses.',
              style: Theme.of(c).textTheme.headlineLarge,
            ),
            const SizedBox(height: 12),
            const Text(
              'Une simulation ne modifie pas tes achats et ne passe aucun ordre. Les prix futurs et dividendes saisis sont tes hypothèses, sans garantie de rendement.',
            ),
            if (ledger.broker != null)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Text(
                  'SGI déclarée : ${ledger.broker!.name}. Utilise son barème contractuel pour les frais.',
                ),
              ),
            const SourceButton('Vérifier les barèmes BRVM / DC/BR', tariffsUrl),
            const SourceButton('Vérifier les dividendes publiés', dividendsUrl),
            if (positions.isEmpty)
              const Text(
                'Ajoute d’abord un achat dans ton portefeuille pour simuler tes titres.',
              ),
            if (positions.isNotEmpty)
              Form(
                key: form,
                child: Column(
                  children: [
                    DropdownButtonFormField<String>(
                      initialValue: symbol,
                      isExpanded: true,
                      decoration: const InputDecoration(
                        labelText: 'Titre de mon portefeuille',
                      ),
                      items: [
                        for (final p in positions)
                          DropdownMenuItem(
                            value: p.symbol,
                            child: Text(
                              '${p.symbol} · ${p.name}',
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                      ],
                      validator: (v) => v == null
                          ? 'Choisis un titre de ton portefeuille.'
                          : null,
                      onChanged: (v) => setState(() {
                        symbol = v;
                        showResult = false;
                      }),
                    ),
                    if (selected != null)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        child: Text(
                          '${selected.quantity} actions · Investissement saisi : ${amount(selected.invested)} FCFA · Cours moyen : ${amount(selected.averageRounded)} FCFA',
                        ),
                      ),
                    for (final row in [
                      (target, 'Cours futur par action'),
                      (dividend, 'Dividende net par action'),
                      (fees, 'Frais et taxes au total'),
                    ])
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        child: TextFormField(
                          controller: row.$1,
                          decoration: InputDecoration(
                            labelText: row.$2,
                            suffixText: 'FCFA',
                            helperMaxLines: 3,
                            helperText: row.$1 == fees
                                ? 'Saisis 0 si tu exclus les frais de cette simulation.'
                                : null,
                          ),
                          keyboardType: const TextInputType.numberWithOptions(
                            decimal: true,
                          ),
                          onChanged: (_) => setState(() => showResult = false),
                          validator: (v) {
                            if (row.$1 == dividend &&
                                (v ?? '').trim().isEmpty) {
                              return null;
                            }
                            final valid = row.$1 == target
                                ? parseUnitPrice(v ?? '')
                                : nonnegative(v ?? '');
                            return valid == null
                                ? 'Montant valide requis, au plus 2 décimales.'
                                : null;
                          },
                        ),
                      ),
                    FilledButton(
                      onPressed: () {
                        FocusScope.of(context).unfocus();
                        if (form.currentState!.validate()) {
                          setState(() => showResult = true);
                        }
                      },
                      child: const Text('Calculer ce scénario'),
                    ),
                  ],
                ),
              ),
            if (showResult && selected != null)
              Builder(
                builder: (c) {
                  final price = parseUnitPrice(target.text)!;
                  final div = dividend.text.trim().isEmpty
                      ? 0
                      : nonnegative(dividend.text)!;
                  final fee = nonnegative(fees.text)!;
                  final value =
                          BigInt.from(price) * BigInt.from(selected.quantity),
                      income =
                          BigInt.from(div) * BigInt.from(selected.quantity);
                  final result =
                      value + income - selected.invested - BigInt.from(fee);
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SectionTitle('Résultat selon tes hypothèses'),
                      Metrics([
                        ('Valeur future simulée', '${amount(value)} FCFA'),
                        (
                          'Dividendes simulés',
                          dividend.text.trim().isEmpty
                              ? 'Non inclus'
                              : '${amount(income)} FCFA',
                        ),
                        (
                          'Frais et taxes saisis',
                          '${amount(BigInt.from(fee))} FCFA',
                        ),
                        (
                          'Gain / perte simulé',
                          '${amount(result, signed: true)} FCFA',
                        ),
                        (
                          'Rentabilité simulée',
                          percentage(result, selected.invested),
                        ),
                      ]),
                      const SizedBox(height: 12),
                      const Text(
                        'Gain simulé = valeur future + dividendes nets supposés − investissement saisi − frais et taxes saisis. Les changements de quantité, fractionnements, ventes partielles et dates de détention doivent être vérifiés séparément.',
                      ),
                    ],
                  );
                },
              ),
          ],
        ),
      );
    },
  );
}
