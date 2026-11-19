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

## Authentication backend continuation — Snippet ownership

**Date:** October 18, 2026
**Branch:** `feature/authentication`
**Base:** `6623436`
**Status:** partial (backend ownership verified; the full browser/desktop authentication run remains open)

The user explicitly requested this backend continuation without a commit,
push, staging change, frontend work, seed execution, or destructive database
operation. Preserved the existing uncommitted Devise JSON endpoints, CORS and
route changes, database-name changes, user/snippet associations, migrations,
schema, and fixtures.

The first reported fixture failure followed from loading `snippets` before
`users` while a non-superuser PostgreSQL role could not disable system
triggers for an immediate foreign key. The already-applied migration makes the
foreign key initially deferred. A targeted test reproduced the subsequent
`PG::InsufficientPrivilege` failure: Rails' extra fixture check attempts to
update `pg_catalog.pg_constraint`. Disabled only that extra check in the test
environment. Fixture inserts remain transactional and PostgreSQL still checks
the deferred foreign key at transaction end. A targeted database test inserts
an invalid `user_id`, forces constraint evaluation, and verifies rejection and
rollback. The fixtures' user references were retained.

The snippets controller now requires JWT authentication, creates through
`current_user.snippets`, and scopes index/show/update/delete to that
association. Tests cover both users' separate lists, missing-token `401`
responses, cross-user `404` responses for show/update/delete, and ignored
client-supplied `user_id` on create/update. Existing JSON response shapes and
successful status codes remain unchanged. Existing model and CRUD tests were
updated to use authenticated users and retain their validation, CRUD, and CORS
assertions.

Verification: targeted model/CRUD tests passed (17 runs, 103 assertions),
then the full Rails suite passed (30 runs, 187 assertions, no failures/errors/
skips). RuboCop inspected 38 files with no offenses. `git diff --check`,
`bin/rails routes -g 'api/v1'`, and `bin/rails zeitwerk:check` passed. Read-only
database checks confirmed all four migrations in both `snipstack_development`
and `snipstack_test`; the snippets foreign key is deferrable and initially
deferred in both. Development currently contains zero snippets. Tests wrote
only to the test database and possibly ignored Rails logs/cache.

`db/seeds.rb` was not run or changed. It still creates snippets without a
user and needs a product decision about ownership before it can succeed.
The frontend and desktop still send no JWT, so their CRUD cannot work
end-to-end against the now-protected routes. No live browser/Tauri check was
run. The existing non-null `user_id` migration has no backfill strategy for a
database with pre-existing snippets; no such rows were present in the checked
development database. No commit, push, or staging change was made.

## Authentication frontend and demo-seed continuation

**Date:** October 18, 2026
**Branch:** `feature/authentication`
**Base:** `3e240a0`
**Status:** partial

The worktree was clean at the start. The user authorized this functional
frontend/seeds continuation without backend controller, migration, ownership,
or security changes, and without committing, deploying, or running `db:seed`.
The full Run 14 criteria for session renewal and cross-target interactive
validation remain open.

Inspected the Rails routes, auth/snippets controllers, Devise JWT settings,
model validations, CORS, backend integration tests, frontend client and UI,
Tauri HTTP capability/CSP, and existing seed data. Backend tests show
register/login return `{ user }` with the bearer token in the response
`Authorization` header; `/me` returns `{ user }`; logout returns `204`;
snippet CRUD requires the bearer token and scopes records to the owner.

The centralized frontend client still uses native browser fetch or the
scoped Tauri HTTP plugin. It parses the bearer token only from the auth
response header, attaches it to authenticated requests, and refuses protected
calls without a token. App state holds the token only in memory, verifies
`/me` after login/registration, gates the workspace, and clears private
state on `401`. Voluntary logout calls Rails before clearing local state,
with separate messages for an already-invalid token and an unconfirmed
server logout. Existing search/filter/CRUD UI remains in place.

Seeds now require `SNIPSTACK_SEED_EMAIL` for an existing user, fail before
writing when missing/unknown, and update seven owner-scoped examples in one
transaction. The original three examples remain. The README documents
selection, replay, and new-database setup without implicit seed execution.
No development seed task or database reset was run.

