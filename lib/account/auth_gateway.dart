import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:http/http.dart' as http;
import '../data/account_config.dart';

class AccountIdentity {
  final String uid, email, displayName;
  final bool emailVerified;
  const AccountIdentity({
    required this.uid,
    required this.email,
    required this.displayName,
    required this.emailVerified,
  });
}

class AccountSession {
  final AccountIdentity identity;
  final String idToken, refreshToken;
  final DateTime expiresAt;
  const AccountSession({
    required this.identity,
    required this.idToken,
    required this.refreshToken,
    required this.expiresAt,
  });
}

class AccountFailure implements Exception {
  final String message;
  final String? code;
  const AccountFailure(this.message, {this.code});
  @override
  String toString() => message;
}

class AccountCancelled implements Exception {
  const AccountCancelled();
}

// Android Credential Manager can report a configuration failure as "canceled".
// Never discard that result silently or treat it as an authenticated session.
Exception googleAccountException(GoogleSignInException error) {
  if (error.code == GoogleSignInExceptionCode.canceled) {
    return const AccountCancelled();
  }
  final configuration =
      error.code == GoogleSignInExceptionCode.clientConfigurationError ||
      error.code == GoogleSignInExceptionCode.providerConfigurationError;
  return AccountFailure(
    configuration
        ? 'La connexion Google n’est pas disponible dans cette version. Utilise ton adresse e-mail ou contacte l’assistance.'
        : 'La connexion Google s’est interrompue. Réessaie ou utilise ton adresse e-mail.',
    code: 'GOOGLE_${error.code.name}',
  );
}

abstract interface class AuthGateway {
  bool get googleAvailable;
  Future<AccountSession> emailSignIn(String email, String password);
  Future<AccountSession> emailSignUp(String email, String password);
  Future<AccountSession> googleSignIn();
  Future<AccountSession> refresh(String token);
  Future<AccountIdentity> lookup(String idToken);
  Future<void> sendVerification(String idToken);
  Future<void> sendPasswordReset(String email);
  Future<void> googleSignOut();
  void dispose();
}

class FirebaseAccountGateway implements AuthGateway {
  final http.Client client;
  final String apiKey;
  Future<void>? _googleInit;
  FirebaseAccountGateway({
    http.Client? client,
    this.apiKey = AccountConfig.apiKey,
  }) : client = client ?? http.Client();
  @override
  bool get googleAvailable =>
      !kIsWeb &&
      (defaultTargetPlatform == TargetPlatform.android ||
          defaultTargetPlatform == TargetPlatform.iOS);
  Future<Map<String, dynamic>> _post(
    String operation,
    Map<String, dynamic> body, {
    bool refresh = false,
  }) async {
    final uri = Uri.https(
      refresh ? 'securetoken.googleapis.com' : 'identitytoolkit.googleapis.com',
      refresh ? '/v1/token' : '/v1/accounts:$operation',
      {'key': apiKey},
    );
    final request = http.Request('POST', uri)..followRedirects = false;
    request.headers['content-type'] = refresh
        ? 'application/x-www-form-urlencoded'
        : 'application/json; charset=utf-8';
    request.body = refresh
        ? Uri(
            queryParameters: body.map((k, v) => MapEntry(k, v.toString())),
          ).query
        : jsonEncode(body);
    try {
      final response = await client
          .send(request)
          .timeout(const Duration(seconds: 20));
      final bytes = <int>[];
      await for (final chunk in response.stream.timeout(
        const Duration(seconds: 20),
      )) {
        if (bytes.length + chunk.length > 128000) {
          throw const AccountFailure(
            'Réponse du service de connexion trop volumineuse.',
          );
        }
        bytes.addAll(chunk);
      }
      final result = jsonDecode(utf8.decode(bytes));
      if (result is! Map<String, dynamic>) throw const FormatException();
      if (response.statusCode >= 500) {
        throw const AccountFailure(
          'Le service de connexion est momentanément indisponible. Réessaie plus tard.',
        );
      }
      if (response.statusCode != 200) {
        final error = result['error'];
        final code = error is Map
            ? (error['message'] as String? ?? '')
            : error?.toString() ?? '';
        throw AccountFailure(_message(code), code: code);
      }
      return result;
    } on AccountFailure {
      rethrow;
    } catch (_) {
      throw const AccountFailure(
        'Connexion au service impossible. Vérifie ton accès Internet puis réessaie.',
      );
    }
  }

