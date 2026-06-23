/**
 * Cloud Sync Utility
 * Handles syncing app data to/from the server KV store
 */

import { publicAnonKey, scoringFunctionsUrl } from './supabase/info';
import { supabase } from './database/supabaseClient';

const SERVER_URL = scoringFunctionsUrl;

// Track server health status
let serverHealthy = true;
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 60000; // Check every minute

// Track ongoing pull request to prevent overlapping requests
let ongoingPullRequest: Promise<Record<SyncDataType, any[]> | null> | null = null;
let lastPullTimestamp = 0;
const MIN_PULL_INTERVAL = 1500; // Minimum 1.5 seconds between pulls (reduced from 3s for faster live updates)

export type SyncDataType =
  | 'players'
  | 'teams'
  | 'tournaments'
  | 'ongoing_matches'
  | 'completed_matches'
  | 'master_teams'
  | 'tournament_teams';

/**
 * Check if the server is healthy
 */
async function checkServerHealth(): Promise<boolean> {
  const now = Date.now();
  
  // Use cached result if recent
  if (now - lastHealthCheck < HEALTH_CHECK_INTERVAL) {
    return serverHealthy;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for health check
    
    const response = await fetch(`${SERVER_URL}/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    serverHealthy = response.ok;
    lastHealthCheck = now;
    
    if (!serverHealthy) {
      console.warn('[cloudSync] Server health check failed:', response.status);
    }
    
    return serverHealthy;
  } catch (error) {
    console.warn('[cloudSync] Server health check error:', error);
    serverHealthy = false;
    lastHealthCheck = now;
    return false;
  }
}

/**
 * Retry a fetch operation with exponential backoff
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 2, // Reduced from 3 to 2 for faster failure
  timeoutMs = 10000 // Reduced from 15s to 10s
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      // Merge the provided signal (if any) with our timeout signal
      const providedSignal = options.signal as AbortSignal | undefined;
      if (providedSignal) {
        // If the provided signal is already aborted, abort immediately
        if (providedSignal.aborted) {
          clearTimeout(timeoutId);
          throw new DOMException('Request aborted', 'AbortError');
        }
        // Listen for abort on the provided signal
        providedSignal.addEventListener('abort', () => controller.abort());
      }

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      lastError = error as Error;
      
      // If request was aborted by the caller, don't retry
      if (lastError.name === 'AbortError') {
        throw lastError;
      }
      
      // On last attempt, throw immediately without extra logging
      if (attempt === maxRetries - 1) {
        throw lastError;
      }
      
      // Wait before retry with exponential backoff
      const delay = Math.min(500 * Math.pow(2, attempt), 2000); // Reduced delays: 500ms, 1s, 2s max
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Fetch failed after retries');
}

/**
 * Attempt to get a fresher access token from the live Supabase session.
 * Returns null silently if the session is unavailable (common in iframes).
 */
async function tryGetFreshToken(): Promise<string | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) return null;

    // Check if the token is about to expire (within 5 minutes)
    const expiresAt = session.expires_at; // unix timestamp in seconds
    const nowSecs = Math.floor(Date.now() / 1000);
    const fiveMinutes = 5 * 60;

    if (expiresAt && expiresAt - nowSecs < fiveMinutes) {
      // Token near expiry — try to refresh
      const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshed.session) return session.access_token; // return existing rather than null
      return refreshed.session.access_token;
    }

    return session.access_token;
  } catch {
    return null;
  }
}

/**
 * Fetch all synced data from the server (no auth required for reads)
 */
export async function pullAllFromCloud(signal?: AbortSignal): Promise<Record<SyncDataType, any[]> | null> {
  try {
    // Quick online check first
    if (!navigator.onLine) {
      console.log('[cloudSync] Device is offline - skipping cloud pull');
      return null;
    }

    // DEDUPLICATION: If there's already a pull in progress, return that promise
    if (ongoingPullRequest) {
      console.log('[cloudSync] Pull already in progress, returning existing request');
      return ongoingPullRequest;
    }

    // RATE LIMITING: Enforce minimum interval between pulls
    const now = Date.now();
    const timeSinceLastPull = now - lastPullTimestamp;
    if (timeSinceLastPull < MIN_PULL_INTERVAL) {
      console.log(`[cloudSync] Rate limit: Skipping pull (last pull was ${timeSinceLastPull}ms ago, minimum is ${MIN_PULL_INTERVAL}ms)`);
      return null;
    }

    // Create the pull request promise
    const pullPromise = (async () => {
      try {
        lastPullTimestamp = Date.now();
        
        const response = await fetchWithRetry(`${SERVER_URL}/sync`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          signal, // Pass through the abort signal
        });

        // Handle 503 Service Unavailable gracefully
        if (response.status === 503) {
          console.log('[cloudSync] Server temporarily unavailable (503). Continuing with local data.');
          return null;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[cloudSync] Failed to pull all data:', response.status, errorText);
          return null;
        }

        const result = await response.json();
        console.log('[cloudSync] Pulled all data from cloud successfully');
        return result as Record<SyncDataType, any[]>;
      } catch (error) {
        // Provide more detailed error information
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            // Silently ignore aborted requests - this is expected when polling is cancelled
            console.log('[cloudSync] Request aborted (expected during rapid polling)');
          } else if (error.message.includes('Failed to fetch')) {
            console.log('[cloudSync] Unable to reach server. The app will continue working with local data.');
          } else {
            console.error('[cloudSync] Error pulling all data:', error.message);
          }
        } else {
          console.error('[cloudSync] Error pulling all data:', error);
        }
        return null;
      } finally {
        // Clear the ongoing request flag after completion or error
        ongoingPullRequest = null;
      }
    })();

    // Store the promise so other callers can use it
    ongoingPullRequest = pullPromise;
    
    return pullPromise;
  } catch (error) {
    // Handle any synchronous errors
    console.error('[cloudSync] Unexpected error in pullAllFromCloud:', error);
    ongoingPullRequest = null;
    return null;
  }
}

/**
 * Push data for a specific type to the server (auth required).
 *
 * Uses the accessToken that App.tsx already holds in state as the primary
 * credential. Optionally upgrades to a fresher token from the live Supabase
 * session, but never fails because getSession() returned nothing — that is
 * common in iframe environments (Figma Make) where Supabase's cookie/storage
 * session is unavailable even though the user is authenticated.
 */
export async function pushToCloud(
  type: SyncDataType,
  data: any[],
  accessToken: string
): Promise<boolean> {
  try {
    // Quick online check first
    if (!navigator.onLine) {
      console.log(`[cloudSync] Device is offline - skipping push for ${type}`);
      return false;
    }

    // Start with the token App.tsx already has — it is always current.
    let tokenToUse: string = accessToken;

    // Opportunistically try to get a fresher token from the live session.
    // If this fails (e.g. in iframes) we keep using the provided token.
    try {
      const freshToken = await tryGetFreshToken();
      if (freshToken) {
        tokenToUse = freshToken;
      }
    } catch {
      // Safe to ignore — we'll use the passed token.
    }

    if (!tokenToUse) {
      console.warn(`[cloudSync] No active session — skipping push for ${type}`);
      return false;
    }

    const response = await fetchWithRetry(`${SERVER_URL}/sync/${type}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // Use publicAnonKey for the Supabase Gateway (never expires)
        'Authorization': `Bearer ${publicAnonKey}`,
        // Pass user's JWT in custom header for server-side auth validation
        'X-User-Token': tokenToUse,
      },
      body: JSON.stringify({ data }),
    }, 2, 15000); // 2 retries, 15 second timeout (matches server's 12s + network overhead)

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[cloudSync] Failed to push ${type}:`, response.status, errorText);
      return false;
    }

    const result = await response.json();
    
    // Handle 202 Accepted (server temporarily unavailable but data saved locally)
    if (response.status === 202) {
      console.log(`[cloudSync] ⚠️ ${type}: Server temporarily unavailable. Data saved locally and will sync when server recovers.`);
      return true; // Still considered success since data is safe locally
    }
    
    console.log(`[cloudSync] ✅ Pushed ${result.count} ${type} records to cloud`);
    return true;
  } catch (error) {
    // Silently handle push errors - data is still safe in localStorage
    if (error instanceof Error && error.message.includes('Failed to fetch')) {
      console.log(`[cloudSync] Unable to push ${type} to cloud (offline or server unavailable). Data saved locally.`);
    } else {
      console.error(`[cloudSync] Error pushing ${type}:`, error);
    }
    return false;
  }
}

/**
 * Merge cloud data with local data
 * Strategy: Cloud data is the source of truth. 
 * If cloud has data, use it. If cloud is empty but local has data, keep local.
 */
export function mergeWithLocalData(
  cloudData: any[] | null | undefined,
  localData: any[]
): any[] {
  if (cloudData && cloudData.length > 0) {
    return cloudData;
  }
  return localData;
}

/**
 * Create a debounced sync function
 */
export function createDebouncedSync(delay = 2000) {
  const timers: Record<string, ReturnType<typeof setTimeout>> = {};

  return function debouncedPush(
    type: SyncDataType,
    data: any[],
    accessToken: string | null,
    immediate: boolean = false // NEW: Allow immediate push bypassing debounce
  ) {
    if (!accessToken) return; // Not logged in, skip

    // Clear existing timer for this type
    if (timers[type]) {
      clearTimeout(timers[type]);
    }

    // If immediate push requested (e.g., from scorer), push now
    if (immediate) {
      console.log(`[cloudSync] 🚀 Immediate push for ${type} (scorer update)`);
      pushToCloud(type, data, accessToken).catch(err => {
        console.error(`[cloudSync] Immediate push failed for ${type}:`, err);
      });
      return;
    }

    // Schedule push (normal debounced mode)
    timers[type] = setTimeout(() => {
      pushToCloud(type, data, accessToken).catch(err => {
        console.error(`[cloudSync] Debounced push failed for ${type}:`, err);
      });
    }, delay);
  };
}

// Singleton debounced sync instance
// Reduced to 1000ms for balance between responsiveness and server load
export const debouncedSync = createDebouncedSync(1000);