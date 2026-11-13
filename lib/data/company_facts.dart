import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:html/parser.dart' as html;
import 'market.dart';
import 'official_feeds.dart';

const bulletinsUrl = '$officialRoot/fr/bulletins-officiels-de-la-cote';

// Footnotes such as "704 1" are not thousands separators: reject them.
double? bulletinNumber(String? text) {
  final raw = (text ?? '').trim();
  final value = raw.startsWith(',') ? '0$raw' : raw;
  if (!RegExp(
    r'^-?(?:[0-9]+|[0-9]{1,3}(?:[ \u00a0\u202f][0-9]{3})+)(?:,[0-9]+)?$',
  ).hasMatch(value)) {
    return null;
  }
  return number(value);
}

class BulletinLink {
  final String url;
  final DateTime date;
  const BulletinLink(this.url, this.date);
}

List<BulletinLink> bulletinLinks(String body) {
  final links = <BulletinLink>[];
  for (final a in html.parse(body).querySelectorAll('a[href]')) {
    final url = absolute(a.attributes['href']!);
    final m = RegExp(
      r'/boc_(\d{4})(\d{2})(\d{2})(?:_[0-9]+)*\.pdf$',
      caseSensitive: false,
    ).firstMatch(Uri.parse(url).path);
    if (!officialUrl(url) || m == null) continue;
    final y = int.parse(m[1]!),
        month = int.parse(m[2]!),
        day = int.parse(m[3]!);
    final date = DateTime.utc(y, month, day);
    if (date.year != y ||
        date.month != month ||
        date.day != day ||
        date.isAfter(DateTime.now().toUtc())) {
      continue;
    }
    if (!links.any((l) => l.date == date)) links.add(BulletinLink(url, date));
  }
  links.sort((a, b) => b.date.compareTo(a.date));
  return links;
}

class OfficialBulletin {
  final String url;
  final DateTime date;
  final Map<String, dynamic> rows;
  const OfficialBulletin(this.url, this.date, this.rows);
}

/// An annual observation is a reviewed transcription of a specific public report,
/// not an estimate or a rolling live feed. Unknown issuers remain unavailable.
class AnnualObservation {
  final Map<String, dynamic> data;
  AnnualObservation(this.data);
  int get year => data['year'] as int;
  double get eps => (data['eps'] as num).toDouble();
  double get profit => (data['parentProfitMillions'] as num).toDouble();
  double get equity => (data['parentEquityMillions'] as num).toDouble();
  double get priorEquity =>
      (data['priorParentEquityMillions'] as num).toDouble();
  double get roe => profit / ((equity + priorEquity) / 2) * 100;
  String get source => data['source'] as String;
  String get actionSource => data['actionSource'] as String;
  DateTime get effective => DateTime.parse(data['splitEffective'] as String);
  double factorAt(DateTime date) =>
      date.isBefore(effective) ? 1 : (data['splitFactor'] as num).toDouble();
  double epsAt(DateTime date) => eps / factorAt(date);
  double bookValueAt(DateTime date) =>
      equity *
      1000000 /
      ((data['originalShares'] as num).toDouble() * factorAt(date));
  double pbr(double price, DateTime date) => price / bookValueAt(date);
}

Future<AnnualObservation?> annualObservation(String symbol) async {
  final json =
      jsonDecode(
            await rootBundle.loadString(
              'assets/content/annual_observations.json',
            ),
          )
          as Map<String, dynamic>;
  final row = json[symbol];
  if (row is! Map) return null;
  final data = Map<String, dynamic>.from(row);
  if (!officialUrl(data['source'] as String? ?? '') ||
      !officialUrl(data['actionSource'] as String? ?? '')) {
    return null;
  }
  return AnnualObservation(data);
}

class CompanyFacts {
  final OfficialBulletin? bulletin;
  final AnnualObservation? annual;
  final List<DividendNotice> notices;
  final bool dividendHistoryComplete;
  const CompanyFacts({
    this.bulletin,
    this.annual,
    this.notices = const [],
    this.dividendHistoryComplete = false,
  });
}

