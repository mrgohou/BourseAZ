import 'dart:async';
import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:bourse_facile_mobile/account/account_controller.dart';
import 'package:bourse_facile_mobile/account/auth_gateway.dart';
import 'package:bourse_facile_mobile/portfolio/portfolio_controller.dart';
import 'package:bourse_facile_mobile/portfolio/purchase.dart';
import 'support/accounts.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUp(() => SharedPreferences.setMockInitialValues({}));
  test(
    'Firebase identity is checked server-side before accepting an email session',
    () async {
      final seen = <http.Request>[];
      final gateway = FirebaseAccountGateway(
        apiKey: 'public-test-key',
        client: MockClient((r) async {
          seen.add(r);
          return http.Response(
            jsonEncode(
              r.url.path.endsWith(':lookup')
                  ? {
                      'users': [
                        {
                          'localId': 'uid-a',
                          'email': 'a@example.test',
                          'emailVerified': true,
                        },
                      ],
                    }
                  : {
                      'localId': 'uid-a',
                      'idToken': 'token',
                      'refreshToken': 'refresh',
                      'expiresIn': '3600',
                    },
            ),
            200,
          );
        }),
      );
      final session = await gateway.emailSignIn('a@example.test', 'not-stored');
      expect(session.identity.uid, 'uid-a');
      expect(session.identity.emailVerified, true);
      expect(seen.length, 2);
      expect(
        seen.every(
          (r) =>
              r.url.scheme == 'https' &&
              r.url.host == 'identitytoolkit.googleapis.com',
        ),
        true,
      );
      expect(seen.first.followRedirects, false);
      expect(jsonDecode(seen.last.body)['idToken'], 'token');
      gateway.dispose();
    },
  );
  test('A different UID returned by token verification is rejected', () async {
    final gateway = FirebaseAccountGateway(
      client: MockClient(
        (r) async => http.Response(
          jsonEncode(
            r.url.path.endsWith(':lookup')
                ? {
                    'users': [
                      {
                        'localId': 'other',
                        'email': 'x@example.test',
                        'emailVerified': true,
                      },
                    ],
                  }
                : {
                    'localId': 'uid-a',
                    'idToken': 'token',
                    'refreshToken': 'refresh',
                    'expiresIn': '3600',
                  },
          ),
          200,
        ),
      ),
    );
    await expectLater(
      gateway.emailSignIn('a@example.test', 'pw'),
      throwsA(isA<AccountFailure>()),
    );
    gateway.dispose();
  });
  test(
    'Unknown account and wrong password do not disclose different errors',
    () async {
      Future<String> error(String code) async {
        final g = FirebaseAccountGateway(
          client: MockClient(
            (_) async => http.Response(
              jsonEncode({
                'error': {'message': code},
              }),
              400,
            ),
          ),
        );
        try {
          await g.emailSignIn('x@example.test', 'pw');
          return '';
        } on AccountFailure catch (e) {
          return e.message;
        } finally {
          g.dispose();
        }
      }

      expect(await error('EMAIL_NOT_FOUND'), await error('INVALID_PASSWORD'));
    },
  );
  test(
    'Restoration uses a refresh token, never a UID from preferences',
    () async {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('uid', 'other-user');
      final vault = MemoryVault();
      final g = FakeAuthGateway();
      final c = AccountController(gateway: g, vault: vault, preferences: prefs);
      await c.restore();
      expect(c.identity, isNull);
      expect(g.refreshCalls, 0);
      c.dispose();
    },
  );
  test(
    'Unverified email cannot open a private portfolio; resend is bounded',
    () async {
      final prefs = await SharedPreferences.getInstance();
      final g = FakeAuthGateway()..verified = false;
      final c = AccountController(
        gateway: g,
        vault: MemoryVault(),
        preferences: prefs,
      );
      await c.restore();
      await c.emailSignUp('a@example.test', 'password');
      expect(c.portfolioAllowed, false);
      expect(g.verifyMessages, 1);
      await c.resendVerification();
      expect(g.verifyMessages, 1);
      g.verified = true;
      await c.checkVerification();
      expect(c.portfolioAllowed, true);
      c.dispose();
    },
  );
  test('A late sign-in completion cannot undo a sign-out', () async {
    final pending = Completer<AccountSession>();
    final g = FakeAuthGateway()..pending = pending.future;
    final vault = MemoryVault();
    final c = AccountController(
      gateway: g,
      vault: vault,
      preferences: await SharedPreferences.getInstance(),
    );
    await c.restore();
    final login = c.emailSignIn('a@example.test', 'password');
    await c.signOut();
    pending.complete(g.session());
    expect(await login, false);
    expect(c.identity, isNull);
    expect(vault.values.containsKey(AccountController.refreshKey), false);
    c.dispose();
  });
  test(
    'Logout marker prevents restoration even if token deletion fails',
    () async {
      final prefs = await SharedPreferences.getInstance();
      final vault = MemoryVault();
      final g = FakeAuthGateway();
      final c = AccountController(gateway: g, vault: vault, preferences: prefs);
      await c.restore();
      await c.googleSignIn();
      vault.failDelete = true;
      await c.signOut();
      final next = AccountController(
        gateway: g,
        vault: vault,
        preferences: prefs,
      );
      await next.restore();
      expect(next.identity, isNull);
      expect(g.refreshCalls, 0);
      c.dispose();
      next.dispose();
    },
  );
  test(
    'Portfolio entries are isolated by verified Firebase UID and never written to preferences',
    () async {
      final prefs = await SharedPreferences.getInstance();
      final vault = MemoryVault();
      final g = FakeAuthGateway();
      final account = AccountController(
        gateway: g,
        vault: vault,
        preferences: prefs,
      );
      await account.restore();
      final ledger = PortfolioController(account: account, vault: vault);
      await account.googleSignIn();
      await ledger.load();
      final purchase = PurchaseEntry(
        id: PurchaseEntry.newId(),
        symbol: 'SNTS',
        companyName: 'Nom officiel',
        quantity: 10,
        unitPriceMinor: 400000,
        recordedAt: DateTime.now().toUtc(),
      );
      expect(await ledger.add(purchase), true);
      expect(ledger.entries.length, 1);
      expect(prefs.getKeys().any((k) => k.contains('portfolio')), false);
      await account.signOut();
      expect(ledger.entries, isEmpty);
      g.uid = 'account-b';
      await account.googleSignIn();
      await ledger.load();
      expect(ledger.entries, isEmpty);
      await account.signOut();
      g.uid = 'account-a';
      await account.googleSignIn();
      await ledger.load();
      expect(ledger.entries.single.id, purchase.id);
      ledger.dispose();
      account.dispose();
    },
  );
  test('A failed secure write does not confirm or insert a purchase', () async {
    final vault = MemoryVault();
    final g = FakeAuthGateway();
    final account = AccountController(
      gateway: g,
      vault: vault,
      preferences: await SharedPreferences.getInstance(),
    );
    await account.restore();
    await account.googleSignIn();
    final ledger = PortfolioController(account: account, vault: vault);
    await ledger.load();
    vault.failWrite = true;
    final p = PurchaseEntry(
      id: PurchaseEntry.newId(),
      symbol: 'SNTS',
      companyName: 'Nom officiel',
      quantity: 1,
      unitPriceMinor: 400000,
      recordedAt: DateTime.now().toUtc(),
    );
    expect(await ledger.add(p), false);
    expect(ledger.entries, isEmpty);
    vault.failWrite = false;
    expect(await ledger.add(p), true);
    ledger.dispose();
    account.dispose();
  });
  test(
    'Unit prices accept French decimals and reject non finite or invalid inputs',
    () {
      expect(parseUnitPrice('4 000'), isNull);
      expect(parseUnitPrice('4000,50'), 400050);
      for (final value in [
        '-5',
        'NaN',
        'Infinity',
        '1e3',
        '0',
        '1.001',
        '1000000001',
      ]) {
        expect(parseUnitPrice(value), isNull, reason: value);
      }
    },
  );
}
