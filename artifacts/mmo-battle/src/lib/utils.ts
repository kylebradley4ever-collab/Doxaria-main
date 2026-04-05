import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (!isFinite(num)) return "0";
  const abs = Math.abs(num);
  const sign = num < 0 ? "-" : "";
  if (abs >= 1_000_000_000) {
    const v = abs / 1_000_000_000;
    return sign + (v % 1 < 0.05 ? v.toFixed(0) : v.toFixed(1)) + "b";
  }
  if (abs >= 1_000_000) {
    const v = abs / 1_000_000;
    return sign + (v % 1 < 0.05 ? v.toFixed(0) : v.toFixed(1)) + "m";
  }
  if (abs >= 10_000) {
    const v = abs / 1_000;
    return sign + (v % 1 < 0.05 ? v.toFixed(0) : v.toFixed(1)) + "k";
  }
  return sign + Math.round(abs).toLocaleString("en-US");
}
