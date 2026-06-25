// @ts-nocheck
/**
 * Cloud Data Hooks
 * React hooks for accessing and syncing data with Supabase
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase, isOnline } from '../utils/database/supabaseClient';
import { EntitySyncManager, SyncEngine } from '../utils/database/syncEngine';
import { TABLE_NAMES } from '../utils/database/schema';

// ==================== GENERIC CLOUD DATA HOOK ====================
export function useCloudData<T>(
  table: string,
  filters?: Record<string, any>
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const cloudData = await EntitySyncManager.downloadAllEntities(table, filters);
      setData(cloudData as T[]);
      setLastSync(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      console.error(`Error fetching ${table}:`, err);
    } finally {
      setLoading(false);
    }
  }, [table, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh,
    lastSync,
  };
}

// ==================== PLAYERS HOOK ====================
export function usePlayers() {
  const { data, loading, error, refresh } = useCloudData(TABLE_NAMES.PLAYERS);
  
  const addPlayer = useCallback(async (playerData: any) => {
    const prepared = EntitySyncManager.prepareForSync(playerData);
    await EntitySyncManager.uploadEntity(TABLE_NAMES.PLAYERS, prepared);
    refresh();
    return prepared;
  }, [refresh]);

  const updatePlayer = useCallback(async (id: string, updates: any) => {
    const player = data.find((p: any) => p.id === id);
    if (!player) return;

    const updated = {
      ...player,
      ...updates,
      updated_at: new Date().toISOString(),
      sync_status: 'pending',
    };

    await EntitySyncManager.uploadEntity(TABLE_NAMES.PLAYERS, updated);
    refresh();
    return updated;
  }, [data, refresh]);

  return {
    players: data,
    loading,
    error,
    addPlayer,
    updatePlayer,
    refresh,
  };
}

// ==================== TEAMS HOOK ====================
export function useTeams() {
  const { data, loading, error, refresh } = useCloudData(TABLE_NAMES.TEAMS);
  
  const addTeam = useCallback(async (teamData: any) => {
    const prepared = EntitySyncManager.prepareForSync(teamData);
    await EntitySyncManager.uploadEntity(TABLE_NAMES.TEAMS, prepared);
    refresh();
    return prepared;
  }, [refresh]);

  const updateTeam = useCallback(async (id: string, updates: any) => {
    const team = data.find((t: any) => t.id === id);
    if (!team) return;

    const updated = {
      ...team,
      ...updates,
      updated_at: new Date().toISOString(),
      sync_status: 'pending',
    };

    await EntitySyncManager.uploadEntity(TABLE_NAMES.TEAMS, updated);
    refresh();
    return updated;
  }, [data, refresh]);

  return {
    teams: data,
    loading,
    error,
    addTeam,
    updateTeam,
    refresh,
  };
}

// ==================== TOURNAMENTS HOOK ====================
export function useTournaments(filters?: { status?: string }) {
  const { data, loading, error, refresh } = useCloudData(TABLE_NAMES.TOURNAMENTS, filters);
  
  const addTournament = useCallback(async (tournamentData: any) => {
    const prepared = EntitySyncManager.prepareForSync(tournamentData);
    await EntitySyncManager.uploadEntity(TABLE_NAMES.TOURNAMENTS, prepared);
    refresh();
    return prepared;
  }, [refresh]);

  const updateTournament = useCallback(async (id: string, updates: any) => {
    const tournament = data.find((t: any) => t.id === id);
    if (!tournament) return;

    const updated = {
      ...tournament,
      ...updates,
      updated_at: new Date().toISOString(),
      sync_status: 'pending',
    };

    await EntitySyncManager.uploadEntity(TABLE_NAMES.TOURNAMENTS, updated);
    refresh();
    return updated;
  }, [data, refresh]);

  return {
    tournaments: data,
    loading,
    error,
    addTournament,
    updateTournament,
    refresh,
  };
}

// ==================== MATCHES HOOK ====================
export function useMatches(filters?: { tournament_id?: string; status?: string }) {
  const { data, loading, error, refresh } = useCloudData(TABLE_NAMES.MATCHES, filters);
  
  const addMatch = useCallback(async (matchData: any) => {
    const prepared = EntitySyncManager.prepareForSync(matchData);
    await EntitySyncManager.uploadEntity(TABLE_NAMES.MATCHES, prepared);
    refresh();
    return prepared;
  }, [refresh]);

  const updateMatch = useCallback(async (id: string, updates: any) => {
    const match = data.find((m: any) => m.id === id);
    if (!match) return;

    const updated = {
      ...match,
      ...updates,
      updated_at: new Date().toISOString(),
      sync_status: 'pending',
    };

    await EntitySyncManager.uploadEntity(TABLE_NAMES.MATCHES, updated);
    refresh();
    return updated;
  }, [data, refresh]);

  return {
    matches: data,
    loading,
    error,
    addMatch,
    updateMatch,
    refresh,
  };
}

// ==================== REALTIME SUBSCRIPTION HOOK ====================
export function useRealtimeSubscription<T>(
  table: string,
  callback: (payload: any) => void,
  filters?: Record<string, any>
) {
  useEffect(() => {
    if (!isOnline()) {
      console.log(`[Realtime] Offline - subscription to ${table} paused`);
      return;
    }

    let channel = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: filters ? Object.entries(filters).map(([k, v]) => `${k}=eq.${v}`).join(',') : undefined,
        },
        (payload) => {
          console.log(`[Realtime] Change in ${table}:`, payload);
          callback(payload);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [table, callback, filters]);
}

// ==================== SYNC STATUS HOOK ====================
export function useSyncStatus() {
  const [syncState, setSyncState] = useState(SyncEngine.getStatus());

  useEffect(() => {
    const unsubscribe = SyncEngine.subscribeSyncStatus((state) => {
      setSyncState(state);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const triggerSync = useCallback(async () => {
    await SyncEngine.autoSync();
  }, []);

  return {
    syncState,
    triggerSync,
    isPending: syncState.status === 'pending',
    isSyncing: syncState.status === 'syncing',
    isSynced: syncState.status === 'synced',
    hasFailed: syncState.status === 'failed',
    pendingCount: syncState.pendingCount,
    lastSync: syncState.lastSync,
  };
}

// ==================== OFFLINE QUEUE HOOK ====================
export function useOfflineQueue() {
  const [isOnlineState, setIsOnlineState] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnlineState(true);
      SyncEngine.processQueue();
    };

    const handleOffline = () => {
      setIsOnlineState(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline: isOnlineState,
  };
}
