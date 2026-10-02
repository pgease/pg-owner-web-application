/**
 * PG Ease Standard Formatters
 *
 * Rules:
 * - Currency: ₹ with Indian grouping (₹1,77,000) via Intl.NumberFormat('en-IN')
 * - Numbers: Tabular numerals, clean counts
 * - Ordinals: 1st, 2nd, 3rd, 4th, 5th, etc. (never "5st")
 * - Dates: Consistent DD MMM YYYY or DD MMM
 */

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrRawFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

/** Formats a numeric value into Indian currency string, e.g. ₹1,77,000 */
export function formatINR(val?: number | string | null): string {
  if (val === undefined || val === null || val === "") return "₹0";
  const num = typeof val === "number" ? val : Number(val);
  if (!Number.isFinite(num)) return "₹0";
  return inrFormatter.format(num);
}

/** Formats a raw number with Indian comma grouping without currency symbol, e.g. 1,77,000 */
export function formatIndianNumber(val?: number | string | null): string {
  if (val === undefined || val === null || val === "") return "0";
  const num = typeof val === "number" ? val : Number(val);
  if (!Number.isFinite(num)) return "0";
  return inrRawFormatter.format(num);
}

/** Returns the correct English ordinal suffix: 1st, 2nd, 3rd, 4th, 5th... */
export function getOrdinalSuffix(n: number): string {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
}

/** Returns formatted ordinal day string, e.g. "5th" */
export function formatOrdinalDay(day: number | string): string {
  const d = typeof day === "number" ? day : parseInt(day, 10);
  if (isNaN(d) || d < 1 || d > 31) return String(day);
  return `${d}${getOrdinalSuffix(d)}`;
}

/** Standard date formatter: e.g. "05 Oct 2026" */
export function formatDate(dateInput?: string | Date | number | null): string {
  if (!dateInput) return "—";
  try {
    const d = typeof dateInput === "object" ? dateInput : new Date(dateInput);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

/** Short date formatter: e.g. "05 Oct" */
export function formatShortDate(dateInput?: string | Date | number | null): string {
  if (!dateInput) return "—";
  try {
    const d = typeof dateInput === "object" ? dateInput : new Date(dateInput);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
  } catch {
    return "—";
  }
}

/** Formats backend raw enums into human-readable labels (e.g. "long_stay" -> "Long stay") */
export function formatHumanEnum(val?: string | null): string {
  if (!val) return "—";
  const s = String(val).trim();
  if (s.toLowerCase() === "long_stay") return "Long stay";
  if (s.toLowerCase() === "short_stay") return "Short stay";
  if (s.toLowerCase() === "daily") return "Daily";
  if (s.toLowerCase() === "monthly") return "Monthly";
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

