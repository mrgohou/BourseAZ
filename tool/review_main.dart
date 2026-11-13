// Screenshot-only entry point. Reuses production screens; never included in APK.
import 'package:bourse_facile_mobile/account/account_controller.dart';
import 'package:bourse_facile_mobile/account/auth_gateway.dart';
import 'package:bourse_facile_mobile/features/official_updates.dart';
import 'package:bourse_facile_mobile/portfolio/broker_profile_page.dart';
import 'package:bourse_facile_mobile/portfolio/portfolio_scenario_page.dart';
import 'package:bourse_facile_mobile/account/account_page.dart';
import 'package:bourse_facile_mobile/portfolio/portfolio_controller.dart';
import 'package:bourse_facile_mobile/portfolio/portfolio_page.dart';
import 'package:bourse_facile_mobile/portfolio/add_purchase_page.dart';
import 'package:bourse_facile_mobile/portfolio/purchase.dart';
import '../test/support/accounts.dart';
import 'dart:async';
import 'dart:convert';
import 'dart:js_interop';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:bourse_facile_mobile/main.dart' show AppShell;
import 'package:bourse_facile_mobile/core/store.dart';
import 'package:bourse_facile_mobile/core/theme.dart';
import 'package:bourse_facile_mobile/data/market.dart';
import 'package:bourse_facile_mobile/data/lessons.dart';
import 'package:bourse_facile_mobile/features/company.dart';
import 'package:bourse_facile_mobile/features/market_page.dart';
import 'package:bourse_facile_mobile/features/learning.dart';
import 'package:bourse_facile_mobile/features/study.dart';
import 'package:bourse_facile_mobile/features/official.dart';
import 'package:bourse_facile_mobile/features/settings.dart';
import 'package:bourse_facile_mobile/features/workspace.dart';

class ReviewCancelledGoogle extends FakeAuthGateway {
  @override
  Future<AccountSession> googleSignIn() async => throw const AccountCancelled();
}

@JS('reviewCommand')
external set reviewCommand(JSFunction callback);
@JS('reviewReady')
external set reviewReady(JSBoolean ready);
final navigator = GlobalKey<NavigatorState>();
late AppStore store;
late AccountController reviewAccount;
late PortfolioController reviewPortfolio;
Widget reviewRoot(Widget child) => AccountScope(
  controller: reviewAccount,
  child: PortfolioScope(controller: reviewPortfolio, child: child),
);
String scope = 'HomePage';
final originalTitles = <String, String>{};

class ReviewRepository extends MarketRepository {
  ReviewRepository() : super(client: http.Client());
  @override
  Future<List<int>> download(String url, int max) async {
    if (Uri.base.queryParameters['fail'] == 'documents' &&
        url.contains('rapports-societe-cotes')) {
      throw const FormatException('Indisponible');
    }
    final response = await client.get(
      Uri.base.resolve('/review-source').replace(queryParameters: {'url': url}),
    );
    if (response.statusCode != 200) {
      throw const FormatException('Publication indisponible');
    }
    return response.bodyBytes;
  }

