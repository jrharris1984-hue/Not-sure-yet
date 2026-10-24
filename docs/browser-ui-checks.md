# Browser UI checks

This is a repeatable UI smoke suite for the classic Design editor. It is separate from frontend dependencies and does not change the application build.

## Windows

Prerequisites: Node.js 22 or newer, Microsoft Edge (or Chrome), and the updated Ultra Studio frontend running on port 3000.

From the repository root in PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\Test-UI.ps1
```

The execution-policy flag applies only to this process. The script installs the pinned test dependency with `npm ci`, launches installed Edge headlessly, and writes reports to `tests/ui/artifacts`. To use Chrome or a different local frontend URL:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\Test-UI.ps1 -Browser chrome -BaseUrl http://localhost:3000
```

The suite uses fresh browser contexts. API requests and WebSockets are intercepted: character saves and rendering use in-memory fixtures, unknown writes fail, and external HTTP requests are blocked. ComfyUI and MongoDB are not used. These checks do not verify image quality, GPU readiness, or backend integration.

## Coverage

- Desktop 1440×1000 and short desktop 1024×650: open Design, name a character, search the selected-details drawer, dismiss with Escape and verify focus, save to the fixture, dispatch exactly one mock render, and refresh without losing the character name.
- Mobile 390×844: switch Edit → Preview → Results → Edit, check the empty-results state and ensure the editing sheet does not overlap the bottom dock.
- All sizes: fail on uncaught browser errors, unexpected writes and document-level horizontal overflow. Capture a screenshot and a Playwright trace for each case.

`report.json` records pass/fail or a blocked startup. The process exits nonzero on failure. Review screenshots as well: automated geometry assertions cannot certify visual quality or every possible layout.

To inspect a trace:

```powershell
npx --prefix tests/ui playwright-core show-trace tests/ui/artifacts/desktop-trace.zip
```

For fixture-only checks (no browser or frontend required):

```powershell
npm --prefix tests/ui run test:fixtures
```

## Validation status at introduction

Fixture unit tests and JavaScript syntax checks passed. Dependency installation succeeded. Full browser execution was blocked in the development environment: installed Edge/Chrome was unavailable, and an alternate Chromium binary crashed. The suite therefore needs its first complete run on a supported desktop browser. A failure can indicate a UI regression or a missing fixture response; consult `runtimeErrors` and `unhandledWrites` in the report before treating it as a production backend problem.

Real-backend verification still required: create and save a character, submit a real render, inspect the result, edit a detail, save again, and repeat on a physical mobile device. Verify keyboard navigation and scrolling with the mobile keyboard open.
