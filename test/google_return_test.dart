import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:bourse_facile_mobile/account/account_controller.dart';
import 'package:bourse_facile_mobile/account/auth_gateway.dart';
import 'support/accounts.dart';

class CancelledGoogle extends FakeAuthGateway {
  @override
  Future<AccountSession> googleSignIn() async => throw const AccountCancelled();
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  test(
    'A canceled Credential Manager result is explained, never silently accepted as a login',
    () async {
      SharedPreferences.setMockInitialValues({});
      final vault = MemoryVault();
      final c = AccountController(
        gateway: CancelledGoogle(),
        vault: vault,
        preferences: await SharedPreferences.getInstance(),
      );
      await c.restore();
      expect(await c.googleSignIn(), isFalse);
      expect(c.identity, isNull);
      expect(c.busy, isFalse);
      expect(c.notice, contains('interrompue'));
      expect(vault.values, isEmpty);
      c.dispose();
    },
  );
  test(
    'Google configuration and platform failures never appear as bad passwords or failed encrypted storage',
    () {
      final result = googleAccountException(
        const GoogleSignInException(
          code: GoogleSignInExceptionCode.clientConfigurationError,
        ),
      );
      expect(result, isA<AccountFailure>());
      expect(
        (result as AccountFailure).code,
        'GOOGLE_clientConfigurationError',
      );
      expect(result.message, contains('Google'));
      expect(result.message, isNot(contains('stockage')));
      expect(
        googleAccountException(
          const GoogleSignInException(code: GoogleSignInExceptionCode.canceled),
        ),
        isA<AccountCancelled>(),
      );
    },
  );
  test(
    'Google token exchange is accepted only after Firebase verifies the resulting identity',
    () async {
      final paths = <String>[];
      final gateway = FirebaseAccountGateway(
        client: MockClient((r) async {
          paths.add(r.url.path);
          if (r.url.path.endsWith(':signInWithIdp')) {
            final body = jsonDecode(r.body) as Map;
            expect(
              Uri.splitQueryString(body['postBody'] as String)['providerId'],
              'google.com',
            );
            expect(
              Uri.splitQueryString(body['postBody'] as String)['id_token'],
              'google-test-token',
            );
            return http.Response(
              jsonEncode({
                'localId': 'verified-user',
                'idToken': 'firebase-token',
                'refreshToken': 'refresh',
                'expiresIn': '3600',
              }),
              200,
            );
          }
          expect(jsonDecode(r.body)['idToken'], 'firebase-token');
          return http.Response(
            jsonEncode({
              'users': [
                {
                  'localId': 'verified-user',
                  'email': 'verified@example.test',
                  'emailVerified': true,
                },
              ],
            }),
            200,
          );
        }),
      );
      final session = await gateway.exchangeGoogleIdToken('google-test-token');
      expect(session.identity.uid, 'verified-user');
      expect(session.identity.emailVerified, isTrue);
      expect(paths, ['/v1/accounts:signInWithIdp', '/v1/accounts:lookup']);
      gateway.dispose();
    },
  );
  test(
    'A Google/Firebase configuration failure is not presented as a wrong password',
    () async {
      final gateway = FirebaseAccountGateway(
        client: MockClient(
          (_) async => http.Response(
            jsonEncode({
              'error': {'message': 'INVALID_IDP_RESPONSE'},
            }),
            400,
          ),
        ),
      );
      await expectLater(
        gateway.exchangeGoogleIdToken('google-test-token'),
        throwsA(
          isA<AccountFailure>().having(
            (e) => e.message,
            'message',
            contains('configuration'),
          ),
        ),
      );
      gateway.dispose();
    },
  );
}
