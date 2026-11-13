import 'package:flutter_test/flutter_test.dart';
import 'package:bourse_facile_mobile/portfolio/portfolio_math.dart';
import 'package:bourse_facile_mobile/portfolio/purchase.dart';

PurchaseEntry buy(String symbol, int quantity, int price, {String? id}) =>
    PurchaseEntry(
      id: id ?? PurchaseEntry.newId(),
      symbol: symbol,
      companyName: symbol,
      quantity: quantity,
      unitPriceMinor: price,
      recordedAt: DateTime.utc(2026, 11, 11),
    );
void main() {
  test('One purchase keeps the unit purchase price as the average', () {
    final p = consolidate(
      [buy('SNTS', 10, 400000)],
      {'SNTS': 450000},
      {},
    ).single;
    expect(p.invested, BigInt.from(4000000));
    expect(p.averageRounded, BigInt.from(400000));
    expect(p.perShareGainRounded, BigInt.from(50000));
    expect(p.gain, BigInt.from(500000));
    expect(percentage(p.gain!, p.invested), '+12,50 %');
  });
  test('Several purchases use a quantity-weighted average', () {
    final p = consolidate(
      [buy('SNTS', 10, 400000), buy('SNTS', 20, 500000)],
      {'SNTS': 600000},
      {},
    ).single;
    expect(p.quantity, 30);
    expect(p.invested, BigInt.from(14000000));
    expect(p.averageRounded, BigInt.from(466667));
    expect(p.gain, BigInt.from(4000000));
  });
  test('Total gains never multiply a previously rounded average', () {
    final p = consolidate(
      [buy('SNTS', 1, 100), buy('SNTS', 2, 200)],
      {'SNTS': 200},
      {},
    ).single;
    expect(p.averageRounded, BigInt.from(167));
    expect(p.gain, BigInt.from(100));
    expect(p.perShareGainRounded, BigInt.from(33));
    expect(p.perShareGainRounded! * BigInt.from(p.quantity), isNot(p.gain));
  });
  test(
    'Different issuers are consolidated separately and total gains are summed',
    () {
      final list = consolidate(
        [
          buy('SNTS', 10, 400000),
          buy('ORAC', 2, 2000000),
          buy('SNTS', 5, 500000),
        ],
        {'SNTS': 450000, 'ORAC': 1900000},
        {},
      );
      expect(list.length, 2);
      final totals = PortfolioTotals(list);
      expect(totals.quantity, 17);
      expect(totals.invested, BigInt.from(10500000));
      expect(totals.value, BigInt.from(10550000));
      expect(totals.gain, BigInt.from(50000));
    },
  );
  test(
    'Missing market prices do not become zero or a misleading total gain',
    () {
      final list = consolidate(
        [buy('SNTS', 10, 400000), buy('ORAC', 2, 2000000)],
        {'SNTS': 450000},
        {},
      );
      final totals = PortfolioTotals(list);
      expect(totals.invested, BigInt.from(8000000));
      expect(totals.missingPrices, 1);
      expect(totals.value, isNull);
      expect(totals.gain, isNull);
    },
  );
  test('Negative and zero gains remain correct', () {
    final p = consolidate(
      [buy('SNTS', 10, 400000)],
      {'SNTS': 300000},
      {},
    ).single;
    expect(p.gain, BigInt.from(-1000000));
    expect(percentage(p.gain!, p.invested), '−25 %');
    final z = consolidate(
      [buy('SNTS', 1, 400000)],
      {'SNTS': 400000},
      {},
    ).single;
    expect(z.gain, BigInt.zero);
    expect(percentage(z.gain!, z.invested), '0 %');
  });
  test(
    'Large monetary amounts exceed 64-bit safely without precision loss',
    () {
      final list = List.generate(
        500,
        (_) => buy('SNTS', 100000000, 100000000000),
      );
      final p = consolidate(list, {'SNTS': 100000000001}, {}).single;
      expect(p.invested, BigInt.parse('5000000000000000000000'));
      expect(p.gain, BigInt.from(50000000000));
      expect(amount(p.gain!), '500\u202f000\u202f000');
    },
  );
}
