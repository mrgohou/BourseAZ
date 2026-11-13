import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:bourse_facile_mobile/core/store.dart';
import 'package:bourse_facile_mobile/core/theme.dart';
import 'package:bourse_facile_mobile/data/lessons.dart';
import 'package:bourse_facile_mobile/data/market.dart';
import 'package:bourse_facile_mobile/main.dart';

double contrast(Color a, Color b) {
  final x = a.computeLuminance(), y = b.computeLuminance();
  return ((x > y ? x : y) + .05) / ((x > y ? y : x) + .05);
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  test(
    'Financial labels, controls and negative values have AA contrast in both themes',
    () {
      for (final mode in Brightness.values) {
        final s = Brand.theme(mode).colorScheme;
        for (final pair in [
          (s.onSurface, s.surface),
          (s.onSurfaceVariant, s.surface),
          (s.onSurfaceVariant, s.surfaceContainerLow),
          (s.onPrimary, s.primary),
          (s.onPrimaryContainer, s.primaryContainer),
          (s.primary, s.secondaryContainer),
          (s.error, s.errorContainer),
          (Brand.ink, Brand.lime),
        ]) {
          expect(
            contrast(pair.$1, pair.$2),
            greaterThanOrEqualTo(4.5),
            reason: '$mode $pair',
          );
        }
      }
    },
  );
  for (final size in [
    const Size(320, 844),
    const Size(390, 844),
    const Size(844, 390),
  ]) {
    for (final mode in Brightness.values) {
      testWidgets(
        'All destinations fit ${size.width} × ${size.height}, $mode, text 200%',
        (t) async {
          t.view.physicalSize = size;
          t.view.devicePixelRatio = 1;
          addTearDown(t.view.resetPhysicalSize);
          addTearDown(t.view.resetDevicePixelRatio);
          SharedPreferences.setMockInitialValues({});
          await t.runAsync(loadAcademy);
          final store = AppStore(
            await SharedPreferences.getInstance(),
            MarketRepository(
              client: MockClient((_) async => http.Response('', 503)),
            ),
          );
          store.market = parseOfficialMarket(
            File('test/fixtures/actions.html').readAsStringSync(),
            File('test/fixtures/home.html').readAsStringSync(),
          );
          await t.pumpWidget(
            MaterialApp(
              theme: Brand.theme(mode),
              locale: const Locale('fr'),
              supportedLocales: const [Locale('fr')],
              localizationsDelegates: GlobalMaterialLocalizations.delegates,
              builder: (c, child) => MediaQuery(
                data: MediaQuery.of(c).copyWith(
                  textScaler: TextScaler.linear(2),
                  disableAnimations: true,
                ),
                child: child!,
              ),
              home: AppShell(store),
            ),
          );
          await t.pumpAndSettle();
          expect(
            t.widget<Icon>(find.byIcon(Icons.stacked_line_chart_rounded)).color,
            Brand.theme(mode).colorScheme.onPrimaryContainer,
          );
          for (final label in [
            'Accueil',
            'Marché',
            'Simuler',
            'Apprendre',
            'Mon espace',
          ]) {
            final nav = find
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
                );
            await t.tap(nav);
            await t.pumpAndSettle();
            expect(t.takeException(), isNull, reason: label);
            // Review the full page, not only the first viewport.
            final lists = find.byType(ListView).hitTestable();
            if (lists.evaluate().isNotEmpty) {
              await t.drag(lists.first, Offset(0, -size.height * 4));
              await t.pumpAndSettle();
              expect(t.takeException(), isNull, reason: '$label after scroll');
            }
          }
          await t.pumpWidget(const SizedBox.shrink());
          store.dispose();
        },
      );
    }
  }
}
