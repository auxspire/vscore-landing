// @ts-nocheck
/**
 * Sync Status Indicator Component
 * Displays current sync state and allows manual sync trigger
 */

import React, { useState, useEffect } from 'react';
import { SyncEngine, SyncState } from '../utils/database/syncEngine';
import { shouldSkipCloudSync } from '../utils/database/setupChecker';
import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export function SyncStatusIndicator() {
  const [syncState, setSyncState] = useState<SyncState>(SyncEngine.getStatus());
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  // Don't show if cloud sync is skipped
  if (shouldSkipCloudSync()) {
    return null;
  }

  useEffect(() => {
    // Subscribe to sync status changes
    const unsubscribe = SyncEngine.subscribeSyncStatus((state) => {
      setSyncState(state);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    try {
      await SyncEngine.autoSync();
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setIsManualSyncing(false);
    }
  };

  const getStatusIcon = () => {
    if (isManualSyncing || syncState.status === 'syncing') {
      return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    }

    switch (syncState.status) {
      case 'synced':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Cloud className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Cloud className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    if (isManualSyncing) {
      return 'Syncing...';
    }

    switch (syncState.status) {
      case 'synced':
        return 'Synced';
      case 'syncing':
        return 'Syncing...';
      case 'pending':
        return `${syncState.pendingCount} pending`;
      case 'failed':
        return 'Sync failed';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = () => {
    if (isManualSyncing || syncState.status === 'syncing') {
      return 'bg-blue-50 border-blue-200';
    }

    switch (syncState.status) {
      case 'synced':
        return 'bg-green-50 border-green-200';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const isOnline = navigator.onLine;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getStatusColor()}`}>
      {/* Network Status */}
      {!isOnline && (
        <CloudOff className="w-4 h-4 text-gray-400" title="Offline" />
      )}

      {/* Sync Status Icon */}
      {getStatusIcon()}

      {/* Status Text */}
      <span className="text-sm font-medium text-gray-700">
        {getStatusText()}
      </span>

      {/* Last Sync Time */}
      {syncState.lastSync && syncState.status === 'synced' && (
        <span className="text-xs text-gray-500">
          {new Date(syncState.lastSync).toLocaleTimeString()}
        </span>
      )}

      {/* Manual Sync Button */}
      {syncState.status !== 'syncing' && !isManualSyncing && (
        <button
          onClick={handleManualSync}
          className="ml-2 p-1 rounded hover:bg-white transition-colors"
          title="Sync now"
          disabled={!isOnline}
        >
          <RefreshCw className="w-3.5 h-3.5 text-gray-600" />
        </button>
      )}

      {/* Error Details */}
      {syncState.status === 'failed' && syncState.error && (
        <div className="absolute top-full left-0 mt-1 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 max-w-xs z-50">
          {syncState.error}
        </div>
      )}
    </div>
  );
}

export function SyncStatusBadge() {
  const [syncState, setSyncState] = useState<SyncState>(SyncEngine.getStatus());

  useEffect(() => {
    const unsubscribe = SyncEngine.subscribeSyncStatus((state) => {
      setSyncState(state);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (syncState.status === 'synced') {
    return null; // Don't show badge when synced
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <SyncStatusIndicator />
    </div>
  );
}