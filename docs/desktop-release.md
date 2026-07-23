# Desktop Release Validation

**Date:** July 23, 2026

**Platform:** Ubuntu WSL2 x86-64 with WSLg

**Scope:** WSLg Linux only

## Observed toolchain

- Node.js `24.14.1`
- npm `11.14.0`
- Ruby `3.4.2`
- Bundler `4.0.5`
- Rails `8.0.5`
- PostgreSQL client `16.14`
- Rust/Cargo `1.94.1`
- Tauri CLI `2.11.4`
- Tauri crate `2.11.5`

## Builds

These commands passed from `frontend/`:

```bash
npm run build:desktop
npm run tauri -- build --no-bundle
npm run tauri -- build
```

The normal release binary is a dynamically linked 18 MiB x86-64 ELF PIE.

## Artifacts

| Artifact | Size | Run SHA-256 |
| --- | ---: | --- |
| `bundle/deb/SnipStack_0.1.0_amd64.deb` | 5,705,080 bytes | `700c4cb73a46b9e4dca7831556d306b36697c43d6acc21785ea32f3d47165f8f` |
| `bundle/appimage/SnipStack_0.1.0_amd64.AppImage` | 79,948,280 bytes | `49ddf511ad7b823534fbe7dc01ad87963adeec1826eeaade182aafdc7c8c901d` |

Paths relative to `frontend/`:

```text
src-tauri/target/release/bundle/deb/SnipStack_0.1.0_amd64.deb
src-tauri/target/release/bundle/appimage/SnipStack_0.1.0_amd64.AppImage
```

Hashes change on rebuild. `target/` is ignored by Git.

Build one target only with:

```bash
npm run tauri -- build --bundles deb
npm run tauri -- build --bundles appimage
```

## WSLg validation

- The normal release binary launched and stayed stable until deliberate exit.
- The AppImage with hash `49ddf511…c901d` passed API connection and full CRUD
  through `tauri-driver`/`WebKitWebDriver`.
- A second independent launch of the same AppImage passed full CRUD again.
- With the API deliberately stopped at startup, the UI remained available and
  showed offline status, explicit error text, and `Try again`.
- Retrying without the API emitted another request and kept a coherent offline
  state.
- Rails was restarted on the same port and cleanup found no smoke/performance
  data.

The external driver sometimes logged `element not interactable` before retry,
plus EGL/DRI3 and GStreamer warnings. Both AppImage suites passed. The WSLg
software-rendering workaround was:

```bash
WEBKIT_DISABLE_DMABUF_RENDERER=1 LIBGL_ALWAYS_SOFTWARE=1
```

## Dependencies and limits

- Rails and PostgreSQL run separately.
- `webkit2gtk-driver` is required only for external automation, not normal
  AppImage use.
- Artifacts are unsigned.
- The Debian package was built and inspected but not installed, so its install
  lifecycle is not validated.
- Windows, macOS, and native Linux are untested.
