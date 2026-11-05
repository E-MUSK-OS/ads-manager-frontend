import { describe, it, expect } from 'vitest';
import { money, compactMoney, num, pct, ratio } from '@/lib/format';
import {
  calculateMaxEffectiveBid,
  isDeltaFavorable,
} from '@/components/campaigns/wizard/helpers';
import { getX, getY } from '@/components/campaigns/PerformanceChart';

describe('Phase 4A: Strict Indian Formatting & Math Helpers', () => {
  it('formats Indian currency properly with ₹ symbol and en-IN digit grouping', () => {
    // Normal positive money with Indian lakhs separator
    const res = money(125450);
    // Remove narrow no-break space if any in Node Intl
    const cleanRes = res.replace(/\u00a0/g, ' ').replace(/\u202f/g, ' ');
    expect(cleanRes).toBe('₹1,25,450.00');

    expect(money(null)).toBe('—');
    expect(money(undefined)).toBe('—');
    expect(money(NaN)).toBe('—');
  });

  it('formats compact money in Lakhs and Crores notation', () => {
    expect(compactMoney(15000000)).toBe('₹1.50Cr');
    expect(compactMoney(150000)).toBe('₹1.50L');
    expect(compactMoney(12500)).toBe('₹12.5K');
    expect(compactMoney(null)).toBe('—');
  });

  it('formats numbers with Indian grouping and derived ratios', () => {
    const numClean = num(125000).replace(/\u00a0/g, ' ').replace(/\u202f/g, ' ');
    expect(numClean).toBe('1,25,000');
    expect(pct(25.456, 2)).toBe('25.46%');
    expect(ratio(4.567, 2)).toBe('4.57x');
  });

  it('calculates compound auction max effective bid correctly', () => {
    // ₹15 base bid + 100% Top of Search + UP_AND_DOWN dynamic factor (2.0) = 15 * 2.0 * 2.0 = 60.0
    expect(calculateMaxEffectiveBid(15.0, 100, 'UP_AND_DOWN', 'TOP_OF_SEARCH')).toBe(60.0);

    // ₹15 base bid + 50% Product Pages + DOWN_ONLY dynamic factor (1.0) = 15 * 1.5 * 1.0 = 22.5
    expect(calculateMaxEffectiveBid(15.0, 50, 'DOWN_ONLY', 'PRODUCT_PAGES')).toBe(22.5);

    // Clamp placement pct within 0 - 900
    expect(calculateMaxEffectiveBid(10.0, 1000, 'FIXED', 'REST_OF_SEARCH')).toBe(100.0);
  });

  it('evaluates polarity-aware delta favorability correctly', () => {
    // ACOS & CPC: lower is favorable
    expect(isDeltaFavorable('acos', -5.0)).toBe(true);
    expect(isDeltaFavorable('acos', 5.0)).toBe(false);
    expect(isDeltaFavorable('cpc', -2.0)).toBe(true);
    expect(isDeltaFavorable('cpc', 2.0)).toBe(false);

    // Sales, ROAS, Orders: higher is favorable
    expect(isDeltaFavorable('sales', 12.0)).toBe(true);
    expect(isDeltaFavorable('sales', -12.0)).toBe(false);
    expect(isDeltaFavorable('roas', 0.5)).toBe(true);
    expect(isDeltaFavorable('orders', 10)).toBe(true);
    expect(isDeltaFavorable('spend', 0)).toBe(true);
  });

  it('guards against NaN on single-day and zero-value chart ranges', () => {
    // When total points <= 1 (single-day range e.g. Today or Yesterday)
    const x = getX(0, 1, 600, 20);
    expect(Number.isNaN(x)).toBe(false);
    expect(x).toBe(20 + 600 / 2); // Perfectly centered!

    // Zero maxValue must never produce NaN or division by zero
    const yZero = getY(0, 0, 300, 10);
    expect(Number.isNaN(yZero)).toBe(false);
    expect(yZero).toBe(310); // padTop + plotHeight
  });
});

