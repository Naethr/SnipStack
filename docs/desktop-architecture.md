# Initial Desktop Architecture Decision

**Date:** July 23, 2026

**Scope:** runs 0–12

**Status:** accepted

## Decision

SnipStack Desktop is a Tauri 2 Linux client executed and validated only under
WSL/WSLg. Tauri embeds the React/Vite static build. The desktop client keeps
using the separate Rails API, and PostgreSQL remains the server-side source of
truth.

## Initial contract

- Desktop environment: Linux under WSL/WSLg.
- Product: `SnipStack` `0.1.0`.
- Tauri identifier: `com.allen.snipstack`.
- Main window: `1280×800`, centered and resizable, no forced fullscreen.
- Minimum window: `720×600`.
- Development API: `http://127.0.0.1:3000/api/v1`.
- Backend and database: Rails and PostgreSQL started separately under WSL.
- Browser HTTP client: native `fetch` through
  `frontend/src/api/snippetsApi.js`.
- Desktop HTTP client: official Tauri HTTP plugin, selected only when
  `isTauri()` is true and scoped to
  `http://127.0.0.1:3000/api/v1/**`.
- Unavailable API: explicit error UI and manual retry, not full offline mode.
- Local business storage during runs 0–12: none.
- Bundle targets: Linux Debian package and AppImage.

## API environment matrix

| Context | Current URL | Transport |
| --- | --- | --- |
| Local Vite web | fallback local URL or `VITE_API_BASE_URL` | browser `fetch` |
| Tauri dev under WSLg | `frontend/.env.desktop` | Tauri HTTP plugin |
| Tauri bundle under WSLg | build-time `VITE_API_BASE_URL` or local fallback | Tauri HTTP plugin |
| Future remote API | not configured; HTTPS required | defined during deployment run |

Never put a secret in `VITE_*`: these values are public in the frontend bundle.

## Initial security

- CSP is limited to embedded resources and Tauri IPC.
- Rails CORS defaults to `http://127.0.0.1:5173`; the native Tauri client does
  not use browser CORS.
- One production capability applies to `main` and contains only API-scoped
  HTTP access.
- No Store, Shell, Clipboard, or filesystem plugin.
- No secret in the frontend bundle.

## Future compatibility

Current choices preserve browser deployment, shared authentication, a desktop
local replica, offline use, and bidirectional synchronization with explicit
conflict handling. Those capabilities remain outside runs 0–12.

## Out of scope

Windows/NSIS/MSI/WebView2, macOS, embedded Rails sidecar, authentication,
offline storage, synchronization, external publication, and signing.

## Consequences

- Desktop depends on Rails during runs 0–12.
- The HTTP plugin is required because WebKitGTK rejected direct Web `fetch`
  to the local API before emitting a request.
- Rails unavailability is a visible state, not alternate storage.
- WSLg output is not Windows compatibility evidence.
- Any change to this decision must be approved and reflected in `brief.md`,
  `runs-workflow.md`, and `runs-journal.md`.
