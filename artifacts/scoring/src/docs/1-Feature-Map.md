# VScor - Feature Map

## Hierarchical Feature Overview

```
VScor Platform
│
├── 1. AUTHENTICATION & USER MANAGEMENT
│   ├── 1.1 Authentication
│   │   ├── Email/Password Sign Up
│   │   ├── Email/Password Sign In
│   │   ├── Session Management
│   │   ├── Auto-login (Remember Me)
│   │   ├── Logout
│   │   └── [Future] Social Login (Google, Facebook, GitHub)
│   │
│   ├── 1.2 User Profile
│   │   ├── Create User Profile
│   │   ├── View User Profile
│   │   ├── Edit User Profile
│   │   ├── Upload Profile Photo
│   │   └── Link to Player Profile
│   │
│   └── 1.3 Onboarding
│       ├── Welcome Screen
│       ├── Profile Setup
│       ├── Link/Create Player Profile
│       └── App Tutorial (Optional)
│
├── 2. PLAYER MANAGEMENT
│   ├── 2.1 Player Profile CRUD
│   │   ├── Create Player Profile
│   │   ├── View Player Profile
│   │   ├── Edit Player Profile (Owner Only)
│   │   ├── Delete Player Profile (Owner Only)
│   │   ├── Transfer Ownership
│   │   └── Claim Unclaimed Profile
│   │
│   ├── 2.2 Player Information
│   │   ├── Basic Info (Name, Position, Jersey #, Photo)
│   │   ├── Contact Info (Email, Phone)
│   │   ├── Physical Stats (Height, Weight, DOB)
│   │   └── Playing Attributes (Preferred Foot)
│   │
│   ├── 2.3 Player Statistics
│   │   ├── Auto-calculated Stats
│   │   │   ├── Matches Played
│   │   │   ├── Goals Scored
│   │   │   ├── Assists
│   │   │   ├── Yellow/Red Cards
│   │   │   ├── Shots (On/Off Target)
│   │   │   ├── Fouls Committed
│   │   │   ├── Clean Sheets (GK)
│   │   │   ├── Interceptions
│   │   │   └── Offsides
│   │   │
│   │   ├── Career Statistics
│   │   ├── Performance Trends
│   │   └── Tournament-specific Stats
│   │
│   ├── 2.4 Player Search & Discovery
│   │   ├── Search by Name
│   │   ├── Filter by Position
│   │   ├── Filter by Team
│   │   ├── Sort Options (Goals, Matches, Name)
│   │   └── Leaderboards
│   │       ├── Top Scorers
│   │       ├── Top Assisters
│   │       ├── Most Matches
│   │       └── Clean Sheets Leaders
│   │
│   └── 2.5 Player History
│       ├── Match History
│       ├── Tournament Participation
│       └── Team History
│
├── 3. TEAM MANAGEMENT
│   ├── 3.1 Team Profile CRUD
│   │   ├── Create Team
│   │   ├── View Team Profile
│   │   ├── Edit Team (Coordinator Only)
│   │   ├── Delete Team (Coordinator Only)
│   │   └── Transfer Ownership
│   │
│   ├── 3.2 Team Information
│   │   ├── Basic Info (Name, Logo, Coach, Venue)
│   │   ├── Team Description
│   │   ├── Foundation Year
│   │   └── Contact Information
│   │
│   ├── 3.3 Squad Management
│   │   ├── Add Player to Roster
│   │   ├── Remove Player from Roster
│   │   ├── Assign Jersey Numbers
│   │   ├── Assign Positions
│   │   ├── Set Captain/Vice-Captain
│   │   └── Squad List View
│   │
│   ├── 3.4 Team Coordinators
│   │   ├── Add Co-coordinator
│   │   ├── Remove Co-coordinator
│   │   └── View Coordinator List
│   │
│   ├── 3.5 Team Statistics
│   │   ├── Auto-calculated Stats
│   │   │   ├── Matches Played
│   │   │   ├── Wins/Draws/Losses
│   │   │   ├── Goals For/Against
│   │   │   ├── Goal Difference
│   │   │   └── Win Percentage
│   │   │
│   │   ├── Performance Analysis
│   │   ├── Form (Last 5 Matches)
│   │   └── Head-to-Head Records
│   │
│   ├── 3.6 Team Search & Discovery
│   │   ├── Search by Name
│   │   ├── Filter by Tournament
│   │   ├── Sort Options (Wins, Goal Difference, Name)
│   │   └── Team Rankings
│   │
│   └── 3.7 Team History
│       ├── Match History
│       ├── Tournament Participation
│       └── Championship Records
│
├── 4. TOURNAMENT MANAGEMENT
│   ├── 4.1 Tournament CRUD
│   │   ├── Create Tournament
│   │   ├── View Tournament Profile
│   │   ├── Edit Tournament (Coordinator Only)
│   │   ├── Delete Tournament (Coordinator Only)
│   │   └── Transfer Ownership
│   │
│   ├── 4.2 Tournament Configuration
│   │   ├── Basic Information
│   │   │   ├── Name
│   │   │   ├── Description
│   │   │   ├── Logo
│   │   │   ├── Start/End Dates
│   │   │   └── Venue
│   │   │
│   │   ├── Format Selection
│   │   │   ├── Knockout
│   │   │   ├── Round Robin
│   │   │   └── Groups + Knockout
│   │   │
│   │   ├── Match Rules
│   │   │   ├── Match Duration
│   │   │   ├── Players per Team
│   │   │   └── Points System (Win/Draw/Loss)
│   │   │
│   │   └── Group Configuration (if applicable)
│   │       ├── Number of Groups
│   │       ├── Teams per Group
│   │       └── Teams Advancing
│   │
│   ├── 4.3 Team Management
│   │   ├── Add Participating Team
│   │   ├── Remove Participating Team
│   │   ├── Assign Teams to Groups
│   │   └── View Participating Teams List
│   │
│   ├── 4.4 Tournament Coordinators
│   │   ├── Add Co-coordinator
│   │   ├── Remove Co-coordinator
│   │   └── View Coordinator List
│   │
│   ├── 4.5 Fixture System
│   │   ├── Generate Fixtures
│   │   │   ├── Knockout Bracket Generation
│   │   │   ├── Round Robin Generation
│   │   │   └── Group Stage Generation
│   │   │
│   │   ├── Manual Fixture Management
│   │   │   ├── Add Custom Fixture
│   │   │   ├── Edit Fixture
│   │   │   ├── Delete Fixture
│   │   │   └── Assign Match Dates/Times
│   │   │
│   │   ├── Fixture Publishing
│   │   │   ├── Publish Fixtures (Make Public)
│   │   │   └── Unpublish Fixtures
│   │   │
│   │   └── Fixture Regeneration
│   │       ├── Regenerate with Warning
│   │       └── Preserve Completed Matches
│   │
│   ├── 4.6 Standings System
│   │   ├── Auto-calculate Standings
│   │   │   ├── Points Calculation
│   │   │   ├── Goal Difference Calculation
│   │   │   ├── Tiebreaker Logic
│   │   │   └── Position Assignment
│   │   │
│   │   ├── Group Standings (if applicable)
│   │   ├── Overall Standings
│   │   ├── Form Indicators
│   │   └── Qualification Status
│   │
│   ├── 4.7 Tournament Search & Discovery
│   │   ├── Search by Name
│   │   ├── Filter by Status (Upcoming/In Progress/Completed)
│   │   ├── Filter by Format
│   │   └── Sort Options
│   │
│   └── 4.8 Tournament Statistics
│       ├── Total Matches Played
│       ├── Top Scorers
│       ├── Most Goals in a Match
│       ├── Fair Play Rankings
│       └── Attendance Statistics
│
├── 5. MATCH MANAGEMENT
│   ├── 5.1 Match Creation
│   │   ├── Tournament/Friendly Selection
│   │   ├── Team Selection (Team 1 & Team 2)
│   │   ├── Match Configuration
│   │   │   ├── Match Format (Single/Two Halves)
│   │   │   ├── Duration (5-90 minutes)
│   │   │   ├── Venue
│   │   │   └── Players per Team
│   │   │
│   │   ├── Scoring Level Selection
│   │   │   ├── Basic
│   │   │   ├── Intermediate (Detailed)
│   │   │   ├── Intermediate (All Events)
│   │   │   └── Advanced
│   │   │
│   │   └── Tournament Stage Selection (if applicable)
│   │       ├── Group Stage
│   │       ├── Round of 32/16
│   │       ├── Quarter Final
│   │       ├── Semi Final
│   │       └── Final
│   │
│   ├── 5.2 Scorer Assignment System
│   │   ├── Primary Scorer Assignment
│   │   │   ├── Default to Match Creator
│   │   │   ├── Search Registered Users
│   │   │   └── Assign Primary Scorer
│   │   │
│   │   ├── Secondary Scorer (Advanced Mode Only)
│   │   │   ├── Optional Assignment
│   │   │   └── Must Differ from Primary
│   │   │
│   │   └── Responsibility Division (Dual-Scorer)
│   │       ├── Divide by Teams
│   │       │   ├── Assign Team 1 to Scorer
│   │       │   └── Assign Team 2 to Scorer
│   │       │
│   │       └── Divide by Event Types
│   │           ├── Primary: Goals, Shots, Fouls
│   │           └── Secondary: Interceptions, Offsides, Substitutions
│   │
│   ├── 5.3 Squad Selection
│   │   ├── Team 1 Squad Selection
│   │   │   ├── Select Starting Players
│   │   │   ├── Select Substitutes
│   │   │   └── Add New Player (if not in roster)
│   │   │
│   │   ├── Team 2 Squad Selection
│   │   │   ├── Select Starting Players
│   │   │   ├── Select Substitutes
│   │   │   └── Add New Player
│   │   │
│   │   └── Validation
│   │       ├── Minimum 1 Player per Team
│   │       └── Maximum = Players per Team
│   │
│   ├── 5.4 Match Ownership
│   │   ├── Owner Assignment (Match Creator)
│   │   ├── Owner Permissions
│   │   │   ├── Edit Match Configuration
│   │   │   ├── Assign/Change Scorers
│   │   │   ├── Calculate Payments
│   │   │   └── Transfer Ownership
│   │   │
│   │   └── Transfer Match Ownership
│   │       ├── Transfer to Registered User
│   │       └── Preferably to Assigned Scorer
│   │
│   ├── 5.5 Match Viewing
│   │   ├── Match Details Screen
│   │   │   ├── Match Info (Teams, Score, Date, Venue)
│   │   │   ├── Event Timeline
│   │   │   ├── Match Statistics
│   │   │   ├── Squad Lists
│   │   │   └── Scorer Information
│   │   │
│   │   ├── Public Viewing (All Users)
│   │   └── Owner/Scorer Controls
│   │
│   └── 5.6 Match Deletion
│       ├── Delete Before Scoring Starts
│       └── Delete with Confirmation (if events exist)
│
├── 6. MATCH SCORING SYSTEM
│   ├── 6.1 Live Scoring Interface
│   │   ├── Score Display
│   │   │   ├── Team Names
│   │   │   ├── Current Score (Auto-updating)
│   │   │   └── Match Timer
│   │   │
│   │   ├── Team Toggle
│   │   │   ├── Switch Between Teams
│   │   │   └── Disabled Teams (if Team-based Division)
│   │   │
│   │   ├── Squad Display
│   │   │   ├── Grid Layout of Players
│   │   │   ├── Jersey Numbers
│   │   │   ├── Player Names
│   │   │   ├── Playing Status Indicators
│   │   │   └── Player Selection
│   │   │
│   │   ├── Event Recording Controls
│   │   │   ├── Event Type Buttons
│   │   │   ├── Disabled Event Types (if Event-based Division)
│   │   │   └── Quick-tap Recording
│   │   │
│   │   ├── Match Timer Controls
│   │   │   ├── Auto Timer (counting up)
│   │   │   ├── Pause Match
│   │   │   ├── Resume Match
│   │   │   └── End Match
│   │   │
│   │   └── Event Timeline (Bottom Sheet)
│   │       ├── Chronological Event List
│   │       ├── Edit Event
│   │       ├── Delete Event
│   │       └── Expand/Collapse Timeline
│   │
│   ├── 6.2 Event Recording Workflows
│   │   ├── Basic Event Flow
│   │   │   ├── Select Player
│   │   │   ├── Tap Event Button
│   │   │   └── Event Recorded (< 2 seconds)
│   │   │
│   │   ├── Detailed Event Flow
│   │   │   ├── Select Player
│   │   │   ├── Tap Event Button
│   │   │   ├── Event Details Modal
│   │   │   ├── Select Attributes
│   │   │   └── Confirm Event
│   │   │
│   │   └── Substitution Flow
│   │       ├── Tap Substitute Button
│   │       ├── Select Player Out (from playing XI)
│   │       ├── Select Player In (from substitutes)
│   │       ├── Update Squad Status
│   │       └── Record Event
│   │
│   ├── 6.3 Scoring Levels
│   │   ├── Basic Scoring
│   │   │   ├── Events: Goal, Shot On/Off, Foul, Sub, Corner
│   │   │   ├── Attributes: Minimal (Penalty flag, Cards)
│   │   │   └── Speed: 1-2 seconds per event
│   │   │
│   │   ├── Intermediate Detailed
│   │   │   ├── Events: Same as Basic
│   │   │   ├── Attributes: Goal Type, Assist, Card Type
│   │   │   └── Speed: 3-4 seconds per event
│   │   │
│   │   ├── Intermediate All Events
│   │   │   ├── Events: Basic + Interception, Offside
│   │   │   ├── Attributes: Basic only
│   │   │   └── Speed: 1-2 seconds per event
│   │   │
│   │   └── Advanced Scoring
│   │       ├── Events: All event types
│   │       ├── Attributes: Full attribute set
│   │       ├── Dual-Scorer Support: Enabled
│   │       └── Speed: 4-5 seconds per event
│   │
│   ├── 6.4 Dual-Scorer Mode (Advanced Only)
│   │   ├── Parallel Event Recording
│   │   ├── Team-based Responsibility Division
│   │   │   ├── Each Scorer Records for One Team
│   │   │   ├── Team Tab Restrictions
│   │   │   └── No Event Conflicts
│   │   │
│   │   ├── Event-based Responsibility Division
│   │   │   ├── Event Type Assignment
│   │   │   ├── Disabled Event Buttons
│   │   │   └── Parallel Event Types
│   │   │
│   │   └── Real-time Sync
│   │       ├── Event Merge in Timeline
│   │       ├── Chronological Ordering
│   │       └── Conflict Prevention
│   │
│   ├── 6.5 Automatic Actions
│   │   ├── Score Auto-increment (on Goal)
│   │   ├── Player Status Update (on Substitution)
│   │   ├── Match Minute Auto-increment
│   │   ├── Event Timestamping
│   │   └── Match Date/Time Setting (on Scoring Start)
│   │
│   ├── 6.6 Event Management
│   │   ├── View Event Timeline
│   │   ├── Edit Recorded Event
│   │   ├── Delete Event (with Confirmation)
│   │   └── Event Filtering (by Team, by Type)
│   │
│   └── 6.7 Match Completion
│       ├── End Match Action
│       ├── Final Score Display
│       ├── Match Summary Screen
│       │   ├── Final Score
│       │   ├── Match Statistics
│       │   ├── Top Performers
│       │   └── Event Timeline
│       │
│       ├── Share Match Result
│       │   ├── Sync to Cloud
│       │   ├── Update Tournament Standings
│       │   └── Make Public
│       │
│       └── Post-Match Actions
│           ├── Calculate Payment
│           ├── View Full Details
│           └── Edit Match (if needed)
│
├── 7. MATCH PAYMENTS SYSTEM
│   ├── 7.1 Payment Configuration
│   │   ├── Set Per-Player Amount
│   │   ├── Select Treasurer
│   │   │   ├── Default to Match Creator
│   │   │   └── Search Players/Users
│   │   │
│   │   └── Auto-calculate Total Amount
│   │
│   ├── 7.2 Payment Tracking
│   │   ├── Player Payment List
│   │   │   ├── Team 1 Players
│   │   │   └── Team 2 Players
│   │   │
│   │   ├── Payment Status
│   │   │   ├── Mark as Paid (Auto-save)
│   │   │   ├── Mark as Unpaid
│   │   │   └── Payment Timestamp
│   │   │
│   │   └── Payment Summary
│   │       ├── Total Amount
│   │       ├── Total Paid
│   │       ├── Total Pending
│   │       └── Progress Bar
│   │
│   ├── 7.3 Calculate Payment Screen
│   │   ├── Compact Player List
│   │   │   ├── One-line Layout
│   │   │   ├── Icon-only Buttons
│   │   │   └── Status Indicators
│   │   │
│   │   ├── Quick Actions
│   │   │   ├── Mark Paid Button (💰)
│   │   │   └── Mark Unpaid Button (↩️)
│   │   │
│   │   └── Auto-save Functionality
│   │       ├── Immediate localStorage Save
│   │       ├── Cloud Sync in Background
│   │       └── Update Parent Screen Counts
│   │
│   ├── 7.4 Match Payments Tab
│   │   ├── Payment Categories (Tabs)
│   │   │   ├── Upcoming Matches
│   │   │   ├── Pending Payments
│   │   │   └── Completed Payments
│   │   │
│   │   ├── Match Payment Cards
│   │   │   ├── Match Info
│   │   │   ├── Payment Summary
│   │   │   ├── Received/Pending Amounts
│   │   │   └── Progress Indicator
│   │   │
│   │   └── Filter & Search
│   │       ├── Filter by Team
│   │       └── Filter by Date Range
│   │
│   └── 7.5 Treasurer Management
│       ├── Assign Treasurer
│       ├── Change Treasurer
│       └── Treasurer Responsibilities View
│
├── 8. INFO TAB (PUBLIC VIEWING)
│   ├── 8.1 Navigation
│   │   ├── Search Bar (Global)
│   │   └── Category Tabs
│   │       ├── Live Scores
│   │       ├── Results
│   │       ├── Players
│   │       ├── Teams
│   │       └── Tournaments
│   │
│   ├── 8.2 Live Scores View
│   │   ├── Active Matches List
│   │   ├── Real-time Score Updates
│   │   ├── Match Minute Display
│   │   ├── Last Event Display
│   │   └── Tap to View Live Details
│   │
│   ├── 8.3 Results View
│   │   ├── Completed Matches List
│   │   ├── Final Scores
│   │   ├── Match Date Display
│   │   ├── Tournament Badge
│   │   └── Filter/Sort Options
│   │       ├── Filter by Tournament
│   │       ├── Filter by Team
│   │       ├── Filter by Date Range
│   │       └── Sort by Date
│   │
│   ├── 8.4 Players View
│   │   ├── Player Grid/List
│   │   ├── Player Cards
│   │   │   ├── Avatar
│   │   │   ├── Name
│   │   │   ├── Position
│   │   │   └── Key Stat
│   │   │
│   │   ├── Search by Name
│   │   ├── Filter by Position
│   │   └── Sort Options
│   │       ├── Most Goals
│   │       ├── Most Assists
│   │       ├── Most Matches
│   │       └── Name (A-Z)
│   │
│   ├── 8.5 Teams View
│   │   ├── Team Grid/List
│   │   ├── Team Cards
│   │   │   ├── Logo
│   │   │   ├── Name
│   │   │   ├── Win/Draw/Loss Record
│   │   │   └── Current Form
│   │   │
│   │   ├── Search by Name
│   │   └── Sort Options
│   │       ├── Most Wins
│   │       ├── Best Goal Difference
│   │       └── Name (A-Z)
│   │
│   ├── 8.6 Tournaments View
│   │   ├── Tournament List
│   │   ├── Tournament Cards
│   │   │   ├── Logo
│   │   │   ├── Name
│   │   │   ├── Format Badge
│   │   │   ├── Date Range
│   │   │   ├── Status (Upcoming/In Progress/Completed)
│   │   │   └── Teams Count
│   │   │
│   │   ├── Filter by Status
│   │   ├── Filter by Format
│   │   └── Search by Name
│   │
│   └── 8.7 Leaderboards
│       ├── Top Scorers
│       │   ├── Overall
│       │   └── By Tournament
│       │
│       ├── Top Assisters
│       ├── Most Matches Played
│       └── Clean Sheets Leaders
│
├── 9. MY MATCHES
│   ├── 9.1 Match Filtering
│   │   ├── As Owner (Matches I Created)
│   │   ├── As Scorer (Matches I Scored)
│   │   │   ├── As Primary Scorer
│   │   │   └── As Secondary Scorer
│   │   │
│   │   └── Draft Matches (Incomplete)
│   │
│   ├── 9.2 Match List Display
│   │   ├── Match Cards with Badges
│   │   │   ├── "Owner" Badge
│   │   │   ├── "Primary Scorer" Badge
│   │   │   ├── "Secondary Scorer" Badge
│   │   │   └── "Draft" Badge
│   │   │
│   │   └── Match Details Preview
│   │
│   ├── 9.3 Match Actions
│   │   ├── Continue Scoring (Draft Matches)
│   │   ├── View Details (Completed Matches)
│   │   ├── Edit Match (if Owner)
│   │   └── Delete Match (if Owner, with Confirmation)
│   │
│   └── 9.4 Statistics Summary
│       ├── Total Matches Scored
│       ├── Total Matches Owned
│       └── Average Events per Match
│
├── 10. DATA SYNCHRONIZATION
│   ├── 10.1 Local Storage (Primary)
│   │   ├── localStorage Keys
│   │   │   ├── vscor_current_user
│   │   │   ├── vscor_players
│   │   │   ├── vscor_teams
│   │   │   ├── vscor_master_teams
│   │   │   ├── vscor_tournaments
│   │   │   └── vscor_matches
│   │   │
│   │   ├── CRUD Operations (Local-First)
│   │   ├── Instant Read/Write
│   │   └── No Network Dependency
│   │
│   ├── 10.2 Cloud Sync (Secondary)
│   │   ├── Supabase KV Store Backend
│   │   ├── REST API Endpoints
│   │   ├── Background Sync
│   │   └── Async Operations
│   │
│   ├── 10.3 Sync Triggers
│   │   ├── App Launch
│   │   ├── User Login
│   │   ├── Match Completion (Share Result)
│   │   ├── Profile Edit
│   │   ├── Periodic Sync (Every 5 minutes)
│   │   └── Manual Sync (Pull-to-Refresh)
│   │
│   ├── 10.4 Sync Strategies
│   │   ├── Pull from Cloud (Cloud → Local)
│   │   ├── Push to Cloud (Local → Cloud)
│   │   ├── Bidirectional Sync
│   │   └── Conflict Resolution
│   │       ├── Timestamp-based (Last Write Wins)
│   │       ├── Event Array Merge (Append-only)
│   │       └── User Notification on Conflict
│   │
│   ├── 10.5 Offline Support
│   │   ├── Full Offline Functionality
│   │   ├── Sync Queue Management
│   │   ├── Retry Failed Syncs
│   │   └── Offline Indicator
│   │
│   └── 10.6 Sync Status Indicators
│       ├── 🟢 Synced
│       ├── 🟡 Syncing
│       ├── 🔴 Sync Failed
│       └── ⚪ Offline
│
├── 11. SETTINGS & PREFERENCES
│   ├── 11.1 Account Settings
│   │   ├── View Account Info
│   │   ├── Edit Profile
│   │   ├── Change Password (Future)
│   │   └── Delete Account (Future)
│   │
│   ├── 11.2 Notification Preferences (Future)
│   │   ├── Match Reminders
│   │   ├── Goal Alerts
│   │   └── Tournament Updates
│   │
│   ├── 11.3 App Preferences
│   │   ├── Theme Selection (Future)
│   │   ├── Language Selection (Future)
│   │   └── Data Usage Settings
│   │
│   └── 11.4 Data Management
│       ├── Sync Status
│       ├── Manual Sync
│       ├── Clear Local Cache
│       └── Export Data (Future)
│
└── 12. ADMIN & MODERATION (Future)
    ├── 12.1 Content Moderation
    │   ├── Report Inappropriate Content
    │   ├── Review Reports
    │   └── Take Action (Hide/Delete)
    │
    ├── 12.2 User Management
    │   ├── View All Users
    │   ├── Ban Users
    │   └── Verify Profiles
    │
    └── 12.3 Platform Analytics
        ├── User Growth Metrics
        ├── Feature Usage Statistics
        ├── Match Recording Trends
        └── Tournament Activity
```

