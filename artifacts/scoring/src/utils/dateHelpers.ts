/**
 * Date Helper Utilities for VScor
 * Provides consistent date handling across all components
 */

/**
 * Get the most relevant date from a match object
 * Priority order: completedAt > endTime > date > startTime > createdAt
 */
export function getMatchDate(match: any): Date | null {
  if (!match) return null;

  // Try completedAt first (when match was completed)
  if (match.completedAt) {
    const date = new Date(match.completedAt);
    if (!isNaN(date.getTime())) return date;
  }

  // Try endTime (when match ended)
  if (match.endTime) {
    const date = new Date(match.endTime);
    if (!isNaN(date.getTime())) return date;
  }

  // Try date field (main date field)
  if (match.date) {
    const date = new Date(match.date);
    if (!isNaN(date.getTime())) return date;
  }

  // Try startTime (when match started)
  if (match.startTime) {
    const date = new Date(match.startTime);
    if (!isNaN(date.getTime())) return date;
  }

  // Try createdAt (when match was created)
  if (match.createdAt) {
    const date = new Date(match.createdAt);
    if (!isNaN(date.getTime())) return date;
  }

  return null;
}

/**
 * Format date as "DD MMM YYYY" (e.g., "15 Mar 2024")
 */
export function formatMatchDate(match: any): string {
  const date = getMatchDate(match);
  if (!date) return 'Date not set';

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format date as "Month DD, YYYY" (e.g., "March 15, 2024")
 */
export function formatMatchDateLong(match: any): string {
  const date = getMatchDate(match);
  if (!date) return 'Date not set';

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format date in parts for card display
 * Returns { day: "15", month: "MAR", year: "2024" }
 */
export function formatMatchDateParts(match: any): { day: string; month: string; year: string } {
  const date = getMatchDate(match);
  
  if (!date) {
    return { day: '--', month: '---', year: '----' };
  }

  return {
    day: String(date.getDate()).padStart(2, '0'),
    month: date.toLocaleString('en', { month: 'short' }).toUpperCase(),
    year: String(date.getFullYear()),
  };
}

/**
 * Get raw date value for sorting (returns timestamp)
 */
export function getMatchDateTimestamp(match: any): number {
  const date = getMatchDate(match);
  return date ? date.getTime() : 0;
}

/**
 * Format date as ISO string for storage
 */
export function formatMatchDateISO(match: any): string | null {
  const date = getMatchDate(match);
  return date ? date.toISOString() : null;
}
