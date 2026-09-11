# Cosmic Playground — agent instructions

All agent instructions for this repo live in [CLAUDE.md](CLAUDE.md). Read it in full before doing
anything; it is the single source of truth for every agent (Claude, Codex or any other).

This file exists only because some tools look for `AGENTS.md` by name. Do not add instructions
here — edit `CLAUDE.md`.

<!-- brain-status-convention -->
## Brain status updates
When you make notable progress, hit a blocker, or set the next action, update this repo's `STATUS.md` (`next:` / `blocker:` / `due:` lines) — the brain pulls it into the portfolio dashboard + standup via `federate.py` (see `~/brain/work/meta/status-convention.md`). Brain stays pull-only: never hand-edit `~/brain`; capture events with `brain "…"`.
