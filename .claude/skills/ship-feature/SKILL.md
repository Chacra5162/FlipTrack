---
name: ship-feature
description: End-to-end feature pipeline — scaffold a new FlipTrack feature module, update docs, build, commit, push, and deploy. Use when user says "ship a feature", "build and deploy a feature", or "new feature and release".
---

# Ship Feature — Scaffold + Release Pipeline

This skill chains the **new-feature** scaffold workflow with the **release** deploy workflow into a single end-to-end pipeline.

## Required Input
- **Feature name** (kebab-case, e.g., `price-alerts`)
- **Description** of what the feature does
- **Tier** (free/pro/unlimited) — determines which Vite chunk it belongs to

## Phase 1 — Scaffold

Execute all steps from the `/new-feature` skill (steps 1–8). This includes module creation, main.js wiring, CSS, HTML, tour step, user guide update, and build verification.

## Gate — User Confirmation

Before moving to Phase 2, **pause and ask the user** to review the scaffolded code. Only proceed to release after they confirm.

## Phase 2 — Release

Execute all steps from the `/release` skill (steps 1–6). This includes build, check changes, stage, commit, push, and deploy verification.

Refer to `CLAUDE.md` in the repo root for project conventions and rules.
