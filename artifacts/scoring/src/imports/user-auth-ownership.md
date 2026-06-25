🎯 Objective

Implement real Google Authentication and introduce a User Identity + Ownership Control System across Players, Teams, and Tournaments.

This system will:

Create a unique user identity

Track all user actions

Enforce profile-level ownership permissions

Allow controlled multi-admin access where applicable

1️⃣ Implement Real Google Authentication
Requirement

On the Login Screen:

Replace mock Google login with real Google OAuth authentication

After successful login:

Generate or retrieve a unique internal user_id

Store in:

Master Users table

Local storage (for session persistence)

User Table Requirements

Each user record must include:

user_id (UUID – internal unique ID)

google_id

email

mobile_number (optional, verifiable)

display_name

profile_photo

created_at

is_verified (email/phone verification status)

2️⃣ Action Tracking System

Every entity created in the app must store:

created_by → user_id

updated_by → user_id

created_at

updated_at

This applies to:

Players

Teams

Tournaments

Matches

This enables:

Audit tracking

Ownership validation

Future moderation features

3️⃣ Ownership & Edit Permission Rules
🔹 A. Player Profile Ownership

Initially:

The user who creates the player profile becomes the temporary owner

After verification:

If the player’s mobile number or email is verified,

That verified user becomes the permanent owner

Only the profile owner can:

Edit player details

Update stats (manual)

Modify profile information

All users can:

View player profile via Info Tab

🔹 B. Team Profile Ownership
Initial Ownership:

The user who creates the team becomes the temporary owner

Team Coordinator System:

A team can have up to 3 coordinators

One coordinator must be:

The original creator

Once a coordinator’s phone/email is verified:

That verified coordinator becomes an official team owner

Editing Rights:

Only coordinators (owners) can:

Edit team details

Add/remove players

Update team information

All users can:

View team profile

🔹 C. Tournament Profile Ownership

The user who creates the tournament:

Automatically becomes one of the owners

A tournament can have:

Up to 3 coordinators (owners)

Editing rights restricted to:

Tournament coordinators only

Viewing rights:

All users can view tournament via Info tab

4️⃣ Visibility vs Edit Permissions
Viewing Permissions

Every authenticated user can:

View all:

Players

Teams

Tournaments

Through the Info Tab

Editing Permissions

Restricted to:

Profile owners

Verified coordinators (where applicable)

Non-owners must:

See content in read-only mode

Not see edit buttons

5️⃣ Ownership Transfer Logic

When verification happens:

System must:

Check if verified email/phone matches existing user

Transfer ownership accordingly

Prevent duplicate ownership conflicts

Ownership transfer must:

Not delete historical created_by data

Only update owner_user_id or coordinator_list

6️⃣ Database Structure Suggestion

Each entity must include:

owner_user_ids: array
created_by: user_id
updated_by: user_id

For Teams & Tournaments:

coordinator_user_ids: array (max 3)
7️⃣ Security & Integrity Requirements

Edit access must be enforced:

Backend-side (not UI-only restriction)

Prevent manual manipulation via API

Validate ownership before allowing update/delete operations

8️⃣ Expected Outcome

Every action tied to a verified user

Controlled editing permissions

Multi-admin support for teams and tournaments

Public viewing, restricted editing

Foundation ready for:

Public leaderboards

Verified players

Club hierarchies

Advanced role systems