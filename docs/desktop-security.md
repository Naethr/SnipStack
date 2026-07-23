# Tauri Hardening

**Date:** July 23, 2026

**Validated target:** Ubuntu WSL2 x86-64 with WSLg

## Production native surface

The runtime initializes Tauri 2 and the official HTTP plugin with default
features disabled. Enabled features are only `rustls-tls`, `http2`, and
`charset`. It initializes no Shell, Store, Clipboard, or filesystem plugin.
WDIO plugins are optional Cargo dependencies compiled only with `webdriver`.

HTTP `cookies` support is disabled, so no native persistent cookie jar is
created. Authentication must revisit this choice explicitly.

`build.rs` rejects Cargo `release` profiles with `webdriver`, including
`--all-features`. Only the local performance probe may set
`SNIPSTACK_ALLOW_RELEASE_WEBDRIVER=1`, and that override is forbidden for
distributed artifacts.

## Capability

`src-tauri/capabilities/default.json` is the sole production capability file.
It applies only to `main` and grants:

```text
http:default → http://127.0.0.1:3000/api/v1/**
```

Unused `core:default` was removed from production. The WebDriver profile adds
test permissions only. Inspection with `strings` found no
`tauri_plugin_wdio` or `wdio-webdriver` marker in the normal release binary.

## Content policy

Production CSP:

```text
default-src 'self';
base-uri 'none';
connect-src 'self' ipc: http://ipc.localhost;
font-src 'self';
form-action 'self';
frame-ancestors 'none';
img-src 'self' data:;
object-src 'none';
style-src 'self';
```

Scripts, styles, and Outfit fonts are bundled locally. No Google Fonts/CDN
domain, inline script/style, or `unsafe-eval` is allowed.

## Network

- Browser: native `fetch` with Rails CORS restricted to local Vite origins.
- Tauri: native HTTP plugin; no need to add `tauri://localhost` to Rails CORS.
- Plain HTTP is accepted only for the local WSL development API.
- A future remote API requires HTTPS and an explicit capability scope.

## Snippet rendering

Searches in `frontend/src` and `backend/app` found no
`dangerouslySetInnerHTML`, `innerHTML` assignment, `eval`, or `new Function`.
Snippet code is rendered as text in `code`/`pre` and is never executed.

## Executed checks

- `npm audit --omit=dev`: 0 vulnerabilities.
- `npm run lint`: passed.
- `cargo fmt --check`: passed.
- normal and webdriver Clippy with `-D warnings`: passed.
- Rails tests: 4 tests, initially 41 assertions, no failures.
- RuboCop: 26 files, no offenses.
- Tauri smoke with production CSP: passed.
- Cargo features: no cookies/cookie store.
- Normal release binary: no WebDriver marker.
- Release check with `webdriver` and no override: failed as expected.

## Uncertainties

No external security audit or penetration test was performed. Authentication,
session secrets, offline storage, and synchronization are not implemented.
Artifacts are unsigned. The performance override can deliberately create an
instrumented release binary; the procedure immediately restores a normal
no-bundle build afterward.