  static String _message(String code) {
    if (code.contains('TOO_MANY') || code.contains('QUOTA')) {
      return 'Trop de tentatives. Patiente quelques instants avant de réessayer.';
    }
    if (code.contains('EMAIL_EXISTS')) {
      return 'Cette adresse est déjà utilisée. Connecte-toi ou réinitialise ton mot de passe.';
    }
    if (code.contains('WEAK_PASSWORD') ||
        code.contains('PASSWORD_DOES_NOT_MEET_REQUIREMENTS')) {
      return 'Le mot de passe ne respecte pas les règles du compte. Choisis un mot de passe plus robuste.';
    }
    if (code.contains('OPERATION_NOT_ALLOWED') ||
        code.contains('CONFIGURATION_NOT_FOUND')) {
      return 'Cette méthode de connexion n’est pas encore activée. Essaie une autre méthode.';
    }
    if (code.contains('INVALID_IDP_RESPONSE') ||
        code.contains('INVALID_OAUTH_CLIENT_ID') ||
        code.contains('UNAUTHORIZED_DOMAIN')) {
      return 'La configuration de la connexion Google doit être vérifiée. Utilise ton adresse e-mail ou contacte l’assistance.';
    }
    if (code.contains('USER_DISABLED')) {
      return 'Ce compte est désactivé. Contacte l’assistance.';
    }
    if (code.contains('INVALID_ID_TOKEN') ||
        code.contains('TOKEN_EXPIRED') ||
        code.contains('INVALID_REFRESH_TOKEN')) {
      return 'Ta session a expiré. Connecte-toi à nouveau.';
    }
    return 'Connexion impossible. Vérifie ton adresse et ton mot de passe.';
  }

  Future<AccountSession> _session(
    Map<String, dynamic> data, {
    bool refreshed = false,
  }) async {
    final token = data[refreshed ? 'id_token' : 'idToken'];
    final refreshToken = data[refreshed ? 'refresh_token' : 'refreshToken'];
    final uid = data[refreshed ? 'user_id' : 'localId'];
    final lifetime = int.tryParse(
      '${data[refreshed ? 'expires_in' : 'expiresIn']}',
    );
    if (token is! String ||
        token.isEmpty ||
        refreshToken is! String ||
        refreshToken.isEmpty ||
        uid is! String ||
        lifetime == null ||
        lifetime < 1 ||
        lifetime > 7200) {
      throw const AccountFailure(
        'La session reçue est invalide. Réessaie de te connecter.',
      );
    }
    // Identity is checked by Firebase; a decoded JWT or a local UID is not a login.
    final identity = await lookup(token);
    if (identity.uid != uid) {
      throw const AccountFailure(
        'La session ne correspond pas au compte demandé.',
      );
    }
    return AccountSession(
      identity: identity,
      idToken: token,
      refreshToken: refreshToken,
      expiresAt: DateTime.now().toUtc().add(Duration(seconds: lifetime)),
    );
  }

  @override
  Future<AccountIdentity> lookup(String idToken) async {
    final data = await _post('lookup', {'idToken': idToken});
    final users = data['users'];
    if (users is! List || users.length != 1 || users.first is! Map) {
      throw const AccountFailure('Le compte n’a pas pu être vérifié.');
    }
    final user = users.first as Map;
    final uid = user['localId'], email = user['email'];
    if (uid is! String ||
        uid.isEmpty ||
        uid.length > 128 ||
        email is! String ||
        email.isEmpty) {
      throw const AccountFailure(
        'Les informations du compte sont incomplètes.',
      );
    }
    return AccountIdentity(
      uid: uid,
      email: email,
      displayName: user['displayName'] is String ? user['displayName'] : '',
      emailVerified: user['emailVerified'] == true,
    );
  }

