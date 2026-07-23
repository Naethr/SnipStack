# WSL/WSLg Desktop Validation Report

**Date:** July 23, 2026

**Branch:** `feature/desktop`

**Git base:** `b754bd2`

**Platform:** Ubuntu 24.04.3 under WSL2/WSLg, `x86_64`

This report records the corrective replay of runs 0–12 against the final
worktree. Nothing here validates Windows, macOS, or native Linux.

## Observed toolchain

| Tool | Version |
| --- | --- |
| Node.js | `24.14.1` |
| npm | `11.14.0` |
| Ruby | `3.4.2` |
| Bundler | `4.0.5` |
| Rails | `8.0.5` |
| PostgreSQL client | `16.14` |
| Rust/Cargo | `1.94.1` |
| Chrome Linux | `147.0.7727.101` |
| Tauri CLI | `2.11.4` |
| Tauri crate | `2.11.5` |

## Automated checks

| Check | Final result |
| --- | --- |
| `npm run lint` | passed |
| `npm test` | 2 files, 12 tests passed |
| `npm run test:web` | Chrome Linux, 2 scenarios passed |
| `bundle exec rails test` | 4 tests, 47 assertions, no failures |
| `bundle exec rubocop` | 26 files, no offenses |
| `cargo fmt --check` | passed |
| normal and test-feature Clippy | passed with `-D warnings` |
| embedded Tauri smoke | 2 active scenarios passed |
| HMR in `tauri dev` | 1 scenario passed in the WebView |
| occupied Vite port | explicit expected failure on `5173` |
| release WebDriver guard | explicit expected failure without override |

Rails coverage includes allowed OPTIONS/CRUD and rejected Tauri, third-party,
and `localhost` origins. JavaScript separately covers browser and Tauri
transports.

## Replayed browser baseline

With three cards in Chrome Linux development mode:

```text
DOMContentLoaded=212.7 ms
load=248.6 ms
JSHeapUsedSize=28574336 bytes
renderer TaskDuration=8.248 ms
scroll 24 frames=389.7 ms
worst frame=16.8 ms
```

The smoke covered `1440`, `1120`, `760`, and `420 px`, horizontal overflow,
filtering, focus, clipboard, and real browser CRUD.

## Replayed desktop profile

The instrumented release rendered 1,003 cards:

```text
optimized grid: median=1121 ms, worst frame=54 ms
original fixed grid: median=1351 ms, worst frame=62 ms
filter to one card=67 ms
```

The test protects at least a 5% comparative improvement. Fixture sets of 3,
100, and 1,000 were created and deleted; final state was `remaining=0`.

## Builds and artifacts

These commands passed:

```bash
npm run build:desktop
npm run tauri -- build --no-bundle
npm run tauri -- build
```

| Artifact | Size | SHA-256 |
| --- | ---: | --- |
| `snipstack-desktop` binary | 18,009,520 bytes | not distributed alone |
| `.deb` | 5,705,080 bytes | `700c4cb73a46b9e4dca7831556d306b36697c43d6acc21785ea32f3d47165f8f` |
| AppImage | 79,948,280 bytes | `49ddf511ad7b823534fbe7dc01ad87963adeec1826eeaade182aafdc7c8c901d` |

The normal binary is an x86-64 ELF PIE. After performance instrumentation, a
normal no-bundle build restored the production binary. No WDIO marker was
found in the normal binary or AppImage.

## AppImage lifecycle

The same AppImage passed full CRUD twice in independent launches. Rails was
then stopped and port absence verified. The offline suite confirmed the UI,
offline status, explicit error, and retry button. Rails was restarted and the
API returned 200 again.

The external driver logged a few `element not interactable` retries and a
GStreamer `appsink not found` warning. Scenarios still passed; these warnings
are specific to the observed WSLg automation path.

## Not verified

- real Debian package installation;
- artifact signing and publication;
- Windows, macOS, and native Linux;
- external security audit;
- login, real offline storage, and synchronization.
