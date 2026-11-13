import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:bourse_facile_mobile/account/account_controller.dart';
import 'package:bourse_facile_mobile/core/store.dart';
import 'package:bourse_facile_mobile/core/theme.dart';
import 'package:bourse_facile_mobile/data/market.dart';
import 'package:bourse_facile_mobile/portfolio/portfolio_controller.dart';
import 'package:bourse_facile_mobile/portfolio/portfolio_page.dart';
import 'package:bourse_facile_mobile/features/workspace.dart';
import 'package:bourse_facile_mobile/portfolio/purchase.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'support/accounts.dart';

Future<(AppStore, AccountController, PortfolioController)> start(
  WidgetTester t, {
  bool signedIn = true,
  bool workspace = false,
  double width = 390,
  double scale = 1,
}) async {
  t.view.physicalSize = Size(width, 844);
  t.view.devicePixelRatio = 1;
  addTearDown(t.view.resetPhysicalSize);
  addTearDown(t.view.resetDevicePixelRatio);
  SharedPreferences.setMockInitialValues({});
  final prefs = await SharedPreferences.getInstance();
  final vault = MemoryVault();
  final account = AccountController(
    gateway: FakeAuthGateway(),
    vault: vault,
    preferences: prefs,
  );
  await account.restore();
  if (signedIn) await account.googleSignIn();
  final ledger = PortfolioController(account: account, vault: vault);
  if (signedIn) await ledger.load();
  final store = AppStore(
    prefs,
    MarketRepository(client: MockClient((_) async => http.Response('', 500))),
  );
  store.market = parseOfficialMarket(
    File('test/fixtures/actions.html').readAsStringSync(),
    File('test/fixtures/home.html').readAsStringSync(),
  );
  addTearDown(() async {
    await t.pumpWidget(const SizedBox.shrink());
    ledger.dispose();
    account.dispose();
    store.dispose();
  });
  await t.pumpWidget(
    AccountScope(
      controller: account,
      child: PortfolioScope(
        controller: ledger,
        child: MaterialApp(
          theme: Brand.theme(Brightness.light),
          locale: const Locale('fr'),
          supportedLocales: const [Locale('fr')],
          localizationsDelegates: GlobalMaterialLocalizations.delegates,
          builder: (c, child) => MediaQuery(
            data: MediaQuery.of(
              c,
            ).copyWith(textScaler: TextScaler.linear(scale)),
            child: child!,
          ),
          home: workspace
              ? Scaffold(body: WorkspacePage(store))
              : PortfolioPage(store),
        ),
      ),
    ),
  );
  await t.pumpAndSettle();
  return (store, account, ledger);
}

