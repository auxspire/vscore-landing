1️⃣ Follow Feature for Team Profiles

Add a Followers element in the Team Profile Page header.

The element should display:

Total Followers Count

A Follow button (+)

Example layout:

Team Logo
Team Name

Followers: 245    [+]
Follow Button Behavior

Clicking + allows the user to follow the team.

After following:

The button changes to Following or ✓

Followers count increases by 1.

Rules

A user cannot follow the same team multiple times.

If already following:

Show Following state.

Optionally allow Unfollow functionality.

2️⃣ Follow Feature for Tournament Profiles

Add the same Followers element in the Tournament Profile Page header.

Example layout:

Tournament Logo
Tournament Name

Followers: 510    [+]
Follow Button Behavior

Clicking + makes the user follow the tournament.

After following:

Button changes to Following

Followers count increases.

Rules

Prevent duplicate follows.

Allow unfollow (optional).

3️⃣ Data Model

The system should support following for multiple entity types.

Example structure:

Followers Table
followers
---------
id
user_id
entity_type   (player / team / tournament)
entity_id
followed_at

Each entity should maintain:

followers_count

4️⃣ UI Consistency

Ensure the Follow UI pattern is consistent across all profiles:

Player Profile

Team Profile

Tournament Profile

The layout, button style, and interaction behavior should remain the same.

5️⃣ Future Extensions (Design Consideration)

The follow system should support future features such as:

Activity feed

Notifications when followed entities play matches

Match result alerts

Tournament updates

Expected Outcome

After implementation:

Users can follow players, teams, and tournaments.

Profiles display follower counts.

Users can track entities they care about.

The foundation for a social layer in VScor is established.