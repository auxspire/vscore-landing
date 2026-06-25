/**
 * Event-Level Sync Utility
 * Handles syncing individual match events to/from the server
 * This prevents the "last write wins" problem in dual-scorer matches
 */

import { publicAnonKey, scoringFunctionsUrl } from './supabase/info';

const SERVER_URL = scoringFunctionsUrl;

/**
 * Push a single event to the cloud
 */
export async function pushEventToCloud(
  matchId: string | number,
  event: any,
  accessToken: string
): Promise<boolean> {
  try {
    if (!navigator.onLine) {
      console.log(`[eventSync] Device is offline - skipping event push`);
      return false;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(`${SERVER_URL}/match-events/${matchId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
        'X-User-Token': accessToken,
      },
      body: JSON.stringify({ event }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[eventSync] Failed to push event:`, response.status, errorText);
      return false;
    }

    const result = await response.json();
    console.log(`[eventSync] ✅ Event ${event.id} pushed to cloud for match ${matchId}`);
    return true;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`[eventSync] Request timed out while pushing event`);
    } else {
      console.error(`[eventSync] Error pushing event:`, error);
    }
    return false;
  }
}

/**
 * Pull all events for a match from the cloud
 */
export async function pullEventsFromCloud(
  matchId: string | number
): Promise<any[] | null> {
  try {
    if (!navigator.onLine) {
      console.log(`[eventSync] Device is offline - skipping event pull`);
      return null;
    }

    const response = await fetch(`${SERVER_URL}/match-events/${matchId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[eventSync] Failed to pull events:`, response.status, errorText);
      return null;
    }

    const result = await response.json();
    console.log(`[eventSync] ✅ Pulled ${result.count} events from cloud for match ${matchId}`);
    return result.events || [];
  } catch (error) {
    console.error(`[eventSync] Error pulling events:`, error);
    return null;
  }
}

/**
 * Pull only new events added since a specific timestamp
 * This is more efficient for polling
 */
export async function pullNewEventsSince(
  matchId: string | number,
  sinceTimestamp: string
): Promise<any[] | null> {
  try {
    if (!navigator.onLine) {
      return null;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout for polling

    const response = await fetch(`${SERVER_URL}/match-events/${matchId}/since/${encodeURIComponent(sinceTimestamp)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[eventSync] Failed to pull new events:`, response.status, errorText);
      return null;
    }

    const result = await response.json();
    if (result.count > 0) {
      console.log(`[eventSync] ✅ Pulled ${result.count} new events since ${sinceTimestamp}`);
    }
    return result.events || [];
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn(`[eventSync] Polling request timed out - will retry on next poll`);
    } else {
      console.error(`[eventSync] Error pulling new events:`, error);
    }
    return null;
  }
}

/**
 * Delete an event from the cloud (for undo functionality)
 */
export async function deleteEventFromCloud(
  matchId: string | number,
  eventId: string | number,
  accessToken: string
): Promise<boolean> {
  try {
    if (!navigator.onLine) {
      console.log(`[eventSync] Device is offline - skipping event deletion`);
      return false;
    }

    const response = await fetch(`${SERVER_URL}/match-events/${matchId}/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
        'X-User-Token': accessToken,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[eventSync] Failed to delete event:`, response.status, errorText);
      return false;
    }

    const result = await response.json();
    console.log(`[eventSync] ❌ Event ${eventId} deleted from cloud for match ${matchId}`);
    return true;
  } catch (error) {
    console.error(`[eventSync] Error deleting event:`, error);
    return false;
  }
}

/**
 * Merge cloud events with local events
 * Strategy: Cloud events are the source of truth
 * We merge by event ID to avoid duplicates
 */
export function mergeEvents(cloudEvents: any[], localEvents: any[]): any[] {
  if (!cloudEvents || cloudEvents.length === 0) {
    return localEvents;
  }

  // Create a map of cloud events by ID for quick lookup
  const cloudEventMap = new Map(cloudEvents.map(e => [e.id, e]));
  
  // Create a map of local events by ID
  const localEventMap = new Map(localEvents.map(e => [e.id, e]));
  
  // Merge: prefer cloud version if event exists in both
  const mergedMap = new Map([...localEventMap, ...cloudEventMap]);
  
  // Convert back to array and sort by timestamp (most recent first)
  const mergedEvents = Array.from(mergedMap.values()).sort((a, b) => {
    const timeA = new Date(a.timestamp || a.time || 0).getTime();
    const timeB = new Date(b.timestamp || b.time || 0).getTime();
    return timeB - timeA; // Descending order (newest first)
  });
  
  return mergedEvents;
}