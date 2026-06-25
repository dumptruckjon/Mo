# CLAUDE.md

Guidance for AI assistants (and humans) working in this repository.

**Mo** is a fun, personal GitHub Pages website built for Jon's wife, Mo. The
goal is delight: keep it playful, simple, and always shippable.

- **Live site:** **https://dumptruckjon.github.io/Mo/**
- **Repo:** `dumptruckjon/Mo` (public)
- **Hosting:** GitHub Pages, auto-deployed from `main` via GitHub Actions.

---

## ⚠️ PROJECT RULES — NON-NEGOTIABLE

These rules are mandatory for **every** change, no exceptions. They override
convenience. If a rule cannot be followed, STOP and tell the user why instead of
silently skipping it.

### RULE 1 — Always ship to `main` on GitHub
Every change, no matter how small, MUST be committed and **pushed to `main`** on
GitHub before the task is considered done. `main` is the single source of truth
and the branch GitHub Pages deploys from. Do not leave work uncommitted, on a
side branch, or local-only. One change → one commit → pushed to `main`.

### RULE 2 — Validate and verify everything; never ship a regression
Before every push you MUST prove the change works and breaks nothing:
1. **Run the full test suite** (`npm test`) — this runs BOTH the unit tests and
   the **Playwright browser tests**, and it must pass.
2. **Actually exercise the behavior in a real browser.** Clicks and functions
   must be proven to work — not assumed from reading code. The `tests/e2e.test.js`
   suite loads the page in Chromium and clicks every interactive element; an edit
   to any interactive behavior is NOT complete until a browser test drives it and
   passes. Never declare an edit "done" or "functional" on the basis of structure
   tests or code inspection alone.
3. **Watch the deploy** after pushing: confirm the GitHub Actions run goes green
   and the live site reflects the change. A push is not "done" until the deploy
   succeeds.
If anything fails — tests, the page, or the deploy — fix it before moving on.
Treat any break or regression as a stop-the-line event.

### RULE 3 — Always add test cases (unit AND browser)
Every change MUST include or update tests in `tests/`:
- **Content/logic** → assertions in `tests/site.test.js`.
- **Any interactive behavior (a click, input, toggle, animation trigger)** → a
  Playwright test in `tests/e2e.test.js` that performs the action and verifies
  the result in the DOM.
New feature → new tests covering it (including a browser test if it's
interactive). Bug fix → a test that would have caught the bug. Never add
functionality without a corresponding test, and never let coverage shrink
without explicit user approval.

### RULE 4 — Every reply includes a clickable link to the live site
**Every single response** Claude sends in this project MUST end with a clickable
Markdown link to the live site:

