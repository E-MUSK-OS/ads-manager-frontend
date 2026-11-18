import { describe, it, expect } from 'vitest';
import { money, compactMoney, num, pct, ratio } from '@/lib/format';
import {
  calculateMaxEffectiveBid,
  isDeltaFavorable,
} from '@/components/campaigns/wizard/helpers';
import { getX, getY, formatDataLabelValue, computePointChange } from '@/components/campaigns/PerformanceChart';

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

  it('D6 View Data Labels: formats data label values accurately by metric unit', () => {
    // Money: Indian whole number format or compact
    expect(formatDataLabelValue(1250, 'spend')).toContain('1,250');
    expect(formatDataLabelValue(150000, 'sales')).toBe('₹1.50L');
    expect(formatDataLabelValue(45.5, 'cpc')).toContain('45.50');

    // Percentages
    expect(formatDataLabelValue(22.5, 'acos')).toBe('22.5%');
    expect(formatDataLabelValue(2.34, 'ctr')).toBe('2.3%');

    // Ratios
    expect(formatDataLabelValue(4.567, 'roas')).toBe('4.57x');

    // Counts
    expect(formatDataLabelValue(540, 'clicks')).toBe('540');
  });

  it('D6 View Changes: computes stock-market style % changes vs previous point by direction only', () => {
    const mockData = [
      { bucket: '2026-11-01', spend: 100, sales: 500 },
      { bucket: '2026-11-02', spend: 150, sales: 400 },
      { bucket: '2026-11-03', spend: 150, sales: 400 },
    ];

    // Index 0: First point has no previous point
    expect(computePointChange(mockData, 'spend', 0)).toBeNull();

    // Index 1: Spend up 100 -> 150 = +50.0% (green ▲)
    const spendChange = computePointChange(mockData, 'spend', 1);
    expect(spendChange?.symbol).toBe('▲');
    expect(spendChange?.text).toBe('▲ +50.0%');
    expect(spendChange?.color).toBe('#16a34a'); // Green

    // Index 1: Sales down 500 -> 400 = -20.0% (red ▼)
    const salesChange = computePointChange(mockData, 'sales', 1);
    expect(salesChange?.symbol).toBe('▼');
    expect(salesChange?.text).toBe('▼ -20.0%');
    expect(salesChange?.color).toBe('#dc2626'); // Red

    // Index 2: Spend unchanged 150 -> 150 = 0% (slate —)
    const flatChange = computePointChange(mockData, 'spend', 2);
    expect(flatChange?.symbol).toBe('—');
    expect(flatChange?.text).toBe('0%');
    expect(flatChange?.color).toBe('#64748b'); // Slate
  });
});

