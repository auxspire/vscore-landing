🎯 Objective

Investigate and resolve a serious data integrity issue where different teams are being assigned the same Team ID, causing incorrect add/remove behavior in tournaments.

📌 Observed Behavior
1️⃣ Add Team Issue

When adding 1 team to a tournament:

2 teams are getting added

These teams:

Have different team names

Have different player lists

But share the same team_id

2️⃣ Delete Team Issue

When attempting to delete one of those teams:

Both teams are removed simultaneously

Because they share the same team_id

🔎 Root Cause Observation

From console inspection:

Two distinct team objects

Different names

Different players

Same team_id

This indicates:

ID generation bug

Improper cloning of objects

State mutation issue

Or sync duplication overwriting ID

🧪 Required Investigation Areas
1️⃣ Team ID Generation Logic

Is UUID generation happening correctly?

Is ID being generated:

On team creation?

Or reused accidentally?

Is there any hardcoded or cached ID?

2️⃣ Object Copy / Clone Logic

When duplicating team structure:

Is ID being copied instead of regenerated?

Are we spreading objects like:

{...team}

without removing old ID?

3️⃣ Local Storage Handling

Is team object being stored twice with same ID?

Is an update operation overwriting instead of creating new record?

4️⃣ Sync Layer (If Enabled)

Is cloud sync duplicating entries?

Is local rehydration reusing ID improperly?

5️⃣ Tournament-Team Mapping Table

Are two entries referencing the same team_id?

Is duplicate mapping allowed without constraint?

🛑 Immediate Fix Requirements

Enforce strict uniqueness for team_id

Ensure every new team creation generates a new UUID

Add validation:

Before saving a team, check if ID already exists

Add database-level unique constraint (if using backend)

Prevent duplicate tournament_id + team_id combinations

📌 Expected Correct Behavior

Adding 1 team → exactly 1 new team record

Each team → unique team_id

Deleting 1 team → only that specific team removed

No shared IDs across different team objects

⚠️ Priority

Very High – This compromises:

Tournament integrity

Fixture generation

Standings

Sync reliability

Overall data trustworthiness