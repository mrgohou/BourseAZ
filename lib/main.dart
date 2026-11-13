import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import 'core/store.dart';
import 'core/theme.dart';
import 'core/accents.dart';
import 'data/market.dart';
import 'data/lessons.dart';
import 'features/home.dart';
import 'features/market_page.dart';
import 'features/simulator.dart';
import 'features/learning.dart';
import 'features/settings.dart';
import 'features/workspace.dart';
import 'account/account_controller.dart';
import 'account/account_page.dart';
import 'account/auth_gateway.dart';
import 'account/secure_vault.dart';
import 'portfolio/portfolio_controller.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await loadAcademy();
    final preferences = await SharedPreferences.getInstance();
    final store = AppStore(
      preferences,
      MarketRepository(
        client: http.Client(),
        endpoint: const String.fromEnvironment('MARKET_API_URL'),
      ),
    );
    store.restore();
    final vault = DeviceSecureVault();
    final account = AccountController(
      gateway: FirebaseAccountGateway(),
      vault: vault,
      preferences: preferences,
    );
    final portfolio = PortfolioController(account: account, vault: vault);
    runApp(
      AccountScope(
        controller: account,
        child: PortfolioScope(
          controller: portfolio,
          child: BourseFacileApp(store),
        ),
      ),
    );
    unawaited(account.restore());
    unawaited(store.refresh());
  } catch (_) {
    runApp(
      MaterialApp(
        theme: Brand.theme(Brightness.light),
        home: Scaffold(
          body: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.storage_outlined, size: 48),
                    const SizedBox(height: 24),
                    const Text(
                      'Le stockage de cet appareil est indisponible. Libère de l’espace puis relance Bourse Facile.',
                    ),
                    const SizedBox(height: 24),
                    FilledButton(
                      onPressed: main,
                      child: const Text('Réessayer'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class BourseFacileApp extends StatelessWidget {
  final AppStore store;
  const BourseFacileApp(this.store, {super.key});
  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: store,
    builder: (context, _) => MaterialApp(
      title: 'Bourse Facile',
      debugShowCheckedModeBanner: false,
      theme: Brand.theme(Brightness.light),
      darkTheme: Brand.theme(Brightness.dark),
      themeMode: store.themeMode,
      locale: const Locale('fr'),
      supportedLocales: const [Locale('fr')],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      home: AppShell(store),
    ),
  );
}

class AppShell extends StatefulWidget {
  final AppStore store;
  const AppShell(this.store, {super.key});
  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> with WidgetsBindingObserver {
  int index = 0;
  Timer? _refreshTimer;
  bool _active = true;
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _refreshTimer = Timer.periodic(
      Duration(seconds: 900 + Random().nextInt(45)),
      (_) {
        if (_active) unawaited(widget.store.refresh());
      },
    );
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    _active = state == AppLifecycleState.resumed;
    if (state == AppLifecycleState.resumed) unawaited(widget.store.refresh());
  }

  @override
  Widget build(BuildContext context) {
    final store = widget.store;
    final largeLabels = MediaQuery.textScalerOf(context).scale(16) > 23;
    return PopScope(
      canPop: index == 0,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) setState(() => index = 0);
      },
      child: Scaffold(
        appBar: AppBar(
          titleSpacing: 20,
          toolbarHeight: MediaQuery.textScalerOf(context).scale(16) > 23
              ? 96
              : 72,
          title: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primaryContainer,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  Icons.stacked_line_chart_rounded,
                  color: Theme.of(context).colorScheme.onPrimaryContainer,
                  size: 22,
                ),
              ),
              const SizedBox(width: 10),
              Flexible(
                child: Text(
                  largeLabels && MediaQuery.sizeOf(context).width < 360
                      ? 'bourse\nfacile'
                      : 'bourse facile',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    letterSpacing: -.6,
                  ),
                ),
              ),
            ],
          ),
          actions: [
            if (AccountScope.maybeOf(context) != null)
              IconButton.filledTonal(
                tooltip: 'Mon compte',
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute<void>(
                    builder: (_) => AccountPage(
                      AccountScope.maybeOf(context)!,
                      store: store,
                    ),
                  ),
                ),
                icon: const Icon(Icons.person_outline_rounded),
              ),
            const SizedBox(width: 4),
            IconButton(
              tooltip: 'Préférences et confidentialité',
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute<void>(builder: (_) => SettingsPage(store)),
              ),
              icon: const Icon(Icons.tune_rounded),
            ),
            const SizedBox(width: 12),
          ],
        ),
        body: SafeArea(
          top: false,
          child: Column(
            children: [
              if (store.refreshing) const LinearProgressIndicator(minHeight: 2),
              if (store.message != null)
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 8,
                  ),
                  child: Semantics(
                    liveRegion: true,
                    child: Text(
                      store.message!,
                      style: const TextStyle(fontSize: 12),
                    ),
                  ),
                ),
              Expanded(
                child: IndexedStack(
                  index: index,
                  children: [
                    HomePage(store, (v) => setState(() => index = v)),
                    MarketPage(store),
                    SimulatorPage(store),
                    LearningPage(store),
                    WorkspacePage(store),
                  ],
                ),
              ),
            ],
          ),
        ),
        bottomNavigationBar: SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
            child: DecoratedBox(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(26),
                border: Border.all(
                  color: Theme.of(context).colorScheme.outlineVariant,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Theme.of(context).shadowColor.withValues(alpha: .04),
                    blurRadius: 20,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(26),
                child: NavigationBar(
                  labelBehavior: largeLabels
                      ? NavigationDestinationLabelBehavior.onlyShowSelected
                      : NavigationDestinationLabelBehavior.alwaysShow,
                  indicatorColor: index == 0
                      ? null
                      : Accents.surface(
                          context,
                          [
                            AccentTone.blue,
                            AccentTone.blue,
                            AccentTone.pink,
                            AccentTone.yellow,
                            AccentTone.brown,
                          ][index],
                        ),
                  selectedIndex: index,
                  onDestinationSelected: (v) => setState(() => index = v),
                  destinations: [
                    const NavigationDestination(
                      icon: Icon(Icons.home_outlined),
                      selectedIcon: Icon(Icons.home_rounded),
                      label: 'Accueil',
                    ),
                    const NavigationDestination(
                      icon: Icon(Icons.candlestick_chart_outlined),
                      selectedIcon: Icon(Icons.candlestick_chart),
                      label: 'Marché',
                    ),
                    const NavigationDestination(
                      icon: Icon(Icons.auto_graph_outlined),
                      selectedIcon: Icon(Icons.auto_graph),
                      label: 'Simuler',
                    ),
                    NavigationDestination(
                      icon: const Icon(Icons.school_outlined),
                      selectedIcon: const Icon(Icons.school),
                      label: largeLabels ? 'Cours' : 'Apprendre',
                      tooltip: 'Apprendre',
                    ),
                    NavigationDestination(
                      icon: const Icon(Icons.grid_view_outlined),
                      selectedIcon: const Icon(Icons.grid_view_rounded),
                      label: largeLabels ? 'Moi' : 'Mon espace',
                      tooltip: 'Mon espace',
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
