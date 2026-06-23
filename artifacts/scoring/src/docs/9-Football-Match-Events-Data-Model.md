# VScor - Football Match Events Data Model

## Overview

This document defines a comprehensive data model for football match events that supports real-time scoring, player performance tracking, match analytics, tournament statistics, and future machine learning features.

**Design Principles**:
- Event-driven architecture
- Append-only event log
- Immutable events (edits create new versions)
- Support for advanced analytics
- ML-ready data structure

---

## Table of Contents
1. [Core Event Structure](#1-core-event-structure)
2. [Event Taxonomy](#2-event-taxonomy)
3. [Event Categories](#3-event-categories)
4. [Event Metadata](#4-event-metadata)
5. [Analytics Support](#5-analytics-support)
6. [Performance Tracking](#6-performance-tracking)
7. [ML Feature Engineering](#7-ml-feature-engineering)

---

## 1. Core Event Structure

### 1.1 Base Event Schema

```typescript
interface MatchEvent {
  // Core Identifiers
  event_id: string;                    // UUID - Unique event identifier
  match_id: string;                    // UUID - Parent match reference
  tournament_id: string | null;        // UUID - Tournament context (if applicable)
  
  // Event Classification
  event_type: EventType;               // Primary event type (see taxonomy)
  event_category: EventCategory;       // Category grouping
  event_subcategory: string | null;    // Sub-classification (e.g., "penalty_goal")
  
  // Temporal Data
  timestamp: string;                   // ISO 8601 - When event was recorded
  match_minute: number;                // Match minute (0 to duration)
  match_second: number | null;         // Optional: Second within minute
  half: number | null;                 // 1 = first half, 2 = second half
  period: 'regulation' | 'extra_time' | 'penalty_shootout';
  
  // Team & Player Data
  team_id: string;                     // UUID - Team performing action
  team_name: string;                   // Denormalized team name
  player_id: string | null;            // UUID - Primary player involved
  player_name: string | null;          // Denormalized player name
  player_jersey_number: string | null; // Jersey number
  
  // Secondary Participants
  secondary_player_id: string | null;  // For assists, fouls on, etc.
  secondary_player_name: string | null;
  goalkeeper_id: string | null;        // For saves, goals conceded
  
  // Event Details
  details: EventDetails;               // Type-specific attributes (JSONB)
  
  // Scoring Impact
  score_before: {                      // Score before this event
    team_a: number;
    team_b: number;
  };
  score_after: {                       // Score after this event
    team_a: number;
    team_b: number;
  };
  
  // Data Quality & Audit
  recorded_by: string;                 // user_id of scorer
  recorder_role: 'primary' | 'secondary';
  confidence_level: number;            // 0.0-1.0 for ML-assisted events
  is_edited: boolean;                  // If event was modified after recording
  edited_at: string | null;            // When edited
  edited_by: string | null;            // user_id of editor
  original_event_id: string | null;    // If this is an edit, link to original
  
  // Sequence & Context
  sequence_number: number;             // Sequential order within match
  previous_event_id: string | null;    // Link to prior event (event chain)
  next_event_id: string | null;        // Link to next event
  
  // Spatial Data (Future - Pitch Coordinates)
  location: {
    x: number | null;                  // 0-100 (left to right)
    y: number | null;                  // 0-100 (bottom to top)
    zone: string | null;               // "defensive_third", "midfield", "attacking_third"
    pitch_area: string | null;         // "penalty_box", "center_circle", etc.
  } | null;
  
  // Contextual Metadata
  metadata: {
    situation: string | null;          // "set_piece", "counter_attack", "open_play"
    pressure: string | null;           // "low", "medium", "high"
    body_part: string | null;          // "left_foot", "right_foot", "head"
    assist_type: string | null;        // "through_ball", "cross", "cutback"
    event_tags: string[];              // Additional tags for ML
  };
  
  // Timestamps
  created_at: string;                  // ISO 8601
  updated_at: string;                  // ISO 8601
}
```

### 1.2 Event Type Enumeration

```typescript
enum EventType {
  // Scoring Events
  GOAL = 'goal',
  PENALTY_GOAL = 'penalty_goal',
  OWN_GOAL = 'own_goal',
  
  // Shooting Events
  SHOT_ON_TARGET = 'shot_on_target',
  SHOT_OFF_TARGET = 'shot_off_target',
  SHOT_BLOCKED = 'shot_blocked',
  
  // Passing Events (Future)
  PASS_COMPLETED = 'pass_completed',
  PASS_INCOMPLETE = 'pass_incomplete',
  KEY_PASS = 'key_pass',
  ASSIST = 'assist',
  CROSS = 'cross',
  THROUGH_BALL = 'through_ball',
  
  // Defensive Events
  TACKLE = 'tackle',
  INTERCEPTION = 'interception',
  BLOCK = 'block',
  CLEARANCE = 'clearance',
  
  // Goalkeeper Events
  SAVE = 'save',
  SAVE_PENALTY = 'save_penalty',
  PUNCH = 'punch',
  CATCH = 'catch',
  GOAL_CONCEDED = 'goal_conceded',
  
  // Discipline Events
  FOUL_COMMITTED = 'foul_committed',
  FOUL_RECEIVED = 'foul_received',
  YELLOW_CARD = 'yellow_card',
  RED_CARD = 'red_card',
  PENALTY_AWARDED = 'penalty_awarded',
  
  // Match Management Events
  SUBSTITUTION = 'substitution',
  CORNER = 'corner',
  OFFSIDE = 'offside',
  THROW_IN = 'throw_in',
  GOAL_KICK = 'goal_kick',
  FREE_KICK = 'free_kick',
  KICK_OFF = 'kick_off',
  HALF_TIME = 'half_time',
  FULL_TIME = 'full_time',
  
  // Duels (Future)
  AERIAL_DUEL_WON = 'aerial_duel_won',
  AERIAL_DUEL_LOST = 'aerial_duel_lost',
  GROUND_DUEL_WON = 'ground_duel_won',
  GROUND_DUEL_LOST = 'ground_duel_lost',
  
  // Possession Events (Future)
  DRIBBLE_SUCCESS = 'dribble_success',
  DRIBBLE_FAILED = 'dribble_failed',
  DISPOSSESSED = 'dispossessed',
  BALL_RECOVERY = 'ball_recovery'
}

enum EventCategory {
  SCORING = 'scoring',
  SHOOTING = 'shooting',
  PASSING = 'passing',
  DEFENSIVE = 'defensive',
  GOALKEEPER = 'goalkeeper',
  DISCIPLINE = 'discipline',
  MATCH_MANAGEMENT = 'match_management',
  DUELS = 'duels',
  POSSESSION = 'possession'
}
```

---

## 2. Event Taxonomy

### 2.1 Event Hierarchy

```
Football Match Events
│
├── Scoring Events
│   ├── Goal
│   │   ├── Open Play Goal
│   │   ├── Penalty Goal
│   │   ├── Free Kick Goal
│   │   ├── Header Goal
│   │   └── Own Goal
│   │
│   └── Assist
│       ├── Through Ball Assist
│       ├── Cross Assist
│       ├── Cutback Assist
│       └── Set Piece Assist
│
├── Shooting Events
│   ├── Shot on Target
│   │   ├── Saved by Goalkeeper
│   │   └── Blocked on Line
│   │
│   ├── Shot off Target
│   │   ├── Over the Bar
│   │   ├── Wide of Post
│   │   └── Hit Post/Crossbar
│   │
│   └── Shot Blocked
│       └── Blocked by Defender
│
├── Passing Events
│   ├── Pass Completed
│   ├── Pass Incomplete
│   ├── Key Pass (leads to shot)
│   ├── Cross
│   └── Through Ball
│
├── Defensive Events
│   ├── Tackle
│   │   ├── Tackle Won
│   │   └── Tackle Lost
│   │
│   ├── Interception
│   ├── Block (shot or pass)
│   └── Clearance
│
├── Goalkeeper Events
│   ├── Save
│   │   ├── Reflex Save
│   │   ├── Diving Save
│   │   └── Penalty Save
│   │
│   ├── Punch/Parry
│   ├── Catch
│   └── Distribution
│
├── Discipline Events
│   ├── Foul Committed
│   │   ├── Regular Foul
│   │   ├── Dangerous Foul
│   │   └── Professional Foul
│   │
│   ├── Yellow Card
│   ├── Red Card
│   │   ├── Direct Red
│   │   └── Second Yellow
│   │
│   └── Penalty Awarded
│
├── Match Management Events
│   ├── Substitution
│   ├── Corner Kick
│   ├── Offside
│   ├── Throw-in
│   ├── Goal Kick
│   ├── Free Kick
│   ├── Kick-off
│   ├── Half-time
│   └── Full-time
│
├── Duels
│   ├── Aerial Duel
│   │   ├── Aerial Won
│   │   └── Aerial Lost
│   │
│   └── Ground Duel
│       ├── Ground Won
│       └── Ground Lost
│
└── Possession Events
    ├── Dribble Success
    ├── Dribble Failed
    ├── Dispossessed
    └── Ball Recovery
```

---

## 3. Event Categories

### 3.1 Scoring Events

#### Goal Event
```typescript
interface GoalEvent extends MatchEvent {
  event_type: EventType.GOAL;
  event_category: EventCategory.SCORING;
  
  details: {
    goal_type: 'open_play' | 'penalty' | 'free_kick' | 'header' | 'own_goal';
    body_part: 'left_foot' | 'right_foot' | 'head' | 'chest' | 'other';
    shot_distance: number | null;        // Meters from goal
    shot_angle: number | null;           // Degrees
    goalkeeper_position: 'set' | 'diving' | 'out_of_position' | null;
    deflected: boolean;
    assisted: boolean;
    assist_player_id: string | null;
    assist_type: 'through_ball' | 'cross' | 'cutback' | 'pass' | null;
    build_up_passes: number | null;      // Passes in build-up
    counter_attack: boolean;
    set_piece: boolean;
  };
  
  // Scoring impact
  score_after: {
    team_a: number;  // Updated score
    team_b: number;
  };
}
```

#### Assist Event
```typescript
interface AssistEvent extends MatchEvent {
  event_type: EventType.ASSIST;
  event_category: EventCategory.SCORING;
  
  details: {
    assist_type: 'through_ball' | 'cross' | 'cutback' | 'pass';
    body_part: 'left_foot' | 'right_foot' | 'head';
    pass_length: number | null;          // Meters
    key_pass: boolean;                   // Led to goal
    goal_event_id: string;               // Link to goal
  };
}
```

### 3.2 Shooting Events

#### Shot on Target
```typescript
interface ShotOnTargetEvent extends MatchEvent {
  event_type: EventType.SHOT_ON_TARGET;
  event_category: EventCategory.SHOOTING;
  
  details: {
    shot_type: 'volley' | 'half_volley' | 'header' | 'strike';
    body_part: 'left_foot' | 'right_foot' | 'head';
    shot_distance: number | null;        // Meters from goal
    shot_angle: number | null;           // Degrees
    shot_power: 'weak' | 'medium' | 'strong' | null;
    outcome: 'saved' | 'goal' | 'blocked_on_line';
    goalkeeper_id: string | null;
    expected_goals_value: number | null; // xG value (0.0-1.0)
  };
}
```

#### Shot off Target
```typescript
interface ShotOffTargetEvent extends MatchEvent {
  event_type: EventType.SHOT_OFF_TARGET;
  event_category: EventCategory.SHOOTING;
  
  details: {
    shot_type: 'volley' | 'half_volley' | 'header' | 'strike';
    body_part: 'left_foot' | 'right_foot' | 'head';
    shot_distance: number | null;
    shot_angle: number | null;
    miss_type: 'over_bar' | 'wide_left' | 'wide_right' | 'hit_post';
    expected_goals_value: number | null;
  };
}
```

### 3.3 Defensive Events

#### Interception
```typescript
interface InterceptionEvent extends MatchEvent {
  event_type: EventType.INTERCEPTION;
  event_category: EventCategory.DEFENSIVE;
  
  details: {
    interception_type: 'pass' | 'cross' | 'through_ball';
    body_part: 'foot' | 'head' | 'chest';
    possession_won: boolean;             // Did team keep possession?
    counter_attack_started: boolean;
  };
}
```

#### Tackle
```typescript
interface TackleEvent extends MatchEvent {
  event_type: EventType.TACKLE;
  event_category: EventCategory.DEFENSIVE;
  
  details: {
    tackle_won: boolean;
    tackle_type: 'standing' | 'sliding';
    foul_committed: boolean;
    card_issued: 'yellow' | 'red' | null;
    opponent_dispossessed_id: string | null;
  };
}
```

### 3.4 Goalkeeper Events

#### Save
```typescript
interface SaveEvent extends MatchEvent {
  event_type: EventType.SAVE;
  event_category: EventCategory.GOALKEEPER;
  
  details: {
    save_type: 'catch' | 'parry' | 'punch' | 'dive' | 'reflex';
    shot_type: 'header' | 'volley' | 'strike';
    shot_distance: number | null;
    shot_angle: number | null;
    difficulty: 'routine' | 'difficult' | 'spectacular';
    shot_event_id: string;               // Link to shot event
  };
}
```

### 3.5 Discipline Events

#### Foul
```typescript
interface FoulEvent extends MatchEvent {
  event_type: EventType.FOUL_COMMITTED;
  event_category: EventCategory.DISCIPLINE;
  
  details: {
    foul_type: 'regular' | 'dangerous' | 'professional' | 'handball';
    card_issued: 'yellow' | 'red' | null;
    penalty_awarded: boolean;
    victim_player_id: string | null;
    body_part: 'hand' | 'foot' | 'body' | null;
    deliberate: boolean;
  };
}
```

#### Card
```typescript
interface CardEvent extends MatchEvent {
  event_type: EventType.YELLOW_CARD | EventType.RED_CARD;
  event_category: EventCategory.DISCIPLINE;
  
  details: {
    card_type: 'yellow' | 'red';
    reason: 'foul' | 'dissent' | 'time_wasting' | 'simulation' | 'second_yellow';
    foul_event_id: string | null;       // Link to foul if applicable
    second_yellow: boolean;              // For red cards
  };
}
```

### 3.6 Match Management Events

#### Substitution
```typescript
interface SubstitutionEvent extends MatchEvent {
  event_type: EventType.SUBSTITUTION;
  event_category: EventCategory.MATCH_MANAGEMENT;
  
  details: {
    player_out_id: string;
    player_out_name: string;
    player_in_id: string;
    player_in_name: string;
    reason: 'tactical' | 'injury' | 'precaution' | 'disciplinary';
    position_changed: boolean;
  };
}
```

---

## 4. Event Metadata

### 4.1 Contextual Metadata Schema

```typescript
interface EventMetadata {
  // Situational Context
  situation: {
    type: 'open_play' | 'set_piece' | 'counter_attack' | 'corner' | 'free_kick';
    phase_of_play: 'defensive' | 'transitional' | 'attacking';
    possession_duration: number | null;  // Seconds
  };
  
  // Pressure & Intensity
  pressure: {
    level: 'low' | 'medium' | 'high';
    opponents_nearby: number | null;     // Number of opponents within 5m
    time_on_ball: number | null;         // Seconds
  };
  
  // Tactical Context
  tactics: {
    formation: string | null;            // "4-4-2", "4-3-3", etc.
    attacking_players: number | null;    // In opponent's half
    defensive_players: number | null;    // In own half
  };
  
  // Performance Context
  performance: {
    score_differential: number;          // Team's score - opponent's score
    time_remaining: number;              // Minutes remaining
    fatigue_factor: number | null;       // 0.0-1.0 (based on minute)
  };
  
  // Event Chain
  chain: {
    chain_id: string | null;             // Group related events
    chain_position: number | null;       // Position in chain
    chain_length: number | null;         // Total events in chain
    chain_outcome: 'goal' | 'shot' | 'turnover' | 'foul' | null;
  };
  
  // Tags for ML
  tags: string[];                        // e.g., ["high_pressure", "weak_foot", "counter"]
  
  // Video/Media (Future)
  video: {
    start_timestamp: number | null;      // Video timestamp
    end_timestamp: number | null;
    clip_url: string | null;
  } | null;
}
```

### 4.2 Data Quality Metadata

```typescript
interface DataQuality {
  // Recording Quality
  recording: {
    method: 'manual' | 'semi_automated' | 'automated';
    device: 'mobile' | 'tablet' | 'desktop' | 'wearable';
    scorer_experience_level: 'novice' | 'intermediate' | 'expert';
  };
  
  // Confidence Scores
  confidence: {
    overall: number;                     // 0.0-1.0
    location: number | null;             // Spatial accuracy
    player_identification: number | null;
    timing: number | null;
  };
  
  // Validation
  validation: {
    is_validated: boolean;
    validated_by: string | null;         // user_id
    validated_at: string | null;
    validation_method: 'manual' | 'automated' | 'peer_review' | null;
  };
  
  // Corrections
  corrections: {
    correction_count: number;
    last_corrected_at: string | null;
    correction_reasons: string[];
  };
}
```

---

## 5. Analytics Support

### 5.1 Pre-Calculated Event Metrics

```typescript
interface EventMetrics {
  // Impact Scores
  impact: {
    offensive_impact: number;            // 0-100
    defensive_impact: number;            // 0-100
    match_impact: number;                // 0-100
    momentum_shift: number;              // -50 to +50
  };
  
  // Expected Metrics
  expected: {
    xG: number | null;                   // Expected goals (0.0-1.0)
    xA: number | null;                   // Expected assists
    xT: number | null;                   // Expected threat
  };
  
  // Efficiency Metrics
  efficiency: {
    action_success_rate: number | null;  // Player's success % for this action type
    team_success_rate: number | null;    // Team's success % for this action type
    league_average: number | null;       // League average for comparison
  };
  
  // Composite Scores
  composite: {
    player_rating_contribution: number;  // Contribution to overall player rating
    team_performance_contribution: number;
  };
}
```

### 5.2 Derived Statistics

#### Player Statistics (Auto-Calculated)
```typescript
interface PlayerMatchStatistics {
  player_id: string;
  match_id: string;
  
  // Scoring
  goals: number;
  assists: number;
  shots: number;
  shots_on_target: number;
  shot_accuracy: number;                 // shots_on_target / shots
  xG: number;                            // Sum of xG for shots
  
  // Passing
  passes_attempted: number;
  passes_completed: number;
  pass_accuracy: number;
  key_passes: number;
  
  // Defending
  tackles: number;
  tackles_won: number;
  interceptions: number;
  clearances: number;
  blocks: number;
  
  // Discipline
  fouls_committed: number;
  fouls_received: number;
  yellow_cards: number;
  red_cards: number;
  
  // Duels
  aerial_duels: number;
  aerial_duels_won: number;
  ground_duels: number;
  ground_duels_won: number;
  
  // Goalkeeper (if applicable)
  saves: number;
  goals_conceded: number;
  save_percentage: number;
  
  // Advanced Metrics
  touches: number;
  successful_dribbles: number;
  ball_recoveries: number;
  possession_won: number;
  possession_lost: number;
  
  // Composite Ratings
  player_rating: number;                 // 0-10 overall rating
  offensive_rating: number;
  defensive_rating: number;
  impact_rating: number;
}
```

#### Team Statistics (Auto-Calculated)
```typescript
interface TeamMatchStatistics {
  team_id: string;
  match_id: string;
  
  // Result
  goals_for: number;
  goals_against: number;
  result: 'win' | 'draw' | 'loss';
  
  // Possession & Territory
  possession_percentage: number | null;
  passes: number;
  pass_accuracy: number;
  
  // Attacking
  shots: number;
  shots_on_target: number;
  shot_accuracy: number;
  xG: number;
  corners: number;
  offsides: number;
  
  // Defending
  tackles: number;
  interceptions: number;
  clearances: number;
  blocks: number;
  
  // Discipline
  fouls_committed: number;
  fouls_received: number;
  yellow_cards: number;
  red_cards: number;
  
  // Set Pieces
  corners_won: number;
  free_kicks_won: number;
  penalties_awarded: number;
  penalties_scored: number;
  
  // Advanced Metrics
  attacking_efficiency: number;          // goals / shots
  defensive_efficiency: number;          // saves / shots_against
  pressing_intensity: number | null;
  build_up_speed: number | null;
}
```

---

## 6. Performance Tracking

### 6.1 Player Performance Index

```typescript
interface PlayerPerformanceIndex {
  player_id: string;
  match_id: string;
  
  // Overall Performance
  overall_rating: number;                // 0-10
  
  // Component Ratings
  ratings: {
    attacking: number;                   // 0-10
    defending: number;                   // 0-10
    passing: number;                     // 0-10
    physical: number;                    // 0-10
    mental: number;                      // 0-10 (discipline, decision-making)
  };
  
  // Key Contributions
  contributions: {
    goals_contribution: number;          // Goals + assists
    defensive_contribution: number;      // Tackles + interceptions + clearances
    possession_contribution: number;     // Pass completion + ball retention
  };
  
  // Impact Assessment
  impact: {
    match_winning_contribution: number;  // Did actions lead to win?
    momentum_shifts: number;             // Positive momentum changes
    critical_moments: number;            // Important actions in key moments
  };
  
  // Consistency
  consistency: {
    error_count: number;
    successful_actions: number;
    action_success_rate: number;
  };
  
  // Comparison
  vs_average: {
    vs_own_average: number;              // % above/below player's average
    vs_position_average: number;         // % above/below position average
    vs_match_average: number;            // % above/below match average
  };
}
```

### 6.2 Team Performance Metrics

```typescript
interface TeamPerformanceMetrics {
  team_id: string;
  match_id: string;
  
  // Offensive Metrics
  offensive: {
    goals_scored: number;
    xG: number;
    goal_conversion_rate: number;        // goals / shots
    shots_per_goal: number;
    attacking_third_entries: number | null;
    box_entries: number | null;
    chances_created: number;
  };
  
  // Defensive Metrics
  defensive: {
    goals_conceded: number;
    xG_against: number;
    saves: number;
    tackles_success_rate: number;
    defensive_third_entries_allowed: number | null;
    box_entries_allowed: number | null;
    clearances: number;
  };
  
  // Possession Metrics
  possession: {
    possession_percentage: number | null;
    pass_completion_rate: number;
    long_ball_accuracy: number | null;
    short_pass_accuracy: number | null;
  };
  
  // Discipline
  discipline: {
    fouls_per_tackle: number;
    cards_received: number;
    penalties_conceded: number;
  };
  
  // Efficiency
  efficiency: {
    attacking_efficiency: number;        // xG / possession
    defensive_efficiency: number;        // 1 - (xG_against / opponent_possession)
    overall_efficiency: number;
  };
}
```

---

## 7. ML Feature Engineering

### 7.1 Feature Vectors for Machine Learning

```typescript
interface MLFeatureVector {
  // Event Features
  event_features: {
    event_type_encoding: number[];       // One-hot encoded
    event_category_encoding: number[];
    temporal_features: {
      minute_normalized: number;         // 0.0-1.0
      half_indicator: number;            // 0 or 1
      time_remaining_normalized: number;
    };
    spatial_features: {
      x_coordinate: number | null;
      y_coordinate: number | null;
      zone_encoding: number[];           // One-hot
      distance_to_goal: number | null;
      angle_to_goal: number | null;
    };
  };
  
  // Player Features
  player_features: {
    player_position_encoding: number[];
    player_cumulative_stats: {
      goals_so_far: number;
      shots_so_far: number;
      passes_so_far: number;
      fouls_so_far: number;
    };
    player_fatigue: number;              // 0.0-1.0
    player_form: number;                 // Recent performance
  };
  
  // Team Features
  team_features: {
    formation_encoding: number[];
    team_state: {
      score_differential: number;
      possession_ratio: number | null;
      momentum: number;                  // -1.0 to 1.0
    };
    team_cumulative_stats: {
      shots: number;
      corners: number;
      fouls: number;
    };
  };
  
  // Context Features
  context_features: {
    match_importance: number;            // 0.0-1.0
    venue: number;                       // 0 = away, 1 = home
    weather: number[] | null;            // Encoded weather conditions
    referee_strictness: number | null;
  };
  
  // Historical Features
  historical_features: {
    player_vs_opponent_history: number[];
    team_vs_opponent_history: number[];
    head_to_head_record: number[];
  };
  
  // Outcome Labels (for training)
  labels: {
    goal_scored_next_5_min: number;      // 0 or 1
    possession_retained: number;          // 0 or 1
    action_success: number;               // 0 or 1
    match_outcome: number;                // 0 = loss, 1 = draw, 2 = win
  };
}
```

### 7.2 Event Sequences for Pattern Recognition

```typescript
interface EventSequence {
  sequence_id: string;
  match_id: string;
  team_id: string;
  
  // Sequence Metadata
  start_minute: number;
  end_minute: number;
  duration_seconds: number;
  event_count: number;
  
  // Events in Sequence
  events: MatchEvent[];
  
  // Sequence Classification
  sequence_type: 'attack' | 'counter_attack' | 'defensive_play' | 'set_piece';
  outcome: 'goal' | 'shot' | 'corner' | 'turnover' | 'foul' | null;
  
  // Sequence Metrics
  metrics: {
    pass_count: number;
    player_count: number;                // Unique players involved
    field_progression: number;           // Meters advanced
    speed: number;                       // Meters per second
    efficiency: number;                  // Outcome value / events
  };
  
  // Pattern Tags
  patterns: string[];                    // e.g., ["quick_transition", "wing_play", "through_middle"]
}
```

### 7.3 Prediction Models Supported

```typescript
interface SupportedMLModels {
  // Match Outcome Prediction
  match_prediction: {
    input: 'historical_features + team_features + context_features';
    output: 'win_probability | draw_probability | loss_probability';
    use_case: 'Pre-match predictions, live probability updates';
  };
  
  // Player Performance Prediction
  player_rating_prediction: {
    input: 'player_features + opponent_features + match_context';
    output: 'predicted_rating (0-10)';
    use_case: 'Fantasy football, player selection';
  };
  
  // xG (Expected Goals) Model
  xG_model: {
    input: 'shot_location + shot_type + pressure + goalkeeper_position + assist_type';
    output: 'goal_probability (0.0-1.0)';
    use_case: 'Shot quality assessment, attacker performance';
  };
  
  // Event Prediction
  next_event_prediction: {
    input: 'event_sequence + match_state + player_positions';
    output: 'next_event_type + probability';
    use_case: 'Tactical analysis, coaching insights';
  };
  
  // Substitution Recommendation
  substitution_model: {
    input: 'player_fatigue + performance + match_state + available_subs';
    output: 'recommended_substitution + timing + expected_impact';
    use_case: 'Coaching decision support';
  };
  
  // Anomaly Detection
  anomaly_detection: {
    input: 'event_stream + player_behavior + team_patterns';
    output: 'anomaly_score + anomaly_type';
    use_case: 'Detect unusual events, potential errors, exceptional plays';
  };
}
```

---

## 8. Data Storage & Indexing

### 8.1 Recommended Database Schema

```sql
-- Events Table
CREATE TABLE match_events (
  event_id UUID PRIMARY KEY,
  match_id UUID NOT NULL,
  tournament_id UUID,
  
  -- Event Classification
  event_type VARCHAR(50) NOT NULL,
  event_category VARCHAR(50) NOT NULL,
  event_subcategory VARCHAR(50),
  
  -- Temporal
  timestamp TIMESTAMP NOT NULL,
  match_minute INTEGER NOT NULL,
  match_second INTEGER,
  half INTEGER,
  period VARCHAR(20),
  
  -- Participants
  team_id UUID NOT NULL,
  team_name VARCHAR(255),
  player_id UUID,
  player_name VARCHAR(255),
  player_jersey_number VARCHAR(10),
  secondary_player_id UUID,
  goalkeeper_id UUID,
  
  -- Event Details (JSONB for flexibility)
  details JSONB,
  
  -- Scoring
  score_before JSONB,
  score_after JSONB,
  
  -- Audit
  recorded_by UUID NOT NULL,
  recorder_role VARCHAR(20),
  confidence_level DECIMAL(3,2),
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP,
  
  -- Sequence
  sequence_number INTEGER,
  previous_event_id UUID,
  
  -- Spatial (Future)
  location JSONB,
  
  -- Metadata
  metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Foreign Keys
  FOREIGN KEY (match_id) REFERENCES matches(id),
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
  FOREIGN KEY (team_id) REFERENCES teams(id),
  FOREIGN KEY (player_id) REFERENCES players(id),
  FOREIGN KEY (recorded_by) REFERENCES users(user_id)
);

-- Indexes for Performance
CREATE INDEX idx_events_match ON match_events(match_id);
CREATE INDEX idx_events_player ON match_events(player_id);
CREATE INDEX idx_events_team ON match_events(team_id);
CREATE INDEX idx_events_type ON match_events(event_type);
CREATE INDEX idx_events_category ON match_events(event_category);
CREATE INDEX idx_events_timestamp ON match_events(timestamp);
CREATE INDEX idx_events_minute ON match_events(match_minute);
CREATE INDEX idx_events_sequence ON match_events(match_id, sequence_number);

-- JSONB Indexes for Analytics
CREATE INDEX idx_events_details ON match_events USING gin(details);
CREATE INDEX idx_events_metadata ON match_events USING gin(metadata);
CREATE INDEX idx_events_location ON match_events USING gin(location);
```

### 8.2 Aggregate Tables for Fast Analytics

```sql
-- Player Match Stats (Pre-aggregated)
CREATE TABLE player_match_statistics (
  id UUID PRIMARY KEY,
  player_id UUID NOT NULL,
  match_id UUID NOT NULL,
  
  -- All statistics from PlayerMatchStatistics interface
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  shots INTEGER DEFAULT 0,
  shots_on_target INTEGER DEFAULT 0,
  shot_accuracy DECIMAL(5,2),
  -- ... all other stats
  
  player_rating DECIMAL(3,1),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(player_id, match_id)
);

-- Team Match Stats (Pre-aggregated)
CREATE TABLE team_match_statistics (
  id UUID PRIMARY KEY,
  team_id UUID NOT NULL,
  match_id UUID NOT NULL,
  
  -- All statistics from TeamMatchStatistics interface
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  result VARCHAR(10),
  -- ... all other stats
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(team_id, match_id)
);

-- Event Sequences (for pattern analysis)
CREATE TABLE event_sequences (
  sequence_id UUID PRIMARY KEY,
  match_id UUID NOT NULL,
  team_id UUID NOT NULL,
  
  start_minute INTEGER,
  end_minute INTEGER,
  event_ids UUID[],
  
  sequence_type VARCHAR(50),
  outcome VARCHAR(50),
  metrics JSONB,
  patterns TEXT[],
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 9. Analytics Query Examples

### 9.1 Player Performance Queries

```sql
-- Get player statistics for a match
SELECT 
  p.name,
  pms.goals,
  pms.assists,
  pms.shots,
  pms.shot_accuracy,
  pms.player_rating
FROM player_match_statistics pms
JOIN players p ON p.id = pms.player_id
WHERE pms.match_id = 'match-uuid'
ORDER BY pms.player_rating DESC;

-- Calculate player's average rating over last 5 matches
SELECT 
  p.name,
  AVG(pms.player_rating) as avg_rating,
  SUM(pms.goals) as total_goals,
  SUM(pms.assists) as total_assists
FROM player_match_statistics pms
JOIN players p ON p.id = pms.player_id
WHERE pms.player_id = 'player-uuid'
  AND pms.match_id IN (
    SELECT id FROM matches 
    WHERE player_id = 'player-uuid'
    ORDER BY match_date DESC 
    LIMIT 5
  )
GROUP BY p.name;
```

### 9.2 Event Analysis Queries

```sql
-- Get all goals with assist information
SELECT 
  me.match_minute,
  me.player_name as scorer,
  me.details->>'assist_type' as assist_type,
  me.details->>'goal_type' as goal_type,
  me.score_after
FROM match_events me
WHERE me.match_id = 'match-uuid'
  AND me.event_type = 'goal'
ORDER BY me.match_minute;

-- Analyze shot efficiency by player
SELECT 
  player_name,
  COUNT(*) FILTER (WHERE event_type = 'goal') as goals,
  COUNT(*) FILTER (WHERE event_type IN ('shot_on_target', 'shot_off_target', 'goal')) as total_shots,
  ROUND(
    COUNT(*) FILTER (WHERE event_type = 'goal')::DECIMAL / 
    NULLIF(COUNT(*) FILTER (WHERE event_type IN ('shot_on_target', 'shot_off_target', 'goal')), 0) * 100,
    2
  ) as conversion_rate
FROM match_events
WHERE match_id = 'match-uuid'
GROUP BY player_name
HAVING COUNT(*) FILTER (WHERE event_type IN ('shot_on_target', 'shot_off_target', 'goal')) > 0
ORDER BY conversion_rate DESC;
```

### 9.3 Pattern Recognition Queries

```sql
-- Find sequences that led to goals
SELECT 
  es.sequence_id,
  es.start_minute,
  es.end_minute,
  es.metrics->>'pass_count' as passes,
  es.metrics->>'speed' as speed,
  es.patterns
FROM event_sequences es
WHERE es.outcome = 'goal'
  AND es.match_id = 'match-uuid'
ORDER BY es.start_minute;

-- Identify most common attacking patterns
SELECT 
  unnest(patterns) as pattern,
  COUNT(*) as frequency,
  COUNT(*) FILTER (WHERE outcome = 'goal') as goals_scored,
  ROUND(
    COUNT(*) FILTER (WHERE outcome = 'goal')::DECIMAL / COUNT(*) * 100,
    2
  ) as success_rate
FROM event_sequences
WHERE sequence_type = 'attack'
  AND team_id = 'team-uuid'
GROUP BY pattern
ORDER BY frequency DESC
LIMIT 10;
```

---

## Summary

### Key Features of This Data Model

1. **Comprehensive Event Coverage**: Supports 30+ event types across 9 categories
2. **ML-Ready**: Pre-engineered features for machine learning models
3. **Analytics-Optimized**: Pre-aggregated statistics for fast queries
4. **Flexible Schema**: JSONB fields allow event-specific attributes
5. **Audit Trail**: Complete tracking of who recorded what and when
6. **Spatial Support**: Ready for future pitch coordinate tracking
7. **Event Chaining**: Links events in sequences for pattern analysis
8. **Performance Metrics**: Built-in calculation of player and team ratings
9. **Scalable**: Designed for millions of events across thousands of matches
10. **Future-Proof**: Extensible for new event types and analytics needs

### Supported Analytics Use Cases

- ✅ Real-time player performance ratings
- ✅ Team tactical analysis
- ✅ xG (expected goals) calculations
- ✅ Shot quality assessment
- ✅ Defensive effectiveness metrics
- ✅ Pattern recognition in attacking play
- ✅ Substitution impact analysis
- ✅ Tournament-wide statistics
- ✅ Player comparison and scouting
- ✅ Match outcome prediction
- ✅ Anomaly detection
- ✅ Fantasy football scoring

---

**End of Football Match Events Data Model**