Added frontend client/UI tests and a Rails seed test for missing owners,
idempotence, and other-user title isolation. Existing WDIO browser/desktop
scenarios now sign in using explicit test-account environment variables;
the offline scenario checks the unauthenticated API-unavailable state.
These WDIO scenarios were adapted but **not executed** here.

Checks:

- Frontend ESLint: passed after correcting one smoke-helper Node import.
- Vitest: 2 files, 22 tests passed, no failures.
- Browser Vite build: passed, Vite 8.1.5, JS 295.75 kB and CSS 23.60 kB.
- Desktop Vite build: passed, Vite 8.1.5, JS 295.75 kB and CSS 23.60 kB.
- Rails tests: initial sandbox attempt failed before tests because PostgreSQL
  socket access was denied. The allowed rerun passed: 32 tests, 203
  assertions, no failures/errors/skips.
- RuboCop: 39 files inspected, no offenses.
- `git diff --check`: passed.
- Tauri `build --no-bundle`: attempted, failed before compilation because
  `cargo` is not installed in this environment. No Tauri artifact was built.

No Chrome/Chromium, WebKitWebDriver, or tauri-driver executable was found;
browser and Tauri interactive authentication/CRUD are therefore not verified
in this continuation. A Vite build is not evidence of an interactive desktop
path. The backend HTTP contract has no identified incompatibility, but the
combined path remains unverified. Remaining decisions include session
renewal, secure desktop persistence if later required, and Run 14 interactive
validation before the visual redesign. No commit, push, merge, deployment,
or seed execution occurred.

## Frontend visual refresh — Existing SnipStack interface

**Date:** October 18, 2026
**Branch:** UI-rework
**Base:** 8d6249b
**Status:** partial (web implementation and browser validation complete; native Tauri toolchain unavailable)

User explicitly authorized this frontend-only visual run, preserving the existing
authenticated application. The worktree was initially clean. Read brief.md,
runs-workflow.md, runs-journal.md and AGENTS.md; the latest completed journal
entry is local setup verification, while the two authentication continuations
remain partial. This run does not complete Run 14 or implement future runs.

Inspected all rendered components, stylesheet, API boundary and existing tests.
Recorded the original blue ink/mineral/amber palette, bundled Outfit weights,
system monospace, centered auth form, header, left sticky composer, right library,
filters, code cards, errors, confirmations, skeletons and mobile stacking.
Captured login before edits; after account access was supplied, captured the
real seven-snippet library with the saved original stylesheet and then the new
stylesheet, without changing displayed data. Evidence and precise methodology
are in docs/ui-refresh/README.md and the adjacent PNGs.

Updated frontend/src/index.css for light mineral/white surfaces, retained ink
code panels and amber primary actions, readable text, form spacing, borders,
shadows, badges, interactive states and mobile sizing. Preserved region order
and desktop column widths. Controls stack within the search area at 761–980 px;
removed the minimum-width overflow at 320 px with a scrollbar and fixed the
narrow new-snippet icon. No font or dependency was added. Verified Outfit OFL
1.1 locally. Core text contrast pairs range from 5.26:1 to 14.86:1; this is not
a complete accessibility audit.

frontend/src/App.jsx only changes composer scrolling to honor reduced motion;
frontend/src/App.test.jsx adds a focused regression for that behavior. Auth,
in-memory JWT, 401 handling, HTTP client and business behavior remain intact.

Final checks:
- ESLint passed; Vitest 23 tests / 2 files passed (baseline 22).
- Web and desktop Vite builds passed: JS 295.85 kB, CSS 24.95 kB.
- npm run tauri -- build attempted, failed before compilation at cargo metadata:
  cargo is not installed. No native artifact was built.
- Actual Chromium inspection/screenshots at 1440×900, 1024×800, 820×900,
  720×600, 390×844 and 320×700. Final document scrollWidth equals clientWidth
  and search controls fit at every width. Visually inspected representative
  desktop, tablet, mobile, registration, error, validation and loading captures.
- Real account login, /me, list, search, filter, clear, slash focus, copy with
  clipboard equality, validation/focus, edit/cancel, delete confirmation/cancel.
- Real create/update/delete using a clearly temporary test entry, removed
  immediately; original seven snippets retained, none edited or deleted.
- Sign-out and memory-only session reset on reload verified in Chromium.
- Browser-only connection failure and 401 injection verified error/retry and
  private-state clearing. Retry fetched the original seven records from Rails.
  Loading captured using network latency emulation. No server configuration changed.
