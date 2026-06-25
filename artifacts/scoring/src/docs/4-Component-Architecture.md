# VScor - Component Architecture

## Overview

This document defines the UI component architecture for VScor, organized into reusable, composable components following React best practices.

---

## Component Hierarchy

```
App.tsx (Root)
├── Authentication Components
├── Layout Components
├── Core UI Components
├── Match Components
├── Tournament Components
├── Profile Components
├── Payment Components
└── Search & Filter Components
```

---

## 1. Authentication Components

### 1.1 LoginScreen
**Path**: `/components/LoginScreen.tsx`

**Purpose**: User authentication interface

**Props**:
```typescript
interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}
```

**State**:
- `email`: string
- `password`: string
- `loading`: boolean
- `error`: string | null

**Child Components**:
- `Input` (email, password)
- `Button` (Sign In, Sign Up link)

**Functions**:
- `handleLogin()`: Authenticate with Supabase
- `handleSignUpRedirect()`: Navigate to signup

---

### 1.2 SignUpScreen
**Path**: `/components/SignUpScreen.tsx`

**Purpose**: User registration interface

**Props**:
```typescript
interface SignUpScreenProps {
  onSignUpSuccess: (user: User) => void;
}
```

**State**:
- `name`: string
- `email`: string
- `password`: string
- `confirmPassword`: string
- `phoneNumber`: string
- `loading`: boolean
- `errors`: Record<string, string>

**Validation**:
- Email format
- Password strength (min 6 chars)
- Password match
- Phone format (optional)

---

### 1.3 ProfileSetupScreen
**Path**: `/components/ProfileSetupScreen.tsx`

**Purpose**: First-time player profile creation/claiming

**Props**:
```typescript
interface ProfileSetupProps {
  user: User;
  onComplete: () => void;
}
```

**State**:
- `setupMode`: 'create' | 'claim' | null
- `searchQuery`: string
- `foundProfiles`: Player[]

**Child Components**:
- `AddPlayer` (for create mode)
- `PlayerSearchList` (for claim mode)

---

## 2. Layout Components

### 2.1 Header
**Path**: `/components/Header.tsx`

**Purpose**: Global app header with branding and user menu

**Props**:
```typescript
interface HeaderProps {
  user: User;
  syncStatus: 'synced' | 'syncing' | 'error' | 'offline';
  onLogout: () => void;
}
```

**Elements**:
- VScor logo
- Sync status indicator
- Profile avatar with dropdown menu

**Menu Items**:
- My Profile
- My Matches
- Settings
- Logout

---

### 2.2 TabNavigation
**Path**: `/components/TabNavigation.tsx`

**Purpose**: Bottom tab navigation for main sections

**Props**:
```typescript
interface TabNavigationProps {
  activeTab: 'liveScores' | 'scoring' | 'info';
  onTabChange: (tab: string) => void;
}
```

**Tabs**:
1. Live Scores (🏆 icon)
2. Scoring (➕ icon)
3. Info (ℹ️ icon)

**Styling**:
- Active: Purple background, white text
- Inactive: Gray text
- Icons from lucide-react

---

### 2.3 BottomSheet
**Path**: `/components/ui/BottomSheet.tsx`

**Purpose**: Slide-up modal for event timeline and details

**Props**:
```typescript
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  expandable?: boolean;
}
```

**Features**:
- Swipe to close
- Backdrop click to close
- Expandable to full screen
- Smooth animations

---

## 3. Core UI Components

### 3.1 Button
**Path**: `/components/ui/button.tsx`

**Variants**:
- `default`: Purple background
- `secondary`: Gray background
- `outline`: Border only
- `ghost`: No background
- `destructive`: Red background

**Sizes**:
- `sm`: Small (height: 36px)
- `md`: Medium (height: 44px)
- `lg`: Large (height: 52px)

**Props**:
```typescript
interface ButtonProps {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}
```

---

### 3.2 Input
**Path**: `/components/ui/input.tsx`

**Types**:
- Text
- Email
- Password (with show/hide toggle)
- Number
- Date
- Time

**Props**:
```typescript
interface InputProps {
  type?: string;
  placeholder?: string;
  value: string | number;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}
```