String issuerKey(String text) {
  var s = text.toUpperCase();
  const accents = {
    'É': 'E',
    'È': 'E',
    'Ê': 'E',
    'Ë': 'E',
    'À': 'A',
    'Â': 'A',
    'Î': 'I',
    'Ï': 'I',
    'Ô': 'O',
    'Û': 'U',
    'Ù': 'U',
    'Ç': 'C',
  };
  accents.forEach((a, b) => s = s.replaceAll(a, b));
  s = s.replaceAll(RegExp('[^A-Z0-9]'), '');
  const countries = {
    'COTEDIVOIRE': 'CI',
    'BURKINAFASO': 'BF',
    'SENEGAL': 'SN',
    'BENIN': 'BN',
    'NIGER': 'NG',
    'MALI': 'ML',
    'TOGO': 'TG',
  };
  countries.forEach((full, code) => s = s.replaceAll(full, code));
  return s;
}

bool sameIssuer(Stock stock, String issuer) {
  final key = issuerKey(issuer);
  const aliases = <String, List<String>>{
    // Exact aliases observed in the BRVM payment register (12/11/2026).
    'BICB': ['BIIC'],
    'CBIBF': ['CORISBANKINTERNATIONAL'],
    'ETIT': ['ECOBANKTG'],
    'LNBB': ['LNB'],
    'NSBC': ['NSBC'],
    'CABC': ['SICABLE'],
    'PRSC': ['TRACTAFRICCI'],
    'SGBC': ['SGCI'],
    'SIBC': ['SIB'],
    'SLBC': ['SOLIBRA'],
    'SMBC': ['SMB'],
    'SOGC': ['SOGB'],
    'STBC': ['SITAB'],
    'TTLC': ['TOTAL'],
    'TTLS': ['TOTALSNSA'],
    'SNTS': ['SONATEL', 'SONATELSN'],
    'ONTBF': ['ONATELBF', 'ONATEL'],
    'SDSC': [
      'BOLLORETRANSPORTLOGISTICS',
      'BOLLORETRANSPORTLOGISTICSCI',
      'AGLCI',
      'AFRICAGLOBALLOGISTICSCI',
    ],
  };
  return key == issuerKey(stock.name) ||
      (aliases[stock.symbol]?.contains(key) ?? false);
}

extension CompanyResearch on MarketRepository {
  Future<OfficialBulletin> latestBulletin({DateTime? onDate}) async {
    final links = bulletinLinks(await page(bulletinsUrl));
    final eligible = links
        .where(
          (l) =>
              onDate == null ||
              l.date == DateTime.utc(onDate.year, onDate.month, onDate.day),
        )
        .take(3);
    for (final link in eligible) {
      try {
        final pdf = await readPdf(link.url);
        final text = pdf['text'] as String? ?? '';
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
        final d = link.date;
        final header = text.length > 1600 ? text.substring(0, 1600) : text;
        if (!RegExp(
          '${d.day}\\s+${months[d.month - 1]}\\s+${d.year}',
          caseSensitive: false,
        ).hasMatch(header)) {
          continue;
        }
        final rows = Map<String, dynamic>.from(pdf['rows'] as Map? ?? {});
        if (rows.length < 30) continue;
        return OfficialBulletin(link.url, d, rows);
      } catch (_) {
        /* Try another published link, never invent a URL. */
      }
    }
    throw const FormatException('Bulletin officiel daté indisponible');
  }

  Future<CompanyFacts> companyFacts(Stock stock) async {
    // Failures are isolated: an unavailable PDF must not hide dividend notices.
    final bulletin = latestBulletin().then<OfficialBulletin?>(
      (v) => v,
      onError: (_) => null,
    );
    final annual = annualObservation(stock.symbol);
    final notices = <DividendNotice>[];
    var complete = false;
    final pages = await Future.wait(
      List.generate(6, (index) async {
        try {
          return await OfficialFeeds(this).dividends(index);
        } catch (_) {
          return null;
        }
      }),
    );
    for (var i = 0; i < pages.length; i++) {
      final feed = pages[i];
      if (feed == null) continue;
      for (final notice in feed.items.where(
        (n) => sameIssuer(stock, n.issuer),
      )) {
        if (!notices.any((n) => n.noticeUrl == notice.noticeUrl)) {
          notices.add(notice);
        }
      }
      if (!feed.hasNext && pages.take(i + 1).every((p) => p != null)) {
        complete = true;
      }
    }
    notices.sort((a, b) => b.paymentDate.compareTo(a.paymentDate));
    return CompanyFacts(
      bulletin: await bulletin,
      annual: await annual,
      notices: notices,
      dividendHistoryComplete: complete,
    );
  }
}