  @override
  Future<Map<String, dynamic>> readPdf(String url) async {
    if (Uri.base.queryParameters['fail'] == 'pdf' && !url.contains('/BOC_')) {
      throw const FormatException('Indisponible');
    }
    final response = await client.get(
      Uri.base.resolve('/review-pdf').replace(queryParameters: {'url': url}),
    );
    if (response.statusCode != 200) {
      throw const FormatException('Lecture indisponible');
    }
    return Map<String, dynamic>.from(
      jsonDecode(utf8.decode(response.bodyBytes)),
    );
  }
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await loadAcademy();
  for (final font in ['Regular', 'Bold', 'Medium', 'Black']) {
    final bytes = await http.readBytes(
      Uri.base.resolve('/review-font/Roboto-$font.ttf'),
    );
    final loader = FontLoader('Roboto')
      ..addFont(Future.value(ByteData.sublistView(bytes)));
    await loader.load();
  }
  final prefs = await SharedPreferences.getInstance();
  await prefs.clear();
  store = AppStore(prefs, ReviewRepository());
  final scenario = Uri.base.queryParameters['scenario'] ?? 'home';
  if (scenario != 'offline-empty') {
    store.market = await store.repository.load();
    try {
      if (Uri.base.queryParameters['skipBulletin'] != '1') {
        store.market = await store.repository.enrich(store.market);
      }
    } catch (_) {
      store.message =
          'Cours officiels chargés. Les indicateurs du bulletin sont momentanément indisponibles.';
    }
  }
  if (scenario == 'offline-empty') {
    store.offline = true;
    store.message =
        'Marché indisponible. Aucun cours fictif ne sera affiché. Réessaie avec une connexion.';
  }
  if (scenario == 'offline-cache') {
    store.offline = true;
    store.message =
        'Connexion indisponible. Les derniers cours reçus restent affichés avec leur date.';
  }
  if (scenario == 'home-following' || scenario == 'market-favorites') {
    await store.toggleFavorite('SNTS');
    await store.toggleFavorite('ORAC');
  }
  final vault = MemoryVault();
  final gateway =
      (scenario == 'account-google-return'
            ? ReviewCancelledGoogle()
            : FakeAuthGateway())
        ..uid = 'compte-revue'
        ..verified = scenario != 'account-verify';
  reviewAccount = AccountController(
    gateway: gateway,
    vault: vault,
    preferences: prefs,
  );
  await reviewAccount.restore();
  if ((scenario.startsWith('portfolio') && scenario != 'portfolio-locked') ||
      scenario == 'purchase' ||
      scenario == 'account-verify' ||
      scenario == 'account-connected' ||
      scenario == 'broker-profile') {
    await reviewAccount.googleSignIn();
  }
  reviewPortfolio = PortfolioController(account: reviewAccount, vault: vault);
  if (reviewAccount.portfolioAllowed) await reviewPortfolio.load();
  if (scenario == 'account-google-return') await reviewAccount.googleSignIn();
  if (scenario == 'portfolio-filled' || scenario == 'portfolio-scenario') {
    for (final row in [
      ('SNTS', 10, 350000),
      ('SNTS', 5, 420000),
      ('ORAC', 2, 2100000),
    ]) {
      final stock = store.market.stocks.firstWhere((s) => s.symbol == row.$1);
      await reviewPortfolio.add(
        PurchaseEntry(
          id: PurchaseEntry.newId(),
          symbol: stock.symbol,
          companyName: stock.name,
          quantity: row.$2,
          unitPriceMinor: row.$3,
          recordedAt: DateTime.now().toUtc(),
        ),
      );
    }
  }
  if (scenario == 'alerts-filled') {
    await store.addAlert('SNTS', 3900, true);
    await store.addAlert('ORAC', 25000, true);
  }
  if (scenario == 'academy-progress') {
    for (final i in [0, 1, 2, 3, 4]) {
      await store.complete(i);
    }
  }
  if (Uri.base.queryParameters['theme'] == 'dark') {
    store.themeMode = ThemeMode.dark;
  }
  runApp(
    reviewRoot(
      ListenableBuilder(
        listenable: store,
        builder: (context, _) => MaterialApp(
          navigatorKey: navigator,
          title: 'Bourse Facile · revue des écrans',
          debugShowCheckedModeBanner: false,
          theme: Brand.theme(Brightness.light),
          darkTheme: Brand.theme(Brightness.dark),
          themeMode: store.themeMode,
          locale: const Locale('fr'),
          supportedLocales: const [Locale('fr')],
          localizationsDelegates: GlobalMaterialLocalizations.delegates,
          builder: (context, child) => MediaQuery(
            data: MediaQuery.of(context).copyWith(
              textScaler: TextScaler.linear(
                double.tryParse(Uri.base.queryParameters['scale'] ?? '1') ?? 1,
              ),
            ),
            child: child!,
          ),
          home: AppShell(store),
        ),
      ),
    ),
  );
  await WidgetsBinding.instance.endOfFrame;
  await navigate(scenario);
  reviewCommand = ((JSString input) => command(
    jsonDecode(input.toDart) as Map<String, dynamic>,
  ).then((value) => jsonEncode(value).toJS).toJS).toJS;
  reviewReady = true.toJS;
}

