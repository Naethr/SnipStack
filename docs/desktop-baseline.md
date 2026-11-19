# Baseline Before Tauri Integration

**Date:** July 23, 2026

**Environment:** Ubuntu under WSL2/WSLg, `x86_64`

## Observed toolchain

| Tool | Version |
| --- | --- |
| Node.js | `24.14.1` |
| npm | `11.14.0` |
| Ruby | `3.4.2` |
| Bundler | `4.0.5` |
| Rails | `8.0.5` |
| PostgreSQL client | `16.14` |
| Rust | `1.94.1` |
| Cargo | `1.94.1` |

WSLg was available with `WAYLAND_DISPLAY=wayland-0` and `DISPLAY=:0`.

## Checks before Tauri

| Check | Initial result |
| --- | --- |
| `npm run lint` | passed |
| `npm run build` | passed in `240 ms` |
| JS bundle | `288.02 kB`, gzip `98.84 kB` |
| CSS bundle | `21.39 kB`, gzip `5.02 kB` |
| `bundle exec rails test` | command passed with 0 tests/assertions |
| `bundle exec rubocop` | failed with 5 pre-existing formatting offenses |

## API baseline

Rails ran on `http://127.0.0.1:3000`. Verified index 200, Vite CORS, create
201, update 200, invalid validation 422 with three messages, delete 204, and
read-after-delete 404. Temporary smoke data was deleted.

## Verified visual/browser baseline

Google Chrome Linux under WSL produced:

- `desktop-screenshots/web-1440x900.png`;
- `desktop-screenshots/web-1120x800.png`;
- `desktop-screenshots/web-760x800.png`;
- `desktop-screenshots/web-720x600.png`;
- `desktop-screenshots/web-420x900.png`.

At `1440×900`, Chrome loaded the heading and three cards, received API 200,
reported no console warnings/errors/exceptions, had no horizontal overflow,
focused the skip link on first Tab, and focused search visibly with `/`.
Controls and headings were named in the accessibility tree. Touching
`src/App.jsx` produced a real Vite hot update.

The final Chrome smoke also covered all widths, filters, keyboard/focus,
scroll, clipboard, local Outfit weights, reduced motion, and browser-fetch
CRUD.

| Chrome 147 development signal | Value |
| --- | ---: |
| `DOMContentLoaded` | `212.7 ms` |
| `load` | `248.6 ms` |
| JavaScript heap used | `28,574,336 bytes` |
| renderer task duration | `8.248 ms` |
| 24-frame scroll profile | `389.7 ms` |
| worst profile frame | `16.8 ms` |

These are reproducible local signals from `npm run test:web`, not a
multi-machine benchmark.

## Remote/local Outfit comparison

| Chrome measurement at `1440×900` | remote on `develop` | local branch |
| --- | ---: | ---: |
| H1 width | `203.375 px` | `203.421875 px` |
| H1 height | `41.53125 px` | `41.53125 px` |
| first title width | `261.03125 px` | `261.03125 px` |
| first title height | `24.578125 px` | `24.578125 px` |
| document height | `1699 px` | `1699 px` |
| Google Fonts requests | 2 × 200 | 0 |

No height, line-wrap, or document-height change was observed. The earlier
capture is `desktop-screenshots/web-develop-1440x900.png`.

## Reproducible datasets

From `backend/`:

```bash
bin/rails runner script/desktop_performance_fixtures.rb create 100
bin/rails runner script/desktop_performance_fixtures.rb delete
```

Replace `100` with `3` or `1000`. Always delete temporary data after measuring.
All three sizes were exercised; the final check returned `remaining=0`.

## Limits

The browser was unavailable during the first attempt; Chrome evidence was
completed during the final audit. Chrome profiling used development mode.
Release WebView measurements are in `desktop-performance.md`. No automated
contrast score or real screen reader was used.
