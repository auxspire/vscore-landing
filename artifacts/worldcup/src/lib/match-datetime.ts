import { parseISO, isValid } from "date-fns";

const FALLBACK_TIMEZONE = "Asia/Kolkata";

/** Browser timezone, or IST when unavailable. */
export function getVisitorTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) return tz;
  } catch {
    /* ignore */
  }
  return FALLBACK_TIMEZONE;
}

/** Short label for the active timezone (e.g. IST, GMT+5:30). */
export function getTimezoneLabel(timeZone = getVisitorTimezone()): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "short",
    }).formatToParts(new Date());
    const name = parts.find((p) => p.type === "timeZoneName")?.value;
    if (name) return name;
  } catch {
    /* ignore */
  }
  return timeZone === FALLBACK_TIMEZONE ? "IST" : timeZone;
}

/** DB timestamps are UTC; normalize strings missing a timezone suffix. */
export function parseKickoffUtc(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const trimmed = iso.trim();
  if (!trimmed) return null;

  const hasOffset = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(trimmed);
  const normalized = hasOffset ? trimmed : `${trimmed.replace(/\.\d+$/, "")}Z`;
  const d = parseISO(normalized);
  return isValid(d) ? d : null;
}

export function formatKickoffDateTime(
  iso: string | null | undefined,
  timeZone = getVisitorTimezone(),
): string {
  const d = parseKickoffUtc(iso);
  if (!d) return "TBD";

  return new Intl.DateTimeFormat("en-IN", {
    timeZone,
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

export function formatKickoffTime(
  iso: string | null | undefined,
  timeZone = getVisitorTimezone(),
): string {
  const d = parseKickoffUtc(iso);
  if (!d) return "TBD";

  return new Intl.DateTimeFormat("en-IN", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

export function isTodayInTimezone(
  iso: string | null | undefined,
  timeZone = getVisitorTimezone(),
): boolean {
  const d = parseKickoffUtc(iso);
  if (!d) return false;

  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(d) === fmt.format(new Date());
}
