A user logged into the app and created a match, but during match setup selected another user as the scorer.

However, the following incorrect behaviors were observed:

1️⃣ Unauthorized Scoring

The match creator (current user) was still able to record match events even though they were not assigned as the scorer.

A third user who was not assigned as a scorer was also able to continue scoring events.

This indicates that scorer permission validation is not being enforced correctly.

2️⃣ Data Inconsistency Between Devices

Multiple users attempted to score the same match from different devices.

Because of this:

Each device was refreshing and loading different versions of match data

Match events were being recorded inconsistently

Conflicting updates were being written to the database

This suggests problems in:

Permission validation

State synchronization

Conflict resolution logic

Expected Behavior

The system should enforce the following rules:

Scoring Permissions

Only the following users should be allowed to record match events:

Assigned Primary Scorer

Assigned Secondary Scorer (if advanced scoring is enabled)

Other users should:

Only view match progress

Not see scoring buttons

Not be able to submit match events

Match Owner Permissions

The Match Owner (user who created the match):

Can edit match configuration

Can assign or change scorers

Can transfer match ownership

Can calculate match payment

But the owner should not automatically have scoring permission unless explicitly assigned as a scorer.

Required Fixes
1️⃣ Enforce Scorer Authorization

Before accepting any match event submission:

Validate:

current_user_id ∈ assigned_scorer_ids

If not:

Reject the request.

2️⃣ Restrict UI Controls

Only assigned scorers should see:

Event buttons

Scoring interface

Event editing controls

All other users should see view-only match interface.

3️⃣ Fix Multi-Device Sync Issues

Investigate problems with:

Device refresh behavior

Event duplication

Out-of-order event writes

Data overwrites

Implement safeguards such as:

Event ID uniqueness

Server timestamp ordering

Conflict detection

Event versioning

4️⃣ Ensure Consistent Match State

When multiple devices access the same match:

All devices must load the latest match state

Events must be synchronized reliably

Duplicate events must be prevented

Expected Outcome

After fixes:

Only authorized scorers can record events

Unauthorized users cannot modify match data

Multi-device scoring does not corrupt match data

Database remains consistent across devices

Priority

This is a high priority issue because it affects:

Data integrity

Match accuracy

Trust in the scoring system

Multi-user match operation reliability