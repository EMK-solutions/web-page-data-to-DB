import { emptyToNull } from "@/src/capture/text";

/** Local calendar date, not the UTC day from `toISOString`. */
export function localCalendarDate(now: Date = new Date()): string {
  const year = String(now.getFullYear()).padStart(4, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** A real `YYYY-MM-DD` calendar date, or null. */
export function calendarDateOrNull(value: string | null | undefined): string | null {
  const trimmed = emptyToNull(value);
  if (!trimmed) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return `${match[1]}-${match[2]}-${match[3]}`;
}

/**
 * Leading calendar date from JSON-LD `datePosted`.
 * Accepts `YYYY-MM-DD` or an ISO datetime that starts with that date.
 * Relative phrases stay null so the model can resolve them.
 */
export function absolutePostedDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const dated = /^(\d{4}-\d{2}-\d{2})(?:$|T)/.exec(value.trim());
  return dated?.[1] ? calendarDateOrNull(dated[1]) : null;
}
