import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../data/market.dart';
import '../data/lessons.dart';
import 'simulation.dart';

class AppStore extends ChangeNotifier {
  final SharedPreferences preferences;
  final MarketRepository repository;
  static const _key = 'bourse_mobile_v2';
  AppStore(this.preferences, this.repository);
  MarketSnapshot market = emptyMarket;
  Set<String> favorites = {};
  Set<int> completed = {};
  List<Projection> saved = [];
  List<Map<String, dynamic>> holdings = [];
  List<Map<String, dynamic>> alerts = [];
  ThemeMode themeMode = ThemeMode.system;
  bool refreshing = false;
  bool offline = false;
  String? message;
  DateTime? _lastAttempt;
  Future<void> _writes = Future.value();
  bool _disposed = false;
  bool get configured => true;
  bool get stale =>
      !market.empty &&
      DateTime.now().toUtc().difference(market.asOf) >
          const Duration(hours: 24);
  void _emit() {
    if (!_disposed) notifyListeners();
  }

  void restore() {
    try {
      final current = preferences.getString(_key);
      final raw = current ?? preferences.getString('bourse_mobile_v1');
      if (raw == null) return;
      final data = jsonDecode(raw) as Map<String, dynamic>;
      if (current == null) {
        data['market'] = null;
        data['completed'] = [];
        data['favorites'] ??= [];
        data['saved'] ??= [];
      }
      holdings = ((data['holdings'] as List?) ?? [])
          .map((h) => Map<String, dynamic>.from(h))
          .toList();
      alerts = ((data['alerts'] as List?) ?? [])
          .map((h) => Map<String, dynamic>.from(h))
          .toList();
      favorites = (data['favorites'] as List).cast<String>().toSet();
      completed = (data['completed'] as List)
          .cast<int>()
          .where((i) => i >= 0 && i < lessons.length)
          .toSet();
      saved = (data['saved'] as List)
          .take(20)
          .map((j) => Projection.fromJson(j as Map<String, dynamic>))
          .toList();
      themeMode = ThemeMode.values.firstWhere(
        (m) => m.name == data['theme'],
        orElse: () => ThemeMode.system,
      );
      if (data['market'] != null) {
        market = MarketSnapshot.fromJson(
          data['market'] as Map<String, dynamic>,
        );
      }
    } catch (_) {
      message =
          'La sauvegarde locale est illisible. Tu peux réinitialiser les données dans les réglages.';
    }
  }

  Future<bool> _persist() async {
    final value = jsonEncode({
      'holdings': holdings,
      'alerts': alerts,
      'favorites': favorites.toList(),
      'completed': completed.toList(),
      'saved': saved.map((p) => p.toJson()).toList(),
      'theme': themeMode.name,
      'market': market.empty ? null : market.toJson(),
    });
    bool ok = false;
    _writes = _writes.then((_) async {
      try {
        ok = await preferences.setString(_key, value);
      } catch (_) {
        ok = false;
      }
      if (!ok) {
        message =
            'Sauvegarde impossible sur cet appareil. Les changements restent en mémoire.';
      }
    });
    await _writes;
    _emit();
    return ok;
  }

  Future<bool> addHolding(String symbol, int quantity, double cost) {
    if (quantity <= 0 ||
        quantity > 100000000 ||
        !cost.isFinite ||
        cost <= 0 ||
        cost > 1e10) {
      return Future.value(false);
    }
    holdings.add({'symbol': symbol, 'quantity': quantity, 'cost': cost});
    _emit();
    return _persist();
  }

  Future<bool> removeHolding(int i) {
    holdings.removeAt(i);
    _emit();
    return _persist();
  }

  Future<bool> addAlert(String symbol, double target, bool above) {
    if (!target.isFinite || target <= 0 || alerts.length >= 50) {
      return Future.value(false);
    }
    alerts.add({'symbol': symbol, 'target': target, 'above': above});
    _emit();
    return _persist();
  }

  Future<bool> removeAlert(int i) {
    alerts.removeAt(i);
    _emit();
    return _persist();
  }

  Future<bool> toggleFavorite(String symbol) {
    favorites.contains(symbol)
        ? favorites.remove(symbol)
        : favorites.add(symbol);
    _emit();
    return _persist();
  }

  Future<bool> complete(int lesson) {
    completed.add(lesson);
    _emit();
    return _persist();
  }

  Future<bool> save(Projection projection) {
    saved.insert(0, projection);
    if (saved.length > 20) saved.removeLast();
    _emit();
    return _persist();
  }

  Future<bool> removeSaved(int index) {
    saved.removeAt(index);
    _emit();
    return _persist();
  }

  Future<bool> setTheme(ThemeMode value) {
    themeMode = value;
    _emit();
    return _persist();
  }

  Future<bool> reset() async {
    await _writes;
    try {
      if (!await preferences.remove(_key)) throw StateError('Storage');
      holdings = [];
      alerts = [];
      favorites = {};
      completed = {};
      saved = [];
      themeMode = ThemeMode.system;
      market = emptyMarket;
      message = null;
      _emit();
      return true;
    } catch (_) {
      message = 'Effacement impossible. Réessaie depuis les réglages.';
      _emit();
      return false;
    }
  }

  Future<void> refresh() async {
    if (!configured || refreshing) return;
    if (_lastAttempt != null &&
        DateTime.now().difference(_lastAttempt!) <
            const Duration(seconds: 30)) {
      return;
    }
    _lastAttempt = DateTime.now();
    refreshing = true;
    _emit();
    try {
      market = await repository.load();
      offline = false;
      message = null;
      await _persist();
      try {
        market = await repository.enrich(market);
        await _persist();
      } catch (_) {
        message =
            'Cours officiels chargés. Les indicateurs du bulletin sont momentanément indisponibles.';
      }
    } catch (_) {
      offline = true;
      message = market.empty
          ? 'Marché indisponible. Aucun cours fictif ne sera affiché. Réessaie avec une connexion.'
          : 'Connexion indisponible. Les derniers cours reçus restent affichés avec leur date.';
    } finally {
      refreshing = false;
      _emit();
    }
  }

  @override
  void dispose() {
    _disposed = true;
    repository.client.close();
    super.dispose();
  }
}
