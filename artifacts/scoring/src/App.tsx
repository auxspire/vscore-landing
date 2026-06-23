// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from "react";

// CRITICAL: Suppress AbortErrors INLINE before any imports
(() => {
  const origError = console.error;
  const origWarn = console.warn;
  const origLog = console.log;
  
  const shouldSuppress = (...args: any[]) => {
    const str = args.join(' ');
    return (
      str.includes('AbortError') ||
      str.includes('Lock broken') ||
      str.includes('gotrue-js: Lock') ||
      str.includes('not released within') ||
      str.includes('Multiple GoTrueClient instances')
    );
  };
  
  console.error = (...args: any[]) => { if (!shouldSuppress(...args)) origError.apply(console, args); };
  console.warn  = (...args: any[]) => { if (!shouldSuppress(...args)) origWarn.apply(console, args); };
  console.log   = (...args: any[]) => { if (!shouldSuppress(...args)) origLog.apply(console, args); };
})();

// MUST BE FIRST: Suppress Supabase AbortErrors before any other code runs
import './utils/suppressAbortErrors';
// TEMPORARILY DISABLED - Testing if these cause the crash
// import './utils/debugLogger'; // Initialize debug logger FIRST
// import './utils/errorDisplay'; // Initialize visual error display (pure JS version)
import LiveMatchesScreen from "./components/LiveMatchesScreen";
import ScoringTab from "./components/ScoringTab";
import InfoTab from "./components/InfoTab";
import PlayersList from "./components/PlayersList";
import TeamsList from "./components/TeamsList";
import TournamentsList from "./components/TournamentsList";
import StatsPage from "./components/StatsPage";
import NewMatch from "./components/NewMatch";
import SelectSquad from "./components/SelectSquad";
import LiveScoring from "./components/LiveScoring";
import AddTeam from "./components/AddTeam";
import AddTournament from "./components/AddTournament";
import AddPlayer from "./components/AddPlayer";
import PlayerProfile from "./components/PlayerProfile";
import TeamProfile from "./components/TeamProfile";
import PlayerProfileScreen from "./components/PlayerProfileScreen";
import TeamProfileScreen from "./components/TeamProfileScreen";
import TournamentProfileScreen from "./components/TournamentProfileScreenUpdated";
import MatchEventsScreen from "./components/MatchEventsScreen";
import ReviewRatings from "./components/ReviewRatings";
import EnterMatchResult from "./components/EnterMatchResult";
import SplashScreen from "./components/SplashScreen";
import LoginScreen from "./components/LoginScreen";
import EditMatchEvents from "./components/EditMatchEvents";
import CalculatePayment from "./components/CalculatePayment";
import TransferMatchOwnership from "./components/TransferMatchOwnership";
import { AuthCallback } from "./components/AuthCallback";
import MyMatches from "./components/MyMatches";
import Notifications from "./components/Notifications";
import MatchPayments from "./components/MatchPayments";
import { Toaster } from './components/ui/sonner';
import { silentStartupCheck } from './utils/database/debugHelpers';
import { 
  addTeamToMasterTable, 
  findTeamByName, 
  getAllMasterTeams 
} from './utils/teamManagement';
import { isAuthenticated, getCurrentUser, clearUserCache, signOut, supabase } from './utils/auth';
import { migrateAllToOwnership, forceReMigrateOwnership } from './utils/ownershipMigration';
import type { VScorUser } from './utils/auth';
import { pullAllFromCloud, debouncedSync } from './utils/cloudSync';
import { toast } from 'sonner';
import { notifyProfileCreated } from './utils/notifications';
import {
  createPlayerOwnership,
  createTeamOwnership,
  createTournamentOwnership,
  updateOwnershipMetadata,
  transferTeamOwnership,
  addTeamCoordinator,
  removeTeamCoordinator,
} from './utils/ownership';
import {
  Tv,
  Target,
  Info,
  Plus,
  User,
  Settings,
  LogOut,
  Trophy,
  Medal,
  BarChart3,
  Wallet,
  ChevronDown,
  CirclePlay,
  Star,
  Mail,
  Share2,
  BookOpen,
  HelpCircle,
  Shield,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  Menu,
  Moon,
  Sun,
  Bell,
} from "lucide-react";

type TabType = "live" | "scoring" | "info";
type ViewType =
  | "main"
  | "newMatch"
  | "selectSquad"
  | "liveScoring"
  | "reviewRatings"
  | "addTeam"
  | "addTournament"
  | "addPlayer"
  | "playerProfile"
  | "teamProfile"
  | "tournamentProfile"
  | "matchEvents"
  | "editMatchEvents"
  | "playersList"
  | "teamsList"
  | "tournamentsList"
  | "statsPage"
  | "enterMatchResult"
  | "calculatePayment"
  | "playerMatches"
  | "myMatches"
  | "matchPayments"
  | "notifications"
  | "transferMatchOwnership"
  | "info"
  | "liveMatchDetails";

interface Match {
  id: number;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  status: string;
  time?: string;
  venue?: string;
  // Match ownership and scoring
  ownedBy?: string;        // User ID of match owner (creator by default, can be transferred)
  scoredBy1?: string;      // User ID of first scorer
  scoredBy2?: string;      // User ID of second scorer (optional, advanced mode)
  // Legacy fields (for backward compatibility during migration)
  scoredBy?: string;       // Old field - maps to ownedBy
  primaryScorer?: { user_id: string; name: string };
  secondaryScorer?: { user_id: string; name: string };
}

interface Player {
  id: number;
  name: string;
  teams?: Array<{ teamId: number; teamName: string; jerseyNumber?: string }>;
  // Legacy fields for backward compatibility
  teamId?: number | null;
  teamName?: string | null;
  jerseyNumber: string; // Default jersey number
  position: string;
  phoneNumber?: string;
  email?: string;
  imageUrl?: string;
  // Ownership metadata
  created_by?: string;
  owner_user_id?: number;
}

interface Team {
  id: number;
  name: string;
  coach: string;
  homeVenue: string;
  players: any[];
  coordinators?: Array<{ name: string; phone: string; email: string; user_id?: number }>;
  // Ownership metadata
  created_by?: string;
  owner_user_id?: number;
  coordinator_user_ids?: number[]; // Up to 3 coordinators (must include owner)
  created_at?: string;
  updated_at?: string;
  updated_by?: string;
}

interface Tournament {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  teams: string[];
  coordinators?: Array<{ name: string; phone: string; email: string; user_id?: number }>;
  // Ownership metadata
  created_by?: string;
  owner_user_id?: number;
  coordinator_user_ids?: number[]; // Up to 3 coordinators (must include owner)
}

// LocalStorage keys
const STORAGE_KEYS = {
  PLAYERS: "vscor_players",
  TEAMS: "vscor_teams",
  TOURNAMENTS: "vscor_tournaments",
  MATCHES: "vscor_matches",
  ONGOING_MATCHES: "vscor_ongoing_matches",
  COMPLETED_MATCHES: "vscor_completed_matches",
};

