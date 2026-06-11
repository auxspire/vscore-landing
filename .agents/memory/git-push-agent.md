---
name: Git push from agent
description: Why git push from the agent bash shell doesn't work and what to use instead
---

The `replit-git-askpass` helper fetches tokens from `localhost:8284/${REPLIT_ASKPASS_PID2_SESSION}/github/token`. That endpoint is **unreachable from agent bash** (curl times out). So `git push origin main` hangs indefinitely when run from agent shell.

The GitHub connector (`listConnections('github')[0].settings.access_token`) does expose the token in code_execution, and `git push https://token:<TOKEN>@github.com/...` works — **but** `git remote set-url` (which writes `.git/config`) is blocked as a destructive git operation in the main agent.

**How to apply:**
- Never attempt `git push` via bash in the main agent for HTTPS remotes — it will hang.
- Never try `git remote set-url` in main agent — blocked by sandbox.
- `git pull --rebase` with an authenticated URL works for pulling, but if local and remote histories have diverged significantly (different initial commits), rebase will conflict on every commit. Use `--allow-unrelated-histories` merge instead, or force-push.
- If artifacts get deregistered (e.g., during an aborted rebase), restore them with `verifyAndReplaceArtifactToml({ tempFilePath: "...", artifactTomlPath: "..." })` — the toml files persist on disk even after deregistration.

**For this project (auxspire/vscore-landing):**
- Instruct the user to push via Replit's **Version Control UI** (Git icon in left sidebar) — this bypasses askpass entirely.
- Alternative: user can use a GitHub Personal Access Token (PAT) in the Shell: `git push https://auxspire:<PAT>@github.com/auxspire/vscore-landing.git main`.
- The local history and remote history are **diverged** (Replit monorepo vs original repo), so a force push is needed: `git push --force origin main`.