- Registration form visually checked; no actual account creation.
- Reduced-motion styles and visible 2 px focus outline verified.
- git diff --check passed.

Environment: sandbox prevented local socket access; allowed browser access
reused the user's already-running Vite/Rails services. Cached Chromium lacked
libasound.so.2; downloaded the distro package and extracted it under /tmp,
without host installation. Browser automation used temporary scripts and
DevTools protocol. No persistent JWT mechanism was introduced.

Not run: native Tauri/WSLg interaction and artifact checks, official WDIO suites,
backend checks (outside scope), actual registration and server token expiry,
other platforms/browsers, complete accessibility or performance audit. Browser
720×600 is only a reduced viewport, not Tauri validation. No performance claim.

Modified application files: frontend/src/index.css, frontend/src/App.jsx,
frontend/src/App.test.jsx. Documentation: this journal and docs/ui-refresh/.
No Rails, routes, seeds, dependency manifests/locks, network client or security
configuration changed. No staging, commit, push, merge or deployment.
Remaining required validation is native Tauri build and visual/interaction
checks under WSLg once the Rust/desktop toolchain is available.

## Frontend visual correction — Restore blue-night identity

**Date:** October 18, 2026
**Branch:** UI-rework
**Base:** 8d6249b, preserving all uncommitted work from the preceding visual run
**Status:** partial (browser result and frontend checks verified; native Tauri validation unavailable)

The user rejected the first run's near-white palette and the movement of the
library introduction/actions. Before changing code, compared the exact
`docs/ui-refresh/before-library-1440.png` and `after-library-1440.png`
files. Read the original CSS values from Git HEAD and reviewed the existing
uncommitted diff. Kept the functional authentication/CRUD code, the prior
reduced-motion scroll behavior and its test, and useful 320 px overflow fixes.
The two earlier screenshots and journal entry remain as historical evidence.