// Production: no seeded demo data — users register their own teams
const DEFAULT_TEAMS: never[] = [];
const DEFAULT_PLAYERS: never[] = [];

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<VScorUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("live");

  // ─── Cloud sync guards ────────────────────────────────────────────────────
  // cloudSyncReady: true only after the first successful cloud pull.
  //   Prevents push effects from firing before we've loaded the canonical data.
  // isSyncing: true while a cloud pull is in progress.
  //   Prevents any push from running concurrently with a pull.
  const cloudSyncReady = useRef(false);
  const isSyncing = useRef(false);

  // When LoginScreen shows a profile-merge dialog, it sets this flag so that
  // the Supabase onAuthStateChange SIGNED_IN handler does NOT call setIsLoggedIn(true)
  // and unmount LoginScreen while the user is still interacting with the dialog.
  const mergeDialogActiveRef = useRef(false);

  // Helper: gate every debounced push through both guards.
  // Uses a ref-forwarded accessor so the closure inside useEffect always
  // reads the current accessToken state without needing it in deps.
  const accessTokenRef = useRef<string | null>(null);
  useEffect(() => { accessTokenRef.current = accessToken; }, [accessToken]);

  const syncToCloud = useCallback((type: Parameters<typeof debouncedSync>[0], data: any[], immediate: boolean = false) => {
    if (accessTokenRef.current && cloudSyncReady.current && !isSyncing.current) {
      debouncedSync(type, data, accessTokenRef.current, immediate);
    }
  }, []);
  const [currentView, setCurrentView] =
    useState<ViewType>("main");
  const [selectedMatch, setSelectedMatch] =
    useState<Match | null>(null);
  const [selectedPlayer, setSelectedPlayer] =
    useState<Player | null>(null);
  const [selectedPlayerMatchFilter, setSelectedPlayerMatchFilter] =
    useState<'all' | 'goals' | 'assists' | 'yellowCards' | 'redCards' | 'rated'>('all');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(
    null,
  );
  const [selectedTournament, setSelectedTournament] =
    useState<Tournament | null>(null);
  const [pendingMatch, setPendingMatch] = useState<any>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAppMenu, setShowAppMenu] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false); // Track manual refresh state
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0); // Track unread notifications
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Load dark mode preference from localStorage
    const saved = localStorage.getItem('vscor_dark_mode');
    return saved ? JSON.parse(saved) : false;
  });

  // Polling interval refs
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const liveMatchPollingRef = useRef<NodeJS.Timeout | null>(null);

  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Save preference to localStorage
    localStorage.setItem('vscor_dark_mode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Toggle dark mode function
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Load unread notifications count from localStorage on mount and when view changes
  useEffect(() => {
    const loadNotificationsCount = () => {
      // For now, we'll use a simple counter from localStorage
      // In the future, this will be calculated from actual notification data
      const count = parseInt(localStorage.getItem('vscor_unread_notifications_count') || '0', 10);
      setUnreadNotificationsCount(count);
    };
    
    loadNotificationsCount();
    
    // Set up an interval to check for new notifications (every 30 seconds)
    const intervalId = setInterval(loadNotificationsCount, 30000);
    
    return () => clearInterval(intervalId);
  }, [currentView]); // Reload when view changes so badge updates after visiting notifications

  // Check if this is an OAuth callback (popup)
  useEffect(() => {
    const isOAuthCallback = window.location.hash.includes('access_token') || 
                           window.location.hash.includes('error');
    
    if (isOAuthCallback && window.opener) {
      // This is the callback page in the popup - render AuthCallback component
      console.log('🔐 OAuth callback detected in popup');
    }
  }, []);

  // Global error handler and console override for AbortError suppression
  useEffect(() => {
    // Store original console methods
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const originalConsoleLog = console.log;
    
    // Helper to check if arguments contain AbortError
    const isAbortError = (args: any[]) => {
      return args.some(arg => {
        if (arg instanceof Error && arg.name === 'AbortError') return true;
        if (typeof arg === 'string' && arg.includes('AbortError') && arg.includes('Lock broken')) return true;
        if (arg?.name === 'AbortError') return true;
        if (arg?.message?.includes('Lock broken')) return true;
        return false;
      });
    };
    
    // Override console.error
    console.error = (...args: any[]) => {
      if (isAbortError(args)) return; // Silently suppress
      originalConsoleError.apply(console, args);
    };
    
    // Override console.warn
    console.warn = (...args: any[]) => {
      if (isAbortError(args)) return; // Silently suppress
      originalConsoleWarn.apply(console, args);
    };
    
    // Override console.log (just in case)
    console.log = (...args: any[]) => {
      if (isAbortError(args)) return; // Silently suppress
      originalConsoleLog.apply(console, args);
    };
    
    const handleError = (event: ErrorEvent) => {
      // Suppress AbortErrors from Supabase auth locks
      if (event.error?.name === 'AbortError' && 
          event.error?.message?.includes('Lock broken')) {
        event.preventDefault();
        return;
      }
      
      console.error('🚨🚨🚨 GLOBAL ERROR HANDLER CAUGHT:', event.error);
      console.error('🚨 Error message:', event.message);
      console.error('🚨 Error filename:', event.filename);
      console.error('🚨 Error line:', event.lineno);
      console.error('🚨 Error col:', event.colno);
      console.error('🚨 Error stack:', event.error?.stack);
      
      // Don't prevent default - let error be shown
      return true;
    };

    const handlePromiseRejection = (event: PromiseRejectionEvent) => {
      // Silently suppress AbortErrors from Supabase auth locks - they're expected and handled
      if (event.reason?.name === 'AbortError' && 
          event.reason?.message?.includes('Lock broken')) {
        event.preventDefault();
        return;
      }
      
      console.error('🚨🚨🚨 UNHANDLED PROMISE REJECTION:', event.reason);
      console.error('🚨 Promise:', event.promise);
      
      // Don't prevent default - let error be shown
      return true;
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handlePromiseRejection);

    return () => {
      // Restore original console methods
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      console.log = originalConsoleLog;
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handlePromiseRejection);
    };
  }, []);

  // Pull cloud data and merge with local storage.
  // Guards: sets isSyncing=true for the duration so push effects are blocked,
  // then sets cloudSyncReady=true afterwards so future data changes can push.
  const loadCloudData = async () => {
    if (isSyncing.current) {
      console.log('[App] Cloud pull already in progress, skipping');
      return;
    }
    
    isSyncing.current = true;
    try {
      console.log('[App] 🌐 Loading cloud data...');
      const cloudData = await pullAllFromCloud();
      if (!cloudData) {
        console.log('[App] ⚠️ Cloud sync unavailable - continuing with local data. The app will work normally with locally stored data.');
        // Don't return early — fall through to finally so guards are released
      } else {

      // Merge cloud data with localStorage for each data type
      const mergeAndSave = (cloudArray: any[], localKey: string) => {
        if (cloudArray && cloudArray.length > 0) {
          localStorage.setItem(localKey, JSON.stringify(cloudArray));
          return cloudArray;
        }
        return null;
      };

      // Ownership-preserving merge for teams and tournaments.
      // If a cloud copy of an entity is missing coordinator_user_ids / created_by
      // (e.g. it was pushed before ownership was implemented, or it's a DEFAULT_TEAMS
      // entry that snuck in), restore those fields from the current local copy.
      // This prevents a cloud overwrite from wiping ownership data that was
      // stamped by the migration or by handleAddTeam.
      const mergeAndSaveWithOwnership = (cloudArray: any[], localKey: string) => {
        if (!cloudArray || cloudArray.length === 0) return null;
        // Build a lookup of local entities by id
        let localMap: Record<string, any> = {};
        try {
          const localRaw = localStorage.getItem(localKey);
          if (localRaw) {
            const localArr: any[] = JSON.parse(localRaw);
            localArr.forEach((item: any) => {
              if (item.id != null) localMap[String(item.id)] = item;
            });
          }
        } catch { /* ignore parse errors */ }

        const merged = cloudArray.map((cloudItem: any) => {
          const localItem = localMap[String(cloudItem.id)];
          if (!localItem) return cloudItem;
          // Restore ownership fields if the cloud copy is missing them
          return {
            ...cloudItem,
            ...(cloudItem.coordinator_user_ids == null && localItem.coordinator_user_ids != null
              ? { coordinator_user_ids: localItem.coordinator_user_ids } : {}),
            ...(cloudItem.created_by == null && localItem.created_by != null
              ? { created_by: localItem.created_by } : {}),
            ...(cloudItem.updated_by == null && localItem.updated_by != null
              ? { updated_by: localItem.updated_by } : {}),
            ...(cloudItem.created_at == null && localItem.created_at != null
              ? { created_at: localItem.created_at } : {}),
            ...(cloudItem.updated_at == null && localItem.updated_at != null
              ? { updated_at: localItem.updated_at } : {}),
          };
        });
        localStorage.setItem(localKey, JSON.stringify(merged));
        return merged;
      };

      // Smart merge for matches that protects recently completed matches from being overwritten
      const mergeMatches = (cloudMatches: any[], localKey: string) => {
        if (!cloudMatches || cloudMatches.length === 0) return null;
        
        try {
          const localRaw = localStorage.getItem(localKey);
          if (!localRaw) {
            localStorage.setItem(localKey, JSON.stringify(cloudMatches));
            return cloudMatches;
          }
          
          const localMatches: any[] = JSON.parse(localRaw);
          const localMap: Record<string, any> = {};
          const cloudMap: Record<string, any> = {};
          
          // Build lookup maps
          localMatches.forEach(m => { if (m.id != null) localMap[String(m.id)] = m; });
          cloudMatches.forEach(m => { if (m.id != null) cloudMap[String(m.id)] = m; });
          
          // Merge strategy: For each match ID, keep the version with the most recent completedAt or updatedAt
          const allIds = new Set([...Object.keys(localMap), ...Object.keys(cloudMap)]);
          const merged: any[] = [];
          
          allIds.forEach(id => {
            const local = localMap[id];
            const cloud = cloudMap[id];
            
            if (!cloud) {
              // Only in local - keep it
              merged.push(local);
            } else if (!local) {
              // Only in cloud - take it
              merged.push(cloud);
            } else {
              // In both - compare timestamps
              const localTime = new Date(local.completedAt || local.updatedAt || 0).getTime();
              const cloudTime = new Date(cloud.completedAt || cloud.updatedAt || 0).getTime();
              
              // Keep the more recent version
              merged.push(localTime > cloudTime ? local : cloud);
            }
          });
          
          localStorage.setItem(localKey, JSON.stringify(merged));
          return merged;
        } catch {
          // On error, just use cloud data
          localStorage.setItem(localKey, JSON.stringify(cloudMatches));
          return cloudMatches;
        }
      };

      const cloudPlayers    = mergeAndSave(cloudData.players,                        STORAGE_KEYS.PLAYERS);
      const cloudTeams      = mergeAndSaveWithOwnership(cloudData.teams,             STORAGE_KEYS.TEAMS);
      const cloudTournaments= mergeAndSaveWithOwnership(cloudData.tournaments,       STORAGE_KEYS.TOURNAMENTS);
      const cloudOngoing    = mergeMatches(cloudData.ongoing_matches,                STORAGE_KEYS.ONGOING_MATCHES);
      const cloudCompleted  = mergeMatches(cloudData.completed_matches,              STORAGE_KEYS.COMPLETED_MATCHES);

      // master_teams and tournament_teams are managed via localStorage-only utils.
      // Write to localStorage; components re-read on next render cycle.
      if (cloudData.master_teams && cloudData.master_teams.length > 0) {
        localStorage.setItem('vscor_master_teams', JSON.stringify(cloudData.master_teams));
      }
      if (cloudData.tournament_teams && cloudData.tournament_teams.length > 0) {
        localStorage.setItem('vscor_tournament_teams', JSON.stringify(cloudData.tournament_teams));
      }

      // Update React state — isSyncing is still true here so these state
      // changes will NOT trigger cloud pushes (no echo-back of pulled data).
      if (cloudPlayers)      setPlayerDatabase(cloudPlayers);
      if (cloudTeams)        setRegisteredTeams(cloudTeams);
      if (cloudTournaments)  setTournaments(cloudTournaments);
      if (cloudOngoing)      setOngoingMatches(cloudOngoing);
      if (cloudCompleted)    setCompletedMatches(cloudCompleted);

      console.log('[App] ✅ Cloud data loaded:', {
        players:         cloudPlayers?.length      ?? 0,
        teams:           cloudTeams?.length        ?? 0,
        tournaments:     cloudTournaments?.length  ?? 0,
        ongoing:         cloudOngoing?.length      ?? 0,
        completed:       cloudCompleted?.length    ?? 0,
        master_teams:    cloudData.master_teams?.length    ?? 0,
        tournament_teams:cloudData.tournament_teams?.length ?? 0,
      });
      } // end else (cloudData exists)
    } catch (error: any) {
      // Silently ignore aborted requests - this is expected when polling is cancelled
      if (error?.name === 'AbortError') {
        console.log('[App] Cloud sync request aborted (expected during rapid polling)');
      } else {
        console.error('[App] ⚠️ Cloud sync error (app will continue with local data):', error);
      }
      // App continues to function with local data even if cloud sync fails
    } finally {
      // Release pull lock and enable future data-change pushes
      isSyncing.current = false;
      cloudSyncReady.current = true;
      console.log('[App] 🔓 Cloud sync ready — data changes will now push to cloud');
    }
  };

  // Manual refresh function that can be called from UI
  const handleManualRefresh = async () => {
    if (isRefreshing || isSyncing.current) {
      console.log('[App] Refresh already in progress, skipping');
      return;
    }
    
    setIsRefreshing(true);
    console.log('[App] 🔄 Manual refresh triggered...');
    
    try {
      await loadCloudData();
      console.log('[App] ✅ Manual refresh completed');
    } catch (error) {
      console.error('[App] ❌ Manual refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Start background polling for data sync (infrequent for non-live screens)
  const startPolling = useCallback(() => {
    // Clear any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    console.log('[App] 🔁 Starting background data polling (60 second interval)');
    
    // Poll every 60 seconds for general data (reduced frequency from 30s)
    // Only used when NOT on live screens
    pollingIntervalRef.current = setInterval(() => {
      if (!isSyncing.current && isLoggedIn) {
        console.log('[App] ⏰ Background poll: Loading cloud data...');
        loadCloudData().catch(err => {
          // Only log non-abort errors
          if (err?.name !== 'AbortError') {
            console.error('[App] Background poll error:', err);
          }
        });
      }
    }, 60000); // 60 seconds (reduced from 30 seconds)
  }, [isLoggedIn]);

  // Start aggressive polling for live content when viewing live matches
  const startLiveMatchPolling = useCallback(() => {
    if (liveMatchPollingRef.current) {
      clearInterval(liveMatchPollingRef.current);
    }
    
    console.log('[App] ⚡ Starting live match polling (4 second interval)');
    
    // Poll every 4 seconds for live match updates
    // Used ONLY on Live Scores Tab and Match Events screen
    liveMatchPollingRef.current = setInterval(() => {
      if (!isSyncing.current && isLoggedIn) {
        console.log('[App] 🏃 Live match poll: Loading latest data...');
        loadCloudData().catch(err => {
          // Only log non-abort errors
          if (err?.name !== 'AbortError') {
            console.error('[App] Live match poll error:', err);
          }
        });
      }
    }, 4000); // 4 seconds for good balance between server load and real-time feel
  }, [isLoggedIn]);

  // Stop live match polling
  const stopLiveMatchPolling = useCallback(() => {
    if (liveMatchPollingRef.current) {
      console.log('[App] ⏸️ Stopping live match polling');
      clearInterval(liveMatchPollingRef.current);
      liveMatchPollingRef.current = null;
    }
  }, []);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      if (liveMatchPollingRef.current) clearInterval(liveMatchPollingRef.current);
    };
  }, []);

  // NOTE: Polling is now controlled by the screen-aware effect below
  // This ensures we only poll aggressively on screens that need real-time updates

  // Control live match polling based on active tab and current view
  // Smart Sync Strategy: Only poll aggressively when users need real-time data
  useEffect(() => {
    // Screens that need real-time updates (aggressive polling)
    const needsLivePolling = 
      activeTab === 'live' || // Live Scores Tab
      currentView === 'matchEvents' || // Match Events Screen
      currentView === 'liveMatchDetails'; // Live Match Details
    
    if (isLoggedIn && needsLivePolling) {
      // Start aggressive polling when viewing live content
      console.log('[App] 📡 Enabling aggressive polling for real-time updates');
      stopLiveMatchPolling(); // Stop background polling first
      startLiveMatchPolling(); // Start live polling
      
      // Stop background polling to avoid redundant requests
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    } else if (isLoggedIn) {
      // Use infrequent background polling for other screens
      console.log('[App] 📡 Using background polling (low frequency)');
      stopLiveMatchPolling(); // Stop live polling
      startPolling(); // Start background polling
    } else {
      // Not logged in - stop all polling
      stopLiveMatchPolling();
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
    
    return () => {
      stopLiveMatchPolling();
    };
  }, [isLoggedIn, activeTab, currentView, startLiveMatchPolling, stopLiveMatchPolling, startPolling]);

  // Handle visibility change - refresh data when user returns to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isLoggedIn && !isSyncing.current) {
        console.log('[App] 👀 Tab became visible - refreshing data...');
        loadCloudData().catch(err => {
          // Only log non-abort errors
          if (err?.name !== 'AbortError') {
            console.error('[App] Visibility refresh error:', err);
          }
        });
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLoggedIn]);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await isAuthenticated();
        if (authenticated) {
          const user = await getCurrentUser();
          setCurrentUser(user);
          setIsLoggedIn(true);

          // Get access token for cloud sync
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
              setAccessToken(session.access_token);
            }
          } catch (e) {
            console.error('[App] Error getting session token:', e);
          }

          // Pull latest data from cloud
          await loadCloudData();
          
          // Step 1: Force re-migration with the correct (Supabase auth) user ID.
          // This overwrites any legacy random UUIDs that were stamped in previous sessions.
          // Guarded by a version flag — only runs once per browser after this deploy.
          try { 
            if (user?.user_id) {
              forceReMigrateOwnership(user.user_id);
            }
          } catch (e) { console.error('forceReMigrate error:', e); }

          // Step 2: Regular migration for any still-missing ownership fields.
          try {
            if (user?.user_id) {
              migrateAllToOwnership(user.user_id);
            }
            const migratedTeams = JSON.parse(localStorage.getItem(STORAGE_KEYS.TEAMS) || '[]');
            if (migratedTeams.length > 0) {
              setRegisteredTeams(migratedTeams);
              // Push migrated teams immediately so cloud stores the correct ownership fields
              const token = accessTokenRef.current;
              if (token) {
                debouncedSync('teams', migratedTeams, token);
              }
            }
          } catch (error) {
            console.error('Ownership migration error:', error);
          }
        }
      } catch (error) {
        console.error('❌ [checkAuth] Error during auth check:', error);
      }
    };
    
    checkAuth();

    // Listen for auth state changes (OAuth callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      try {
        console.log('🔐 Auth state changed:', event);
        console.log('📋 Session:', session ? 'Present' : 'None');
        
        if (event === 'SIGNED_IN' && session) {
          console.log('✅ User signed in, getting profile...');

          // If LoginScreen is currently showing a merge-profile dialog, don't
          // transition to the main app yet — let the dialog complete first.
          // The dialog's onResolved → onLoginComplete will handle setIsLoggedIn(true).
          if (mergeDialogActiveRef.current) {
            console.log('⏸️ [onAuthStateChange] Merge dialog active — deferring auto-login. Storing token only.');
            if (session?.access_token) setAccessToken(session.access_token);
            return;
          }

          // Store access token for cloud sync
          if (session?.access_token) {
            setAccessToken(session.access_token);
          }

          try {
            const user = await getCurrentUser();
            console.log('📝 User profile retrieved:', user);
            
            if (user) {
              setCurrentUser(user);
              setIsLoggedIn(true);

              // Pull latest data from cloud after sign in
              await loadCloudData();

              // Step 1: Force re-migration with the correct (Supabase auth) user ID
              try { 
                if (user?.user_id) {
                  forceReMigrateOwnership(user.user_id);
                }
              } catch (e) { console.error('forceReMigrate error:', e); }

              // Step 2: Regular migration + push correct ownership back to cloud
              try {
                if (user?.user_id) {
                  migrateAllToOwnership(user.user_id);
                }
                const migratedTeams = JSON.parse(localStorage.getItem(STORAGE_KEYS.TEAMS) || '[]');
                if (migratedTeams.length > 0) {
                  setRegisteredTeams(migratedTeams);
                  const token = session?.access_token ?? accessTokenRef.current;
                  if (token) {
                    debouncedSync('teams', migratedTeams, token);
                  }
                }
              } catch (migrationError) {
                console.error('⚠️ Ownership migration error (non-critical):', migrationError);
              }
            } else {
              console.error('❌ Failed to get user profile - user is null');
            }
          } catch (userError) {
            console.error('❌ Error getting user profile:', userError);
          }
        } else if (event === 'TOKEN_REFRESHED' && session?.access_token) {
          // Keep accessToken state current so the "logged-in" indicator stays valid
          setAccessToken(session.access_token);
          console.log('🔄 Access token refreshed');
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          setCurrentUser(null);
          setIsLoggedIn(false);
          setAccessToken(null);
          // Reset sync guards so the next login starts a clean pull cycle
          cloudSyncReady.current = false;
          isSyncing.current = false;
        } else {
          console.log('ℹ️ Other auth event:', event);
        }
      } catch (error) {
        console.error('❌ [onAuthStateChange] Critical error:', error);
        // Don't crash the app - just log the error
      }
    });

    // Cleanup subscription on unmount
    return () => {
      try {
        subscription.unsubscribe();
      } catch (error) {
        console.error('Error unsubscribing from auth changes:', error);
      }
    };
  }, []);

  // Load initial data from localStorage or use defaults
  const loadFromStorage = (key: string, defaultValue: any) => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (error) {
      console.error(
        `Error loading ${key} from localStorage:`,
        error,
      );
      return defaultValue;
    }
  };

  // Initialize player database with unassigned players
  const initialPlayers: Player[] = loadFromStorage(
    STORAGE_KEYS.PLAYERS,
    DEFAULT_PLAYERS,
  );

  // Initialize team database
  const initialTeams: Team[] = loadFromStorage(
    STORAGE_KEYS.TEAMS,
    DEFAULT_TEAMS,
  );

  // Initialize tournament database
  const initialTournaments: Tournament[] = loadFromStorage(
    STORAGE_KEYS.TOURNAMENTS,
    [],
  );

  // Initialize match database
  const initialMatches: Match[] = loadFromStorage(
    STORAGE_KEYS.MATCHES,
    [],
  );

  // Initialize ongoing matches
  const initialOngoingMatches = loadFromStorage(
    STORAGE_KEYS.ONGOING_MATCHES,
    [],
  );

  // Initialize completed matches
  const initialCompletedMatches = loadFromStorage(
    STORAGE_KEYS.COMPLETED_MATCHES,
    [],
  );

  // State for registered teams with their players
  const [registeredTeams, setRegisteredTeams] =
    useState<any[]>(initialTeams);

  // State for player database (all players in the app)
  const [playerDatabase, setPlayerDatabase] =
    useState<Player[]>(initialPlayers);

  // State for tournaments
  const [tournaments, setTournaments] = useState<Tournament[]>(initialTournaments);

  // State for ongoing matches (currently being scored)
  const [ongoingMatches, setOngoingMatches] = useState<any[]>(
    initialOngoingMatches,
  );

  // State for completed matches
  const [completedMatches, setCompletedMatches] = useState<
    any[]
  >(initialCompletedMatches);
  
  // Initialize Master Teams Table on app load (one-time migration)
  useEffect(() => {
    // First, run silent data integrity check and auto-fix any issues
    silentStartupCheck();
    
    const masterTeams = getAllMasterTeams();
    console.log("📊 Master Teams Table initialized:", masterTeams.length, "teams");
    
    // If Master Teams is empty but we have legacy teams, migrate them
    if (masterTeams.length === 0 && initialTeams.length > 0) {
      console.log("🔄 Starting migration of legacy teams to Master Teams Table...");
      initialTeams.forEach((team: any) => {
        const existingTeam = findTeamByName(team.name);
        if (!existingTeam) {
          addTeamToMasterTable({
            name: team.name,
            coach: team.coach,
            homeVenue: team.homeVenue,
            description: team.description,
            imageUrl: team.imageUrl,
            players: team.players || []
          });
        }
      });
      const migratedTeams = getAllMasterTeams();
      console.log("✅ Migration complete:", migratedTeams.length, "teams in Master Teams Table");
    }
  }, []);

  // Save to localStorage whenever playerDatabase changes + sync to cloud.
  // accessToken is intentionally NOT in the dep array — login must not trigger
  // a push. Only actual data changes push, and only after cloudSyncReady=true.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(playerDatabase));
    syncToCloud('players', playerDatabase);
  }, [playerDatabase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save to localStorage whenever registeredTeams changes + sync to cloud
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(registeredTeams));
    syncToCloud('teams', registeredTeams);
  }, [registeredTeams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload teams from localStorage when navigating to teams-related views
  // This ensures teams created from tournament screens appear in the teams list
  useEffect(() => {
    if (currentView === 'teamsList' || currentView === 'info') {
      const teamsFromStorage = loadFromStorage(STORAGE_KEYS.TEAMS, []);
      // Only update if the count has changed to avoid infinite loops
      if (teamsFromStorage.length !== registeredTeams.length) {
        console.log('🔄 Reloading teams from localStorage:', teamsFromStorage.length, 'teams');
        setRegisteredTeams(teamsFromStorage);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView]);

  // Save to localStorage whenever ongoingMatches changes + sync to cloud
  // SMART SYNC: Use immediate push when actively scoring (on LiveScoring screen)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ONGOING_MATCHES, JSON.stringify(ongoingMatches));
    
    // Immediate push if user is actively scoring (no debounce)
    const isActivelyScoring = currentView === 'liveScoring';
    syncToCloud('ongoing_matches', ongoingMatches, isActivelyScoring);
    
    if (isActivelyScoring) {
      console.log('[App] 🚀 Immediate push: Scorer is actively updating match');
    }
  }, [ongoingMatches, currentView]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save to localStorage whenever completedMatches changes + sync to cloud
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COMPLETED_MATCHES, JSON.stringify(completedMatches));
    syncToCloud('completed_matches', completedMatches);
  }, [completedMatches]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save to localStorage whenever tournaments changes + sync to cloud
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify(tournaments));
    syncToCloud('tournaments', tournaments);
  }, [tournaments]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync master_teams to cloud when registeredTeams changes.
  // master_teams is managed by teamManagement.ts (localStorage-only),
  // so we read it at sync time from localStorage rather than React state.
  useEffect(() => {
    const masterTeams = (() => {
      try { return JSON.parse(localStorage.getItem('vscor_master_teams') || '[]'); }
      catch { return []; }
    })();
    syncToCloud('master_teams', masterTeams);
  }, [registeredTeams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync tournament_teams junction table to cloud when tournaments changes.
  useEffect(() => {
    const tournamentTeams = (() => {
      try { return JSON.parse(localStorage.getItem('vscor_tournament_teams') || '[]'); }
      catch { return []; }
    })();
    syncToCloud('tournament_teams', tournamentTeams);
  }, [tournaments]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddTeam = (teamData: any) => {
    console.log("=== ADD TEAM TO MASTER TABLE ===");
    console.log("Team data received:", teamData);
    
    // Merge ownership metadata from teamData (if provided) with createTeamOwnership()
    // teamData may already have coordinator_user_ids and owner_user_id from AddTeam
    let ownershipData: any = {};
    try {
      const baseOwnership = createTeamOwnership(); // sets created_by, default coordinator_user_ids, owner_user_id
      
      // If AddTeam provided coordinator_user_ids or owner_user_id, use those instead
      ownershipData = {
        ...baseOwnership,
        ...(teamData.coordinator_user_ids ? { coordinator_user_ids: teamData.coordinator_user_ids } : {}),
        ...(teamData.owner_user_id ? { owner_user_id: teamData.owner_user_id } : {}),
      };
      
      console.log("✅ Ownership data created:", ownershipData);
    } catch (e) {
      console.warn("⚠️ Could not create ownership data (user may not be authenticated):", e);
    }

    // Check if team already exists
    const existingTeam = findTeamByName(teamData.name);
    
    let teamId;
    if (existingTeam) {
      console.log("⚠️ Team already exists in Master Teams Table:", existingTeam);
      teamId = existingTeam.id;
    } else {
      // Add to Master Teams Table
      teamId = addTeamToMasterTable({
        name: teamData.name,
        coach: teamData.coach,
        homeVenue: teamData.homeVenue,
        description: teamData.description,
        imageUrl: teamData.imageUrl,
        players: teamData.players || []
      });
      console.log("✅ Team added to Master Teams Table with ID:", teamId);
    }
    
    const newTeam = {
      id: teamId,
      ...teamData,
      ...ownershipData, // stamps created_by, coordinator_user_ids, owner_user_id, created_at, updated_at
    };
    
    // Also update legacy registeredTeams for backward compatibility
    const updatedTeams = [...registeredTeams, newTeam];
    setRegisteredTeams(updatedTeams);
    console.log("Updated teams (legacy):", updatedTeams.length);
    console.log(
      "Teams in localStorage:",
      localStorage.getItem(STORAGE_KEYS.TEAMS),
    );
    console.log("=================================");
  };

  const handleAddPlayer = (playerData: any) => {
    try {
      // Add ownership metadata
      const ownershipData = createPlayerOwnership();
      
      const newPlayer: Player = {
        id: Date.now() + Math.random(), // Ensure unique IDs
        name: playerData.name,
        teams: playerData.teams || (playerData.teamId ? [{ 
          teamId: playerData.teamId, 
          teamName: playerData.teamName,
          jerseyNumber: playerData.jerseyNumber 
        }] : []),
        // Legacy fields for backward compatibility
        teamId: playerData.teamId || null,
        teamName: playerData.teamName || null,
        jerseyNumber: playerData.jerseyNumber || "",
        position: playerData.position,
        phoneNumber: playerData.phoneNumber || "",
        email: playerData.email || "",
        imageUrl: playerData.imageUrl || "",
        // Ownership metadata
        ...ownershipData,
      };
      
      console.log('=== HANDLE ADD PLAYER ===');
      console.log('New player data:', newPlayer);
      console.log('Teams array:', newPlayer.teams);
      console.log('Created by:', ownershipData.created_by);
      console.log('Owner:', ownershipData.owner_user_id);
      console.log('=======================');
      
      // Update player database
      setPlayerDatabase((prev) => {
        const updated = [...prev, newPlayer];
        console.log('Updated player database length:', updated.length);
        return updated;
      });

      // Sync player with teams - use functional form to get latest state
      if (newPlayer.teams && newPlayer.teams.length > 0) {
        setRegisteredTeams((prevTeams) => {
          const updated = prevTeams.map((team) => {
            const teamAssignment = newPlayer.teams.find(t => t.teamId === team.id);
            if (teamAssignment) {
              const existingPlayers = team.players || [];
              console.log(`Adding player to team ${team.name}. Current players:`, existingPlayers.length);
              return {
                ...team,
                players: [...existingPlayers, {
                  ...newPlayer,
                  jerseyNumber: teamAssignment.jerseyNumber || newPlayer.jerseyNumber
                }]
              };
            }
            return team;
          });
          console.log('Updated teams:', updated);
          return updated;
        });
      }
    } catch (error) {
      console.error('Error adding player:', error);
      alert('You must be logged in to create players');
    }
  };

  const handleAddMultiplePlayers = (playersData: any[]) => {
    const baseId = Date.now();
    const newPlayers = playersData.map((playerData, index) => ({
      id: baseId + index + Math.random() * 1000, // More unique IDs
      name: playerData.name,
      teams: playerData.teams || (playerData.teamId ? [{ 
        teamId: playerData.teamId, 
        teamName: playerData.teamName,
        jerseyNumber: playerData.jerseyNumber 
      }] : []),
      // Legacy fields for backward compatibility
      teamId: playerData.teamId || null,
      teamName: playerData.teamName || null,
      jerseyNumber: playerData.jerseyNumber || "",
      position: playerData.position,
      phoneNumber: playerData.phoneNumber || "",
      imageUrl: playerData.imageUrl || ""
    }));
    console.log("Adding multiple players:", newPlayers);
    setPlayerDatabase((prev) => [...prev, ...newPlayers]);
  };

  const handleAssignPlayerToTeam = (
    playerId: number,
    teamId: number,
    teamName: string,
    jerseyNumber?: string,
  ) => {
    let updatedPlayerData: Player | null = null;

    // Update player database first and capture the updated player data
    setPlayerDatabase((prevPlayers) =>
      prevPlayers.map((player) => {
        if (player.id === playerId) {
          const existingTeams = player.teams || [];
          const teamIndex = existingTeams.findIndex(t => t.teamId === teamId);
          
          let updatedTeams;
          if (teamIndex >= 0) {
            // Update existing team assignment
            updatedTeams = existingTeams.map((t, i) => 
              i === teamIndex ? { ...t, teamName, jerseyNumber: jerseyNumber || t.jerseyNumber } : t
            );
          } else {
            // Add new team assignment
            updatedTeams = [...existingTeams, { teamId, teamName, jerseyNumber }];
          }
          
          updatedPlayerData = { 
            ...player, 
            teams: updatedTeams,
            // Update legacy fields with first team
            teamId: updatedTeams[0]?.teamId || null,
            teamName: updatedTeams[0]?.teamName || null,
            jerseyNumber: jerseyNumber || player.jerseyNumber
          };
          
          return updatedPlayerData;
        }
        return player;
      }),
    );

    // Also update the team to include this player - use functional form
    setRegisteredTeams((prevTeams) =>
      prevTeams.map((team) => {
        if (team.id === teamId) {
          const existingPlayers = team.players || [];
          const playerExists = existingPlayers.some(p => p.id === playerId);
          
          if (!playerExists) {
            // Find the player data to add to team
            const playerData = updatedPlayerData || playerDatabase.find((p) => p.id === playerId);
            if (playerData) {
              return {
                ...team,
                players: [...existingPlayers, {
                  ...playerData,
                  jerseyNumber: jerseyNumber || playerData.jerseyNumber
                }]
              };
            }
          } else {
            // Update existing player in team with new jersey number
            return {
              ...team,
              players: existingPlayers.map(p => 
                p.id === playerId 
                  ? { ...p, jerseyNumber: jerseyNumber || p.jerseyNumber }
                  : p
              )
            };
          }
        }
        return team;
      })
    );
  };

  const handleUpdatePlayer = (
    playerId: number,
    updates: Partial<Player>,
  ) => {
    const updatedPlayer = playerDatabase.find(p => p.id === playerId);
    if (!updatedPlayer) return;

    const newPlayerData = { ...updatedPlayer, ...updates };

    // Update player database
    setPlayerDatabase(
      playerDatabase.map((player) =>
        player.id === playerId
          ? newPlayerData
          : player,
      ),
    );

    // If teams were updated, sync with team data
    if (updates.teams) {
      const oldTeams = updatedPlayer.teams || [];
      const newTeams = updates.teams || [];

      // Find teams that were removed
      const removedTeams = oldTeams.filter(
        oldTeam => !newTeams.some(newTeam => newTeam.teamId === oldTeam.teamId)
      );

      // Find teams that were added
      const addedTeams = newTeams.filter(
        newTeam => !oldTeams.some(oldTeam => oldTeam.teamId === newTeam.teamId)
      );

      // Update teams
      setRegisteredTeams(
        registeredTeams.map((team) => {
          let updatedTeam = { ...team };
          const teamPlayers = updatedTeam.players || [];

          // Remove player from teams they left
          if (removedTeams.some(t => t.teamId === team.id)) {
            updatedTeam.players = teamPlayers.filter(p => p.id !== playerId);
          }

          // Add player to new teams
          if (addedTeams.some(t => t.teamId === team.id)) {
            const teamAssignment = newTeams.find(t => t.teamId === team.id);
            if (!teamPlayers.some(p => p.id === playerId)) {
              updatedTeam.players = [...teamPlayers, {
                ...newPlayerData,
                jerseyNumber: teamAssignment?.jerseyNumber || newPlayerData.jerseyNumber
              }];
            }
          }

          // Update jersey number for existing assignments
          const teamAssignment = newTeams.find(t => t.teamId === team.id);
          if (teamAssignment && teamPlayers.some(p => p.id === playerId)) {
            updatedTeam.players = teamPlayers.map(p => 
              p.id === playerId 
                ? { ...p, ...newPlayerData, jerseyNumber: teamAssignment.jerseyNumber || p.jerseyNumber }
                : p
            );
          }

          return updatedTeam;
        }),
      );
    }
  };

  const handleAddTournament = (tournamentData: any) => {
    // Reload tournaments from localStorage after creation
    const updatedTournaments = loadFromStorage(STORAGE_KEYS.TOURNAMENTS, []);
    setTournaments(updatedTournaments);
  };

  const handleNavigateToInfoTab = () => {
    setActiveTab('info');
    setCurrentView('tournamentsList');
  };

  // Delete player handler
  const handleDeletePlayer = (playerId: number) => {
    // Remove player from player database
    setPlayerDatabase(playerDatabase.filter(p => p.id !== playerId));
    
    // Remove player from all teams
    setRegisteredTeams(
      registeredTeams.map(team => ({
        ...team,
        players: (team.players || []).filter(p => p.id !== playerId)
      }))
    );
    
    // Navigate back to info tab
    setCurrentView('info');
    setSelectedPlayer(null);
  };

  // Delete team handler
  const handleDeleteTeam = (teamId: number) => {
    // Remove team from registered teams
    setRegisteredTeams(registeredTeams.filter(t => t.id !== teamId));
    
    // Remove team assignment from all players
    setPlayerDatabase(
      playerDatabase.map(player => {
        // Remove from teams array
        const updatedTeams = (player.teams || []).filter(t => t.teamId !== teamId);
        
        // Clear legacy fields if this was their primary team
        const updates: any = { teams: updatedTeams };
        if (player.teamId === teamId) {
          updates.teamId = updatedTeams[0]?.teamId || null;
          updates.teamName = updatedTeams[0]?.teamName || null;
          updates.jerseyNumber = updatedTeams[0]?.jerseyNumber || player.jerseyNumber;
        }
        
        return { ...player, ...updates };
      })
    );
    
    // Navigate back to info tab
    setCurrentView('info');
    setSelectedTeam(null);
  };

  const handleEndMatch = (finalMatchData) => {
    // Store the match data and navigate to review ratings
    setSelectedMatch(finalMatchData);
    setCurrentView("reviewRatings");
  };

  const handleAcceptRatings = (ratings: { [playerId: number]: { points: number; rating: number } }) => {
    // Add ratings to the match data
    const finalMatchWithRatings = {
      ...selectedMatch,
      playerRatings: ratings,
      completedAt: new Date().toISOString() // Add completion timestamp
    };
    
    // Remove from ongoing matches and add to completed matches
    const updatedOngoing = ongoingMatches.filter((m) => m.id !== finalMatchWithRatings.id);
    const updatedCompleted = [finalMatchWithRatings, ...completedMatches];
    
    setOngoingMatches(updatedOngoing);
    setCompletedMatches(updatedCompleted);
    
    // IMMEDIATE SYNC: Push both arrays to cloud immediately to prevent race condition
    // This bypasses the debounced sync to ensure cloud is updated before next poll
    if (accessTokenRef.current) {
      console.log('[App] 🚀 Immediately syncing completed match to cloud...');
      
      // Show syncing toast
      const syncToastId = toast.loading('Syncing match to cloud...');
      
      import('./utils/cloudSync').then(async ({ pushToCloud }) => {
        try {
          await Promise.all([
            pushToCloud('ongoing_matches', updatedOngoing, accessTokenRef.current!),
            pushToCloud('completed_matches', updatedCompleted, accessTokenRef.current!)
          ]);
          toast.success('Match synced successfully!', { id: syncToastId });
          console.log('[App] ✅ Match sync completed');
        } catch (error) {
          toast.warning('Match saved locally. Will sync when online.', { id: syncToastId });
          console.error('[App] ⚠️ Match sync failed (saved locally):', error);
        }
      });
    }
    
    // Update selectedMatch with the ratings
    setSelectedMatch(finalMatchWithRatings);
    
    // Navigate to match events page
    setCurrentView("matchEvents");
    console.log("Match ended with ratings - Final data:", finalMatchWithRatings);
  };

  const handleSkipRatings = () => {
    // End match without ratings
    const finalMatch = {
      ...selectedMatch,
      completedAt: new Date().toISOString() // Add completion timestamp
    };
    
    // Remove from ongoing matches and add to completed matches
    const updatedOngoing = ongoingMatches.filter((m) => m.id !== finalMatch.id);
    const updatedCompleted = [finalMatch, ...completedMatches];
    
    setOngoingMatches(updatedOngoing);
    setCompletedMatches(updatedCompleted);
    
    // IMMEDIATE SYNC: Push both arrays to cloud immediately to prevent race condition
    // This bypasses the debounced sync to ensure cloud is updated before next poll
    if (accessTokenRef.current) {
      console.log('[App] 🚀 Immediately syncing completed match to cloud...');
      
      // Show syncing toast
      const syncToastId = toast.loading('Syncing match to cloud...');
      
      import('./utils/cloudSync').then(async ({ pushToCloud }) => {
        try {
          await Promise.all([
            pushToCloud('ongoing_matches', updatedOngoing, accessTokenRef.current!),
            pushToCloud('completed_matches', updatedCompleted, accessTokenRef.current!)
          ]);
          toast.success('Match synced successfully!', { id: syncToastId });
          console.log('[App] ✅ Match sync completed');
        } catch (error) {
          toast.warning('Match saved locally. Will sync when online.', { id: syncToastId });
          console.error('[App] ⚠️ Match sync failed (saved locally):', error);
        }
      });
    }
    
    // Navigate to match events page
    setCurrentView("matchEvents");
    console.log("Match ended without ratings - Final data:", finalMatch);
  };

  // Header component
  const Header = () => {
    // Find the logged-in user's player profile to get their profile picture
    const userPlayerProfile = playerDatabase.find(
      p => p.owner_user_id === currentUser?.user_id
    );
    
    // Use player profile image if available, otherwise fall back to user account photo
    const profileImageUrl = userPlayerProfile?.imageUrl || currentUser?.profile_photo;
    
    return (
      <div className="flex justify-between items-center px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        {/* Left menu button */}
        <div className="relative">
          <button 
            onClick={() => setShowAppMenu(!showAppMenu)}
            className="w-8 h-8 border-2 border-black dark:border-gray-300 rounded flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="w-1 h-1 bg-black dark:bg-gray-300 rounded-full mx-0.5"></div>
            <div className="w-1 h-1 bg-black dark:bg-gray-300 rounded-full mx-0.5"></div>
            <div className="w-1 h-1 bg-black dark:bg-gray-300 rounded-full mx-0.5"></div>
          </button>
          
          {/* App Menu Dropdown */}
          {showAppMenu && (
            <>
              {/* Backdrop to close menu */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowAppMenu(false)}
              />
              
              {/* Dropdown Menu */}
              <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50 overflow-hidden">
                {/* Menu Header */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    VScor Menu
                  </p>
                </div>
                
                {/* Menu Items */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowAppMenu(false);
                      // Open app store/play store
                      alert('Rate the app - Redirecting to app store...');
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 flex items-center gap-3 transition-colors"
                  >
                    <Star className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span>Rate the app</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowAppMenu(false);
                      window.location.href = 'mailto:support@vscor.app';
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 flex items-center gap-3 transition-colors"
                  >
                    <Mail className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span>Contact us</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowAppMenu(false);
                      if (navigator.share) {
                        navigator.share({
                          title: 'VScor',
                          text: 'Check out VScor - The best football scoring app!',
                          url: window.location.origin,
                        }).catch(() => {});
                      } else {
                        alert('Share VScor with your friends!');
                      }
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 flex items-center gap-3 transition-colors"
                  >
                    <Share2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span>Share the app</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowAppMenu(false);
                      window.open('https://blog.vscor.app', '_blank');
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 flex items-center gap-3 transition-colors"
                  >
                    <BookOpen className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span>Blog</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowAppMenu(false);
                      alert('Help/FAQs - Coming soon!');
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 flex items-center gap-3 transition-colors"
                  >
                    <HelpCircle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span>Help/FAQs</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowAppMenu(false);
                      alert('Privacy Policy - Coming soon!');
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 flex items-center gap-3 transition-colors"
                  >
                    <Shield className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span>Privacy Policy</span>
                  </button>
                </div>
                
                {/* Dark Mode Toggle Section */}
                <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-2 pb-1">
                  <div className="px-4 py-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isDarkMode ? (
                          <Moon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        ) : (
                          <Sun className="w-4 h-4 text-gray-500" />
                        )}
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Dark Theme
                        </span>
                      </div>
                      <button
                        onClick={toggleDarkMode}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                          isDarkMode ? 'bg-purple-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            isDarkMode ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Social Media Section */}
                <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-2">
                  <div className="px-4 py-2">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Follow us on</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowAppMenu(false);
                          window.open('https://instagram.com/vscor', '_blank');
                        }}
                        className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center hover:scale-105 transition-transform"
                      >
                        <Instagram className="w-5 h-5 text-white" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowAppMenu(false);
                          window.open('https://facebook.com/vscor', '_blank');
                        }}
                        className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center hover:scale-105 transition-transform"
                      >
                        <Facebook className="w-5 h-5 text-white" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowAppMenu(false);
                          window.open('https://youtube.com/@vscor', '_blank');
                        }}
                        className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center hover:scale-105 transition-transform"
                      >
                        <Youtube className="w-5 h-5 text-white" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowAppMenu(false);
                          window.open('https://x.com/vscor', '_blank');
                        }}
                        className="w-9 h-9 rounded-lg bg-black flex items-center justify-center hover:scale-105 transition-transform"
                      >
                        <Twitter className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Centered App Logo */}
        <h1 className="text-2xl font-bold tracking-tight absolute left-1/2 transform -translate-x-1/2">
          <span className="text-purple-600">V</span>
          <span className="text-gray-800 dark:text-gray-100">Scor</span>
        </h1>
        
        {/* Profile Button with Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white hover:bg-purple-700 transition-colors shadow-md"
          >
            {profileImageUrl ? (
              <img 
                src={profileImageUrl} 
                alt={currentUser?.display_name || 'User'} 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-semibold">
                {currentUser?.display_name?.charAt(0).toUpperCase() || 'U'}
              </span>
            )}
          </button>
        
        {/* Profile Dropdown Menu */}
        {showProfileMenu && (
          <>
            {/* Backdrop to close menu */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowProfileMenu(false)}
            />
            
            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50 overflow-hidden">
              {/* User Info */}
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {currentUser?.display_name || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {currentUser?.email}
                </p>
              </div>
              
              {/* Menu Items */}
              <div className="py-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    // Find the current user's player profile
                    const myPlayerProfile = playerDatabase.find(
                      p => p.owner_user_id === currentUser?.user_id
                    );
                    
                    if (myPlayerProfile) {
                      handlePlayerProfileClick(myPlayerProfile);
                    } else {
                      alert('Player profile not found. Please try logging out and back in.');
                    }
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 flex items-center gap-3 transition-colors"
                >
                  <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span>Edit Profile</span>
                </button>
                
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    setCurrentView("notifications");
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 flex items-center gap-3 transition-colors"
                >
                  <div className="relative">
                    <Bell className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    {unreadNotificationsCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
                        {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                      </span>
                    )}
                  </div>
                  <span>Notifications</span>
                </button>
                
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    setCurrentView("myMatches");
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 flex items-center gap-3 transition-colors"
                >
                  <Trophy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span>My Matches</span>
                </button>
                
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    setCurrentView("matchPayments");
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 flex items-center gap-3 transition-colors"
                >
                  <Wallet className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span>Match Payments</span>
                </button>
                
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    // TODO: Navigate to My Stats
                    alert('My Stats - Coming soon!');
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 flex items-center gap-3 transition-colors"
                >
                  <BarChart3 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span>My Stats</span>
                </button>
                
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    // TODO: Navigate to Achievements
                    alert('Achievements - Coming soon!');
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 flex items-center gap-3 transition-colors"
                >
                  <Medal className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span>Achievements</span>
                </button>
              </div>
              
              {/* Logout */}
              <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1">
                <button
                  onClick={async () => {
                    setShowProfileMenu(false);
                    try {
                      // Use signOut() from auth.ts — clears Supabase session,
                      // localStorage AND in-memory userCache so LoginScreen
                      // cannot re-authenticate from stale cache.
                      await signOut();
                      setCurrentUser(null);
                      setIsLoggedIn(false);
                      setAccessToken(null);
                      cloudSyncReady.current = false;
                      isSyncing.current = false;
                    } catch (error) {
                      console.error('Error signing out:', error);
                    }
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-3 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
    );
  };

  // Bottom navigation component
  const BottomNavigation = () => (
    <div className="px-4 pb-6 pt-2">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-lg px-4 py-2 relative">
        <div className="flex justify-around items-center">
          {/* Live Tab */}
          <button
            onClick={() => {
              setActiveTab("live");
              setCurrentView("main");
            }}
            className={`flex flex-col items-center gap-1 py-2 px-4 transition-all ${
              activeTab === "live"
                ? "text-purple-600"
                : "text-gray-400 dark:text-gray-500"
            }`}
          >
            <CirclePlay className={`w-6 h-6 transition-transform ${
              activeTab === "live" ? "scale-110" : ""
            }`} />
            <span className={`text-xs font-medium ${
              activeTab === "live" ? "text-purple-600" : "text-gray-500 dark:text-gray-400"
            }`}>Live</span>
          </button>

          {/* Center Scoring Button */}
          <button
            onClick={() => {
              setActiveTab("scoring");
              setCurrentView("main");
            }}
            className={`flex flex-col items-center gap-1 ${
              activeTab === "scoring"
                ? "text-purple-600"
                : "text-gray-400 dark:text-gray-500"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                activeTab === "scoring"
                  ? "bg-purple-100 dark:bg-purple-900/50"
                  : "bg-gray-100 dark:bg-gray-700"
              }`}
            >
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-xs">Scoring</span>
            {activeTab === "scoring" && (
              <div className="w-8 h-1 bg-purple-600 rounded-full mt-1"></div>
            )}
          </button>

          {/* Info Tab */}
          <button
            onClick={() => {
              setActiveTab("info");
              setCurrentView("main");
            }}
            className={`flex flex-col items-center gap-1 py-2 px-4 transition-all ${
              activeTab === "info"
                ? "text-purple-600"
                : "text-gray-400 dark:text-gray-500"
            }`}
          >
            <Info className={`w-6 h-6 transition-transform ${
              activeTab === "info" ? "scale-110" : ""
            }`} />
            <span className={`text-xs font-medium ${
              activeTab === "info" ? "text-purple-600" : "text-gray-500 dark:text-gray-400"
            }`}>Info</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Handle navigation actions for live matches (audience view - match events only)
  const handleLiveMatchClick = (match: Match) => {
    setSelectedMatch(match);
    setCurrentView("matchEvents"); // Always show match events for live scores (audience)
  };

  // Handle navigation actions for scoring matches (designated scorers only)
  const handleScoringMatchClick = (match: Match) => {
    setSelectedMatch(match);
    // If it's an ongoing match, go to live scoring to resume
    // If it's a completed match, go to match events to view
    if (
      match.status === "Live" ||
      ongoingMatches.some((m) => m.id === match.id)
    ) {
      setCurrentView("liveScoring");
    } else {
      setCurrentView("matchEvents");
    }
  };

  const handlePlayerProfileClick = (player: Player) => {
    setSelectedPlayer(player);
    setCurrentView("playerProfile");
  };

  const handleViewPlayerMatches = (player: any, filter: string) => {
    setSelectedPlayer(player);
    setSelectedPlayerMatchFilter(filter as any);
    setCurrentView("playerMatches");
  };

  const handleTeamProfileClick = (team: Team) => {
    setSelectedTeam(team);
    setCurrentView("teamProfile");
  };

  const handleTournamentProfileClick = (
    tournament: Tournament,
  ) => {
    setSelectedTournament(tournament);
    setCurrentView("tournamentProfile");
  };

  const handleBackToMainScreen = () => {
    setCurrentView("main");
    setSelectedMatch(null);
    setSelectedPlayer(null);
    setSelectedTeam(null);
    setSelectedTournament(null);
    setPendingMatch(null);
  };

  const handleSelectSquad = (matchDetails) => {
    setPendingMatch(matchDetails);
    setCurrentView("selectSquad");
  };

  const handleStartMatch = (matchWithSquads) => {
    // Add match to ongoing matches
    const now = new Date();
    const matchWithId = {
      ...matchWithSquads,
      id: Date.now() * 1000 + Math.floor(Math.random() * 999), // Ensure unique IDs with microsecond precision
      status: "Live",
      startTime: now,
      date: now.toISOString(), // Store date in ISO format
      matchTime: now.toTimeString().substring(0, 5), // Store time in HH:mm format
      // NEW ownership structure (already set from NewMatch.tsx)
      // ownedBy: already set from matchWithSquads
      // scoredBy1: already set from matchWithSquads
      // scoredBy2: already set from matchWithSquads (if dual-scorer)
      // LEGACY: Keep scoredBy for backward compatibility
      scoredBy: matchWithSquads.ownedBy || currentUser?.user_id,
      updatedAt: now.toISOString(), // Track when match was last updated
    };
    const updatedMatches = [...ongoingMatches, matchWithId];
    setOngoingMatches(updatedMatches);
    setSelectedMatch(matchWithId);
    setCurrentView("liveScoring");
    
    // 🚀 IMMEDIATE SYNC: Push new match to cloud immediately so other scorers can see it
    console.log('[App] 🚀 New match created - pushing to cloud immediately for multi-scorer visibility');
    import('./utils/cloudSync').then(({ pushToCloud }) => {
      if (accessTokenRef.current) {
        pushToCloud('ongoing_matches', updatedMatches, accessTokenRef.current)
          .then(success => {
            if (success) {
              console.log('[App] ✅ New match synced to cloud successfully');
            } else {
              console.warn('[App] ⚠️ New match sync failed, will retry automatically');
            }
          })
          .catch(err => {
            console.error('[App] ❌ Error syncing new match:', err);
          });
      }
    });
  };

  // Update ongoing match with live scoring data
  const handleUpdateMatch = (matchId, updates) => {
    setOngoingMatches(
      ongoingMatches.map((m) =>
        m.id === matchId ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m,
      ),
    );
  };

  // Render different views based on currentView
  const renderCurrentView = () => {
    switch (currentView) {
      case "newMatch":
        return (
          <NewMatch
            onBack={handleBackToMainScreen}
            onSelectSquad={handleSelectSquad}
            registeredTeams={registeredTeams.map((t) => t.name)}
            onAddTeam={handleAddTeam}
            playerDatabase={playerDatabase}
            onAssignPlayerToTeam={handleAssignPlayerToTeam}
            onAddPlayer={handleAddPlayer}
            currentUser={currentUser}
          />
        );
      case "selectSquad":
        return (
          <SelectSquad
            match={pendingMatch}
            onBack={handleBackToMainScreen}
            onStartMatch={handleStartMatch}
            registeredTeams={registeredTeams}
            playerDatabase={playerDatabase}
            onAddPlayer={handleAddPlayer}
            onAssignPlayerToTeam={handleAssignPlayerToTeam}
          />
        );
      case "addTeam":
        return (
          <AddTeam
            onBack={handleBackToMainScreen}
            onAddTeam={handleAddTeam}
            playerDatabase={playerDatabase}
            onAssignPlayerToTeam={handleAssignPlayerToTeam}
            onAddPlayer={handleAddPlayer}
            onAddMultiplePlayers={handleAddMultiplePlayers}
            currentUser={currentUser}
          />
        );
      case "addPlayer":
        return (
          <AddPlayer
            onBack={handleBackToMainScreen}
            onAddPlayer={handleAddPlayer}
            playerDatabase={playerDatabase}
            registeredTeams={registeredTeams}
          />
        );
      case "addTournament":
        return (
          <AddTournament 
            onBack={handleBackToMainScreen}
            onTournamentCreated={handleAddTournament}
            onNavigateToInfoTab={handleNavigateToInfoTab}
            registeredTeams={registeredTeams}
            playerDatabase={playerDatabase}
            currentUser={currentUser}
            tournaments={tournaments}
          />
        );
      case "matchEvents":
        return (
          <MatchEventsScreen
            match={selectedMatch}
            onBack={handleBackToMainScreen}
            onPlayerClick={handlePlayerProfileClick}
            onTeamClick={handleTeamProfileClick}
            currentUser={currentUser}
            onEditMatch={() => setCurrentView("editMatchEvents")}
            onCalculatePayment={() => setCurrentView("calculatePayment")}
            onTransferOwnership={() => setCurrentView("transferMatchOwnership")}
          />
        );
      case "editMatchEvents":
        return (
          <EditMatchEvents
            match={selectedMatch}
            onBack={() => setCurrentView("matchEvents")}
            onSave={(updatedMatch) => {
              console.log('\n🔵🔵🔵 [App.tsx onSave] ============ RECEIVED UPDATED MATCH ============');
              console.log('📥 [App.tsx onSave] Match ID:', updatedMatch.id);
              console.log('📥 [App.tsx onSave] Received scoreA:', updatedMatch.scoreA);
              console.log('📥 [App.tsx onSave] Received scoreB:', updatedMatch.scoreB);
              console.log('📥 [App.tsx onSave] Received team1Score:', updatedMatch.team1Score);
              console.log('📥 [App.tsx onSave] Received team2Score:', updatedMatch.team2Score);
              console.log('📥 [App.tsx onSave] Received isPenaltyShootout:', updatedMatch.isPenaltyShootout);
              console.log('📥 [App.tsx onSave] Received penaltyShootoutScore:', updatedMatch.penaltyShootoutScore);
              console.log('📥 [App.tsx onSave] Received events count:', updatedMatch.events?.length);
              
              // Update the match in the appropriate list
              const isOngoing = ongoingMatches.some((m) => m.id === updatedMatch.id);
              console.log('📋 [App.tsx onSave] Match is in:', isOngoing ? 'ongoingMatches' : 'completedMatches');
              
              if (isOngoing) {
                const updatedList = ongoingMatches.map((m) =>
                  m.id === updatedMatch.id ? updatedMatch : m
                );
                console.log('💾 [App.tsx onSave] Updating ongoingMatches...');
                setOngoingMatches(updatedList);
                
                // Log the updated match in the list
                const savedMatch = updatedList.find(m => m.id === updatedMatch.id);
                console.log('✅ [App.tsx onSave] Match saved in ongoingMatches:', {
                  scoreA: savedMatch?.scoreA,
                  scoreB: savedMatch?.scoreB,
                  team1Score: savedMatch?.team1Score,
                  team2Score: savedMatch?.team2Score,
                });
              } else {
                const updatedList = completedMatches.map((m) =>
                  m.id === updatedMatch.id ? updatedMatch : m
                );
                console.log('💾 [App.tsx onSave] Updating completedMatches...');
                setCompletedMatches(updatedList);
                
                // Log the updated match in the list
                const savedMatch = updatedList.find(m => m.id === updatedMatch.id);
                console.log('✅ [App.tsx onSave] Match saved in completedMatches:', {
                  scoreA: savedMatch?.scoreA,
                  scoreB: savedMatch?.scoreB,
                  team1Score: savedMatch?.team1Score,
                  team2Score: savedMatch?.team2Score,
                });
              }
              
              // Update selectedMatch
              console.log('💾 [App.tsx onSave] Updating selectedMatch...');
              setSelectedMatch(updatedMatch);
              console.log('✅ [App.tsx onSave] selectedMatch updated:', {
                scoreA: updatedMatch.scoreA,
                scoreB: updatedMatch.scoreB,
              });
              console.log('🔵🔵🔵 [App.tsx onSave] ============ SAVE COMPLETE ============\n');
            }}
          />
        );
      case "calculatePayment":
        return (
          <CalculatePayment
            match={selectedMatch}
            onBack={() => setCurrentView("matchEvents")}
            playerDatabase={playerDatabase}
            currentUser={currentUser}
            onSavePayment={(matchId, paymentData) => {
              // Update the match in the appropriate list
              const isOngoing = ongoingMatches.some((m) => m.id === matchId);
              
              if (isOngoing) {
                setOngoingMatches(prev =>
                  prev.map(m =>
                    m.id === matchId
                      ? { ...m, paymentData }
                      : m
                  )
                );
              } else {
                setCompletedMatches(prev =>
                  prev.map(m =>
                    m.id === matchId
                      ? { ...m, paymentData }
                      : m
                  )
                );
              }
              
              // Update selectedMatch as well
              setSelectedMatch(prev => prev ? { ...prev, paymentData } : prev);
            }}
          />
        );
      case "transferMatchOwnership":
        return (
          <TransferMatchOwnership
            match={selectedMatch}
            onBack={() => setCurrentView("matchEvents")}
            onTransfer={(newOwnerId, newOwnerName) => {
              // Update the match with new owner
              const updatedMatch = {
                ...selectedMatch,
                ownedBy: newOwnerId,
                // Keep legacy field for backward compatibility
                scoredBy: newOwnerId
              };
              
              // Update in ongoing or completed matches
              const isOngoing = ongoingMatches.some((m) => m.id === selectedMatch.id);
              
              if (isOngoing) {
                setOngoingMatches(prev =>
                  prev.map(m =>
                    m.id === selectedMatch.id
                      ? updatedMatch
                      : m
                  )
                );
              } else {
                setCompletedMatches(prev =>
                  prev.map(m =>
                    m.id === selectedMatch.id
                      ? updatedMatch
                      : m
                  )
                );
              }
              
              // Update selectedMatch
              setSelectedMatch(updatedMatch);
              
              // Show success message and navigate back
              alert(`Match ownership successfully transferred to ${newOwnerName}`);
              setCurrentView("matchEvents");
            }}
            playerDatabase={playerDatabase}
            currentUser={currentUser}
          />
        );
      case "liveScoring":
        return (
          <LiveScoring
            match={selectedMatch}
            onBack={handleBackToMainScreen}
            onEndMatch={handleEndMatch}
            onUpdateMatch={handleUpdateMatch}
            currentUser={currentUser}
            accessToken={accessToken}
          />
        );
      case "playerProfile":
        return (
          <PlayerProfile
            player={selectedPlayer}
            onBack={handleBackToMainScreen}
            onUpdatePlayer={handleUpdatePlayer}
            teams={registeredTeams}
            onDeletePlayer={handleDeletePlayer}
            completedMatches={completedMatches}
            currentUserId={currentUser?.user_id}
            onViewMatches={handleViewPlayerMatches}
          />
        );
      case "playerMatches":
        return (
          <MyMatches
            onBack={() => setCurrentView("playerProfile")}
            currentUser={currentUser}
            playerDatabase={playerDatabase}
            completedMatches={completedMatches}
            viewPlayer={selectedPlayer}
            filterType={selectedPlayerMatchFilter}
            onMatchClick={(match) => {
              setSelectedMatch(match);
              setCurrentView("matchEvents");
            }}
          />
        );
      case "teamProfile": {
        // Always resolve the live team from registeredTeams by ID so TeamProfile
        // gets up-to-date ownership fields (coordinator_user_ids, created_by)
        // even if selectedTeam was snapshotted before migration or cloud-sync ran.
        const liveTeam = registeredTeams.find((t) => t.id === selectedTeam?.id) ?? selectedTeam;
        return (
          <TeamProfile
            team={liveTeam}
            onBack={handleBackToMainScreen}
            onUpdateTeam={(teamId, updates) => {
              setRegisteredTeams(
                registeredTeams.map((t) =>
                  t.id === teamId ? { ...t, ...updates } : t
                )
              );
            }}
            playerDatabase={playerDatabase}
            onAddPlayer={handleAddPlayer}
            onPlayerClick={handlePlayerProfileClick}
            onDeleteTeam={handleDeleteTeam}
            currentUserId={currentUser?.user_id}
          />
        );
      }
      case "tournamentProfile":
        return (
          <TournamentProfileScreen
            tournament={selectedTournament}
            onBack={handleBackToMainScreen}
            onTeamClick={handleTeamProfileClick}
            onPlayerClick={handlePlayerProfileClick}
            onAddTeam={() => setCurrentView("addTeam")}
            onGenerateFixtures={() => {
              alert('Fixture generation feature coming soon! This will automatically create a match schedule based on the tournament format.');
            }}
            currentUser={currentUser}
            playerDatabase={playerDatabase}
            onTournamentUpdate={(updatedTournaments) => {
              setTournaments(updatedTournaments);
            }}
          />
        );
      case "playersList":
        return (
          <PlayersList
            onBack={handleBackToMainScreen}
            playerDatabase={playerDatabase}
            onPlayerClick={handlePlayerProfileClick}
            onAddPlayer={() => setCurrentView("addPlayer")}
          />
        );
      case "teamsList":
        return (
          <TeamsList
            onBack={handleBackToMainScreen}
            teams={registeredTeams}
            onTeamClick={handleTeamProfileClick}
            onAddTeam={() => setCurrentView("addTeam")}
          />
        );
      case "tournamentsList":
        return (
          <TournamentsList
            onBack={handleBackToMainScreen}
            tournaments={tournaments}
            onTournamentClick={handleTournamentProfileClick}
            onAddTournament={() => setCurrentView("addTournament")}
          />
        );
      case "statsPage":
        return (
          <StatsPage
            onBack={handleBackToMainScreen}
            onLeaderboard={() => console.log('Leaderboard clicked')}
            onPointsTable={() => console.log('Points table clicked')}
            onPlayerComparison={() => console.log('Player comparison clicked')}
            onTeamComparison={() => console.log('Team comparison clicked')}
          />
        );
      case "myMatches":
        return (
          <MyMatches
            onBack={handleBackToMainScreen}
            currentUser={currentUser}
            playerDatabase={playerDatabase}
            completedMatches={completedMatches}
            onMatchClick={(match) => {
              setSelectedMatch(match);
              setCurrentView("matchEvents");
            }}
          />
        );
      case "notifications":
        return (
          <Notifications
            onBack={handleBackToMainScreen}
            currentUserId={currentUser?.user_id}
            onNavigate={(view, data) => {
              // Handle navigation from notifications
              switch (view) {
                case 'profile':
                  setShowProfileMenu(true);
                  setCurrentView("main");
                  setActiveTab("info");
                  break;
                case 'teamProfile':
                  if (data?.teamId) {
                    const team = registeredTeams.find(t => t.id === data.teamId);
                    if (team) {
                      setSelectedTeam(team);
                      setCurrentView("teamProfile");
                    }
                  }
                  break;
                case 'tournamentProfile':
                  if (data?.tournamentId) {
                    const tournament = tournaments.find(t => t.id === data.tournamentId);
                    if (tournament) {
                      setSelectedTournament(tournament);
                      setCurrentView("tournamentProfile");
                    }
                  }
                  break;
                case 'matchEvents':
                  if (data?.matchId) {
                    // Find match in ongoing or completed matches
                    const match = [...ongoingMatches, ...completedMatches].find(
                      m => m.id === data.matchId
                    );
                    if (match) {
                      setSelectedMatch(match);
                      setCurrentView("matchEvents");
                    }
                  }
                  break;
              }
            }}
          />
        );
      case "matchPayments":
        return (
          <MatchPayments
            onBack={handleBackToMainScreen}
            currentUser={currentUser}
            ongoingMatches={ongoingMatches}
            completedMatches={completedMatches}
            playerDatabase={playerDatabase}
            onNavigateToPayment={(match) => {
              setSelectedMatch(match);
              setCurrentView("calculatePayment");
            }}
          />
        );
      case "reviewRatings":
        return (
          <ReviewRatings
            match={selectedMatch}
            onAcceptRatings={handleAcceptRatings}
            onSkipRatings={handleSkipRatings}
          />
        );
      case "enterMatchResult":
        return (
          <EnterMatchResult
            tournaments={tournaments}
            teams={registeredTeams}
            players={playerDatabase}
            onBack={handleBackToMainScreen}
            onPublish={(matchData) => {
              // Add ownership info and add to completed matches
              const matchWithOwnership = {
                ...matchData,
                ownedBy: currentUser?.user_id,        // Match owner
                scoredBy1: currentUser?.user_id,      // Primary scorer (same as owner for result entry)
                scoredBy2: null,                      // No secondary scorer for result entry
                scoredBy: currentUser?.user_id,       // LEGACY: for backward compatibility
                isResultEntry: true                   // Flag to indicate this was result entry, not live scored
              };
              setCompletedMatches([matchWithOwnership, ...completedMatches]);
              // Navigate back to main screen
              handleBackToMainScreen();
            }}
          />
        );
      default:
        return renderMainTab();
    }
  };

  // Render main tab content
  const renderMainTab = () => {
    switch (activeTab) {
      case "live":
        return (
          <LiveMatchesScreen
            ongoingMatches={ongoingMatches}
            completedMatches={completedMatches}
            onMatchClick={handleLiveMatchClick}
            onPlayerClick={handlePlayerProfileClick}
            onTeamClick={handleTeamProfileClick}
            onTournamentClick={handleTournamentProfileClick}
            onRefresh={handleManualRefresh}
            isRefreshing={isRefreshing}
          />
        );
      case "scoring":
        return (
          <ScoringTab
            ongoingMatches={ongoingMatches}
            completedMatches={completedMatches}
            onNewMatch={() => setCurrentView("newMatch")}
            onAddTeam={() => setCurrentView("addTeam")}
            onAddPlayer={() => setCurrentView("addPlayer")}
            onAddTournament={() =>
              setCurrentView("addTournament")
            }
            onMatchClick={handleScoringMatchClick}
            onEnterMatchResult={() => setCurrentView("enterMatchResult")}
            currentUser={currentUser}
            onRefresh={handleManualRefresh}
            isRefreshing={isRefreshing}
          />
        );
      case "info":
        return (
          <InfoTab
            onPlayersList={() => setCurrentView("playersList")}
            onTeamsList={() => setCurrentView("teamsList")}
            onTournamentsList={() => setCurrentView("tournamentsList")}
            onStatsPage={() => setCurrentView("statsPage")}
            onRefresh={handleManualRefresh}
            isRefreshing={isRefreshing}
          />
        );
      default:
        return (
          <LiveMatchesScreen
            ongoingMatches={ongoingMatches}
            completedMatches={completedMatches}
            onMatchClick={handleLiveMatchClick}
            onPlayerClick={handlePlayerProfileClick}
            onTeamClick={handleTeamProfileClick}
            onTournamentClick={handleTournamentProfileClick}
            onRefresh={handleManualRefresh}
            isRefreshing={isRefreshing}
          />
        );
    }
  };

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // Show login screen if not logged in
  if (!isLoggedIn) {
    /**
     * handleLoginComplete — called by LoginScreen after the user explicitly
     * finishes the login flow (including the optional profile-merge dialog).
     *
     * We must do the full post-login sequence here because the
     * onAuthStateChange SIGNED_IN handler was blocked by mergeDialogActiveRef
     * while the dialog was open, so getCurrentUser / loadCloudData / migrations
     * were all skipped.
     *
     * IMPORTANT: we clear the user cache first because the merge just mutated
     * the server-side profile.  Without clearing, getCurrentUser() would return
     * the pre-merge snapshot for up to 5 seconds.
     */
    const handleLoginComplete = async () => {
      mergeDialogActiveRef.current = false;
      try {
        console.log('🔑 [handleLoginComplete] Starting post-login sequence...');

        // 1. Bust the user cache so the merge result is visible immediately.
        clearUserCache();

        // 2. Fetch fresh user profile from server.
        const user = await getCurrentUser();
        if (user) {
          setCurrentUser(user);
          console.log('✅ [handleLoginComplete] currentUser set:', user.display_name);
          
          // Check if this is a new user (first login) and send welcome notification
          const hasSeenWelcome = localStorage.getItem(`vscor_welcome_shown_${user.user_id}`);
          if (!hasSeenWelcome) {
            notifyProfileCreated(user.display_name || user.email || 'User');
            localStorage.setItem(`vscor_welcome_shown_${user.user_id}`, 'true');
            console.log('📢 Welcome notification sent to new user');
          }
        } else {
          console.warn('⚠️ [handleLoginComplete] getCurrentUser returned null after login');
        }

        // 3. Make sure we have an access token (might already be stored by the
        //    early-return branch of onAuthStateChange, but be defensive).
        if (!accessTokenRef.current) {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) setAccessToken(session.access_token);
          } catch (e) { console.error('[handleLoginComplete] Error getting session token:', e); }
        }

        // 4. Unlock the main app.
        setIsLoggedIn(true);

        // 5. Pull cloud data (was skipped while merge dialog was open).
        await loadCloudData();

        // 6. Ownership migration.
        if (user?.user_id) {
          try { forceReMigrateOwnership(user.user_id); } catch (e) { console.error('forceReMigrate error:', e); }
          try {
            migrateAllToOwnership(user.user_id);
            const migratedTeams = JSON.parse(localStorage.getItem(STORAGE_KEYS.TEAMS) || '[]');
            if (migratedTeams.length > 0) {
              setRegisteredTeams(migratedTeams);
              const token = accessTokenRef.current;
              if (token) debouncedSync('teams', migratedTeams, token);
            }
          } catch (migrationError) { console.error('Migration error:', migrationError); }
        }

        console.log('✅ [handleLoginComplete] Post-login sequence complete.');
      } catch (error) {
        console.error('❌ [handleLoginComplete] Error during post-login sequence:', error);
        // Still mark the user as logged in so they aren't stuck on the login screen.
        setIsLoggedIn(true);
      }
    };

    return (
      <LoginScreen
        onLoginComplete={handleLoginComplete}
        onMergeDialogActive={(active: boolean) => {
          mergeDialogActiveRef.current = active;
        }}
      />
    );
  }

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="h-screen bg-white dark:bg-gray-900 flex flex-col max-w-md mx-auto border-x border-gray-200 dark:border-gray-800">
        {currentView === "main" && <Header />}

        <div className="flex-1 overflow-y-auto">
          {renderCurrentView()}
        </div>

        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50">
          <BottomNavigation />
        </div>
      </div>
    </>
  );
}