import 'dart:math';

/// Educational projection: monthly contributions at month end, effective annual
/// nominal return, fees charged on each contribution. This is not an order engine.
class Projection {
  final int initial, monthly, years;
  final double annualRate, feePercent;
  late final List<double> balances = _calculate();
  Projection({
    required this.initial,
    required this.monthly,
    required this.years,
    required this.annualRate,
    this.feePercent = 0,
  }) {
    if (initial < 0 ||
        initial > 1000000000 ||
        monthly < 0 ||
        monthly > 10000000 ||
        years < 1 ||
        years > 30 ||
        !annualRate.isFinite ||
        annualRate < -50 ||
        annualRate > 30 ||
        !feePercent.isFinite ||
        feePercent < 0 ||
        feePercent > 10) {
      throw ArgumentError('Hypothèses hors limites');
    }
  }
  int get contributed => initial + monthly * years * 12;
  double get finalValue => balances.last;
  double get gain => finalValue - contributed;
  double get fees => contributed * feePercent / 100;
  List<double> _calculate() {
    final rate = pow(1 + annualRate / 100, 1 / 12) - 1;
    final net = 1 - feePercent / 100;
    double value = initial * net;
    final result = <double>[value];
    for (var month = 1; month <= years * 12; month++) {
      value = value * (1 + rate) + monthly * net;
      if (month % 12 == 0) result.add(value);
    }
    return result;
  }

  Map<String, dynamic> toJson() => {
    'initial': initial,
    'monthly': monthly,
    'years': years,
    'annualRate': annualRate,
    'feePercent': feePercent,
  };
  factory Projection.fromJson(Map<String, dynamic> j) => Projection(
    initial: j['initial'] as int,
    monthly: j['monthly'] as int,
    years: j['years'] as int,
    annualRate: (j['annualRate'] as num).toDouble(),
    feePercent: (j['feePercent'] as num).toDouble(),
  );
}
