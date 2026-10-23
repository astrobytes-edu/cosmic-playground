# Remediation tracker

The working plan after the 2026-10-23 red-team audit: roadmap, per-finding status and the
decision log. **`state.json` is the source of truth.** Any agent (Claude on any account,
Codex) reads it as context and edits it in a commit; git keeps the history.

| File | What it is |
|---|---|
| `state.json` | Roadmap, status overrides, decisions and the Now/Next panel. Edit this. |
| `findings.json` | The 591 audit findings with short ids. Derived once from `docs/reviews/2026-10-23-red-team-findings.json` (frozen); do not edit. |
| `index.html` | Viewer for the two files. No edit controls. |

View it locally (a page opened from disk cannot fetch its JSON):

```bash
python3 -m http.server -d docs/tracker 8766
```

then open <http://127.0.0.1:8766/>. Online, the same page is the claude.ai artifact
<https://claude.ai/artifact/BTpoys3x5MqtDTRFH8yAXm> (private to Anna's account), republished
from these files.

## `state.json`

- `updatedAt`: ISO time of the last edit. Set it on every change.
- `now`: `{focus, next, blocker}`. Keep it in step with the `next:`/`blocker:` lines in
  `STATUS.md`.
- `roadmap[]`: `{id, phase, phaseOrder, phaseTitle, phaseBlurb, order, code?, title, detail,
  gate?, effort?, state, note, findingIds[], ref?, updatedAt}`. `state` is one of `todo`,
  `next`, `in-progress`, `blocked`, `done`, `dropped`. `gate` names a decision Anna must make
  first. Structural-fix `findingIds` were linked by keyword and over-include; P0 links are exact.
- `status{}`: sparse overrides keyed by finding id, `{state, note, updatedAt}`. `state` is one
  of `unverified`, `confirmed`, `in-progress`, `fixed`, `refuted`, `wontfix`. A finding with no
  entry shows `confirmed` if the verifier confirmed it, else `unverified`.
- `decisions[]`: decided items only, `{id, date, order, question, choice, status,
  statusLabel, why}`. Open decisions are asked in a popup when they arise, never parked here.

A finding's id is the first 8 hex digits of `sha1("file|line|title")`:

```bash
python3 -c "import json;[print(f['id'],f['sevC'] or f['sev'],f['title'][:80]) for f in json.load(open('docs/tracker/findings.json'))['findings'] if 'parallax' in f['file']]"
```

## Updating

1. Edit `state.json` alongside the change it records, and commit them together.
2. Mark a finding `fixed` only with the commit that fixed it in its `note`.
3. Claude sessions republish the artifact afterwards (Artifact publish with the URL above,
   `file_path` `docs/tracker/index.html`, `files` mapping `state.json` and `findings.json`).
   Codex cannot publish; the next Claude session does it.
