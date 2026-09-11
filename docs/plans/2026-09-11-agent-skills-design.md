# Agent skills, roles and hooks for Claude and Codex — design

Date: 2026-09-11. Status: approved by Anna.

## Problem

The 14 `cosmic-*` skills lived only in `~/.codex/skills/`:

- Claude reads `~/.claude/skills` and `.claude/skills`, so it never saw them. Current Codex documents
  `.agents/skills` (repo) and `~/.agents/skills` (user), so Codex may not have loaded them either.
- Unversioned, so no history and nothing for collaborators.
- Stale advice that had already caused defects: server-side GET filtering under `output: "static"`
  (the inert Explore filters), `@cosmic/renderer` (does not exist), `instrument` shell (unused),
  client-only KaTeX (Markdown math is now build-time), a mandatory export matrix that does not
  exist, Unicode `L/L⊙` in UI labels (contradicts the KaTeX-never-Unicode rule).
- Heavy duplication (base-path rules in 7 skills, D/d in 8) and four overlapping UI skills.
- Nothing on the failures that actually cost time this month: collection errors passing as RED,
  tests encoding defects, `scrollWidth` vs real scroll, `1fr` min-content, SVG orbit chirality,
  symmetric-point physics tests, concurrent Playwright runs, status/readiness coupling.

## Decisions

1. **Repo-canonical, thin wrappers per agent.** Skills in `.agents/skills/` (Codex's repo path);
   `.claude/skills` is a symlink to it. One copy, versioned with the code.
2. **Consolidate 14 → 9 skills**, with shared `references/invariants.md`:
   `cosmic-site-content`, `cosmic-instructor-materials`, `cosmic-ui`, `cosmic-demo-contracts`,
   `cosmic-physics`, `cosmic-a11y`, `cosmic-verification`, `cosmic-readiness`,
   `cosmic-adversarial-review` (new).
3. **Four read-only reviewer roles**, written once in `.agents/roles/<role>.md`, wrapped by
   `.claude/agents/<role>.md` and `.codex/agents/<role>.toml`: `physics-reviewer`,
   `adversarial-reviewer`, `visual-ux-reviewer`, `readiness-auditor`. One at a time.
4. **Hooks written once** in `scripts/agent-hooks/`, wired from `.claude/settings.json` and
   `.codex/hooks.json` (same event names and JSON contract in both):
   - PostToolUse on edits: run the math validator, report violations for the edited file.
   - PreToolUse on shell: block `git add -A`/`.`, staging `.gitignore`, force push, `--no-verify`,
     and a second Playwright run while one is running.
   - Stop: remind to update STATUS.md when source changed and it did not.
5. **Commands** (Claude): `cp-gates`, `cp-audit-demo`, `cp-promote`, `cp-fix`, each a wrapper over a
   skill. Codex invokes the skills directly with `$cosmic-…`. `corepack pnpm gates` runs every gate
   in order with directly captured exit codes, for both agents.
6. **Migration:** old `~/.codex/skills/cosmic-*` moved to an archive so stale advice cannot load.

## Verification

- Hook scripts: fed sample stdin; block/allow outcomes checked, both output formats.
- `check-readiness.mjs`, `check-basepath.mjs`: pass on the repo, fail on a planted violation.
- JSON, TOML and SKILL.md frontmatter parse; `corepack pnpm lint` passes.
- Claude discovers the symlinked skills (`claude -p` listing).

## Sources

- Codex skills: https://learn.chatgpt.com/docs/build-skills
- Codex hooks: https://learn.chatgpt.com/docs/hooks
- Codex subagents: https://learn.chatgpt.com/docs/agent-configuration/subagents
- Codex config: https://learn.chatgpt.com/docs/config-file/config-advanced
