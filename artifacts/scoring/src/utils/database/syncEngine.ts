/**
 * VScor Sync Engine
 * Two-way synchronization between local storage and Supabase
 * Implements offline-first architecture with conflict resolution
 */

import { supabase, isOnline } from './supabaseClient';
import { TABLE_NAMES, BaseEntity, SyncMetadata } from './schema';
import { shouldSkipCloudSync, checkDatabaseSetup } from './setupChecker';
import { v4 as uuidv4 } from 'uuid';

// ==================== SYNC QUEUE ====================
interface SyncQueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: string;
  retryCount: number;
}

class SyncQueue {
  private static readonly QUEUE_KEY = 'vscor_sync_queue';
  private static readonly MAX_RETRIES = 3;

  static enqueue(operation: 'create' | 'update' | 'delete', table: string, data: any): void {
    const queue = this.getQueue();
    const item: SyncQueueItem = {
      id: uuidv4(),
      operation,
      table,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };
    queue.push(item);
    this.saveQueue(queue);
    // Silently enqueue - reduces console noise
  }

  static getQueue(): SyncQueueItem[] {
    try {
      const stored = localStorage.getItem(this.QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[Sync Queue] Error reading queue:', error);
      return [];
    }
  }

  static saveQueue(queue: SyncQueueItem[]): void {
    try {
      localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('[Sync Queue] Error saving queue:', error);
    }
  }

  static dequeue(itemId: string): void {
    const queue = this.getQueue();
    const filtered = queue.filter(item => item.id !== itemId);
    this.saveQueue(filtered);
    // Silently dequeue - reduces console noise
  }

  static incrementRetry(itemId: string): void {
    const queue = this.getQueue();
    const item = queue.find(i => i.id === itemId);
    if (item) {
      item.retryCount++;
      if (item.retryCount >= this.MAX_RETRIES) {
        // Mark as failed and remove from queue
        console.error(`[Sync Queue] Max retries reached for item:`, itemId);
        this.dequeue(itemId);
      } else {
        this.saveQueue(queue);
      }
    }
  }

  static clear(): void {
    localStorage.removeItem(this.QUEUE_KEY);
    console.log('[Sync Queue] Cleared all items');
  }

  static getPendingCount(): number {
    return this.getQueue().length;
  }
}

// ==================== SYNC STATUS ====================
export type SyncStatus = 'synced' | 'pending' | 'failed' | 'syncing';

export interface SyncState {
  status: SyncStatus;
  lastSync?: string;
  pendingCount: number;
  error?: string;
}

class SyncStatusManager {
  private static readonly STATUS_KEY = 'vscor_sync_status';
  private static listeners: ((state: SyncState) => void)[] = [];

  static getStatus(): SyncState {
    try {
      const stored = localStorage.getItem(this.STATUS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('[Sync Status] Error reading status:', error);
    }
    return {
      status: 'synced',
      pendingCount: 0,
    };
  }

  static setStatus(state: Partial<SyncState>): void {
    const current = this.getStatus();
    const updated = { ...current, ...state };
    try {
      localStorage.setItem(this.STATUS_KEY, JSON.stringify(updated));
      this.notifyListeners(updated);
    } catch (error) {
      console.error('[Sync Status] Error saving status:', error);
    }
  }

  static subscribe(callback: (state: SyncState) => void): () => void {
    this.listeners.push(callback);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private static notifyListeners(state: SyncState): void {
    this.listeners.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('[Sync Status] Error in listener callback:', error);
      }
    });
  }
}

// ==================== ENTITY SYNC MANAGER ====================
export class EntitySyncManager {
  /**
   * Add UUID and sync metadata to local entity
   */
  static prepareForSync<T extends Record<string, any>>(entity: T): T & BaseEntity {
    const now = new Date().toISOString();
    return {
      ...entity,
      id: entity.id || uuidv4(),
      created_at: entity.created_at || now,
      updated_at: now,
      sync_status: 'pending' as const,
    };
  }

