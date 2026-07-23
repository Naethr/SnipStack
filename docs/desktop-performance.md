# WSLg Desktop Performance Profile

**Date:** July 23, 2026

**Environment:** Ubuntu WSL2 x86-64, WSLg, WebKitGTK 605.1.15

**Build:** optimized Tauri release with test-only WebDriver instrumentation

## Dataset

The run added 1,000 temporary snippets tagged `desktop-perf-20260723` to three
existing snippets, rendering 1,003 cards. Cleanup ended with
`deleted=1000`, `remaining=0`.

## Reproducible procedure

With Rails on `127.0.0.1:3000`, create and later delete fixtures from
`backend/`:

```bash
bin/rails runner script/desktop_performance_fixtures.rb create 1000
bin/rails runner script/desktop_performance_fixtures.rb delete
```

Between those commands, from `frontend/`:

```bash
SNIPSTACK_ALLOW_RELEASE_WEBDRIVER=1 \
  npm run tauri -- build --no-bundle --features webdriver \
  -c src-tauri/tauri.webdriver.conf.json

DESKTOP_PERF=1 \
  TAURI_APP_BINARY=./src-tauri/target/release/snipstack-desktop \
  WEBKIT_DISABLE_DMABUF_RENDERER=1 \
  LIBGL_ALWAYS_SOFTWARE=1 \
  npm exec -- wdio run wdio.conf.js --spec ./test/desktop/performance.spec.js
```

The `webdriver` feature is allowed only for this non-distributed measurement
binary. Never pass it to a bundle command or `--all-features` pipeline.

## Observed results

| Probe | Result |
| --- | ---: |
| rendered cards | 1,003 |
| final probe time after startup | `2101 ms` |
| filter to one card over two frames | `65 ms` |
| scroll endpoint | `scrollY=312401` |

These WSLg-local values do not isolate network, IPC, React, and rendering.

## Comparative CSS profile

Each variant ran three times in alternating order over 24 frames.

| Temporary variant | Median duration | Median worst frame |
| --- | ---: | ---: |
| original Tauri CSS | `1327 ms` | `61 ms` |
| no top-bar blur | `1333 ms` | `60 ms` |
| no fixed masked grid | `1094 ms` | `51 ms` |
| no grid image | `1250 ms` | `57 ms` |
| no mask | `1165 ms` | `55 ms` |
| non-fixed grid | `1103 ms` | `50 ms` |
| no large shadows | `1296 ms` | `137 ms` |
| no animations/transitions | `1351 ms` | `70 ms` |

Only the fixed position of `body::before` explained the improvement without
removing decoration. Tauri marks the root with `data-runtime="tauri"` and uses
`position: absolute`; browser CSS stays unchanged.

| Measure | Before | After | Change |
| --- | ---: | ---: | ---: |
| median duration | `1327 ms` | `1114 ms` | `-16.1%` |
| median worst frame | `61 ms` | `51 ms` | `-16.4%` |

The corrective audit reproduced the comparison:

| Variant | Median duration | Median worst frame |
| --- | ---: | ---: |
| optimized Tauri grid | `1121 ms` | `54 ms` |
| forced original fixed grid | `1351 ms` | `62 ms` |

Filtering took `67 ms`. The test now fails unless the original grid is at
least 5% slower. Cleanup again ended at `remaining=0`.

## Decision

Keep one measured, Tauri-only optimization. Screenshots at four sizes showed
no launch-time visual break. Removing blur, grid, mask, or shadows after this
change produced no acceptable reproducible benefit.

Virtualization and `content-visibility` remain future options if real user
volume requires them. Reduced motion remains covered. CPU/GPU usage was not
isolated with a system profiler, so results remain specific to WSLg software
rendering.
