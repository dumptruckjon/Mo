# CLAUDE.md

Guidance for AI assistants (and humans) working in this repository.

> **Status:** 🌱 Early days. A working starter site is in place (plain
> HTML/CSS/JS). Sections marked **TODO** should be filled in as the project
> grows. Keep this file updated whenever structure, workflows, or conventions
> change.

## Project Overview

**Mo** is a fun personal project — a lighthearted website built for Jon's wife,
Mo, and published publicly via **GitHub Pages**. The goal is delight over
sophistication: keep it playful, simple, and easy to ship.

- **Audience:** Mo (and anyone she shares it with).
- **Tone:** Funny, warm, personal. When in doubt, make it sillier.
- **Hosting:** GitHub Pages (static site served straight from this repo).
- **Live URL:** TODO — typically `https://dumptruckjon.github.io/mo/`
  once Pages is enabled.

## Repository Structure

A plain static site — no framework, no build step. Current layout:

```
.
├── index.html                  # Site entry point (markup + content)
├── styles/
│   └── main.css                # All styling: animated festival background, countdown, joke reveal
├── scripts/
│   └── main.js                 # Vanilla JS: 10→0 countdown + canvas fireworks + Mandarin joke reveal
├── assets/                     # TODO — images, fonts, audio, etc. (none yet)
├── .github/workflows/
│   └── deploy.yml              # GitHub Actions → GitHub Pages deploy
└── CLAUDE.md                   # This file
```

Update this tree whenever files are added or moved.

## Development Workflow

### Branching
- The designated working branch for AI-assisted changes is
  `claude/claude-md-docs-b5nv6s` (and similarly named `claude/*` branches).
- Develop on a feature branch; do **not** push directly to the default
  branch unless explicitly asked.
- Use clear, descriptive commit messages.

### Running locally
Since this is a static site, you can preview it with any static server. TODO:
confirm/replace once the stack is chosen. Common options:

```bash
# Python (no dependencies)
python3 -m http.server 8000
# then open http://localhost:8000

# Node (if you prefer)
npx serve .
```

### Deploying (GitHub Pages)
Deployment is automated via `.github/workflows/deploy.yml`. Every push to
`main` uploads the repo root as a Pages artifact and publishes it.

**One-time setup** (must be done in the GitHub UI before the first deploy):
1. Repo **Settings → Pages**.
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. Push to `main` (or run the workflow manually via **Actions →
   Deploy to GitHub Pages → Run workflow**).

The live URL appears in the workflow's deploy step output and under
Settings → Pages — expected to be `https://dumptruckjon.github.io/mo/`.

> There is no build step: the site is served exactly as the files appear in
> the repo. If a static-site generator is added later, update the workflow's
> artifact `path` and document the build command here.

## Conventions

These are starting defaults — adjust to match what the project actually adopts.

- **Keep it static and dependency-light.** Plain HTML/CSS/JS is fine and
  preferred unless there's a clear reason to add tooling.
- **Mobile-friendly.** Mo will likely view this on a phone — check small
  screens.
- **Accessibility basics.** Alt text on images, readable contrast, semantic
  HTML.
- **Asset hygiene.** Keep images reasonably sized; store them under `assets/`.
- **Have fun, but keep it shippable.** Prefer changes that can be merged and
  deployed without breaking the live page.

## Notes for AI Assistants

- This is a personal, non-commercial, for-fun project. Optimize for charm and
  shippability, not enterprise rigor.
- When the structure or workflow changes, **update this file** so it stays
  accurate.
- Don't create a pull request unless explicitly asked.
- Don't add heavy build tooling or frameworks without checking in first —
  simplicity is a feature here.
