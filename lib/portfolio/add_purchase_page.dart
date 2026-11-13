import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../core/store.dart';
import '../data/market.dart';
import '../features/widgets.dart';
import '../account/account_page.dart';
import 'portfolio_controller.dart';
import 'purchase.dart';
import 'portfolio_math.dart';

class AddPurchasePage extends StatefulWidget {
  final AppStore store;
  final PortfolioController portfolio;
  final PurchaseEntry? editing;
  const AddPurchasePage(this.store, this.portfolio, {this.editing, super.key});
  @override
  State<AddPurchasePage> createState() => _AddPurchasePageState();
}

class _AddPurchasePageState extends State<AddPurchasePage> {
  final form = GlobalKey<FormState>();
  final quantity = TextEditingController(), price = TextEditingController();
  late final String id = widget.editing?.id ?? PurchaseEntry.newId();
  Stock? selected;
  bool submitted = false;
  late final String? ownerUid;
  bool accessRevoked = false;

  void accountChanged() {
    final account = widget.portfolio.account;
    if (!account.portfolioAllowed || account.identity?.uid != ownerUid) {
      quantity.clear();
      price.clear();
      if (mounted) {
        setState(() {
          selected = null;
          accessRevoked = true;
        });
      }
    }
  }

  @override
  void initState() {
    super.initState();
    ownerUid = widget.portfolio.account.identity?.uid;
    widget.portfolio.account.addListener(accountChanged);
    final e = widget.editing;
    if (e != null) {
      quantity.text = e.quantity.toString();
      price.text =
          '${e.unitPriceMinor ~/ 100},${(e.unitPriceMinor % 100).toString().padLeft(2, '0')}';
      final found = widget.store.market.stocks.where(
        (s) => s.symbol == e.symbol,
      );
      if (found.isNotEmpty) selected = found.first;
    }
  }

  @override
  void dispose() {
    widget.portfolio.account.removeListener(accountChanged);
    quantity.dispose();
    price.dispose();
    super.dispose();
  }

