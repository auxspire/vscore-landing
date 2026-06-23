# VScor - Screen Flow Diagrams

## Table of Contents
1. [Login and Onboarding Flow](#1-login-and-onboarding-flow)
2. [Home Dashboard Flow](#2-home-dashboard-flow)
3. [Info Tab Browsing Flow](#3-info-tab-browsing-flow)
4. [Player Profile Flow](#4-player-profile-flow)
5. [Team Profile Flow](#5-team-profile-flow)
6. [Tournament Management Flow](#6-tournament-management-flow)
7. [Match Creation Flow](#7-match-creation-flow)
8. [Match Scoring Flow](#8-match-scoring-flow)
9. [Match Payments Flow](#9-match-payments-flow)

---

## 1. Login and Onboarding Flow

```
┌─────────────────┐
│  App Launch     │
└────────┬────────┘
         │
         ▼
    ┌─────────┐
    │ Check   │───── Session exists? ────┐
    │ Session │                          │
    └─────────┘                          │
         │                               │
         │ No session                    │ Yes (valid token)
         ▼                               │
┌─────────────────┐                      │
│  Login Screen   │                      │
│                 │                      │
│ - Email input   │                      │
│ - Password input│                      │
│ - Sign In btn   │                      │
│ - Sign Up link  │                      │
└────────┬────────┘                      │
         │                               │
         ├─── Sign Up ───────┐           │
         │                   │           │
         │                   ▼           │
         │          ┌─────────────────┐  │
         │          │ Sign Up Screen  │  │
         │          │                 │  │
         │          │ - Name          │  │
         │          │ - Email         │  │
         │          │ - Password      │  │
         │          │ - Phone (opt)   │  │
         │          │ - Create btn    │  │
         │          └────────┬────────┘  │
         │                   │           │
         │                   │ Success   │
         │ Sign In           │           │
         │  Success          │           │
         ▼                   ▼           │
    ┌─────────────────────────────┐     │
    │  Authentication Success     │◄────┘
    └──────────────┬──────────────┘
                   │
                   ▼
         ┌──────────────────┐
         │ Check Player     │
         │ Profile Exists?  │
         └────────┬─────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
    Yes │                   │ No
        ▼                   ▼
┌──────────────┐    ┌────────────────────┐
│ Home         │    │ Profile Setup      │
│ Dashboard    │    │                    │
└──────────────┘    │ Options:           │
                    │ 1. Create New      │
                    │    Profile         │
                    │ 2. Claim Existing  │
                    │    Profile         │
                    │ 3. Skip            │
                    └─────────┬──────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                 Create              Claim
                    │                   │
                    ▼                   ▼
            ┌──────────────┐    ┌────────────────┐
            │ Create Player│    │ Search Players │
            │ Profile Form │    │ by Name        │
            │              │    │                │
            │ - Name       │    │ - Show         │
            │ - Position   │    │   unclaimed    │
            │ - Jersey #   │    │ - Select &     │
            │ - Photo      │    │   Claim        │
            └──────┬───────┘    └────────┬───────┘
                   │                     │
                   └──────────┬──────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Link Profile to  │
                    │ User Account     │
                    │ (owner_user_id)  │
                    └─────────┬────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Home Dashboard   │
                    └──────────────────┘
```

---

## 2. Home Dashboard Flow

```
┌──────────────────────────────────────┐
│         HOME DASHBOARD               │
│                                      │
│  ┌────────────────────────────────┐ │
│  │  Header                        │ │
│  │  [Logo]  [Sync]  [Profile▼]   │ │
│  └────────────────────────────────┘ │
│                                      │
│  Content Area (varies by active tab)│
│                                      │
│  ┌────────────────────────────────┐ │
│  │  Bottom Tab Navigation         │ │
│  │  [Live Scores] [Scoring] [Info]│ │
│  └────────────────────────────────┘ │
└──────────────────────────────────────┘
         │       │        │
         │       │        └────────────┐
         │       │                     │
         │       └─────────┐           │
         │                 │           │
    Live Scores       Scoring      Info Tab
         │                 │           │
         ▼                 ▼           ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Live Matches │  │ New Match    │  │ Browse       │
│ List         │  │ Button (+)   │  │ Categories   │
│              │  │              │  │              │
│ - Ongoing    │  │ My Matches   │  │ - Tournaments│
│   matches    │  │ List         │  │ - Matches    │
│ - Real-time  │  │              │  │ - Teams      │
│   scores     │  │ - As Owner   │  │ - Players    │
│ - Match      │  │ - As Scorer  │  │              │
│   minute     │  │ - Drafts     │  │ Search bar   │
│              │  │              │  │              │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                  │
       │ Tap match       │ Tap + button    │ Select item
       │                 │                  │
       ▼                 ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Match        │  │ New Match    │  │ Detail View  │
│ Details      │  │ Flow         │  │ (Profile)    │
│ Screen       │  │ (See Flow 7) │  │              │
└──────────────┘  └──────────────┘  └──────────────┘


Profile Menu (from Header)
         │
         ▼
┌──────────────────┐
│ Profile Dropdown │
│                  │
│ - My Profile     │───► View/Edit User Profile
│ - My Matches     │───► My Matches Screen
│ - Settings       │───► Settings Screen
│ - Logout         │───► Logout → Login Screen
└──────────────────┘
```

---

## 3. Info Tab Browsing Flow

```
┌────────────────────────────────────────┐
│          INFO TAB                      │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  Search Bar (Global)             │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  Category Tabs (Horizontal)      │ │
│  │  [Live] [Results] [Players]      │ │
│  │  [Teams] [Tournaments]           │ │
│  └──────────────────────────────────┘ │
└────────────────────────────────────────┘
     │      │       │       │       │
     │      │       │       │       └──────► TOURNAMENTS
     │      │       │       │
     │      │       │       └──────────────► TEAMS
     │      │       │
     │      │       └──────────────────────► PLAYERS
     │      │
     │      └──────────────────────────────► RESULTS
     │
     └─────────────────────────────────────► LIVE SCORES


┌─────────────────────────────────────────────────────┐
│              LIVE SCORES VIEW                       │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │  Active Match Card 1                          │ │
│  │  Team A  [2] - [1]  Team B          65'       │ │
│  │  Last: ⚽ John Doe - Goal                     │ │
│  └───────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────┐ │
│  │  Active Match Card 2                          │ │
│  │  ...                                          │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  [Empty state if no live matches]                  │
└─────────────────────────────────────────────────────┘
                      │
                      │ Tap match card
                      ▼
            ┌──────────────────┐
            │ Match Details    │
            │ Screen           │
            │                  │
            │ - Overview       │
            │ - Event Timeline │
            │ - Statistics     │
            │ - Squads         │
            └──────────────────┘


┌─────────────────────────────────────────────────────┐
│              RESULTS VIEW                           │
│                                                     │
│  Filters: [Tournament ▼] [Team ▼] [Date ▼]        │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │  Match Card 1                                 │ │
│  │  Mar 7, 2026                                  │ │
│  │  Team A  [3] - [2]  Team B                    │ │
│  │  🏆 Spring Cup - Final                        │ │
│  └───────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────┐ │
│  │  Match Card 2                                 │ │
│  │  ...                                          │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                      │
                      │ Tap match card
                      ▼
            ┌──────────────────┐
            │ Match Details    │
            │ Screen           │
            └──────────────────┘


┌─────────────────────────────────────────────────────┐
│              PLAYERS VIEW                           │
│                                                     │
│  Search: [________________]                         │
│  Filter: [Position ▼]                              │
│  Sort: [Most Goals ▼]                              │
│                                                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐           │
│  │ [Photo] │  │ [Photo] │  │ [Photo] │           │
│  │  Name   │  │  Name   │  │  Name   │           │
│  │ Position│  │ Position│  │ Position│           │
│  │ 25 Goals│  │ 18 Goals│  │ 15 Goals│           │
│  └─────────┘  └─────────┘  └─────────┘           │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐           │
│  │  ...    │  │  ...    │  │  ...    │           │
│  └─────────┘  └─────────┘  └─────────┘           │
└─────────────────────────────────────────────────────┘
                      │
                      │ Tap player card
                      ▼
            ┌──────────────────┐
            │ Player Profile   │
            │ Screen           │
            └──────────────────┘


┌─────────────────────────────────────────────────────┐
│              TEAMS VIEW                             │
│                                                     │
│  Search: [________________]                         │
│  Sort: [Most Wins ▼]                               │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │  [Logo]  Team Name 1                          │ │
│  │  20 Matches | 15W 3D 2L | 60 GF 20 GA        │ │
│  └───────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────┐ │
│  │  [Logo]  Team Name 2                          │ │
│  │  ...                                          │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                      │
                      │ Tap team card
                      ▼
            ┌──────────────────┐
            │ Team Profile     │
            │ Screen           │
            └──────────────────┘


┌─────────────────────────────────────────────────────┐
│              TOURNAMENTS VIEW                       │
│                                                     │
│  Filter: [All ▼] [Format ▼]                        │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │  [Logo]  Spring Cup 2026                      │ │
│  │  Round Robin | Mar 1 - Mar 15                 │ │
│  │  16 Teams | 45 Matches | In Progress          │ │
│  └───────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────┐ │
│  │  [Logo]  Summer League                        │ │
│  │  ...                                          │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                      │
                      │ Tap tournament card
                      ▼
            ┌──────────────────┐
            │ Tournament       │
            │ Profile Screen   │
            └──────────────────┘
```

---

## 4. Player Profile Flow

```
┌────────────────────────────────────────┐
│      PLAYER PROFILE SCREEN             │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  Header                          │ │
│  │  [Photo]  Name                   │ │
│  │  Position | Jersey #             │ │
│  │  [Edit] (if owner)               │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  Statistics Section              │ │
│  │  Matches: 25  Goals: 12          │ │
│  │  Assists: 8   Cards: 2           │ │
│  │  ...                             │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  Recent Matches                  │ │
│  │  - Match 1                       │ │
│  │  - Match 2                       │ │
│  │  ...                             │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  Career History                  │ │
│  │  - Teams played for              │ │
│  │  - Tournaments participated      │ │
│  └──────────────────────────────────┘ │
└────────────────────────────────────────┘
              │
              │ (If owner)
              │ Tap Edit button
              ▼
┌────────────────────────────────────────┐
│    EDIT PLAYER PROFILE SCREEN          │
│                                        │
│  Form:                                 │
│  ┌──────────────────────────────────┐ │
│  │ Name: [________________]         │ │
│  │ Email: [________________]        │ │
│  │ Phone: [________________]        │ │
│  │ Position: [Dropdown ▼]           │ │
│  │ Jersey #: [__]                   │ │
│  │ DOB: [Date picker]               │ │
│  │ Height: [___] cm                 │ │
│  │ Weight: [___] kg                 │ │
│  │ Foot: [Left/Right/Both]          │ │
│  │ Photo: [Upload / Camera]         │ │
│  └──────────────────────────────────┘ │
│                                        │
│  [Cancel]  [Save Changes]              │
└────────────────────────────────────────┘
              │
              │ Save
              ▼
    ┌──────────────────┐
    │ Update           │
    │ localStorage     │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Sync to Cloud    │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Show Success     │
    │ Toast            │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Return to        │
    │ Player Profile   │
    │ (View Mode)      │
    └──────────────────┘


CREATE NEW PLAYER FLOW:
┌────────────────────────────────────────┐
│      CREATE PLAYER SCREEN              │
│                                        │
│  [Same form as Edit Player]            │
│                                        │
│  Auto-filled:                          │
│  - owner_user_id = current user        │
│  - created_by = current user           │
│  - created_at = now                    │
│                                        │
│  [Cancel]  [Create Player]             │
└────────────────────────────────────────┘
              │
              │ Create
              ▼
    ┌──────────────────┐
    │ Generate unique  │
    │ player ID        │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Save to          │
    │ localStorage     │
    │ (vscor_players)  │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Sync to Cloud    │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Navigate to      │
    │ Player Profile   │
    │ (View Mode)      │
    └──────────────────┘
```

---

## 5. Team Profile Flow

```
┌────────────────────────────────────────┐
│        TEAM PROFILE SCREEN             │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  Header                          │ │
│  │  [Logo]  Team Name               │ │
│  │  Coach: Name | Venue: Location   │ │
│  │  [Edit] (if coordinator)         │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  Tabs                            │ │
│  │  [Overview][Squad][Stats][History]│ │
│  └──────────────────────────────────┘ │
│                                        │
│  Content (varies by active tab)        │
└────────────────────────────────────────┘
         │        │        │        │
         │        │        │        └──► History Tab
         │        │        │
         │        │        └───────────► Stats Tab
         │        │
         │        └────────────────────► Squad Tab
         │
         └─────────────────────────────► Overview Tab


OVERVIEW TAB:
┌────────────────────────────────────────┐
│  Team Description                      │
│  Foundation Year: 2020                 │
│                                        │
│  Quick Stats:                          │
│  - Matches: 30                         │
│  - Win Rate: 65%                       │
│  - Goals For: 85                       │
│  - Goals Against: 40                   │
│                                        │
│  Recent Form: W W D L W                │
└────────────────────────────────────────┘


SQUAD TAB:
┌────────────────────────────────────────┐
│  [Add Player] (if coordinator)         │
│                                        │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐│
│  │ [Photo] │  │ [Photo] │  │ [Photo] ││
│  │  Name   │  │  Name   │  │  Name   ││
│  │ Position│  │ Position│  │ Position││
│  │ Jersey #│  │ Jersey #│  │ Jersey #││
│  │ [Remove]│  │ [Remove]│  │ [Remove]││
│  └─────────┘  └─────────┘  └─────────┘│
│                                        │
│  (Tap player to view profile)          │
│  (Tap Remove to remove from roster)    │
└────────────────────────────────────────┘
         │
         │ (If coordinator)
         │ Tap Add Player
         ▼
┌────────────────────────────────────────┐
│      ADD PLAYER TO TEAM MODAL          │
│                                        │
│  Search Existing Players:              │
│  [__________________________]          │
│                                        │
│  Results:                              │
│  ○ Player 1 - Forward                  │
│  ○ Player 2 - Midfielder               │
│  ○ Player 3 - Defender                 │
│                                        │
│  OR                                    │
│                                        │
│  [Create New Player]                   │
│                                        │
│  [Cancel]  [Add Selected]              │
└────────────────────────────────────────┘
         │
         │ Add Selected
         ▼
┌────────────────────────────────────────┐
│  Assign Additional Details             │
│                                        │
│  Position: [Dropdown ▼]                │
│  Jersey Number: [__]                   │
│                                        │
│  [Confirm]                             │
└────────────────────────────────────────┘
         │
         │ Confirm
         ▼
    Update team.players[]
         │
         ▼
    Save to localStorage
         │
         ▼
    Sync to cloud
         │
         ▼
    Refresh Squad Tab


STATS TAB:
┌────────────────────────────────────────┐
│  Overall Statistics:                   │
│  - Matches Played: 30                  │
│  - Wins: 20                            │
│  - Draws: 5                            │
│  - Losses: 5                           │
│  - Goals For: 85                       │
│  - Goals Against: 40                   │
│  - Goal Difference: +45                │
│                                        │
│  [Charts/Graphs - Future]              │
└────────────────────────────────────────┘


HISTORY TAB:
┌────────────────────────────────────────┐
│  Recent Matches:                       │
│  ┌────────────────────────────────────┐│
│  │ Mar 7 | vs Team B | W 3-2          ││
│  │ Mar 5 | vs Team C | D 1-1          ││
│  │ ...                                ││
│  └────────────────────────────────────┘│
│                                        │
│  Tournament History:                   │
│  ┌────────────────────────────────────┐│
│  │ Spring Cup 2026 - Winners          ││
│  │ Winter League 2025 - 2nd Place     ││
│  │ ...                                ││
│  └────────────────────────────────────┘│
└────────────────────────────────────────┘


EDIT TEAM (If Coordinator):
         │ Tap Edit button
         ▼
┌────────────────────────────────────────┐
│      EDIT TEAM SCREEN                  │
│                                        │
│  Form:                                 │
│  ┌──────────────────────────────────┐ │
│  │ Team Name: [________________]    │ │
│  │ Coach: [________________]        │ │
│  │ Home Venue: [________________]   │ │
│  │ Description:                     │ │
│  │ [_____________________________]  │ │
│  │ [_____________________________]  │ │
│  │ Logo: [Upload / Camera]          │ │
│  │ Founded: [____] Year             │ │
│  └──────────────────────────────────┘ │
│                                        │
│  [Cancel]  [Save Changes]              │
└────────────────────────────────────────┘
              │
              │ Save
              ▼
    Update team in localStorage
              │
              ▼
    Sync to cloud
              │
              ▼
    Return to Team Profile
```

---

## 6. Tournament Management Flow

```
┌────────────────────────────────────────┐
│   TOURNAMENT PROFILE SCREEN            │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  Header                          │ │
│  │  [Logo]  Tournament Name         │ │
│  │  Format | Date Range             │ │
│  │  [Edit] (if coordinator)         │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  Tabs                            │ │
│  │  [Overview][Teams][Fixtures]     │ │
│  │  [Standings][Matches]            │ │
│  └──────────────────────────────────┘ │
│                                        │
│  Content (varies by active tab)        │
└────────────────────────────────────────┘


CREATE TOURNAMENT FLOW:
┌────────────────────────────────────────┐
│    CREATE TOURNAMENT - Step 1          │
│    Basic Details                       │
│                                        │
│  Tournament Name: [________________]   │
│  Description:                          │
│  [_______________________________]     │
│  Start Date: [Date picker]             │
│  End Date: [Date picker]               │
│  Venue: [________________]             │
│  Logo: [Upload]                        │
│                                        │
│  [Cancel]  [Next]                      │
└────────────────────────────────────────┘
              │
              │ Next
              ▼
┌────────────────────────────────────────┐
│    CREATE TOURNAMENT - Step 2          │
│    Format Selection                    │
│                                        │
│  Select Format:                        │
│  ○ Knockout                            │
│  ○ Round Robin                         │
│  ○ Groups + Knockout                   │
│                                        │
│  [Back]  [Next]                        │
└────────────────────────────────────────┘
              │
              │ Next
              ▼
┌────────────────────────────────────────┐
│    CREATE TOURNAMENT - Step 3          │
│    Match Configuration                 │
│                                        │
│  Match Duration: [__] minutes          │
│  Players per Team: [__]                │
│                                        │
│  Points System:                        │
│  Win: [3]  Draw: [1]  Loss: [0]       │
│                                        │
│  [Back]  [Next]                        │
└────────────────────────────────────────┘
              │
              │ Next (if Groups format)
              ▼
┌────────────────────────────────────────┐
│    CREATE TOURNAMENT - Step 4          │
│    Group Configuration                 │
│    (Only for Groups + Knockout)        │
│                                        │
│  Number of Groups: [__]                │
│  Teams per Group: [__]                 │
│  Teams Advancing: [__]                 │
│                                        │
│  [Back]  [Create Tournament]           │
└────────────────────────────────────────┘
              │
              │ Create
              ▼
    Save to localStorage
              │
              ▼
    Sync to cloud
              │
              ▼
    Navigate to Tournament Profile


TEAMS TAB:
┌────────────────────────────────────────┐
│  [Add Team] (if coordinator)           │
│                                        │
│  Participating Teams:                  │
│  ┌────────────────────────────────────┐│
│  │ [Logo] Team 1 Name    [Remove]     ││
│  │ [Logo] Team 2 Name    [Remove]     ││
│  │ [Logo] Team 3 Name    [Remove]     ││
│  │ ...                                ││
│  └────────────────────────────────────┘│
│                                        │
│  Total: 16 teams                       │
└────────────────────────────────────────┘
         │
         │ (If coordinator)
         │ Tap Add Team
         ▼
┌────────────────────────────────────────┐
│      ADD TEAM TO TOURNAMENT            │
│                                        │
│  Search Existing Teams:                │
│  [__________________________]          │
│                                        │
│  Results:                              │
│  ○ Team A                              │
│  ○ Team B                              │
│  ○ Team C                              │
│                                        │
│  OR                                    │
│                                        │
│  [Create New Team]                     │
│                                        │
│  [Cancel]  [Add Selected]              │
└────────────────────────────────────────┘
         │
         │ Add Selected
         ▼
    Update tournament.participatingTeams[]
         │
         ▼
    Save & Sync
         │
         ▼
    Refresh Teams Tab


FIXTURES TAB:
┌────────────────────────────────────────┐
│  [Generate Fixtures] (if not generated)│
│  [Regenerate] [Publish] (if coordinator)│
│                                        │
│  Group Stage:                          │
│  Group A:                              │
│  ┌────────────────────────────────────┐│
│  │ Match 1: Team A vs Team B          ││
│  │ Date: Mar 10 | Time: 10:00 | Venue││
│  │ Status: Scheduled                  ││
│  ├────────────────────────────────────┤│
│  │ Match 2: Team C vs Team D          ││
│  │ ...                                ││
│  └────────────────────────────────────┘│
│                                        │
│  Group B:                              │
│  ┌────────────────────────────────────┐│
│  │ ...                                ││
│  └────────────────────────────────────┘│
│                                        │
│  Knockout Stage:                       │
│  Quarter Finals:                       │
│  ┌────────────────────────────────────┐│
│  │ Winner A1 vs Winner B2             ││
│  │ TBD vs TBD                         ││
│  └────────────────────────────────────┘│
└────────────────────────────────────────┘
         │
         │ Tap Generate Fixtures
         ▼
┌────────────────────────────────────────┐
│  FIXTURE GENERATION CONFIRMATION       │
│                                        │
│  This will generate fixtures based on  │
│  tournament format and teams.          │
│                                        │
│  Total fixtures to generate: 45        │
│                                        │
│  [Cancel]  [Generate]                  │
└────────────────────────────────────────┘
         │
         │ Generate
         ▼
    Run fixture generation algorithm
    (based on format)
         │
         ▼
    Save fixtures to tournament
         │
         ▼
    Sync to cloud
         │
         ▼
    Refresh Fixtures Tab


STANDINGS TAB:
┌────────────────────────────────────────┐
│  Overall Standings:                    │
│                                        │
│  Pos | Team    | P | W | D | L | GD | Pts│
│  ─────────────────────────────────────│
│   1  | Team A  |10 | 8 | 1 | 1 |+15| 25│
│   2  | Team B  |10 | 7 | 2 | 1 |+12| 23│
│   3  | Team C  |10 | 6 | 2 | 2 | +8| 20│
│  ...                                   │
│                                        │
│  (Auto-calculated after each match)    │
└────────────────────────────────────────┘


MATCHES TAB:
┌────────────────────────────────────────┐
│  Completed Matches:                    │
│  ┌────────────────────────────────────┐│
│  │ Mar 7 | Team A [3] - [2] Team B    ││
│  │ Mar 6 | Team C [1] - [1] Team D    ││
│  │ ...                                ││
│  └────────────────────────────────────┘│
│                                        │
│  (Tap match to view details)           │
└────────────────────────────────────────┘
```

---

## 7. Match Creation Flow

```
┌────────────────────────────────────────┐
│      NEW MATCH - Step 1                │
│      Tournament Selection              │
│                                        │
│  Select Tournament:                    │
│  ○ Friendly Match                      │
│  ○ Spring Cup 2026                     │
│  ○ Summer League                       │
│  ○ ...                                 │
│                                        │
│  If tournament selected:               │
│  Tournament Stage: [Dropdown ▼]        │
│  - Group Stage                         │
│  - Quarter Final                       │
│  - Semi Final                          │
│  - Final                               │
│                                        │
│  [Cancel]  [Next]                      │
└────────────────────────────────────────┘
              │
              │ Next
              ▼
┌────────────────────────────────────────┐
│      NEW MATCH - Step 2                │
│      Team Selection                    │
│                                        │
│  Team 1: [Search/Select Team ▼]       │
│  (If tournament: show participating    │
│   teams only)                          │
│                                        │
│  Team 2: [Search/Select Team ▼]       │
│  (Validation: Cannot be same as Team 1)│
│                                        │
│  [Add New Team] (if friendly)          │
│                                        │
│  [Back]  [Next]                        │
└────────────────────────────────────────┘
              │
              │ Next
              ▼
┌────────────────────────────────────────┐
│      NEW MATCH - Step 3                │
│      Match Configuration               │
│                                        │
│  Match Format:                         │
│  ○ Single (continuous)                 │
│  ○ Two Halves                          │
│                                        │
│  Duration: [__] minutes (5-90)         │
│  (Pre-filled from tournament if        │
│   tournament selected)                 │
│                                        │
│  Venue: [________________]             │
│                                        │
│  Players per Team: [__] (1-11)         │
│  (Pre-filled from tournament)          │
│                                        │
│  [Back]  [Next]                        │
└────────────────────────────────────────┘
              │
              │ Next
              ▼
┌────────────────────────────────────────┐
│      NEW MATCH - Step 4                │
│      Scoring Level Selection           │
│                                        │
│  Select Scoring Level:                 │
│                                        │
│  ○ Basic                               │
│    Simple events only                  │
│    Fast recording (1-2 sec)            │
│                                        │
│  ○ Intermediate (Detailed)             │
│    Basic events + detailed attributes  │
│    Goal types, assists (3-4 sec)       │
│                                        │
│  ○ Intermediate (All Events)           │
│    All events, basic attributes        │
│    Includes interceptions, offsides    │
│                                        │
│  ○ Advanced                            │
│    All events + full attributes        │
│    Supports dual scorers               │
│                                        │
│  [Back]  [Next]                        │
└────────────────────────────────────────┘
              │
              │ Next
              ▼
┌────────────────────────────────────────┐
│      NEW MATCH - Step 5                │
│      Scorer Assignment                 │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  PRIMARY SCORER (Required)       │ │
│  │                                  │ │
│  │  Search User: [______________]   │ │
│  │  (Defaults to current user)      │ │
│  │                                  │ │
│  │  Selected:                       │ │
│  │  [Avatar] John Doe               │ │
│  │  john@email.com | Primary Scorer │ │
│  │  [X Remove]                      │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  SECOND SCORER (Optional)        │ │
│  │  (Only if Advanced mode)         │ │
│  │                                  │ │
│  │  Search User: [______________]   │ │
│  │  (Must differ from primary)      │ │
│  │                                  │ │
│  │  Selected:                       │ │
│  │  [Avatar] Jane Smith             │ │
│  │  jane@email.com | Secondary      │ │
│  │  [X Remove]                      │ │
│  └──────────────────────────────────┘ │
│                                        │
│  [Back]  [Next]                        │
└────────────────────────────────────────┘
              │
              │ Next (if dual-scorer)
              ▼
┌────────────────────────────────────────┐
│      NEW MATCH - Step 6                │
│      Responsibility Division           │
│      (Only if two scorers assigned)    │
│                                        │
│  How should scoring be divided?        │
│                                        │
│  ○ Divide by Teams                     │
│    Each scorer records ALL events      │
│    for one team                        │
│                                        │
│    Team 1 → [Scorer Dropdown ▼]       │
│    Team 2 → [Scorer Dropdown ▼]       │
│                                        │
│  ○ Divide by Event Types               │
│    Split event types between scorers   │
│                                        │
│    Primary: Goals, Shots, Fouls        │
│    Secondary: Interceptions, Offsides, │
│                Substitutions, Corners  │
│                                        │
│  [Back]  [Create Match]                │
└────────────────────────────────────────┘
              │
              │ Create Match
              ▼
    ┌──────────────────┐
    │ Validate all     │
    │ required fields  │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Create match     │
    │ object with:     │
    │ - Match config   │
    │ - Scorers        │
    │ - Responsibility │
    │ - owner_user_id  │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Save to          │
    │ localStorage     │
    │ (vscor_matches)  │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Navigate to      │
    │ SQUAD SELECTION  │
    └──────────────────┘
```

---

## 8. Match Scoring Flow

```
SQUAD SELECTION SCREEN:
┌────────────────────────────────────────┐
│      SELECT SQUAD                      │
│                                        │
│  Team 1: Arsenal FC                    │
│  ┌──────────────────────────────────┐ │
│  │ Search: [____________]           │ │
│  │                                  │ │
│  │ ☑ Player 1 - Forward - #9        │ │
│  │ ☑ Player 2 - Midfielder - #10    │ │
│  │ ☐ Player 3 - Defender - #5       │ │
│  │ ☑ Player 4 - Goalkeeper - #1     │ │
│  │ ...                              │ │
│  │                                  │ │
│  │ Selected: 5 / 7                  │ │
│  └──────────────────────────────────┘ │
│                                        │
│  Team 2: Chelsea FC                    │
│  ┌──────────────────────────────────┐ │
│  │ (Same structure as Team 1)       │ │
│  └──────────────────────────────────┘ │
│                                        │
│  [Add New Player]                      │
│                                        │
│  [Back]  [Start Match]                 │
│  (Enabled when min 1 player per team)  │
└────────────────────────────────────────┘
              │
              │ Start Match
              ▼
    ┌──────────────────┐
    │ Update match:    │
    │ - squad1[]       │
    │ - squad2[]       │
    │ - status = live  │
    │ - matchDate = now│
    │ - matchTime = now│
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Save to          │
    │ localStorage     │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Navigate to      │
    │ LIVE SCORING     │
    └──────────────────┘


LIVE SCORING SCREEN:
┌────────────────────────────────────────┐
│      LIVE SCORING                      │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  Arsenal FC  [2] - [1]  Chelsea  │ │
│  │         Timer: 45:23             │ │
│  │  [Pause] [End Match ▼]           │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  Team Tabs                       │ │
│  │  [Arsenal FC] | [Chelsea FC]     │ │
│  │  (Active: Arsenal)               │ │
│  └──────────────────────────────────┘ │
│                                        │
│  Squad Grid (Arsenal):                 │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐         │
│  │ 9  │ │ 10 │ │ 7  │ │ 11 │         │
│  │John│ │Mike│ │Sam │ │Tom │         │
│  └────┘ └────┘ └────┘ └────┘         │
│  ┌────┐ ┌────┐ ┌────┐                │
│  │ 5  │ │ 3  │ │ 1  │                │
│  │Dave│ │Paul│ │GK  │                │
│  └────┘ └────┘ └────┘                │
│  (Grayed if substituted out)           │
│                                        │
│  Event Buttons:                        │
│  ┌──────────┬──────────┐              │
│  │ ⚽ Goal   │🎯 Shot On│              │
│  ├──────────┼──────────┤              │
│  │❌ Shot Off│🚫 Foul   │              │
│  ├──────────┼──────────┤              │
│  │🔄 Sub     │⚪ Corner │              │
│  └──────────┴──────────┘              │
│  (More events based on scoring level)  │
│  (Disabled events shown grayed if      │
│   event-based division)                │
│                                        │
│  [Event Timeline ▼] (bottom sheet)     │
└────────────────────────────────────────┘


EVENT RECORDING FLOW (Basic):
    User taps player card (e.g., #9 John)
              │
              ▼
    ┌──────────────────┐
    │ Player selected  │
    │ (blue border)    │
    └────────┬─────────┘
             │
             │ User taps "⚽ Goal"
             ▼
    ┌──────────────────┐
    │ Record event:    │
    │ - type: goal     │
    │ - team: team1    │
    │ - player: John   │
    │ - minute: 45     │
    │ - timestamp: now │
    │ - recorded_by:   │
    │   current_user   │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Add to           │
    │ match.events[]   │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Increment        │
    │ scoreA++         │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Save match to    │
    │ localStorage     │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Sync to cloud    │
    │ (background)     │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Show success     │
    │ animation        │
    │ Update UI        │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Event appears in │
    │ timeline         │
    └──────────────────┘


EVENT RECORDING FLOW (Detailed):
    User taps player, then "⚽ Goal"
              │
              ▼
┌────────────────────────────────────────┐
│      GOAL DETAILS MODAL                │
│                                        │
│  Player: John (#9)                     │
│                                        │
│  Goal Type:                            │
│  ○ Open Play                           │
│  ○ Penalty                             │
│  ○ Free Kick                           │
│  ○ Header                              │
│  ○ Own Goal                            │
│                                        │
│  Assisted By: [Player Dropdown ▼]      │
│  (Optional)                            │
│                                        │
│  Notes: [___________________]          │
│  (Optional)                            │
│                                        │
│  [Cancel]  [Record Goal]               │
└────────────────────────────────────────┘
              │
              │ Record Goal
              ▼
    (Same flow as Basic, but with
     additional details stored)


SUBSTITUTION FLOW:
    User taps "🔄 Sub" button
              │
              ▼
┌────────────────────────────────────────┐
│      SUBSTITUTION MODAL                │
│                                        │
│  Player Out: [Dropdown ▼]              │
│  (Only shows players currently on field)│
│  Selected: John (#9)                   │
│                                        │
│  Player In: [Dropdown ▼]               │
│  (Only shows substitute players)       │
│  Selected: Alex (#14)                  │
│                                        │
│  [Cancel]  [Record Substitution]       │
└────────────────────────────────────────┘
              │
              │ Record
              ▼
    ┌──────────────────┐
    │ Record sub event │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Update squad:    │
    │ John: status =   │
    │   substituted-out│
    │ Alex: status =   │
    │   starting       │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Save & Refresh   │
    │ Squad Grid       │
    │ (John grayed)    │
    └──────────────────┘


EVENT TIMELINE (Bottom Sheet):
┌────────────────────────────────────────┐
│  [▼] Event Timeline                    │
│                                        │
│  ┌────────────────────────────────────┐│
│  │ 45' ⚽ John (#9) - Goal             ││
│  │     Assist: Mike (#10)             ││
│  │     [Edit] [Delete]                ││
│  ├────────────────────────────────────┤│
│  │ 43' 🎯 Sam (#7) - Shot on Target   ││
│  │     [Edit] [Delete]                ││
│  ├────────────────────────────────────┤│
│  │ 40' 🔄 Substitution                ││
│  │     Out: John (#9) In: Alex (#14)  ││
│  │     [Edit] [Delete]                ││
│  └────────────────────────────────────┘│
│                                        │
│  [Expand to Full Screen]               │
└────────────────────────────────────────┘


END MATCH FLOW:
    User taps "End Match"
              │
              ▼
┌────────────────────────────────────────┐
│      END MATCH CONFIRMATION            │
│                                        │
│  Are you sure you want to end the      │
│  match?                                │
│                                        │
│  Final Score:                          │
│  Arsenal FC [2] - [1] Chelsea FC       │
│                                        │
│  [Cancel]  [End Match]                 │
└────────────────────────────────────────┘
              │
              │ End Match
              ▼
    ┌──────────────────┐
    │ Set:             │
    │ - status =       │
    │   completed      │
    │ - endTime = now  │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Save to          │
    │ localStorage     │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Navigate to      │
    │ MATCH SUMMARY    │
    └──────────────────┘


MATCH SUMMARY SCREEN:
┌────────────────────────────────────────┐
│      MATCH SUMMARY                     │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  Arsenal FC [2] - [1] Chelsea FC │ │
│  │  March 8, 2026 | 45 min          │ │
│  └──────────────────────────────────┘ │
│                                        │
│  Match Statistics:                     │
│  Arsenal    |    Chelsea               │
│  2 Goals    |    1 Goal                │
│  10 Shots   |    7 Shots               │
│  3 Fouls    |    5 Fouls               │
│  ...                                   │
│                                        │
│  Top Performers:                       │
│  - John (Arsenal) - 1 Goal, 1 Assist   │
│  - Mike (Chelsea) - 1 Goal             │
│                                        │
│  Event Timeline:                       │
│  [View Full Timeline]                  │
│                                        │
│  Actions:                              │
│  [Share Match Result] (Primary)        │
│  [Calculate Payment]                   │
│  [View Full Details]                   │
│  [Edit Match]                          │
└────────────────────────────────────────┘
              │
              │ Share Match Result
              ▼
    ┌──────────────────┐
    │ Sync to cloud    │
    │ Update standings │
    │ (if tournament)  │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Show success     │
    │ "Match result    │
    │  shared!"        │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Navigate to      │
    │ Match Details    │
    │ (Public view)    │
    └──────────────────┘
```

---

## 9. Match Payments Flow

```
ACCESS POINT:
    From Match Summary or Match Details
              │
              │ Tap "Calculate Payment"
              ▼
┌────────────────────────────────────────┐
│      CALCULATE PAYMENT SCREEN          │
│                                        │
│  Match: Arsenal vs Chelsea             │
│  Date: Mar 8, 2026                     │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  Configuration                   │ │
│  │                                  │ │
│  │  Per Player Amount: [₹___]       │ │
│  │  (e.g., ₹100, $10)               │ │
│  │                                  │ │
│  │  Treasurer: [Search User ▼]     │ │
│  │  (Defaults to match creator)     │ │
│  │  Selected: [Avatar] John Doe     │ │
│  └──────────────────────────────────┘ │
│                                        │
│  [Calculate]                           │
└────────────────────────────────────────┘
              │
              │ Calculate
              ▼
    ┌──────────────────┐
    │ Generate payment │
    │ list for all     │
    │ players in       │
    │ squad1 + squad2  │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Save to match:   │
    │ - paymentPerPlayer│
    │ - treasurer      │
    │ - playerPayments[]│
    └────────┬─────────┘
             │
             ▼
┌────────────────────────────────────────┐
│      CALCULATE PAYMENT SCREEN          │
│      (After Calculation)               │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  Summary                         │ │
│  │  Total: ₹1400 | Paid: ₹600       │ │
│  │  Pending: ₹800                   │ │
│  │  Treasurer: John Doe             │ │
│  └──────────────────────────────────┘ │
│                                        │
│  Team 1 (Arsenal):                     │
│  ┌──────────────────────────────────┐ │
│  │ John | Arsenal | ₹100 | ✅ Paid  │ │
│  │ [💰 Mark Paid] [↩️ Unpaid]      │ │
│  ├──────────────────────────────────┤ │
│  │ Mike | Arsenal | ₹100 | ⏳ Pending│ │
│  │ [💰 Mark Paid] [↩️ Unpaid]      │ │
│  ├──────────────────────────────────┤ │
│  │ Sam  | Arsenal | ₹100 | ⏳ Pending│ │
│  │ ...                              │ │
│  └──────────────────────────────────┘ │
│                                        │
│  Team 2 (Chelsea):                     │
│  ┌──────────────────────────────────┐ │
│  │ (Same structure)                 │ │
│  └──────────────────────────────────┘ │
│                                        │
│  (Auto-saves on status change)         │
└────────────────────────────────────────┘
              │
              │ Tap "💰 Mark Paid" for a player
              ▼
    ┌──────────────────┐
    │ Update player:   │
    │ - paid = true    │
    │ - paidAt = now   │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Save to          │
    │ localStorage     │
    │ (Auto-save)      │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Sync to cloud    │
    │ (Background)     │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Update summary   │
    │ counts:          │
    │ Paid ↑           │
    │ Pending ↓        │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Update Match     │
    │ Payments screen  │
    │ (if open)        │
    └──────────────────┘


MATCH PAYMENTS TAB:
┌────────────────────────────────────────┐
│      MATCH PAYMENTS                    │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  Tabs                            │ │
│  │  [Upcoming][Pending][Completed]  │ │
│  └──────────────────────────────────┘ │
│                                        │
│  PENDING TAB:                          │
│  ┌──────────────────────────────────┐ │
│  │  Match Card 1                    │ │
│  │  Arsenal vs Chelsea              │ │
│  │  Mar 8, 2026 | Venue             │ │
│  │                                  │ │
│  │  ₹100 per player                 │ │
│  │  Received: ₹600 / ₹1400 (43%)    │ │
│  │  [████░░░░░░] Progress bar       │ │
│  │  6 paid | 8 pending              │ │
│  │                                  │ │
│  │  [View Details]                  │ │
│  └──────────────────────────────────┘ │
│  ┌──────────────────────────────────┐ │
│  │  Match Card 2                    │ │
│  │  ...                             │ │
│  └──────────────────────────────────┘ │
└────────────────────────────────────────┘
              │
              │ Tap "View Details"
              ▼
    Navigate to Calculate Payment Screen
    for that match (read-only if not owner)


WORKFLOW SUMMARY:
1. Match completed
2. Owner taps "Calculate Payment"
3. Set amount & treasurer
4. System calculates total
5. Display player payment list
6. Owner marks payments as received (💰 button)
7. Auto-save to localStorage
8. Sync to cloud in background
9. Summary counts update in real-time
10. Match Payments tab reflects current status
```

---

## Screen Navigation Summary

```
App Entry Point
    │
    ├─ Not Authenticated ──► Login Screen
    │                           │
    │                           ├─ Sign In ──► Home Dashboard
    │                           │
    │                           └─ Sign Up ──► Sign Up Screen
    │                                            │
    │                                            └──► Profile Setup ──► Home Dashboard
    │
    └─ Authenticated ──► Home Dashboard
                           │
                           ├─ Live Scores Tab
                           │     └─ Match Card ──► Match Details
                           │
                           ├─ Scoring Tab
                           │     ├─ New Match (+) ──► Match Creation Flow
                           │     │                      │
                           │     │                      └──► Squad Selection
                           │     │                              │
                           │     │                              └──► Live Scoring
                           │     │                                      │
                           │     │                                      └──► Match Summary
                           │     │
                           │     └─ My Matches ──► Match List ──► Match Details
                           │
                           ├─ Info Tab
                           │     ├─ Live Scores ──► Match Details
                           │     ├─ Results ──► Match Details
                           │     ├─ Players ──► Player Profile
                           │     ├─ Teams ──► Team Profile
                           │     └─ Tournaments ──► Tournament Profile
                           │
                           └─ Profile Menu
                                 ├─ My Profile ──► User Profile ──► Edit Profile
                                 ├─ My Matches ──► My Matches Screen
                                 ├─ Settings ──► Settings Screen
                                 └─ Logout ──► Login Screen
```

---

**End of Screen Flow Diagrams**
