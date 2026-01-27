# OmniVault Context Log

## 2026-01-26
- Ran the FastAPI server; port 8000 was in use, used 8001 then stopped it.
- Installed Git (via winget) and configured repo with a separate `.gitstore/`.
- Initialized Git repo, added remote, created initial commit, pushed to GitHub.
- Added `.gitignore` to exclude `.venv/` and `.gitstore/`.
- Created `AGENTS.md`, `Context.MD`, and `README.md`.
- Expanded `AGENTS.md` with safety, setup/build guidance, and credential cautions.

## 2026-01-27
- Ran `git status -sb` to review current changes before preparing a new commit.
- Created branch `feature/claude-support` for the Claude support work.
- Will commit Claude support + PDF proxy + font fixes changes (including `chat_export.pdf`) under a single feature commit.
