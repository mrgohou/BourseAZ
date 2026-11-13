import 'dart:async';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'auth_gateway.dart';
import 'secure_vault.dart';

class AccountController extends ChangeNotifier {
  static const refreshKey = 'bf_auth_refresh_v1',
      signedOutKey = 'bf_auth_signed_out_v1';
  final AuthGateway gateway;
  final SecureVault vault;
  final SharedPreferences preferences;
  AccountSession? _session;
  bool initializing = true, busy = false;
  String? error, notice;
  int _epoch = 0;
  bool _disposed = false;
  Future<void> _writes = Future.value();
  DateTime? _lastVerification;
  AccountController({
    required this.gateway,
    required this.vault,
    required this.preferences,
  });
  AccountIdentity? get identity => _session?.identity;
  bool get googleAvailable => gateway.googleAvailable;
  bool get portfolioAllowed => identity?.emailVerified == true;
  void _emit() {
    if (!_disposed) notifyListeners();
  }

  Future<void> _write(Future<void> Function() action) {
    final next = _writes.catchError((_) {}).then((_) => action());
    _writes = next;
    return next;
  }

  Future<void> restore() async {
    final epoch = ++_epoch;
    initializing = true;
    _emit();
    try {
      if (preferences.getBool(signedOutKey) == true) return;
      final token = await vault.read(refreshKey);
      if (token == null || token.isEmpty) return;
      final session = await gateway.refresh(token);
      if (epoch != _epoch || _disposed) return;
      await _write(() => vault.write(refreshKey, session.refreshToken));
      if (epoch == _epoch && !_disposed) _session = session;
    } catch (_) {
      if (epoch == _epoch) {
        error =
            'Reconnecte-toi pour ouvrir ton portefeuille. Les données enregistrées de ton compte sont conservées.';
      }
    } finally {
      if (epoch == _epoch) {
        initializing = false;
        _emit();
      }
    }
  }

  Future<bool> _login(
    Future<AccountSession> Function() operation, {
    bool register = false,
  }) async {
    if (busy || initializing) return false;
    busy = true;
    error = null;
    notice = null;
    final epoch = ++_epoch;
    _emit();
    try {
      final session = await operation();
      if (epoch != _epoch || _disposed) return false;
      await _write(() => vault.write(refreshKey, session.refreshToken));
      if (epoch != _epoch || _disposed) return false;
      if (!await preferences.setBool(signedOutKey, false)) {
        throw StateError('Session persistence unavailable');
      }
      if (epoch != _epoch || _disposed) return false;
      _session = session;
      if (register && !session.identity.emailVerified) {
        try {
          await gateway.sendVerification(session.idToken);
          if (epoch != _epoch || _disposed) return false;
          _lastVerification = DateTime.now();
          notice =
              'Un e-mail de vérification a été envoyé. Ouvre son lien puis reviens ici.';
        } catch (_) {
          if (epoch != _epoch || _disposed) return false;
          notice =
              'Ton compte est créé. Utilise « Envoyer un lien » pour vérifier ton adresse.';
        }
      }
      return true;
    } on AccountCancelled {
      if (epoch == _epoch && !_disposed) {
        notice =
            'La connexion Google a été annulée ou interrompue. Si la fenêtre se ferme toute seule, utilise ton adresse e-mail et signale le problème à l’assistance.';
      }
      return false;
    } on AccountFailure catch (e) {
      if (epoch == _epoch) error = e.message;
      return false;
    } catch (_) {
      if (epoch == _epoch) {
        error =
            'Le stockage sécurisé de cet appareil est indisponible. Libère de l’espace puis réessaie.';
      }
      return false;
    } finally {
      if (epoch == _epoch) {
        busy = false;
        _emit();
      }
    }
  }

  void clearMessages() {
    error = null;
    notice = null;
    _emit();
  }

  Future<bool> emailSignIn(String email, String password) =>
      _login(() => gateway.emailSignIn(email, password));
  Future<bool> emailSignUp(String email, String password) =>
      _login(() => gateway.emailSignUp(email, password), register: true);
  Future<bool> googleSignIn() => _login(gateway.googleSignIn);
  Future<void> checkVerification() async {
    if (_session == null || busy) return;
    busy = true;
    error = null;
    notice = null;
    final epoch = ++_epoch;
    _emit();
    try {
      final session = await gateway.refresh(_session!.refreshToken);
      if (epoch != _epoch || _disposed) return;
      await _write(() => vault.write(refreshKey, session.refreshToken));
      if (epoch == _epoch) {
        _session = session;
        notice = session.identity.emailVerified
            ? 'Adresse vérifiée. Ton portefeuille est accessible.'
            : 'La vérification n’est pas encore confirmée. Ouvre le lien reçu par e-mail puis réessaie.';
      }
    } on AccountFailure catch (e) {
      if (epoch == _epoch) error = e.message;
    } catch (_) {
      if (epoch == _epoch) {
        error = 'La vérification est momentanément indisponible. Réessaie.';
      }
    } finally {
      if (epoch == _epoch) {
        busy = false;
        _emit();
      }
    }
  }

  Future<void> resendVerification() async {
    if (_session == null || busy || portfolioAllowed) return;
    if (_lastVerification != null &&
        DateTime.now().difference(_lastVerification!) <
            const Duration(seconds: 60)) {
      notice = 'Patiente une minute avant de demander un nouveau lien.';
      _emit();
      return;
    }
    busy = true;
    error = null;
    _emit();
    final epoch = _epoch;
    try {
      await gateway.sendVerification(_session!.idToken);
      if (epoch == _epoch) {
        _lastVerification = DateTime.now();
        notice = 'Un nouveau lien de vérification a été envoyé.';
      }
    } on AccountFailure catch (e) {
      if (epoch == _epoch) error = e.message;
    } finally {
      if (epoch == _epoch) {
        busy = false;
        _emit();
      }
    }
  }

  Future<void> passwordReset(String email) async {
    if (busy || initializing) return;
    busy = true;
    error = null;
    notice = null;
    final epoch = _epoch;
    _emit();
    try {
      await gateway.sendPasswordReset(email);
      if (epoch == _epoch && !_disposed) {
        notice =
            'Si un compte utilise cette adresse, un e-mail de réinitialisation a été envoyé.';
      }
    } on AccountFailure catch (e) {
      if (epoch == _epoch && !_disposed) error = e.message;
    } finally {
      if (epoch == _epoch && !_disposed) {
        busy = false;
        _emit();
      }
    }
  }

  Future<void> signOut() async {
    ++_epoch;
    _session = null;
    initializing = false;
    busy = true;
    error = null;
    notice = null;
    _emit();
    bool marker = false, deleted = false;
    try {
      marker = await preferences.setBool(signedOutKey, true);
    } catch (_) {}
    try {
      await _write(() => vault.delete(refreshKey));
      deleted = true;
    } catch (_) {}
    try {
      await gateway.googleSignOut();
    } catch (_) {}
    if (!marker && !deleted) {
      error =
          'L’effacement de la session n’a pas pu être confirmé sur cet appareil. Réessaie la déconnexion.';
    }
    busy = false;
    _emit();
  }

  @override
  void dispose() {
    _disposed = true;
    ++_epoch;
    gateway.dispose();
    super.dispose();
  }
}

class AccountScope extends InheritedNotifier<AccountController> {
  const AccountScope({
    required AccountController controller,
    required super.child,
    super.key,
  }) : super(notifier: controller);
  static AccountController? maybeOf(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<AccountScope>()?.notifier;
}
