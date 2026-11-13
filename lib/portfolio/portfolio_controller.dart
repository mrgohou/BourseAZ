import 'dart:convert';
import 'package:flutter/material.dart';
import '../account/account_controller.dart';
import '../account/secure_vault.dart';
import 'purchase.dart';
import 'broker_selection.dart';

class PortfolioController extends ChangeNotifier {
  final AccountController account;
  final SecureVault vault;
  List<PurchaseEntry> _entries = [];
  String? _uid;
  BrokerSelection? _broker;
  BrokerSelection? get broker =>
      _uid == account.identity?.uid && account.portfolioAllowed
      ? _broker
      : null;
  bool loading = false, saving = false;
  String? error;
  int _epoch = 0;
  bool _disposed = false;
  bool _unreadable = false;
  Future<void> _writes = Future.value();
  PortfolioController({required this.account, required this.vault}) {
    account.addListener(_accountChanged);
    _accountChanged();
  }
  List<PurchaseEntry> get entries =>
      _uid == account.identity?.uid && account.portfolioAllowed
      ? List.unmodifiable(_entries)
      : const [];
  bool get canEdit =>
      _uid != null &&
      account.portfolioAllowed &&
      !loading &&
      !saving &&
      !_unreadable;
  String _key(String uid) =>
      'bf_portfolio_v3_${base64Url.encode(utf8.encode(uid)).replaceAll('=', '')}';
  void _emit() {
    if (!_disposed) notifyListeners();
  }

  void _accountChanged() {
    final uid = account.portfolioAllowed ? account.identity?.uid : null;
    if (uid == _uid) return;
    _uid = uid;
    _entries = [];
    _broker = null;
    error = null;
    saving = false;
    _unreadable = false;
    ++_epoch;
    _emit();
    if (uid != null) load();
  }

  Future<void> load() async {
    final uid = _uid;
    if (uid == null) return;
    final epoch = ++_epoch;
    loading = true;
    error = null;
    _unreadable = false;
    _emit();
    try {
      final raw = await vault.read(_key(uid));
      List<PurchaseEntry> entries = [];
      BrokerSelection? broker;
      if (raw != null) {
        if (raw.length > 300000) throw const FormatException();
        final j = jsonDecode(raw) as Map<String, dynamic>;
        if (j['version'] != 1 ||
            j['owner'] != uid ||
            j['purchases'] is! List ||
            (j['purchases'] as List).length > 500) {
          throw const FormatException();
        }
        if (j['broker'] != null) {
          broker = BrokerSelection.fromJson(
            Map<String, dynamic>.from(j['broker'] as Map),
          );
        }
        entries = (j['purchases'] as List)
            .map((e) => PurchaseEntry.fromJson(Map<String, dynamic>.from(e)))
            .toList();
        if (entries.map((e) => e.id).toSet().length != entries.length) {
          throw const FormatException();
        }
      }
      if (epoch == _epoch && uid == _uid) {
        _entries = entries;
        _broker = broker;
      }
    } catch (_) {
      if (epoch == _epoch) {
        _unreadable = true;
        error =
            'La sauvegarde de ce compte ne peut pas être lue. Réessaie ; elle n’a pas été remplacée.';
      }
    } finally {
      if (epoch == _epoch) {
        loading = false;
        _emit();
      }
    }
  }

  Future<bool> setBroker(BrokerSelection? value) {
    if (value != null) BrokerSelection.fromJson(value.toJson());
    return _commit(_entries, updateBroker: true, broker: value);
  }

  Future<bool> _commit(
    List<PurchaseEntry> value, {
    bool updateBroker = false,
    BrokerSelection? broker,
  }) async {
    final uid = _uid;
    if (uid == null ||
        !account.portfolioAllowed ||
        saving ||
        loading ||
        _unreadable) {
      return false;
    }
    final epoch = _epoch;
    final nextBroker = updateBroker ? broker : _broker;
    saving = true;
    error = null;
    _emit();
    final raw = jsonEncode({
      'version': 1,
      'owner': uid,
      'purchases': value.map((e) => e.toJson()).toList(),
      'broker': nextBroker?.toJson(),
    });
    try {
      final next = _writes
          .catchError((_) {})
          .then((_) => vault.write(_key(uid), raw));
      _writes = next;
      await next;
      if (epoch != _epoch || uid != _uid) return false;
      _entries = value;
      _broker = nextBroker;
      return true;
    } catch (_) {
      if (epoch == _epoch) {
        error =
            'L’enregistrement sécurisé a échoué. Les saisies précédentes sont conservées.';
      }
      return false;
    } finally {
      if (epoch == _epoch) {
        saving = false;
        _emit();
      }
    }
  }

  Future<bool> add(PurchaseEntry entry) {
    if (_entries.length >= 500 || _entries.any((e) => e.id == entry.id)) {
      return Future.value(false);
    }
    PurchaseEntry.fromJson(entry.toJson());
    return _commit([..._entries, entry]);
  }

  Future<bool> remove(String id) =>
      _commit(_entries.where((e) => e.id != id).toList());
  Future<bool> replace(PurchaseEntry entry) {
    if (!_entries.any((e) => e.id == entry.id)) return Future.value(false);
    PurchaseEntry.fromJson(entry.toJson());
    return _commit(_entries.map((e) => e.id == entry.id ? entry : e).toList());
  }

  @override
  void dispose() {
    _disposed = true;
    ++_epoch;
    account.removeListener(_accountChanged);
    super.dispose();
  }
}

class PortfolioScope extends InheritedNotifier<PortfolioController> {
  const PortfolioScope({
    required PortfolioController controller,
    required super.child,
    super.key,
  }) : super(notifier: controller);
  static PortfolioController? maybeOf(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<PortfolioScope>()?.notifier;
}