---

## Feature Relationships

### Cross-Module Dependencies

**Authentication → All Modules**
- Authentication is required for creating/editing any entity
- User ID links to owned profiles (Player, Team, Tournament, Match)

**Player Management → Team Management**
- Players belong to team rosters
- Player statistics aggregated from team matches

**Team Management → Tournament Management**
- Teams participate in tournaments
- Tournament fixtures reference teams

**Tournament Management → Match Management**
- Matches linked to tournaments
- Match results update tournament standings

**Match Management → Match Scoring System**
- Matches require scorers
- Scoring system updates match events and scores

**Match Scoring System → Player Statistics**
- Events recorded during scoring update player stats
- Goals, assists, cards tracked per player

**Match Scoring System → Team Statistics**
- Match results update team win/loss records
- Goals for/against aggregated

**Match Payments → Match Management**
- Payments linked to specific matches
- Only match owner can configure payments

**Info Tab → All Data Modules**
- Public view of all players, teams, tournaments, matches
- Read-only access for non-owners

**My Matches → Match Management**
- Filtered view of matches owned or scored by user
- Direct access to scoring interface

**Data Sync → All Modules**
- All entities sync between local and cloud
- Conflict resolution affects all data types

---

## Feature Ownership Matrix

| Feature Module | Owner Role | Edit Permission | View Permission |
|----------------|------------|----------------|-----------------|
| User Profile | User (Self) | Owner Only | Owner Only |
| Player Profile | Profile Owner | Owner Only | Public |
| Team | Team Coordinator(s) | Any Coordinator | Public |
| Tournament | Tournament Coordinator(s) | Any Coordinator | Public |
| Match | Match Owner | Owner Only | Public |
| Match Events | Assigned Scorer(s) | Scorer Only | Public |
| Match Payments | Match Owner | Owner Only | Public (Summary) |
| Fixtures | Tournament Coordinator | Coordinator Only | Public (if published) |
| Standings | Auto-calculated | System Only | Public |

