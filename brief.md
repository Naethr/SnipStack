# SnipStack Desktop Integration Brief

## 1. Purpose and guardrails

The goal is to add a Tauri 2 desktop distribution without replacing:

- the React/Vite frontend;
- the Rails API;
- PostgreSQL;
- the `frontend/` + `backend/` repository layout;
- existing browser use.

Tauri is an additional target that embeds the static frontend in a WebView.
The browser version must continue to work.

This brief was initially written before implementation. Runs 0–12 then
implemented and validated the plan on `feature/desktop`. Historical analysis
below records the reasoning; verified implementation evidence is in
`runs-journal.md` and `docs/`.

### Long-term product direction

The current architecture must not block these agreed future capabilities:

- deploy SnipStack as a browser application;
- add shared browser/desktop authentication;
- associate every snippet with its authenticated user;
- synchronize a user's snippets in both directions between browser, Rails,
  and desktop;
- keep the desktop usable offline and synchronize changes when the API returns.

These are design constraints, not part of the initial Tauri implementation.
They are assigned to future runs 13–17.

## 2. Verified current architecture

- Frontend: React 19, React DOM 19, Vite 8, `react-icons`, and plain CSS.
- Backend: Rails API 8, Puma, PostgreSQL, and `rack-cors`.
- Network boundary: `frontend/src/api/snippetsApi.js`.
- Default API URL: `http://127.0.0.1:3000/api/v1`, overridable with
  `VITE_API_BASE_URL`.
- CRUD endpoint: `/api/v1/snippets`.
- Browser CORS default: `http://127.0.0.1:5173`.
- Desktop: Tauri 2 under `frontend/src-tauri/`.
- Desktop bundles: Debian package and AppImage.
- Validated desktop environment: Linux under WSL2/WSLg only.

Rails and PostgreSQL remain separate. Adding `src-tauri` does not turn them
into an embedded desktop backend.

### Runtime transport

The browser uses native `fetch`. During WSLg validation, WebKitGTK rejected a
direct Web `fetch` from `tauri://localhost` to the local HTTP API before the
request was emitted. The centralized client therefore selects the official
Tauri HTTP plugin only when `isTauri()` is true.

The production capability is limited to:

```text
http://127.0.0.1:3000/api/v1/**
```

The Tauri origin is not added to Rails CORS because native HTTP transport does
not use browser CORS.

## 3. Desktop/backend contract

The selected initial model is a separate Rails API:

| Model | Impact | Decision |
| --- | --- | --- |
| Separately operated Rails API | Small configuration, CORS/CSP, and availability handling changes | Selected |
| Rails and PostgreSQL manually started on the same machine | Suitable for local development, not standalone installation | Current WSLg workflow |
| Embedded Rails/PostgreSQL sidecar | Very high packaging, migration, lifecycle, and platform cost | Out of scope |

The initial desktop integration:

- calls the existing Rails API;
- works under WSL/WSLg while the API is available;
- displays an explicit unavailable/offline error state;
- preserves boundaries needed for future auth, local replicas, and sync.

It does not:

- add login;
- associate snippets with users;
- add local business-data storage or Tauri Store;
- add an offline mutation queue;
- resolve conflicts or synchronize;
- claim complete offline operation.

Future desktop storage must be a controlled replica, not a replacement for
Rails/PostgreSQL.

## 4. Decisions inherited—and rejected—from SnippetVault

The earlier `/home/allen/mes_projets/SnippetVault_desktop_app` repository was
useful as a reference for Tauri 2 layout, Vite hooks, Rust scaffolding,
capabilities, CSP, and separating WSLg validation from Windows claims.

SnipStack deliberately did not copy:

- Tauri Store as business persistence;
- replacement of `snippetsApi.js`;
- frontend-generated server identities or validation;
- a no-server product claim;
- Store, Shell, or Clipboard permissions;
- fullscreen defaults, a `980 px` minimum width, or Windows bundle choices.

Its WSL/WSLg results are evidence only for Linux running through WSLg.

## 5. Frontend compatibility and performance

The reference behavior includes JSON/API errors, Rails validation messages,
CRUD, filters, `/` shortcut, focus, scroll, clipboard, status announcements,
responsive layouts, and reduced motion.

