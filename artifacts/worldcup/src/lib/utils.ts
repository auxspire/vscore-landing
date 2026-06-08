import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const SUBDIVISION_FLAGS: Record<string, string> = {
  "GB-ENG": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "GB-SCT": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "GB-WLS": "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
};

export function getFlagEmoji(countryCode: string): string {
  if (!countryCode) return "🏳️";
  if (SUBDIVISION_FLAGS[countryCode]) return SUBDIVISION_FLAGS[countryCode];
  const code = countryCode.toUpperCase().slice(0, 2);
  const codePoints = code.split("").map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
