# CLAUDE.md

Guidance for AI assistants (and humans) working in this repository.

> **Status:** 🚧 Starter scaffold. The repo is brand new and mostly empty.
> Sections marked **TODO** should be filled in as the project takes shape.
> Keep this file updated whenever structure, workflows, or conventions change.

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

The project is just getting started. Expected layout (update as it grows):

```
.
├── index.html        # TODO — site entry point
├── css/ or styles/   # TODO — stylesheets
├── js/ or scripts/   # TODO — client-side JavaScript
├── assets/           # TODO — images, fonts, audio, etc.
└── CLAUDE.md         # This file
```

TODO: Replace the above with the real structure once files exist.

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
TODO once Pages is configured. Typical setup:
1. Repo **Settings → Pages**.
2. Source: deploy from the default branch (e.g. `main`) at `/ (root)`.
3. Pushes to that branch publish automatically within a minute or two.

> If a build step or framework is added later (e.g. a static-site generator
> or a GitHub Actions deploy workflow), document the exact commands here.

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
