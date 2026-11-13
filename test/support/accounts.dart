import 'package:bourse_facile_mobile/account/auth_gateway.dart';
import 'package:bourse_facile_mobile/account/secure_vault.dart';

class MemoryVault implements SecureVault {
  final Map<String, String> values = {};
  bool failWrite = false, failDelete = false;
  @override
  Future<String?> read(String key) async => values[key];
  @override
  Future<void> write(String key, String value) async {
    if (failWrite) throw StateError('Storage');
    values[key] = value;
  }

  @override
  Future<void> delete(String key) async {
    if (failDelete) throw StateError('Storage');
    values.remove(key);
  }
}

class FakeAuthGateway implements AuthGateway {
  String uid = 'account-a';
  bool verified = true;
  int verifyMessages = 0, refreshCalls = 0;
  Future<AccountSession>? pending;
  AccountSession session() => AccountSession(
    identity: AccountIdentity(
      uid: uid,
      email: '$uid@example.test',
      displayName: 'Compte de test',
      emailVerified: verified,
    ),
    idToken: 'verified-token-$uid',
    refreshToken: 'refresh-$uid',
    expiresAt: DateTime.now().toUtc().add(const Duration(hours: 1)),
  );
  @override
  bool get googleAvailable => true;
  @override
  Future<AccountSession> emailSignIn(String email, String password) async =>
      pending ?? session();
  @override
  Future<AccountSession> emailSignUp(String email, String password) async =>
      session();
  @override
  Future<AccountSession> googleSignIn() async => session();
  @override
  Future<AccountSession> refresh(String token) async {
    refreshCalls++;
    return session();
  }

  @override
  Future<AccountIdentity> lookup(String token) async => session().identity;
  @override
  Future<void> sendVerification(String token) async {
    verifyMessages++;
  }

  @override
  Future<void> sendPasswordReset(String email) async {}
  @override
  Future<void> googleSignOut() async {}
  @override
  void dispose() {}
}