List<Element> elements({String? within}) {
  final all = <Element>[];
  void visit(Element e) {
    all.add(e);
    e.visitChildElements(visit);
  }

  final root = WidgetsBinding.instance.rootElement;
  if (root == null) return all;
  visit(root);
  final target = within ?? scope;
  final roots = all
      .where((e) => e.widget.runtimeType.toString() == target)
      .toList();
  if (roots.isEmpty) return all;
  all.clear();
  visit(roots.last);
  return all;
}

Future<void> tab(int index) async {
  final all = elements(within: 'AppShell');
  final nav = all.map((e) => e.widget).whereType<NavigationBar>().first;
  nav.onDestinationSelected!(index);
  scope = [
    'HomePage',
    'MarketPage',
    'SimulatorPage',
    'LearningPage',
    'WorkspacePage',
  ][index];
  await frame();
}

Future<void> frame() async {
  await Future<void>.delayed(const Duration(milliseconds: 100));
  await WidgetsBinding.instance.endOfFrame;
}

Future<void> navigate(String route) async {
  if (route == 'home' ||
      route == 'home-following' ||
      route.startsWith('offline')) {
    await tab(0);
    return;
  }
  if (route.startsWith('market')) {
    await tab(1);
    return;
  }
  if (route == 'simulation') {
    await tab(2);
    return;
  }
  if (route.startsWith('academy')) {
    await tab(3);
    return;
  }
  if (route == 'workspace') {
    await tab(4);
    return;
  }
  final stock = store.market.stocks.firstWhere((s) => s.symbol == 'SNTS');
  Widget page;
  if (route == 'company') {
    page = CompanyPage(Uri.base.queryParameters['symbol'] ?? 'SNTS', store);
  } else if (route == 'comparison')
    page = ComparisonPage(store, ['SNTS', 'ORAC', 'ETIT', 'SGBC']);
  else if (route == 'dividends')
    page = DividendsPage(store);
  else if (route == 'official-news')
    page = OfficialFeedPage(store, OfficialFeedKind.news);
  else if (route == 'official-calendar')
    page = OfficialCalendarPage(store);
  else if (route == 'official-dividends')
    page = DividendCalendarPage(store);
  else if (route == 'official-holidays')
    page = OfficialHolidaysPage(store);
  else if (route == 'official-tariffs')
    page = OfficialFeedPage(store, OfficialFeedKind.tariffs);
  else if (route == 'activity-reports')
    page = ActivityReportsPage(store);
  else if (route == 'broker-profile')
    page = BrokerProfilePage(store, reviewPortfolio);
  else if (route == 'portfolio-scenario')
    page = PortfolioScenarioPage(store, reviewPortfolio);
  else if (route == 'publications')
    page = PublicationsPage(store);
  else if (route == 'archive')
    page = ArchivePage(store, stock);
  else if (route == 'study')
    page = StudyPage(store);
  else if (route == 'glossary')
    page = const GlossaryPage();
  else if (route == 'fees')
    page = const FeePage();
  else if (route == 'risk')
    page = const RiskProfilePage();
  else if (route == 'sgi')
    page = SgiPage(store);
  else if (route.startsWith('account-'))
    page = AccountPage(reviewAccount, store: store);
  else if (route == 'purchase')
    page = AddPurchasePage(store, reviewPortfolio);
  else if (route == 'settings')
    page = SettingsPage(store);
  else if (route.startsWith('portfolio'))
    page = PortfolioPage(store);
  else if (route.startsWith('alerts'))
    page = PersonalPage(store, true);
  else if (route.startsWith('lesson-'))
    page = LessonPage(int.parse(route.substring(7)), store);
  else if (route == 'report') {
    final docs = await store.repository.documents('SNTS');
    page = ReportReader(docs.firstWhere((d) => d.url.endsWith('.pdf')), store);
  } else
    throw StateError('Unknown review route: $route');
  scope = page.runtimeType.toString();
  navigator.currentState!.push(MaterialPageRoute<void>(builder: (_) => page));
  await frame();
}

