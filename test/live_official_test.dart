import 'dart:convert';
import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/io_client.dart';
import 'package:bourse_facile_mobile/data/market.dart';

void main() {
  test(
    'Live HTTPS official BRVM pages and current financial reports',
    () async {
      HttpOverrides.global = null;
      final tls = SecurityContext(withTrustedRoots: true)
        ..setTrustedCertificates('/etc/ssl/certs/ca-certificates.crt');
      final io = HttpClient(context: tls)
        ..findProxy = HttpClient.findProxyFromEnvironment;
      final repo = MarketRepository(client: IOClient(io));
      try {
        final market = await repo.load();
        expect(market.stocks.length, inInclusiveRange(30, 150));
        expect(market.indices.length, 3);
        expect(market.asOf.isAfter(DateTime.now().toUtc()), false);
        final reports = await repo.documents('SNTS');
        expect(reports.any((d) => d.url.endsWith('.pdf')), true);
        File('/tmp/bourse-official-live-verification.json').writeAsStringSync(
          jsonEncode({
            'verifiedAt': DateTime.now().toUtc().toIso8601String(),
            'market': market.toJson(),
            'reports': reports
                .map((d) => {'title': d.title, 'url': d.url})
                .toList(),
          }),
        );
        stdout.writeln(
          'OFFICIAL LIVE: ${market.stocks.length} actions, séance ${market.asOf.toIso8601String()}, ${reports.length} documents Sonatel.',
        );
      } finally {
        repo.client.close();
      }
    },
    skip: !const bool.fromEnvironment('LIVE_BRVM'),
    timeout: const Timeout(Duration(minutes: 2)),
  );
}
