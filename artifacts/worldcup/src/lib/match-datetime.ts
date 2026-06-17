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

function normalizeKickoffInput(raw: string): string {
  let s = raw.trim();
  if (s.includes(" ") && !s.includes("T")) {
    s = s.replace(" ", "T");
  }
  // Postgres may return +00, +0000, or +00:00 — normalize to ±HH:MM
  s = s.replace(/([+-]\d{2})(\d{2})(?::(\d{2}))?$/, (_, h, m, sec) =>
    sec != null ? `${h}:${m}:${sec}` : `${h}:${m}`,
  );
  s = s.replace(/([+-]\d{2})$/, "$1:00");
  return s;
}

/** DB timestamps are UTC; normalize strings missing a timezone suffix. */
export function parseKickoffUtc(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const trimmed = iso.trim();
  if (!trimmed) return null;

  const normalized = normalizeKickoffInput(trimmed);
  const hasOffset = /(?:Z|[+-]\d{2}:\d{2}(?::\d{2})?)$/i.test(normalized);
  const withZone = hasOffset
    ? normalized
    : `${normalized.replace(/\.\d+$/, "")}Z`;

  const parsedMs = Date.parse(withZone);
  if (!Number.isNaN(parsedMs)) {
    return new Date(parsedMs);
  }

  const d = parseISO(withZone);
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
  options?: { withTimezone?: boolean },
): string {
  const d = parseKickoffUtc(iso);
  if (!d) return "TBD";

  const time = new Intl.DateTimeFormat("en-IN", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);

  if (options?.withTimezone) {
    return `${time} ${getTimezoneLabel(timeZone)}`;
  }
  return time;
}

export function isTodayInTimezone(
  iso: string | null | undefined,
  timeZone = getVisitorTimezone(),
): boolean {
  const d = parseKickoffUtc(iso);
  if (!d) return false;
  return calendarDateInTimezone(d, timeZone) === calendarDateInTimezone(new Date(), timeZone);
}

export function calendarDateInTimezone(d: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Tomorrow's calendar date in the visitor timezone. */
function tomorrowCalendarDate(timeZone: string): string {
  let t = Date.now();
  const today = calendarDateInTimezone(new Date(t), timeZone);
  do {
    t += 3600_000;
  } while (calendarDateInTimezone(new Date(t), timeZone) === today);
  return calendarDateInTimezone(new Date(t), timeZone);
}

export function isTomorrowInTimezone(
  iso: string | null | undefined,
  timeZone = getVisitorTimezone(),
): boolean {
  const d = parseKickoffUtc(iso);
  if (!d) return false;
  return calendarDateInTimezone(d, timeZone) === tomorrowCalendarDate(timeZone);
}

/** Today or tomorrow in visitor timezone — covers late-night kickoffs across time zones. */
export function isTodayOrTomorrowInTimezone(
  iso: string | null | undefined,
  timeZone = getVisitorTimezone(),
): boolean {
  return isTodayInTimezone(iso, timeZone) || isTomorrowInTimezone(iso, timeZone);
}
