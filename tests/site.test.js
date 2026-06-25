// Smoke + structure tests for Mo's site. No dependencies — runs with `node --test`.
// These guard against regressions: missing files, broken references, removed
// features (countdown / joke / fireworks), and JS syntax errors.

const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const root = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

test("core files exist", () => {
  for (const f of ["index.html", "styles/main.css", "scripts/main.js"]) {
    assert.ok(fs.existsSync(path.join(root, f)), `missing ${f}`);
  }
});

test("index.html references the stylesheet and script", () => {
  const html = read("index.html");
  assert.match(html, /styles\/main\.css/, "stylesheet not linked");
  assert.match(html, /scripts\/main\.js/, "script not linked");
});

test("index.html contains the required UI hooks", () => {
  const html = read("index.html");
  for (const id of ['id="countdown"', 'id="joke"', 'id="restart"', 'id="fireworks"']) {
    assert.ok(html.includes(id), `missing element ${id}`);
  }
});

test("the Mandarin joke and its punchline are present", () => {
  const html = read("index.html");
  assert.ok(html.includes("什么东西越洗越脏"), "joke setup (zh) missing");
  assert.ok(html.includes("水"), "joke punchline (zh) missing");
});

test("countdown starts at 10 and reveals the joke at zero", () => {
  const js = read("scripts/main.js");
  assert.match(js, /START\s*=\s*10/, "countdown should start at 10");
  assert.match(js, /reachZero/, "missing reachZero handler");
});

test("fireworks engine is wired up", () => {
  const js = read("scripts/main.js");
  for (const sym of ["createFireworks", "celebrate", "requestAnimationFrame"]) {
    assert.ok(js.includes(sym), `fireworks: missing ${sym}`);
  }
});

test("festive background animation is defined", () => {
  const css = read("styles/main.css");
  assert.match(css, /@keyframes\s+festive/, "festive background animation missing");
});

test("scripts/main.js is valid JavaScript (syntax check)", () => {
  // Throws (non-zero exit) if the file has a syntax error.
  execFileSync(process.execPath, ["--check", path.join(root, "scripts/main.js")]);
});
