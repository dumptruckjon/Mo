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
  for (const f of [
    "index.html", "festival.html", "styles/main.css",
    "scripts/main.js", "scripts/quiz.js", "scripts/content.js",
  ]) {
    assert.ok(fs.existsSync(path.join(root, f)), `missing ${f}`);
  }
});

test("the quiz (index) links styles, content, and quiz script", () => {
  const html = read("index.html");
  assert.match(html, /styles\/main\.css/, "stylesheet not linked");
  assert.match(html, /scripts\/content\.js/, "content.js not linked");
  assert.match(html, /scripts\/quiz\.js/, "quiz.js not linked");
});

test("the festival page links styles, content, and main script", () => {
  const html = read("festival.html");
  assert.match(html, /styles\/main\.css/, "stylesheet not linked");
  assert.match(html, /scripts\/content\.js/, "content.js not linked");
  assert.match(html, /scripts\/main\.js/, "main.js not linked");
});

test("assets are cache-busted (version query) on both pages", () => {
  const idx = read("index.html");
  assert.match(idx, /styles\/main\.css\?v=/, "quiz css not cache-busted");
  assert.match(idx, /scripts\/content\.js\?v=/, "quiz content.js not cache-busted");
  assert.match(idx, /scripts\/quiz\.js\?v=/, "quiz.js not cache-busted");
  const fest = read("festival.html");
  assert.match(fest, /scripts\/main\.js\?v=/, "festival main.js not cache-busted");
});

test("feature inits are isolated so one failure can't break the others", () => {
  const js = read("scripts/main.js");
  assert.match(js, /try\s*\{\s*init\(\)/, "inits should run inside try/catch");
});

test("the quiz page has its required UI hooks", () => {
  const html = read("index.html");
  for (const id of ['id="quiz-question"', 'id="quiz-options"', 'id="quiz-feedback"',
    'id="quiz-prize"', 'id="prize-link"', 'id="quiz-h"']) {
    assert.ok(html.includes(id), `quiz missing element ${id}`);
  }
  assert.match(html, /href="festival\.html"/, "prize must link to the festival");
});

test("the festival page has all required UI hooks", () => {
  const html = read("festival.html");
  const ids = [
    'id="countdown"', 'id="joke"', 'id="restart"', 'id="fireworks"',
    'id="food-bg"', 'id="daily-note"',
    'id="fortune-cookie"', 'id="fortune-text"',
    'id="garden"', 'id="flower-count"',
    'id="envelopes"', 'id="envelope-text"',
    'id="memory-grid"', 'id="memory-status"', 'id="memory-new"',
    'id="scratch"', 'id="scratch-canvas"', 'id="scratch-text"', 'id="scratch-new"',
    'id="joke-zh"', 'id="joke-punch"', 'id="joke-pinyin"', 'id="joke-en"',
  ];
  for (const id of ids) assert.ok(html.includes(id), `missing element ${id}`);
});

test("the quiz pool is well-formed and includes the signature questions", () => {
  assert.ok(Array.isArray(content.QUIZ) && content.QUIZ.length >= 3,
    "quiz pool needs at least 3 questions");
  for (const item of content.QUIZ) {
    assert.ok(item.q && item.q.length > 0, "question text missing");
    assert.ok(Array.isArray(item.options) && item.options.length >= 3, "need >= 3 options");
    assert.ok(item.options.includes(item.answer), "the correct answer must be one of the options");
  }
  // The three inside-joke questions must be present in the pool.
  const byQ = Object.fromEntries(content.QUIZ.map((i) => [i.q, i.answer]));
  assert.equal(byQ["Who is the naughtiest?"], "Mo");
  assert.equal(byQ["What is Molly's favorite hobby?"], "Pickin' and fartin'");
  assert.equal(byQ["Which gushis are the most commonly shared gushis?"], "LooAyi gushi");
});

test("there are wrong-answer reactions and scratch-card prizes", () => {
  assert.ok(Array.isArray(content.WRONG_REACTIONS) && content.WRONG_REACTIONS.length >= 3,
    "need a few wrong-answer reactions");
  for (const r of content.WRONG_REACTIONS) assert.ok(typeof r === "string" && r.length > 0, "empty reaction");
  assert.ok(Array.isArray(content.SCRATCH) && content.SCRATCH.length >= 4,
    "need several scratch prizes");
  for (const s of content.SCRATCH) assert.ok(typeof s === "string" && s.length > 0, "empty scratch prize");
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
  // SW precaches both pages so either entry works offline.
  assert.match(sw, /festival\.html/, "SW should precache festival.html");

  // The front door (quiz) and the festival both register the SW.
  assert.match(read("scripts/quiz.js"), /serviceWorker\.register/, "quiz.js should register the SW");
  assert.match(read("scripts/main.js"), /serviceWorker\.register/, "main.js should register the SW");
});

// ---------- Behavior wiring (main.js) ----------
test("main.js wires up every feature", () => {
  const js = read("scripts/main.js");
  for (const sym of [
    "initFoodBackground", "initCountdown", "initFortuneCookie",
    "initGarden", "initEnvelopes", "initMemory", "initDailyNote", "initScratch", "createFireworks",
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
