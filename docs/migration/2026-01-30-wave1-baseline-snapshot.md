# Wave 1 baseline snapshot (build + e2e)

Execution date: 2026-01-30
Timestamp: 2026-01-30T16:45:30-0800

## Commands + results

1. `corepack pnpm build`
   - Result: PASS (exit 0)

2. `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`
   - Result: PASS (exit 0)
   - Playwright: 14 tests passed

## Notes

- Playwright browser binaries were missing on the first attempt; ran `corepack pnpm -C apps/site exec playwright install` and re-ran `test:e2e` successfully.

## First actionable errors observed (before remediation)

- `browserType.launch: Executable doesn't exist at .../ms-playwright/.../chrome-headless-shell`
- `[WebServer] Error: listen EPERM: operation not permitted 127.0.0.1:4321`