---

## Scoring Level Feature Matrix

| Event Type | Basic | Intermediate (Detailed) | Intermediate (All) | Advanced |
|------------|-------|------------------------|-------------------|----------|
| Goal | ✅ | ✅ | ✅ | ✅ |
| Shot On Target | ✅ | ✅ | ✅ | ✅ |
| Shot Off Target | ✅ | ✅ | ✅ | ✅ |
| Foul | ✅ | ✅ | ✅ | ✅ |
| Substitute | ✅ | ✅ | ✅ | ✅ |
| Corner | ✅ | ✅ | ✅ | ✅ |
| Interception | ❌ | ❌ | ✅ | ✅ |
| Offside | ❌ | ❌ | ✅ | ✅ |
| **Attributes** |  |  |  |  |
| Goal Type | ❌ | ✅ | ❌ | ✅ |
| Assist Tracking | ❌ | ✅ | ❌ | ✅ |
| Card Type | Basic | ✅ | Basic | ✅ |
| Penalty Flag | ✅ | ✅ | ✅ | ✅ |
| **Advanced Features** |  |  |  |  |
| Dual Scorers | ❌ | ❌ | ❌ | ✅ |
| Responsibility Division | ❌ | ❌ | ❌ | ✅ |

---

## Priority Feature Tiers

