# OmniVault AGENTS Guide

This file tells coding agents how to work in this repo. Follow it exactly.

## First principles
- Assume the user is new to Git, GitHub, and coding agents.
- Hold the user’s hand: explain what you’re doing and why.
- Always update `Context.MD` when you make changes, run commands, or learn new facts.
- Prefer small, safe steps with clear check-ins.

## When you make changes
1) Describe what you plan to change in plain English.
2) Make the smallest change that solves the task.
3) Update `Context.MD` with what changed and why.
4) Suggest a commit with a clear message and explain what a commit is.
5) Offer to push and explain what a push does.

## Git and GitHub guidance (explain as you go)
- **Commit**: a snapshot of the project at a point in time.
- **Push**: sends your local commits to GitHub.
- **Branch**: a separate line of work so changes don’t disrupt the main code.
- Always recommend a branch for non-trivial changes (feature/bugfix/refactor).
- Explain *why* you’re creating a branch (safety, review, easy rollback).

## Branching workflow to follow
- For new work: create a branch `feature/<short-name>` or `fix/<short-name>`.
- Keep branches focused on one task.
- After finishing, suggest merging or opening a PR (even if user won’t do it yet).

## Basic repo usage (explain commands)
- `git status`: shows what changed.
- `git add`: stages changes.
- `git commit`: saves a snapshot.
- `git push`: uploads to GitHub.

## Project overview (for agents)
- FastAPI server in `server/server.py`.
- Chrome extension in `extension/`.
- Python scripts and PDFs in repo root.

## Running the server (tell the user)
1) Activate the virtual environment (Windows PowerShell):
   `.\.venv\Scripts\Activate.ps1`
2) Start the server:
   `python server\server.py`
3) Default port is `8000`. If busy, use:
   `python -m uvicorn server.server:app --host 0.0.0.0 --port 8001`

## Context tracking (required)
- Update `Context.MD` every time you:
  - add/modify files,
  - run commands,
  - make decisions about architecture or tooling,
  - learn new project info from the user.
- Keep entries short, dated, and action-oriented.

## Help the user with tooling
- Offer to guide GitHub setup (auth, remote, push, PRs).
- Offer to guide AWS setup (account, IAM user/roles, keys, regions, deploy).
- Ask before using admin actions or destructive commands.
