import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:html/parser.dart' as html;
import 'package:http/http.dart' as http;
import 'bridge_resources.dart';
import 'company_facts.dart';

const officialRoot = 'https://www.brvm.org';
const quotesUrl = '$officialRoot/fr/cours-actions/0';
const reportsUrl = '$officialRoot/fr/rapports-societes-cotees';
const sgiUrl = '$officialRoot/fr/intervenants/sgi/tous';

bool officialUrl(String value) {
  final u = Uri.tryParse(value);
  return u != null &&
      u.scheme == 'https' &&
      u.userInfo.isEmpty &&
      (u.host == 'www.brvm.org' ||
          u.host == 'brvm.org' ||
          u.host == 'bfin.brvm.org');
}

double? number(String? text) {
  final n = double.tryParse(
    (text ?? '')
        .replaceAll(RegExp(r'[\s\u00a0\u202f%]'), '')
        .replaceAll(',', '.'),
  );
  return n?.isFinite == true ? n : null;
}

String absolute(String href) => Uri.parse(
  officialRoot,
).resolve(href).toString().replaceFirst('http:', 'https:');

class Stock {
  final String symbol, name, sector;
  final double price, change, previous, opening;
  final int volume;
  final double? ytd, dividend, yieldPercent, per;
  final String? dividendDate;
  const Stock(
    this.symbol,
    this.name,
    this.sector,
    this.price,
    this.change, {
    this.previous = 0,
    this.opening = 0,
    this.volume = 0,
    this.ytd,
    this.dividend,
    this.yieldPercent,
    this.per,
    this.dividendDate,
  });
  factory Stock.fromJson(Map<String, dynamic> j) {
    final p = (j['price'] as num).toDouble(),
        c = (j['change'] as num).toDouble();
    if (!p.isFinite ||
        p <= 0 ||
        !c.isFinite ||
        !RegExp(r'^[A-Z]{3,5}$').hasMatch(j['symbol'] as String)) {
      throw const FormatException('Cours invalide');
    }
    return Stock(
      j['symbol'],
      j['name'],
      j['sector'] ?? 'Non classé',
      p,
      c,
      previous: (j['previous'] as num?)?.toDouble() ?? 0,
      opening: (j['opening'] as num?)?.toDouble() ?? 0,
      volume: (j['volume'] as num?)?.toInt() ?? 0,
      ytd: (j['ytd'] as num?)?.toDouble(),
      dividend: (j['dividend'] as num?)?.toDouble(),
      yieldPercent: (j['yieldPercent'] as num?)?.toDouble(),
      per: (j['per'] as num?)?.toDouble(),
      dividendDate: j['dividendDate'],
    );
  }
  Map<String, dynamic> toJson() => {
    'symbol': symbol,
    'name': name,
    'sector': sector,
    'price': price,
    'change': change,
    'previous': previous,
    'opening': opening,
    'volume': volume,
    'ytd': ytd,
    'dividend': dividend,
    'yieldPercent': yieldPercent,
    'per': per,
    'dividendDate': dividendDate,
  };
}

class MarketIndex {
  final String name;
  final double value, change;
  const MarketIndex(this.name, this.value, this.change);
  Map<String, dynamic> toJson() => {
    'name': name,
    'value': value,
    'change': change,
  };
}

