import 'package:html/dom.dart' as dom;
import 'package:html/parser.dart' as html;
import 'market.dart';

const dividendsUrl = '$officialRoot/fr/esv/paiement-de-dividendes';
const noticesUrl = '$officialRoot/fr/marche/avis-et-publications/avis';
const newsUrl = '$officialRoot/fr/mediacentre/actualites';
const tariffsUrl = '$officialRoot/fr/textes-reglementaires/tarification';
const meetingsUrl =
    '$officialRoot/fr/emetteurs/type-annonces/convocations-assemblees-generales';
const holidaysUrl = '$officialRoot/fr/jours-feries';
String cleanText(String value) => value.replaceAll(RegExp(r'\s+'), ' ').trim();
DateTime? publishedDate(dom.Element? element) {
  final value = element?.querySelector('[content]')?.attributes['content'];
  return value == null ? null : DateTime.tryParse(value)?.toUtc();
}

DateTime? numericDate(String value) {
  final match = RegExp(r'\b(\d{2})/(\d{2})/(\d{4})\b').firstMatch(value);
  if (match == null) return null;
  final d = int.parse(match[1]!),
      m = int.parse(match[2]!),
      y = int.parse(match[3]!);
  final date = DateTime.utc(y, m, d);
  return date.year == y && date.month == m && date.day == d ? date : null;
}

class OfficialEntry {
  final String title, url, source, summary;
  final DateTime? date;
  const OfficialEntry(
    this.title,
    this.url,
    this.source, {
    this.date,
    this.summary = '',
  });
  OfficialDocument get document => OfficialDocument(title, url);
}

class FeedPage<T> {
  final List<T> items;
  final bool hasNext;
  const FeedPage(this.items, this.hasNext);
}

class DividendNotice {
  final String issuer, noticeUrl;
  final int year;
  final double netPerShare;
  final DateTime paymentDate;
  final DateTime? exDate;
  const DividendNotice({
    required this.issuer,
    required this.noticeUrl,
    required this.year,
    required this.netPerShare,
    required this.paymentDate,
    this.exDate,
  });
}

FeedPage<DividendNotice> parseDividendNotices(String body) {
  final p = html.parse(body);
  final result = <DividendNotice>[];
  for (final row in p.querySelectorAll('tr')) {
    String cell(String cls) =>
        cleanText(row.querySelector('.$cls')?.text ?? '');
    final issuer = cell('views-field-field-emetteur-esv');
    final year = int.tryParse(cell('views-field-field-exercice-comptable-esv'));
    final net = number(
      cell(
        'views-field-field-montant-du-dividende-net',
      ).replaceAll(RegExp(r'FCFA|F\s*CFA|XOF', caseSensitive: false), ''),
    );
    final payment = publishedDate(
      row.querySelector('.views-field-field-date-de-paiement-esv'),
    );
    final ex = publishedDate(
      row.querySelector('.views-field-field-date-ex-dividende'),
    );
    final href = row
        .querySelector('.views-field-field-avis-dividende-esv a[href]')
        ?.attributes['href'];
    if (issuer.isEmpty ||
        issuer.length > 200 ||
        year == null ||
        year < 1997 ||
        year > 2100 ||
        net == null ||
        net < 0 ||
        payment == null ||
        href == null) {
      continue;
    }
    final url = absolute(href);
    if (!officialUrl(url) ||
        !Uri.parse(url).path.toLowerCase().endsWith('.pdf') ||
        result.any((r) => r.noticeUrl == url)) {
      continue;
    }
    result.add(
      DividendNotice(
        issuer: issuer,
        noticeUrl: url,
        year: year,
        netPerShare: net,
        paymentDate: payment,
        exDate: ex,
      ),
    );
  }
  return FeedPage(result, p.querySelector('.pager-next a, li.next a') != null);
}