  /**
   * Upload local entity to cloud
   */
  static async uploadEntity(table: string, entity: any): Promise<boolean> {
    if (shouldSkipCloudSync()) {
      // Silently skip - user chose local-only mode
      return false;
    }

    if (!isOnline()) {
      // Silently queue when offline
      SyncQueue.enqueue('create', table, entity);
      return false;
    }

    try {
      const { data, error } = await supabase
        .from(table)
        .upsert(entity, { onConflict: 'id' })
        .select();

      if (error) {
        // Check if it's a table not found error
        if (error.code === 'PGRST205') {
          // Silently queue - user hasn't set up database yet
          SyncQueue.enqueue('create', table, entity);
          return false;
        } else {
          console.error(`[Sync] Error uploading ${table}:`, error);
          SyncQueue.enqueue('create', table, entity);
          return false;
        }
      }

      console.log(`[Sync] Successfully uploaded ${table}:`, entity.id);
      return true;
    } catch (error) {
      console.error(`[Sync] Exception uploading ${table}:`, error);
      SyncQueue.enqueue('create', table, entity);
      return false;
    }
  }

  /**
   * Download entity from cloud
   */
  static async downloadEntity(table: string, id: string): Promise<any | null> {
    if (!isOnline() || shouldSkipCloudSync()) {
      // Silently skip when offline or local-only
      return null;
    }

    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error(`[Sync] Error downloading ${table}:`, error);
        return null;
      }