class MarketSnapshot {
  final List<Stock> stocks;
  final List<MarketIndex> indices;
  final DateTime asOf;
  final String source;
  final String? bulletin;
  final DateTime? financialDate;
  const MarketSnapshot({
    required this.stocks,
    required this.asOf,
    this.source = quotesUrl,
    this.indices = const [],
    this.bulletin,
    this.financialDate,
  });
  bool get empty => stocks.isEmpty;
  factory MarketSnapshot.fromJson(Map<String, dynamic> j) {
    if (j['version'] != 2 ||
        !officialUrl(j['source'] as String? ?? '') ||
        j['demo'] == true) {
      throw const FormatException('Source non officielle');
    }
    final list = (j['stocks'] as List)
        .map((s) => Stock.fromJson(Map<String, dynamic>.from(s)))
        .toList();
    final date = DateTime.parse(j['asOf']).toUtc();
    if (list.isEmpty ||
        list.length > 150 ||
        list.map((s) => s.symbol).toSet().length != list.length ||
        date.isAfter(DateTime.now().toUtc().add(const Duration(minutes: 5)))) {
      throw const FormatException('Séance invalide');
    }
    final bulletin = j['bulletin'] as String?;
    if (bulletin != null && !officialUrl(bulletin)) {
      throw const FormatException('Bulletin invalide');
    }
    return MarketSnapshot(
      stocks: list,
      asOf: date,
      source: j['source'],
      bulletin: bulletin,
      financialDate: j['financialDate'] == null
          ? null
          : DateTime.parse(j['financialDate']),
      indices: ((j['indices'] as List?) ?? [])
          .map(
            (i) => MarketIndex(
              i['name'],
              (i['value'] as num).toDouble(),
              (i['change'] as num).toDouble(),
            ),
          )
          .toList(),
    );
  }
  Map<String, dynamic> toJson() => {
    'version': 2,
    'source': source,
    'asOf': asOf.toIso8601String(),
    'stocks': stocks.map((s) => s.toJson()).toList(),
    'indices': indices.map((i) => i.toJson()).toList(),
    'bulletin': bulletin,
    'financialDate': financialDate?.toIso8601String(),
  };
}

final emptyMarket = MarketSnapshot(stocks: const [], asOf: DateTime.utc(1970));

DateTime parsePublicationDate(String text) {
  const months = [
    'janvier',
    'février',
    'mars',
    'avril',
    'mai',
    'juin',
    'juillet',
    'août',
    'septembre',
    'octobre',
    'novembre',
    'décembre',
  ];
  final m = RegExp(
    r'Dernière mise à jour\s*:?\s*\w+,?\s*(\d{1,2})\s+([a-zéû]+),?\s*(\d{4})\s*-\s*(\d{1,2}):(\d{2})',
    caseSensitive: false,
  ).firstMatch(text);
  if (m == null) {
    throw const FormatException('Date de séance officielle absente');
  }
  final month = months.indexOf(m[2]!.toLowerCase()) + 1;
  if (month == 0) throw const FormatException('Mois inconnu');
  final date = DateTime.utc(
    int.parse(m[3]!),
    month,
    int.parse(m[1]!),
    int.parse(m[4]!),
    int.parse(m[5]!),
  );
  if (date.isAfter(DateTime.now().toUtc().add(const Duration(minutes: 5)))) {
    throw const FormatException('Publication future');
  }
  return date;
}

MarketSnapshot parseOfficialMarket(String actions, String home) {
  final a = html.parse(actions), h = html.parse(home);
  final date = parsePublicationDate(h.body?.text ?? '');
  if (parsePublicationDate(a.body?.text ?? '') != date) {
    throw const FormatException(
      'Les pages officielles ne correspondent pas à la même publication.',
    );
  }
  final stocks = <Stock>[];
  for (final row in a.querySelectorAll('table tr')) {
    final c = row.querySelectorAll('td').map((e) => e.text.trim()).toList();
    if (c.length != 7 || !RegExp(r'^[A-Z]{3,5}$').hasMatch(c[0])) continue;
    final p = number(c[5]), change = number(c[6]);
    if (p == null || p <= 0 || change == null) {
      throw const FormatException('Cotation officielle incomplète');
    }
    stocks.add(
      Stock(
        c[0],
        c[1],
        'Non classé',
        p,
        change,
        volume: number(c[2])?.toInt() ?? 0,
        previous: number(c[3]) ?? 0,
        opening: number(c[4]) ?? 0,
      ),
    );
  }
  if (stocks.length < 30 ||
      stocks.map((s) => s.symbol).toSet().length != stocks.length) {
    throw const FormatException('Structure BRVM modifiée');
  }
  final indices = <MarketIndex>[];
  for (final row in h.querySelectorAll('table tr')) {
    final c = row.querySelectorAll('td').map((e) => e.text.trim()).toList();
    if (c.length >= 3 &&
        ['BRVM-C', 'BRVM-30', 'BRVM-PRES'].contains(c[0]) &&
        number(c[1]) != null &&
        number(c[2]) != null) {
      indices.add(MarketIndex(c[0], number(c[1])!, number(c[2])!));
    }
  }
  return MarketSnapshot(stocks: stocks, asOf: date, indices: indices);
}

class OfficialDocument {
  final String title, url;
  const OfficialDocument(this.title, this.url);
}

