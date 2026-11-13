import 'dart:math';
import 'package:flutter_test/flutter_test.dart';
import 'package:bourse_facile_mobile/core/simulation.dart';

void main() {
  test('Zero return conserves contributions, subtracting actual fees', () {
    final p = Projection(
      initial: 100000,
      monthly: 25000,
      years: 5,
      annualRate: 0,
      feePercent: 1,
    );
    expect(p.contributed, 1600000);
    expect(p.finalValue, closeTo(1584000, .01));
    expect(p.fees, 16000);
    expect(p.gain, closeTo(-16000, .01));
  });
  test('Annual compounding without contributions equals analytical value', () {
    final p = Projection(initial: 100000, monthly: 0, years: 10, annualRate: 5);
    expect(p.finalValue, closeTo(100000 * pow(1.05, 10), .01));
    expect(p.balances.length, 11);
  });
  test('Contributions occur at month end, not month start', () {
    final p = Projection(initial: 0, monthly: 10000, years: 1, annualRate: 12);
    final r = pow(1.12, 1 / 12) - 1;
    expect(p.finalValue, closeTo(10000 * (pow(1 + r, 12) - 1) / r, .01));
  });
  test('Loss scenarios and zero capital stay finite', () {
    expect(
      Projection(
        initial: 100000,
        monthly: 0,
        years: 1,
        annualRate: -20,
      ).finalValue,
      closeTo(80000, .01),
    );
    expect(
      Projection(initial: 0, monthly: 0, years: 30, annualRate: 0).finalValue,
      0,
    );
  });
  test('Unsafe inputs are rejected and saved assumptions roundtrip', () {
    expect(
      () => Projection(initial: -1, monthly: 0, years: 1, annualRate: 0),
      throwsArgumentError,
    );
    expect(
      () => Projection(initial: 0, monthly: 0, years: 31, annualRate: 0),
      throwsArgumentError,
    );
    expect(
      () =>
          Projection(initial: 0, monthly: 0, years: 5, annualRate: double.nan),
      throwsArgumentError,
    );
    final p = Projection(
      initial: 50000,
      monthly: 20000,
      years: 3,
      annualRate: 4,
      feePercent: 1.5,
    );
    expect(
      Projection.fromJson(p.toJson()).finalValue,
      closeTo(p.finalValue, .001),
    );
  });
}