FeedPage<OfficialEntry> parseOfficialDocuments(String body, String source) {
  if (!officialUrl(source)) {
    throw const FormatException('Source officielle requise');
  }
  final p = html.parse(body);
  final result = <OfficialEntry>[];
  for (final row in p.querySelectorAll('tr')) {
    final anchor = row.querySelector('a[href*=".pdf"]');
    if (anchor == null) continue;
    final url = absolute(anchor.attributes['href']!);
    final title = cleanText(
      row.querySelector('.views-field-title, .views-field-nothing')?.text ??
          row.text.replaceAll('Télécharger', ''),
    );
    final dateElement = row.querySelector(
      '.views-field-field-date-avis, .views-field-field-date-texte, .views-field-field-date-annonce',
    );
    if (title.length < 8 ||
        !officialUrl(url) ||
        !Uri.parse(url).path.toLowerCase().endsWith('.pdf') ||
        result.any((r) => r.url == url)) {
      continue;
    }
    result.add(
      OfficialEntry(
        title.length > 500 ? title.substring(0, 500) : title,
        url,
        source,
        date: publishedDate(dateElement),
      ),
    );
  }
  return FeedPage(result, p.querySelector('.pager-next a, li.next a') != null);
}

FeedPage<OfficialEntry> parseOfficialNews(String body) {
  final p = html.parse(body);
  final result = <OfficialEntry>[];
  for (final row in p.querySelectorAll('.view-content .views-row')) {
    final content = row.querySelector('.views-field-nothing .field-content');
    final link = content?.querySelector('a[href*="/mediacentre/actualites/"]');
    if (content == null || link == null) continue;
    final url = absolute(link.attributes['href']!);
    final title = cleanText(
      content.nodes.whereType<dom.Text>().map((n) => n.data).join(' '),
    );
    if (!officialUrl(url) ||
        title.length < 8 ||
        result.any((r) => r.url == url)) {
      continue;
    }
    final summary = cleanText(
      content.querySelectorAll('p').map((p) => p.text).join(' '),
    );
    result.add(
      OfficialEntry(
        title,
        url,
        newsUrl,
        summary: summary.length > 600 ? summary.substring(0, 600) : summary,
      ),
    );
  }
  return FeedPage(result, p.querySelector('.pager-next a, li.next a') != null);
}

List<(DateTime, String)> parseOfficialHolidays(String body) {
  final result = <(DateTime, String)>[];
  for (final row in html.parse(body).querySelectorAll('tr')) {
    final cells = row.querySelectorAll('td');
    if (cells.length != 2) continue;
    final date = numericDate(cells[0].text), label = cleanText(cells[1].text);
    if (date != null && label.isNotEmpty) {
      result.add((
        date,
        '$label${cells[0].text.contains('*') ? ' · date susceptible de modification selon la source' : ''}',
      ));
    }
  }
  return result;
}

class BrokerEntry {
  final String name, details, source;
  const BrokerEntry(this.name, this.details, this.source);
}

FeedPage<BrokerEntry> parseOfficialBrokers(String body, String source) {
  if (!officialUrl(source)) throw const FormatException();
  final p = html.parse(body);
  final result = <BrokerEntry>[];
  for (final row in p.querySelectorAll('.view-content .views-row')) {
    final block = row.querySelector('.views-field-nothing .field-content');
    final name = cleanText(block?.children.firstOrNull?.text ?? '');
    if (name.isEmpty || name.length > 200) continue;
    result.add(
      BrokerEntry(
        name,
        cleanText(row.querySelector('.bloc_country')?.text ?? ''),
        source,
      ),
    );
  }
  return FeedPage(result, p.querySelector('.pager-next a, li.next a') != null);
}

class OfficialFeeds {
  final MarketRepository repository;
  OfficialFeeds(this.repository);
  String pageUrl(String base, int page) {
    if (page < 0 || page > 100) throw ArgumentError('Page hors limites');
    return page == 0 ? base : '$base?page=$page';
  }

  Future<FeedPage<DividendNotice>> dividends(int page) async =>
      parseDividendNotices(await repository.page(pageUrl(dividendsUrl, page)));
  Future<FeedPage<OfficialEntry>> documents(String source, int page) async =>
      parseOfficialDocuments(
        await repository.page(pageUrl(source, page)),
        source,
      );
  Future<FeedPage<OfficialEntry>> news(int page) async =>
      parseOfficialNews(await repository.page(pageUrl(newsUrl, page)));
  Future<FeedPage<BrokerEntry>> brokers(int page) async {
    final url = pageUrl(sgiUrl, page);
    return parseOfficialBrokers(await repository.page(url), url);
  }
}