class MarketRepository {
  final http.Client client;
  final String endpoint;
  MarketRepository({required this.client, this.endpoint = ''});
  final _cache = <String, (DateTime, String)>{};
  final _pending = <String, Future<String>>{};
  void invalidatePublicCaches() {
    _cache.clear();
    _pdfCache.clear();
  }

  Future<String> page(String url, {bool refresh = false}) {
    final cached = _cache[url];
    if (!refresh &&
        cached != null &&
        DateTime.now().difference(cached.$1) < const Duration(minutes: 5)) {
      return Future.value(cached.$2);
    }
    return _pending.putIfAbsent(url, () async {
      try {
        final b = await download(url, 2000000);
        final result = utf8.decode(b);
        if (_cache.length >= 16) _cache.remove(_cache.keys.first);
        _cache[url] = (DateTime.now(), result);
        return result;
      } finally {
        _pending.remove(url);
      }
    });
  }

  Future<List<int>> download(String url, int max) async {
    if (!officialUrl(url) && !verifiedBrokerDocument(url)) {
      throw const FormatException('Source non officielle refusée');
    }
    final response = await client
        .send(http.Request('GET', Uri.parse(url))..followRedirects = false)
        .timeout(const Duration(seconds: 20));
    if (response.statusCode != 200) {
      throw const FormatException('Publication indisponible');
    }
    final bytes = <int>[];
    await for (final c in response.stream.timeout(
      const Duration(seconds: 20),
    )) {
      if (bytes.length + c.length > max) {
        throw const FormatException('Publication trop volumineuse');
      }
      bytes.addAll(c);
    }
    return bytes;
  }

  Future<MarketSnapshot> load() async {
    final pages = await Future.wait([
      page(quotesUrl, refresh: true),
      page('$officialRoot/fr', refresh: true),
    ]);
    return parseOfficialMarket(pages[0], pages[1]);
  }

  static const pdfChannel = MethodChannel('ci.boursefacile/documents');
  final _pdfCache = <String, Map<String, dynamic>>{};
  final _pdfPending = <String, Future<Map<String, dynamic>>>{};
  Future<Map<String, dynamic>> readPdf(String url) {
    if (_pdfCache.containsKey(url)) return Future.value(_pdfCache[url]);
    if (_pdfPending.containsKey(url)) return _pdfPending[url]!;
    if (_pdfPending.length >= 2) {
      return Future.error(
        const FormatException('Deux documents sont déjà en cours de lecture.'),
      );
    }
    return _pdfPending.putIfAbsent(url, () async {
      try {
        final b = await download(url, 18000000);
        if (b.length < 5 ||
            ascii.decode(b.take(5).toList(), allowInvalid: true) != '%PDF-') {
          throw const FormatException('PDF officiel invalide');
        }
        final r = await pdfChannel.invokeMapMethod<String, dynamic>(
          'extractPdf',
          Uint8List.fromList(b),
        );
        if (r == null) throw const FormatException('Lecture PDF indisponible');
        if (_pdfCache.length >= 6) _pdfCache.remove(_pdfCache.keys.first);
        _pdfCache[url] = r;
        return r;
      } finally {
        _pdfPending.remove(url);
      }
    });
  }

  Future<MarketSnapshot> enrich(MarketSnapshot market) async {
    final d = market.asOf;
    final bulletin = await latestBulletin(onDate: d);
    final url = bulletin.url;
    final rows = bulletin.rows;
    final stocks = market.stocks.map((s) {
      final j = Map<String, dynamic>.from(rows[s.symbol] as Map? ?? {});
      // Refuse a different session or a misaligned PDF column.
      if ((bulletinNumber(j['price']) ??
                  (s.volume == 0 ? bulletinNumber(j['previous']) : null)) !=
              s.price ||
          bulletinNumber(j['change']) != s.change) {
        return s;
      }
      const sectors = {
        'TEL': 'Télécommunications',
        'FIN': 'Services financiers',
        'CD': 'Consommation discrétionnaire',
        'CB': 'Consommation de base',
        'IND': 'Industrie',
        'ENE': 'Énergie',
        'SPU': 'Services publics',
      };
      return Stock(
        s.symbol,
        (j['name'] as String?)?.trim().isNotEmpty == true ? j['name'] : s.name,
        sectors[j['sector']] ?? s.sector,
        s.price,
        s.change,
        previous: bulletinNumber(j['previous']) ?? s.previous,
        opening: s.opening,
        volume: s.volume,
        ytd: bulletinNumber(j['ytd']),
        dividend: bulletinNumber(j['dividend']),
        dividendDate: j['dividendDate'],
        yieldPercent: bulletinNumber(j['yield']),
        per: bulletinNumber(j['per']),
      );
    }).toList();
    return MarketSnapshot(
      stocks: stocks,
      asOf: d,
      indices: market.indices,
      bulletin: url,
      financialDate: d,
    );
  }

