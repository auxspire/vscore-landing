🎯 Objective

Enhance the New Match Screen by introducing:

Scorer assignment system

Optional dual-scorer support in Advanced scoring level

Clear division of scoring responsibilities

Match ownership control and permissions

This ensures structured match management and accountability in scoring operations.

1️⃣ Match Ownership
Default Match Owner

The user who creates the match automatically becomes the Match Owner.

Owner Permissions

Only the Match Owner can:

Edit match details

Modify match configuration

Assign or change scorers

Edit match settings

Calculate and manage match payment

Transfer match ownership

Other users can:

View match details

Record events only if assigned as scorers

Ownership Transfer

Match ownership can be changed after the match is created.

Provide an option in Match Options / Settings:

“Transfer Match Ownership”

Rules:

Only the current owner can transfer ownership

Ownership can be transferred only to:

Registered users in the app

Preferably one of the assigned scorers or coordinators

2️⃣ Primary Scorer Selection

Add a field in New Match Screen:

Primary Scorer

Default value:

The logged-in user creating the match

User can change the scorer.

Scorer Selection Input

The scorer selection input must:

Allow searching users in the app

Show suggestions dynamically as the user types

Display user details such as:

Name

Profile picture (if available)

Email or phone number

This should work similar to a profile search / mention system.

3️⃣ Scoring Level Integration

The match already supports three scoring levels:

Basic

Intermediate

Advanced

Scorer Rules by Scoring Level

Basic

Only one scorer

No additional scorer option shown

Intermediate

Only one scorer

No second scorer option

Advanced

Enable option to add a Second Scorer

4️⃣ Second Scorer (Advanced Mode Only)

When Scoring Level = Advanced:

Show field:

Second Scorer

Uses the same user search input

Must select another registered user

5️⃣ Scorer Responsibility Division (Advanced Mode)

When two scorers are assigned, the system must require responsibility allocation.

Provide two options:

Option A – Divide by Teams

Each scorer records events for one team.

Example:

Scorer 1 → Team A
Scorer 2 → Team B

Each scorer logs all events for their assigned team.

Option B – Divide by Event Types

Events are split between scorers.

Scorer 1 records:

Goals

Shots on Target

Shots Off Target

Fouls

Scorer 2 records:

Interceptions

Offside

Substitutions

Corners

This allows parallel scoring without event overlap.

6️⃣ Validation Rules

If Scoring Level = Advanced and Second Scorer is enabled:

System must ensure:

Two scorers are selected

Responsibility division is selected

Team/event assignments are configured

Prevent match creation if configuration is incomplete.

7️⃣ Match Metadata Storage

Each match record must store:

owner_user_id
primary_scorer_user_id
secondary_scorer_user_id
scoring_level (basic / intermediate / advanced)
responsibility_type (team / event)

If team-based assignment:

team_scorer_mapping

If event-based assignment:

event_scorer_mapping
8️⃣ Permissions During Match
Role	Permissions
Match Owner	Full control
Assigned Scorers	Record events
Other Users	View only

Only the Match Owner can:

Edit match configuration

Change scorers

Transfer ownership

Calculate match payment