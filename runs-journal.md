# Desktop Run Journal

## Convention

Add an entry for every run, including failed or blocked runs. Allowed statuses
are `completed`, `partial`, and `blocked`. Never claim success without an
executed verification.

---

## Initial documentation pass — Analysis and planning

**Date:** July 23, 2026
**Branch:** `feature/desktop`
**Base:** `develop` at `adcaa54`
**Status:** completed

Created `brief.md`, `runs-workflow.md`, and the original journal file (now
`runs-journal.md`).
Reviewed SnipStack and the former SnippetVault desktop repository without
changing application code. Confirmed Rails/PostgreSQL as the source of truth,
the centralized frontend API client, responsiveness down to `320 px`, existing
reduced-motion support, remote Outfit loading, and CSS areas requiring
measurement. Rejected SnippetVault's Tauri Store migration. Reserved browser
deployment, login, offline storage, and synchronization for runs 13–17.

No install, build, test, or server was run during this pass.

## Run 0 — Desktop/backend contract under WSL/WSLg

**Base:** `b754bd2`
**Status:** completed
**Primary file:** `docs/desktop-architecture.md`

Selected Linux under WSL/WSLg, separate Rails at
`http://127.0.0.1:3000/api/v1`, separate PostgreSQL, and no auth/local
storage/sync in runs 0–12. Set identity to SnipStack `0.1.0`,
`com.allen.snipstack`; window to `1280×800`, minimum `720×600`.

## Run 1 — Browser baseline and regression matrix

**Status:** completed
**Primary file:** `docs/desktop-baseline.md`

Recorded Node/npm/Ruby/Bundler/Rails/PostgreSQL/Rust/Cargo versions. Ran
frontend lint/build, Rails tests/RuboCop, API CRUD/error smoke, WSLg checks, and
later a full Chrome Linux browser baseline. Initial Vite build took `240 ms`
with JS `288.02 kB` and CSS `21.39 kB`. Rails initially had zero tests and
RuboCop had five pre-existing offenses.

Captured web layouts at `1440×900`, `1120×800`, `760×800`, `720×600`, and
`420×900`. Verified no console errors or horizontal overflow, accessible
labels, skip-link focus, `/` search focus, and real HMR. Used a temporary
`develop` worktree for the run 6 font comparison.

## Run 2 — Minimal Tauri scaffold

**Status:** completed

Added the Tauri Rust scaffold, configuration, production capability, icon,
lockfile, and ignore file under `frontend/src-tauri/`. Added Tauri CLI `2.11.4`
and crate `2.11.5`. Rust format/check and cumulative frontend/web/Tauri
validation passed. No Store, Shell, sidecar, or alternate backend was added.

## Run 3 — Vite/Tauri integration

**Status:** completed

Added `dev:desktop`, `build:desktop`, and `tauri` scripts. Configured Vite on
`127.0.0.1:5173` with a strict port, Tauri HMR, `src-tauri` watcher exclusion,
Safari 13 target, release minification, and debug sourcemaps. Verified strict
port failure, WSLg Tauri launch, and HMR.

WSLg EGL/DMABUF errors were stabilized with
`WEBKIT_DISABLE_DMABUF_RENDERER=1` and `LIBGL_ALWAYS_SOFTWARE=1`.

## Run 4 — API, CORS, and CSP

**Status:** completed

Set the desktop API URL and observed `tauri://localhost`. WebKitGTK rejected
direct Web `fetch` to the local API before emitting the request. Added the
official Tauri HTTP plugin and selected it only inside Tauri; the browser kept
native `fetch`. Restricted production HTTP capability to the local API,
restricted CSP to embedded resources/IPC, and kept Rails CORS limited to Vite
origins.

Verified browser preflight and CRUD CORS, rejection of Tauri/third-party
origins, real Tauri CRUD, and later direct coverage of 404, 422, 204, and
network failure.

## Run 5 — Desktop window and interactions

**Status:** completed

Verified the `720×600` minimum, attempted smaller resize constraint,
maximization, non-forced fullscreen, all target widths, sticky composer,
scrolling, search, `/`, visible focus, reduced motion, CRUD, filter, and Web
clipboard. Tauri smoke passed two tests in roughly 2–3 seconds. No Clipboard
plugin was needed.

## Run 6 — Local fonts

**Status:** completed

Removed Google Fonts and bundled Outfit 400/500/600/700 through
`@fontsource/outfit`, including the OFL license. The build contained only the
expected local WOFF/WOFF2 assets. Chrome comparison against `develop` showed
identical heights, line breaks, and document height; H1 width differed by
`0.046875 px`.

## Run 7 — CSS and list profiling

