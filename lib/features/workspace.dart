import 'package:flutter/material.dart';
import 'package:html/parser.dart' as html;
import '../core/store.dart';
import '../data/market.dart';
import 'widgets.dart';
import 'design.dart';
import '../core/accents.dart';
import 'motion.dart';
import 'company.dart';
import 'learning.dart';
import 'market_page.dart';
import 'official.dart';
import 'settings.dart';
import 'official_updates.dart';
import '../account/account_controller.dart';
import '../account/account_page.dart';
import '../portfolio/portfolio_controller.dart';
import '../portfolio/portfolio_page.dart';
import '../data/official_feeds.dart';

class WorkspacePage extends StatelessWidget {
  final AppStore store;
  const WorkspacePage(this.store, {super.key});
  @override
  Widget build(BuildContext c) {
    final account = AccountScope.maybeOf(c);
    final portfolio = PortfolioScope.maybeOf(c);
    void go(Widget p) =>
        Navigator.push(c, MaterialPageRoute<void>(builder: (_) => p));
    return PageBody(
      children: [
        const PageHeading(
          'Ton espace personnel.',
          'Ton portefeuille, tes outils et tes repères au même endroit.',
        ),
        AdaptiveTiles(
          children: [
            ActionTile(
              tone: AccentTone.brown,
              symbol: FriendlySymbol.wallet,
              icon: Icons.account_balance_wallet_outlined,
              title: 'Portefeuille',
              subtitle: 'Mes titres et leur performance',
              onTap: () => go(PortfolioPage(store)),
            ),
            ActionTile(
              tone: AccentTone.yellow,
              icon: Icons.calculate_outlined,
              title: 'Mes frais',
              subtitle: 'Préparer mon investissement',
              onTap: () => go(const FeePage()),
            ),
          ],
        ),
        const SectionTitle('Mes repères'),
        Card(
          child: Column(
            children: [
              if (account?.portfolioAllowed == true)
                ListTile(
                  leading: const Icon(Icons.account_balance_wallet_outlined),
                  title: const Text('Portefeuille de suivi'),
                  subtitle: Text(
                    '${portfolio?.entries.length ?? 0} achats enregistrés',
                  ),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => go(PortfolioPage(store)),
                ),
              ListTile(
                leading: const Icon(Icons.notifications_none),
                title: const Text('Mes seuils de cours'),
                subtitle: const Text(
                  'Vérification lorsque l’application est ouverte',
                ),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => go(PersonalPage(store, true)),
              ),
              ListTile(
                leading: const Icon(Icons.event_available),
                title: const Text('Dividendes publiés'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => go(DividendsPage(store)),
              ),
              ListTile(
                leading: const Icon(Icons.newspaper),
                title: const Text('Publications officielles'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => go(PublicationsPage(store)),
              ),
            ],
          ),
        ),
        if (account != null) ...[
          const SectionTitle('Mon compte'),
          Card(
            child: ListTile(
              leading: const Icon(Icons.account_circle_outlined),
              title: Text(
                account.identity?.email ?? 'Se connecter ou créer un compte',
              ),
              subtitle: Text(
                account.identity == null
                    ? 'Google ou adresse e-mail'
                    : account.portfolioAllowed
                    ? 'Compte vérifié'
                    : 'Adresse e-mail à vérifier',
              ),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => go(AccountPage(account, store: store)),
            ),
          ),
        ],
        const SectionTitle('Publications et calendrier'),
        OfficialUpdatesLinks(store),
        const SectionTitle('Préparer son investissement'),
        Card(
          child: Column(
            children: [
              ListTile(
                leading: const Icon(Icons.person_outline),
                title: const Text('Mon profil de risque'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => go(const RiskProfilePage()),
              ),
              ListTile(
                leading: const Icon(Icons.calculate_outlined),
                title: const Text('Estimer mes frais'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => go(const FeePage()),
              ),
              ListTile(
                leading: const Icon(Icons.account_balance_outlined),
                title: const Text('Annuaire officiel des SGI'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => go(SgiPage(store)),
              ),
              ListTile(
                leading: const Icon(Icons.menu_book_outlined),
                title: const Text('Lexique financier'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => go(const GlossaryPage()),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        OutlinedButton.icon(
          onPressed: () => go(SettingsPage(store)),
          icon: const Icon(Icons.tune),
          label: const Text('Préférences & confidentialité'),
        ),
      ],
    );
  }
}

bool validAmount(String? v) {
  final n = number(v);
  return n != null && n.isFinite && n > 0 && n <= 1e10;
}

class PersonalPage extends StatefulWidget {
  final AppStore store;
  final bool alerts;
  const PersonalPage(this.store, this.alerts, {super.key});
  @override
  State<PersonalPage> createState() => _PersonalPageState();
}

class _PersonalPageState extends State<PersonalPage> {
  Future<void> add() async {
    final store = widget.store;
    if (store.market.empty) return;
    final a = TextEditingController(), b = TextEditingController();
    final form = GlobalKey<FormState>();
    String symbol = store.market.stocks.first.symbol;
    bool above = true;
    await showDialog<void>(
      context: context,
      builder: (c) => AlertDialog(
        title: Text(widget.alerts ? 'Nouveau seuil' : 'Ajouter une ligne'),
        content: SingleChildScrollView(
          child: Form(
            key: form,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<String>(
                  initialValue: symbol,
                  decoration: const InputDecoration(labelText: 'Action'),
                  items: store.market.stocks
                      .map(
                        (s) => DropdownMenuItem(
                          value: s.symbol,
                          child: Text(s.symbol),
                        ),
                      )
                      .toList(),
                  onChanged: (v) => symbol = v!,
                ),
                const SizedBox(height: 12),
                if (widget.alerts)
                  DropdownButtonFormField<bool>(
                    initialValue: true,
                    decoration: const InputDecoration(labelText: 'Condition'),
                    items: const [
                      DropdownMenuItem(
                        value: true,
                        child: Text('Supérieur ou égal'),
                      ),
                      DropdownMenuItem(
                        value: false,
                        child: Text('Inférieur ou égal'),
                      ),
                    ],
                    onChanged: (v) => above = v!,
                  ),
                TextFormField(
                  controller: a,
                  decoration: InputDecoration(
                    labelText: widget.alerts
                        ? 'Seuil · FCFA'
                        : 'Quantité de titres',
                  ),
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  validator: (v) => widget.alerts
                      ? (validAmount(v) ? null : 'Montant positif requis')
                      : ((int.tryParse(v ?? '') ?? 0) > 0 &&
                                (int.tryParse(v ?? '') ?? 0) <= 100000000
                            ? null
                            : 'Quantité entière positive requise'),
                ),
                if (!widget.alerts)
                  TextFormField(
                    controller: b,
                    decoration: const InputDecoration(
                      labelText:
                          'Prix de revient par titre, frais inclus · FCFA',
                    ),
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                    validator: (v) =>
                        validAmount(v) ? null : 'Montant positif requis',
                  ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(c),
            child: const Text('Annuler'),
          ),
          FilledButton(
            onPressed: () async {
              if (!form.currentState!.validate()) return;
              if (widget.alerts) {
                await store.addAlert(symbol, number(a.text)!, above);
              } else {
                await store.addHolding(
                  symbol,
                  int.parse(a.text),
                  number(b.text)!,
                );
              }
              if (c.mounted) Navigator.pop(c);
            },
            child: const Text('Enregistrer'),
          ),
        ],
      ),
    );
    // Dispose after the route transition to avoid listeners during the animation.
    await Future<void>.delayed(const Duration(milliseconds: 350));
    a.dispose();
    b.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: Text(
        widget.alerts ? 'Mes seuils de cours' : 'Portefeuille de suivi',
      ),
    ),
    body: ListenableBuilder(
      listenable: widget.store,
      builder: (c, _) {
        final store = widget.store;
        final list = widget.alerts ? store.alerts : store.holdings;
        double invested = 0, value = 0;
        bool missing = false;
        if (!widget.alerts) {
          for (final h in list) {
            invested += (h['cost'] as num) * (h['quantity'] as num);
            final s = store.market.stocks.where((s) => s.symbol == h['symbol']);
            if (s.isEmpty) {
              missing = true;
            } else {
              value += s.first.price * (h['quantity'] as num);
            }
          }
        }
        return PageBody(
          children: [
            Text(
              widget.alerts
                  ? 'Les seuils sont comparés aux derniers cours officiels lorsque l’application est ouverte. Aucun suivi continu ni notification en arrière-plan.'
                  : 'Saisis tes propres titres. Aucun portefeuille prérempli, aucune opération réelle. Valorisation aux derniers cours chargés, hors frais de vente, impôts et dividendes.',
            ),
            MarketNotice(store),
            if (!widget.alerts && list.isNotEmpty)
              Metrics([
                ('Prix de revient', '${money(invested)} FCFA'),
                (
                  'Valorisation',
                  missing ? 'Cours manquants' : '${money(value)} FCFA',
                ),
                (
                  'Écart latent',
                  missing
                      ? 'Non calculable'
                      : '${money(value - invested)} FCFA',
                ),
              ]),
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: store.market.empty || list.length >= 50 ? null : add,
              icon: const Icon(Icons.add),
              label: Text(
                widget.alerts ? 'Ajouter un seuil' : 'Ajouter mes titres',
              ),
            ),
            const SizedBox(height: 20),
            if (list.isEmpty) const Text('Aucune saisie enregistrée.'),
            for (var i = 0; i < list.length; i++) line(store, list[i], i),
          ],
        );
      },
    ),
  );
  Widget line(AppStore store, Map<String, dynamic> item, int i) {
    final stocks = store.market.stocks.where((s) => s.symbol == item['symbol']);
    final reached =
        widget.alerts &&
        stocks.isNotEmpty &&
        (item['above'] == true
            ? stocks.first.price >= item['target']
            : stocks.first.price <= item['target']);
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        title: Text(
          widget.alerts
              ? '${item['symbol']} ${item['above'] == true ? '≥' : '≤'} ${money(item['target'])} FCFA'
              : '${item['symbol']} · ${item['quantity']} titres',
        ),
        subtitle: Text(
          widget.alerts
              ? (stocks.isEmpty
                    ? 'Cours indisponible'
                    : reached
                    ? 'Seuil atteint sur la séance affichée'
                    : 'Seuil non atteint sur la séance affichée')
              : 'Prix de revient : ${money(item['cost'])} FCFA / titre',
        ),
        trailing: IconButton(
          tooltip: 'Supprimer cette saisie',
          onPressed: () =>
              widget.alerts ? store.removeAlert(i) : store.removeHolding(i),
          icon: const Icon(Icons.delete_outline),
        ),
      ),
    );
  }
}

class FeePage extends StatefulWidget {
  const FeePage({super.key});
  @override
  State<FeePage> createState() => _FeePageState();
}

class _FeePageState extends State<FeePage> {
  final form = GlobalKey<FormState>();
  final fields = List.generate(6, (_) => TextEditingController());
  double? fee, total;
  @override
  void dispose() {
    for (final f in fields) {
      f.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext c) => Scaffold(
    appBar: AppBar(title: const Text('Estimateur de frais')),
    body: PageBody(
      children: [
        Text(
          'Le coût commence\npar le barème.',
          style: Theme.of(c).textTheme.headlineMedium,
        ),
        const SizedBox(height: 16),
        const Text(
          'Aucun taux présumé. Modèle : maximum du courtage proportionnel et du minimum, plus frais fixes ; taxe sur cette somme, puis garde saisie comptée une fois. Si ton contrat utilise une autre assiette, ce modèle ne convient pas.',
        ),
        const SizedBox(height: 20),
        Form(
          key: form,
          child: Column(
            children: [
              for (var i = 0; i < 6; i++)
                Padding(
                  padding: const EdgeInsets.only(bottom: 14),
                  child: TextFormField(
                    controller: fields[i],
                    decoration: InputDecoration(
                      labelText: [
                        'Montant de l’ordre · FCFA',
                        'Courtage · %',
                        'Minimum de courtage · FCFA',
                        'Autres frais fixes · FCFA',
                        'Taxe sur ces frais · %',
                        'Garde estimée · FCFA',
                      ][i],
                    ),
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                    validator: (v) {
                      final n = number(v);
                      return n == null ||
                              !n.isFinite ||
                              n < 0 ||
                              n > 1e10 ||
                              (i == 0 && n <= 0) ||
                              ([1, 4].contains(i) && n > 100)
                          ? 'Valeur valide requise (0 si aucun)'
                          : null;
                    },
                    onChanged: (_) => setState(() => fee = null),
                  ),
                ),
            ],
          ),
        ),
        FilledButton(
          onPressed: () {
            if (!form.currentState!.validate()) return;
            final n = fields.map((f) => number(f.text)!).toList();
            final b = n[0] * n[1] / 100;
            setState(() {
              fee = ((b > n[2] ? b : n[2]) + n[3]) * (1 + n[4] / 100) + n[5];
              total = n[0] + fee!;
            });
          },
          child: const Text('Calculer'),
        ),
        if (fee != null) ...[
          const SectionTitle('Selon tes hypothèses'),
          Metrics([
            ('Frais estimés', '${money(fee!)} FCFA'),
            ('Total à prévoir', '${money(total!)} FCFA'),
          ]),
          const SizedBox(height: 12),
          const Text(
            'Estimation informative, pas un devis. Vérifie le barème, les taxes et leur calendrier auprès de ta SGI.',
          ),
        ],
        const SourceButton('Barèmes BRVM et DC/BR', tariffsUrl),
        const SourceButton('Annuaire des SGI', sgiUrl),
      ],
    ),
  );
}

class RiskProfilePage extends StatefulWidget {
  const RiskProfilePage({super.key});
  @override
  State<RiskProfilePage> createState() => _RiskProfilePageState();
}

class _RiskProfilePageState extends State<RiskProfilePage> {
  final answers = <int, int>{};
  bool result = false;
  final questions = const [
    (
      'Quand pourrais-tu avoir besoin de cet argent ?',
      ['Moins de 2 ans', 'Entre 2 et 5 ans', 'Au-delà de 5 ans'],
    ),
    (
      'Une perte compromettrait-elle tes besoins essentiels ?',
      ['Oui', 'En partie', 'Non, j’ai une réserve distincte'],
    ),
    (
      'Face à une baisse importante…',
      [
        'Je devrais vendre rapidement',
        'Je réexaminerais mon plan',
        'Je pourrais attendre sans garantie de reprise',
      ],
    ),
    (
      'Ton expérience des marchés ?',
      [
        'Je débute',
        'Je connais les principaux risques',
        'J’ai déjà vécu des variations importantes',
      ],
    ),
  ];
  @override
  Widget build(BuildContext c) => Scaffold(
    appBar: AppBar(title: const Text('Réfléchir à son profil')),
    body: PageBody(
      children: [
        const Text(
          'Questionnaire pédagogique, sans évaluation réglementaire ni recommandation personnalisée. Aucun rendement cible n’est associé au résultat.',
        ),
        const SizedBox(height: 16),
        for (var i = 0; i < questions.length; i++)
          Card(
            margin: const EdgeInsets.only(bottom: 16),
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${i + 1}. ${questions[i].$1}',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  RadioGroup<int>(
                    groupValue: answers[i],
                    onChanged: (v) => setState(() {
                      answers[i] = v!;
                      result = false;
                    }),
                    child: Column(
                      children: [
                        for (var j = 0; j < 3; j++)
                          RadioListTile<int>(
                            contentPadding: EdgeInsets.zero,
                            value: j,
                            title: Text(questions[i].$2[j]),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        FilledButton(
          onPressed: answers.length != 4
              ? null
              : () => setState(() => result = true),
          child: const Text('Mes points de vigilance'),
        ),
        if (result) ...[
          const SectionTitle('Ton point de départ'),
          Text(
            answers[0] == 0 || answers[1] == 0
                ? 'Tes contraintes de liquidité ou de sécurité du budget sont fortes. Préserve les sommes nécessaires à tes dépenses et ton épargne de précaution avant d’envisager des actions.'
                : 'Tu disposes peut-être de plus de temps ou de marge pour supporter les variations. Cela ne supprime pas le risque de perte et ne suffit pas à déterminer une allocation adaptée.',
          ),
          const SizedBox(height: 12),
          const Text(
            'Approfondis la diversification, la liquidité et les frais. Pour un conseil adapté, échange avec un professionnel agréé.',
          ),
        ],
      ],
    ),
  );
}

class SgiPage extends StatefulWidget {
  final AppStore store;
  const SgiPage(this.store, {super.key});
  @override
  State<SgiPage> createState() => _SgiPageState();
}

class _SgiPageState extends State<SgiPage> {
  int page = 0;
  late Future<String> future = widget.store.repository.page(sgiUrl);
  void load(int p) {
    setState(() {
      page = p;
      future = widget.store.repository.page(
        p == 0 ? sgiUrl : '$sgiUrl?page=$p',
      );
    });
  }

  @override
  Widget build(BuildContext c) => Scaffold(
    appBar: AppBar(title: const Text('Annuaire officiel des SGI')),
    body: PageBody(
      children: [
        const Text(
          'Coordonnées publiées par la BRVM. Vérifie l’agrément, les coordonnées et les conditions directement auprès de l’établissement et de l’AMF-UMOA.',
        ),
        const SourceButton('Consulter l’annuaire officiel', sgiUrl),
        FutureBuilder<String>(
          future: future,
          builder: (c, s) {
            if (s.connectionState != ConnectionState.done) {
              return const Center(child: CircularProgressIndicator());
            }
            if (s.hasError) {
              return TextButton(
                onPressed: () => load(page),
                child: const Text('Annuaire indisponible · réessayer'),
              );
            }
            final texts = html
                .parse(s.data!)
                .querySelectorAll('.view-content .views-row')
                .map((r) => r.text.replaceAll(RegExp(r'\s+'), ' ').trim())
                .where((t) => t.length > 30)
                .toSet();
            return Column(
              children: [
                if (texts.isEmpty)
                  const Text(
                    'Lecture intégrée indisponible. Consulte la page officielle ci-dessus.',
                  ),
                for (final t in texts)
                  Card(
                    margin: const EdgeInsets.only(bottom: 14),
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: SelectableText(t),
                    ),
                  ),
              ],
            );
          },
        ),
        const SizedBox(height: 20),
        Wrap(
          spacing: 8,
          children: [
            if (page > 0)
              OutlinedButton(
                onPressed: () => load(page - 1),
                child: const Text('Précédent'),
              ),
            TextButton(onPressed: null, child: Text('Page ${page + 1}')),
            if (page < 9)
              OutlinedButton(
                onPressed: () => load(page + 1),
                child: const Text('Suivant'),
              ),
          ],
        ),
      ],
    ),
  );
}