      return data;
    } catch (error) {
      console.error(`[Sync] Exception downloading ${table}:`, error);
      return null;
    }
  }

  /**
   * Download all entities from cloud for a table
   */
  static async downloadAllEntities(table: string, filters?: Record<string, any>): Promise<any[]> {
    if (!isOnline() || shouldSkipCloudSync()) {
      // Silently skip when offline or local-only
      return [];
    }

    try {
      let query = supabase.from(table).select('*');

      // Apply filters if provided
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      const { data, error } = await query;

      if (error) {
        console.error(`[Sync] Error downloading ${table}:`, error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error(`[Sync] Exception downloading ${table}:`, error);
      return [];
    }
  }

  /**
   * Sync entity with conflict resolution (Last-Write-Wins)
   */
  static async syncEntity(table: string, localEntity: any, cloudEntity: any): Promise<any> {
    // Last-Write-Wins strategy
    const localTimestamp = new Date(localEntity.updated_at).getTime();
    const cloudTimestamp = new Date(cloudEntity.updated_at).getTime();

    if (localTimestamp > cloudTimestamp) {
      // Local is newer - upload to cloud
      await this.uploadEntity(table, localEntity);
      return localEntity;
    } else if (cloudTimestamp > localTimestamp) {
      // Cloud is newer - use cloud data
      return cloudEntity;
    } else {
      // Same timestamp - use cloud version (server wins on ties)
      return cloudEntity;
    }
  }
}

// ==================== SYNC ENGINE ====================
export class SyncEngine {
  private static isSyncing = false;

  /**
   * Process sync queue
   */
  static async processQueue(): Promise<void> {
    if (!isOnline() || shouldSkipCloudSync()) {
      return; // Silently skip if offline or local-only mode
    }

    // Check if database is set up before processing queue
    const setupStatus = await checkDatabaseSetup();
    if (!setupStatus.isComplete) {
      // Silently clear queue if database isn't ready
      SyncQueue.clear();
      return;
    }

    if (this.isSyncing) {
      return; // Already syncing
    }

    this.isSyncing = true;
    SyncStatusManager.setStatus({ status: 'syncing' });

    const queue = SyncQueue.getQueue();
    
    if (queue.length > 0) {
      console.log(`[Sync Engine] Processing ${queue.length} queued items`);
    }

    for (const item of queue) {
      try {
        if (item.operation === 'create' || item.operation === 'update') {
          const { error } = await supabase
            .from(item.table)
            .upsert(item.data, { onConflict: 'id' });

          if (error) {
            // Check if it's a table not found error (PGRST205)
            if (error.code === 'PGRST205') {
              // Silently remove - user is in local-only mode or hasn't set up database
              SyncQueue.dequeue(item.id);
            } else {
              console.error(`[Sync Engine] Error processing ${item.operation} for ${item.table}:`, error);
              SyncQueue.incrementRetry(item.id);
            }
          } else {
            SyncQueue.dequeue(item.id);
          }
        } else if (item.operation === 'delete') {
          const { error } = await supabase
            .from(item.table)
            .delete()
            .eq('id', item.data.id);

          if (error) {
            // Check if it's a table not found error (PGRST205)
            if (error.code === 'PGRST205') {
              // Silently remove - user is in local-only mode or hasn't set up database
              SyncQueue.dequeue(item.id);
            } else {
              console.error(`[Sync Engine] Error processing delete for ${item.table}:`, error);
              SyncQueue.incrementRetry(item.id);
            }
          } else {
            SyncQueue.dequeue(item.id);
          }
        }
      } catch (error) {
        console.error(`[Sync Engine] Exception processing queue item:`, error);
        SyncQueue.incrementRetry(item.id);
      }
    }

    const remainingCount = SyncQueue.getPendingCount();
    SyncStatusManager.setStatus({
      status: remainingCount > 0 ? 'pending' : 'synced',
      lastSync: new Date().toISOString(),
      pendingCount: remainingCount,
    });

    this.isSyncing = false;
    
    if (queue.length > 0) {
      console.log('[Sync Engine] Queue processing complete');
    }
  }

  /**
   * Full sync - upload local changes and download cloud updates
   */
  static async fullSync(tables: string[]): Promise<void> {
    if (!isOnline() || shouldSkipCloudSync()) {
      console.log('[Sync Engine] Offline - full sync postponed');
      SyncStatusManager.setStatus({ status: 'pending', pendingCount: SyncQueue.getPendingCount() });
      return;
    }

    console.log('[Sync Engine] Starting full sync for tables:', tables);
    SyncStatusManager.setStatus({ status: 'syncing' });

    try {
      // Step 1: Process pending queue
      await this.processQueue();

      // Step 2: Download updates from cloud
      // This will be implemented per-entity in the migration utilities
      
      SyncStatusManager.setStatus({
        status: 'synced',
        lastSync: new Date().toISOString(),
        pendingCount: 0,
      });

      console.log('[Sync Engine] Full sync complete');
    } catch (error) {
      console.error('[Sync Engine] Error during full sync:', error);
      SyncStatusManager.setStatus({
        status: 'failed',
        error: String(error),
        pendingCount: SyncQueue.getPendingCount(),
      });
    }
  }

  /**
   * Auto-sync on app startup
   */
  static async autoSync(): Promise<void> {
    console.log('[Sync Engine] Auto-sync initiated');
    
    const tables = [
      TABLE_NAMES.PLAYERS,
      TABLE_NAMES.TEAMS,
      TABLE_NAMES.TEAM_PLAYERS,
      TABLE_NAMES.TOURNAMENTS,
      TABLE_NAMES.TOURNAMENT_TEAMS,
      TABLE_NAMES.MATCHES,
      TABLE_NAMES.MATCH_EVENTS,
      TABLE_NAMES.PERFORMANCE_RATINGS,
      TABLE_NAMES.STANDINGS,
      TABLE_NAMES.FIXTURES,
    ];

    await this.fullSync(tables);
  }

  /**
   * Get sync status
   */
  static getStatus(): SyncState {
    return SyncStatusManager.getStatus();
  }

  /**
   * Subscribe to sync status changes
   */
  static subscribeSyncStatus(callback: (state: SyncState) => void): () => void {
    return SyncStatusManager.subscribe(callback);
  }

  /**
   * Clear the sync queue (useful when switching to local-only mode)
   */
  static clearQueue(): void {
    SyncQueue.clear();
    SyncStatusManager.setStatus({
      status: 'synced',
      pendingCount: 0,
    });
  }
}

// ==================== AUTO-SYNC ON NETWORK CHANGE ====================
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[Sync Engine] Network online - processing queue');
    SyncEngine.processQueue();
  });

  window.addEventListener('offline', () => {
    console.log('[Sync Engine] Network offline - sync paused');
    SyncStatusManager.setStatus({ status: 'pending', pendingCount: SyncQueue.getPendingCount() });
  });
}

// ==================== EXPORTS ====================
export { SyncQueue, SyncStatusManager };