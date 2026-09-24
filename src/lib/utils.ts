import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalizes phone input string by stripping non-digits and removing
 * country prefixes like '91', '+91', or leading '0' when total length > 10,
 * returning up to 10 digits suitable for standard Indian phone numbers.
 */
export function cleanPhoneInput(v?: string | null): string {
  if (!v) return "";
  const digits = String(v).replace(/\D/g, "");
  if (digits.length > 10) {
    if (digits.startsWith("91")) {
      return digits.slice(2, 12);
    }
    if (digits.startsWith("0")) {
      return digits.slice(1, 11);
    }
    return digits.slice(-10);
  }
  return digits.slice(0, 10);
}
