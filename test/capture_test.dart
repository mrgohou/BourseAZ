import 'dart:convert';
import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:bourse_facile_mobile/features/market_page.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:bourse_facile_mobile/data/market.dart';
import 'app_test.dart' as helper;

Future<void> capture(WidgetTester t, String name) async {
  await t.pumpAndSettle();
  final boundary = t.renderObject<RenderRepaintBoundary>(
    find.byKey(const Key('capture')),
  );
  await t.runAsync(() async {
    final image = await boundary.toImage(pixelRatio: 2);
    final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
    Directory('docs/preview-v2').createSync(recursive: true);
    File(
      'docs/preview-v2/$name.png',
    ).writeAsBytesSync(bytes!.buffer.asUint8List());
    image.dispose();
  });
}

void main() {
  testWidgets('Capture verified official-content mobile screens', (t) async {
    await t.runAsync(() async {
      final root =
          Platform.environment['FLUTTER_ROOT'] ?? '/workspace/flutter-sdk';
      for (final family in ['Ahem', 'Roboto']) {
        final loader = FontLoader(family);
        for (final name in [
          'Roboto-Regular.ttf',
          'Roboto-Bold.ttf',
          'Roboto-Black.ttf',
        ]) {
          loader.addFont(
            Future.value(
              ByteData.sublistView(
                File(
                  '$root/bin/cache/artifacts/material_fonts/$name',
                ).readAsBytesSync(),
              ),
            ),
          );
        }
        await loader.load();
      }
      final icons = FontLoader('MaterialIcons')
        ..addFont(
          Future.value(
            ByteData.sublistView(
              File(
                '$root/bin/cache/artifacts/material_fonts/MaterialIcons-Regular.otf',
              ).readAsBytesSync(),
            ),
          ),
        );
      await icons.load();
    });
    final store = await helper.app(t);
    final parsed = jsonDecode(
      File('test/fixtures/bulletin.json').readAsStringSync(),
    );
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
          MarketRepository.pdfChannel,
          (_) async => parsed,
        );
    final repo = MarketRepository(
      client: MockClient(
        (_) async =>
            http.Response.bytes(ascii.encode('%PDF-official-fixture'), 200),
      ),
    );
    store.market = (await t.runAsync(() => repo.enrich(store.market)))!;
    await store.toggleFavorite('SNTS');
    repo.client.close();
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(MarketRepository.pdfChannel, null);
    await capture(t, 'accueil');
    await t.tap(find.text('Marché'));
    await t.pumpAndSettle();
    await capture(t, 'marche');
    await t.enterText(find.byType(TextField).first, 'SNTS');
    await t.pumpAndSettle();
    final stock = find.text('SONATEL SN');
    await t.scrollUntilVisible(
      stock,
      200,
      scrollable: find
          .descendant(
            of: find.byType(MarketPage),
            matching: find.byType(Scrollable),
          )
          .first,
    );
    await t.pumpAndSettle();
    await t.tap(stock);
    await t.pumpAndSettle();
    await capture(t, 'entreprise');
    await t.tap(find.text('Performance'));
    await t.pumpAndSettle();
    await capture(t, 'performance');
    await t.tap(find.byType(BackButton).last);
    await t.pumpAndSettle();
    await t.tap(find.text('Apprendre'));
    await t.pumpAndSettle();
    await capture(t, 'academie');
  }, skip: !const bool.fromEnvironment('CAPTURE'));
}
