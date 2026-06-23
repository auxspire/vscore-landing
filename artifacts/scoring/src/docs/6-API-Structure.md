# VScor - API Structure

## Overview

VScor uses a REST API architecture with Supabase Edge Functions (Hono web server) for cloud synchronization and data persistence.

**Base URL**: `https://{projectId}.supabase.co/functions/v1/make-server-845a157a`

**Authentication**: Bearer token in Authorization header

---

## Table of Contents
1. [Authentication Endpoints](#1-authentication-endpoints)
2. [Player Endpoints](#2-player-endpoints)
3. [Team Endpoints](#3-team-endpoints)
4. [Tournament Endpoints](#4-tournament-endpoints)
5. [Match Endpoints](#5-match-endpoints)
6. [Sync Endpoints](#6-sync-endpoints)
7. [Error Handling](#7-error-handling)
8. [Rate Limiting](#8-rate-limiting)

---

## Authentication

All API requests (except signup/login) require authentication via Bearer token:

```http
Authorization: Bearer {publicAnonKey}
```

For user-specific operations (create, update, delete), use the user's access token:

```http
Authorization: Bearer {userAccessToken}
```

---

## 1. Authentication Endpoints

### 1.1 Sign Up

**Endpoint**: `POST /signup`

**Purpose**: Create new user account

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "phoneNumber": "+919876543210"
}
```

**Response** (201 Created):
```json
{
  "user": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "phoneNumber": "+919876543210",
    "created_at": "2026-03-08T10:30:00Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Account created successfully"
}
```

**Errors**:
- `400`: Invalid input (email format, password too short)
- `409`: Email already exists

---

### 1.2 Sign In

**Note**: Handled directly by Supabase Auth client-side

```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});
```

---

### 1.3 Get Current Session

**Note**: Handled directly by Supabase Auth client-side

```javascript
const { data: { session }, error } = await supabase.auth.getSession();
```

---

## 2. Player Endpoints

### 2.1 Get All Players

**Endpoint**: `GET /players`

**Purpose**: Retrieve all player profiles

**Headers**:
```http
Authorization: Bearer {publicAnonKey}
```

**Query Parameters**:
- `limit` (optional): Number of results (default: 100)
- `offset` (optional): Pagination offset (default: 0)
- `search` (optional): Search by name
- `position` (optional): Filter by position

**Example Request**:
```http
GET /players?search=john&limit=20
```

**Response** (200 OK):
```json
{
  "players": [
    {
      "id": "player-uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "position": "Forward",
      "jerseyNumber": "9",
      "imageUrl": "https://...",
      "owner_user_id": "user-uuid",
      "stats": {
        "matches": 25,
        "goals": 18,
        "assists": 10
      },
      "created_at": "2026-01-15T10:00:00Z"
    }
  ],
  "total": 150,
  "limit": 20,
  "offset": 0
}
```

---

### 2.2 Get Player by ID

**Endpoint**: `GET /players/:id`

**Purpose**: Retrieve single player profile

**Headers**:
```http
Authorization: Bearer {publicAnonKey}
```

**Response** (200 OK):
```json
{
  "id": "player-uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "+919876543210",
  "position": "Forward",
  "jerseyNumber": "9",
  "imageUrl": "https://...",
  "dateOfBirth": "1995-05-15",
  "height": 180,
  "weight": 75,
  "preferredFoot": "Right",
  "owner_user_id": "user-uuid",
  "created_by": "user-uuid",
  "created_at": "2026-01-15T10:00:00Z",
  "updated_at": "2026-03-08T10:30:00Z",
  "stats": {
    "matches": 25,
    "goals": 18,
    "assists": 10,
    "yellowCards": 2,
    "redCards": 0,
    "shotsOnTarget": 45,
    "shotsOffTarget": 20,
    "fouls": 8
  }
}
```

**Errors**:
- `404`: Player not found

---

### 2.3 Create Player

**Endpoint**: `POST /players`

**Purpose**: Create new player profile

**Headers**:
```http
Authorization: Bearer {userAccessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "+919876543210",
  "position": "Forward",
  "jerseyNumber": "9",
  "dateOfBirth": "1995-05-15",
  "height": 180,
  "weight": 75,
  "preferredFoot": "Right",
  "imageUrl": "https://..."
}
```

**Response** (201 Created):
```json
{
  "id": "new-player-uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "owner_user_id": "current-user-uuid",
  "created_by": "current-user-uuid",
  "created_at": "2026-03-08T10:30:00Z",
  "message": "Player created successfully"
}
```

**Errors**:
- `400`: Invalid input (missing name, invalid email format)
- `401`: Unauthorized (no valid token)
- `409`: Duplicate player name (for same owner)

---

### 2.4 Update Player

**Endpoint**: `PUT /players/:id`

**Purpose**: Update player profile (owner only)

**Headers**:
```http
Authorization: Bearer {userAccessToken}
Content-Type: application/json
```

**Request Body** (partial update supported):
```json
{
  "position": "Midfielder",
  "jerseyNumber": "10",
  "height": 182
}
```

**Response** (200 OK):
```json
{
  "id": "player-uuid",
  "name": "John Doe",
  "position": "Midfielder",
  "jerseyNumber": "10",
  "updated_at": "2026-03-08T11:00:00Z",
  "message": "Player updated successfully"
}
```

**Errors**:
- `401`: Unauthorized
- `403`: Forbidden (not the owner)
- `404`: Player not found

---

### 2.5 Delete Player

**Endpoint**: `DELETE /players/:id`

**Purpose**: Delete player profile (owner only)

**Headers**:
```http
Authorization: Bearer {userAccessToken}
```

**Response** (200 OK):
```json
{
  "message": "Player deleted successfully"
}
```

**Errors**:
- `401`: Unauthorized
- `403`: Forbidden (not the owner)
- `404`: Player not found
- `409`: Conflict (player linked to match history)

---

## 3. Team Endpoints

### 3.1 Get All Teams

**Endpoint**: `GET /teams`

**Purpose**: Retrieve all teams

**Headers**:
```http
Authorization: Bearer {publicAnonKey}
```

**Query Parameters**:
- `limit`, `offset`: Pagination
- `search`: Search by name

**Response** (200 OK):
```json
{
  "teams": [
    {
      "id": "team-uuid",
      "name": "Arsenal FC",
      "coach": "Coach Name",
      "homeVenue": "Emirates Stadium",
      "imageUrl": "https://...",
      "players": [
        {
          "id": "player-uuid",
          "name": "John Doe",
          "position": "Forward",
          "jerseyNumber": "9"
        }
      ],
      "coordinators": [
        {
          "user_id": "user-uuid",
          "name": "Coordinator Name",
          "email": "coord@example.com"
        }
      ],
      "stats": {
        "matchesPlayed": 20,
        "wins": 15,
        "draws": 3,
        "losses": 2
      },
      "created_at": "2026-01-01T10:00:00Z"
    }
  ],
  "total": 50
}
```

---

### 3.2 Get Team by ID

**Endpoint**: `GET /teams/:id`

**Purpose**: Retrieve single team

**Response** (200 OK):
```json
{
  "id": "team-uuid",
  "name": "Arsenal FC",
  "coach": "Coach Name",
  "homeVenue": "Emirates Stadium",
  "description": "Team description",
  "imageUrl": "https://...",
  "founded": "2020",
  "players": [...],
  "coordinators": [...],
  "stats": {...},
  "created_by": "user-uuid",
  "created_at": "2026-01-01T10:00:00Z",
  "updated_at": "2026-03-08T10:30:00Z"
}
```

---

### 3.3 Create Team

**Endpoint**: `POST /teams`

**Headers**:
```http
Authorization: Bearer {userAccessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "Arsenal FC",
  "coach": "Coach Name",
  "homeVenue": "Emirates Stadium",
  "description": "Team description",
  "imageUrl": "https://...",
  "founded": "2020"
}
```

**Response** (201 Created):
```json
{
  "id": "new-team-uuid",
  "name": "Arsenal FC",
  "created_by": "current-user-uuid",
  "coordinators": [
    {
      "user_id": "current-user-uuid",
      "name": "Current User",
      "email": "user@example.com"
    }
  ],
  "created_at": "2026-03-08T10:30:00Z",
  "message": "Team created successfully"
}
```

---

### 3.4 Update Team

**Endpoint**: `PUT /teams/:id`

**Headers**:
```http
Authorization: Bearer {userAccessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "coach": "New Coach Name",
  "homeVenue": "New Stadium",
  "players": [
    {
      "id": "player-uuid-1",
      "name": "Player 1",
      "position": "Forward",
      "jerseyNumber": "9"
    }
  ]
}
```

**Response** (200 OK):
```json
{
  "id": "team-uuid",
  "name": "Arsenal FC",
  "coach": "New Coach Name",
  "updated_at": "2026-03-08T11:00:00Z",
  "message": "Team updated successfully"
}
```

**Errors**:
- `403`: Forbidden (not a coordinator)

---

### 3.5 Delete Team

**Endpoint**: `DELETE /teams/:id`

**Response** (200 OK):
```json
{
  "message": "Team deleted successfully"
}
```

**Errors**:
- `403`: Forbidden (not primary coordinator)
- `409`: Conflict (team linked to active tournaments)

---

## 4. Tournament Endpoints

### 4.1 Get All Tournaments

**Endpoint**: `GET /tournaments`

**Query Parameters**:
- `limit`, `offset`: Pagination
- `search`: Search by name
- `format`: Filter by format (knockout, round-robin, group-knockout)
- `status`: Filter by status (upcoming, in-progress, completed)

**Response** (200 OK):
```json
{
  "tournaments": [
    {
      "id": "tournament-uuid",
      "name": "Spring Cup 2026",
      "format": "round-robin",
      "startDate": "2026-03-01",
      "endDate": "2026-03-31",
      "venue": "City Stadium",
      "imageUrl": "https://...",
      "matchDuration": 45,
      "playersPerTeam": 7,
      "participatingTeams": [
        {"id": "team-uuid-1", "name": "Arsenal FC"},
        {"id": "team-uuid-2", "name": "Chelsea FC"}
      ],
      "fixturesPublished": true,
      "created_at": "2026-02-01T10:00:00Z"
    }
  ],
  "total": 20
}
```

---

### 4.2 Get Tournament by ID

**Endpoint**: `GET /tournaments/:id`

**Response** (200 OK):
```json
{
  "id": "tournament-uuid",
  "name": "Spring Cup 2026",
  "description": "Annual spring tournament",
  "format": "round-robin",
  "startDate": "2026-03-01",
  "endDate": "2026-03-31",
  "venue": "City Stadium",
  "imageUrl": "https://...",
  "matchDuration": 45,
  "playersPerTeam": 7,
  "pointsSystem": {
    "win": 3,
    "draw": 1,
    "loss": 0
  },
  "participatingTeams": [...],
  "groups": null,
  "fixtures": [
    {
      "id": "fixture-uuid",
      "round": "Round Robin",
      "matchNumber": 1,
      "team1": {"id": "team-uuid-1", "name": "Arsenal FC"},
      "team2": {"id": "team-uuid-2", "name": "Chelsea FC"},
      "scheduledDate": "2026-03-10",
      "scheduledTime": "10:00",
      "venue": "Stadium A",
      "match_id": "match-uuid",
      "status": "completed"
    }
  ],
  "fixturesPublished": true,
  "coordinators": [...],
  "created_by": "user-uuid",
  "created_at": "2026-02-01T10:00:00Z"
}
```

---

### 4.3 Create Tournament

**Endpoint**: `POST /tournaments`

**Headers**:
```http
Authorization: Bearer {userAccessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "Spring Cup 2026",
  "description": "Annual spring tournament",
  "format": "round-robin",
  "startDate": "2026-03-01",
  "endDate": "2026-03-31",
  "venue": "City Stadium",
  "imageUrl": "https://...",
  "matchDuration": 45,
  "playersPerTeam": 7,
  "pointsSystem": {
    "win": 3,
    "draw": 1,
    "loss": 0
  }
}
```

**Response** (201 Created):
```json
{
  "id": "new-tournament-uuid",
  "name": "Spring Cup 2026",
  "created_by": "current-user-uuid",
  "created_at": "2026-03-08T10:30:00Z",
  "message": "Tournament created successfully"
}
```

---

### 4.4 Update Tournament

**Endpoint**: `PUT /tournaments/:id`

**Request Body**:
```json
{
  "description": "Updated description",
  "participatingTeams": [
    {"id": "team-uuid-1", "name": "Arsenal FC"},
    {"id": "team-uuid-2", "name": "Chelsea FC"},
    {"id": "team-uuid-3", "name": "Liverpool FC"}
  ],
  "fixtures": [...]
}
```

**Response** (200 OK):
```json
{
  "id": "tournament-uuid",
  "name": "Spring Cup 2026",
  "updated_at": "2026-03-08T11:00:00Z",
  "message": "Tournament updated successfully"
}
```

---

### 4.5 Get Tournament Standings

**Endpoint**: `GET /tournaments/:id/standings`

**Purpose**: Get calculated standings for tournament

**Response** (200 OK):
```json
{
  "tournamentId": "tournament-uuid",
  "standings": [
    {
      "position": 1,
      "team": {
        "id": "team-uuid",
        "name": "Arsenal FC"
      },
      "played": 10,
      "won": 8,
      "drawn": 1,
      "lost": 1,
      "goalsFor": 25,
      "goalsAgainst": 10,
      "goalDifference": 15,
      "points": 25
    }
  ],
  "lastUpdated": "2026-03-08T10:30:00Z"
}
```

---

### 4.6 Delete Tournament

**Endpoint**: `DELETE /tournaments/:id`

**Response** (200 OK):
```json
{
  "message": "Tournament deleted successfully"
}
```

**Errors**:
- `403`: Forbidden (not primary coordinator)
- `409`: Conflict (tournament has match results)

---

## 5. Match Endpoints

### 5.1 Get All Matches

**Endpoint**: `GET /matches`

**Query Parameters**:
- `limit`, `offset`: Pagination
- `tournament_id`: Filter by tournament
- `status`: Filter by status (upcoming, live, completed)
- `team`: Filter by team name
- `date_from`, `date_to`: Date range filter

**Response** (200 OK):
```json
{
  "matches": [
    {
      "id": "match-uuid",
      "team1": "Arsenal FC",
      "team2": "Chelsea FC",
      "scoreA": 2,
      "scoreB": 1,
      "status": "completed",
      "matchDate": "2026-03-08",
      "matchTime": "14:00",
      "venue": "Emirates Stadium",
      "tournament": "Spring Cup 2026",
      "tournamentId": "tournament-uuid",
      "primaryScorer": {
        "user_id": "user-uuid",
        "name": "John Doe"
      },
      "created_at": "2026-03-08T10:00:00Z"
    }
  ],
  "total": 100
}
```

---

### 5.2 Get Match by ID

**Endpoint**: `GET /matches/:id`

**Response** (200 OK):
```json
{
  "id": "match-uuid",
  "team1": "Arsenal FC",
  "team2": "Chelsea FC",
  "team1Id": "team-uuid-1",
  "team2Id": "team-uuid-2",
  "matchFormat": "single",
  "duration": 45,
  "venue": "Emirates Stadium",
  "playersPerTeam": 7,
  "tournament": "Spring Cup 2026",
  "tournamentId": "tournament-uuid",
  "tournamentStage": "round-robin",
  "scoringLevel": "advanced",
  "owner_user_id": "user-uuid",
  "primaryScorer": {
    "user_id": "user-uuid",
    "name": "John Doe"
  },
  "secondaryScorer": null,
  "responsibilityType": null,
  "teamScorerMapping": null,
  "eventScorerMapping": null,
  "scoreA": 2,
  "scoreB": 1,
  "status": "completed",
  "startTime": "2026-03-08T14:00:00Z",
  "matchDate": "2026-03-08",
  "matchTime": "14:00",
  "endTime": "2026-03-08T14:45:00Z",
  "squad1": [
    {
      "id": "player-uuid",
      "name": "John Doe",
      "position": "Forward",
      "jerseyNumber": "9",
      "status": "starting"
    }
  ],
  "squad2": [...],
  "events": [
    {
      "id": "event-uuid",
      "type": "goal",
      "team": "team1",
      "player": {
        "id": "player-uuid",
        "name": "John Doe"
      },
      "minute": 23,
      "timestamp": "2026-03-08T14:23:00Z",
      "recorded_by": "user-uuid",
      "details": {
        "goalType": "open-play",
        "assistedBy": {
          "id": "player-uuid-2",
          "name": "Jane Smith"
        }
      }
    }
  ],
  "paymentPerPlayer": 100,
  "treasurer": {
    "id": "player-uuid",
    "name": "John Doe"
  },
  "playerPayments": [
    {
      "playerId": "player-uuid",
      "playerName": "John Doe",
      "teamName": "Arsenal FC",
      "amount": 100,
      "paid": true,
      "paidAt": "2026-03-08T15:00:00Z"
    }
  ],
  "created_by": "user-uuid",
  "created_at": "2026-03-08T10:00:00Z",
  "shared": true,
  "sharedAt": "2026-03-08T15:30:00Z"
}
```

---

### 5.3 Create Match

**Endpoint**: `POST /matches`

**Headers**:
```http
Authorization: Bearer {userAccessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "team1": "Arsenal FC",
  "team2": "Chelsea FC",
  "team1Id": "team-uuid-1",
  "team2Id": "team-uuid-2",
  "matchFormat": "single",
  "duration": 45,
  "venue": "Emirates Stadium",
  "playersPerTeam": 7,
  "tournamentId": "tournament-uuid",
  "tournamentStage": "round-robin",
  "scoringLevel": "advanced",
  "primaryScorer": {
    "user_id": "user-uuid",
    "name": "John Doe"
  },
  "secondaryScorer": null,
  "responsibilityType": null
}
```

**Response** (201 Created):
```json
{
  "id": "new-match-uuid",
  "team1": "Arsenal FC",
  "team2": "Chelsea FC",
  "owner_user_id": "current-user-uuid",
  "created_at": "2026-03-08T10:30:00Z",
  "message": "Match created successfully"
}
```

---

### 5.4 Update Match

**Endpoint**: `PUT /matches/:id`

**Request Body** (partial update):
```json
{
  "squad1": [...],
  "squad2": [...],
  "status": "live",
  "matchDate": "2026-03-08",
  "matchTime": "14:00",
  "events": [
    {
      "id": "event-uuid",
      "type": "goal",
      "team": "team1",
      "player": {...},
      "minute": 23,
      "timestamp": "2026-03-08T14:23:00Z",
      "recorded_by": "user-uuid",
      "details": {...}
    }
  ],
  "scoreA": 1,
  "scoreB": 0
}
```

**Response** (200 OK):
```json
{
  "id": "match-uuid",
  "scoreA": 1,
  "scoreB": 0,
  "events": [...],
  "updated_at": "2026-03-08T14:23:00Z",
  "message": "Match updated successfully"
}
```

**Errors**:
- `403`: Forbidden (not owner or assigned scorer)

---

### 5.5 Delete Match

**Endpoint**: `DELETE /matches/:id`

**Response** (200 OK):
```json
{
  "message": "Match deleted successfully"
}
```

**Errors**:
- `403`: Forbidden (not owner)
- `409`: Conflict (match has recorded events, requires confirmation)

---

## 6. Sync Endpoints

### 6.1 Batch Sync

**Endpoint**: `POST /sync/batch`

**Purpose**: Sync multiple entities in one request

**Headers**:
```http
Authorization: Bearer {userAccessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "players": [
    {
      "id": "player-uuid",
      "action": "update",
      "data": {...}
    }
  ],
  "teams": [...],
  "tournaments": [...],
  "matches": [
    {
      "id": "match-uuid",
      "action": "update",
      "data": {...}
    }
  ]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "synced": {
    "players": 2,
    "teams": 1,
    "tournaments": 0,
    "matches": 3
  },
  "errors": []
}
```

---

### 6.2 Get Sync Status

**Endpoint**: `GET /sync/status`

**Response** (200 OK):
```json
{
  "lastSync": "2026-03-08T10:30:00Z",
  "pendingSync": {
    "players": 0,
    "teams": 0,
    "tournaments": 0,
    "matches": 2
  },
  "status": "synced"
}
```

---

## 7. Error Handling

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Team names must be different",
    "details": {
      "field": "team2",
      "value": "Arsenal FC"
    }
  }
}
```

### Common Error Codes
| Code | HTTP Status | Description |
|------|------------|-------------|
| VALIDATION_ERROR | 400 | Invalid input data |
| UNAUTHORIZED | 401 | Missing or invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource conflict (duplicate, constraint violation) |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

---

## 8. Rate Limiting

**Limits**:
- Anonymous requests: 60 requests/minute
- Authenticated requests: 300 requests/minute

**Headers**:
```http
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 250
X-RateLimit-Reset: 1678276800
```

**Rate Limit Exceeded Response** (429):
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 60
  }
}
```

---

## 9. Pagination

**Query Parameters**:
- `limit`: Number of results per page (max: 100, default: 50)
- `offset`: Number of results to skip (default: 0)

**Response**:
```json
{
  "data": [...],
  "pagination": {
    "total": 250,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

---

## 10. API Usage Examples

### Create Match with Dual Scorers
```javascript
const response = await fetch(`${baseUrl}/matches`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    team1: 'Arsenal FC',
    team2: 'Chelsea FC',
    duration: 45,
    venue: 'Emirates Stadium',
    playersPerTeam: 7,
    scoringLevel: 'advanced',
    primaryScorer: {
      user_id: 'user-1-uuid',
      name: 'John Doe'
    },
    secondaryScorer: {
      user_id: 'user-2-uuid',
      name: 'Jane Smith'
    },
    responsibilityType: 'team',
    teamScorerMapping: {
      team1: 'user-1-uuid',
      team2: 'user-2-uuid'
    }
  })
});

const data = await response.json();
console.log(data);
```

### Record Match Event
```javascript
// Get current match
const match = JSON.parse(localStorage.getItem('vscor_matches'))
  .find(m => m.id === matchId);

// Add event
const newEvent = {
  id: generateUniqueId(),
  type: 'goal',
  team: 'team1',
  player: {
    id: 'player-uuid',
    name: 'John Doe'
  },
  minute: 23,
  timestamp: new Date().toISOString(),
  recorded_by: currentUser.user_id,
  details: {
    goalType: 'open-play',
    assistedBy: {
      id: 'player-2-uuid',
      name: 'Jane Smith'
    }
  }
};

match.events.push(newEvent);
match.scoreA++;

// Update locally
localStorage.setItem('vscor_matches', JSON.stringify(matches));

// Sync to cloud
await fetch(`${baseUrl}/matches/${matchId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    events: match.events,
    scoreA: match.scoreA,
    scoreB: match.scoreB
  })
});
```

---

**End of API Structure Document**