### Tier 1: Core MVP (Implemented ✅)
- Authentication (Email/Password)
- Player, Team, Tournament CRUD
- Match Creation & Squad Selection
- Basic/Intermediate/Advanced Scoring
- Tournament Fixtures & Standings
- Match Payments
- Offline-First Architecture
- Cloud Sync
- Scorer Assignment System
- Auto Date/Time Setting

### Tier 2: Enhanced Experience (Next 3 Months)
- Social Login (Google, Facebook)
- Enhanced Search & Filters
- Export Functionality (PDFs, CSV)
- Photo Gallery (Match Photos)
- Push Notifications
- Data Visualization (Charts)
- Bulk Operations

### Tier 3: Collaboration (Months 4-6)
- Multi-Device Scoring (Real-time)
- Social Features (Follow, Share)
- Comments & Reactions
- Global Leaderboards
- Tournament Templates
- Calendar Integration

### Tier 4: Advanced Analytics (Months 7-9)
- Player Heat Maps
- Team Formation Analysis
- Performance Trends
- Video Integration
- AI Event Detection
- Predictive Modeling

### Tier 5: Ecosystem (Months 10-12)
- League Management
- Federation Integration
- Sponsor Integration
- Premium Features
- Broadcasting Tools
- API for Third Parties

---

**End of Feature Map**
