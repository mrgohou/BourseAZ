import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../core/simulation.dart';
import '../core/store.dart';
import '../core/theme.dart';
import '../core/accents.dart';
import 'widgets.dart';
import 'design.dart';
import 'workspace.dart';

class SimulatorPage extends StatefulWidget {
  final AppStore store;
  const SimulatorPage(this.store, {super.key});
  @override
  State<SimulatorPage> createState() => _SimulatorPageState();
}

class _SimulatorPageState extends State<SimulatorPage> {
  final form = GlobalKey<FormState>();
  final initial = TextEditingController(text: '');
  final monthly = TextEditingController(text: '');
  double years = 5, rate = 0, fees = 0;
  Projection? result;
  bool saving = false;
  @override
  void dispose() {
    initial.dispose();
    monthly.dispose();
    super.dispose();
  }

  void calculate() {
    if (!form.currentState!.validate()) return;
    FocusScope.of(context).unfocus();
    setState(
      () => result = Projection(
        initial: int.parse(initial.text),
        monthly: int.parse(monthly.text),
        years: years.round(),
        annualRate: rate,
        feePercent: fees,
      ),
    );
  }

  @override
  Widget build(BuildContext context) => PageBody(
    children: [
      const PageHeading(
        'Dessiner ton projet.',
        'Pose tes hypothèses. Les rendements simulés ne sont pas des prévisions du marché.',
      ),
      Wrap(
        spacing: 8,
        children: [
          TextButton.icon(
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute<void>(builder: (_) => const FeePage()),
            ),
            icon: const Icon(Icons.calculate_outlined),
            style: Accents.button(context, AccentTone.brown),
            label: const Text('Estimer les frais'),
          ),
          TextButton.icon(
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute<void>(builder: (_) => const RiskProfilePage()),
            ),
            icon: const Icon(Icons.person_outline),
            style: Accents.button(context, AccentTone.blue),
            label: const Text('Mon profil'),
          ),
        ],
      ),
      const SizedBox(height: 24),
      Form(
        key: form,
        child: Column(
          children: [
            TextFormField(
              key: const Key('initial-amount'),
              controller: initial,
              decoration: const InputDecoration(
                labelText: 'Montant de départ',
                suffixText: 'FCFA',
              ),
              keyboardType: TextInputType.number,
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
                LengthLimitingTextInputFormatter(10),
              ],
              validator: (v) => _validate(v, 1000000000),
              onChanged: (_) => setState(() => result = null),
            ),
            const SizedBox(height: 16),
            TextFormField(
              key: const Key('monthly-amount'),
              controller: monthly,
              decoration: const InputDecoration(
                labelText: 'Versement mensuel',
                suffixText: 'FCFA',
              ),
              keyboardType: TextInputType.number,
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
                LengthLimitingTextInputFormatter(8),
              ],
              validator: (v) => _validate(v, 10000000),
              onChanged: (_) => setState(() => result = null),
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    _slider(
                      'Ton horizon',
                      '${years.round()} ans',
                      years,
                      1,
                      30,
                      29,
                      (v) => setState(() {
                        years = v;
                        result = null;
                      }),
                    ),
                    _slider(
                      'Rendement annuel hypothétique',
                      '${rate.toStringAsFixed(0)} %',
                      rate,
                      -20,
                      20,
                      40,
                      (v) => setState(() {
                        rate = v;
                        result = null;
                      }),
                    ),
                    _slider(
                      'Frais sur chaque versement',
                      '${fees.toStringAsFixed(1)} %',
                      fees,
                      0,
                      5,
                      10,
                      (v) => setState(() {
                        fees = v;
                        result = null;
                      }),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                key: const Key('calculate'),
                onPressed: calculate,
                icon: const Icon(Icons.auto_graph),
                label: const Text('Explorer mon scénario'),
              ),
            ),
          ],
        ),
      ),
      const SizedBox(height: 16),
      const Text(
        'Hypothèse constante, versements en fin de mois, intérêts composés mensuellement. Montants nominaux : inflation et fiscalité non incluses. Les frais réels dépendent de ta SGI.',
        style: TextStyle(fontSize: 12),
      ),
      if (result case final p?) ...[
        const SizedBox(height: 24),
        LimePanel(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'VALEUR HYPOTHÉTIQUE',
                style: TextStyle(
                  fontSize: 11,
                  letterSpacing: 1,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                money(p.finalValue),
                style: const TextStyle(
                  fontSize: 38,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -1,
                ),
              ),
              Text('FCFA après ${p.years} ans'),
              const SizedBox(height: 16),
              ProjectionChart(
                p.balances,
                contributed: [
                  for (var year = 0; year <= p.years; year++)
                    (p.initial + p.monthly * year * 12).toDouble(),
                ],
              ),
              const SizedBox(height: 12),
              Wrap(
                alignment: WrapAlignment.spaceBetween,
                spacing: 16,
                children: [
                  const Text('Aujourd’hui'),
                  Text('Dans ${p.years} ans'),
                ],
              ),
              const Divider(color: Brand.muted),
              _line('Total versé', '${money(p.contributed)} FCFA'),
              _line('Frais de versement', '${money(p.fees)} FCFA'),
              _line(
                p.gain < 0 ? 'Perte hypothétique' : 'Gain hypothétique',
                '${money(p.gain)} FCFA',
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        const Text(
          'Ce scénario n’est ni une promesse de rendement ni un conseil personnalisé. Le capital peut diminuer.',
        ),
        const SizedBox(height: 16),
        OutlinedButton.icon(
          onPressed: saving
              ? null
              : () async {
                  setState(() => saving = true);
                  final ok = await widget.store.save(p);
                  if (!context.mounted) return;
                  setState(() => saving = false);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        ok
                            ? 'Scénario enregistré sur cet appareil.'
                            : 'Sauvegarde impossible.',
                      ),
                    ),
                  );
                },
          icon: const Icon(Icons.bookmark_add_outlined),
          label: Text(saving ? 'Enregistrement…' : 'Garder ce scénario'),
        ),
      ],
      if (widget.store.saved.isNotEmpty) ...[
        const SectionTitle('Tes scénarios'),
        for (final (index, saved) in widget.store.saved.indexed)
          Card(
            child: ListTile(
              title: Text(
                '${money(saved.monthly)} FCFA/mois · ${saved.years} ans',
              ),
              subtitle: Text(
                '${money(saved.finalValue)} FCFA hypothétiques · ${saved.annualRate.toStringAsFixed(0)} %/an',
              ),
              trailing: IconButton(
                tooltip: 'Supprimer ce scénario',
                icon: const Icon(Icons.delete_outline),
                onPressed: () async {
                  final confirmed = await showDialog<bool>(
                    context: context,
                    builder: (context) => AlertDialog(
                      title: const Text('Supprimer ce scénario ?'),
                      content: const Text('Il sera retiré de cet appareil.'),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(context, false),
                          child: const Text('Annuler'),
                        ),
                        TextButton(
                          onPressed: () => Navigator.pop(context, true),
                          child: const Text('Supprimer'),
                        ),
                      ],
                    ),
                  );
                  if (confirmed == true) await widget.store.removeSaved(index);
                },
              ),
              onTap: () {
                setState(() {
                  initial.text = saved.initial.toString();
                  monthly.text = saved.monthly.toString();
                  years = saved.years.toDouble();
                  rate = saved.annualRate;
                  fees = saved.feePercent;
                  result = saved;
                });
              },
            ),
          ),
      ],
    ],
  );
  String? _validate(String? value, int max) {
    final parsed = int.tryParse(value ?? '');
    return parsed == null || parsed < 0 || parsed > max
        ? 'Saisis un montant entre 0 et ${money(max)} FCFA.'
        : null;
  }

  Widget _slider(
    String label,
    String value,
    double current,
    double min,
    double max,
    int divisions,
    ValueChanged<double> change,
  ) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Wrap(
        spacing: 12,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: [
          Text(label),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w800)),
        ],
      ),
      Slider(
        value: current,
        min: min,
        max: max,
        divisions: divisions,
        label: value,
        semanticFormatterCallback: (_) => '$label : $value',
        onChanged: change,
      ),
    ],
  );
  Widget _line(String label, String value) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 6),
    child: Wrap(
      spacing: 16,
      alignment: WrapAlignment.spaceBetween,
      children: [
        Text(label),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w700)),
      ],
    ),
  );
}
