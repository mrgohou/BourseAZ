import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:bourse_facile_mobile/core/store.dart';
import 'package:bourse_facile_mobile/data/market.dart';
import 'package:bourse_facile_mobile/data/lessons.dart';
import 'package:bourse_facile_mobile/main.dart';
import 'package:bourse_facile_mobile/features/learning.dart';

Future<AppStore> app(
  WidgetTester t, {
  double width = 390,
  double scale = 1,
  bool empty = false,
}) async {
  t.view.physicalSize = Size(width, 844);
  t.view.devicePixelRatio = 1;
  addTearDown(t.view.resetPhysicalSize);
  addTearDown(t.view.resetDevicePixelRatio);
  SharedPreferences.setMockInitialValues({});
  await t.runAsync(loadAcademy);
  final store = AppStore(
    await SharedPreferences.getInstance(),
    MarketRepository(client: MockClient((_) async => http.Response('', 500))),
  );
  if (!empty) {
    store.market = parseOfficialMarket(
      File('test/fixtures/actions.html').readAsStringSync(),
      File('test/fixtures/home.html').readAsStringSync(),
    );
  }
  addTearDown(store.dispose);
  addTearDown(() async => await t.pumpWidget(const SizedBox.shrink()));
  await t.pumpWidget(
    MediaQuery(
      data: MediaQueryData(textScaler: TextScaler.linear(scale)),
      child: RepaintBoundary(
        key: const Key('capture'),
        child: BourseFacileApp(store),
      ),
    ),
  );
  await t.pumpAndSettle();
  return store;
}

void main() {
  testWidgets('Official dashboard, search, company tabs and document source', (
    t,
  ) async {
    await app(t);
    expect(find.text('512.81'), findsOneWidget);
    await t.tap(find.text('Marché'));
    await t.pumpAndSettle();
    await t.enterText(find.byType(TextField).first, 'SNTS');
    await t.pumpAndSettle();
    await t.scrollUntilVisible(
      find.text('SONATEL SENEGAL'),
      200,
      scrollable: find
          .byWidgetPredicate(
            (w) => w is Scrollable && w.axisDirection == AxisDirection.down,
          )
          .hitTestable()
          .first,
    );
    await t.tap(find.text('SONATEL SENEGAL'));
    await t.pumpAndSettle();
    expect(find.textContaining('FCFA'), findsWidgets);
    expect(find.text('Vue d’ensemble'), findsOneWidget);
    expect(find.text('Finances'), findsOneWidget);
    expect(t.takeException(), isNull);
  });
  testWidgets('Market filters remain usable while collapsed by default', (
    t,
  ) async {
    await app(t);
    await t.tap(find.text('Marché').last);
    await t.pumpAndSettle();
    expect(find.text('Trier les actions'), findsNothing);
    await t.tap(find.text('Filtres et tri'));
    await t.pumpAndSettle();
    expect(find.text('Trier les actions'), findsOneWidget);
    await t.ensureVisible(find.text('Trier les actions'));
    await t.tap(find.byType(DropdownButtonFormField<String>).first);
    await t.pumpAndSettle();
    await t.tap(find.text('Nom').last);
    await t.pumpAndSettle();
    expect(t.takeException(), isNull);
    await t.scrollUntilVisible(
      find.text('Filtres et tri'),
      -150,
      scrollable: find
          .byWidgetPredicate(
            (w) => w is Scrollable && w.axisDirection == AxisDirection.down,
          )
          .hitTestable()
          .first,
    );
    await t.tap(find.text('Filtres et tri'));
    await t.pumpAndSettle();
    expect(find.text('Trier les actions'), findsNothing);
  });
  testWidgets(
    'No mock data while offline; all five destinations remain available',
    (t) async {
      final store = await app(t, empty: true);
      expect(store.market.empty, true);
      expect(find.text('512.81'), findsNothing);
      for (final label in [
        'Marché',
        'Simuler',
        'Apprendre',
        'Mon espace',
        'Accueil',
      ]) {
        await t.tap(
          find
              .descendant(
                of: find.byType(NavigationBar),
                matching: find.byType(NavigationDestination),
              )
              .at(
                const {
                  'Accueil': 0,
                  'Marché': 1,
                  'Simuler': 2,
                  'Apprendre': 3,
                  'Mon espace': 4,
                }[label]!,
              ),
        );
        await t.pumpAndSettle();
        expect(t.takeException(), isNull);
      }
    },
  );
  testWidgets('Small screen and 200 percent text have no layout overflow', (
    t,
  ) async {
    await app(t, width: 320, scale: 2);
    for (final label in [
      'Marché',
      'Simuler',
      'Apprendre',
      'Mon espace',
      'Accueil',
    ]) {
      await t.tap(
        find
            .descendant(
              of: find.byType(NavigationBar),
              matching: find.byType(NavigationDestination),
            )
            .at(
              const {
                'Accueil': 0,
                'Marché': 1,
                'Simuler': 2,
                'Apprendre': 3,
                'Mon espace': 4,
              }[label]!,
            ),
      );
      await t.pumpAndSettle();
      expect(t.takeException(), isNull);
    }
  });
  testWidgets('Academy opens full lesson and shows explained answer', (
    t,
  ) async {
    final store = await app(t);
    await t.tap(find.text('Apprendre'));
    await t.pumpAndSettle();
    await t.scrollUntilVisible(
      find.text('Bienvenue & Qu’est-ce qu’une Action ?'),
      200,
      scrollable: find
          .descendant(
            of: find.byType(LearningPage),
            matching: find.byType(Scrollable),
          )
          .first,
    );
    await t.pumpAndSettle();
    await t.tap(find.text('Bienvenue & Qu’est-ce qu’une Action ?'));
    await t.pumpAndSettle();
    expect(find.byType(SelectableText), findsWidgets);
    final answer = find.text(lessons.first.answers[lessons.first.correct]);
    await t.scrollUntilVisible(
      answer,
      250,
      scrollable: find
          .descendant(
            of: find.byType(LessonPage),
            matching: find.byType(Scrollable),
          )
          .first,
    );
    await t.pumpAndSettle();
    await t.tap(answer);
    await t.pumpAndSettle();
    final button = find.text('Vérifier ma réponse');
    await t.ensureVisible(button);
    await t.pumpAndSettle();
    await t.tap(button);
    await t.pumpAndSettle();
    expect(store.completed, contains(0));
    expect(t.takeException(), isNull);
  });
}
