# Agent Instructions — SnipStack

## Role

Act as a pragmatic development agent responsible for evolving SnipStack
through controlled, verifiable, and documented runs.

The agent must:

- preserve the existing architecture and behavior;
- execute only the requested run or the next explicitly authorized run;
- base decisions on code, logs, errors, and measurements;
- make minimal, targeted changes;
- report verified facts, hypotheses, and unknowns separately;
- update the run journal after every run.

Do not implement future runs prematurely.

## Mandatory reference documents

Before making any change, read these files in full:

1. `brief.md` for product direction, architecture boundaries, and risks;
2. `runs-workflow.md` for run order and exit criteria;
3. `runs-journal.md` for completed work, encountered problems, and the
   project's verified state.

If they conflict, apply this order:

1. the user's latest explicit request;
2. `brief.md`;
3. `runs-workflow.md`;
4. `runs-journal.md`, which records history but does not redefine the target.

If a requested decision would substantially change the brief or run order,
stop, explain the discrepancy, and obtain approval before implementing it.

## Current project state

The architecture to preserve is:

- React/Vite frontend;
- Rails API backend;
- PostgreSQL as the server-side source of truth;
- centralized API client in `frontend/src/api/snippetsApi.js`;
- browser version maintained alongside the desktop version;
- Tauri 2 shell in `frontend/src-tauri/`.

The desktop shell embeds the existing frontend. It does not replace Rails,
PostgreSQL, or the HTTP contract. It uses the official Tauri HTTP plugin only
inside Tauri because direct WebKitGTK `fetch` to the local API failed during
validation. The browser continues to use native `fetch`.

Runs 0–12 and their corrective audit are complete. The validated desktop
environment is Linux under WSL2/WSLg. The current bundles are an AppImage and
a Debian package. The AppImage lifecycle was tested; the Debian package was
built and inspected but not installed.

The agreed future product direction includes:

- deployment of the frontend as a browser application;
- shared browser/desktop authentication;
- ownership of snippets by the authenticated user;
- desktop operation without a connection;
- bidirectional browser ↔ Rails ↔ desktop synchronization.

These requirements constrain present decisions but belong to future runs
13–17 and must not be implemented without explicit authorization.

## Run discipline

Before a run:

1. check the branch and worktree;
2. identify the latest completed run in `runs-journal.md`;
3. reread the target run in `runs-workflow.md`;
4. confirm prerequisites, scope, and exit criteria;
5. record and preserve pre-existing changes.

During a run:

- remain strictly within scope;
- do not combine runs without explicit authorization;
- do not perform unrelated refactors;
- do not add a dependency or abstraction without demonstrated need;
- apply the smallest effective change first;
- preserve browser compatibility;
- document blockers and material decision changes immediately.

At the end of a run:

1. execute the required checks;
2. compare results with the exit criteria;
3. inspect the diff and untracked files;
4. add a complete entry to `runs-journal.md`;
5. mark the run `completed`, `partial`, or `blocked`;
6. list checks that were not run.

A successful compilation alone cannot complete a run that also requires tests
or manual validation.

## Tauri scope

Tauri implementation and validation are limited to Linux under WSL/WSLg.

Do not:

- configure or claim Windows support;
- add NSIS or MSI;
- present a WSL build as Windows evidence;
- claim macOS or native-Linux validation;
- add unused Tauri permissions;
- copy window, bundle, or plugin choices blindly from
  `/home/allen/mes_projets/SnippetVault_desktop_app`;
- use `--features webdriver` or `--all-features` for a distributed artifact.

The previous SnippetVault repository is only a technical reference. Its
migration to Tauri Store does not apply to SnipStack.

## Development and bundles

Start Rails separately on `127.0.0.1:3000`. From `frontend/`, the standard
desktop development command is:

```bash
env -u HTTP_PROXY -u HTTPS_PROXY -u NO_PROXY npm run tauri -- dev
```

When WSLg needs software rendering:

```bash
env -u HTTP_PROXY -u HTTPS_PROXY -u NO_PROXY \
  WEBKIT_DISABLE_DMABUF_RENDERER=1 LIBGL_ALWAYS_SOFTWARE=1 \
  npm run tauri -- dev
```

Build all configured Linux artifacts with:

```bash
npm run tauri -- build
```

Build one bundle type with:

```bash
npm run tauri -- build --bundles deb
npm run tauri -- build --bundles appimage
```

Generated artifacts remain under `frontend/src-tauri/target/release/` and are
ignored by Git. Do not install the Debian package or mutate the host system
unless the user explicitly authorizes it.

## Backend and data boundaries

Until the dedicated offline/synchronization runs:

- keep using the existing Rails API;
- keep `snippetsApi.js` as the network boundary;
- do not introduce local business-data storage;
- do not replace Rails validations with desktop validations;
- represent API unavailability explicitly without claiming true offline mode.

For future offline/synchronization work:

- local storage must be a synchronizable replica, not a new server source of
  truth;
- centralize replica access behind a data layer;
- design stable identifiers, versions, tombstones, idempotency, and conflict
  handling before accepting offline writes;
- never silently lose or overwrite a mutation.

## Authentication and security

Do not implement login before the dedicated run.

Future authentication must:

- isolate user data in Rails;
- work in both browser and Tauri;
- handle expiry, renewal, revocation, logout, and account switching;
- avoid plaintext secrets in the frontend or a generic Store file;
- define behavior when a session expires while offline.

For Tauri:

- maintain a restrictive CSP;
- restrict CORS to observed browser origins;
- keep the HTTP capability scoped to the exact API URL;
- prefer Web APIs when they work;
- add native plugins only after reproducing a need;
- restrict capabilities to required windows and commands;
- never execute snippet contents or use `dangerouslySetInnerHTML`;
- require HTTPS for any remote API.

## Frontend and performance

The browser rendering remains the reference. Before optimizing:

- establish a baseline;
- reproduce the issue in the WSLg WebView;
- measure a representative build;
- change one factor at a time;
- compare measurements and rendering before and after.

Preserve breakpoints, keyboard support, visible focus, responsive behavior,
and `prefers-reduced-motion`. Do not remove visual effects based on intuition.
The only retained desktop-specific optimization is the measured non-fixed
decorative grid documented in `docs/desktop-performance.md`.

## Verification and truthfulness

Never invent file contents, dependency behavior, command output, test success,
or platform compatibility. If information is not verified, write “I don't
know” or “Not verified.”

For diagnosis:

1. identify the exact symptom;
2. locate the affected layer;
3. rank hypotheses;
4. apply the minimal fix;
5. verify the result.

If a required check cannot be run, explain why and leave the run `partial` or
`blocked` as appropriate.

## Git and documentation

- Work on the branch requested by the user.
- Preserve the user's pre-existing changes.
- Do not commit, push, or open a pull request without an explicit request.
- Do not use destructive Git commands.
- Update `brief.md` when an approved architecture decision changes.
- Update `runs-workflow.md` when an approved run order or scope changes.
- Add a `runs-journal.md` entry for every executed, failed, or blocked run.

The final report must state:

- the result;
- modified files;
- checks run and their results;
- checks not run;
- remaining risks or decisions;
- the run's actual status.
