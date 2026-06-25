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

test("the joke container has placeholders for JS to fill", () => {
  const html = read("index.html");
  for (const id of ['id="joke-zh"', 'id="joke-punch"', 'id="joke-pinyin"', 'id="joke-en"']) {
    assert.ok(html.includes(id), `missing joke placeholder ${id}`);
  }
});

test("countdown starts at 5 and reveals a joke at zero", () => {
  const js = read("scripts/main.js");
  assert.match(js, /START\s*=\s*5\b/, "countdown should start at 5");
  assert.match(js, /reachZero/, "missing reachZero handler");
});

test("there are at least 5 jokes, each fully formed", () => {
  const js = read("scripts/main.js");
  // Count joke objects by their required keys.
  const zhCount = (js.match(/\bzh:/g) || []).length;
  const punchCount = (js.match(/\bpunch:/g) || []).length;
  const pinyinCount = (js.match(/\bpinyin:/g) || []).length;
  const enCount = (js.match(/\ben:/g) || []).length;
  assert.ok(zhCount >= 5, `expected >= 5 jokes, found ${zhCount}`);
  // Every joke should have all four fields, so the counts must match.
  assert.equal(punchCount, zhCount, "every joke needs a punch line");
  assert.equal(pinyinCount, zhCount, "every joke needs pinyin");
  assert.equal(enCount, zhCount, "every joke needs an English translation");
});

test("a random joke is selected each time", () => {
  const js = read("scripts/main.js");
  assert.match(js, /Math\.random\(\)/, "joke selection should be randomized");
  assert.match(js, /pickJoke/, "missing pickJoke selector");
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