Outfit weights 400/500/600/700 are now bundled locally. Compared with the
previous Google Fonts version, measured heights and line wrapping were
unchanged; the H1 width difference was below `0.05 px`.

The CSS investigation covered:

- top-bar `backdrop-filter`;
- the fixed masked `body::before` grid;
- large shadows and gradients;
- spinner, skeleton, and status animations;
- full-list rendering and filtering.

Only one measured optimization was retained. In Tauri, the decorative grid
keeps its appearance but uses `position: absolute` instead of `fixed`. With
1,003 cards under WSLg software rendering, the original run reduced median
scroll time from `1327 ms` to `1114 ms` and median worst-frame time from
`61 ms` to `51 ms`. The corrective audit reproduced the comparative gain.
The browser CSS remains unchanged.

Virtualization, debounce, and `content-visibility` remain future options only
if real user data demonstrates a need.

## 6. Dependencies and security

The desktop foundation contains:

- `@tauri-apps/cli`;
- `@tauri-apps/api` for runtime detection;
- `@tauri-apps/plugin-http` and `tauri-plugin-http`;
- Rust crates `tauri` and `tauri-build`.

No Store, Shell, or Clipboard plugin is required. HTTP plugin default features
are disabled; only `rustls-tls`, `http2`, and `charset` are enabled. Native
cookie storage remains disabled pending authentication design.

Security rules:

- keep a restrictive CSP;
- keep browser CORS limited to actual browser origins;
- scope native HTTP to the exact API URL;
- require HTTPS for a remote API;
- never place secrets in `VITE_*` variables;
- never execute snippet content;
- never distribute a build with `webdriver` or `--all-features`.

An unauthenticated remote Rails API would be a major risk change. Public
deployment must wait for the authentication run.

## 7. Integration plan and completed state

Runs 0–12 completed the initial integration:

1. desktop/backend contract;
2. web baseline;
3. minimal Tauri scaffold;
4. multi-target Vite configuration;
5. Rails API, native HTTP, CORS, and CSP;
6. desktop window and interaction checks;
7. local fonts;
8. measured CSS/list profiling;
9. automated coverage;
10. Tauri hardening;
11. WSL/WSLg build and artifact lifecycle;
12. final documentation and publication decision.

The corrective audit replayed the required checks, strengthened coverage, and
confirmed the final AppImage lifecycle. The Debian package was built and
inspected but not installed.

## 8. Global acceptance state

Verified:

- browser behavior remains functional;
- browser and Tauri use the same React interface;
- Rails/PostgreSQL remain the server source of truth;
- desktop API unavailability is explicit;
- CRUD crosses the native Tauri HTTP transport;
- browser CRUD remains covered through native `fetch` and CORS;
- CSP, permissions, and network destinations are minimal;
- required visual resources are local;
- key window sizes and reduced motion are covered;
- performance changes are measurement-backed;
- AppImage launch, CRUD, restart, and offline/retry behavior work under WSLg.

Not verified or not implemented:

- Debian package installation;
- artifact signing or publication;
- Windows, macOS, or native Linux;
- external security audit;
- login, real offline storage, synchronization, and conflicts.

## 9. Future runs and unresolved decisions

Before auth/offline/sync work, decide:

- browser/Tauri authentication protocol;
- secure desktop session storage;
- ownership, stable IDs, and snippet versioning;
- transactional local storage and migrations;
- mutation queue, retry, idempotency, tombstones, and conflict policy;
- expired-session behavior during offline use;
- deployed API URL, hosting, HTTPS, observability, and backups.

Major risks are overly broad HTTP capability/CSP, configuration divergence,
token leakage, silent data loss during sync, treating a local replica as a new
source of truth, and misrepresenting WSLg validation as platform support.

## 10. References

Local repositories reviewed:

- `/home/allen/mes_projets/SnipStack`
- `/home/allen/mes_projets/SnippetVault_desktop_app`

Official documentation consulted on July 23, 2026:

- <https://v2.tauri.app/start/frontend/vite/>
- <https://v2.tauri.app/start/prerequisites/>
- <https://v2.tauri.app/security/capabilities/>
- <https://v2.tauri.app/security/csp/>
- <https://v2.tauri.app/develop/sidecar/>
