---
description: Run every Cosmic Playground gate in order and report each exit code
argument-hint: "[lint|typecheck|unit|build|e2e ...]"
---

Use the `cosmic-verification` skill.

Run `corepack pnpm gates $ARGUMENTS` in the background (it must be the only Playwright run in progress) and
wait for it to finish. Report the gate summary exactly as printed, plus the E2E passed / failed / skipped
counts and the names of any failing tests. Do not describe a failed or skipped gate as passing.
