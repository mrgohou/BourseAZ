import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:bourse_facile_mobile/account/account_controller.dart';
import 'package:bourse_facile_mobile/account/account_page.dart';
import 'package:bourse_facile_mobile/account/auth_gateway.dart';
import 'package:bourse_facile_mobile/core/store.dart';
import 'package:bourse_facile_mobile/core/theme.dart';
import 'package:bourse_facile_mobile/data/market.dart';
import 'package:bourse_facile_mobile/data/official_feeds.dart';
import 'package:bourse_facile_mobile/features/official_updates.dart';
import 'support/accounts.dart';

class CanceledGoogleGateway extends FakeAuthGateway {
  @override
  Future<AccountSession> googleSignIn() async => throw const AccountCancelled();
}

Future<void> show(
  WidgetTester t,
  Widget child, {
  double width = 390,
  double scale = 1,
}) async {
  t.view.physicalSize = Size(width, 844);
  t.view.devicePixelRatio = 1;
  addTearDown(t.view.resetPhysicalSize);
  addTearDown(t.view.resetDevicePixelRatio);
  await t.pumpWidget(
    MaterialApp(
      theme: Brand.theme(Brightness.light),
      locale: const Locale('fr'),
      supportedLocales: const [Locale('fr')],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      builder: (c, child) => MediaQuery(
        data: MediaQuery.of(c).copyWith(textScaler: TextScaler.linear(scale)),
        child: child!,
      ),
      home: child,
    ),
  );
  await t.pumpAndSettle();
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUp(() => SharedPreferences.setMockInitialValues({}));
  testWidgets(
    'Google returning canceled leaves a visible explanation and never dismisses the login page',
    (t) async {
      final account = AccountController(
        gateway: CanceledGoogleGateway(),
        vault: MemoryVault(),
        preferences: await SharedPreferences.getInstance(),
      );
      await account.restore();
      await show(t, AccountPage(account, closeOnAuthenticated: true));
      await t.tap(find.text('Continuer avec Google'));
      await t.pumpAndSettle();
      expect(find.byType(AccountPage), findsOneWidget);
      expect(account.identity, isNull);
      expect(find.textContaining('annulée ou interrompue'), findsWidgets);
      expect(find.byType(SnackBar), findsOneWidget);
      await t.pump(const Duration(seconds: 11));
      await t.pumpAndSettle();
      await t.pumpWidget(const SizedBox.shrink());
      account.dispose();
    },
  );
  testWidgets(
    'Official dividend dates and amounts render, refresh bypasses the five-minute cache',
    (t) async {
      int requests = 0;
      final repo = MarketRepository(
        client: MockClient((r) async {
          requests++;
          return http.Response(
            File(
              'test/fixtures/official_v002/dividends.html',
            ).readAsStringSync(),
            200,
            headers: {'content-type': 'text/html; charset=utf-8'},
          );
        }),
      );
      final store = AppStore(await SharedPreferences.getInstance(), repo);
      await t.runAsync(() => repo.page(dividendsUrl));
      await show(t, DividendCalendarPage(store));
      expect(find.text('BOLLORE TRANSPORT & LOGISTICS'), findsOneWidget);
      expect(find.text('92 FCFA net / action'), findsOneWidget);
      expect(find.textContaining('27/10/2026'), findsOneWidget);
      expect(requests, 1);
      await t.tap(find.byTooltip('Actualiser'));
      await t.runAsync(() => repo.page(dividendsUrl));
      await t.pumpAndSettle();
      expect(requests, 2);
      expect(t.takeException(), isNull);
      await t.pumpWidget(const SizedBox.shrink());
      store.dispose();
    },
  );
  testWidgets(
    'News includes dated market notices without replacing article dates with the current date',
    (t) async {
      final repo = MarketRepository(
        client: MockClient(
          (r) async => http.Response(
            File(
              'test/fixtures/official_v002/${r.url.path.contains('avis-et-publications') ? 'notices' : 'news'}.html',
            ).readAsStringSync(),
            200,
            headers: {'content-type': 'text/html; charset=utf-8'},
          ),
        ),
      );
      final store = AppStore(await SharedPreferences.getInstance(), repo);
      await t.runAsync(
        () => Future.wait([repo.page(newsUrl), repo.page(noticesUrl)]),
      );
      await show(
        t,
        OfficialFeedPage(store, OfficialFeedKind.news),
        width: 320,
        scale: 2,
      );
      expect(t.takeException(), isNull);
      final scroll = find.byType(Scrollable).first;
      for (var i = 0; i < 5; i++) {
        await t.drag(scroll, const Offset(0, -400));
        await t.pumpAndSettle();
        expect(t.takeException(), isNull);
      }
      await t.pumpWidget(const SizedBox.shrink());
      store.dispose();
    },
  );
  test(
    'Public page cache coalesces concurrent reads and supports explicit refresh',
    () async {
      var requests = 0;
      final repo = MarketRepository(
        client: MockClient((r) async {
          requests++;
          await Future<void>.delayed(const Duration(milliseconds: 5));
          return http.Response('page $requests', 200);
        }),
      );
      final results = await Future.wait(
        List.generate(30, (_) => repo.page(quotesUrl)),
      );
      expect(results.toSet(), {'page 1'});
      expect(requests, 1);
      await repo.page(quotesUrl);
      expect(requests, 1);
      expect(await repo.page(quotesUrl, refresh: true), 'page 2');
      expect(requests, 2);
      repo.client.close();
    },
  );
}
