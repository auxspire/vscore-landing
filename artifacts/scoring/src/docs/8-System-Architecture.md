# VScor - Complete System Architecture

## Overview

This document provides comprehensive system architecture diagrams for VScor, illustrating all layers, components, and data flows.

**Architecture Pattern**: Offline-First Progressive Web Application with Cloud Sync

---

## Table of Contents
1. [High-Level Architecture](#1-high-level-architecture)
2. [Layer-by-Layer Architecture](#2-layer-by-layer-architecture)
3. [Data Flow Diagrams](#3-data-flow-diagrams)
4. [Authentication Flow](#4-authentication-flow)
5. [Match Event Recording Flow](#5-match-event-recording-flow)
6. [Synchronization Architecture](#6-synchronization-architecture)
7. [Deployment Architecture](#7-deployment-architecture)

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         VScor System Architecture                   │
└─────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                 │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │              React PWA (Mobile-First)                           │ │
│  │                                                                 │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │ │
│  │  │  Login   │  │ Player   │  │  Team    │  │Tournament│      │ │
│  │  │          │  │ Profiles │  │ Profiles │  │   Mgmt   │      │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │ │
│  │                                                                 │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │ │
│  │  │  Match   │  │  Scoring │  │   Info   │  │ Payments │      │ │
│  │  │ Creation │  │Interface │  │   Tab    │  │          │      │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────┐
│                      STATE & DATA LAYER                               │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    React State Management                       │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │ │
│  │  │   Auth State │  │  Match State │  │  Sync State  │         │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘         │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │              localStorage (Offline-First Storage)               │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │ │
│  │  │  Users   │  │ Players  │  │  Teams   │  │Tournament│       │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                     │ │
│  │  │ Matches  │  │  Events  │  │   Sync   │                     │ │
│  │  │          │  │          │  │  Queue   │                     │ │
│  │  └──────────┘  └──────────┘  └──────────┘                     │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────┐
│                         SYNC LAYER                                    │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │              Bidirectional Synchronization Engine               │ │
│  │                                                                 │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │ │
│  │  │   Conflict   │  │    Retry     │  │   Queue      │         │ │
│  │  │  Resolution  │  │    Logic     │  │ Management   │         │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘         │ │
│  │                                                                 │ │
│  │  ┌──────────────────────────────────────────────┐              │ │
│  │  │  Sync Triggers:                              │              │ │
│  │  │  • App Launch                                │              │ │
│  │  │  • User Login                                │              │ │
│  │  │  • Match Completion (Share Result)           │              │ │
│  │  │  • Periodic (Every 5 min if online)          │              │ │
│  │  │  • Manual (Pull-to-Refresh)                  │              │ │
│  │  └──────────────────────────────────────────────┘              │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────┐
│                      BACKEND SERVICES LAYER                           │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │          Supabase Edge Functions (Hono Web Server)              │ │
│  │                                                                 │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │ │
│  │  │    Auth      │  │    User      │  │  Tournament  │         │ │
│  │  │   Service    │  │  Management  │  │   Service    │         │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘         │ │
│  │                                                                 │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │ │
│  │  │    Match     │  │    Event     │  │   Standings  │         │ │
│  │  │   Service    │  │   Logging    │  │ Calculation  │         │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘         │ │
│  │                                                                 │ │
│  │  API Endpoints: /functions/v1/make-server-845a157a/*           │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────┐
│                        DATABASE LAYER                                 │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │              Supabase PostgreSQL Database                       │ │
│  │                                                                 │ │
│  │  ┌──────────────────────────────────────────────┐              │ │
│  │  │      kv_store_845a157a (KV Store Table)      │              │ │
│  │  │                                              │              │ │
│  │  │  Key Pattern: {entity_type}_{entity_id}     │              │ │
│  │  │  Value: JSONB (complete entity data)        │              │ │
│  │  └──────────────────────────────────────────────┘              │ │
│  │                                                                 │ │
│  │  Stored Entities:                                               │ │
│  │  • user_{user_id}                                               │ │
│  │  • player_{player_id}                                           │ │
│  │  • team_{team_id}                                               │ │
│  │  • tournament_{tournament_id}                                   │ │
│  │  • match_{match_id}                                             │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES LAYER                          │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                                                                 │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │ │
│  │  │   Supabase   │  │   Supabase   │  │    Future:   │         │ │
│  │  │     Auth     │  │   Storage    │  │   Google     │         │ │
│  │  │ (Email/Pass) │  │ (File Upload)│  │    OAuth     │         │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘         │ │
│  │                                                                 │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 2. Layer-by-Layer Architecture

### 2.1 Client Layer (Presentation)

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                         │
│              (React 18 + Tailwind CSS v4)               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Application Shell (App.tsx)                            │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Global State:                                    │  │
│  │  • currentUser                                    │  │
│  │  • playerDatabase                                 │  │
│  │  • registeredTeams                                │  │
│  │  • tournaments                                    │  │
│  │  • matches                                        │  │
│  │  • syncState                                      │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Layout    │  │ Navigation  │  │  Routing    │
│ Components  │  │   System    │  │   Logic     │
│             │  │             │  │             │
│ • Header    │  │ • Bottom    │  │ • View      │
│ • Footer    │  │   Tabs      │  │   State     │
│ • Modals    │  │ • Deep Link │  │ • History   │
└─────────────┘  └─────────────┘  └─────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│Authentication│  │   Match     │  │ Tournament  │
│   Module    │  │  Scoring    │  │   Module    │
│             │  │   Module    │  │             │
│ • Login     │  │ • Live      │  │ • Create    │
│ • Sign Up   │  │   Scoring   │  │ • Fixtures  │
│ • Profile   │  │ • Events    │  │ • Standings │
│   Setup     │  │ • Payment   │  │             │
└─────────────┘  └─────────────┘  └─────────────┘
        │               │               │
        ▼               ▼               ▼
┌─────────────────────────────────────────────┐
│          Shared UI Components               │
│                                             │
│  • Button, Input, Select, Modal             │
│  • Card, Badge, Avatar, Tabs                │
│  • EventButton, SquadGrid, StandingsTable   │
│  • UserAutocomplete, TeamAutocomplete       │
└─────────────────────────────────────────────┘
```

### 2.2 State & Data Layer

```
┌──────────────────────────────────────────────────────────┐
│               STATE & DATA LAYER                         │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  React State (In-Memory)                                 │
│  ┌────────────────────────────────────────────────────┐  │
│  │  useState / useReducer Hooks                       │  │
│  │                                                    │  │
│  │  Component State:                                  │  │
│  │  • UI state (modals, dropdowns, tabs)             │  │
│  │  • Form inputs (controlled components)            │  │
│  │  • Selection state (selected player, team)        │  │
│  │                                                    │  │
│  │  Global State:                                     │  │
│  │  • Authentication state                            │  │
│  │  • Entity collections (players, teams, etc.)      │  │
│  │  • Active match state (if scoring)                │  │
│  │  • Sync status                                     │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│  Browser localStorage (Persistent Storage)               │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Storage Keys:                                     │  │
│  │                                                    │  │
│  │  vscor_current_user         → User object         │  │
│  │  vscor_accessToken          → Auth token          │  │
│  │  vscor_players              → Player[] array      │  │
│  │  vscor_teams                → Team[] array        │  │
│  │  vscor_master_teams         → Master teams        │  │
│  │  vscor_tournaments          → Tournament[] array  │  │
│  │  vscor_matches              → Match[] array       │  │
│  │  vscor_lastSync             → Timestamp           │  │
│  │  vscor_syncQueue            → Pending sync IDs    │  │
│  │  vscor_app_state            → App state snapshot  │  │
│  │                                                    │  │
│  │  Capacity: ~5-10MB                                 │  │
│  │  Access: Synchronous, instant                      │  │
│  │  Persistence: Until cleared by user               │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│  Data Access Layer                                       │
│  ┌────────────────────────────────────────────────────┐  │
│  │  CRUD Operations:                                  │  │
│  │                                                    │  │
│  │  getPlayerById(id)                                 │  │
│  │  createPlayer(data)                                │  │
│  │  updatePlayer(id, data)                            │  │
│  │  deletePlayer(id)                                  │  │
│  │                                                    │  │
│  │  getAllMatches()                                   │  │
│  │  getMatchesByTournament(tournamentId)              │  │
│  │  updateMatch(id, data)                             │  │
│  │                                                    │  │
│  │  calculatePlayerStats(playerId)                    │  │
│  │  calculateTeamStats(teamName)                      │  │
│  │  calculateStandings(tournamentId)                  │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### 2.3 Sync Layer

```
┌──────────────────────────────────────────────────────────┐
│                  SYNC LAYER                              │
│          (Bidirectional Synchronization)                 │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  Sync Manager                                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │                                                    │  │
│  │  initializeSync() ──┐                              │  │
│  │  pullFromCloud()    │                              │  │
│  │  pushToCloud()      ├─► Core Sync Functions       │  │
│  │  processSyncQueue() │                              │  │
│  │  resolveConflict()  │                              │  │
│  │                     │                              │  │
│  └─────────────────────┘                              │  │
└──────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Queue     │  │  Conflict   │  │   Retry     │
│ Management  │  │ Resolution  │  │   Logic     │
│             │  │             │  │             │
│ • Pending   │  │ • Timestamp │  │ • Exponential│
│   entities  │  │   based     │  │   backoff   │
│ • Priority  │  │ • Event     │  │ • Max 3     │
│   ordering  │  │   merge     │  │   attempts  │
│ • Dedup     │  │ • User      │  │ • Error log │
│             │  │   notify    │  │             │
└─────────────┘  └─────────────┘  └─────────────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│  Sync Strategy                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │                                                    │  │
│  │  1. Check Network Status                           │  │
│  │     └─► If Offline: Queue locally, exit           │  │
│  │                                                    │  │
│  │  2. Fetch from Cloud (Pull)                        │  │
│  │     └─► Get entities newer than lastSync          │  │
│  │                                                    │  │
│  │  3. Compare with Local                             │  │
│  │     ├─► Local newer: Push to cloud                │  │
│  │     ├─► Cloud newer: Pull to local                │  │
│  │     └─► Conflict: Resolve                         │  │
│  │                                                    │  │
│  │  4. Update lastSync timestamp                      │  │
│  │                                                    │  │
│  │  5. Clear sync queue for successful items         │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### 2.4 Backend Services Layer

```
┌──────────────────────────────────────────────────────────┐
│              BACKEND SERVICES LAYER                      │
│        (Supabase Edge Functions - Deno Runtime)          │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  Hono Web Server (index.tsx)                             │
│  ┌────────────────────────────────────────────────────┐  │
│  │  const app = new Hono()                            │  │
│  │  app.use('*', cors())                               │  │
│  │  app.use('*', logger())                             │  │
│  │                                                    │  │
│  │  Routes:                                           │  │
│  │  • /make-server-845a157a/signup                    │  │
│  │  • /make-server-845a157a/players                   │  │
│  │  • /make-server-845a157a/teams                     │  │
│  │  • /make-server-845a157a/tournaments               │  │
│  │  • /make-server-845a157a/matches                   │  │
│  │  • /make-server-845a157a/sync/*                    │  │
│  │                                                    │  │
│  │  Deno.serve(app.fetch)                             │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│    Auth     │  │  Tournament │  │    Match    │
│  Service    │  │   Service   │  │   Service   │
│             │  │             │  │             │
│ • Sign Up   │  │ • Create    │  │ • Create    │
│ • Validate  │  │ • Update    │  │ • Update    │
│ • Get User  │  │ • Fixtures  │  │ • Events    │
│             │  │ • Standings │  │ • Stats     │
└─────────────┘  └─────────────┘  └─────────────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│  KV Store Service (kv_store.tsx - Protected)             │
│  ┌────────────────────────────────────────────────────┐  │
│  │                                                    │  │
│  │  get(key)        → Retrieve value                  │  │
│  │  set(key, value) → Store value                     │  │
│  │  del(key)        → Delete value                    │  │
│  │  mget([keys])    → Get multiple values             │  │
│  │  mset([{k,v}])   → Set multiple values             │  │
│  │  getByPrefix(p)  → Get all matching prefix         │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│  Supabase Client                                         │
│  ┌────────────────────────────────────────────────────┐  │
│  │  createClient(url, serviceRoleKey)                 │  │
│  │                                                    │  │
│  │  Used for:                                         │  │
│  │  • User creation (auth.admin.createUser)           │  │
│  │  • User authentication (auth.getUser)              │  │
│  │  • Database operations (from('table'))             │  │
│  │  • Storage operations (storage.from('bucket'))     │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### 2.5 Database Layer

```
┌──────────────────────────────────────────────────────────┐
│                  DATABASE LAYER                          │
│              (Supabase PostgreSQL)                       │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  kv_store_845a157a Table                                 │
│  ┌────────────────────────────────────────────────────┐  │
│  │  CREATE TABLE kv_store_845a157a (                  │  │
│  │    key TEXT PRIMARY KEY,                           │  │
│  │    value JSONB NOT NULL,                           │  │
│  │    created_at TIMESTAMP DEFAULT NOW(),             │  │
│  │    updated_at TIMESTAMP DEFAULT NOW()              │  │
│  │  );                                                │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│  Stored Entities (JSONB Format)                          │
│                                                          │
│  ┌────────────────────────────────────────────┐         │
│  │  user_{user_id}                            │         │
│  │  {                                         │         │
│  │    user_id, email, name, phoneNumber,      │         │
│  │    profile_photo, created_at               │         │
│  │  }                                         │         │
│  └────────────────────────────────────────────┘         │
│                                                          │
│  ┌────────────────────────────────────────────┐         │
│  │  player_{player_id}                        │         │
│  │  {                                         │         │
│  │    id, name, position, jerseyNumber,       │         │
│  │    owner_user_id, created_by, stats: {...}│         │
│  │  }                                         │         │
│  └────────────────────────────────────────────┘         │
│                                                          │
│  ┌────────────────────────────────────────────┐         │
│  │  team_{team_id}                            │         │
│  │  {                                         │         │
│  │    id, name, players: [...],               │         │
│  │    coordinators: [...], stats: {...}       │         │
│  │  }                                         │         │
│  └────────────────────────────────────────────┘         │
│                                                          │
│  ┌────────────────────────────────────────────┐         │
│  │  tournament_{tournament_id}                │         │
│  │  {                                         │         │
│  │    id, name, format, participatingTeams,   │         │
│  │    fixtures: [...], coordinators: [...]    │         │
│  │  }                                         │         │
│  └────────────────────────────────────────────┘         │
│                                                          │
│  ┌────────────────────────────────────────────┐         │
│  │  match_{match_id}                          │         │
│  │  {                                         │         │
│  │    id, team1, team2, scoreA, scoreB,       │         │
│  │    events: [...], squad1: [...],           │         │
│  │    primaryScorer: {...}, owner_user_id     │         │
│  │  }                                         │         │
│  └────────────────────────────────────────────┘         │
└──────────────────────────────────────────────────────────┘
```

---

## 3. Data Flow Diagrams

### 3.1 Create Match Data Flow

```
USER ACTION: Create Match
        │
        ▼
┌────────────────────────┐
│  NewMatch Component    │
│  • Collect form data   │
│  • Validate inputs     │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  Generate Match Object │
│  {                     │
│    id: UUID,           │
│    owner_user_id,      │
│    primaryScorer,      │
│    created_at: now     │
│  }                     │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  Update React State    │
│  setMatches([...prev,  │
│    newMatch])          │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  Write to localStorage │
│  localStorage.setItem( │
│    'vscor_matches',    │
│    JSON.stringify(...) │
│  )                     │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  Add to Sync Queue     │
│  queue.matches.push(   │
│    match.id            │
│  )                     │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  Trigger Background    │
│  Sync (if online)      │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  POST to API           │
│  /matches              │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  Backend Service       │
│  • Validate            │
│  • Save to KV Store    │
│  • Return success      │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  Remove from Queue     │
│  Update lastSync       │
└────────────────────────┘
```

### 3.2 Record Event Data Flow

```
USER ACTION: Tap Event Button (Goal)
        │
        ▼
┌────────────────────────┐
│  Check Permissions     │
│  • Is user assigned    │
│    scorer?             │
│  • Event in scope?     │
└────────┬───────────────┘
         │ ✓ Allowed
         ▼
┌────────────────────────┐
│  Create Event Object   │
│  {                     │
│    id: UUID,           │
│    type: 'goal',       │
│    player: {...},      │
│    minute: 23,         │
│    recorded_by: userId │
│  }                     │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  Update Match:         │
│  • Add event to        │
│    events[]            │
│  • Increment scoreA    │
│  • Update timestamp    │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  Update React State    │
│  setMatches(prev =>    │
│    prev.map(m =>       │
│      m.id === matchId  │
│        ? updatedMatch  │
│        : m))           │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  Write to localStorage │
│  (immediate save)      │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  Update UI             │
│  • Refresh score       │
│  • Add to timeline     │
│  • Show animation      │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  Background Sync       │
│  PUT /matches/:id      │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  Cloud Updated         │
│  • Event stored        │
│  • Stats recalculated  │
└────────────────────────┘
```

### 3.3 View Live Scores Data Flow

```
USER ACTION: Open Info Tab → Live Scores
        │
        ▼
┌────────────────────────┐
│  Load from localStorage│
│  matches = JSON.parse( │
│    localStorage.getItem│
│    ('vscor_matches')   │
│  )                     │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  Filter Live Matches   │
│  liveMatches =         │
│    matches.filter(     │
│      m => m.status ===│
│      'live'            │
│    )                   │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  Render Match Cards    │
│  • Team names          │
│  • Current score       │
│  • Match minute        │
│  • Last event          │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  Periodic Refresh      │
│  setInterval(() => {   │
│    pullFromCloud()     │
│  }, 5000) // 5 sec     │
└────────┬─────────────��─┘
         │
         ▼
┌────────────────────────┐
│  Merge Updates         │
│  • New events          │
│  • Score changes       │
│  • UI re-render        │
└────────────────────────┘
```

---

## 4. Authentication Flow

```
┌──────────────────────────────────────────────────────────┐
│              AUTHENTICATION FLOW                         │
└──────────────────────────────────────────────────────────┘

USER: Open App
    │
    ▼
┌────────────────────┐
│ Check localStorage │
│ for session        │
└────────┬───────────┘
         │
    ┌────┴────┐
    │         │
   Yes       No
    │         │
    │         ▼
    │   ┌─────────────────┐
    │   │  Login Screen   │
    │   │  • Email input  │
    │   │  • Password     │
    │   └────────┬────────┘
    │            │
    │   USER: Enter credentials
    │            │
    │            ▼
    │   ┌─────────────────┐
    │   │ Call Supabase   │
    │   │ Auth API        │
    │   │                 │
    │   │ signInWithPassword│
    │   │ (email, password)│
    │   └────────┬────────┘
    │            │
    │            ▼
    │   ┌─────────────────┐
    │   │ Receive Session │
    │   │ {               │
    │   │   access_token, │
    │   │   user: {       │
    │   │     id, email   │
    │   │   }             │
    │   │ }               │
    │   └────────┬────────┘
    │            │
    │            ▼
    │   ┌─────────────────┐
    │   │ Store in        │
    │   │ localStorage:   │
    │   │ • accessToken   │
    │   │ • currentUser   │
    │   └────────┬────────┘
    │            │
    └────────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ Initialize App  │
        │ • Load players  │
        │ • Load teams    │
        │ • Load matches  │
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ Trigger Sync    │
        │ • Pull from     │
        │   cloud         │
        │ • Merge with    │
        │   local         │
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ Navigate to     │
        │ Home Dashboard  │
        └─────────────────┘

LOGOUT FLOW:
    │
    ▼
┌────────────────────┐
│ Clear localStorage │
│ • Remove token     │
│ • Clear user data  │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Call Supabase      │
│ signOut()          │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Redirect to        │
│ Login Screen       │
└────────────────────┘
```

---

## 5. Match Event Recording Flow

```
┌──────────────────────────────────────────────────────────┐
│           MATCH EVENT RECORDING FLOW                     │
└──────────────────────────────────────────────────────────┘

SCORER: In Live Scoring Screen
    │
    ▼
┌────────────────────┐
│ Select Team Tab    │
│ (Team 1 or Team 2) │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Select Player from │
│ Squad Grid         │
│ • Highlight player │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Tap Event Button   │
│ (e.g., ⚽ Goal)    │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Check Scorer       │
│ Permissions        │
└────────┬───────────┘
         │
    ┌────┴─────┐
    │          │
 Allowed   Not Allowed
    │          │
    │          ▼
    │   ┌─────────────────┐
    │   │ Show Error      │
    │   │ "Not authorized │
    │   │  to record this │
    │   │  event"         │
    │   └─────────────────┘
    │
    ▼
┌────────────────────┐
│ Event Details      │
│ Modal (if needed)  │
│ • Goal type        │
│ • Assist player    │
└────────┬───────────┘
         │
    SCORER: Confirm
         │
         ▼
┌────────────────────┐
│ Create Event       │
│ Object             │
│ {                  │
│   id: UUID,        │
│   type: 'goal',    │
│   team: 'team1',   │
│   player: {        │
│     id, name       │
│   },               │
│   minute: current, │
│   timestamp: now,  │
│   recorded_by:     │
│     scorer.userId, │
│   details: {       │
│     goalType,      │
│     assistedBy     │
│   }                │
│ }                  │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Update Match       │
│ • events.push(     │
│     newEvent)      │
│ • scoreA++         │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Save to            │
│ localStorage       │
│ (Instant)          │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Update UI          │
│ • Score display    │
│   updates          │
│ • Event added to   │
│   timeline         │
│ • Success animation│
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Queue for Sync     │
│ syncQueue.matches  │
│   .push(match.id)  │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Background Sync    │
│ PUT /matches/:id   │
│ {                  │
│   events: [...],   │
│   scoreA: 2        │
│ }                  │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Backend Processes  │
│ • Save to KV store │
│ • Recalculate      │
│   player stats     │
│ • Update standings │
│   (if tournament)  │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Sync Complete      │
│ • Remove from      │
│   queue            │
│ • Update sync      │
│   status           │
└────────────────────┘
```

---

## 6. Synchronization Architecture

```
┌──────────────────────────────────────────────────────────┐
│           SYNCHRONIZATION ARCHITECTURE                   │
└──────────────────────────────────────────────────────────┘

┌────────────────────┐
│  Sync Triggers     │
│                    │
│ 1. App Launch      │
│ 2. User Login      │
│ 3. Match Complete  │
│ 4. Periodic (5min) │
│ 5. Manual Refresh  │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Check Network      │
│ navigator.onLine   │
└────────┬───────────┘
         │
    ┌────┴────┐
    │         │
  Online    Offline
    │         │
    │         ▼
    │   ┌─────────────────┐
    │   │ Queue Locally   │
    │   │ Set status:     │
    │   │   'offline'     │
    │   │ Exit sync       │
    │   └─────────────────┘
    │
    ▼
┌────────────────────┐
│ Set Sync Status    │
│ status = 'syncing' │
└────────┬───────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│  PULL PHASE (Cloud → Local)                 │
│                                             │
│  For each entity type (players, teams, etc):│
│                                             │
│  1. Fetch from cloud:                       │
│     GET /players?updated_after={lastSync}   │
│                                             │
│  2. Compare with local:                     │
│     const local = localStorage.getItem(...) │
│                                             │
│  3. Merge strategy:                         │
│     if (cloud.updated_at > local.updated_at)│
│       overwrite local with cloud            │
│     else                                    │
│       keep local (will push next)           │
└────────┬────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│  PUSH PHASE (Local → Cloud)                 │
│                                             │
│  For each entity in sync queue:             │
│                                             │
│  1. Read from localStorage                  │
│                                             │
│  2. Send to cloud:                          │
│     PUT /matches/:id                        │
│     {                                       │
│       ...matchData,                         │
│       updated_at: now                       │
│     }                                       │
│                                             │
│  3. On success:                             │
│     Remove from queue                       │
│                                             │
│  4. On error:                               │
│     Retry with exponential backoff          │
│     Max 3 attempts                          │
│     Log error if fails                      │
└────────┬────────────────────────────────────┘
         │
         ▼
┌────────────────────┐
│ Conflict Detection │
│ & Resolution       │
└────────┬───────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Conflict Types:                     │
│                                      │
│  1. Same entity modified on 2 devices│
│     Resolution: Most recent wins     │
│                 (timestamp-based)    │
│                                      │
│  2. Events array diverged            │
│     Resolution: Merge arrays         │
│                 (append-only)        │
│                 Dedupe by event.id   │
│                                      │
│  3. Score mismatch                   │
│     Resolution: Recalculate from     │
│                 merged events        │
└────────┬─────────────────────────────┘
         │
         ▼
┌────────────────────┐
│ Update Local State │
│ • Refresh React    │
│   state            │
│ • Update UI        │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Update Sync Status │
│ • lastSync = now   │
│ • status = 'synced'│
│ • Clear queue      │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Show Sync Indicator│
│ 🟢 Synced          │
└────────────────────┘

ERROR HANDLING:
         │
         ▼
┌────────────────────┐
│ Network Error      │
│ Timeout            │
│ 500 Server Error   │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Retry Logic        │
│ • Attempt 1: 1s    │
�� • Attempt 2: 5s    │
│ • Attempt 3: 15s   │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ If all fail:       │
│ • Keep in queue    │
│ • Log error        │
│ • Notify user      │
│ • status = 'error' │
└────────────────────┘
```

---

## 7. Deployment Architecture

```
┌──────────────────────────────────────────────────────────┐
│              DEPLOYMENT ARCHITECTURE                     │
└──────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  CLIENT (Browser)                                       │
│  ┌───────────────────────────────────────────────────┐  │
│  │  React PWA (Progressive Web App)                  │  │
│  │  • Service Worker (future)                        │  │
│  │  • Offline capability                             │  │
│  │  • localStorage persistence                       │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Hosted on: Figma Make Platform                        │
│  URL: https://{project}.figma-make.app                 │
└─────────────────────────────────────────────────────────┘
                          │
                          │ HTTPS
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  SUPABASE CLOUD (Backend)                               │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Edge Functions (Deno Runtime)                    │  │
│  │  • Hono web server                                │  │
│  │  • /functions/v1/make-server-845a157a/*           │  │
│  │  • Auto-scaling                                   │  │
│  │  • Global CDN                                     │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Authentication Service                           │  │
│  │  • Email/password auth                            │  │
│  │  • JWT token generation                           │  │
│  │  • Session management                             │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  PostgreSQL Database                              │  │
│  │  • kv_store_845a157a table                        │  │
│  │  • JSONB storage                                  │  │
│  │  • Automatic backups                              │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Storage (Future)                                 │  │
│  │  • Image uploads                                  │  │
│  │  • Profile photos                                 │  │
│  │  • Team logos                                     │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  URL: https://{projectId}.supabase.co                  │
└─────────────────────────────────────────────────────────┘

SECURITY:
┌─────────────────────────────────────────────────────────┐
│  • HTTPS only (TLS 1.3)                                 │
│  • JWT authentication                                   │
│  • Row-level security (future)                          │
│  • CORS configured                                      │
│  • Rate limiting (300 req/min authenticated)            │
│  • Service role key protected (backend only)            │
│  • Public anon key for client                           │
└─────────────────────────────────────────────────────────┘

SCALABILITY:
┌─────────────────────────────────────────────────────────┐
│  • Serverless edge functions (auto-scale)               │
│  • Global CDN distribution                              │
│  • Database connection pooling                          │
│  • Horizontal scaling (add more edge nodes)             │
│  • localStorage reduces server load                     │
└─────────────────────────────────────────────────────────┘

MONITORING & LOGGING:
┌─────────────────────────────────────────────────────────┐
│  • Supabase dashboard metrics                           │
│  • Edge function logs (console.log)                     │
│  • Database query performance                           │
│  • Error tracking (client & server)                     │
│  • Sync success/failure rates                           │
└─────────────────────────────────────────────────────────┘
```

---

## Summary

### Key Architectural Principles

1. **Offline-First**: localStorage as source of truth, cloud as backup
2. **Progressive Enhancement**: Works offline, enhanced when online
3. **Optimistic UI**: Immediate UI updates, sync in background
4. **Event-Driven**: Actions trigger state updates and sync events
5. **Stateless Backend**: Edge functions process requests without server-side state
6. **Scalable Storage**: JSONB in PostgreSQL for flexible schema

### Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Client | React 18 | UI framework |
| Styling | Tailwind CSS v4 | Utility-first CSS |
| Icons | lucide-react | Icon library |
| Storage (Local) | localStorage | Offline persistence |
| Storage (Cloud) | Supabase PostgreSQL | Master database |
| Backend | Supabase Edge Functions | Serverless API |
| Runtime | Deno | Edge function runtime |
| Web Server | Hono | Lightweight HTTP framework |
| Auth | Supabase Auth | User authentication |
| Deployment | Figma Make + Supabase | Hosting platforms |

### Data Flow Summary

```
User Action → React State → localStorage → Sync Queue → Backend API → Database
                    ↑                                                      │
                    └──────────────── Background Sync ───────────────────┘
```

---

**End of System Architecture Document**