**Status:** completed
**Primary file:** `docs/desktop-performance.md`

Profiled 1,003 cards in an optimized Tauri release test build. Original median
scroll duration was `1327 ms`; median worst frame was `61 ms`. Disabling blur
or animations did not help, and removing shadows worsened the worst frame.

Kept one Tauri-only change: mark the runtime and change the decorative grid
from fixed to absolute without removing it. Median duration became `1114 ms`
(`-16.1%`) and worst frame `51 ms` (`-16.4%`). Final one-card filtering took
`65 ms`. All 1,000 temporary fixtures were deleted.

## Run 8 — Automated coverage

**Status:** completed

Added client tests for success, create/update, network failure, 404, 422, 204,
and abort; UI tests for loading, filtering, shortcut, retry, validation/focus,
create, edit, copy, and delete; Rails model/CRUD/CORS coverage; and Tauri smoke,
performance, AppImage, and offline suites.

Fixed focus timing with `requestAnimationFrame`, limited Vitest discovery,
ignored Cargo output in ESLint, and pinned the expected WDIO native-utils
export. Results: 11 frontend tests at the time, Rails 4 tests/41 assertions,
clean RuboCop, two passing Tauri smoke tests, and zero production npm audit
vulnerabilities.

## Run 9 — Tauri hardening

**Status:** completed
**Primary file:** `docs/desktop-security.md`

Reduced production to one capability for `main` and one API-scoped HTTP
permission. Removed unused `core:default`; retained WDIO permissions only in
the test configuration. Confirmed the normal Cargo tree contains only the HTTP
plugin and the normal release binary contains no WDIO markers.

Found no Shell, Store, Clipboard, filesystem access,
`dangerouslySetInnerHTML`, `innerHTML=`, `eval`, or `new Function` in
application code. Tightened CSP, disabled HTTP default features/cookie jar,
and added a release guard against `webdriver` and `--all-features`.

## Run 10 — Build and WSL/WSLg validation

**Status:** completed

Passed frontend lint/tests/desktop build, Rails tests/RuboCop, Rustfmt, normal
and webdriver Clippy, and `tauri build --no-bundle`. The desktop frontend build
was `221–232 ms`, JS `290.55 kB`, CSS `22.66 kB`. The normal release binary was
an 18 MiB x86-64 ELF PIE. It launched under WSLg and remained stable until
deliberate closure. No Windows claim was made.

## Run 11 — Linux artifact lifecycle

**Status:** completed
**Primary file:** `docs/desktop-release.md`

Built Debian and AppImage artifacts. Inspected the Debian metadata and
dependencies but did not install it. Automated the AppImage with the official
external `tauri-driver` + `WebKitWebDriver` path.

Verified first launch, API connection, full CRUD, closure, second independent
launch, startup without API, visible offline state, explicit error, retry
without API, Rails restart, and final cleanup. Documented EGL/DRI3, GStreamer,
and transient interaction warnings. Removed empty proxy variables for the
external WebKit path.

## Run 12 — Final documentation and publication decision

**Status:** completed

Documented architecture, WSLg prerequisites, browser/Tauri commands, tests,
builds, API scope, offline diagnosis, graphics workaround, WebDriver
separation, artifact evidence, browser baseline, font comparison, measured CSS
optimization, and external-driver procedure.

Decision: suitable for local WSL/WSLg use with separate Rails/PostgreSQL, but
not ready for public release. Authentication, remote HTTPS API, signing, real
offline storage, and synchronization remain future work.

## Corrective replay audit — Runs 0–12

**Date:** July 23, 2026
**Branch:** `feature/desktop`
**Base:** `b754bd2`
**Status:** completed

The audit rechecked every run criterion against the worktree instead of
accepting historical statuses. It repaired an undefined performance-probe
variable, stabilized desktop focus/visibility checks, strengthened minimum
window/overflow/scroll assertions, fixed the white WebKitGTK select with
`color-scheme: dark`, narrowed default CORS, added OPTIONS and rejected-origin
tests, directly covered Tauri transport and DELETE 204, added real Chrome
Linux web smoke, verified HMR inside the Tauri WebView, made 3/100/1,000
fixtures reproducible, enforced a minimum 5% grid optimization gain, and added
the release WebDriver guard.

Replayed results:

- ESLint passed.
- Vitest: 2 files, 12 tests passed.
- Chrome Linux: 2 web scenarios passed.
- Rails: 4 tests, 47 assertions, no failures.
- RuboCop: 26 files, no offenses.
- Rustfmt and normal/test Clippy passed.
- Tauri smoke: 2 active scenarios passed.
- Tauri dev HMR: 1 scenario passed in the WebView.
- A second Vite launch failed as expected on occupied port `5173`.
- Release performance: optimized grid `1121 ms` / `54 ms`; original fixed
  grid `1351 ms` / `62 ms`; filter `67 ms`.