**Features**:
- Floating label
- Error message display
- Icon support (left or right)
- Clear button (for text inputs)

---

### 3.3 Select / Dropdown
**Path**: `/components/ui/select.tsx`

**Purpose**: Dropdown selection with search

**Props**:
```typescript
interface SelectProps {
  options: Array<{value: string, label: string}>;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
}
```

**Features**:
- Searchable options
- Keyboard navigation
- Custom option rendering

---

### 3.4 Card
**Path**: `/components/ui/card.tsx`

**Purpose**: Container with shadow and border

**Props**:
```typescript
interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}
```

**Styling**:
- White background
- Rounded corners (12px)
- Subtle shadow
- Hover effect (if clickable)

---

### 3.5 Modal / Dialog
**Path**: `/components/ui/modal.tsx`

**Purpose**: Centered overlay for confirmations and forms

**Props**:
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}
```

**Features**:
- Backdrop blur
- Centered positioning
- Smooth open/close animations
- ESC key to close
- Click outside to close

---

### 3.6 Toast / Notification
**Path**: `/components/ui/toast.tsx`

**Purpose**: Temporary feedback messages

**Types**:
- Success (green)
- Error (red)
- Warning (orange)
- Info (blue)

**Props**:
```typescript
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;  // Default: 3000ms
}
```

**Usage**:
```javascript
showToast({
  message: 'Match saved successfully',
  type: 'success'
});
```

---

### 3.7 Avatar
**Path**: `/components/ui/avatar.tsx`

**Purpose**: Circular user/player photo

**Props**:
```typescript
interface AvatarProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;  // Initials
}
```

**Sizes**:
- sm: 32px
- md: 48px
- lg: 64px
- xl: 96px

---

### 3.8 Badge
**Path**: `/components/ui/badge.tsx`

**Purpose**: Small status/label indicator

**Variants**:
- default (purple)
- success (green)
- warning (orange)
- error (red)
- info (blue)

**Props**:
```typescript
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
}
```

---

### 3.9 Tabs
**Path**: `/components/ui/tabs.tsx`

**Purpose**: Horizontal tab navigation

**Props**:
```typescript
interface TabsProps {
  tabs: Array<{id: string, label: string, icon?: React.ReactNode}>;
  activeTab: string;
  onChange: (tabId: string) => void;
}
```

**Styling**:
- Underline indicator for active tab
- Smooth slide animation
- Equal width tabs (optional)

---

### 3.10 Loading Spinner
**Path**: `/components/ui/spinner.tsx`

**Purpose**: Loading state indicator

**Props**:
```typescript
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}
```

---

## 4. Match Components

### 4.1 MatchCard
**Path**: `/components/MatchCard.tsx`

**Purpose**: Display match summary in lists

**Props**:
```typescript
interface MatchCardProps {
  match: Match;
  onClick?: () => void;
  showBadges?: boolean;  // Owner, Scorer badges
}
```

**Display Elements**:
- Team names
- Current/final score
- Match date/time
- Tournament badge (if applicable)
- Status badge (Live, Upcoming, Completed)
- Scorer badges (Owner, Primary Scorer, Secondary Scorer)

**Variants**:
- Live (with pulsing indicator)
- Upcoming (muted colors)
- Completed (normal)

---

### 4.2 LiveScoringScreen
**Path**: `/components/LiveScoring.tsx`

**Purpose**: Real-time match scoring interface

**Props**:
```typescript
interface LiveScoringProps {
  match: Match;
  currentUser: User;
  onUpdateMatch: (match: Match) => void;
  onEndMatch: () => void;
}
```

**Child Components**:
- `ScoreDisplay`
- `TeamToggle`
- `SquadGrid`
- `EventButtons`
- `EventTimeline` (BottomSheet)

**State**:
- `activeTeam`: 'team1' | 'team2'
- `selectedPlayer`: Player | null
- `matchTimer`: number (seconds elapsed)
- `isPaused`: boolean

---

### 4.3 ScoreDisplay
**Path**: `/components/ScoreDisplay.tsx`

**Purpose**: Show current score and timer

**Props**:
```typescript
interface ScoreDisplayProps {
  team1Name: string;
  team2Name: string;
  scoreA: number;
  scoreB: number;
  matchMinute: number;
  onPause: () => void;
  onResume: () => void;
  onEndMatch: () => void;
  isPaused: boolean;
}
```

**Layout**:
```
┌────────────────────────────────────┐
│ Arsenal FC  [2] - [1]  Chelsea FC  │
│         Timer: 45:23               │
│  [Pause] [End Match ▼]             │
└────────────────────────────────────┘
```

---

### 4.4 SquadGrid
**Path**: `/components/SquadGrid.tsx`

**Purpose**: Display squad in grid layout for player selection

**Props**:
```typescript
interface SquadGridProps {
  squad: Player[];
  selectedPlayer: Player | null;
  onSelectPlayer: (player: Player) => void;
  columns?: number;  // Default: 3
}
```

**Player Card Layout**:
```
┌────┐
│ 9  │  ← Jersey number (large)
│John│  ← Name
└────┘
```

**States**:
- Active (full color)
- Substituted out (grayed, strikethrough)
- Selected (blue border)

---

### 4.5 EventButtons
**Path**: `/components/EventButtons.tsx`

**Purpose**: Quick-tap buttons for recording events

**Props**:
```typescript
interface EventButtonsProps {
  scoringLevel: string;
  selectedPlayer: Player | null;
  onRecordEvent: (eventType: string) => void;
  allowedEvents?: string[];  // For event-based division
}
```

**Button Grid**:
```
┌──────────┬──────────┐
│ ⚽ Goal   │🎯 Shot On│
├──────────┼──────────┤
│❌ Shot Off│🚫 Foul   │
├──────────┼──────────┤
│🔄 Sub     │⚪ Corner │
└──────────┴──────────┘
```

**Button States**:
- Enabled (full color)
- Disabled (grayed, if event not allowed or no player selected)

---

### 4.6 EventTimeline
**Path**: `/components/EventTimeline.tsx`

**Purpose**: Chronological list of recorded events

**Props**:
```typescript
interface EventTimelineProps {
  events: MatchEvent[];
  onEditEvent: (eventId: string) => void;
  onDeleteEvent: (eventId: string) => void;
  readOnly?: boolean;
}
```

**Event Item Layout**:
```
┌────────────────────────────────┐
│ 45' ⚽ John (#9) - Goal        │
│     Assist: Mike (#10)         │
│     [Edit] [Delete]            │
└────────────────────────────────┘
```

**Features**:
- Auto-scroll to latest event
- Filter by team/event type
- Expand for full details

---

### 4.7 EventDetailModal
**Path**: `/components/EventDetailModal.tsx`

**Purpose**: Capture detailed event attributes

**Props**:
```typescript
interface EventDetailModalProps {
  eventType: string;
  player: Player;
  squad: Player[];
  onConfirm: (details: EventDetails) => void;
  onCancel: () => void;
}
```

**Dynamic Fields** (based on eventType):
- **Goal**: goalType, assistedBy
- **Foul**: cardType, foulType
- **Substitution**: playerOut, playerIn

---

### 4.8 MatchSummary
**Path**: `/components/MatchSummary.tsx`

**Purpose**: Post-match summary with statistics

**Props**:
```typescript
interface MatchSummaryProps {
  match: Match;
  onShareResult: () => void;
  onCalculatePayment: () => void;
  onViewDetails: () => void;
}
```

**Sections**:
- Final score (large display)
- Match statistics comparison
- Top performers
- Event timeline preview
- Action buttons

---

### 4.9 MatchDetails
**Path**: `/components/MatchDetails.tsx`

**Purpose**: Full match details (public view)

**Props**:
```typescript
interface MatchDetailsProps {
  match: Match;
  currentUser?: User;
}
```

**Tabs**:
1. Overview (match info, scores)
2. Events (timeline)
3. Statistics (comparison)
4. Squads (team lineups)
5. Payments (if owner, tab available)

---

## 5. Tournament Components

### 5.1 TournamentCard
**Path**: `/components/TournamentCard.tsx`

**Purpose**: Display tournament summary in lists

**Props**:
```typescript
interface TournamentCardProps {
  tournament: Tournament;
  onClick?: () => void;
}
```

**Display Elements**:
- Tournament logo
- Tournament name
- Format badge
- Date range
- Teams count
- Matches count
- Status (Upcoming, In Progress, Completed)

---

### 5.2 TournamentProfile
**Path**: `/components/TournamentProfile.tsx`

**Purpose**: Complete tournament view

**Props**:
```typescript
interface TournamentProfileProps {
  tournament: Tournament;
  currentUser?: User;
  onUpdate: (tournament: Tournament) => void;
}
```

**Tabs**:
1. Overview
2. Teams
3. Fixtures
4. Standings
5. Matches

---

### 5.3 StandingsTable
**Path**: `/components/StandingsTable.tsx`

**Purpose**: Tournament points table

**Props**:
```typescript
interface StandingsTableProps {
  standings: StandingEntry[];
  highlightTeam?: string;
  showGroup?: boolean;
}
```

**Columns**:
- Pos (Position)
- Team (with logo)
- P (Played)
- W (Won)
- D (Drawn)
- L (Lost)
- GF (Goals For)
- GA (Goals Against)
- GD (Goal Difference)
- Pts (Points)

**Features**:
- Sortable columns
- Color-coded positions (top 4 green)
- Hover tooltips

---

### 5.4 FixturesList
**Path**: `/components/FixturesList.tsx`

**Purpose**: Display tournament fixtures

**Props**:
```typescript
interface FixturesListProps {
  fixtures: Fixture[];
  tournament: Tournament;
  onCreateMatch?: (fixtureId: string) => void;
  isCoordinator?: boolean;
}
```

**Grouping**:
- By stage (Group Stage, Quarter Finals, etc.)
- By date
- By group (for group stages)

**Fixture Item**:
```
┌────────────────────────────────┐
│ Match 1: Team A vs Team B      │
│ Date: Mar 10 | Time: 10:00     │
│ Venue: Stadium A               │
│ Status: Scheduled              │
│ [Create Match] (if coordinator)│
└────────────────────────────────┘
```

---

### 5.5 AddTournament
**Path**: `/components/AddTournament.tsx`

**Purpose**: Multi-step tournament creation wizard

**Props**:
```typescript
interface AddTournamentProps {
  onComplete: (tournament: Tournament) => void;
  onCancel: () => void;
}
```

**Steps**:
1. Basic Details (name, dates, venue, logo)
2. Format Selection (knockout, round-robin, groups)
3. Match Configuration (duration, players, points)
4. Group Configuration (if applicable)
5. Review & Create

**State Management**:
- `currentStep`: number
- `formData`: Partial<Tournament>
- `errors`: Record<string, string>

---

## 6. Profile Components

### 6.1 PlayerProfile
**Path**: `/components/PlayerProfile.tsx`

**Purpose**: Player profile view/edit

**Props**:
```typescript
interface PlayerProfileProps {
  player: Player;
  isOwner: boolean;
  onUpdate?: (player: Player) => void;
}
```

**Sections**:
- Header (photo, name, position, jersey #)
- Statistics grid
- Recent matches list
- Career history

**Edit Mode**:
- Toggles to form with editable fields
- Save/Cancel buttons

---

### 6.2 TeamProfile
**Path**: `/components/TeamProfile.tsx`

**Purpose**: Team profile view/edit

**Props**:
```typescript
interface TeamProfileProps {
  team: Team;
  isCoordinator: boolean;
  onUpdate?: (team: Team) => void;
}
```

**Tabs**:
1. Overview (info, stats)
2. Squad (roster with add/remove)
3. Statistics (detailed stats)
4. History (matches, tournaments)

---

### 6.3 AddPlayer
**Path**: `/components/AddPlayer.tsx`

**Purpose**: Player creation form

**Props**:
```typescript
interface AddPlayerProps {
  onComplete: (player: Player) => void;
  onCancel: () => void;
  defaultValues?: Partial<Player>;
}
```

**Form Fields**:
- Name (required)
- Email, Phone
- Position (dropdown)
- Jersey Number
- DOB, Height, Weight
- Preferred Foot
- Photo upload

---

### 6.4 AddTeam
**Path**: `/components/AddTeam.tsx`

**Purpose**: Team creation form

**Props**:
```typescript
interface AddTeamProps {
  onComplete: (team: Team) => void;
  onCancel: () => void;
}
```

**Form Fields**:
- Team Name (required)
- Coach
- Home Venue
- Description
- Logo upload
- Founded year

---

## 7. Payment Components

### 7.1 CalculatePayment
**Path**: `/components/CalculatePayment.tsx`

**Purpose**: Match payment configuration and tracking

**Props**:
```typescript
interface CalculatePaymentProps {
  match: Match;
  onSave: (match: Match) => void;
  playerDatabase: Player[];
}
```

**Sections**:
1. Configuration (amount, treasurer)
2. Team 1 Payments (compact list)
3. Team 2 Payments (compact list)
4. Summary (total, paid, pending)

**Player Payment Item**:
```
┌────────────────────────────────────┐
│ John | Arsenal | ₹100 | ✅ Paid   │
│ [💰 Mark Paid] [↩️ Unpaid]       │
└────────────────────────────────────┘
```

**Features**:
- Auto-save on status change
- Real-time summary updates
- Icon-only action buttons

---

### 7.2 MatchPayments
**Path**: `/components/MatchPayments.tsx`

**Purpose**: Overview of all match payments

**Props**:
```typescript
interface MatchPaymentsProps {
  matches: Match[];
  currentUser: User;
}
```

**Tabs**:
1. Upcoming (no payment configured)
2. Pending (partially paid)
3. Completed (fully paid)

**Match Payment Card**:
```
┌────────────────────────────────┐
│ Arsenal vs Chelsea             │
│ Mar 8, 2026 | Emirates Stadium │
│                                │
│ ₹100 per player                │
│ Received: ₹600 / ₹1400 (43%)   │
│ [████░░░░░░] Progress bar      │
│ 6 paid | 8 pending             │
│                                │
│ [View Details]                 │
└────────────────────────────────┘
```

---

## 8. Search & Filter Components

### 8.1 SearchBar
**Path**: `/components/SearchBar.tsx`

**Purpose**: Global search across entities

**Props**:
```typescript
interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
}
```

**Features**:
- Debounced input (300ms)
- Clear button
- Search icon
- Auto-focus on mount

---

### 8.2 FilterBar
**Path**: `/components/FilterBar.tsx`

**Purpose**: Filter controls for lists

**Props**:
```typescript
interface FilterBarProps {
  filters: Filter[];
  activeFilters: Record<string, string>;
  onChange: (filters: Record<string, string>) => void;
}

