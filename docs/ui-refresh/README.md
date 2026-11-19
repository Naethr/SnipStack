# SnipStack interface review

The PNG screenshots in this folder are local review evidence, ignored
by Git. They are deliberately absent from GitHub and new clones. Filenames
below identify optional local captures; they are not links. This page describes
the visual choices and checks without requiring access to those images.
For the current browser V1 results, see
[the readiness report](../v1-readiness-2026-11-19.md).

## October 19, 2026 — Blue-night evolution

The third visual pass keeps the recognizable blue and amber identity while
making the change visible beyond the page background. The library uses a quiet
blue gradient and the composer moves from lighter slate at the top to deep blue
below. Search panels and cards are lighter blue planes; code stays on a darker
plane. Titles use warm ivory, with amber reserved for actions, focus, status,
and a short card-rail marker. The search fields, language badges, card edges,
code headers, buttons, and tags have more distinct surfaces and spacing. Outfit
and the existing monospace stack remain; no font or dependency was added.

| Original blue night | Rejected pale version | Current evolution |
| --- | --- | --- |
| 1440 × 900 library (`before-library-1440.png`) | 1440 × 900 library (`after-library-1440.png`) | 1440 × 900 connected library (`evolved-library-1440.png`) |

Current captures: mobile library, 390 × 844 (`evolved-library-content-390.png`),
320 × 700 (`evolved-library-content-320.png`),
narrow 720 × 600 window (`evolved-library-content-720.png`),
login (`evolved-login-1440.png`), mobile login (`evolved-login-390.png`),
registration (`evolved-register-1440.png`), copy feedback (`evolved-copy-1440.png`),
filtered empty (`evolved-empty-1440.png`), edit (`evolved-edit-1440.png`),
delete confirmation (`evolved-delete-confirmation-1440.png`),
validation (`evolved-validation-1440.png`),
API unavailable (`evolved-api-unavailable-1440.png`), and
loading (`evolved-loading-1440.png`). The 720 × 600 image is a Chromium viewport
with the same dimensions as the Tauri minimum, not a native Tauri capture.

Chromium loaded the actual local Rails account and seven existing snippets.
The connected library was inspected at 1440, 1024, 720, 390, and 320 px with
no horizontal document overflow. Search, language filtering, `/` focus,
edit/cancel, delete confirmation/cancel, empty search, validation, and copy
feedback were exercised. A temporary snippet was created, edited, and deleted;
the seven original snippets remained. Copy showed the `Copied` button state and
success message; reading the OS clipboard back from headless Chromium was denied,
so byte-for-byte clipboard equality was not verified in this pass. A blocked
snippets request displayed the real API-unavailable state; retry showed the
loading skeleton and restored all seven records. Reduced-motion emulation
reduced transition duration and disabled smooth scrolling.

The five visual criteria were checked against the real captures: blue and amber
remain immediate; the background has softer depth; slate panels add breathing
room without a white theme; cards, controls, type, and code surfaces differ
visibly from the original; and the topbar, left composer, right library, and
search-before-cards order remain intact. Native Tauri rendering was not
validated because Cargo is unavailable in this environment.

## October 18, 2026 — Earlier attempts

The first light-theme result was rejected. The second revision restored the
original blue-night identity and refined that composition. It was a
frontend-only visual run on branch `UI-rework`; native Tauri validation was
unavailable because Cargo was absent.

## Three-way visual comparison

Open the side-by-side 1440 × 900 comparison (`comparison-1440.png`).

| Initial dark reference | Rejected light version | Current revision |
| --- | --- | --- |
| Library (`before-library-1440.png`) | Library (`after-library-1440.png`) | Library (`revised-library-1440.png`) |
| Login (`before-login-1440.png`) | Login (`after-login-1440.png`) | Login (`revised-login-1440.png`) |

The library comparison is about palette and composition, not snippet count.
The dark library reference was captured with the exact original stylesheet in
Chromium after the demo account became available. No snippet content was
replaced or invented for the screenshots. Current library captures show the
seven real account snippets. A temporary CRUD check entry was deleted before
final capture.

Further current captures: tablet 820 × 900 (`revised-library-820.png`),
720 × 600 viewport (`revised-library-720.png`),
mobile library 390 × 844 (`revised-library-content-390.png`),
320 × 700 (`revised-library-content-320.png`),
registration (`revised-register-1440.png`),
filtered empty state (`revised-empty-1440.png`),
edit (`revised-edit-1440.png`),
delete confirmation (`revised-delete-confirmation-1440.png`), and
validation (`revised-validation-1440.png`).
The 720 × 600 image is Chromium at a reduced viewport, not a Tauri screenshot.

## Source colors and composition

Values were taken from the original `frontend/src/index.css`, not sampled
from the PNG. Restored `#0c1822` for the page and code background,
`#112432` for the top bar and composer, `#193040` / `#223b4b` for nearby
surfaces, `#34566a` for borders, `#f5f8f7` for main text, and `#d8a24a`
for important actions. Added only two adjacent ink tones: `#1c3646` for
raised cards/search panels and `#102531` for fields, plus `#cbd8da` for
readable secondary text. No broad white or pale-gray surfaces remain in the
connected library. Outfit 400–700 and the existing system monospace stack
remain; Outfit's bundled license is SIL OFL 1.1. No font or UI dependency was
added.

The brand stays left and account, sign-out and new-snippet actions stay right;
the statistics remain between them. The composer remains 400 px wide at
1440 px and 352 px wide at 1024/820 px. The library stays right, with search,
filter and cards in their original order. The title's introduction is below
and left-aligned with the title. On each card, language, title and description
lead to an action row near the text, followed by code and tags. This card
change is deliberate: the actions no longer float in the upper-right corner.

The revised panels separate dark planes through close blue shades, borders
and restrained shadows. Titles and descriptions are larger and brighter;
code text and secondary labels have more comfortable contrast. Amber appears
on the brand mark, important actions, active focus and feedback. Hover and
focus remain short and respect the existing reduced-motion CSS. Composer
scrolling also respects reduced motion through the retained `App.jsx` change.

At 761–980 px, search and filter stack within their existing area to avoid
squeezing. At mobile widths the composer still precedes the library. The
320 px body and search-field sizing corrections from the previous run remain.
Chromium checks at 1440, 1024, 820, 720, 390 and 320 px found no document
horizontal overflow.

## Validation and limits

Chromium with the real Rails API verified login, `/me`, seven-snippet load,
search, filter, clear, slash focus, copy with clipboard equality, edit/cancel,
delete confirmation/cancel, create/update/delete with immediate removal of
the temporary entry, sign-out, registration form rendering and memory-session
reset on reload. Existing 401 and error behavior remains covered by Vitest;
the previous run also captured browser-injected 401 and connection-failure
states, but those old images belong to the rejected light style. The current
dark error/loading/confirmation surfaces were inspected in CSS and current
confirmation/validation screens were captured. Actual registration and server
token expiry were not exercised.

`npm run lint` and `npm run test` passed (23 tests in two files).
`npm run build` and `npm run build:desktop` passed. The attempted native
`npm run tauri -- build` failed before compilation because `cargo` is not installed.
This Vite desktop build is frontend compilation, not desktop visual evidence.
No official WDIO run, native WSLg launch, other-browser check, or full
accessibility/performance audit was done. Backend tests were outside the
frontend-only scope. No backend, seed, contract, JWT-storage, dependency,
security-configuration, or Tauri files changed. No commit, push, merge or
deployment occurred.
