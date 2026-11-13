import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:bourse_facile_mobile/account/account_controller.dart';
import 'package:bourse_facile_mobile/portfolio/portfolio_controller.dart';
import 'package:bourse_facile_mobile/portfolio/broker_selection.dart';
import 'package:bourse_facile_mobile/portfolio/purchase.dart';
import 'package:bourse_facile_mobile/data/market.dart';
import 'support/accounts.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  test(
    'SGI selection is isolated by verified account, persists with holdings and survives reconnect',
    () async {
      SharedPreferences.setMockInitialValues({});
      final vault = MemoryVault(), gateway = FakeAuthGateway();
      final account = AccountController(
        gateway: gateway,
        vault: vault,
        preferences: await SharedPreferences.getInstance(),
      );
      await account.restore();
      await account.googleSignIn();
      final ledger = PortfolioController(account: account, vault: vault);
      await ledger.load();
      await ledger.add(
        PurchaseEntry(
          id: PurchaseEntry.newId(),
          symbol: 'SNTS',
          companyName: 'SONATEL',
          quantity: 10,
          unitPriceMinor: 400000,
          recordedAt: DateTime.utc(2026),
        ),
      );
      expect(
        await ledger.setBroker(const BrokerSelection('ABCO Bourse', sgiUrl)),
        isTrue,
      );
      expect(ledger.entries.length, 1);
      await account.signOut();
      expect(ledger.broker, isNull);
      expect(ledger.entries, isEmpty);
      gateway.uid = 'other-account';
      await account.googleSignIn();
      await ledger.load();
      expect(ledger.broker, isNull);
      await ledger.setBroker(const BrokerSelection('Autre SGI', sgiUrl));
      await account.signOut();
      gateway.uid = 'account-a';
      await account.googleSignIn();
      await ledger.load();
      expect(ledger.broker!.name, 'ABCO Bourse');
      expect(ledger.entries.single.quantity, 10);
      vault.failWrite = true;
      expect(await ledger.setBroker(null), isFalse);
      expect(ledger.broker!.name, 'ABCO Bourse');
      ledger.dispose();
      account.dispose();
    },
  );
  test(
    'A broker reference cannot point to a private API, nonofficial URL or another page',
    () {
      for (final source in [
        'https://attacker.example/sgi',
        'https://www.brvm.org/fr/avis',
        'http://www.brvm.org/fr/intervenants/sgi/tous',
        '$sgiUrl?page=-1',
      ]) {
        expect(
          () => BrokerSelection.fromJson({'name': 'SGI', 'source': source}),
          throwsFormatException,
        );
      }
    },
  );
}