interface Filter {
  id: string;
  label: string;
  type: 'select' | 'date' | 'toggle';
  options?: Array<{value: string, label: string}>;
}
```

**Example Filters**:
- Tournament dropdown
- Team dropdown
- Date range picker
- Status toggle

---

### 8.3 UserAutocompleteInput
**Path**: `/components/UserAutocompleteInput.tsx`

**Purpose**: Search and select registered users

**Props**:
```typescript
interface UserAutocompleteInputProps {
  value: User | null;
  onChange: (user: User | null) => void;
  placeholder?: string;
  excludeUsers?: string[];  // User IDs to exclude
  label?: string;
}
```

**Features**:
- Search by name, email, or phone
- Show "Registered" badge
- Avatar display
- Clear selection button

**Dropdown Item**:
```
┌────────────────────────────────┐
│ [Avatar] John Doe              │
│          john@email.com        │
│          Registered ✓          │
└────────────────────────────────┘
```

---

### 8.4 TeamAutocomplete
**Path**: `/components/TeamAutocomplete.tsx`

**Purpose**: Search and select teams

**Props**:
```typescript
interface TeamAutocompleteProps {
  value: Team | null;
  onChange: (team: Team | null) => void;
  placeholder?: string;
  teamOptions?: Team[];  // Restrict to specific teams
  allowCreate?: boolean;
}
```

**Features**:
- Search by name
- Show team logo
- "Add New Team" option (if allowCreate)

---

## 9. Utility Components

### 9.1 EmptyState
**Path**: `/components/EmptyState.tsx`

**Purpose**: Display when lists are empty

**Props**:
```typescript
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

