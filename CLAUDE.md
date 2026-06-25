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
1. **Run the full test suite** (`npm test`) and confirm it passes.
2. **Verify the actual functionality** that changed (open/serve the page and
   confirm the behavior — see "Verifying locally" below).
3. **Watch the deploy** after pushing: confirm the GitHub Actions run goes green
   and the live site reflects the change. A push is not "done" until the deploy
   succeeds.
If anything fails — tests, the page, or the deploy — fix it before moving on.
Treat any break or regression as a stop-the-line event.

### RULE 3 — Always add test cases
Every change MUST include or update tests in `tests/`. New feature → new tests
covering it. Bug fix → a test that would have caught the bug. Changed behavior →
updated assertions. Tests live in `tests/*.test.js` and run with `node --test`
(zero dependencies). Never add functionality without a corresponding test, and
never let the suite shrink in coverage without explicit user approval.

### RULE 4 — Every reply includes a clickable link to the live site
**Every single response** Claude sends in this project MUST end with a clickable
Markdown link to the live site:

> 🔗 **[View the live site](https://dumptruckjon.github.io/Mo/)**

This applies to every message — answers, status updates, questions, errors —
without exception.

---

## Repository Structure

A plain static site — no framework, no build step. Tests and CI are the only
tooling.

```
.
├── index.html                  # Site entry point (markup + content)
├── styles/
│   └── main.css                # All styling: animated festival background, countdown, joke reveal
├── scripts/
│   └── main.js                 # Vanilla JS: 10→0 countdown + canvas fireworks + Mandarin joke reveal
├── tests/
│   └── site.test.js            # node:test smoke/structure tests (no dependencies)
├── package.json                # `npm test` → `node --test`; no runtime deps
├── .github/workflows/
│   └── deploy.yml              # CI: run tests, then deploy to GitHub Pages (deploy needs test)
└── CLAUDE.md                   # This file
```

Update this tree whenever files are added or moved.

## Current Site Behavior

- A festive, animated red/gold Chinese-New-Year-style background.
- A countdown ticks from **5 → 0**.
- At **0**, a **random** short joke in **Simplified Chinese** is revealed (with
  pinyin and an English translation) and **canvas fireworks** launch. A
  different joke is shown each time (never the same one twice in a row).
- Clicking anywhere sets off extra fireworks; an "Again" button replays the
  countdown with a fresh random joke.
- The jokes live in the `JOKES` array in `scripts/main.js` (currently 6); add
  your own there. JS fills the `#joke-*` placeholders in `index.html`.

## Development Workflow

### Verifying locally
It's a static site — serve the folder and open it:

```bash
python3 -m http.server 8000   # then open http://localhost:8000
# or: npx serve .
```

Manually confirm the changed behavior (countdown reaches 0, joke shows,
fireworks fire, layout works on a narrow/mobile width).

### Testing
```bash
npm test        # runs node --test over tests/*.test.js
```
Tests are dependency-free and must pass before every push (RULE 2 & 3).

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
