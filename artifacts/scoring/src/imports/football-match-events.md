Design a comprehensive data model for football match events that supports advanced analytics in VScor.

The model should support:

Real-time match scoring

Player performance tracking

Match analytics

Tournament statistics

Future machine-learning or analytics features

Define the core event structure, including fields such as:

Event ID

Match ID

Team ID

Player ID

Event type

Event timestamp

Match minute

Scorer ID (user recording the event)

Additional metadata

Event Categories

Define a structured taxonomy for all match events.

Goal Events

Goal

Penalty Goal

Own Goal

Assist

Shooting Events

Shot on Target

Shot off Target

Blocked Shot

Defensive Events

Save

Block

Interception

Clearance

Discipline Events

Foul

Yellow Card

Red Card

Match Management Events

Substitution

Corner

Offside

Kick-off

Half-time

Full-time

Event Metadata

Include additional contextual data such as:

Event location on pitch (optional future feature)

Event sequence number

Event confidence level

Event created_by (user ID)

Event created_at timestamp

Analytics Support

Ensure the event model supports calculation of:

Goals

Assists

Shot accuracy

Player impact rating

Team attacking statistics

Defensive contributions

Match influence metrics

Output Requirements

The output must include:

A clear system architecture diagram

A detailed event data model

Explanation of how the event model supports analytics and statistics

Structured formatting suitable for use in technical documentation or AI app builders

Avoid vague descriptions and focus on technical clarity and implementation readiness.