**Example**:
```
┌────────────────────────────────┐
│         [📋 Icon]              │
│                                │
│      No matches yet            │
│  Create your first match to    │
│       get started!             │
│                                │
│    [Create Match Button]       │
└────────────────────────────────┘
```

---

### 9.2 ConfirmDialog
**Path**: `/components/ConfirmDialog.tsx`

**Purpose**: Confirmation prompts for destructive actions

**Props**:
```typescript
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'default' | 'destructive';
}
```

---

### 9.3 LoadingScreen
**Path**: `/components/LoadingScreen.tsx`

**Purpose**: Full-screen loading state

**Props**:
```typescript
interface LoadingScreenProps {
  message?: string;
}
```

**Display**:
- Centered spinner
- Optional loading message
- VScor branding

---

## 10. Component Communication

### Props Flow
```
App.tsx
  ├─ passes user, matches, players → LiveScoringScreen
  │    └─ passes squad, onSelectPlayer → SquadGrid
  │         └─ passes player → PlayerCard
  │
  ├─ passes tournaments → TournamentProfile
  │    └─ passes standings → StandingsTable
  │
  └─ passes match → MatchDetails
       └─ passes events → EventTimeline
```

### State Management

**Global State** (in App.tsx):
- `currentUser`: User
- `playerDatabase`: Player[]
- `registeredTeams`: Team[]
- `tournaments`: Tournament[]
- `matches`: Match[]

