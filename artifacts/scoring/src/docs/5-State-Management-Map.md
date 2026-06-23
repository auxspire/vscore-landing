# VScor - State Management Map

## Overview

VScor uses a **local-first state management approach** with React hooks and localStorage as the primary data store. This document defines the complete application state structure and state update workflows.

---

## Table of Contents
1. [State Architecture](#state-architecture)
2. [Global State Groups](#global-state-groups)
3. [Component State](#component-state)
4. [State Update Workflows](#state-update-workflows)
5. [Sync State Management](#sync-state-management)
6. [State Persistence](#state-persistence)

---

## State Architecture

```
┌─────────────────────────────────────────┐
│         Application State               │
└─────────────────────────────────────────┘
              │
       ┌──────┴──────┐
       │             │
   LocalStorage    React State
   (Persistent)    (In-Memory)
       │             │
       ├─ users      ├─ UI State
       ├─ players    ├─ Form State
       ├─ teams      ├─ Navigation State
       ├─ tournaments├─ Sync State
       ├─ matches    └─ Selection State
       └─ app_state
```

---

## Global State Groups

### 1. Authentication State

**Purpose**: Track current user session and authentication status

**Structure**:
```typescript
interface AuthState {
  currentUser: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}
```

**Storage**:
- **localStorage**: `vscor_current_user`, `vscor_accessToken`
- **React State**: `currentUser`, `isAuthenticated`

**State Updates**:
```typescript
// Login
setAuthState({
  currentUser: user,
  accessToken: token,
  isAuthenticated: true,
  loading: false,
  error: null
});

// Logout
setAuthState({
  currentUser: null,
  accessToken: null,
  isAuthenticated: false,
  loading: false,
  error: null
});
```

---

### 2. Player Data State

**Purpose**: Maintain complete player database

**Structure**:
```typescript
interface PlayerDataState {
  players: Player[];
  loading: boolean;
  error: string | null;
  lastSync: string | null;
}
```

**Storage**:
- **localStorage**: `vscor_players` (JSON array)
- **React State**: `playerDatabase`

**Derived State**:
```typescript
// Filter owned players
const myPlayers = players.filter(
  p => p.owner_user_id === currentUser.user_id
);

// Get player by ID
const getPlayerById = (id: string) => 
  players.find(p => p.id === id);

// Search players
const searchPlayers = (query: string) =>
  players.filter(p => 
    p.name.toLowerCase().includes(query.toLowerCase())
  );
```

**State Updates**:
```typescript
// Add player
setPlayers(prev => [...prev, newPlayer]);

// Update player
setPlayers(prev => 
  prev.map(p => p.id === updatedPlayer.id ? updatedPlayer : p)
);

// Delete player
setPlayers(prev => 
  prev.filter(p => p.id !== playerId)
);

// Recalculate player stats
setPlayers(prev =>
  prev.map(p => ({
    ...p,
    stats: calculatePlayerStats(p.id, matches)
  }))
);
```

---

### 3. Team Data State

**Purpose**: Maintain teams and master team table

**Structure**:
```typescript
interface TeamDataState {
  teams: Team[];
  masterTeams: Team[];  // Master team lookup
  loading: boolean;
  error: string | null;
}
```

**Storage**:
- **localStorage**: 
  - `vscor_teams` (legacy array)
  - `vscor_master_teams` (master table)
  - Individual team keys: `vscor_team_{team_id}`

**Derived State**:
```typescript
// Get teams where user is coordinator
const myTeams = teams.filter(t =>
  t.coordinators.some(c => c.user_id === currentUser.user_id)
);

// Get team by ID
const getTeamById = (id: string) =>
  masterTeams.find(t => t.id === id) || 
  teams.find(t => t.id === id);
```

**State Updates**:
```typescript
// Add team
setTeams(prev => [...prev, newTeam]);
setMasterTeams(prev => [...prev, newTeam]);
localStorage.setItem(`vscor_team_${newTeam.id}`, JSON.stringify(newTeam));

// Update team
setTeams(prev =>
  prev.map(t => t.id === updatedTeam.id ? updatedTeam : t)
);
localStorage.setItem(`vscor_team_${updatedTeam.id}`, JSON.stringify(updatedTeam));

// Recalculate team stats
setTeams(prev =>
  prev.map(t => ({
    ...t,
    stats: calculateTeamStats(t.name, matches)
  }))
);
```

---

### 4. Tournament State

**Purpose**: Manage tournaments, fixtures, and standings

**Structure**:
```typescript
interface TournamentState {
  tournaments: Tournament[];
  activeTournament: Tournament | null;
  standings: Record<string, StandingEntry[]>;  // tournamentId -> standings
  loading: boolean;
  error: string | null;
}
```

**Storage**:
- **localStorage**: `vscor_tournaments` (JSON array)
- **React State**: `tournaments`

**Derived State**:
```typescript
// Get user's tournaments (as coordinator)
const myTournaments = tournaments.filter(t =>
  t.coordinators.some(c => c.user_id === currentUser.user_id)
);

// Get active tournaments (not ended)
const activeTournaments = tournaments.filter(t =>
  new Date(t.end_date) >= new Date()
);

// Get tournament standings
const getTournamentStandings = (tournamentId: string) =>
  standings[tournamentId] || calculateStandings(tournamentId);
```

**State Updates**:
```typescript
// Add tournament
setTournaments(prev => [...prev, newTournament]);

// Update tournament
setTournaments(prev =>
  prev.map(t => t.id === updatedTournament.id ? updatedTournament : t)
);

// Recalculate standings
setStandings(prev => ({
  ...prev,
  [tournamentId]: calculateStandings(tournamentId, matches)
}));

// Add team to tournament
setTournaments(prev =>
  prev.map(t => t.id === tournamentId ? {
    ...t,
    participatingTeams: [...t.participatingTeams, newTeam]
  } : t)
);
```

---

### 5. Match Data State

**Purpose**: Store all matches including drafts, live, and completed

**Structure**:
```typescript
interface MatchDataState {
  matches: Match[];
  liveMatches: Match[];
  myMatches: Match[];
  loading: boolean;
  error: string | null;
}
```

**Storage**:
- **localStorage**: `vscor_matches` (JSON array)
- **React State**: `matches`

**Derived State**:
```typescript
// Live matches
const liveMatches = matches.filter(m => m.status === 'live');

// Completed matches
const completedMatches = matches.filter(m => m.status === 'completed');

// My matches (owned or scored)
const myMatches = matches.filter(m =>
  m.owner_user_id === currentUser.user_id ||
  m.primaryScorer.user_id === currentUser.user_id ||
  m.secondaryScorer?.user_id === currentUser.user_id
);

// Draft matches
const draftMatches = matches.filter(m => !m.shared);

// Matches by tournament
const getMatchesByTournament = (tournamentId: string) =>
  matches.filter(m => m.tournament_id === tournamentId);
```

**State Updates**:
```typescript
// Add match
setMatches(prev => [...prev, newMatch]);

// Update match
setMatches(prev =>
  prev.map(m => m.id === updatedMatch.id ? updatedMatch : m)
);

// Delete match
setMatches(prev =>
  prev.filter(m => m.id !== matchId)
);

// Add event to match
setMatches(prev =>
  prev.map(m => m.id === matchId ? {
    ...m,
    events: [...m.events, newEvent],
    scoreA: recalculateScore(m.events, newEvent, 'team1'),
    scoreB: recalculateScore(m.events, newEvent, 'team2')
  } : m)
);

// Update match status
setMatches(prev =>
  prev.map(m => m.id === matchId ? {
    ...m,
    status: 'completed',
    endTime: new Date().toISOString()
  } : m)
);
```

---

### 6. Match Scoring State

**Purpose**: Track active match being scored

**Structure**:
```typescript
interface MatchScoringState {
  activeMatch: Match | null;
  selectedPlayer: Player | null;
  activeTeam: 'team1' | 'team2';
  matchTimer: {
    elapsed: number;  // seconds
    isPaused: boolean;
    startTime: number;  // timestamp
    pausedDuration: number;  // accumulated pause time
  };
  eventDraft: Partial<MatchEvent> | null;  // Unsaved event details
}
```

**Storage**:
- **React State only** (transient state)
- **localStorage**: `vscor_app_state` (for persistence across page refresh)

**State Updates**:
```typescript
// Start match
setScoringState({
  activeMatch: match,
  selectedPlayer: null,
  activeTeam: 'team1',
  matchTimer: {
    elapsed: 0,
    isPaused: false,
    startTime: Date.now(),
    pausedDuration: 0
  },
  eventDraft: null
});

// Select player
setScoringState(prev => ({
  ...prev,
  selectedPlayer: player
}));

// Switch team
setScoringState(prev => ({
  ...prev,
  activeTeam: prev.activeTeam === 'team1' ? 'team2' : 'team1',
  selectedPlayer: null
}));

// Pause match
setScoringState(prev => ({
  ...prev,
  matchTimer: {
    ...prev.matchTimer,
    isPaused: true,
    pausedDuration: prev.matchTimer.pausedDuration + (Date.now() - prev.matchTimer.startTime)
  }
}));

// Resume match
setScoringState(prev => ({
  ...prev,
  matchTimer: {
    ...prev.matchTimer,
    isPaused: false,
    startTime: Date.now()
  }
}));

// End match
setScoringState({
  activeMatch: null,
  selectedPlayer: null,
  activeTeam: 'team1',
  matchTimer: { elapsed: 0, isPaused: false, startTime: 0, pausedDuration: 0 },
  eventDraft: null
});
```

---

### 7. Sync State

**Purpose**: Track synchronization status with cloud

**Structure**:
```typescript
interface SyncState {
  isSyncing: boolean;
  lastSync: string | null;  // ISO timestamp
  syncQueue: {
    players: string[];  // IDs pending sync
    teams: string[];
    tournaments: string[];
    matches: string[];
  };
  syncErrors: Array<{
    entityType: string;
    entityId: string;
    error: string;
    timestamp: string;
  }>;
  status: 'synced' | 'syncing' | 'error' | 'offline';
}
```

**Storage**:
- **localStorage**: 
  - `vscor_lastSync`
  - `vscor_syncQueue`
  - `vscor_syncErrors`
- **React State**: `syncState`

**State Updates**:
```typescript
// Start sync
setSyncState(prev => ({
  ...prev,
  isSyncing: true,
  status: 'syncing'
}));

// Sync success
setSyncState(prev => ({
  ...prev,
  isSyncing: false,
  lastSync: new Date().toISOString(),
  status: 'synced',
  syncQueue: {
    players: [],
    teams: [],
    tournaments: [],
    matches: []
  }
}));

// Sync error
setSyncState(prev => ({
  ...prev,
  isSyncing: false,
  status: 'error',
  syncErrors: [...prev.syncErrors, {
    entityType: 'match',
    entityId: matchId,
    error: errorMessage,
    timestamp: new Date().toISOString()
  }]
}));

// Add to sync queue
setSyncState(prev => ({
  ...prev,
  syncQueue: {
    ...prev.syncQueue,
    matches: [...prev.syncQueue.matches, matchId]
  }
}));
```

---

## Component State

### 1. UI State

**Purpose**: Track UI-specific states (modals, dropdowns, etc.)

**Examples**:
```typescript
// Modal state
const [isModalOpen, setIsModalOpen] = useState(false);

// Dropdown state
const [dropdownOpen, setDropdownOpen] = useState(false);

// Tab state
const [activeTab, setActiveTab] = useState('overview');

// Expanded/collapsed state
const [isExpanded, setIsExpanded] = useState(false);
```

---

### 2. Form State

**Purpose**: Track form inputs and validation

**Example**:
```typescript
interface FormState {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
}

const [formState, setFormState] = useState<FormState>({
  values: {
    name: '',
    email: '',
    position: ''
  },
  errors: {},
  touched: {},
  isSubmitting: false
});

// Handle input change
const handleChange = (field: string, value: any) => {
  setFormState(prev => ({
    ...prev,
    values: { ...prev.values, [field]: value },
    touched: { ...prev.touched, [field]: true },
    errors: { ...prev.errors, [field]: validateField(field, value) }
  }));
};
```

---

### 3. Navigation State

**Purpose**: Track current view and navigation history

**Structure**:
```typescript
interface NavigationState {
  currentView: string;
  viewData: any;
  history: Array<{view: string, data: any}>;
}

const [navState, setNavState] = useState<NavigationState>({
  currentView: 'home',
  viewData: null,
  history: []
});

// Navigate to new view
const navigateTo = (view: string, data?: any) => {
  setNavState(prev => ({
    currentView: view,
    viewData: data,
    history: [...prev.history, {view: prev.currentView, data: prev.viewData}]
  }));
};

// Go back
const goBack = () => {
  setNavState(prev => {
    const lastView = prev.history[prev.history.length - 1];
    return {
      currentView: lastView.view,
      viewData: lastView.data,
      history: prev.history.slice(0, -1)
    };
  });
};
```

---

### 4. Selection State

**Purpose**: Track user selections

**Examples**:
```typescript
// Selected player
const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

// Selected match
const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

// Multi-selection (squad selection)
const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

// Toggle selection
const togglePlayerSelection = (playerId: string) => {
  setSelectedPlayers(prev =>
    prev.includes(playerId)
      ? prev.filter(id => id !== playerId)
      : [...prev, playerId]
  );
};
```

---

## State Update Workflows

### Workflow 1: Create Match

```
┌──────────────────────────────────────┐
│  User Action: Create New Match       │
└──────────────┬───────────────────────┘
               │
               ▼
    ┌──────────────────────┐
    │ 1. User fills form   │
    │    (Form State)      │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │ 2. Validate inputs   │
    │    (Form Errors)     │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │ 3. Create match obj  │
    │    with user_id,     │
    │    timestamp, etc.   │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │ 4. Update matches[]  │
    │    (Global State)    │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │ 5. Save to           │
    │    localStorage      │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │ 6. Add to sync queue │
    │    (Sync State)      │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │ 7. Trigger sync      │
    │    (Background)      │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │ 8. Navigate to       │
    │    Squad Selection   │
    │    (Nav State)       │
    └──────────────────────┘
```

---

### Workflow 2: Record Match Event

```
┌──────────────────────────────────────┐
│  User Action: Tap Event Button       │
└──────────────┬───────────────────────┘
               │
               ▼
    ┌──────────────────────┐
    │ 1. Check permissions │
    │    (Scorer rights)   │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │ 2. Create event obj  │
    │    with player, team,│
    │    minute, etc.      │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │ 3. Update match:     │
    │    - Add to events[] │
    │    - Update scores   │
    │    (if goal)         │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │ 4. Update matches[]  │
    │    (Global State)    │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │ 5. Save to           │
    │    localStorage      │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │ 6. Sync to cloud     │
    │    (Background)      │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │ 7. Update UI:        │
    │    - Refresh score   │
    │    - Add to timeline │
    │    - Show animation  │
    └──────────────────────┘
```

---

### Workflow 3: Complete Match & Share Result

```
┌──────────────────────────────────────┐
│  User Action: End Match              │
└──────────────┬───────────────────────┘
               │
               ▼
    ┌──────────────────────┐
    │ 1. Set match status  │
    │    to 'completed'    │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │ 2. Set endTime       │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │ 3. Update matches[]  │
    │    (Global State)    │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │ 4. Navigate to       │
    │    Match Summary     │
    └──────────┬───────────┘
               │
               │ User taps "Share Result"
               ▼
    ┌──────────────────────┐
    │ 5. Set shared = true │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │ 6. Sync to cloud     │
    │    (Priority sync)   │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │ 7. If tournament:    │
    │    - Recalculate     │
    │      standings       │
    │    - Update          │
    │      tournament      │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │ 8. Recalculate:      │
    │    - Player stats    │
    │    - Team stats      │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │ 9. Show success      │
    │    "Match shared!"   │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │ 10. Navigate to      │
    │     Match Details    │
    │     (Public view)    │
    └──────────────────────┘
```

---

### Workflow 4: Sync Local Data to Cloud

```
┌──────────────────────────────────────┐
│  Trigger: App Load / User Action     │
└──────────────┬───────────────────────┘
               │
               ▼
    ┌──────────────────────┐
    │ 1. Check network     │
    │    status            │
    └──────────┬───────────┘
               │
          Online?
         ┌─────┴─────┐
         │           │
        Yes          No
         │           │
         │           ▼
         │   ┌──────────────────┐
         │   │ Set status =     │
         │   │   'offline'      │
         │   └──────────────────┘
         │
         ▼
    ┌──────────────────────┐
    │ 2. Get sync queue    │
    │    from localStorage │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │ 3. Set status =      │
    │    'syncing'         │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │ 4. For each entity   │
    │    in queue:         │
    │    - Fetch from cloud│
    │    - Compare         │
    │      timestamps      │
    │    - Merge / Overwrite│
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │ 5. Push local changes│
    │    to cloud (newer)  │
    └──────────┬───────────┘
               │
         ┌─────┴─────┐
         │           │
      Success     Error
         │           │
         ▼           ▼
    ┌────────┐  ┌────────────┐
    │ Clear  │  │ Log error  │
    │ queue  │  │ Keep in    │
    │        │  │ queue      │
    └────┬───┘  └─────┬──────┘
         │            │
         ▼            ▼
    ┌────────┐  ┌────────────┐
    │ Set    │  │ Set status │
    │ status │  │ = 'error'  │
    │ =      │  │            │
    │ 'synced'│ │            │
    └────┬───┘  └─────┬──────┘
         │            │
         └─────┬──────┘
               │
               ▼
    ┌──────────────────────┐
    │ 6. Update lastSync   │
    │    timestamp         │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │ 7. Save sync state   │
    │    to localStorage   │
    └──────────────────────┘
```

---

## Sync State Management

### Sync Queue Structure
```typescript
interface SyncQueue {
  players: string[];       // Player IDs
  teams: string[];         // Team IDs
  tournaments: string[];   // Tournament IDs
  matches: string[];       // Match IDs
}
```

### Adding to Sync Queue
```typescript
const addToSyncQueue = (entityType: string, entityId: string) => {
  const queue = JSON.parse(localStorage.getItem('vscor_syncQueue') || '{}');
  
  if (!queue[entityType]) {
    queue[entityType] = [];
  }
  
  if (!queue[entityType].includes(entityId)) {
    queue[entityType].push(entityId);
  }
  
  localStorage.setItem('vscor_syncQueue', JSON.stringify(queue));
  
  // Trigger sync if online
  if (navigator.onLine) {
    syncToCloud();
  }
};
```

### Processing Sync Queue
```typescript
const processSyncQueue = async () => {
  const queue = JSON.parse(localStorage.getItem('vscor_syncQueue') || '{}');
  
  for (const entityType of ['players', 'teams', 'tournaments', 'matches']) {
    const ids = queue[entityType] || [];
    
    for (const id of ids) {
      try {
        await syncEntity(entityType, id);
        
        // Remove from queue on success
        queue[entityType] = queue[entityType].filter(qId => qId !== id);
      } catch (error) {
        console.error(`Sync failed for ${entityType}:${id}`, error);
        // Keep in queue for retry
      }
    }
  }
  
  localStorage.setItem('vscor_syncQueue', JSON.stringify(queue));
};
```

---

## State Persistence

### App State Snapshot
```typescript
interface AppStateSnapshot {
  currentView: string;
  viewData: any;
  activeScoringMatch: string | null;  // Match ID
  selectedTeam: 'team1' | 'team2';
  timestamp: string;
}

// Save on critical actions
const saveAppState = () => {
  const snapshot: AppStateSnapshot = {
    currentView: navState.currentView,
    viewData: navState.viewData,
    activeScoringMatch: scoringState.activeMatch?.id || null,
    selectedTeam: scoringState.activeTeam,
    timestamp: new Date().toISOString()
  };
  
  localStorage.setItem('vscor_app_state', JSON.stringify(snapshot));
};

// Restore on app load
const restoreAppState = () => {
  const snapshot = JSON.parse(localStorage.getItem('vscor_app_state') || 'null');
  
  if (snapshot && isRecentSnapshot(snapshot.timestamp)) {
    // Restore navigation
    navigateTo(snapshot.currentView, snapshot.viewData);
    
    // Restore active scoring match
    if (snapshot.activeScoringMatch) {
      const match = matches.find(m => m.id === snapshot.activeScoringMatch);
      if (match) {
        setScoringState(prev => ({
          ...prev,
          activeMatch: match,
          activeTeam: snapshot.selectedTeam
        }));
      }
    }
  }
};
```

---

## State Optimization Strategies

### 1. Memoization
```typescript
// Memoize expensive calculations
const sortedMatches = useMemo(() => {
  return matches.sort((a, b) => 
    new Date(b.match_date).getTime() - new Date(a.match_date).getTime()
  );
}, [matches]);

const myMatches = useMemo(() => {
  return matches.filter(m =>
    m.owner_user_id === currentUser?.user_id ||
    m.primaryScorer.user_id === currentUser?.user_id
  );
}, [matches, currentUser]);
```

### 2. Debouncing
```typescript
// Debounce search input
const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    setSearchResults(searchPlayers(query));
  }, 300),
  [players]
);
```

### 3. Lazy State Initialization
```typescript
// Expensive initial state
const [matches, setMatches] = useState(() => {
  const stored = localStorage.getItem('vscor_matches');
  return stored ? JSON.parse(stored) : [];
});
```

### 4. Batch Updates
```typescript
// Batch multiple state updates
const handleMatchComplete = (matchId: string) => {
  setMatches(prev => {
    const updatedMatches = prev.map(m =>
      m.id === matchId ? { ...m, status: 'completed', endTime: new Date().toISOString() } : m
    );
    
    // Also update related stats in same render
    updatePlayerStats(updatedMatches);
    updateTeamStats(updatedMatches);
    
    return updatedMatches;
  });
};
```

---

**End of State Management Map**