- Final fixtures: `remaining=0`.
- Release WebDriver guard failed as expected without override.
- Desktop, no-bundle, and bundled builds passed.
- Final AppImage passed two full CRUD launches and offline/retry validation.
- Rails API was restored and returned 200.
- Normal binary and AppImage contained no WebDriver markers.

Final audit artifacts:

- Debian: 5,705,080 bytes, SHA-256
  `700c4cb73a46b9e4dca7831556d306b36697c43d6acc21785ea32f3d47165f8f`.
- AppImage: 79,948,280 bytes, SHA-256
  `49ddf511ad7b823534fbe7dc01ad87963adeec1826eeaade182aafdc7c8c901d`.

Remaining limitations: Debian installation, signing, publication, Windows,
macOS, native Linux, external security audit, authentication, real offline
storage, and synchronization are not verified or implemented. No commit,
push, or pull request was created.

## Documentation translation and Tauri command update

**Date:** July 23, 2026
**Branch:** `feature/desktop`
**Status:** completed

Translated `README.md`, `AGENTS.md`, `brief.md`, `runs-workflow.md`,
`runs-journal.md`, and all Markdown files under `docs/` into English. Updated
the README and agent instructions to reflect the completed Tauri integration,
corrected references to `runs-journal.md`, and documented separate Tauri dev,
Debian build/install/launch, and AppImage build/launch commands.

Documentation-only validation checked Markdown inventory, remaining French
headings/phrases, Tauri script/config values, bundle targets, artifact paths,
and the final Git diff. Application tests and builds were not rerun because no
application code or configuration changed.

## License, badges, and MVP version documentation

**Date:** July 23, 2026

**Branch:** `feature/desktop`

**Status:** completed

Added GitHub contributor `crousty24-bit` alongside repository owner `Naethr`
in the MIT license copyright notice. Added README badges for MVP version,
license, React, Rails, Tauri, and the validated WSLg desktop scope. Documented
the current product version as `MVP v1.0.0` and added a License section linking
to `LICENSE` and both GitHub profiles.

Verification was documentation-only: Git identity and origin were inspected,
badge and profile links were checked structurally, and `git diff --check`
passed. Application tests and builds were not rerun because application code,
dependencies, and runtime configuration were unchanged.

## Local setup verification after clone

**Date:** September 9, 2026
**Branch:** `develop`
**Status:** completed

User-authorized environment verification only; no future product run started.
The initial worktree was clean, including ignored files. Read the mandatory
reference documents and inspected backend/frontend manifests, lockfiles,
database configuration, scripts, and environment configuration.

Backend work is suspended under the user's version-mismatch instruction:
`.ruby-version` requires Ruby 3.4.2, but only Ruby 3.4.10 was found in RVM.
Installed Rails is 8.1.3.1 versus project-locked 8.0.5; installed Bundler is
2.6.9 versus lockfile `BUNDLED WITH` 4.0.5. No versions were changed and
`bundle install`, database preparation, Zeitwerk, Rails tests, and Rails
server startup have not been run.

PostgreSQL socket access failed inside the sandbox. An approved read-only
check outside the sandbox confirmed PostgreSQL 18.6 online on port 5432,
connection as `theo`, and absence of `backend_development` and `backend_test`.
No database or role was modified.

Node 24.20.0 and npm 11.19.0 are installed. No project Node version pin was
found; installed Node satisfies the inspected Vite/ESLint/jsdom engine ranges.
The frontend uses JavaScript/JSX, with no TypeScript configuration or
typecheck script. `npm ci --cache /tmp/snipstack-npm-cache --no-audit --no-fund`
initially encountered sandbox DNS errors (`EAI_AGAIN`); it was interrupted
and relaunched with approved network access. Installation succeeded with
663 packages. npm warned about deprecated transitive `whatwg-encoding` and
`glob`, and install scripts not covered by `allowScripts` for `edgedriver`,
`esbuild`, and `geckodriver`. No dependency or npm policy was changed.

Frontend validation:

- `npm run lint`: passed (exit 0).
- `npm run test`: 2 files, 12 tests passed (exit 0).
- `npm run build`: passed, Vite 8.1.5 (exit 0).
- `npm run dev`: sandbox socket binding failed with `EPERM`; an approved
  launch outside the sandbox succeeded on `127.0.0.1:5173` in 280 ms.
  HTTP checks of `/` and `/src/main.jsx` both returned 200. The server was
  then stopped with SIGINT (exit 130).
