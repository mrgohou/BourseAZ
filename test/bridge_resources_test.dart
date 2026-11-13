import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:bourse_facile_mobile/data/market.dart';
import 'package:bourse_facile_mobile/data/bridge_resources.dart';

void main() {
  test(
    'Only the exact verified public Bridge PDF can be downloaded; private portal APIs remain blocked',
    () async {
      var requests = 0;
      final repo = MarketRepository(
        client: MockClient((r) async {
          requests++;
          expect(r.url.toString(), bridgeTariffUrl);
          return http.Response('%PDF-published-tariff', 200);
        }),
      );
      await repo.download(bridgeTariffUrl, 1000);
      expect(requests, 1);
      for (final url in [
        bridgePortalUrl,
        '${bridgePortalUrl}api/positions',
        '$bridgeTariffUrl?token=private',
        'https://attacker.example/tarification-compte-titre.pdf',
      ]) {
        await expectLater(repo.download(url, 1000), throwsFormatException);
      }
      expect(requests, 1);
      expect(officialUrl(bridgeTariffUrl), isFalse);
      expect(verifiedBrokerPublicLink(bridgePortalUrl), isTrue);
      expect(
        verifiedBrokerPublicLink('$bridgePortalUrl?session=secret'),
        isFalse,
      );
      repo.client.close();
    },
  );
  test(
    'Bridge resources are identified from an explicit SGI selection, not assigned to all portfolios',
    () {
      expect(isBridgeBroker('BRIDGE SECURITIES'), isTrue);
      expect(isBridgeBroker('Bridge Securities'), isTrue);
      expect(isBridgeBroker(null), isFalse);
      expect(isBridgeBroker('ABCO Bourse'), isFalse);
    },
  );
}
