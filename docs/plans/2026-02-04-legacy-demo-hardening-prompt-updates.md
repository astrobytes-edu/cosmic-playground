# Legacy Demo Hardening Prompt & Guidance Updates Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update repo guidance files to include legacy demo path and new hardening directive, and produce a clean handoff prompt for a new session.

**Architecture:** This is documentation-only. No runtime code changes; update `AGENTS.md` and `CLAUDE.md` with a legacy-path note and hardening directive, then draft a session prompt for the user.

**Tech Stack:** Markdown docs in repo root.

### Task 1: Update `AGENTS.md` with legacy path and hardening directive

**Files:**
- Modify: `AGENTS.md`

**Step 1: Identify best insertion point for guidance**

**Step 2: Add legacy path `~/Teaching/astr101-sp26/demos/`**

**Step 3: Add prompt note about refactoring/hardening migrated demos starting with moon phases**

**Step 4: Commit**

Run: `git add AGENTS.md`  
Run: `git commit -m "docs: add legacy demo path and hardening directive"`

### Task 2: Update `CLAUDE.md` with legacy path and hardening directive

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Identify best insertion point for guidance**

**Step 2: Add legacy path `~/Teaching/astr101-sp26/demos/`**

**Step 3: Add prompt note about refactoring/hardening migrated demos starting with moon phases**

**Step 4: Commit**

Run: `git add CLAUDE.md`  
Run: `git commit -m "docs: add legacy demo path and hardening directive to Claude guide"`

### Task 3: Provide new-session handoff prompt text

**Files:**
- None (response text only)

**Step 1: Draft concise prompt with priorities and demo audit checklist**

**Step 2: Include legacy path and starting demo**

**Step 3: Provide suggested verification commands**

**Step 4: Confirm with user**