Restored the original blue-night palette: #0c1822 page/code, #112432 top bar
and composer, #193040/#223b4b neighboring planes, #34566a edges, #f5f8f7
main text and #d8a24a primary actions. Added two close ink surface/input tones
(#1c3646 and #102531) and a readable secondary neutral (#cbd8da). No light
library surfaces remain. Increased card-title, description and code type
sizes, refined forms/buttons, field focus, card shadows and hover, and applied
the same dark family to login/registration, empty, error, skeleton and status
surfaces. Outfit and system monospace remain. No new dependency.

The header statistics and footer labels were brightened after measuring the
original small-text contrast; the registration subtitle now describes account
creation instead of sign-in. Final screenshots and builds include both edits.

Kept the header, 400/352 px composer width, right-side library and original
search/filter/list order. Moved the introduction under the left-aligned H1.
Moved each card's Copy/Edit/Delete row into the textual content after its
description and before code, matching the user's requested hierarchy. At
761–980 px the controls stack within their existing area. No major region
changed place. The final side-by-side image and capture explanations are in
`docs/ui-refresh/README.md`.

Chromium screenshots from real rendering: login, registration, library at
1440/1024/820/720/390/320 px, filtered empty state, edit, delete confirmation
and validation. Viewed the initial dark, rejected light and corrected dark
1440 × 900 images side-by-side. Measured no horizontal document overflow at
all six widths. On the real account, verified /me and seven records, copy and
clipboard equality, search/filter/clear, slash focus, edit/cancel, delete
confirmation/cancel, input validation/focus, and create/update/delete of an
entry removed immediately. Original seven snippets remained. Verified logout
and that reload requires sign-in. Registration form rendered, but no account
was created. Earlier browser-injected 401 and network-failure checks were not
replayed after these visual changes; existing frontend tests cover those paths.

Final checks: ESLint passed; Vitest passed (2 files, 23 tests); web and desktop
Vite builds passed. Native Tauri build was attempted and failed before
compilation because Cargo is absent. Git diff whitespace check passed. Native
WSLg interaction, official WDIO, real registration/expiry, other browsers,
backend tests, and full accessibility/performance audit were not run.

Modified application files: `frontend/src/index.css`,
`frontend/src/components/SnippetCard.jsx`, plus retained previous uncommitted
`frontend/src/App.jsx` and `frontend/src/App.test.jsx`. Documentation changes:
`docs/ui-refresh/` and this journal. No backend, security, JWT, contract,
seed, dependency or Tauri files changed. No Git staging, commit, push, merge or
deployment.

## Frontend visual evolution — Slate depth and amber feedback

**Date:** October 19, 2026
**Branch:** `UI-rework`
**Base:** `8d6249b`, with the two earlier uncommitted visual passes preserved
**Status:** partial (browser visual and functional criteria verified; native Tauri unavailable)

The user rejected both the near-white first result and the second result that
resembled the original too closely. Before editing, read the required brief,
workflow, journal, and branch status. The pre-existing tracked changes were
`frontend/src/App.jsx`, `App.test.jsx`, `components/SnippetCard.jsx`,
`index.css`, and `runs-journal.md`; `docs/ui-refresh/` was untracked. No
pre-existing change was discarded. Compared the actual original dark,
rejected light, and second dark screenshots in `docs/ui-refresh/`.

Changed only the React interface: a softer blue gradient for the library,
slate composer, lighter blue search and card planes, warmer ivory text, more
defined borders/badges/fields/code headers, and restrained amber actions and
card rail marks. The short error/loading columns now stretch their library
background to the full workspace height after an initial screenshot revealed
an abrupt horizontal cutoff. Login and registration use the same color depth.
Copy now confirms on the card for 2.2 seconds as well as in the existing
status message; that timeout is cleaned up on session clear and unmount.
Editing the composer has a brief entrance animation. Existing reduced-motion
CSS disables these effects. No font, dependency, backend, seed, HTTP contract,
JWT persistence, or Tauri configuration was changed.

Chromium signed in to the real local Rails account and loaded seven existing
snippets. Captured and visually reviewed the final connected library at
1440×900, 1024×800, 720×600, 390×844, and 320×700; all had seven cards and
no horizontal document overflow. The 720×600 capture is a browser viewport
with Tauri-like dimensions, not native Tauri evidence. Captures also cover
login, registration, copy feedback, filtered empty results, edit, deletion
confirmation, validation, real blocked-API error, and delayed-request loading.
Links and comparison with original dark and rejected light are in
`docs/ui-refresh/README.md`. The five requested visual criteria passed on the
real captures: blue/amber recognition, gentle background depth, lighter slate
zones without a white theme, visible card/control/type improvements, and
preserved page organization and functions.

Browser interactions checked: search and clear; language filter (`3 of 7`
for Bash); `/` focus; copy success state; edit/cancel; delete prompt/cancel;
required-field validation; create, update, and delete of one temporary UI
review snippet, returning to seven original records; API error and retry,
including visible skeleton and recovery to seven records. Headless Chromium
denied clipboard readback, so byte-for-byte clipboard equality was not
verified, although the write path displayed success. In reduced-motion
emulation, button transitions were reduced to `0.01ms` and smooth scrolling
was off. Authentication and registration forms were inspected visually; no
new account was created. The existing frontend tests cover 401 clearing and
in-memory session behavior, but live token expiry was not exercised here.

Final automated results: ESLint passed; Vitest 2 files/23 tests passed;
browser and desktop Vite builds passed (JS 296.52 kB, CSS 25.52 kB);
`git diff --check` passed. Native `npm run tauri -- build` was attempted and
failed before compilation because `cargo` is absent (`cargo metadata`: file
not found). Native WSLg rendering, official WDIO suites, backend tests,
other browsers, full accessibility/performance audit, and live 401 expiry
were not run. No commit, push, merge, staging, deployment, Debian
installation, or host package change was performed.

## V1 readiness audit and local UI screenshot exclusion

**Date:** November 19, 2026
**Branch:** `UI-rework`, HEAD `8d6249b`
**Status:** partial (browser paths verified; versioned web smoke needs a loading wait; native Tauri unavailable)

User authorized this audit, screenshot Git exclusion, remote-reference refresh,
and validation for a local demonstration, without commit, push, merge or rebase.
Read AGENTS.md, brief.md, runs-workflow.md and this journal in full. This is an
audit of existing work, not execution of future deployment/offline/sync runs.
Preserved the pre-existing changes in App.jsx, App.test.jsx, SnippetCard.jsx,
index.css, this journal, and the untracked docs/ui-refresh directory. The latest
completed numbered run remains Run 12 and its corrective audit; subsequent
authentication and visual continuations retain their historical partial status.

Located the exact directory docs/ui-refresh: 76 genuine PNG screenshots plus
README.md. None of the images was tracked or staged, so no index removal was
needed. Added only /docs/ui-refresh/**/*.png to the root .gitignore. Verified
all 76 with git check-ignore, checked README.md is not ignored, git ls-files is
empty for that directory, and all 77 original files remain byte-identical by
SHA-256. Other screenshot directories were untouched. No occurrence was found
in accessible git log --all history. Any screenshots already pushed in older
commits would remain accessible; no history rewrite was attempted.

git fetch --all --no-tags initially failed because .git was read-only in the
sandbox, then succeeded with authorized access. git ls-remote confirmed
develop at 8d6249b and main at 58027a3, matching local branches. UI-rework has
no upstream or published remote branch. develop...HEAD is 0/0; main...develop
is 0/33, with main the common ancestor. The redesign remains entirely
uncommitted/unpushed. The index had no changes and remains unchanged.

Checks: ESLint passed; Vitest 23 tests/2 files passed; web and desktop Vite
builds passed (JS 296.52 kB, CSS 25.52 kB). Explicitly selected installed Ruby
3.4.2 / Bundler 4.0.5 rather than the shell's Ruby 3.4.10. bundle check passed.
Rails first failed on sandbox PostgreSQL permissions; authorized rerun passed
32 tests/203 assertions, zero failures/errors/skips. RuboCop: 39 files, clean.
Zeitwerk passed; all four migrations are up in development and test.
bin/brakeman failed in its ensure-latest check with NoMethodError. Direct
bundle exec brakeman completed its scan with zero scan errors but one
Unmaintained Dependency / EOLRails warning on Rails 8.0.5 (exit 3).

Started temporary Rails/Vite services and cached Chromium 153 under WSL2.
Extracted the missing audio library under /tmp without host installation.
DevTools checks verified real invalid login, registration 422 and 201, CORS
bearer visibility, /me, empty library, full CRUD, search/filter/clear, slash
focus, validation/focus, copy feedback, edit/delete cancel, network failure and
retry, retained draft after failed mutation, reload sign-in requirement,
logout/revocation and real 401 private-state clearing. Second-account empty
list and existing Rails tests confirm ownership isolation. Literal HTML in a
snippet did not execute. No runtime exceptions were observed in the scripted
DevTools scenarios. Clipboard content readback was not verified.

Captured widths 1440/1024/820/720/390/320 with no document horizontal overflow;
directly inspected desktop and mobile current captures. Reduced motion removes
smooth scroll and reduces transitions. Then served a fresh production web build
at the allowed origin using vite preview: login/create/update/delete/logout
passed at 390x844 with mobile and touch emulation, 390/390 document width.
This is Chromium evidence, not a physical phone or native WebView validation.
Runtime JWT expiry is 3600 seconds, without refresh. Natural one-hour expiry
was not waited out. Two simultaneous tokens were checked: logout of one also
revokes the other (JTIMatcher); document this shared-account behavior.

Ran the repository's two WDIO web specs with a temporary config pointing to
cached Chromium and a driver under /tmp because /usr/bin/google-chrome is
absent. CRUD passed; responsive failed because the helper waits for the title
before snippets finish loading, then measures zero cards. A diagnostic copy
under /tmp with one added wait for a card passed both specs. The versioned
tests were not edited and must not be reported green. Temporary DevTools script
serialization/syntax and click-timing issues were corrected during diagnosis;
they were not application defects.

No development db:seed ran. Seed tests passed including explicit-owner failure,
idempotence and isolation. Read-only state showed two existing users and seven
seed-titled snippets owned by user 2. Created two UUID audit accounts and only
their temporary snippets; removed both accounts and their two remaining rows
after tests. Final data: two users, seven snippets for owner 2, zero audit
accounts. No existing account credentials or data were modified.

Tauri build failed before compilation: cargo metadata executable absent.
Partial tauri info also reports missing WebKitGTK 4.1 and rsvg2; it was stopped
after producing no further output. Static review confirmed restricted CSP,
API-scoped capability, native cookie feature disabled, deb/AppImage targets,
and release WebDriver guard. rustfmt/Clippy/drivers unavailable. No native
build, WSLg launch/auth/CRUD, desktop WDIO/HMR/offline, bundle lifecycle or
Debian installation. Historical July native results predate authentication.

Remaining findings and exact user action order are in
docs/v1-readiness-2026-11-19.md, with the full 76-file image inventory. Important
differences: current frontend works with protected API, but the seed fetch
example and README curl omit JWT and return 401; auth UI hint omits server
expiry; architecture documents lag auth; performance fixture script omits
user_id; legacy populated-data ownership migration has no backfill; CI YAML
is nested under backend/.github; README/frontend/Tauri versions differ.
Verdicts: UI-rework to develop ready with conditions; develop to main blocked
until versioned smoke, integration and presentation scope are resolved. Browser
local demo is feasible; any desktop V1 requires fresh native validation.

Intentionally changed files: .gitignore, docs/v1-readiness-2026-11-19.md and
this appended journal entry. Pre-existing application/README changes retained.
Temporary artifacts stay under /tmp and ignored frontend build output. Rails,
Vite preview and the temporary browser were stopped after validation. Final
git diff --check passed; the original frontend diff and index are byte-identical
to the saved initial patches, previous journal content is preserved, all 77 UI
files retain their hashes, and status shows only the intended new audit/ignore
documentation alongside pre-existing work. No commit, push, merge, rebase or
branch change performed.

## Browser V1 correction run — Startup, smoke and documentation

**Date:** November 19, 2026
**Branch:** `UI-rework`, HEAD `8d6249b`
**Status:** completed (requested local-browser scope; native Tauri explicitly unverified)

User explicitly requested a local-browser V1 review, without commit, push,
merge, rebase, branch change or staging modification. Read AGENTS.md, brief.md,
runs-workflow.md and this journal. Preserved the initial modified .gitignore,
App.jsx, App.test.jsx, SnippetCard.jsx, index.css, journal and untracked UI
README/readiness report. Saved hashes and initial worktree/index patches under
/tmp/snipstack-v1-finalize. No future deployment/offline/sync run started.

Reproduced exact `npm run dev` from frontend: exit 1, `listen EPERM: operation
not permitted 127.0.0.1:5173`. A minimal Node TCP server also fails with EPERM
on automatic port 0 inside the sandbox. Outside it, both target ports were
initially free, Vite 8.1.5 was installed, the dev script was `vite`, and no
relevant Vite/Tauri override existed. The identical npm command with local
socket permission started in 395 ms at http://127.0.0.1:5173/. GET / and
/src/main.jsx returned 200; Chromium loaded the app and reached Rails. No
script/config/dependency change or reinstall was needed. README now documents
the correct directory, socket restriction and distinct occupied-port handling.
The strict 5173 origin was retained. The full error is in the readiness report.

Before visual editing, inspected current desktop, 320px library and login
captures from a real Chromium session. Concrete defect: long account email
compressed the desktop Sign out and New snippet labels onto two lines. Added
only flex-shrink: 0 and white-space: nowrap to topbar session buttons. Verified
both labels now occupy one text line with the email still ellipsized. No
palette, major-region or animation change. Updated the inaccurate session hint
to mention expiry as well as reload/close, without changing session behavior.
After editing, checked all six widths (1440/1024/820/720/390/320): no document
overflow or input/select/textarea outside the viewport. Visually inspected the
result and 320px login/registration; browser CRUD and validation also passed
at 320px. No further visual changes were justified.

Corrected the versioned responsive web smoke with waitForDisplayed on a real
snippet card before the baseline measurement, without a fixed sleep. Retained
the overflow/focus/reduced-motion/CRUD assertions and added 390/320 widths.
Made Chrome path optionally configurable via CHROME_BINARY, preserving the
default. Executed actual `npm run test:web`, repository config/specs: two
passing scenarios, exit 0. Used cached Chromium 153 and its existing compatible
driver via environment variables; no diagnostic spec/config copy. Account
credentials were generated for this run and injected without printing them.

Updated README startup/prerequisite/session/JWT/test instructions. Anonymous
snippets curl now expects 401 instead of implying unavailable Rails. Protected
curl obtains its header from stdin after masked input; passwords/tokens are
not hardcoded. Corrected only the description/code text of the React fetch
seed example: token argument, Authorization header and HTTP status check.
No seed logic/controller/model/migration change, and no development db:seed.
Verified the documented curl and extracted example against the audit account:
private list with token, explicit 401 without. Existing stored demo example
still lacks Authorization (read-only verification); user may update that one
record through the UI if presenting it. It was left untouched by this run.

Removed 32 Markdown links to ignored PNGs from docs/ui-refresh/README.md,
retaining filenames as optional local references and explanatory descriptions.
Updated docs/v1-readiness-2026-11-19.md to the current browser scope/results;
retained its full 76-file inventory and verified it has no PNG hyperlinks.
Images remain ignored, byte-identical and untracked. No change to .gitignore
in this continuation. No need to read an absent local screenshot to understand
either published document.

Automated checks after application corrections: ESLint passed; Vitest 23 tests
in two files passed; web and desktop Vite builds passed (JS 296.55 kB, CSS
25.58 kB); Rails 32 tests/203 assertions passed, no failures/errors/skips;
RuboCop 39 files clean; Zeitwerk passed. Selected existing Ruby 3.4.2/Bundler
4.0.5 via RVM; no dependency/version change. Native tauri build attempted:
exit 1 before compilation, cargo metadata executable absent. Cargo, rustfmt,
Clippy and native drivers absent; no desktop runtime or artifact validation.

Actual browser scenarios with protected Rails verified registration/login,
/me, list, create/update/delete, cancellation, copy feedback, search/filter,
slash focus, validation, network errors/retry and retained failed draft,
reload, logout and real revoked-token 401 private-state clearing. Initial
DevTools suite observed no runtime exceptions. After correction, versioned
WDIO also passed responsive interactions and real CRUD. Served the final Vite
build via preview on the same allowed origin; touch/mobile 390x844 passed
login/list/create/update/delete/logout with 390/390 document width.

Direct Brakeman scan: zero scan errors, one EOLRails warning, exit 3. Inspected
its installed date table: October 7, 2026 for Rails 8.0.x. Official Rails
maintenance policy instead gives November 7, 2026 for security support; both
are before this run. Source: https://rubyonrails.org/maintenance (read during
this run). This warning identifies maintenance debt, not a demonstrated CVE
exploit. With network permission, bin/brakeman exits 5 before scanning because
installed scanner 8.0.5 is older than announced 8.1.0. Neither scanner nor Rails
was updated. Loopback-only demo reduces exposure but does not remove the debt;
no clean-security or public-release claim.