**Component State**:
- UI state (modals open/closed, active tab)
- Form inputs (controlled components)
- Local selections (selected player, active team)

### Event Handlers

**Naming Convention**:
- `onX`: Callback props (e.g., `onClick`, `onChange`)
- `handleX`: Internal handlers (e.g., `handleSubmit`, `handleDelete`)

**Example**:
```typescript
// Parent component
<NewMatch onComplete={handleMatchCreated} />

// Child component
const handleSubmit = () => {
  // ... validation
  onComplete(newMatch);  // Call parent callback
};
```

---

## 11. Styling Approach

### Tailwind CSS v4
- Utility-first approach
- Responsive design (mobile-first)
- Custom theme in `globals.css`

### Component-Specific Styles
```typescript
// Example component with Tailwind
const MatchCard = ({ match }) => (
  <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
    <h3 className="text-lg font-semibold">{match.team1} vs {match.team2}</h3>
    <p className="text-gray-600">{match.venue}</p>
  </div>
);
```

### Theme Variables
```css
/* globals.css */
:root {
  --color-primary: #7C3AED;      /* Purple */
  --color-success: #10B981;      /* Green */
  --color-error: #EF4444;        /* Red */
  --color-warning: #F59E0B;      /* Orange */
  --spacing-unit: 4px;
  --border-radius: 12px;
}
```