  Future<void> choose() async {
    final value = await showModalBottomSheet<Stock>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (context) => FractionallySizedBox(
        heightFactor: .9,
        child: ListenableBuilder(
          listenable: widget.portfolio.account,
          builder: (context, _) => !widget.portfolio.account.portfolioAllowed
              ? AccountPage(widget.portfolio.account)
              : accessRevoked
              ? const Center(
                  child: Text('Session modifiée. Ferme cette fenêtre.'),
                )
              : StockPicker(widget.store.market.stocks),
        ),
      ),
    );
    if (value != null &&
        mounted &&
        !accessRevoked &&
        widget.portfolio.account.portfolioAllowed) {
      setState(() => selected = value);
    }
  }

  Future<void> save() async {
    if (accessRevoked || !widget.portfolio.account.portfolioAllowed) return;
    setState(() => submitted = true);
    if (!form.currentState!.validate() || selected == null) return;
    FocusScope.of(context).unfocus();
    final p = PurchaseEntry(
      id: id,
      symbol: selected!.symbol,
      companyName: selected!.name,
      quantity: int.parse(quantity.text),
      unitPriceMinor: parseUnitPrice(price.text)!,
      recordedAt: widget.editing?.recordedAt ?? DateTime.now().toUtc(),
    );
    final ok = widget.editing == null
        ? await widget.portfolio.add(p)
        : await widget.portfolio.replace(p);
    if (!mounted) return;
    if (ok) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Achat enregistré dans ton portefeuille.'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: Listenable.merge([widget.portfolio, widget.portfolio.account]),
    builder: (context, _) {
      if (!widget.portfolio.account.portfolioAllowed) {
        return AccountPage(widget.portfolio.account);
      }
      if (accessRevoked) {
        return Scaffold(
          appBar: AppBar(title: const Text('Espace personnel')),
          body: const Center(
            child: Text('Session modifiée. Reviens à ton portefeuille.'),
          ),
        );
      }
      final q = int.tryParse(quantity.text);
      final p = parseUnitPrice(price.text);
      final total = q != null && q > 0 && q <= 100000000 && p != null
          ? BigInt.from(q) * BigInt.from(p)
          : null;
      return Scaffold(
        appBar: AppBar(
          title: Text(
            widget.editing == null ? 'Ajouter une action' : 'Corriger un achat',
          ),
        ),
        body: PageBody(
          children: [
            Text(
              'Tes achats.\nTes vrais prix.',
              style: Theme.of(context).textTheme.headlineLarge,
            ),
            const SizedBox(height: 12),
            const Text(
              'Renseigne les actions que tu détiens et le prix unitaire réellement payé. Cette saisie ne passe aucun ordre de bourse.',
            ),
            const SectionTitle('1. Choisir l’action BRVM'),
            Card(
              child: ListTile(
                contentPadding: const EdgeInsets.all(18),
                leading: const Icon(Icons.search),
                title: Text(
                  selected?.symbol ?? 'Sélectionner une action',
                  style: const TextStyle(fontWeight: FontWeight.w800),
                ),
                subtitle: Text(
                  selected?.name ?? 'Symbole et dénomination de la société',
                ),
                trailing: const Icon(Icons.chevron_right),
                onTap: widget.portfolio.saving || widget.store.market.empty
                    ? null
                    : choose,
              ),
            ),
            if (submitted && selected == null)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  'Sélectionne une action dans la liste BRVM.',
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              ),
            if (widget.store.market.empty)
              const Text(
                'La liste des actions n’a pas encore pu être chargée. Actualise le marché puis réessaie.',
              ),
            if (selected != null) ...[
              const SizedBox(height: 12),
              Text(
                'Dernier cours publié : ${money(selected!.price)} FCFA. Ce cours ne remplace pas ton prix d’achat.',
              ),
              MarketNotice(widget.store),
            ],
            const SectionTitle('2. Renseigner l’achat'),
            Form(
              key: form,
              child: Column(
                children: [
                  TextFormField(
                    key: const Key('purchase-quantity'),
                    controller: quantity,
                    enabled: !widget.portfolio.saving,
                    decoration: const InputDecoration(
                      labelText: 'Nombre d’actions',
                      helperText: 'Quantité entière de titres détenus',
                    ),
                    keyboardType: TextInputType.number,
                    inputFormatters: [LengthLimitingTextInputFormatter(9)],
                    onChanged: (_) => setState(() {}),
                    validator: (v) {
                      final n = int.tryParse(v ?? '');
                      return n == null || n < 1 || n > 100000000
                          ? 'Indique une quantité de 1 à 100 000 000.'
                          : null;
                    },
                  ),
                  const SizedBox(height: 18),
                  TextFormField(
                    key: const Key('purchase-unit-price'),
                    controller: price,
                    enabled: !widget.portfolio.saving,
                    decoration: const InputDecoration(
                      labelText: 'Cours à l’achat d’une action',
                      suffixText: 'FCFA',
                      helperText: 'Prix unitaire payé, hors frais et impôts',
                    ),
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                    inputFormatters: [LengthLimitingTextInputFormatter(13)],
                    onChanged: (_) => setState(() {}),
                    validator: (v) => parseUnitPrice(v ?? '') == null
                        ? 'Indique un prix positif, avec au plus 2 décimales.'
                        : null,
                  ),
                ],
              ),
            ),
            if (total != null) ...[
              const SectionTitle('Montant de cet achat'),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(22),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${amount(total)} FCFA',
                        style: Theme.of(context).textTheme.headlineMedium,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '$q actions × ${amount(BigInt.from(p!))} FCFA par action',
                      ),
                    ],
                  ),
                ),
              ),
            ],
            const SizedBox(height: 12),
            const Text(
              'Après un fractionnement, utilise les quantités et prix ajustés de ton relevé SGI. Aucun ajustement automatique n’est appliqué.',
              style: TextStyle(fontSize: 12),
            ),
            const SizedBox(height: 26),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: widget.portfolio.saving ? null : save,
                icon: const Icon(Icons.check),
                label: Text(
                  widget.portfolio.saving
                      ? 'Enregistrement sécurisé…'
                      : 'Valider l’achat',
                ),
              ),
            ),
            if (widget.portfolio.error != null)
              Padding(
                padding: const EdgeInsets.only(top: 16),
                child: Text(
                  widget.portfolio.error!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              ),
            const SizedBox(height: 16),
            const Text(
              'Sauvegarde chiffrée sur cet appareil, pour le compte connecté. Les saisies ne sont pas synchronisées avec d’autres appareils.',
              style: TextStyle(fontSize: 12),
            ),
          ],
        ),
      );
    },
  );
}

class StockPicker extends StatefulWidget {
  final List<Stock> stocks;
  const StockPicker(this.stocks, {super.key});
  @override
  State<StockPicker> createState() => _StockPickerState();
}

class _StockPickerState extends State<StockPicker> {
  String query = '';
  @override
  Widget build(BuildContext context) {
    final list =
        widget.stocks
            .where(
              (s) => '${s.symbol} ${s.name}'.toLowerCase().contains(
                query.toLowerCase(),
              ),
            )
            .toList()
          ..sort((a, b) => a.symbol.compareTo(b.symbol));
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Actions de la BRVM',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 16),
            TextField(
              autofocus: true,
              decoration: const InputDecoration(
                labelText: 'Rechercher un symbole ou une société',
                prefixIcon: Icon(Icons.search),
              ),
              onChanged: (v) => setState(() => query = v),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: list.isEmpty
                  ? const Center(
                      child: Text(
                        'Aucune action ne correspond à la recherche.',
                      ),
                    )
                  : ListView.builder(
                      itemCount: list.length,
                      itemBuilder: (context, i) => ListTile(
                        minVerticalPadding: 16,
                        title: Text(
                          list[i].symbol,
                          style: const TextStyle(fontWeight: FontWeight.w800),
                        ),
                        subtitle: Text(list[i].name),
                        trailing: const Icon(Icons.add_circle_outline),
                        onTap: () => Navigator.pop(context, list[i]),
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