> 🔗 **[View the live site](https://dumptruckjon.github.io/Mo/)**

This applies to every message — answers, status updates, questions, errors —
without exception.

### RULE 5 — Mobile-optimized for iOS Safari, always
Mo views this on her iPhone, so the site MUST look and work great in **iOS
Safari** on every change. This is non-negotiable:
- **Responsive layout:** no horizontal overflow at phone widths; readable text;
  content not hidden behind the notch or home indicator.
- **iOS Safari specifics:** use `100dvh` (not bare `100vh`) for full-height;
  `env(safe-area-inset-*)` for the notch (`viewport-fit=cover` is set);
  `-webkit-` prefixes where Safari needs them (e.g. `backdrop-filter`);
  `touch-action: manipulation` and `-webkit-tap-highlight-color: transparent`
  on tappable elements so rapid taps don't zoom or flash.
- **Tap targets ≥ 44px** (Apple HIG).
- **Audio/animation:** any audio starts only on a user gesture (iOS blocks
  autoplay); respect `prefers-reduced-motion`.
- **Prove it:** `tests/mobile.test.js` emulates an iPhone (touch + viewport) and
  must pass. A change is not complete until the mobile tests are green. For
  pixel-level Safari quirks, also sanity-check on a real iPhone when feasible
  (the emulation runs on Chromium, not true WebKit).

---

## Repository Structure

A plain static site — no framework, no build step. Tests and CI are the only
tooling.

```
.
├── index.html                  # Site entry point (markup + the festival sections)
├── styles/
│   └── main.css                # All styling: festival bg, countdown, joke, cookie, garden, food, music
├── scripts/
│   ├── content.js              # ALL editable content (jokes, fortunes, flowers, foods, candy). Edit here.
│   └── main.js                 # Vanilla JS behavior: countdown, fireworks+candy, fortune cookie,
│                               #   garden, floating food, synthesized music. Reads window.MoContent.
├── tests/
│   ├── site.test.js            # node:test unit/structure/logic tests (no browser)
│   ├── e2e.test.js             # Playwright browser tests — actually click every feature
│   ├── mobile.test.js          # Playwright iPhone-emulated tests — touch + responsive layout
│   └── helpers.js              # shared: locate Chromium + serve the site locally
├── package.json                # `npm test` → `node --test` (runs unit + e2e)
├── package-lock.json           # committed for reproducible `npm ci` in CI
├── .gitignore                  # ignores node_modules etc.
├── .github/workflows/
│   └── deploy.yml              # CI: run tests, then deploy to GitHub Pages (deploy needs test)
└── CLAUDE.md                   # This file
```

> **To change any wording or add jokes/notes:** edit `scripts/content.js` only.
> `content.js` works both in the browser (sets `window.MoContent`) and in Node
> (`module.exports`), so the tests assert the real content.

Update this tree whenever files are added or moved.

## Current Site Behavior

A little festival built around the things Mo loves (Chinese food, gardening,
sweets):

- A festive red/gold background (a **static** gradient — intentionally not
  animated, to avoid the iOS Safari full-page repaint/flash on scroll) with
  **gently drifting Chinese food** (dumplings, noodles, bubble tea, mooncakes…).
- A **countdown from 5 → 0**, then a **random** short joke in Simplified Chinese
  (pinyin + English) with **fireworks that also rain sweets/candy**. A different
  joke shows each time (never the same one twice in a row). "Again" replays with
  a fresh joke. Fireworks fire **only** at the end of the countdown (and on
  "Again" / a memory-game win) — never on taps or scrolling — and the canvas
  sits transparent/idle the rest of the time.
- A **fortune cookie** 🥠 — tap it to crack open a random sweet love-note.
- A **grow-a-garden** 🌷 — tap the soil to plant flowers; a counter remembers how
  many flowers have been grown for Mo (saved in `localStorage`).
- **Lucky red envelopes** 🧧 — tap one to reveal a random redeemable "treat
  coupon" (a dumpling dinner, boba run, dessert-first night…).
- **Sweet memory match** 🀄 — a find-the-pairs game with Chinese food/sweet
  tiles; completing it shows a win message and sets off the fireworks.
- All wording lives in `scripts/content.js` for easy personalization (jokes,
  fortunes, coupons, flowers, foods, memory tiles).
- (Removed: the background music toggle.)

## Development Workflow

### Verifying locally
It's a static site — serve the folder and open it:

```bash
python3 -m http.server 8000   # then open http://localhost:8000
# or: npx serve .
```

Manually confirm the changed behavior (countdown reaches 0, joke shows,
fireworks fire, cookie cracks, garden plants, music toggles, layout works on a
narrow/mobile width).

For interactive changes this manual pass is in addition to — never instead of —
the automated browser tests in `tests/e2e.test.js` (see Testing and RULE 2).

### Testing
```bash
npm install     # first time: installs Playwright (dev dependency)
npm test        # runs node --test over tests/*.test.js (unit + browser e2e)
```
`tests/site.test.js` is fast and browser-free. `tests/e2e.test.js` launches
**Chromium via Playwright** and clicks every interactive element (countdown→joke,
fortune cookie, garden planting, music toggle) — proving behavior, not just
structure. All of it must pass before every push (RULE 2 & 3).

**Chromium binary:** the e2e test auto-locates one — it uses the browser
Playwright expects if present, otherwise scans `$PLAYWRIGHT_BROWSERS_PATH`
(`/opt/pw-browsers`) for a preinstalled Chromium. In this dev environment
Chromium is preinstalled, so do NOT run `playwright install` here. In CI
(`deploy.yml`) the `test` job runs `npx playwright install --with-deps chromium`
before `npm test`. Note: continuously-animated elements (e.g. the bobbing
cookie) need `{ force: true }` clicks since Playwright treats them as never
"stable".

### Deploying (automated)
`.github/workflows/deploy.yml` runs on every push to `main`:
1. **test** job — `npm test` must pass.
2. **deploy** job — `needs: test`; uploads the repo root and publishes to Pages.

So a failing test blocks the deploy by design. After pushing, confirm the run is
green and the live site updated.

> One-time GitHub setup (already done, documented for reference):
> repo is **public**; **Settings → Pages → Source = GitHub Actions**; default
> branch is **`main`**; the **`github-pages` environment** must allow
> deployments from `main` (Settings → Environments → github-pages →
> Deployment branches and tags).

## Conventions

- **Static and dependency-light.** Plain HTML/CSS/JS. Don't add frameworks or a
  build step without checking with the user first.
- **Mobile-friendly & accessible.** Mo will likely view on a phone: check small
  screens, keep contrast readable, provide alt text, respect
  `prefers-reduced-motion`.
- **Keep it fun.** When in doubt, make it sillier.

## Notes for AI Assistants

- Follow the four PROJECT RULES above on every task. They are the heart of this
  repo's workflow.
- This is a personal, non-commercial, for-fun project — optimize for charm,
  correctness, and shippability.
- Keep this file updated when structure, behavior, or workflow changes.
- Don't open a pull request unless explicitly asked — push straight to `main`.
