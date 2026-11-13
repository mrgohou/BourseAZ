import 'dart:convert';
import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:bourse_facile_mobile/core/store.dart';
import 'package:bourse_facile_mobile/data/market.dart';
import 'package:bourse_facile_mobile/data/company_facts.dart';
import 'package:bourse_facile_mobile/data/lessons.dart';

MarketSnapshot officialFixture() => parseOfficialMarket(
  File('test/fixtures/actions.html').readAsStringSync(),
  File('test/fixtures/home.html').readAsStringSync(),
);
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    await loadAcademy();
  });
  test(
    'Official BRVM columns and source date are parsed without a seeded quote',
    () {
      final m = officialFixture();
      expect(m.stocks.length, 48);
      expect(m.asOf, DateTime.utc(2026, 11, 10, 22, 45));
      expect(m.indices.length, 3);
      final s = m.stocks.singleWhere((s) => s.symbol == 'SNTS');
      expect(s.price, 4000);
      expect(s.volume, 270403);
      expect(s.previous, 4000);
      expect(s.change, -3.61);
      expect(s.ytd, isNull);
    },
  );
  test(
    'Rejects demo, arbitrary sources, future dates, missing columns and malformed HTML',
    () {
      final j = officialFixture().toJson();
      expect(
        () => MarketSnapshot.fromJson({...j, 'demo': true}),
        throwsFormatException,
      );
      expect(
        () => MarketSnapshot.fromJson({...j, 'source': 'https://fake.example'}),
        throwsFormatException,
      );
      expect(
        () => MarketSnapshot.fromJson({
          ...j,
          'asOf': DateTime.now().add(const Duration(days: 3)).toIso8601String(),
        }),
        throwsFormatException,
      );
      expect(
        () => parseOfficialMarket(
          '<table></table>',
          File('test/fixtures/home.html').readAsStringSync(),
        ),
        throwsFormatException,
      );
      expect(() => parsePublicationDate('aucune date'), throwsFormatException);
    },
  );
  test(
    'Official-only URL boundary rejects credentials, lookalikes and cleartext',
    () {
      expect(officialUrl(quotesUrl), true);
      expect(officialUrl('https://brvm.org.evil.test'), false);
      expect(officialUrl('http://www.brvm.org'), false);
      expect(officialUrl('https://user@www.brvm.org'), false);
    },
  );
  test(
    '50 refreshes coalesce; HTML requests cached; absent PDF never invents ratios',
    () async {
      var calls = 0;
      final repo = MarketRepository(
        client: MockClient((r) async {
          calls++;
          await Future<void>.delayed(const Duration(milliseconds: 10));
          if (r.url.host == 'bfin.brvm.org') return http.Response('', 404);
          return http.Response(
            File(
              r.url.path.contains('cours-actions')
                  ? 'test/fixtures/actions.html'
                  : 'test/fixtures/home.html',
            ).readAsStringSync(),
            200,
            headers: {'content-type': 'text/html; charset=utf-8'},
          );
        }),
      );
      final store = AppStore(await SharedPreferences.getInstance(), repo);
      expect(store.market.stocks, isEmpty);
      await Future.wait(List.generate(50, (_) => store.refresh()));
      expect(calls, 3);
      expect(store.market.stocks.length, 48);
      expect(store.market.stocks.every((s) => s.per == null), true);
      expect(store.market.bulletin, isNull);
      await store.refresh();
      expect(calls, 3);
      store.dispose();
    },
  );
  test('Offline install has no demo or fabricated market', () async {
    final store = AppStore(
      await SharedPreferences.getInstance(),
      MarketRepository(client: MockClient((_) async => http.Response('', 503))),
    );
    await store.refresh();
    expect(store.market.stocks, isEmpty);
    expect(store.offline, true);
    expect(store.message, contains('Aucun cours fictif'));
    store.dispose();
  });
  test(
    'Only last official snapshot survives failure and restoration',
    () async {
      final p = await SharedPreferences.getInstance();
      final store = AppStore(
        p,
        MarketRepository(
          client: MockClient((_) async => http.Response('', 500)),
        ),
      )..market = officialFixture();
      await store.toggleFavorite('SNTS');
      final restored = AppStore(
        p,
        MarketRepository(
          client: MockClient((_) async => http.Response('', 500)),
        ),
      )..restore();
      await restored.refresh();
      expect(restored.market.stocks.length, 48);
      expect(restored.offline, true);
      expect(restored.market.source, quotesUrl);
      expect(restored.favorites, {'SNTS'});
      store.dispose();
      restored.dispose();
    },
  );
  test(
    'Reject old demo cache; personal lines and alerts persist without seeded holdings',
    () async {
      SharedPreferences.setMockInitialValues({
        'bourse_mobile_v1': jsonEncode({
          'market': {'demo': true},
          'favorites': ['SNTS'],
        }),
      });
      final p = await SharedPreferences.getInstance();
      MarketRepository repo() => MarketRepository(
        client: MockClient((_) async => http.Response('', 500)),
      );
      final store = AppStore(p, repo())..restore();
      expect(store.market.empty, true);
      expect(store.holdings, isEmpty);
      expect(store.alerts, isEmpty);
      await store.addHolding('SNTS', 10, 4000);
      await store.addAlert('SNTS', 4500, true);
      await store.complete(0);
      final restored = AppStore(p, repo())..restore();
      expect(restored.holdings.single['quantity'], 10);
      expect(restored.alerts.single['target'], 4500);
      expect(restored.completed, {0});
      await restored.reset();
      expect(restored.holdings, isEmpty);
      expect(restored.market.empty, true);
      store.dispose();
      restored.dispose();
    },
  );
  test(
    'Full learning curriculum includes explained quiz and official references',
    () {
      expect(lessons.length, 15);
      expect(glossary.length, 23);
      for (final l in lessons) {
        expect(l.body.length, greaterThan(250));
        expect(l.correct, inInclusiveRange(0, l.answers.length - 1));
        expect(l.explanation, isNotEmpty);
        expect(officialUrl(l.source), true);
      }
    },
  );
  test(
    'Latest issuer financial reports are extracted, without using demo statements',
    () async {
      final r = MarketRepository(
        client: MockClient(
          (_) async => http.Response(
            File('test/fixtures/sonatel.html').readAsStringSync(),
            200,
            headers: {'content-type': 'text/html; charset=utf-8'},
          ),
        ),
      );
      final docs = await r.documents('SNTS');
      expect(docs.length, greaterThan(10));
      expect(docs.any((d) => d.url.contains('20261029')), true);
      expect(docs.every((d) => officialUrl(d.url)), true);
    },
  );
  test(
    'Official PDF columns enrich all 48 securities; missing values stay null',
    () async {
      final extracted =
          jsonDecode(File('test/fixtures/bulletin.json').readAsStringSync())
              as Map<String, dynamic>;
      TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
          .setMockMethodCallHandler(
            MarketRepository.pdfChannel,
            (call) async => extracted,
          );
      final r = MarketRepository(
        client: MockClient(
          (request) async => request.url.toString() == bulletinsUrl
              ? http.Response(
                  '<a href="/sites/default/files/boc_20261110.pdf">Bulletin</a>',
                  200,
                )
              : http.Response.bytes(ascii.encode('%PDF-official-fixture'), 200),
        ),
      );
      final m = await r.enrich(officialFixture());
      final sonatel = m.stocks.singleWhere((s) => s.symbol == 'SNTS');
      expect(sonatel.ytd, 53.14);
      expect(sonatel.per, 9.67);
      expect(sonatel.dividend, 174);
      expect(sonatel.previous, 4150);
      expect(m.stocks.singleWhere((s) => s.symbol == 'ETIT').dividend, 0.92);
      expect(m.stocks.singleWhere((s) => s.symbol == 'BBGC').dividend, isNull);
      expect(m.stocks.singleWhere((s) => s.symbol == 'SEMC').ytd, 113.57);
      expect(m.stocks.where((s) => s.sector == 'Non classé'), isEmpty);
      expect(m.bulletin, contains('boc_20261110.pdf'));
      final bad = Map<String, dynamic>.from(extracted);
      (bad['rows']['SNTS'] as Map)['price'] = '99999';
      final r2 = MarketRepository(
        client: MockClient(
          (request) async => request.url.toString() == bulletinsUrl
              ? http.Response(
                  '<a href="/sites/default/files/boc_20261110.pdf">Bulletin</a>',
                  200,
                )
              : http.Response.bytes(ascii.encode('%PDF-official-fixture'), 200),
        ),
      );
      final rejected = await r2.enrich(officialFixture());
      expect(
        rejected.stocks.singleWhere((s) => s.symbol == 'SNTS').per,
        isNull,
      );
      TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
          .setMockMethodCallHandler(MarketRepository.pdfChannel, null);
    },
  );
}
