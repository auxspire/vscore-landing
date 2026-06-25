You are a senior product architect and technical product manager.

Based on everything that has been discussed and designed so far for VScor, create a complete Product Requirements Document (PRD) that can be used by an AI app builder like Lovable to generate the application.

The PRD should reflect the entire vision, architecture, workflows, and design philosophy of the VScor platform.

You should assume the following scope:

Think through every part of the product, including:

Every screen

Every component

Every workflow

Every user interaction

Data architecture

Permissions

Ownership model

Match scoring logic

Tournament management system

Player and team profile systems

Sync architecture (local + cloud)

Authentication system

Design philosophy

Edge case handling

Validation rules

Offline-first design principles

Do not produce a short summary. Produce a complete PRD suitable for engineering implementation.

The PRD must include the following sections
1. Product Vision

What VScor is

Target users

Core problems it solves

Long-term vision

2. Design Philosophy

Explain the guiding principles of the product, including:

Offline-first architecture

Simplicity for grassroots football

Real-time match digitization

Minimal friction for scorers

Transparency and ownership of data

Flexible tournament management

3. User Roles and Permissions

Define all roles and what they can do:

Examples:

App user

Profile owner

Team coordinator

Tournament coordinator

Match owner

Scorer

Include:

Viewing permissions

Editing permissions

Ownership transfer rules

4. Authentication System

Describe:

Google authentication

User ID generation

User profile creation

Action tracking (created_by, updated_by)

Account verification logic

5. Data Architecture

Explain the core data entities such as:

Users

Players

Teams

Tournaments

Tournament teams

Matches

Match events

Fixtures

Standings

Scoring assignments

Include relationships between them.

6. Offline-First Data Storage and Sync

Explain:

Local storage usage

Master cloud database

Sync mechanism

Conflict resolution

Sync triggers

Data integrity rules

7. Core Modules of the App

Describe each module in detail:

Login & Onboarding
Player Profiles
Team Profiles
Tournament Management
Fixture Generation
Match Creation
Match Scoring System
Scorer Assignment
Tournament Standings
Info Tab (Public Viewing)
8. Match Scoring System

Explain the full scoring architecture:

Basic scoring level

Intermediate scoring level

Advanced scoring level

Event tracking system

Multi-scorer mode

Event responsibilities

Match ownership rules

9. Tournament System

Explain:

Tournament creation

Format types

Group logic

Knockout logic

Round robin logic

Fixture generation

Fixture publishing

Tournament editing flexibility

10. Ownership Model

Explain ownership rules for:

Player profiles

Team profiles

Tournament profiles

Matches

Include coordinator logic.

11. UI Architecture

List major screens such as:

Login screen

Home dashboard

Info tab

Player profile

Team profile

Tournament profile

Match screen

Scoring screen

Explain component structure where relevant.

12. Edge Case Handling

Describe how the system should handle situations like:

Team withdrawal

Team addition mid-tournament

Editing tournament structure

Duplicate team IDs

Fixture regeneration

Data conflicts

13. Validation Rules

Explain system safeguards such as:

Maximum teams validation

Duplicate prevention

Ownership verification

Fixture integrity

14. Design System

Describe:

UI consistency

Minimalistic scoring interface

Mobile-first design

High-speed event entry

15. Future Scalability

Explain future expansions such as:

Multi-device scoring

Live match tracking

Advanced analytics

League ecosystems

Federation-level tournaments

Output Format

The output must be:

Structured

Clear

Hierarchical

Ready to be used as a development blueprint

Avoid vague descriptions.