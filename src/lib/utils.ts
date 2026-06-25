import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines clsx and tailwind-merge for safe, conflict-free conditional
 * Tailwind class application throughout the Kincha Neobrutalist UI.
 *
 * Usage:
 *   cn("border-4 border-black", isActive && "bg-cyan-400", className)
 *
 * - clsx handles conditional/falsy values and arrays.
 * - twMerge deduplicates conflicting Tailwind utilities (e.g., bg-red vs bg-cyan).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Generates a RFC-4122 v4 UUID for anonymous session identification.
 * Falls back to a crypto.getRandomValues-based approach for environments
 * that don't expose `crypto.randomUUID()`.
 */
export function generateUUID(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  // Polyfill for older environments / SSR edge cases
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Formats a raw ISO timestamp string into a human-readable Indonesian
 * locale date-time string for the admin dashboard table.
 *
 * Example output: "25 Jun 2026, 05:55"
 */
export function formatTimestamp(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  const date = new Date(isoString);
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Converts an array of plain objects to a downloadable CSV Blob.
 * Handles string values containing commas by wrapping in double-quotes.
 * Used by the Admin Dashboard "EKSPOR DATA (CSV)" feature.
 */
export function convertToCSV(
  data: Record<string, unknown>[],
  headers: string[]
): string {
  const escape = (val: unknown): string => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    // Wrap in quotes if contains comma, newline, or double-quote
    if (str.includes(",") || str.includes("\n") || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = headers.map(escape).join(",");
  const rows = data.map((row) =>
    headers.map((h) => escape(row[h])).join(",")
  );

  return [headerRow, ...rows].join("\n");
}

/**
 * Triggers a browser file download from a CSV string.
 * Creates a temporary anchor element and programmatically clicks it,
 * then immediately revokes the object URL to prevent memory leaks.
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob(["\uFEFF" + csvContent], {
    // \uFEFF = UTF-8 BOM for Excel compatibility
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Basic profanity detection regex for Indonesian + English common slurs.
 * Returns true if the text likely contains prohibited content.
 * Used server-side / client-side pre-submission guard in the Admin dashboard.
 *
 * This is a lightweight client-side guard — NOT a replacement for
 * a proper server-side moderation pipeline.
 */
const PROFANITY_PATTERN =
  /\b(anjing|bangsat|kontol|memek|babi|tolol|idiot|fuck|shit|ass|bitch|damn|bastard)\b/gi;

export function containsProfanity(text: string): boolean {
  return PROFANITY_PATTERN.test(text);
}

/**
 * Sanitizes a display string by replacing matched profanity with asterisks.
 * Used in Admin dashboard table for safe rendering of essay answers.
 */
export function sanitizeText(text: string): string {
  return text.replace(PROFANITY_PATTERN, (match) => "*".repeat(match.length));
}
