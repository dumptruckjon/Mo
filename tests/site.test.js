// Smoke + structure tests for Mo's site. No dependencies — runs with `node --test`.
// Guards against regressions: missing files/refs, removed features, malformed
// content, and JS syntax errors.

const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const root = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const content = require("../scripts/content.js");

test("core files exist", () => {
  for (const f of ["index.html", "styles/main.css", "scripts/main.js", "scripts/content.js"]) {
    assert.ok(fs.existsSync(path.join(root, f)), `missing ${f}`);
  }
});

test("index.html references styles, content, and main script", () => {
  const html = read("index.html");
  assert.match(html, /styles\/main\.css/, "stylesheet not linked");
  assert.match(html, /scripts\/content\.js/, "content.js not linked");
  assert.match(html, /scripts\/main\.js/, "main.js not linked");
});

test("assets are cache-busted (version query) so browsers fetch fresh files", () => {
  const html = read("index.html");
  assert.match(html, /styles\/main\.css\?v=/, "css not cache-busted");
  assert.match(html, /scripts\/content\.js\?v=/, "content.js not cache-busted");
  assert.match(html, /scripts\/main\.js\?v=/, "main.js not cache-busted");
});

test("feature inits are isolated so one failure can't break the others", () => {
  const js = read("scripts/main.js");
  assert.match(js, /try\s*\{\s*init\(\)/, "inits should run inside try/catch");
});

test("index.html has all required UI hooks", () => {
  const html = read("index.html");
  const ids = [
    'id="countdown"', 'id="joke"', 'id="restart"', 'id="fireworks"',
    'id="food-bg"', 'id="daily-note"',
    'id="fortune-cookie"', 'id="fortune-text"',
    'id="garden"', 'id="flower-count"',
    'id="envelopes"', 'id="envelope-text"',
    'id="memory-grid"', 'id="memory-status"', 'id="memory-new"',
    'id="joke-zh"', 'id="joke-punch"', 'id="joke-pinyin"', 'id="joke-en"',
  ];
  for (const id of ids) assert.ok(html.includes(id), `missing element ${id}`);
});

// ---------- Content module ----------
test("countdown starts at 5", () => {
  assert.equal(content.COUNTDOWN_START, 5);
});

test("there are at least 5 jokes, each fully formed", () => {
  assert.ok(Array.isArray(content.JOKES) && content.JOKES.length >= 5,
    `expected >= 5 jokes, got ${content.JOKES && content.JOKES.length}`);
  for (const j of content.JOKES) {
    for (const k of ["zh", "punch", "pinyin", "en"]) {
      assert.ok(typeof j[k] === "string" && j[k].length > 0, `joke field "${k}" missing`);
    }
  }
});

test("there are at least 5 fortune-cookie notes", () => {
  assert.ok(Array.isArray(content.FORTUNES) && content.FORTUNES.length >= 5,
    `expected >= 5 fortunes, got ${content.FORTUNES && content.FORTUNES.length}`);
  for (const f of content.FORTUNES) {
    assert.ok(typeof f === "string" && f.length > 0, "empty fortune");
  }
});

test("garden has flowers and the background has foods/candy", () => {
  assert.ok(content.FLOWERS.length >= 3, "need a few flowers");
  assert.ok(content.FOODS.length >= 6, "need several Chinese foods");
  assert.ok(content.CANDY.length >= 3, "need some candy");
});

test("there are redeemable coupons and memory-match pairs", () => {
  assert.ok(Array.isArray(content.COUPONS) && content.COUPONS.length >= 5,
    `expected >= 5 coupons, got ${content.COUPONS && content.COUPONS.length}`);
  for (const c of content.COUPONS) assert.ok(typeof c === "string" && c.length > 0, "empty coupon");
  assert.ok(Array.isArray(content.MEMORY) && content.MEMORY.length >= 4,
    `expected >= 4 memory pairs, got ${content.MEMORY && content.MEMORY.length}`);
});

test("there are daily notes (one per day)", () => {
  assert.ok(Array.isArray(content.DAILY_NOTES) && content.DAILY_NOTES.length >= 7,
    `expected >= 7 daily notes, got ${content.DAILY_NOTES && content.DAILY_NOTES.length}`);
  for (const n of content.DAILY_NOTES) assert.ok(typeof n === "string" && n.length > 0, "empty note");
});

test("PWA: manifest, icons, service worker are wired up", () => {
  const html = read("index.html");
  assert.match(html, /rel="manifest"/, "manifest link missing");
  assert.match(html, /rel="apple-touch-icon"/, "apple-touch-icon link missing");

  const manifest = JSON.parse(read("manifest.webmanifest"));
  assert.equal(manifest.display, "standalone", "manifest should be standalone");
  assert.ok(manifest.start_url, "manifest needs start_url");
  const sizes = (manifest.icons || []).map((i) => i.sizes);
  assert.ok(sizes.includes("192x192") && sizes.includes("512x512"), "need 192 & 512 icons");
  for (const icon of manifest.icons) {
    assert.ok(fs.existsSync(path.join(root, icon.src)), `missing icon file ${icon.src}`);
  }

  const sw = read("sw.js");
  assert.match(sw, /addEventListener\(\s*["']fetch["']/, "SW needs a fetch handler");
  assert.match(sw, /addEventListener\(\s*["']install["']/, "SW needs an install handler");

  const js = read("scripts/main.js");
  assert.match(js, /serviceWorker\.register/, "main.js should register the SW");
});

// ---------- Behavior wiring (main.js) ----------
test("main.js wires up every feature", () => {
  const js = read("scripts/main.js");
  for (const sym of [
    "initFoodBackground", "initCountdown", "initFortuneCookie",
    "initGarden", "initEnvelopes", "initMemory", "initDailyNote", "createFireworks",
    "reachZero", "mo-flower-count",
  ]) {
    assert.ok(js.includes(sym), `main.js missing ${sym}`);
  }
  assert.ok(!js.includes("initMusic"), "music should be removed");
});

test("selection is randomized", () => {
  const js = read("scripts/main.js");
  assert.match(js, /Math\.random\(\)/);
  assert.match(js, /pickIndex/);
});

test("fireworks are not bound to global tap/click/scroll", () => {
  const js = read("scripts/main.js");
  assert.ok(!/window\.addEventListener\(\s*["']click["']/.test(js),
    "fireworks must not fire on every tap/click");
  assert.match(js, /celebrate\(\)/, "fireworks should still fire via celebrate()");
});

test("background is a static festive gradient (no animated shift)", () => {
  const css = read("styles/main.css");
  assert.match(css, /linear-gradient\(/, "should have a gradient background");
  assert.ok(!/animation:\s*festive/.test(css), "background should not animate/shift");
  assert.ok(!/@keyframes\s+festive/.test(css), "festive keyframes should be removed");
});

test("the music feature is fully removed", () => {
  assert.ok(!read("index.html").includes("music-toggle"), "music button still in HTML");
  assert.ok(!/AudioContext/.test(read("scripts/main.js")), "audio code still present");
  assert.ok(!read("styles/main.css").includes("#music-toggle"), "music styles still present");
});

test("mobile / iOS Safari optimizations are in place", () => {
  const html = read("index.html");
  assert.match(html, /name="viewport"[^>]*viewport-fit=cover/, "viewport-fit=cover missing");
  assert.match(html, /apple-mobile-web-app-capable/, "iOS web-app meta missing");

  const css = read("styles/main.css");
  assert.match(css, /100dvh/, "use dvh to avoid the iOS 100vh toolbar gap");
  assert.match(css, /env\(safe-area-inset/, "respect the notch with safe-area insets");
  assert.match(css, /-webkit-backdrop-filter/, "Safari needs -webkit-backdrop-filter");
  assert.match(css, /touch-action:\s*manipulation/, "prevent double-tap zoom on tappables");
  assert.match(css, /-webkit-tap-highlight-color/, "remove the iOS tap highlight");
});

// ---------- Pure logic ----------
test("pickIndex never repeats and covers the whole range", () => {
  // Mirror of the picker in main.js.
  function pickIndex(len, current) {
    if (len <= 1) return 0;
    let next = current;
    while (next === current) next = Math.floor(Math.random() * len);
    return next;
  }
  const len = content.JOKES.length;
  const seen = new Set();
  let cur = -1, repeats = 0;
  for (let i = 0; i < 5000; i++) {
    const n = pickIndex(len, cur);
    if (n === cur) repeats++;
    seen.add(n);
    cur = n;
  }
  assert.equal(repeats, 0, "should never return the same index twice in a row");
  assert.equal(seen.size, len, "should be able to reach every item");
});

// ---------- Syntax ----------
test("scripts are valid JavaScript", () => {
  execFileSync(process.execPath, ["--check", path.join(root, "scripts/content.js")]);
  execFileSync(process.execPath, ["--check", path.join(root, "scripts/main.js")]);
});
