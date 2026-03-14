---
name: release
description: Build, commit, push, and verify FlipTrack deploy to GitHub Pages. Use when the user says "release", "deploy", or "ship it".
disable-model-invocation: true
---

# FlipTrack Release Workflow

Execute the full release pipeline for FlipTrack. Refer to `CLAUDE.md` in the repo root for project conventions and rules.

## Steps

1. **Build** — Run `npx vite build` and verify no errors
2. **Check changes** — Run `git status` and `git diff --stat` to see what changed
3. **Stage** — Stage all changed source files: `src/`, `public/`, `app.html`, `index.html`, and any new `.html` or `.docx` files. Do NOT stage `dist/` (it's gitignored; GitHub Actions builds it)
4. **Commit** — Create a descriptive commit message summarizing the changes. Show the user the commit message before committing.
5. **Push** — Push to `origin/master`
6. **Verify** — Check deploy status with `gh run list --limit 1 --workflow deploy.yml` (if gh is available)
