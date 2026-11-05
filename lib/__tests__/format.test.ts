import { describe, it, expect } from 'vitest';
import { money, moneyWhole, compactMoney, num, pct, ratio } from '../format';

describe('Site-Wide Indian Currency & Number Formatter (lib/format.ts)', () => {
  it('formats money in INR with 2 decimal places and en-IN digit grouping', () => {
    // Note: Intl formatting may use non-breaking space (U+00A0) or regular space
    const formatted = money(125450).replace(/\u00a0/g, ' ');
    expect(formatted).toBe('₹1,25,450.00');
  });

  it('formats whole money without decimals', () => {
    const formatted = moneyWhole(125450).replace(/\u00a0/g, ' ');
    expect(formatted).toBe('₹1,25,450');
  });

  it('formats compact money in Lakhs and Crores', () => {
    expect(compactMoney(250000)).toBe('₹2.50L');
    expect(compactMoney(15000000)).toBe('₹1.50Cr');
    expect(compactMoney(12500)).toBe('₹12.5K');
  });

  it('formats counts with Indian numbering grouping', () => {
    expect(num(100000)).toBe('1,00,000');
  });

  it('handles null, undefined and NaN safely with em-dash', () => {
    expect(money(null)).toBe('—');
    expect(money(undefined)).toBe('—');
    expect(money(NaN)).toBe('—');
    expect(compactMoney(null)).toBe('—');
    expect(num(null)).toBe('—');
  });

  it('formats percentages and ratios correctly', () => {
    expect(pct(25.456)).toBe('25.46%');
    expect(ratio(4.25)).toBe('4.25x');
  });
});
