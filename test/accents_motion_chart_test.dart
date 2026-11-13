import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:bourse_facile_mobile/core/accents.dart';
import 'package:bourse_facile_mobile/core/theme.dart';
import 'package:bourse_facile_mobile/features/design.dart';
import 'package:bourse_facile_mobile/features/motion.dart';
import 'package:bourse_facile_mobile/features/projection_chart.dart';

double contrast(Color a, Color b) {
  final x = a.computeLuminance(), y = b.computeLuminance();
  return ((x > y ? x : y) + .05) / ((x > y ? y : x) + .05);
}

Future<void> show(
  WidgetTester t,
  Widget child, {
  Brightness mode = Brightness.light,
  bool reduced = false,
  double scale = 1,
}) async {
  t.view.physicalSize = const Size(320, 844);
  t.view.devicePixelRatio = 1;
  addTearDown(t.view.resetPhysicalSize);
  addTearDown(t.view.resetDevicePixelRatio);
  await t.pumpWidget(
    MaterialApp(
      theme: Brand.theme(mode),
      locale: const Locale('fr'),
      supportedLocales: const [Locale('fr')],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      builder: (c, child) => MediaQuery(
        data: MediaQuery.of(c).copyWith(
          disableAnimations: reduced,
          textScaler: TextScaler.linear(scale),
        ),
        child: child!,
      ),
      home: Scaffold(
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: child,
        ),
      ),
    ),
  );
  await t.pumpAndSettle();
}

void main() {
  test(
    'All four pastel accents retain text contrast in light and dark themes',
    () {
      for (final mode in Brightness.values) {
        for (final tone in AccentTone.values) {
          expect(
            contrast(
              Accents.inkFor(mode, tone),
              Accents.surfaceFor(mode, tone),
            ),
            greaterThanOrEqualTo(4.5),
            reason: '$mode $tone',
          );
          expect(
            contrast(
              Brand.theme(mode).colorScheme.onSurface,
              Accents.surfaceFor(mode, tone),
            ),
            greaterThanOrEqualTo(4.5),
            reason: '$mode $tone value',
          );
          expect(
            contrast(
              Accents.inkFor(mode, tone),
              Brand.theme(mode).colorScheme.surface,
            ),
            greaterThanOrEqualTo(3),
            reason: '$mode $tone chart',
          );
        }
      }
    },
  );
  test(
    'Projection losses and contributions use the same scale and a true zero baseline',
    () {
      final data = ProjectionPlotData([100, 90], contributed: [100, 150]);
      expect(data.available, isTrue);
      expect(data.maximum, 150);
      expect(data.yAt(90, 160), greaterThan(data.yAt(150, 160)));
      expect(data.yAt(0, 160), 152);
      expect(data.indexAt(data.xAt(1, 200), 200), 1);
      expect(data.indexAt(-1000, 200), 0);
      expect(data.indexAt(1000, 200), 1);
    },
  );
  test(
    'Empty, non-finite, negative or mismatched annual data never become a fictitious curve',
    () {
      for (final data in [
        ProjectionPlotData([]),
        ProjectionPlotData([double.nan]),
        ProjectionPlotData([double.infinity]),
        ProjectionPlotData([-1]),
        ProjectionPlotData([1, 2], contributed: [1]),
      ]) {
        expect(data.available, isFalse);
        expect(data.maximum, 0);
      }
      final zero = ProjectionPlotData([0]);
      expect(zero.available, isTrue);
      expect(zero.yAt(0, 160), 152);
    },
  );
  for (final mode in Brightness.values) {
    testWidgets(
      'Curve, bars and annual selection remain usable at 200 percent text in $mode',
      (t) async {
        await show(
          t,
          const ProjectionChart([100, 90, 80], contributed: [100, 120, 140]),
          mode: mode,
          scale: 2,
        );
        expect(find.text('Année 2 · 80 FCFA'), findsOneWidget);
        await t.tap(find.text('Barres'));
        await t.pumpAndSettle();
        expect(
          t
              .widget<ChoiceChip>(
                find.ancestor(
                  of: find.text('Barres'),
                  matching: find.byType(ChoiceChip),
                ),
              )
              .selected,
          isTrue,
        );
        final slider = find.byType(Slider);
        await t.ensureVisible(slider);
        await t.pumpAndSettle();
        final rect = t.getRect(slider);
        await t.tapAt(Offset(rect.left + 24, rect.center.dy));
        await t.pumpAndSettle();
        expect(find.text('Année 0 · 100 FCFA'), findsOneWidget);
        expect(find.text('Versements bruts : 100 FCFA'), findsOneWidget);
        expect(t.takeException(), isNull);
      },
    );
  }
  testWidgets(
    'Reduced motion keeps press and success feedback immediate without changing the action',
    (t) async {
      var calls = 0;
      await show(
        t,
        ActionTile(
          icon: Icons.menu_book_outlined,
          title: 'Apprendre',
          subtitle: 'À ton rythme',
          tone: AccentTone.blue,
          symbol: FriendlySymbol.book,
          onTap: () => calls++,
        ),
        reduced: true,
      );
      final target = find.byType(ActionTile);
      final before = t.getRect(target);
      final gesture = await t.startGesture(t.getCenter(target));
      await t.pump(const Duration(milliseconds: 100));
      expect(t.widget<AnimatedScale>(find.byType(AnimatedScale)).scale, 1);
      expect(t.getRect(target), before);
      await gesture.up();
      await t.pumpAndSettle();
      expect(calls, 1);
      await show(
        t,
        const FriendlyReveal(success: true, child: Text('Leçon validée')),
        reduced: true,
      );
      expect(find.text('Leçon validée'), findsOneWidget);
      expect(t.binding.transientCallbackCount, 0);
      expect(t.takeException(), isNull);
    },
  );
  testWidgets(
    'Invalid projection shows an unavailable state instead of a chart',
    (t) async {
      await show(t, const ProjectionChart([]));
      expect(find.textContaining('Graphique indisponible'), findsOneWidget);
      expect(find.byType(Slider), findsNothing);
      expect(t.takeException(), isNull);
    },
  );
}
