import '../data/market.dart';

class BrokerSelection {
  final String name, source;
  const BrokerSelection(this.name, this.source);
  factory BrokerSelection.fromJson(Map<String, dynamic> json) {
    final name = json['name'], source = json['source'];
    if (name is! String ||
        name.trim().isEmpty ||
        name.length > 200 ||
        name.contains(RegExp(r'[\x00-\x1f]')) ||
        source is! String ||
        !officialUrl(source)) {
      throw const FormatException('SGI invalide');
    }
    final uri = Uri.parse(source);
    if (uri.path != Uri.parse(sgiUrl).path ||
        uri.queryParameters.keys.any((k) => k != 'page') ||
        (uri.queryParameters.containsKey('page') &&
            ((int.tryParse(uri.queryParameters['page']!) ?? -1) < 0 ||
                (int.tryParse(uri.queryParameters['page']!) ?? 101) > 100))) {
      throw const FormatException('Annuaire SGI invalide');
    }
    return BrokerSelection(name.trim(), source);
  }
  Map<String, dynamic> toJson() => {'name': name, 'source': source};
}
