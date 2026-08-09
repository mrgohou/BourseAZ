import { describe, it, expect } from 'vitest';
import { calculatePER, calculateDividendYield, runQuickSimulation } from '../../src/lib/calculations';
import { formatFCFA, formatPercent } from '../../src/lib/formatters';

describe('BourseClair Calculations Unit Tests', () => {
  it('should calculate PER accurately for positive EPS', () => {
    const res = calculatePER(16500, 1850);
    expect(res.status).toBe('VALID');
    expect(res.per).toBe(8.92);
  });

  it('should handle negative EPS correctly without calculating PER', () => {
    const res = calculatePER(1400, -280);
    expect(res.status).toBe('NEGATIVE_EPS');
    expect(res.per).toBeNull();
  });

  it('should handle missing EPS gracefully', () => {
    const res = calculatePER(1000, null);
    expect(res.status).toBe('MISSING_DATA');
    expect(res.per).toBeNull();
  });

  it('should calculate dividend yield correctly', () => {
    const yieldPct = calculateDividendYield(16500, 1575);
    expect(yieldPct).toBe(9.55);
  });

  it('should calculate quick simulation with dividend reinvestment', () => {
    const sim = runQuickSimulation({
      symbol: 'SNTS',
      companyName: 'Sonatel Sénégal',
      initialAmount: 250000,
      initialPrice: 15000,
      finalPrice: 16500,
      startDate: '2025-01-01',
      endDate: '2026-01-01',
      dividendMode: 'REINVEST',
      dividendsPerShareInPeriod: 1500,
    });

    expect(sim.sharesBought).toBeGreaterThan(16);
    expect(sim.finalValue).toBeGreaterThan(250000);
    expect(sim.performancePercent).toBeGreaterThan(10);
  });

  it('should format FCFA currency with French spaces', () => {
    expect(formatFCFA(15400)).toContain('15');
    expect(formatFCFA(15400)).toContain('FCFA');
  });

  it('should format percentage with plus sign', () => {
    expect(formatPercent(12.34)).toBe('+12,34 %');
    expect(formatPercent(-5.1)).toBe('-5,10 %');
  });
});
