# Desktop Run Workflow

## Execution rules

- Read `brief.md` before every run.
- Preserve the browser frontend and Rails API at every step.
- Never replace Rails with Tauri Store or another server source of truth.
- Do not add login, offline storage, or synchronization during runs 0–12.
- Validate Tauri only on Linux under WSL/WSLg. Windows, NSIS, MSI, WebView2,
  macOS, and native Linux are outside the validated scope.
- Start from a clean worktree or document all pre-existing changes.
- Keep each run within its objective; unrelated refactors are forbidden.
- Record results, problems, fixes, and checks in `runs-journal.md`.
- A run is complete only when its exit criteria are verified. Otherwise mark
  it `partial` or `blocked`.
- Do not confuse compilation, manual launch, functional testing, artifact
  installation, and platform validation.

## P0 — Structural decisions

### Run 0 — Initial desktop/backend contract

**Goal:** Resolve implementation-changing unknowns.

Decide and document:

- Linux under WSL/WSLg as the execution target;
- separately running Rails API;
- environment-specific API URL;
- explicit API-unavailable behavior without claiming offline operation;
- initial/minimum window dimensions;
- product identifier, name, and version;
- deferred browser deployment, auth, offline, and sync requirements.

**Exit:** Rails location, WSLg limitation, and deferred scope are unambiguous.

### Run 1 — Browser baseline and regression matrix

**Goal:** Create evidence before adding Tauri.

Record toolchain versions; run existing frontend/backend checks; cover CRUD,
errors, filters, `/`, focus, scroll, clipboard, responsiveness, and reduced
motion; capture key widths; prepare small/medium/large datasets; record
reproducible performance signals.

**Exit:** Results, limits, visual reference, and pre-existing failures are
documented.

## P1 — Minimal Tauri shell

### Run 2 — Tauri 2 scaffold

Add the Tauri CLI, `frontend/src-tauri/`, minimal Rust code, identity, window,
assets, build hooks, and the npm Tauri script. Do not change business behavior
or add business plugins.

Verify frontend lint/build, Rust format/check, Tauri dev, unchanged Vite web
launch, and first-level visual parity.

### Run 3 — Multi-target Vite configuration

Add the Tauri host, strict port, watcher exclusion, WebView-compatible target,
mode-dependent minification/sourcemaps, and documented non-secret environment
configuration.

Verify Tauri HMR, explicit failure when port `5173` is occupied, browser build,
and the frontend build driven by Tauri.

## P1 — Existing backend connection

### Run 4 — API, CORS, CSP, and transport

Configure the desktop API URL and observe the actual WebView origin. Keep
browser CORS limited to real browser origins. Prefer Web `fetch`; if a
reproduced WebView limitation requires the Tauri HTTP plugin, scope it to the
exact API and keep CSP limited to embedded resources and IPC. Require HTTPS
for a future remote API.

Verify GET, POST, PATCH, DELETE, OPTIONS, startup without API, retry, Rails
404/422, browser Vite access, and rejection of other origins.

**Exit:** Full Tauri CRUD works with minimal documented network permissions and
no parallel storage.

## P2 — Desktop experience and visual fidelity

### Run 5 — Window and interactions

Test initial/minimum sizes, maximize, non-forced fullscreen, breakpoints,
sticky composer, scrolling, keyboard, visible focus, reduced motion,
clipboard, restart, and API loss. Add a Clipboard plugin only after a verified
failure.

### Run 6 — Local resources

Verify the Outfit license, bundle used weights, replace Google Fonts with
local `@font-face`, compare text metrics/screenshots, and reject CDN resources
in CSP.

### Run 7 — CSS and list profiling

Measure a release build and change one factor at a time:

1. top-bar blur;
2. fixed masked grid;
3. shadows and gradients;
4. animations;
5. card list rendering;
6. full-text filtering.

Keep only evidence-backed changes that preserve visual behavior and reduced
motion.

## P2 — Quality, security, and WSLg validation

### Run 8 — Automated coverage

Cover the API client (success, unavailable network, 404, 422, 204, abort),
critical React states, Rails CRUD/CORS, and a proportionate Tauri smoke path.

### Run 9 — Tauri hardening

Audit Cargo, plugins, capabilities, CSP, bundled endpoints/secrets, and snippet
rendering. Remove unused permissions and native features. Disable the native
HTTP cookie jar. Forbid `webdriver` and `--all-features` in distributed builds.

### Run 10 — Build and WSL/WSLg validation

Run release frontend build, Rust format/Clippy, Tauri no-bundle build, and a
real WSLg launch. Associate every result with WSL distribution, architecture,
and toolchain. Make no Windows claim.

### Run 11 — Linux artifact lifecycle

Build the configured Linux artifact; test launch, API connection, CRUD,
restart, startup/session API loss, and retry under WSLg. Document required
Linux/WebKit dependencies.

**Exit:** Artifact lifecycle is tested under WSL/WSLg; other platforms are
explicitly untested. Artifact installation is a separate verification.

## P3 — Delivery

### Run 12 — Final documentation and publication decision

Document prerequisites, browser development, Tauri development, API
configuration, builds, bundles, launch commands, logs, WSLg limitations,
offline diagnosis, and remaining uncertainties. Update architecture documents
when implementation differs.

**Exit:** Documented commands were executed in the stated environment, and
unverified capabilities are not claimed.

## P4 — Future product runs

Runs 13–17 protect the architecture but must not be implemented without new
scope approval.

### Run 13 — Browser deployment

Define environments, domains, HTTPS, CORS, API configuration, observability,
backups, and separation of local web, deployed web, and desktop configuration.

### Run 14 — Shared browser/desktop authentication

Choose login/renewal/revocation, add server-side ownership and isolation,
define secure desktop session storage, handle logout/account switching and
401/403, and validate CSRF/CORS for the chosen mechanism.

### Run 15 — Local offline model

Choose transactional local storage and migrations; add a data layer, stable
client IDs, versions, sync states, tombstones, and an idempotent mutation
queue; define expired-session behavior while offline.

### Run 16 — Bidirectional synchronization and conflicts

Define incremental sync, cursors/server versions, retry, idempotency,
deduplication, deletion, recovery, explicit conflict policy, and visible sync
states. Never silently overwrite a validated mutation.

### Run 17 — End-to-end auth/offline/sync hardening

Cover login, offline work, reconnection, conflicts, revocation, multi-user
isolation, account switching cleanup, local protection, schema migrations,
backup, recovery, and documented guarantees/limits.
