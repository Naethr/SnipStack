# SnipStack

[![Version: MVP v1.0.0](https://img.shields.io/badge/version-MVP%20v1.0.0-7c3aed)](https://github.com/Naethr/SnipStack)
[![License: MIT](https://img.shields.io/badge/license-MIT-22c55e.svg)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev/)
[![Rails 8](https://img.shields.io/badge/Rails-8-cc0000?logo=rubyonrails&logoColor=white)](https://rubyonrails.org/)
[![Tauri 2](https://img.shields.io/badge/Tauri-2-24c8db?logo=tauri&logoColor=white)](https://v2.tauri.app/)
[![Desktop: WSLg validated](https://img.shields.io/badge/Desktop-WSLg%20validated-0ea5e9)](docs/desktop-validation.md)

**Current product version:** MVP v1.0.0

SnipStack keeps one frontend and one server-side source of truth across two
delivery targets:

- React/Vite frontend running in a browser;
- separate Rails API backed by PostgreSQL;
- optional Tauri 2 desktop shell embedding the same frontend.

The V1 review targets the local browser application. Historical desktop
validation covers Linux under WSL2/WSLg before authentication; the current
authenticated desktop paths still need native validation. Windows, macOS,
and native Linux have not been tested.

## Repository layout

```text
backend/             Rails API and PostgreSQL integration
frontend/            React/Vite web application
frontend/src-tauri/  Tauri 2 desktop shell and Linux bundle configuration
docs/                Architecture, validation, performance, security, and release evidence
```

Rails and PostgreSQL are not embedded in the desktop application. They must be
running for snippets to load or change.

## Prerequisites

Browser development requires Node.js/npm, Ruby/Bundler, and PostgreSQL.
Use the backend's `.ruby-version` and lockfile (Ruby 3.4.2, Bundler 4.0.5).
In a non-interactive RVM shell, run `source ~/.rvm/scripts/rvm` followed by
`rvm use .` from `backend/` before running Rails commands.

Rust/Cargo and the native dependencies below are needed only for Tauri.
On Ubuntu under WSL, install the Linux development dependencies recommended
for Tauri 2:

```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file \
  libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
```

`webkit2gtk-driver` and `tauri-driver` are needed only to automate a production
artifact through WebDriver:

```bash
sudo apt install webkit2gtk-driver
cargo install tauri-driver --locked
```

The regular desktop smoke test uses test-only embedded instrumentation and
does not require those two external tools.

## Start the Rails API

From `backend/`:

```bash
bundle install
bin/rails db:create db:migrate
bundle exec rails server -b 127.0.0.1 -p 3000
```

The desktop client expects `http://127.0.0.1:3000/api/v1`.

Backend checks:

```bash
bundle exec rails test
bundle exec rubocop
```

### Demo snippets

Create an account through the app first. To load the demo snippets into that
existing account later, choose its email explicitly:

```bash
cd backend
SNIPSTACK_SEED_EMAIL='chosen@example.com' bin/rails db:seed
```

The seed task fails before writing anything if the email is missing or unknown.
It never creates a user. Repeating the command for the same owner updates that
owner's examples without duplicating them; another user's snippets are left
alone. Check with an owner-scoped count in the Rails console, or sign in as
the selected user and inspect the library. Do not run `db:prepare` just to
load these examples into an existing database.

## Run the browser application

From the repository root:

```bash
cd frontend
npm run dev
```

Run the command from `frontend/`, not directly from the repository root.
The reported startup issue was caused by using the root directory; no npm or
Vite correction was needed.

On a fresh checkout, run `npm ci` in `frontend/` once to install the lockfile's
dependencies. Reinstallation is not a remedy for a socket-permission error.

Open **http://127.0.0.1:5173/**. Vite deliberately uses strict port `5173`,
matching Rails CORS. Start Rails separately using the command above; without
the API, the page still loads but sign-in and snippet requests cannot succeed.
From the repository root, `npm --prefix frontend run dev` is equivalent.

Separately, if startup reports `listen EPERM ... 127.0.0.1:5173`, the process lacks permission
to bind a local socket. In the agent sandbox this was reproduced even with a
minimal Node TCP server on an automatically assigned port. Running the same
`npm run dev` in an authorized local terminal succeeded without code changes.
Use a terminal or execution context allowed to open local sockets; changing
Vite's host or reinstalling dependencies does not grant that permission.

For `Port 5173 is already in use`, inspect `ss -ltnp '( sport = :5173 )'`.
Reuse the intended frontend or stop your own earlier instance in its terminal
with Ctrl+C. Do not stop an unidentified process or silently move Vite to a
different port: the default API CORS policy permits this exact browser origin.

The browser uses native `fetch` and remains independent from Tauri. Register
or sign in to access snippets. The JWT stays only in application memory; a
browser reload or Tauri restart requires signing in again. Tokens also expire
after one hour with the current server configuration; there is no automatic
renewal. A `401` clears private frontend state and asks for sign-in. Logout
revokes all existing tokens for that account, including another browser session.

Frontend checks:

```bash
npm run lint
npm test
npm run build
```

With Rails and Vite already running, run the Chrome Linux smoke suite from
another terminal. Set credentials for an existing test account in the shell.
The responsive scenario expects at least one snippet in that account; the
demo seeds above are suitable. Do not commit the credentials:

```bash
read -r -p 'Test account email: ' SNIPSTACK_TEST_EMAIL
read -r -s -p 'Test account password: ' SNIPSTACK_TEST_PASSWORD
printf '\n'
export SNIPSTACK_TEST_EMAIL SNIPSTACK_TEST_PASSWORD
npm run test:web
unset SNIPSTACK_TEST_EMAIL SNIPSTACK_TEST_PASSWORD
```

The default Chrome path is `/usr/bin/google-chrome`. If Chrome/Chromium lives
elsewhere, set `CHROME_BINARY` to its absolute executable path before running
the same `npm run test:web`. WDIO's `CHROMEDRIVER_PATH` can select an existing
compatible driver; otherwise WDIO may need network access to obtain one.
The responsive smoke waits for a real snippet card before measuring layout,
and includes 390 px and 320 px widths. An empty account does not meet this
scenario's documented prerequisite.

## Run Tauri in development

Start Rails first on `127.0.0.1:3000`. Then, from `frontend/`, run:

```bash
env -u HTTP_PROXY -u HTTPS_PROXY -u NO_PROXY npm run tauri -- dev
```

Tauri starts Vite in desktop mode through `beforeDevCommand`, opens
`http://127.0.0.1:5173` in the WebView, and enables HMR. The main window starts
at `1280×800` with a minimum size of `720×600`.

If WSLg reports EGL or DMABUF errors, use the validated software-rendering
workaround:

```bash
env -u HTTP_PROXY -u HTTPS_PROXY -u NO_PROXY \
  WEBKIT_DISABLE_DMABUF_RENDERER=1 \
  LIBGL_ALWAYS_SOFTWARE=1 \
  npm run tauri -- dev
```

To validate HMR inside the Tauri WebView, start the instrumented development
application:

```bash
env -u HTTP_PROXY -u HTTPS_PROXY -u NO_PROXY \
  TAURI_WEBDRIVER_PORT=4445 \
  WEBKIT_DISABLE_DMABUF_RENDERER=1 \
  LIBGL_ALWAYS_SOFTWARE=1 \
  npm run tauri -- dev --features webdriver \
  -c src-tauri/tauri.webdriver.conf.json
```

Then run in a second terminal:

```bash
env -u HTTP_PROXY -u HTTPS_PROXY -u NO_PROXY npm run test:desktop:hmr
```

## Desktop API configuration

Copy `frontend/.env.example` to the ignored
`frontend/.env.desktop` file when a local override is needed:

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:3000/api/v1
```

This URL is also the built-in fallback. Never put a secret in a `VITE_*`
variable: Vite exposes these values in the frontend bundle.

The browser uses native `fetch`. Tauri uses the official HTTP plugin because
WebKitGTK rejected direct Web `fetch` calls from `tauri://localhost` to the
local HTTP API. The production capability is restricted to
`http://127.0.0.1:3000/api/v1/**`. A future remote API must use HTTPS and its
URL must be updated both in the environment configuration and in the Tauri
capability.

## Desktop tests

Run the WSLg smoke test with test-only Tauri instrumentation and the same
`SNIPSTACK_TEST_EMAIL` / `SNIPSTACK_TEST_PASSWORD` shell variables:

```bash
npm run test:desktop
```

The Cargo `webdriver` feature adds WDIO plugins and permissions only to test
builds. Never use it with a bundle command, `--all-features`, or a release
pipeline. A build guard rejects this combination.

To automate the production AppImage, start the external driver:

```bash
env -u HTTP_PROXY -u HTTPS_PROXY -u NO_PROXY \
  WEBKIT_DISABLE_DMABUF_RENDERER=1 \
  LIBGL_ALWAYS_SOFTWARE=1 \
  tauri-driver --native-driver /usr/bin/WebKitWebDriver
```

In a second terminal:

```bash
env -u HTTP_PROXY -u HTTPS_PROXY -u NO_PROXY \
  WEBKIT_DISABLE_DMABUF_RENDERER=1 \
  LIBGL_ALWAYS_SOFTWARE=1 \
  npm run test:desktop:artifact
```

The offline-state test requires Rails to be deliberately stopped:

```bash
env -u HTTP_PROXY -u HTTPS_PROXY -u NO_PROXY \
  WEBKIT_DISABLE_DMABUF_RENDERER=1 \
  LIBGL_ALWAYS_SOFTWARE=1 \
  npm run test:desktop:offline
```

The local performance probe described in
`docs/desktop-performance.md` is the sole allowed use of
`SNIPSTACK_ALLOW_RELEASE_WEBDRIVER=1`.

## Build the desktop application

From `frontend/`:

```bash
npm run build:desktop
npm run tauri -- build --no-bundle
npm run tauri -- build
```

The last command builds both Linux bundle targets declared in
`src-tauri/tauri.conf.json`:

```text
src-tauri/target/release/snipstack-desktop
src-tauri/target/release/bundle/deb/SnipStack_0.1.0_amd64.deb
src-tauri/target/release/bundle/appimage/SnipStack_0.1.0_amd64.AppImage
```

### Install and launch the Debian package

The package has been built and inspected, but installation has not been
validated in this project. Installing it changes the WSL system:

```bash
cd frontend
npm run tauri -- build --bundles deb
sudo apt install ./src-tauri/target/release/bundle/deb/SnipStack_0.1.0_amd64.deb
snipstack-desktop
```

If the executable is not on `PATH`, inspect the installed file list:

```bash
dpkg -L snip-stack
```

Remove the package with:

```bash
sudo apt remove snip-stack
```

### Launch the AppImage

The AppImage lifecycle has been validated under WSLg. Build and launch it with:

```bash
cd frontend
npm run tauri -- build --bundles appimage
chmod +x src-tauri/target/release/bundle/appimage/SnipStack_0.1.0_amd64.AppImage
env -u HTTP_PROXY -u HTTPS_PROXY -u NO_PROXY \
  WEBKIT_DISABLE_DMABUF_RENDERER=1 \
  LIBGL_ALWAYS_SOFTWARE=1 \
  ./src-tauri/target/release/bundle/appimage/SnipStack_0.1.0_amd64.AppImage
```

The `chmod` step is normally needed only once per rebuilt artifact. Rails must
already be running on `127.0.0.1:3000`.

## Logs and troubleshooting

From the repository root, first verify that Rails is listening and responding.
All snippets routes require a bearer JWT; an anonymous `401` proves that Rails
answered and is not an API-unavailable result:

```bash
ss -ltnp '( sport = :3000 )'
curl --silent --show-error --output /dev/null --write-out 'HTTP %{http_code}\n' \
  http://127.0.0.1:3000/api/v1/snippets
```

To inspect the protected list, use a short-lived token from the `Authorization`
response header of a successful `/api/v1/auth/login` or `/auth/register`
request for your local account. Enter only the token, without the `Bearer`
prefix. Keep it out of source files, shell history, logs, and screenshots.
The following Bash example sends the header through curl's standard input
instead of putting the token in curl's command-line arguments:

```bash
read -r -s -p 'Local account JWT: ' SNIPSTACK_TOKEN
printf '\n'
printf 'header = "Authorization: Bearer %s"\n' "$SNIPSTACK_TOKEN" | \
  curl --config - --fail-with-body --show-error \
    http://127.0.0.1:3000/api/v1/snippets
unset SNIPSTACK_TOKEN
```

Expected: `200` and only that account's snippets. `401` means the token is
missing, expired or revoked; sign in again. A connection error means Rails
could not be reached. The demo's React fetch example also takes the token as
a function argument and sends `Authorization: Bearer ...`; it does not log
in automatically or contain credentials. It is example text, never executed
by SnipStack.

Follow Rails requests and errors with:

```bash
tail -f backend/log/development.log
```

Tauri, Vite, WDIO, and WebKitWebDriver write their errors to their respective
terminals. If the UI displays `API status · offline`, check port `3000`, run
the connectivity check above, distinguish HTTP authentication errors from
connection failures, and then inspect the Rails log. Empty proxy variables
must be removed with `env -u` for the external WebKitGTK tests.

The current local-browser review is in
[`docs/v1-readiness-2026-11-19.md`](docs/v1-readiness-2026-11-19.md).
Historical native artifact evidence is in
[`docs/desktop-validation.md`](docs/desktop-validation.md); a Vite desktop
build alone does not validate native Tauri behavior.

## Current limitations

- The API must be available to load or modify snippets.
- The current “offline” state is a recoverable error state, not offline data
  storage.
- Session renewal, local storage, bidirectional synchronization, and conflict
  handling remain future work.
- Artifacts are neither signed nor published.
- The Debian package was not installed during validation.
- Windows, macOS, and native Linux remain untested.

See [`brief.md`](brief.md), [`runs-workflow.md`](runs-workflow.md),
[`runs-journal.md`](runs-journal.md), and [`docs/`](docs/) for decisions and
evidence.

## License

SnipStack is released under the [MIT License](LICENSE).

Copyright © 2026 [Naethr](https://github.com/Naethr) and
[crousty24-bit](https://github.com/crousty24-bit).
