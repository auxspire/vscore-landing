# VScor - Event Taxonomy

## Overview

This document defines the complete taxonomy of football match events tracked by VScor, organized by category and scoring level.

---

## Table of Contents
1. [Event Categories](#event-categories)
2. [Event Structure](#event-structure)
3. [Events by Scoring Level](#events-by-scoring-level)
4. [Event Details Schema](#event-details-schema)
5. [Event Recording Rules](#event-recording-rules)

---

## Event Categories

### 1. Scoring Events
Events that directly affect the score or contribute to scoring opportunities.

**Events**:
- Goal
- Penalty Goal (subset of Goal)
- Own Goal (subset of Goal)
- Assist (attribute of Goal)

### 2. Shooting Events
All shot attempts, whether successful (goal) or unsuccessful.

**Events**:
- Shot on Target
- Shot off Target
- Blocked Shot (future)

### 3. Defensive Events
Actions that prevent the opposing team from scoring or progressing.

**Events**:
- Interception
- Block (future)
- Clearance (future)
- Save (goalkeeper-specific, future)

### 4. Discipline Events
Fouls and cards issued by the referee.

**Events**:
- Foul
- Yellow Card (attribute of Foul or standalone)
- Red Card (attribute of Foul or standalone)
- Penalty (attribute of Foul)

### 5. Match Management Events
Structural events that affect match flow and player participation.

**Events**:
- Substitution
- Corner Kick
- Offside
- Throw-in (future)
- Goal Kick (future)
- Free Kick (future)

---

## Event Structure

### Base Event Schema
```typescript
interface MatchEvent {
  id: string;                    // Unique event identifier (UUID)
  type: string;                  // Event type code (see Event Types)
  team: 'team1' | 'team2';       // Team that performed the event
  player: {                      // Player involved in the event
    id: string;
    name: string;
  };
  minute: number;                // Match minute (0 to match duration)
  timestamp: string;             // ISO 8601 timestamp when recorded
  recorded_by: string;           // user_id of scorer who recorded
  details: EventDetails;         // Event-specific attributes (see below)
}
```

### Event Details Schema
```typescript
interface EventDetails {
  // For Goals
  goalType?: 'open-play' | 'penalty' | 'free-kick' | 'header' | 'own-goal';
  assistedBy?: {
    id: string;
    name: string;
  };
  isPenalty?: boolean;
  
  // For Fouls
  cardType?: 'yellow' | 'red' | null;
  foulType?: 'regular' | 'dangerous';
  reason?: string;
  
  // For Shots
  shotLocation?: 'inside-box' | 'outside-box';
  
  // For Substitutions
  playerOut?: {
    id: string;
    name: string;
  };
  playerIn?: {
    id: string;
    name: string;
  };
  
  // General
  notes?: string;
}
```

---

## Events by Scoring Level

### Basic Scoring Level

**Philosophy**: Fast, minimal-detail event recording for casual matches

**Available Events**:
1. **Goal** ⚽
2. **Shot on Target** 🎯
3. **Shot off Target** ❌
4. **Foul** 🚫
5. **Substitution** 🔄
6. **Corner** ⚪

**Attributes**:
- Goals: Penalty checkbox only
- Fouls: Yellow/Red card checkboxes
- Shots: No additional attributes
- Substitutions: Player Out + Player In selection
- Corners: No additional attributes

**Recording Speed**: 1-2 seconds per event

---

### Intermediate (Detailed) Scoring Level

**Philosophy**: Same events as Basic, but with enhanced attributes for better statistics

**Available Events**: Same as Basic

**Enhanced Attributes**:
- **Goals**:
  - Goal Type: Open Play, Penalty, Free Kick, Header, Own Goal
  - Assisted By: Player selection (optional)
  
- **Fouls**:
  - Card Type: None, Yellow, Red
  - Foul Type: Regular, Dangerous
  
- **Shots**:
  - Shot Location: Inside Box, Outside Box
  
- **Substitutions**: Same as Basic

- **Corners**: No additional attributes

**Recording Speed**: 3-4 seconds per event

---

### Intermediate (All Events) Scoring Level

**Philosophy**: Track all event types with basic attributes for comprehensive statistics

**Available Events**: Basic events + additional defensive events

1. **Goal** ⚽
2. **Shot on Target** 🎯
3. **Shot off Target** ❌
4. **Foul** 🚫
5. **Substitution** 🔄
6. **Corner** ⚪
7. **Interception** 🛡️ (NEW)
8. **Offside** 🚩 (NEW)

**Attributes**: Basic only (penalty flag, cards)

**Recording Speed**: 1-2 seconds per event

---

### Advanced Scoring Level

**Philosophy**: Complete event tracking with full attributes and dual-scorer support

**Available Events**: All events (Basic + Intermediate All)

**Full Attributes**:
- All attributes from Intermediate Detailed
- Additional notes field for all events
- Future: Pass, Tackle, Save

**Dual-Scorer Support**:
- Enabled (optional second scorer)
- Responsibility division by team or event type

**Recording Speed**: 4-5 seconds per event

---

## Event Details Schema

### 1. Goal ⚽

**Event Code**: `goal`

**Schema**:
```typescript
{
  type: 'goal',
  team: 'team1' | 'team2',
  player: {
    id: string,
    name: string
  },
  minute: number,
  timestamp: string,
  recorded_by: string,
  details: {
    goalType: 'open-play' | 'penalty' | 'free-kick' | 'header' | 'own-goal',
    assistedBy?: {
      id: string,
      name: string
    },
    isPenalty: boolean,
    notes?: string
  }
}
```

**Goal Types**:
- **Open Play**: Goal scored during regular play
- **Penalty**: Goal from penalty spot
- **Free Kick**: Goal from direct free kick
- **Header**: Goal scored with head
- **Own Goal**: Goal scored into own net

**Validation Rules**:
- Player must be in squad for selected team
- If goalType is 'own-goal', team should be opponent's team
- assistedBy player must be different from scoring player
- assistedBy player must be from same team (except for own goals)

**Effect on Match State**:
- Increment scoreA or scoreB based on team
- Update player statistics (goals, assists)

**Example**:
```json
{
  "id": "event-uuid-1",
  "type": "goal",
  "team": "team1",
  "player": {
    "id": "player-uuid-9",
    "name": "John Doe"
  },
  "minute": 23,
  "timestamp": "2026-03-08T14:23:00Z",
  "recorded_by": "user-uuid",
  "details": {
    "goalType": "open-play",
    "assistedBy": {
      "id": "player-uuid-10",
      "name": "Jane Smith"
    },
    "isPenalty": false
  }
}
```

---

### 2. Shot on Target 🎯

**Event Code**: `shot_on_target`

**Schema**:
```typescript
{
  type: 'shot_on_target',
  team: 'team1' | 'team2',
  player: { id: string, name: string },
  minute: number,
  timestamp: string,
  recorded_by: string,
  details: {
    shotLocation?: 'inside-box' | 'outside-box',
    notes?: string
  }
}
```

**Definition**: Shot that would have resulted in a goal if not saved by goalkeeper or blocked by defender on goal line.

**Validation Rules**:
- Player must be in squad
- Does not increment score

**Effect on Match State**:
- Update player statistics (shotsOnTarget++)

---

### 3. Shot off Target ❌

**Event Code**: `shot_off_target`

**Schema**:
```typescript
{
  type: 'shot_off_target',
  team: 'team1' | 'team2',
  player: { id: string, name: string },
  minute: number,
  timestamp: string,
  recorded_by: string,
  details: {
    shotLocation?: 'inside-box' | 'outside-box',
    notes?: string
  }
}
```

**Definition**: Shot that missed the goal (over the bar, wide, hit post and bounced out).

**Effect on Match State**:
- Update player statistics (shotsOffTarget++)

---

### 4. Foul 🚫

**Event Code**: `foul`

**Schema**:
```typescript
{
  type: 'foul',
  team: 'team1' | 'team2',  // Team that committed the foul
  player: { id: string, name: string },
  minute: number,
  timestamp: string,
  recorded_by: string,
  details: {
    cardType?: 'yellow' | 'red' | null,
    foulType?: 'regular' | 'dangerous',
    isPenalty?: boolean,
    reason?: string,
    notes?: string
  }
}
```

**Card Types**:
- **Yellow**: Caution (player can continue)
- **Red**: Sending off (player must leave field)
- **null**: No card issued

**Foul Types**:
- **Regular**: Standard foul
- **Dangerous**: Reckless or dangerous play

**Validation Rules**:
- Player must be in squad and not already substituted out
- If cardType is 'red', player status should be updated to removed

**Effect on Match State**:
- Update player statistics (fouls++)
- If yellow card: Update player statistics (yellowCards++)
- If red card: Update player statistics (redCards++), remove player from field
- If isPenalty: May lead to penalty goal event

---

### 5. Substitution 🔄

**Event Code**: `substitute`

**Schema**:
```typescript
{
  type: 'substitute',
  team: 'team1' | 'team2',
  player: null,  // No single player, use details
  minute: number,
  timestamp: string,
  recorded_by: string,
  details: {
    playerOut: {
      id: string,
      name: string
    },
    playerIn: {
      id: string,
      name: string
    },
    notes?: string  // e.g., "Injury", "Tactical"
  }
}
```

**Validation Rules**:
- playerOut must be in starting lineup or previously substituted in
- playerOut must have status 'starting' (not already substituted out)
- playerIn must be in squad with status 'substitute'
- Cannot substitute same player twice

**Effect on Match State**:
- Update playerOut status: 'substituted-out'
- Update playerIn status: 'starting'

**Example**:
```json
{
  "id": "event-uuid-5",
  "type": "substitute",
  "team": "team1",
  "player": null,
  "minute": 60,
  "timestamp": "2026-03-08T15:00:00Z",
  "recorded_by": "user-uuid",
  "details": {
    "playerOut": {
      "id": "player-uuid-9",
      "name": "John Doe"
    },
    "playerIn": {
      "id": "player-uuid-14",
      "name": "Alex Brown"
    },
    "notes": "Tactical change"
  }
}
```

---

### 6. Corner ⚪

**Event Code**: `corner`

**Schema**:
```typescript
{
  type: 'corner',
  team: 'team1' | 'team2',  // Team awarded the corner
  player: { id: string, name: string } | null,  // Player taking corner (optional)
  minute: number,
  timestamp: string,
  recorded_by: string,
  details: {
    notes?: string
  }
}
```

**Definition**: Corner kick awarded when ball goes out of play over goal line, last touched by defending team.

**Effect on Match State**:
- Update team statistics (corners++)

---

### 7. Interception 🛡️

**Event Code**: `interception`

**Availability**: Intermediate (All Events), Advanced

**Schema**:
```typescript
{
  type: 'interception',
  team: 'team1' | 'team2',
  player: { id: string, name: string },
  minute: number,
  timestamp: string,
  recorded_by: string,
  details: {
    notes?: string
  }
}
```

**Definition**: Defensive action where player intercepts opponent's pass or dribble.

**Effect on Match State**:
- Update player statistics (interceptions++)

---

### 8. Offside 🚩

**Event Code**: `offside`

**Availability**: Intermediate (All Events), Advanced

**Schema**:
```typescript
{
  type: 'offside',
  team: 'team1' | 'team2',  // Team that was offside
  player: { id: string, name: string },
  minute: number,
  timestamp: string,
  recorded_by: string,
  details: {
    notes?: string
  }
}
```

**Definition**: Player in attacking position is in offside position when ball is played.

**Effect on Match State**:
- Update player statistics (offsides++)

---

## Event Recording Rules

### Rule 1: Player Selection
- **Required**: For all events except Substitution and Corner (optional)
- **Validation**: Player must be in squad for selected team
- **Restriction**: Cannot select substituted-out players

---

### Rule 2: Team Association
- **Determined by**: Active team toggle in UI
- **For Goals**: Team scores the goal
- **For Fouls**: Team commits the foul
- **For Interceptions**: Team performs the interception
- **For Offsides**: Team that was offside

---

### Rule 3: Minute Tracking
- **Calculation**: Elapsed time from match start (in minutes)
- **Range**: 0 to match duration
- **Pause Handling**: Paused time excluded from minute calculation
- **Display**: Rounded down to nearest minute

---

### Rule 4: Dual-Scorer Permissions

**Team-Based Division**:
- Scorer A records ALL events for Team 1
- Scorer B records ALL events for Team 2
- Restriction enforced by disabling opponent team tab

**Event-Based Division**:
- Primary Scorer: goal, shot_on_target, shot_off_target, foul
- Secondary Scorer: interception, offside, substitute, corner
- Restriction enforced by disabling non-assigned event buttons

---

### Rule 5: Event Editing
- **Who**: Only the scorer who recorded the event (recorded_by)
- **What**: All fields can be edited except id and timestamp
- **Flag**: Set `edited: true` and `edited_at: timestamp`

---

### Rule 6: Event Deletion
- **Who**: Match owner or scorer who recorded
- **Confirmation**: Required if event is a goal (affects score)
- **Effect**: Remove from events array, recalculate scores

---

## Event Statistics Mapping

### Player Statistics
| Event Type | Statistic Updated |
|------------|-------------------|
| goal | goals++ |
| goal (assisted) | assists++ (for assist player) |
| shot_on_target | shotsOnTarget++ |
| shot_off_target | shotsOffTarget++ |
| foul | fouls++ |
| foul (yellow card) | yellowCards++ |
| foul (red card) | redCards++ |
| interception | interceptions++ |
| offside | offsides++ |
| All events (as participant) | matches++ (once per match) |

### Team Statistics
| Event Type | Statistic Updated |
|------------|-------------------|
| goal (for team) | goalsFor++ |
| goal (against team) | goalsAgainst++ |
| corner (for team) | corners++ |
| Match completion | matches++, wins/draws/losses++ |

---

## Event Timeline Display

### Chronological Order
Events displayed in ascending order by:
1. **Minute** (primary sort)
2. **Timestamp** (secondary sort for same-minute events)

### Event Icons
| Event | Icon | Color |
|-------|------|-------|
| Goal | ⚽ | Green |
| Shot on Target | 🎯 | Blue |
| Shot off Target | ❌ | Gray |
| Foul | 🚫 | Yellow/Red |
| Yellow Card | 🟨 | Yellow |
| Red Card | 🟥 | Red |
| Substitution | 🔄 | Purple |
| Corner | ⚪ | Gray |
| Interception | 🛡️ | Blue |
| Offside | 🚩 | Orange |

### Event Description Format
```
{minute}' {icon} {playerName} ({jerseyNumber}) - {eventType}
    {additionalDetails}
    [Edit] [Delete]
```

**Example**:
```
23' ⚽ John Doe (#9) - Goal
    Type: Open Play | Assist: Jane Smith (#10)
    [Edit] [Delete]
```

---

## Future Events (Roadmap)

### Passing Events
- Pass Completed
- Pass Incomplete
- Key Pass (leading to shot)

### Defensive Events
- Tackle
- Block
- Clearance
- Save (Goalkeeper)

### Goalkeeper-Specific Events
- Catch
- Punch
- Distribution

### Match Flow Events
- Throw-in
- Goal Kick
- Free Kick (Direct/Indirect)
- Penalty Kick (separate from goal)

### Advanced Events
- Dribble Successful
- Dribble Failed
- Aerial Duel Won/Lost
- Cross Completed
- Through Ball

---

## Event Data Integrity

### Validation Checklist
```javascript
function validateEvent(event: MatchEvent): boolean {
  // Required fields
  if (!event.id || !event.type || !event.team || !event.minute) {
    return false;
  }
  
  // Player validation (except substitution and corner)
  if (event.type !== 'substitute' && event.type !== 'corner') {
    if (!event.player || !event.player.id) {
      return false;
    }
  }
  
  // Minute range
  if (event.minute < 0 || event.minute > match.duration) {
    return false;
  }
  
  // Team validation
  if (event.team !== 'team1' && event.team !== 'team2') {
    return false;
  }
  
  // Event-specific validation
  switch (event.type) {
    case 'goal':
      return validateGoal(event);
    case 'substitute':
      return validateSubstitution(event);
    // ... other event types
  }
  
  return true;
}
```

---

**End of Event Taxonomy Document**
