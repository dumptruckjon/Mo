# Bootstrap Kit: Starting the Next Site (Kids' Games Edition)

Everything learned building **Mo** (dumptruckjon/Mo), distilled so a brand-new
project — e.g. **a games site for a 4-year-old** — starts on day one with the
architecture, CI, tests, guardrails, and gotchas that took this project weeks
to earn. Written to be handed to a fresh Claude project verbatim.

---

## 1. Architecture that worked (copy it)

- **Plain static site. No framework, no build step.** HTML + CSS + vanilla JS.
  Everything ships as-is to GitHub Pages. Tests + CI are the only tooling.
  This kept every change small, reviewable, and instantly deployable.
- **One content module** (`scripts/content.js`) holds ALL words/emoji/config as
  data. It exports both ways so the same file works in the browser
  (`window.MoContent`) and in Node tests (`module.exports`) — tests assert the
  *real* content, and non-technical edits touch exactly one file:

  ```js
  (function (global) {
    const CONTENT = { /* …all arrays/objects… */ };
    if (typeof module !== "undefined" && module.exports) module.exports = CONTENT;
    else global.MoContent = CONTENT;
  })(typeof window !== "undefined" ? window : globalThis);
  ```
- **Feature isolation:** every widget gets an `initX()` function, and the boot
  loop wraps each in try/catch so one broken toy can't kill the page:

  ```js
  for (const init of features) {
    try { init(); } catch (e) { console.error("feature failed:", e); }
  }
  ```
- **Shared effects module** (`effects.js`) for celebrations (confetti etc.) so
  every game rewards wins consistently; it no-ops under
  `prefers-reduced-motion` in ONE place instead of twenty.
- **localStorage always guarded** — iOS private browsing throws:

  ```js
  function best() { try { return Number(localStorage.getItem(KEY)) || 0; } catch (e) { return 0; } }
  ```
- **PWA from day one:** manifest + service worker (installable, offline). SW is
  **network-first with `cache: "no-store"` for navigations** — the cached-page
  variant caused the single worst bug of the project (see §3).

## 2. The CI pipeline (the crown jewel — replicate exactly)

Three jobs on every push to `main` (see `.github/workflows/deploy.yml` in the
Mo repo for the full file — copy it, rename the URL/token bits):

1. **test** — `npm ci`, `npx playwright install --with-deps chromium webkit`,
   `npm test`. A red test blocks deployment entirely.
2. **deploy** — `needs: test`. **Cache-busts before upload**:
   `sed -i "s/__BUILD__/${GITHUB_SHA::8}/g" *.html sw.js`, then standard
   `configure-pages` → `upload-pages-artifact` → `deploy-pages`.
3. **verify-live** — `needs: deploy`. Polls the live URL until it serves this
   commit's token (`curl … | grep "v=$sha"`, ~5 min budget), then runs the
   **whole browser suite against the live site** via a `BASE_URL` env var.
   This job is the only real proof a deploy worked.

**One-time GitHub setup** (do these immediately, they block everything):
- Repo must be **public** (or Pages needs a paid plan).
- **Settings → Pages → Source = "GitHub Actions"** (not branch).
- **Settings → Environments → github-pages → Deployment branches** must allow
  `main` — the default protection rule silently rejects deploys otherwise.
- Commit `package-lock.json` so CI's `npm ci` is reproducible.
- Workflow permissions block: `contents: read`, `pages: write`, `id-token: write`;
  concurrency group `pages` with `cancel-in-progress: false`.

## 3. The #1 lesson: stale caches ship dead features

The worst bug of the project: new features passed every local test but were
**dead on the real phone**, because the browser + service worker kept serving
old JS. The fixes, all mandatory from the first commit:

- Every asset reference carries a version token:
  `<script src="scripts/main.js?v=__BUILD__">` — never a bare URL.
- The SW cache name embeds the same token (`mo-${VERSION}`) and old caches are
  purged on activate.
- Deploy rewrites `__BUILD__` → commit SHA (see §2).
- SW fetch handler uses network-first, and navigations use
  `fetch(req, { cache: "no-store" })` so a deploy shows up on the next load.
- verify-live exists specifically because "tests pass locally" ≠ "site works."

## 4. Testing playbook (what actually made quality stick)

