---
description: Check whether a Cosmic Playground demo can move up a release state, and recommend
argument-hint: "<demo-slug>"
---

Use the `cosmic-readiness` skill for the demo `$ARGUMENTS`.

1. Build its evidence table (you may delegate to the `readiness-auditor` agent) and verify the deciding
   claims yourself.
2. Run `node .agents/skills/cosmic-readiness/scripts/check-readiness.mjs`.
3. Recommend a status/readiness pair with the reason in plain language.

Do not change `status` to `stable` or `readiness` to `launch-ready` without Anna's explicit approval in
this conversation. Lower states may be applied if she has asked for changes; commit with the evidence.
