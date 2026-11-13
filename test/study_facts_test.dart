import 'dart:io';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:bourse_facile_mobile/data/company_facts.dart';
import 'package:bourse_facile_mobile/data/market.dart';
import 'package:bourse_facile_mobile/data/lessons.dart';
import 'package:bourse_facile_mobile/features/study.dart';
import 'package:bourse_facile_mobile/core/theme.dart';
import 'app_test.dart' show app;

Future<void> reach(WidgetTester t, Finder finder) async {
  await t.scrollUntilVisible(
    finder,
    180,
    scrollable: find.byType(Scrollable).last,
  );
  await t.ensureVisible(finder);
  await t.pumpAndSettle();
}

void main() {
  test(
    'Published bulletin links reject outside hosts, invalid and future dates',
    () {
      final links = bulletinLinks('''
      <a href="/sites/default/files/boc_20261111_2_0.pdf">Latest</a>
      <a href="/sites/default/files/boc_20261111_2.pdf">Duplicate</a>
      <a href="https://evil.example/boc_20261111.pdf">Foreign</a>
      <a href="/sites/default/files/boc_20260231.pdf">Invalid date</a>
      <a href="/sites/default/files/boc_20991111.pdf">Future</a>
      <a href="/sites/default/files/boc_20261110.pdf">Previous</a>''');
      expect(links.length, 2);
      expect(links.first.date, DateTime.utc(2026, 11, 11));
      expect(links.first.url, startsWith('https://www.brvm.org/'));
      expect(bulletinNumber('704 1'), isNull);
      expect(bulletinNumber('1 740,00'), 1740);
      expect(bulletinNumber('NS'), isNull);
    },
  );
  test(
    'Reviewed Sonatel statements use parent profit, average parent equity and official split',
    () {
      final json = jsonDecode(
        File('assets/content/annual_observations.json').readAsStringSync(),
      );
      final a = AnnualObservation(Map<String, dynamic>.from(json['SNTS']));
      expect(a.epsAt(DateTime.utc(2026, 10, 25)), 3420);
      expect(a.epsAt(DateTime.utc(2026, 10, 26)), 342);
      expect(
        a.bookValueAt(DateTime.utc(2026, 11, 12)),
        closeTo(1160.715, .0001),
      );
      expect(a.roe, closeTo(30.9320137, .00001));
      expect(a.pbr(4195, DateTime.utc(2026, 11, 12)), closeTo(3.61415, .0001));
      expect(
        issuerKey("BANK OF AFRICA COTE D'IVOIRE"),
        issuerKey('BANK OF AFRICA CI'),
      );
      expect(
        sameIssuer(
          const Stock('BOAB', 'BANK OF AFRICA BENIN', 'FIN', 1, 0),
          'BANK OF AFRICA BN',
        ),
        isTrue,
      );
      expect(
        sameIssuer(
          const Stock('TTLS', 'TOTALENERGIES MARKETING SENEGAL', 'ENE', 1, 0),
          'TOTAL SENEGAL S.A.',
        ),
        isTrue,
      );
      expect(
        sameIssuer(
          const Stock(
            'SDSC',
            'AFRICA GLOBAL LOGISTICS COTE D’IVOIRE',
            'IND',
            1,
            0,
          ),
          'BOLLORE TRANSPORT & LOGISTICS',
        ),
        isTrue,
      );
      expect(json.keys.toList(), ['SNTS']); // No invented coverage.
      const sonatel = Stock('SNTS', 'SONATEL SENEGAL', 'TEL', 4195, .12);
      expect(sameIssuer(sonatel, 'Sonatel SN'), isTrue);
      expect(sameIssuer(sonatel, 'ONATEL BF'), isFalse);
      expect(
        sameIssuer(
          const Stock('BOAB', 'BANK OF AFRICA BENIN', 'FIN', 1, 0),
          'BANK OF AFRICA CI',
        ),
        isFalse,
      );
    },
  );
  testWidgets(
    'Flashcard flip reveals one answer and never completes a lesson',
    (t) async {
      final store = await app(t);
      await t.pumpWidget(MaterialApp(home: StudyPage(store)));
      await t.pumpAndSettle();
      final definition = glossary.first['definition'] as String;
      expect(find.text(definition), findsNothing);
      await reach(t, find.text('Retourner la carte'));
      await t.tap(find.text('Retourner la carte'));
      await t.pumpAndSettle();
      expect(find.text(definition), findsOneWidget);
      expect(store.completed, isEmpty);
      await reach(t, find.text('Je sais expliquer'));
      await t.tap(find.text('Je sais expliquer'));
      await t.pumpAndSettle();
      expect(store.completed, isEmpty);
      await reach(t, find.text('Suivante'));
      await t.tap(find.text('Suivante'));
      await t.pumpAndSettle();
      expect(find.text('Retourner la carte'), findsOneWidget);
      expect(find.text(definition), findsNothing);
      expect(t.takeException(), isNull);
    },
  );
  testWidgets('Flashcards remain usable at 200 percent with reduced motion', (
    t,
  ) async {
    final store = await app(t, width: 320);
    await t.pumpWidget(
      MaterialApp(
        theme: Brand.theme(Brightness.dark),
        builder: (context, child) => MediaQuery(
          data: MediaQuery.of(context).copyWith(
            textScaler: const TextScaler.linear(2),
            disableAnimations: true,
          ),
          child: child!,
        ),
        home: StudyPage(store),
      ),
    );
    await t.pumpAndSettle();
    await reach(t, find.text('Retourner la carte'));
    await t.tap(find.text('Retourner la carte'));
    await t.pumpAndSettle();
    expect(find.text(glossary.first['definition'] as String), findsOneWidget);
    expect(t.takeException(), isNull);
  });
  testWidgets(
    'Quiz reveals explanation and validates only the correct lesson',
    (t) async {
      final store = await app(t);
      await t.pumpWidget(MaterialApp(home: StudyPage(store)));
      await t.pumpAndSettle();
      await t.tap(find.text('Quiz'));
      await t.pumpAndSettle();
      var answer = find.text(
        lessons.first.answers[(lessons.first.correct + 1) %
            lessons.first.answers.length],
      );
      await reach(t, answer);
      await t.tap(answer);
      await reach(t, find.text('Vérifier ma réponse'));
      await t.tap(find.text('Vérifier ma réponse'));
      await t.pumpAndSettle();
      expect(store.completed, isEmpty);
      expect(find.text(lessons.first.explanation), findsOneWidget);
      await reach(t, find.text('Suivante'));
      await t.tap(find.text('Suivante'));
      await t.pumpAndSettle();
      answer = find.text(lessons[1].answers[lessons[1].correct]);
      await reach(t, answer);
      await t.tap(answer);
      await reach(t, find.text('Vérifier ma réponse'));
      await t.tap(find.text('Vérifier ma réponse'));
      await t.pumpAndSettle();
      expect(store.completed, {1});
      expect(t.takeException(), isNull);
    },
  );
}