String textOf(Widget? w) {
  if (w is Text) return w.data ?? w.textSpan?.toPlainText() ?? '';
  return '';
}

List<ScrollableState> scrollers({String? within}) => elements(within: within)
    .whereType<StatefulElement>()
    .map((e) => e.state)
    .whereType<ScrollableState>()
    .where((s) => s.position.axis == Axis.vertical)
    .toList();
Future<Map<String, dynamic>> command(Map<String, dynamic> j) async {
  try {
    return await dispatch(j);
  } catch (e) {
    return {'error': e.toString(), 'scope': scope};
  }
}

Future<Map<String, dynamic>> dispatch(Map<String, dynamic> j) async {
  final action = j['action'];
  final within = j['scope'] as String?;
  if (action == 'tab') {
    await tab(j['index']);
    return {'ok': true};
  }
  if (action == 'field') {
    final fields = elements(within: within)
        .where(
          (e) =>
              e.widget is TextField &&
              (j['label'] == null ||
                  (e.widget as TextField).decoration?.labelText == j['label']),
        )
        .toList();
    final target = fields[(j['index'] as int?) ?? 0];
    final field = target.widget as TextField;
    TextEditingController? controller = field.controller;
    void findEditable(Element e) {
      if (e.widget is EditableText) {
        controller = (e.widget as EditableText).controller;
      }
      e.visitChildElements(findEditable);
    }

    if (controller == null) target.visitChildElements(findEditable);
    final value = j['value'] as String;
    controller!.text = value;
    field.onChanged?.call(value);
    field.focusNode?.unfocus();
  } else if (action == 'chip') {
    final chips = elements(within: within)
        .map((e) => e.widget)
        .whereType<ChoiceChip>()
        .where((w) => textOf(w.label) == j['label'])
        .toList();
    if (chips.isNotEmpty) {
      chips.first.onSelected?.call(true);
    } else {
      final f = elements(within: within)
          .map((e) => e.widget)
          .whereType<FilterChip>()
          .firstWhere((w) => textOf(w.label) == j['label']);
      f.onSelected?.call(!f.selected);
    }
  } else if (action == 'radio') {
    final groups = elements(
      within: within,
    ).map((e) => e.widget).whereType<RadioGroup<int>>().toList();
    groups[(j['index'] as int?) ?? 0].onChanged(j['value']);
  } else if (action == 'theme') {
    await store.setTheme(
      j['value'] == 'dark' ? ThemeMode.dark : ThemeMode.light,
    );
  } else if (action == 'slider') {
    final sliders = elements(
      within: within,
    ).map((e) => e.widget).whereType<Slider>().toList();
    sliders[j['index']].onChanged?.call((j['value'] as num).toDouble());
  } else if (action == 'button') {
    Element? text;
    for (final e in elements(within: within)) {
      if (e.widget is Text && textOf(e.widget) == j['label']) {
        text = e;
        break;
      }
    }
    if (text == null) throw StateError('Button text not found: ${j['label']}');
    ButtonStyleButton? button;
    text.visitAncestorElements((e) {
      if (e.widget is ButtonStyleButton) {
        button = e.widget as ButtonStyleButton;
        return false;
      }
      return true;
    });
    if (button == null || button!.onPressed == null) {
      throw StateError('No enabled button for ${j['label']}');
    }
    button!.onPressed!();
  } else if (action == 'dropdown') {
    final fields = elements(within: within)
        .whereType<StatefulElement>()
        .where(
          (e) => j['boolean'] == true
              ? e.widget is DropdownButtonFormField<bool>
              : e.widget is DropdownButtonFormField<String>,
        )
        .toList();
    if (j['boolean'] == true) {
      (fields[(j['index'] as int?) ?? 0].state as FormFieldState<bool>)
          .didChange(j['value'] as bool);
    } else {
      (fields[(j['index'] as int?) ?? 0].state as FormFieldState<String>)
          .didChange(j['value'] as String);
    }
  } else if (action == 'check') {
    final w = elements(within: within)
        .map((e) => e.widget)
        .whereType<Checkbox>()
        .firstWhere((w) => w.semanticLabel == j['label']);
    w.onChanged?.call(!(w.value ?? false));
  } else if (action == 'icon') {
    final matches = elements(within: within)
        .map((e) => e.widget)
        .whereType<IconButton>()
        .where((w) => w.tooltip == j['label'])
        .toList();
    matches[(j['index'] as int?) ?? 0].onPressed?.call();
  } else if (action == 'listtile') {
    final w = elements(within: within)
        .map((e) => e.widget)
        .whereType<ListTile>()
        .firstWhere((w) => textOf(w.title) == j['label']);
    w.onTap?.call();
  } else if (action == 'expand') {
    for (final w in elements(
      within: within,
    ).map((e) => e.widget).whereType<Expansible>()) {
      w.controller.expand();
    }
  } else if (action == 'taptext') {
    final e = elements(
      within: within,
    ).firstWhere((e) => textOf(e.widget) == j['label']);
    VoidCallback? callback;
    e.visitAncestorElements((a) {
      final w = a.widget;
      if (w is InkResponse && w.onTap != null) {
        callback = w.onTap;
        return false;
      }
      if (w is GestureDetector && w.onTap != null) {
        callback = w.onTap;
        return false;
      }
      return true;
    });
    if (callback == null) throw StateError('No tap handler');
    callback!();
  } else if (action == 'scrollX') {
    final ss = elements(within: within)
        .whereType<StatefulElement>()
        .map((e) => e.state)
        .whereType<ScrollableState>()
        .where((s) => s.position.axis == Axis.horizontal)
        .toList();
    ss.first.position.jumpTo(
      j['end'] == true ? ss.first.position.maxScrollExtent : 0,
    );
  } else if (action == 'scroll') {
    final s = scrollers(within: within).first;
    s.position.jumpTo(
      j['bottom'] == true
          ? s.position.maxScrollExtent
          : (j['pixels'] as num).toDouble().clamp(
              s.position.minScrollExtent,
              s.position.maxScrollExtent,
            ),
    );
  } else if (action == 'metrics') {
    final ss = scrollers(within: within);
    if (ss.isEmpty) return {'scope': scope, 'scroll': false};
    final s = ss.first;
    double extent = 0;
    void inspect(RenderObject r) {
      if (r is RenderSliverPadding && r.geometry != null) {
        if (r.geometry!.scrollExtent > extent) {
          extent = r.geometry!.scrollExtent;
        }
      }
      r.visitChildren(inspect);
    }

    s.context.findRenderObject()?.visitChildren(inspect);
    return {
      'scope': scope,
      'pixels': s.position.pixels,
      'max': s.position.maxScrollExtent,
      'viewport': s.position.viewportDimension,
      'content': extent,
    };
  } else if (action == 'describe') {
    return {
      'scope': scope,
      'busy': elements(within: within).any(
        (e) =>
            e.widget is CircularProgressIndicator &&
            (e.widget as CircularProgressIndicator).value == null,
      ),
      'texts': elements(
        within: within,
      ).where((e) => e.widget is Text).map((e) => textOf(e.widget)).toList(),
      'fields': elements(within: within)
          .map((e) => e.widget)
          .whereType<TextField>()
          .map((w) => w.decoration?.labelText)
          .toList(),
    };
  } else if (action == 'back') {
    navigator.currentState!.pop();
    scope = 'WorkspacePage';
  } else
    throw StateError('Unknown action: $action');
  await frame();
  return {'ok': true, 'scope': scope};
}
