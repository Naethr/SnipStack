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

The desktop integration is validated only on Linux under WSL2/WSLg. Windows,
macOS, and native Linux have not been tested.

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

The project requires Node.js/npm, Ruby/Bundler, PostgreSQL, and Rust/Cargo.
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
bin/rails db:prepare
bundle exec rails server -b 127.0.0.1 -p 3000
```

The desktop client expects `http://127.0.0.1:3000/api/v1`.

Backend checks:

```bash
bundle exec rails test
bundle exec rubocop
```

## Run the browser application

From `frontend/`:

```bash
npm install
npm run dev
```

The browser uses native `fetch` and remains independent from Tauri.

Frontend checks:

```bash
npm run lint
npm test
npm run build
```

With Rails and Vite already running, run the Chrome Linux smoke suite from
another terminal:

```bash
npm run test:web
```

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

Run the WSLg smoke test with test-only Tauri instrumentation:

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

From the repository root, first verify that Rails is listening and responding:

```bash
ss -ltnp '( sport = :3000 )'
curl --fail --show-error http://127.0.0.1:3000/api/v1/snippets
```

Follow Rails requests and errors with:

```bash
tail -f backend/log/development.log
```

Tauri, Vite, WDIO, and WebKitWebDriver write their errors to their respective
terminals. If the UI displays `API status · offline`, check port `3000`, run
the `curl` command above, and then inspect the Rails log. Empty proxy variables
must be removed with `env -u` for the external WebKitGTK tests.

The latest verified command, toolchain, metric, and artifact report is
available in [`docs/desktop-validation.md`](docs/desktop-validation.md).

## Current limitations

- The API must be available to load or modify snippets.
- The current “offline” state is a recoverable error state, not offline data
  storage.
- Login, local storage, bidirectional synchronization, and conflict handling
  are reserved for future runs 13–17.
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