  Future<List<OfficialDocument>> documents(
    String symbol, {
    bool refresh = false,
  }) async {
    const slugs = <String, String>{
      'ABJC': 'servair-abidjan-ci',
      'BBGC': 'bbgci',
      'BICB': 'biic',
      'BICC': 'bici-ci',
      'BNBC': 'bernabe-ci',
      'BOAB': 'bank-africa-bn',
      'BOABF': 'bank-africa-bf',
      'BOAC': 'bank-africa-ci',
      'BOAM': 'bank-africa-ml',
      'BOAN': 'bank-africa-ng',
      'BOAS': 'bank-africa-sn',
      'CABC': 'sicable',
      'CBIBF': 'coris-bank-international',
      'CFAC': 'cfao-motors-ci',
      'CIEC': 'cie-ci',
      'ECOC': 'ecobank-ci',
      'ETIT': 'ecobank-tg',
      'FTSC': 'filtisac-ci',
      'LNBB': 'lnb',
      'NEIC': 'nei-ceda-ci',
      'NSBC': 'nsbc',
      'NTLC': 'nestle-ci',
      'ONTBF': 'onatel-bf',
      'ORAC': 'orange-ci',
      'ORGT': 'oragroup',
      'PALC': 'palm-ci',
      'PRSC': 'tractafric-ci',
      'SAFC': 'safca-ci',
      'SCRC': 'sucrivoire',
      'SDCC': 'sodeci',
      'SDSC': 'bollore-transport-logistics',
      'SEMC': 'crown-siem-ci',
      'SGBC': 'sgci',
      'SHEC': 'vivo-energy-ci',
      'SIBC': 'sib',
      'SICC': 'sicor',
      'SIVC': 'air-liquide-ci',
      'SLBC': 'solibra',
      'SMBC': 'smb',
      'SNTS': 'sonatel',
      'SOGC': 'sogb',
      'SPHC': 'saph-ci',
      'STAC': 'setao-ci',
      'STBC': 'sitab',
      'TTLC': 'total',
      'TTLS': 'totalenergies-marketing-sn',
      'UNLC': 'unilever-ci',
      'UNXC': 'uniwax-ci',
    };
    final slug = slugs[symbol];
    if (slug == null) {
      return [
        const OfficialDocument(
          'Tous les rapports publiés par la BRVM',
          reportsUrl,
        ),
      ];
    }
    final issuer = '$officialRoot/fr/rapports-societe-cotes/$slug';
    final p = html.parse(await page(issuer, refresh: refresh));
    final docs = <OfficialDocument>[
      OfficialDocument('Page officielle de la société', issuer),
    ];
    for (final row in p.querySelectorAll('tr, .views-row')) {
      for (final a in row.querySelectorAll('a[href]')) {
        final url = absolute(a.attributes['href']!);
        if (url.toLowerCase().contains('.pdf') &&
            officialUrl(url) &&
            !docs.any((d) => d.url == url)) {
          final title = row.text.replaceAll(RegExp(r'\s+'), ' ').trim();
          docs.add(
            OfficialDocument(
              title.length > 240 ? title.substring(0, 240) : title,
              url,
            ),
          );
        }
      }
    }
    return docs;
  }

  Future<List<OfficialDocument>> announcements() async {
    final p = html.parse(await page('$officialRoot/fr'));
    final docs = <OfficialDocument>[];
    for (final a in p.querySelectorAll('a[href]')) {
      final url = absolute(a.attributes['href']!),
          title = a.text.replaceAll(RegExp(r'\s+'), ' ').trim();
      if (officialUrl(url) &&
          title.length > 25 &&
          (url.contains('/avis') ||
              url.contains('/communiqu') ||
              url.endsWith('.pdf')) &&
          !docs.any((d) => d.url == url)) {
        docs.add(OfficialDocument(title, url));
      }
    }
    return docs.take(30).toList();
  }
}
