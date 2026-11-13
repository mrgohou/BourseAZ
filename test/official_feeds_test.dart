import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:bourse_facile_mobile/data/official_feeds.dart';
import 'package:bourse_facile_mobile/data/market.dart';

String fixture(String name) =>
    File('test/fixtures/official_v002/$name.html').readAsStringSync();
void main() {
  test(
    'Official dividend table provides net amount and two distinct dates, without inventing tax or gross amount',
    () {
      final page = parseDividendNotices(fixture('dividends'));
      expect(page.items, isNotEmpty);
      final d = page.items.first;
      expect(d.issuer, 'BOLLORE TRANSPORT & LOGISTICS');
      expect(d.year, 2025);
      expect(d.netPerShare, 92);
      expect(d.paymentDate, DateTime.utc(2026, 10, 27));
      expect(d.exDate, DateTime.utc(2026, 10, 26));
      expect(d.noticeUrl, contains('20261009'));
      expect(officialUrl(d.noticeUrl), isTrue);
      expect(page.hasNext, isTrue);
    },
  );
  test(
    'A dividend with no official notice, absent amount or nonofficial link is excluded',
    () {
      final original = fixture('dividends');
      final tampered = original.replaceAll(
        'https://www.brvm.org/sites/default/files/',
        'https://attacker.example/',
      );
      expect(parseDividendNotices(tampered).items, isEmpty);
      expect(parseDividendNotices('<p>Source indisponible</p>').items, isEmpty);
    },
  );
  test(
    'Notice publication date comes from table, not a different date in the PDF filename',
    () {
      final d = parseOfficialDocuments(
        fixture('notices'),
        noticesUrl,
      ).items.first;
      expect(d.date, DateTime.utc(2026, 11, 11, 8, 46));
      expect(d.url, contains('20261110'));
      expect(d.title, contains('Radiation'));
    },
  );
  test(
    'Official articles keep their actual titles and never adopt retrieval time as publication date',
    () {
      final p = parseOfficialNews(fixture('news'));
      expect(p.items.first.title, 'RING THE BELL FOR FINANCIAL LITERACY 2026');
      expect(p.items.first.url, contains('ring-bell-financial-literacy-2026'));
      expect(p.items.first.date, isNull);
      expect(p.items.first.summary, contains('8 octobre 2026'));
    },
  );
  test('Tariff dates and superseding documents remain distinct', () {
    final items = parseOfficialDocuments(fixture('tariffs'), tariffsUrl).items;
    expect(items.length, 3);
    expect(items.first.date, DateTime.utc(2019, 5, 23));
    expect(items.last.date, DateTime.utc(2014, 1, 1));
    expect(items.last.title, contains('DC/BR'));
  });
  test('Official holidays retain year and conditional-date markers', () {
    final rows = parseOfficialHolidays(fixture('holidays'));
    expect(rows.first.$1, DateTime.utc(2026, 1, 1));
    expect(
      rows.any((r) => r.$2.contains('susceptible de modification')),
      isTrue,
    );
    expect(rows.every((r) => r.$1.year == 2026), isTrue);
  });
  test(
    'SGI names are read from the official directory, without fabricated ratings or fees',
    () {
      final data = parseOfficialBrokers(fixture('brokers'), sgiUrl);
      expect(data.items.length, 4);
      expect(data.items.first.name, 'ABCO Bourse');
      expect(data.items.first.source, sgiUrl);
      expect(data.items.first.details, contains('contact@abcobourse.com'));
      expect(data.hasNext, isTrue);
    },
  );
}