- Typecheck: not applicable; no script or TypeScript project configured.
- `test:web`: not run because the Rails API remains unprepared; additionally,
  the configured `/usr/bin/google-chrome` executable is absent.
- Tauri builds/tests and watch/desktop variants: outside this web setup scope.
- Dependency vulnerability audit: not run; npm installation used `--no-audit`.

Static integration inspection confirmed Vite `127.0.0.1:5173`, Rails port
3000, API default `http://127.0.0.1:3000/api/v1`, and matching default CORS
origin. No local environment file or relevant environment override was found.
`frontend/.env.example` documents the same API URL; no `.env` was created.
No former-machine home path was found in runtime code/configuration; old
paths in architecture documents are historical references.

Live frontend-to-Rails requests and CORS responses remain unverified because
the backend is suspended. The local database configuration uses the current
OS role over the PostgreSQL socket and requires no custom environment values.
`BACKEND_DATABASE_PASSWORD` is referenced for production, not local development.

Only this journal was intentionally edited. Installation/build generated
ignored `frontend/node_modules/` (including tool caches) and `frontend/dist/`.
npm cache/logs and HTTP response evidence were written under `/tmp/`.
Final verification: `git diff --check` passed, both application lockfiles were
unchanged, and the only tracked modification was `runs-journal.md`; no
untracked non-ignored files were present. No Git mutation command, source or
configuration change, global update, or destructive database action was used.
The first pass ended `partial`: frontend checks passed; backend setup needed
a user decision about the explicitly mismatched Ruby/Bundler environment.

### Backend setup continuation

The user authorized aligning the local RVM environment and completing backend
validation. RVM 1.29.12 initially contained only Ruby 3.4.10, which remained
the current global default. The repository requires Ruby 3.4.2 and Bundler
4.0.5.

RVM had no Ruby 3.4.2 binary for Ubuntu 26.04 and its requirement check asked
for unavailable legacy package `libncurses5-dev`. APT inspection confirmed
that package has no candidate and its replacement `libncurses-dev` 6.6 was
already installed. No system package was changed. Ruby 3.4.2 was compiled and
installed with RVM autolibs disabled. RVM reported no upstream checksum and
recorded the downloaded archive checksum in the user's RVM configuration; it
also noted that Ruby documentation was not built. Ruby 3.4.10 was retained as
the global default. Because non-interactive shells do not run RVM's directory
hook, commands explicitly used `rvm use .` in `backend/`.

Installed Bundler 4.0.5 into the Ruby 3.4.2 gemset. Effective project tools:
Ruby 3.4.2 at `/home/theo/.rvm/rubies/ruby-3.4.2/bin/ruby`, Bundler 4.0.5,
and Rails 8.0.5. `bundle _4.0.5_ install` used the existing lockfile resolution
and completed with 14 declared dependencies and 103 installed gems. The only
gem message was Solid Queue's generic upgrade notice; this is a new database,
so no upgrade action was taken. `bundle check` passed. `Gemfile`,
`Gemfile.lock`, and `.ruby-version` remained unchanged.

`config/database.yml` is compatible with the local PostgreSQL socket, default
port 5432, and OS role `theo`. `bin/rails db:prepare` created
`backend_development` and `backend_test`. Migration `20260722084747 Create
snippets` is `up` in both. As part of setup of the new development database,
Rails loaded the three repository-defined seed snippets. No additional
application write was made. Rails tests left the expected two fixture records
in the test database.

Backend validation:

- `bin/rails zeitwerk:check`: passed, `All is good!`. Inside the sandbox,
  Bundler warned that `/home/theo` was not writable and used a temporary home.
- `bin/rails test`: 14 runs, 66 assertions, 0 failures, 0 errors, 0 skips.
- Rails server: Puma 8.0.2 started with Ruby 3.4.2 and Rails 8.0.5 on
  `http://127.0.0.1:3000`, then stopped gracefully.
- `GET /api/v1/snippets`: HTTP 200, JSON, returned the three seed snippets.
- CORS GET and OPTIONS from `http://127.0.0.1:5173`: HTTP 200 with matching
  `Access-Control-Allow-Origin`; methods were GET, POST, PATCH, DELETE,
  OPTIONS, and HEAD.

Backend commands generated only ignored runtime files under `backend/log/`
and `backend/tmp/`, including `backend/tmp/local_secret.txt`. Final Git checks
confirmed that the only tracked modification is this required journal entry;
application source, configuration, Ruby manifest, and lockfiles are unchanged.
The full local browser/Rails development setup is ready. Tauri and external
browser-driver checks were not rerun because this continuation was limited to
backend preparation and the minimal HTTP/CORS integration check.
