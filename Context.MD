# OmniVault Context Log

## 2026-01-26
- Ran the FastAPI server; port 8000 was in use, used 8001 then stopped it.
- Installed Git (via winget) and configured repo with a separate `.gitstore/`.
- Initialized Git repo, added remote, created initial commit, pushed to GitHub.
- Added `.gitignore` to exclude `.venv/` and `.gitstore/`.
- Created `AGENTS.md`, `Context.MD`, and `README.md`.
- Expanded `AGENTS.md` with safety, setup/build guidance, and credential cautions.
- Added new TODO sections for performance, rich content support, and smart UX auto-detect.
- Committed and pushed TODO updates to GitHub.

## 2026-01-27
- Ran `git status -sb` to review current changes before preparing a new commit.
- Created branch `feature/claude-support` for the Claude support work.
- Will commit Claude support + PDF proxy + font fixes changes (including `chat_export.pdf`) under a single feature commit.
- Pushed branch `feature/claude-support` to GitHub after enabling network access.
- Added `TODO.md` to track the Claude PDF download CSP fix and test checklist.

## 2026-01-30
- Read `TODO.md` to verify current tasks before updating it.
- Updated `TODO.md` to mark Performance Optimization as done and summarize the Smart Waiter improvements.
- Ran `git status -sb` to check current modified files before committing.
- Staged all changes with `git add -A` before committing.
- Re-staged all changes with `git add -A` after updating `Context.MD`.
