import 'dart:math';

class PurchaseEntry {
  final String id, symbol, companyName;
  final int quantity, unitPriceMinor;
  final DateTime recordedAt;
  const PurchaseEntry({
    required this.id,
    required this.symbol,
    required this.companyName,
    required this.quantity,
    required this.unitPriceMinor,
    required this.recordedAt,
  });
  static String newId() => List.generate(
    16,
    (_) => Random.secure().nextInt(256).toRadixString(16).padLeft(2, '0'),
  ).join();
  factory PurchaseEntry.fromJson(Map<String, dynamic> j) {
    if (j['id'] is! String ||
        !RegExp(r'^[a-f0-9]{32}$').hasMatch(j['id']) ||
        j['symbol'] is! String ||
        !RegExp(r'^[A-Z]{3,5}$').hasMatch(j['symbol']) ||
        j['companyName'] is! String ||
        j['companyName'].isEmpty ||
        j['companyName'].length > 200 ||
        j['quantity'] is! int ||
        j['quantity'] < 1 ||
        j['quantity'] > 100000000 ||
        j['unitPriceMinor'] is! int ||
        j['unitPriceMinor'] < 1 ||
        j['unitPriceMinor'] > 100000000000) {
      throw const FormatException('Achat invalide');
    }
    final date = DateTime.tryParse(j['recordedAt'] as String? ?? '');
    if (date == null) throw const FormatException('Date de saisie invalide');
    return PurchaseEntry(
      id: j['id'],
      symbol: j['symbol'],
      companyName: j['companyName'],
      quantity: j['quantity'],
      unitPriceMinor: j['unitPriceMinor'],
      recordedAt: date.toUtc(),
    );
  }
  Map<String, dynamic> toJson() => {
    'id': id,
    'symbol': symbol,
    'companyName': companyName,
    'quantity': quantity,
    'unitPriceMinor': unitPriceMinor,
    'recordedAt': recordedAt.toIso8601String(),
  };
}

int? parseUnitPrice(String raw) {
  final s = raw.trim();
  if (!RegExp(r'^\d{1,10}([,.]\d{1,2})?$').hasMatch(s)) return null;
  final parts = s.replaceAll(',', '.').split('.');
  final value =
      int.parse(parts[0]) * 100 +
      int.parse(parts.length == 1 ? '0' : parts[1].padRight(2, '0'));
  return value > 0 && value <= 100000000000 ? value : null;
}