---

## 12. Accessibility

### ARIA Labels
```typescript
<button
  onClick={handleDelete}
  aria-label="Delete match"
>
  <Trash2 className="w-4 h-4" />
</button>
```

### Keyboard Navigation
- All interactive elements focusable
- Tab order logical
- Enter/Space to activate buttons
- ESC to close modals

### Screen Reader Support
- Semantic HTML (`<button>`, `<input>`, `<nav>`)
- ARIA roles where needed
- Meaningful alt text for images

---

## 13. Performance Optimization

### React.memo
```typescript
const MatchCard = React.memo(({ match }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  return prevProps.match.id === nextProps.match.id &&
         prevProps.match.updated_at === nextProps.match.updated_at;
});
```

### useMemo for Expensive Calculations
```typescript
const sortedMatches = useMemo(() => {
  return matches.sort((a, b) => 
    new Date(b.match_date) - new Date(a.match_date)
  );
}, [matches]);
```

### useCallback for Handlers
```typescript
const handleUpdateMatch = useCallback((updatedMatch) => {
  setMatches(prev => 
    prev.map(m => m.id === updatedMatch.id ? updatedMatch : m)
  );
}, []);
```

### Lazy Loading
```typescript
const MatchDetails = lazy(() => import('./components/MatchDetails'));

<Suspense fallback={<LoadingSpinner />}>
  <MatchDetails match={selectedMatch} />
</Suspense>
```

---

**End of Component Architecture Document**