**Stack:** `node --test` + Playwright (no test framework dependency). Suites:
- `site.test.js` — fast Node-only structure/content/logic checks (files exist,
  HTML has required ids, content arrays well-formed, scripts parse, feature
  inits all registered, cache-bust tokens present).
- `e2e.test.js` — Chromium; **clicks every interactive feature for real**. One
  shared page for speed; separate contexts for tests needing init-script
  overrides. Collect `pageerror`s all run long and assert the list is empty in
  the **last** test of the file.
- `mobile.test.js` — iPhone viewport; **real WebKit in CI** (Safari's engine),
  Chromium-emulation fallback locally. Checks: no horizontal overflow at 390px
  AND 320px, viewport meta, tap-target sizes, touch interactions.
- `helpers.js` — starts a throwaway local static server, OR honors
  `BASE_URL` env (that's how verify-live reuses the same tests), and
  auto-locates a browser binary.

**Hard-won testing rules:**
- **Determinism hooks beat sleeps.** Let tests override timing/date via
  globals: `window.MO_CATCH_MS` (game length), `window.MO_IDLE_MS`,
  `?mo-date=MM-DD` (fake today). Write features to read these at start time.
- **Never check-then-click a moving target across the test/browser boundary** —
  the reading goes stale in transit. Poll and click **inside** the page in the
  same animation frame (`page.evaluate(() => new Promise(...rAF loop...))`).
- Continuously animated elements need `{ force: true }` clicks.
- Sequence games: expose the current sequence via a `dataset` attribute so the
  test can play along (it's a kids' site, not a bank).
- Add a **geometry audit test**: every visible tappable element ≥ the minimum
  size, no two targets overlapping, adjacent targets ≥ 8px apart — at 320px.
  It caught real regressions twice. Skip hidden elements
  (`el.offsetParent === null`) or it false-positives.
- New feature → new browser test that drives it. Bug fix → a test that would
  have caught it. Never declare interactive work done from code reading.

**Env gotchas (Claude Code remote sandbox):**
- Chromium is preinstalled under `/opt/pw-browsers`; **do NOT run
  `playwright install`** locally — mobile tests fall back to Chromium; real
  WebKit coverage happens in CI.
- The sandbox **cannot reach `*.github.io`** — never claim "verified live"
  from the sandbox; rely on the verify-live job and say so honestly.
- The GitHub MCP Actions API caches hard (~10 min). The
  `list_workflow_jobs (filter: all)` endpoint refreshes fastest; a run-level
  `conclusion: success` means all jobs passed.
- Launch Chromium with `--no-sandbox --use-gl=swiftshader`.

## 5. iOS Safari / mobile guardrails (non-negotiable from commit 1)

- `viewport-fit=cover` + `env(safe-area-inset-*)` padding for notch/home bar.
- `100dvh`, never bare `100vh`.
- `-webkit-` prefixes where needed (`backdrop-filter`, tap highlight).
- Every tappable element: `touch-action: manipulation` and
  `-webkit-tap-highlight-color: transparent` (kills double-tap zoom + flash —
  essential for rapid-tap games).
- **No animated full-page background gradients** — iOS repaints the whole page
  on scroll and it flashes/pulses. Static gradient + small animated elements.
- Celebrations (confetti/fireworks) fire **only on explicit wins**, never
  bound to document-level tap/scroll events.
- Audio/vibration only after a user gesture; respect
  `prefers-reduced-motion` everywhere (central helper).
- Drag-driven play areas: `touch-action: none` **only while a round is live**
  (a `.playing` class), otherwise the stage traps page scrolling.
- Grid children that must shrink: `minmax(0, 1fr)` (a min-height fighting
  aspect-ratio caused 320px overflow once).

## 6. Standing project rules (adapt for the new CLAUDE.md)

These made the workflow self-enforcing. Recommended for the kids' site nearly
verbatim (they're in Mo's CLAUDE.md as RULES 1–6 with full wording):

1. **Always ship to `main`** — every change committed + pushed; no local-only
   or side-branch work. One change → one commit → pushed.
2. **Validate everything; never ship a regression** — full suite before every
   push; prove interactive behavior in a real browser; watch the deploy and
   verify-live go green. Stop-the-line on any red.
3. **Always add tests** — unit AND browser, for every change.
4. **Every Claude reply ends with a clickable live-site link** — sounds silly,
   is actually great: the human can always tap straight to the result.
5. **Mobile-optimized always** (see §5 for the specifics).
6. **Never trust local-pass alone; verify the LIVE site** (cache-busting +
   verify-live; §2–3).

Also carry over these CLAUDE.md habits: keep a repo-structure tree that's
updated when files move; a "Current Site Behavior" section that describes every
feature (it's the spec); explicit note that all wording lives in content.js.

## 7. New for a 4-year-old (design guardrails the Mo site didn't need)

Mo's minimum tap target is 44px (Apple HIG). For a preschooler, go bigger and
softer everywhere:

- **Tap targets ≥ 75px**, generous spacing (≥ 16px); whole-card tap zones
  rather than small buttons. Fat-finger tolerance in every hit test.
- **Zero reading required.** Icons, emoji, color, and (gesture-gated) audio
  cues; any text is for the parent.
- **No failure states.** Wrong answers wiggle and encourage, never buzz or
  reset progress. Celebrate everything; confetti is free.
- **No timers** (or hidden, gentle ones). A 4-year-old plays at their own pace.
- **No rapid-tap or precision-timing mechanics** (Mo's whack/stack style games
  are too hard); favor: tap-the-thing, drag-anywhere-near (huge tolerance),
  sorting by color/shape, simple cause→effect toys, find-the-animal.
- **Multi-touch forgiveness:** little hands rest extra fingers on screen —
  use pointer events, ignore secondary pointers, never require multi-touch.
- **Guard against accidental exits:** PWA standalone mode (add to home screen)
  hides the URL bar; no external links anywhere; nothing destructive without
  a "parent gate" (e.g. long-press).
- **Session-proof:** progress in localStorage; reloading mid-game is fine;
  everything works offline (SW precache) for car rides.
- **Volume:** a giant, obvious mute toggle if any sound exists; default might
  as well be muted-with-visible-unmute given iOS gesture rules anyway.

## 8. Process learnings (how to work, not just what to build)

- **Ship in small feature batches** wired through the same checklist:
  content → HTML hooks → init function (registered in the isolated boot loop)
  → CSS → unit + e2e + mobile tests → full suite → push → watch all 3 CI jobs.
- **Placeholders are fine; label them loudly.** `⚠️ PLACEHOLDER` comments in
  content.js + a CLAUDE.md note + reminding the human each reply until real
  data arrives. (Worked well for birthdays/milestones.)
- **Date-driven features need a test override** (`?mo-date=MM-DD`) — you
  cannot wait for January to test a birthday takeover. Handle year-wrap in
  countdowns and test the December→January boundary explicitly.
- **First-frame state bugs are real:** any value a game loop maintains (like a
  mover's x-position) must be initialized to its true starting value at game
  start, not to 0 — an instant first tap will read it before the first rAF.
- **Audit geometry programmatically, not by eyeballing screenshots** — the
  30px stars and 40px buttons both *looked* fine.
- After every push, **confirm all three CI jobs**, then say what was and
  wasn't verified (sandbox can't see the live site; CI can).
- Ask the human to spot-check on the real device for pixel-level Safari
  quirks; emulation catches layout, not everything.

## 9. Day-one checklist for the new project

1. Create public repo; enable Pages (Source = GitHub Actions); allow `main`
   in the github-pages environment.
2. Copy from Mo and rename/trim: `.github/workflows/deploy.yml`,
   `sw.js` + `manifest.webmanifest` + icons, `tests/helpers.js`, the
   `package.json` test script, `.gitignore`.
3. Write the new CLAUDE.md: §6 rules + §7 kid guardrails + repo tree +
   behavior section. (Steal Mo's CLAUDE.md wording for RULES 1–6.)
4. Scaffold: `index.html` (one screen, giant friendly buttons),
   `scripts/content.js` (dual-export), `scripts/effects.js` (copy),
   `scripts/main.js` (isolated init loop), `styles/main.css` (safe-area,
   static bg, tap-target defaults ≥ 75px).
5. Seed tests: structure test, one e2e that taps the first toy, mobile
   overflow + tap-size audit (raise the minimum to 75px), pageerror sweep.
6. First push → confirm test/deploy/verify-live all green → only then start
   building games.