void main() {
  testWidgets('Portfolio is gated behind a real account controller', (t) async {
    await start(t, signedIn: false);
    expect(find.text('Se connecter ou créer un compte'), findsOneWidget);
    expect(find.text('Ajouter une action'), findsNothing);
    await t.tap(find.text('Se connecter ou créer un compte'));
    await t.pumpAndSettle();
    expect(find.text('Continuer avec Google'), findsOneWidget);
    expect(
      find.widgetWithText(TextFormField, 'Adresse e-mail'),
      findsOneWidget,
    );
  });
  testWidgets('Workspace reveals portfolio only after verified login', (
    t,
  ) async {
    final (_, account, _) = await start(t, signedIn: false, workspace: true);
    expect(find.text('Portefeuille de suivi'), findsNothing);
    expect(find.text('Ajouter une action'), findsNothing);
    await account.googleSignIn();
    await t.pumpAndSettle();
    expect(find.text('Portefeuille de suivi'), findsOneWidget);
    await account.signOut();
    await t.pumpAndSettle();
    expect(find.text('Portefeuille de suivi'), findsNothing);
  });
  testWidgets('Logout hides an open purchase form and its stock picker', (
    t,
  ) async {
    final (_, account, ledger) = await start(t);
    await t.tap(find.text('Ajouter une action'));
    await t.pumpAndSettle();
    await t.enterText(find.byKey(const Key('purchase-quantity')), '10');
    await t.enterText(find.byKey(const Key('purchase-unit-price')), '4000');
    t.testTextInput.hide();
    await t.pumpAndSettle();
    await t.ensureVisible(find.text('Sélectionner une action'));
    await t.tap(find.text('Sélectionner une action'));
    await t.pumpAndSettle();
    expect(find.text('Rechercher un symbole ou une société'), findsOneWidget);
    await account.signOut();
    await t.pumpAndSettle();
    expect(find.text('Rechercher un symbole ou une société'), findsNothing);
    expect(find.byKey(const Key('purchase-quantity')), findsNothing);
    expect(find.byKey(const Key('purchase-unit-price')), findsNothing);
    expect(ledger.entries, isEmpty);
    expect(t.takeException(), isNull);
  });
  testWidgets(
    'Symbol picker shows full company name; a purchase is persisted once',
    (t) async {
      final (_, _, ledger) = await start(t);
      await t.tap(find.text('Ajouter une action'));
      await t.pumpAndSettle();
      await t.tap(find.text('Sélectionner une action'));
      await t.pumpAndSettle();
      await t.enterText(find.byType(TextField).last, 'SNTS');
      await t.pumpAndSettle();
      expect(find.text('SONATEL SENEGAL'), findsOneWidget);
      await t.tap(find.widgetWithText(ListTile, 'SNTS'));
      await t.pumpAndSettle();
      await t.enterText(find.byKey(const Key('purchase-quantity')), '10');
      await t.enterText(find.byKey(const Key('purchase-unit-price')), '4000');
      await t.pumpAndSettle();
      await t.scrollUntilVisible(
        find.text('Valider l’achat'),
        220,
        scrollable: find
            .byWidgetPredicate(
              (w) => w is Scrollable && w.axisDirection == AxisDirection.down,
            )
            .last,
      );
      await t.pumpAndSettle();
      await t.tap(find.text('Valider l’achat'));
      await t.pumpAndSettle();
      expect(ledger.entries.length, 1);
      expect(ledger.entries.single.quantity, 10);
      expect(ledger.entries.single.unitPriceMinor, 400000);
      expect(t.takeException(), isNull);
    },
  );
  testWidgets(
    'Account logout immediately removes the private portfolio from view',
    (t) async {
      final (_, account, ledger) = await start(t);
      await ledger.add(
        PurchaseEntry(
          id: PurchaseEntry.newId(),
          symbol: 'SNTS',
          companyName: 'SONATEL SENEGAL',
          quantity: 10,
          unitPriceMinor: 400000,
          recordedAt: DateTime.now(),
        ),
      );
      await t.pumpAndSettle();
      await account.signOut();
      await t.pumpAndSettle();
      expect(find.text('Se connecter ou créer un compte'), findsOneWidget);
      expect(find.text('SNTS'), findsNothing);
    },
  );
  testWidgets(
    'Portfolio scenario includes user hypotheses, dividends and fees without changing holdings',
    (t) async {
      final (_, _, ledger) = await start(t);
      await ledger.add(
        PurchaseEntry(
          id: PurchaseEntry.newId(),
          symbol: 'SNTS',
          companyName: 'SONATEL SENEGAL',
          quantity: 10,
          unitPriceMinor: 400000,
          recordedAt: DateTime.utc(2026),
        ),
      );
      await t.pumpAndSettle();
      await t.tap(find.text('Simuler mes titres'));
      await t.pumpAndSettle();
      await t.tap(find.byType(DropdownButtonFormField<String>));
      await t.pumpAndSettle();
      await t.tap(find.text('SNTS · SONATEL SENEGAL').last);
      await t.pumpAndSettle();
      await t.enterText(
        find.widgetWithText(TextFormField, 'Cours futur par action'),
        '4500',
      );
      await t.enterText(
        find.widgetWithText(TextFormField, 'Dividende net par action'),
        '100',
      );
      await t.enterText(
        find.widgetWithText(TextFormField, 'Frais et taxes au total'),
        '500',
      );
      FocusManager.instance.primaryFocus?.unfocus();
      t.testTextInput.hide();
      await t.pumpAndSettle();
      await t.scrollUntilVisible(
        find.text('Calculer ce scénario'),
        250,
        scrollable: find
            .byWidgetPredicate(
              (w) => w is Scrollable && w.axisDirection == AxisDirection.down,
            )
            .last,
      );
      await t.ensureVisible(
        find.widgetWithText(FilledButton, 'Calculer ce scénario'),
      );
      await t.pumpAndSettle();
      await t.tap(find.text('Calculer ce scénario'));
      await t.pumpAndSettle();
      await t.scrollUntilVisible(
        find.text('Résultat selon tes hypothèses'),
        250,
        scrollable: find
            .byWidgetPredicate(
              (w) => w is Scrollable && w.axisDirection == AxisDirection.down,
            )
            .last,
      );
      expect(find.textContaining('+5\u202f500 FCFA'), findsOneWidget);
      expect(ledger.entries.single.unitPriceMinor, 400000);
      expect(t.takeException(), isNull);
    },
  );
  testWidgets('Logout clears and hides an open portfolio scenario', (t) async {
    final (_, account, ledger) = await start(t);
    await ledger.add(
      PurchaseEntry(
        id: PurchaseEntry.newId(),
        symbol: 'SNTS',
        companyName: 'SONATEL',
        quantity: 10,
        unitPriceMinor: 400000,
        recordedAt: DateTime.utc(2026),
      ),
    );
    await t.pumpAndSettle();
    await t.tap(find.text('Simuler mes titres'));
    await t.pumpAndSettle();
    expect(
      find.widgetWithText(TextFormField, 'Cours futur par action'),
      findsOneWidget,
    );
    await t.enterText(
      find.widgetWithText(TextFormField, 'Cours futur par action'),
      '4500',
    );
    await account.signOut();
    await t.pumpAndSettle();
    expect(
      find.widgetWithText(TextFormField, 'Cours futur par action'),
      findsNothing,
    );
    expect(find.text('4500'), findsNothing);
    expect(t.takeException(), isNull);
  });
  testWidgets(
    'All three sections and formulas are readable at 320px and 200 percent text',
    (t) async {
      final (_, _, ledger) = await start(t, width: 320, scale: 2);
      await ledger.add(
        PurchaseEntry(
          id: PurchaseEntry.newId(),
          symbol: 'SNTS',
          companyName: 'SONATEL SENEGAL',
          quantity: 10,
          unitPriceMinor: 400000,
          recordedAt: DateTime.now(),
        ),
      );
      await t.pumpAndSettle();
      expect(t.takeException(), isNull);
      final scroll = find
          .byWidgetPredicate(
            (w) => w is Scrollable && w.axisDirection == AxisDirection.down,
          )
          .first;
      for (var i = 0; i < 35; i++) {
        await t.drag(scroll, const Offset(0, -500));
        await t.pumpAndSettle();
        expect(t.takeException(), isNull);
      }
    },
  );
}
