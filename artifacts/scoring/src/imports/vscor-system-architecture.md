Design a complete system architecture diagram for VScor.

The architecture should illustrate how all major layers of the system interact.

Include the following components:

Client Layer

Mobile application including:

Login

Player profiles

Team profiles

Tournament management

Match creation

Scoring interface

Info tab browsing

State & Data Layer

Local storage (offline-first design)

App state management

Sync queue

Sync Layer

Local-to-cloud synchronization

Conflict resolution

Retry logic for failed sync operations

Backend Services

Authentication service

User management

Tournament service

Match service

Event logging service

Database Layer

Master database

Tables such as:

Users

Players

Teams

Tournaments

Matches

Match events

Fixtures

Standings

External Services

Google Authentication

Cloud storage / database service

The architecture diagram should clearly show:

Data flow

Authentication flow

Match event recording flow

Sync process between local storage and cloud database

Represent the architecture using clear ASCII diagrams or structured diagrams.