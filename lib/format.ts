// lib/format.ts
const INR_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const INR_WHOLE_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const IN_NUM_FORMATTER = new Intl.NumberFormat("en-IN");

export function money(
  value: number | null | undefined,
  _currencyOrRules?: string | unknown,
  _locale?: string
): string {
  void _currencyOrRules;
  void _locale;
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }
  return INR_FORMATTER.format(Number(value));
}

export function moneyWhole(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }
  return INR_WHOLE_FORMATTER.format(Math.round(Number(value)));
}

export function compactMoney(
  value: number | null | undefined,
  symbol: string = "₹"
): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }
  const rawSymbol = symbol;
  if (process.env.NODE_ENV !== "production" && (rawSymbol === "$" || rawSymbol === "USD")) {
    console.warn("Non-INR currency symbol passed; displaying ₹ instead. Fix the caller.");
  }
  const cleanSymbol =
    !symbol || symbol === "$" || symbol === "USD" ? "₹" : symbol;
  const n = Number(value);
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_00_00_000) {
    return `${sign}${cleanSymbol}${(abs / 1_00_00_000).toFixed(2)}Cr`;
  }
  if (abs >= 1_00_000) {
    return `${sign}${cleanSymbol}${(abs / 1_00_000).toFixed(2)}L`;
  }
  if (abs >= 1_000) {
    return `${sign}${cleanSymbol}${(abs / 1_000).toFixed(1)}K`;
  }
  return INR_FORMATTER.format(n);
}

export function num(
  value: number | null | undefined,
  _locale: string = "en-IN"
): string {
  void _locale;
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }
  return IN_NUM_FORMATTER.format(Math.round(Number(value)));
}

export function pct(
  value: number | null | undefined,
  digits: number = 2
): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }
  return `${Number(value).toFixed(digits)}%`;
}

export function ratio(
  value: number | null | undefined,
  digits: number = 2
): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }
  return `${Number(value).toFixed(digits)}x`;
}

export const currency = money;
export const indianCompactNumber = compactMoney;

const IST = "Asia/Kolkata";

export function formatDateIN(value: string | number | Date | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { timeZone: IST, day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTimeIN(value: string | number | Date | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", { timeZone: IST, day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
