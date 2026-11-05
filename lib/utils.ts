import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { money, pct, num } from "./format"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  val: number | null | undefined,
  _currency: string = "INR",
  _locale: string = "en-IN"
): string {
  void _currency;
  void _locale;
  return money(val);
}

export function formatPct(val: number | null | undefined): string {
  return pct(val, 1);
}

export function formatNumber(
  val: number | null | undefined,
  _maxDecimals: number = 0
): string {
  void _maxDecimals;
  return num(val);
}