Used only two new UUID audit accounts and their temporary records. Cleanup
returned development to two users/seven snippets, all owned by user 2, and zero
audit accounts; original records were not edited. Runtime services/browser
are stopped after validation. Temporary evidence remains under /tmp and
ignored frontend build output.

Read remote heads without fetching/moving local references: develop 8d6249b,
main 58027a3, no remote UI-rework. develop...HEAD remains 0/0 and main...develop
0/33. All redesign/correction changes remain local, uncommitted and unpushed.
Verdicts: UI-rework to develop ready for review of the tested local content;
develop to main ready with conditions for browser-local V1 only, after user
integration and checks on the exact resulting develop commit. User performs
all staging, commits, pushes and merges.

Not verified: physical phones, other browsers, natural one-hour JWT expiry,
clipboard readback, exhaustive accessibility/performance/security audit, CI,
fresh installation and legacy populated-database upgrade. Native Tauri is
outside this browser-only V1 verdict; no future offline/sync work implemented.
Final checks passed: git diff --check; staging byte-identical to the initial
patch; complete previous journal preserved; original frontend changes retained
apart from the documented button rule and session hint; no changes outside the
nine authorized source/documentation files; all 76 PNG hashes and exclusions
unchanged; UI README still visible to Git; neither UI README nor readiness
report has a PNG hyperlink. Final status remains UI-rework with ten modified
tracked files (including preserved earlier edits) and two untracked Markdown
documents. No Git history/index/branch operation performed.

## Startup clarification — Working directory

**Date:** November 19, 2026
**Branch:** `UI-rework`
**Status:** completed

The user clarified that their original npm run dev failure came from running
it at the repository root instead of frontend/. No npm/Vite repair is needed
and none was applied. The EPERM reproduced during validation is a separate
agent-sandbox socket restriction, not the cause of the user's initial issue.
Updated README and the V1 report to distinguish those facts; retained the
verified startup evidence and all previous changes. Documentation-only check:
git diff --check passed; staging unchanged. Application tests were not rerun
because no application, test or configuration file changed in this follow-up.
No commit, push, merge, rebase or branch change.
