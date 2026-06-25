// @ts-nocheck
/**
 * Sync Initializer Component
 * Handles app startup, data migration, and initial sync
 */

import React, { useState, useEffect } from 'react';
import { DataMigration } from '../utils/database/migration';
import { SyncEngine } from '../utils/database/syncEngine';
import { checkDatabaseSetup, shouldSkipCloudSync, setSkipCloudSync, SetupStatus } from '../utils/database/setupChecker';
import { DatabaseSetupWizard } from './DatabaseSetupWizard';
import { Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface SyncInitializerProps {
  children: React.ReactNode;
  onComplete?: () => void;
}

type InitPhase = 
  | 'checking_setup'
  | 'setup_required'
  | 'checking'
  | 'migrating'
  | 'syncing'
  | 'complete'
  | 'error'
  | 'skip_migration'
  | 'local_only';

const loadingMessages = [
  { phase: 'checking_setup', message: 'Warming up the pitch...', emoji: '⚽' },
  { phase: 'checking', message: 'Gathering the squad...', emoji: '👥' },
  { phase: 'migrating', message: 'Loading player stats...', emoji: '📊' },
  { phase: 'syncing_teams', message: 'Assembling teams...', emoji: '🏃‍♂️' },
  { phase: 'syncing_matches', message: 'Setting up fixtures...', emoji: '📅' },
  { phase: 'syncing_tournaments', message: 'Preparing tournaments...', emoji: '🏆' },
  { phase: 'complete', message: 'Ready to score!', emoji: '🎯' },
  { phase: 'local_only', message: 'Playing offline!', emoji: '📱' },
];

export function SyncInitializer({ children, onComplete }: SyncInitializerProps) {
  const [phase, setPhase] = useState<InitPhase>('checking_setup');
  const [progress, setProgress] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);

  // Cycle through loading messages
  useEffect(() => {
    if (phase === 'syncing') {
      const messages = ['syncing_teams', 'syncing_matches', 'syncing_tournaments'];
      let index = 0;
      const interval = setInterval(() => {
        index = (index + 1) % messages.length;
        setCurrentMessageIndex(index);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [phase]);

  useEffect(() => {
    initializeSync();
  }, []);

  const initializeSync = async () => {
    try {
      // Check if user wants to skip cloud sync
      if (shouldSkipCloudSync()) {
        console.log('[Sync Initializer] Cloud sync skipped - using local storage only');
        
        // Clear sync queue since we're in local-only mode
        SyncEngine.clearQueue();
        
        setPhase('local_only');
        setProgress(100);
        setTimeout(() => {
          setPhase('complete');
          onComplete?.();
        }, 1000);
        return;
      }

      // Phase 0: Check database setup
      setPhase('checking_setup');
      setProgress(5);

      const status = await checkDatabaseSetup();
      setSetupStatus(status);

      if (!status.isComplete) {
        console.log('[Sync Initializer] Database setup incomplete:', status);
        
        // Clear any existing sync queue since database isn't ready
        console.log('[Sync Initializer] Clearing sync queue - database not ready');
        SyncEngine.clearQueue();
        
        setPhase('setup_required');
        return;
      }

      console.log('[Sync Initializer] Database setup verified');
      setProgress(15);

      // Phase 1: Check if migration is needed
      setPhase('checking');
      setProgress(25);

      const needsMigration = DataMigration.isMigrationNeeded();
      
      if (needsMigration) {
        // Phase 2: Migrate data
        setPhase('migrating');
        setProgress(45);

        await DataMigration.performFullMigration();
        setProgress(65);
      } else {
        setProgress(65);
      }

      // Phase 3: Initial sync
      setPhase('syncing');
      setProgress(85);

      await SyncEngine.autoSync();
      setProgress(100);

      // Complete
      setPhase('complete');
      
      setTimeout(() => {
        onComplete?.();
      }, 800);

    } catch (err) {
      console.error('[Sync Initializer] Error:', err);
      setPhase('error');
      setError(err instanceof Error ? err.message : 'Failed to initialize sync');
    }
  };

  const handleSkipSetup = () => {
    console.log('[Sync Initializer] User skipped cloud sync setup');
    setSkipCloudSync(true);
    
    // Clear any pending sync queue since we're going local-only
    localStorage.removeItem('vscor_sync_queue');
    localStorage.removeItem('vscor_sync_status');
    
    setPhase('local_only');
    setProgress(100);
    setTimeout(() => {
      setPhase('complete');
      onComplete?.();
    }, 1000);
  };

  const handleRetrySetup = async () => {
    console.log('[Sync Initializer] Retrying database setup check...');
    setPhase('checking_setup');
    setProgress(5);
    
    const status = await checkDatabaseSetup();
    setSetupStatus(status);
    
    if (status.isComplete) {
      console.log('[Sync Initializer] Setup verified! Continuing...');
      initializeSync();
    } else {
      setPhase('setup_required');
    }
  };

  const retry = () => {
    setError(null);
    setProgress(0);
    initializeSync();
  };

  const getCurrentMessage = () => {
    if (phase === 'syncing') {
      const syncMessages = loadingMessages.filter(m => m.phase.startsWith('syncing_'));
      return syncMessages[currentMessageIndex % syncMessages.length];
    }
    return loadingMessages.find(m => m.phase === phase) || loadingMessages[0];
  };

  // Show database setup wizard if tables are missing
  if (phase === 'setup_required' && setupStatus) {
    return (
      <DatabaseSetupWizard
        setupStatus={setupStatus}
        onSkip={handleSkipSetup}
        onRetry={handleRetrySetup}
      />
    );
  }

  // Show initialization overlay
  if (phase !== 'complete') {
    const currentMsg = getCurrentMessage();
    
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 z-50 flex items-center justify-center overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 border-4 border-white rounded-full animate-ping" style={{ animationDuration: '3s' }} />
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 border-4 border-white rounded-full animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        </div>

        <div className="max-w-md w-full mx-4 relative z-10">
          <div className="bg-white rounded-3xl shadow-2xl p-8 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full -mr-16 -mt-16 opacity-50" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-100 rounded-full -ml-12 -mb-12 opacity-50" />
            
            {/* Content */}
            <div className="relative">
              {/* Header with Football Animation */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-24 h-24 mb-4 relative">
                  {phase === 'error' ? (
                    <AlertCircle className="w-16 h-16 text-red-500" />
                  ) : phase === 'complete' || phase === 'local_only' ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    >
                      <CheckCircle2 className="w-16 h-16 text-green-500" />
                    </motion.div>
                  ) : (
                    <>
                      {/* Animated Football */}
                      <motion.div
                        className="relative"
                        animate={{
                          y: [0, -20, 0],
                          rotate: [0, 360],
                        }}
                        transition={{
                          y: {
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                          },
                          rotate: {
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear"
                          }
                        }}
                      >
                        <div className="w-16 h-16 text-6xl">⚽</div>
                      </motion.div>
                      {/* Shadow */}
                      <motion.div
                        className="absolute bottom-0 w-12 h-2 bg-gray-300 rounded-full blur-sm"
                        animate={{
                          scale: [1, 0.8, 1],
                          opacity: [0.3, 0.5, 0.3]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    </>
                  )}
                </div>
                
                <motion.h2 
                  className="text-3xl font-bold text-gray-900 mb-3"
                  key={phase}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {phase === 'error' ? 'Oops! Penalty!' : 'VScor'}
                </motion.h2>
                
                <motion.div
                  key={currentMsg.message}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center justify-center gap-2"
                >
                  <span className="text-2xl">{currentMsg.emoji}</span>
                  <p className="text-lg text-gray-600 font-medium">{currentMsg.message}</p>
                </motion.div>
              </div>

              {/* Progress Bar */}
              {phase !== 'error' && (
                <div className="mb-6">
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                    <motion.div 
                      className="bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 h-3 rounded-full relative overflow-hidden"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                      {/* Shimmer effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      />
                    </motion.div>
                  </div>
                  <div className="mt-3 text-center">
                    <span className="text-sm font-semibold text-purple-600">{progress}%</span>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {phase === 'error' && error && (
                <motion.div 
                  className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <p className="text-sm text-red-700 text-center font-medium">{error}</p>
                </motion.div>
              )}

              {/* Loading Steps */}
              {phase !== 'error' && phase !== 'complete' && (
                <div className="space-y-2 mb-6">
                  {['Database', 'Teams', 'Players', 'Matches'].map((item, index) => (
                    <motion.div
                      key={item}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                        progress > (index + 1) * 20 ? 'bg-purple-50' : 'bg-gray-50'
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                        progress > (index + 1) * 20 ? 'bg-purple-600' : 'bg-gray-300'
                      }`}>
                        {progress > (index + 1) * 20 ? (
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        ) : progress === (index + 1) * 20 ? (
                          <Loader2 className="w-4 h-4 text-white animate-spin" />
                        ) : (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <span className={`text-sm font-medium ${
                        progress > (index + 1) * 20 ? 'text-purple-700' : 'text-gray-500'
                      }`}>
                        {item}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Actions */}
              {phase === 'error' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <button
                    onClick={retry}
                    className="w-full px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 font-semibold shadow-lg"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Try Again
                  </button>
                </motion.div>
              )}
            </div>
          </div>

          {/* Info Footer */}
          <motion.div 
            className="mt-6 text-center text-white text-sm opacity-90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            transition={{ delay: 0.5 }}
          >
            <p className="flex items-center justify-center gap-2">
              {phase === 'local_only' ? (
                <>
                  <span>📱</span>
                  <span>Playing in offline mode</span>
                </>
              ) : (
                <>
                  <span>⚡</span>
                  <span>Setting up your football hub...</span>
                </>
              )}
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Initialization complete - render children
  return <>{children}</>;
}