  @override
  Future<AccountSession> emailSignIn(String email, String password) async =>
      _session(
        await _post('signInWithPassword', {
          'email': email.trim(),
          'password': password,
          'returnSecureToken': true,
        }),
      );
  @override
  Future<AccountSession> emailSignUp(String email, String password) async =>
      _session(
        await _post('signUp', {
          'email': email.trim(),
          'password': password,
          'returnSecureToken': true,
        }),
      );
  @override
  Future<AccountSession> refresh(String token) async => _session(
    await _post('token', {
      'grant_type': 'refresh_token',
      'refresh_token': token,
    }, refresh: true),
    refreshed: true,
  );
  @override
  Future<void> sendVerification(String idToken) async {
    await _post('sendOobCode', {
      'requestType': 'VERIFY_EMAIL',
      'idToken': idToken,
    });
  }

  @override
  Future<void> sendPasswordReset(String email) async {
    // Return the same result for an unknown email, to avoid account enumeration.
    try {
      await _post('sendOobCode', {
        'requestType': 'PASSWORD_RESET',
        'email': email.trim(),
      });
    } on AccountFailure catch (e) {
      if (e.code == 'EMAIL_NOT_FOUND') {
        return;
      }
      rethrow;
    }
  }

  @override
  Future<AccountSession> googleSignIn() async {
    if (!googleAvailable) {
      throw const AccountFailure(
        'La connexion Google n’est pas disponible sur cet appareil pour le moment. Utilise ton adresse e-mail.',
      );
    }
    try {
      try {
        await (_googleInit ??= GoogleSignIn.instance.initialize(
          serverClientId: AccountConfig.googleServerClientId,
          clientId:
              defaultTargetPlatform == TargetPlatform.iOS &&
                  AccountConfig.googleIosClientId.isNotEmpty
              ? AccountConfig.googleIosClientId
              : null,
        ));
      } catch (_) {
        _googleInit =
            null; // An initialization failure must not poison retries.
        rethrow;
      }
      final account = await GoogleSignIn.instance.authenticate();
      final token = account.authentication.idToken;
      if (token == null || token.isEmpty) {
        throw const AccountFailure(
          'Google n’a pas fourni de session vérifiable.',
        );
      }
      return await exchangeGoogleIdToken(token);
    } on GoogleSignInException catch (e) {
      throw googleAccountException(e);
    } on PlatformException {
      throw const AccountFailure(
        'Le service Google de cet appareil est indisponible. Réessaie ou utilise ton adresse e-mail.',
        code: 'GOOGLE_PLATFORM',
      );
    }
  }

  Future<AccountSession> exchangeGoogleIdToken(String token) async {
    if (token.isEmpty || token.length > 16000) {
      throw const AccountFailure('La session Google reçue est invalide.');
    }
    final data = await _post('signInWithIdp', {
      'postBody': Uri(
        queryParameters: {'id_token': token, 'providerId': 'google.com'},
      ).query,
      'requestUri': 'https://${AccountConfig.authDomain}',
      'returnSecureToken': true,
    });
    if (data['needConfirmation'] == true) {
      throw const AccountFailure(
        'Cette adresse utilise un autre mode de connexion. Connecte-toi avec ton mode habituel.',
        code: 'ACCOUNT_LINK_REQUIRED',
      );
    }
    return _session(data);
  }

  @override
  Future<void> googleSignOut() async {
    if (_googleInit != null) {
      try {
        await GoogleSignIn.instance.signOut();
      } catch (_) {}
    }
  }

  @override
  void dispose() => client.close();
}
