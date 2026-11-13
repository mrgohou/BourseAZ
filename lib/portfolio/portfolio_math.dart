import 'purchase.dart';

// Standard financial calculations. Amounts are exact integer hundredths of FCFA.
// A weighted average is a ratio: never round it before computing total gains.
BigInt investment(PurchaseEntry p) =>
    BigInt.from(p.quantity) * BigInt.from(p.unitPriceMinor);
BigInt roundRatio(BigInt numerator, BigInt denominator) {
  if (denominator <= BigInt.zero) {
    throw ArgumentError('Positive denominator required');
  }
  final sign = numerator.isNegative ? -BigInt.one : BigInt.one;
  return ((numerator.abs() + denominator ~/ BigInt.two) ~/ denominator) * sign;
}

String amount(BigInt minor, {bool signed = false}) {
  final absolute = minor.abs();
  final whole = (absolute ~/ BigInt.from(100)).toString();
  final grouped = whole.replaceAllMapped(
    RegExp(r'\B(?=(\d{3})+(?!\d))'),
    (_) => '\u202f',
  );
  final cents = (absolute % BigInt.from(100)).toString().padLeft(2, '0');
  return '${minor.isNegative
      ? '−'
      : signed && minor > BigInt.zero
      ? '+'
      : ''}$grouped${cents == '00' ? '' : ',$cents'}';
}

String percentage(BigInt gain, BigInt invested) {
  if (invested <= BigInt.zero) return 'Non calculable';
  final hundredths = roundRatio(gain * BigInt.from(10000), invested);
  return '${amount(hundredths, signed: true)} %';
}

class PortfolioPosition {
  final String symbol, name;
  final List<PurchaseEntry> purchases;
  final int? currentPriceMinor;
  PortfolioPosition(
    this.symbol,
    this.name,
    this.purchases,
    this.currentPriceMinor,
  );
  int get quantity => purchases.fold(0, (n, p) => n + p.quantity);
  BigInt get invested =>
      purchases.fold<BigInt>(BigInt.zero, (n, p) => n + investment(p));
  BigInt get averageRounded => roundRatio(invested, BigInt.from(quantity));
  BigInt? get value => currentPriceMinor == null
      ? null
      : BigInt.from(currentPriceMinor!) * BigInt.from(quantity);
  BigInt? get gain => value == null ? null : value! - invested;
  BigInt? get perShareGainRounded =>
      gain == null ? null : roundRatio(gain!, BigInt.from(quantity));
}

List<PortfolioPosition> consolidate(
  List<PurchaseEntry> entries,
  Map<String, int> prices,
  Map<String, String> names,
) {
  final grouped = <String, List<PurchaseEntry>>{};
  for (final p in entries) {
    grouped.putIfAbsent(p.symbol, () => []).add(p);
  }
  final symbols = grouped.keys.toList()..sort();
  return symbols
      .map(
        (s) => PortfolioPosition(
          s,
          names[s] ?? grouped[s]!.first.companyName,
          List.unmodifiable(grouped[s]!),
          prices[s],
        ),
      )
      .toList();
}

class PortfolioTotals {
  final List<PortfolioPosition> positions;
  const PortfolioTotals(this.positions);
  int get quantity => positions.fold(0, (n, p) => n + p.quantity);
  BigInt get invested =>
      positions.fold<BigInt>(BigInt.zero, (n, p) => n + p.invested);
  int get missingPrices =>
      positions.where((p) => p.currentPriceMinor == null).length;
  BigInt? get value => missingPrices > 0
      ? null
      : positions.fold<BigInt>(BigInt.zero, (n, p) => n + p.value!);
  BigInt? get gain => value == null ? null : value! - invested;
}
