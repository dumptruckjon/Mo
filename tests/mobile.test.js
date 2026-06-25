// Mobile / iOS Safari checks. Runs on real WebKit (Safari's engine) when it's
// installed (CI), otherwise Chromium with iPhone emulation (local fallback).
// Validates responsive layout AND that the interactive features actually work
// on touch — including the red envelopes and memory game.
//
// Set MO_BASE_URL to run these against the LIVE deployed site instead of a
// local server (used by the post-deploy verification job).

const { test, before, after } = require("node:test");
const assert = require("node:assert");
const { startServer, launchMobileBrowser } = require("./helpers");

const IPHONE = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 " +
    "(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
};

let server, browser, context, page, engine;
const pageErrors = [];

before(async () => {
  let baseURL;
  ({ server, baseURL } = await startServer());
  ({ browser, engine } = await launchMobileBrowser());
  // WebKit rejects some emulation knobs; keep only what it accepts.
  const opts = engine === "webkit"
    ? { viewport: IPHONE.viewport, hasTouch: true, isMobile: true }
    : IPHONE;
  context = await browser.newContext(opts);
  page = await context.newPage();
  page.on("pageerror", (e) => pageErrors.push(String(e)));
  await page.goto(baseURL, { waitUntil: "load" });
  // eslint-disable-next-line no-console
  console.log(`[mobile] engine=${engine} url=${baseURL}`);
});

after(async () => {
  if (browser) await browser.close();
  if (server) await new Promise((r) => server.close(r));
});

test("no horizontal overflow at iPhone width", async () => {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  assert.ok(overflow <= 1, `page overflows horizontally by ${overflow}px`);
});

test("the viewport meta opts into safe areas", async () => {
  const content = await page.getAttribute('meta[name="viewport"]', "content");
  assert.match(content, /width=device-width/);
  assert.match(content, /viewport-fit=cover/);
});

test("primary tap targets meet the 44px minimum", async () => {
  const cookie = await page.locator("#fortune-cookie").boundingBox();
  assert.ok(cookie && cookie.width >= 44 && cookie.height >= 44,
    `cookie too small: ${JSON.stringify(cookie)}`);
  const envelope = await page.locator("#envelopes .envelope").first().boundingBox();
  assert.ok(envelope && envelope.width >= 44 && envelope.height >= 44,
    `envelope too small: ${JSON.stringify(envelope)}`);
});

test("tapping the cookie works with touch", async () => {
  const before = (await page.textContent("#fortune-text")).trim();
  await page.locator("#fortune-cookie").tap({ force: true });
  await page.waitForFunction(
    (b) => document.getElementById("fortune-text").textContent.trim() !== b,
    before, { timeout: 4000 }
  );
  assert.notEqual((await page.textContent("#fortune-text")).trim(), before);
});

test("tapping a red envelope reveals a coupon (touch)", async () => {
  const before = (await page.textContent("#envelope-text")).trim();
  await page.locator("#envelopes .envelope").first().tap({ force: true });
  await page.waitForFunction(
    (b) => document.getElementById("envelope-text").textContent.trim() !== b,
    before, { timeout: 4000 }
  );
  assert.match((await page.textContent("#envelope-text")).trim(), /Coupon/i);
});

test("the memory game renders tiles and a tapped pair matches (touch)", async () => {
  const tiles = page.locator("#memory-grid .card-tile");
  await page.waitForFunction(
    () => document.querySelectorAll("#memory-grid .card-tile").length === 12,
    null, { timeout: 4000 }
  );
  assert.equal(await tiles.count(), 12, "memory grid should render 12 tiles");

  // Tiles must be visibly sized (the bug: empty/collapsed grid).
  const box = await tiles.first().boundingBox();
  assert.ok(box && box.height >= 40 && box.width >= 40,
    `memory tile too small/invisible: ${JSON.stringify(box)}`);

  const emojis = await tiles.evaluateAll((els) => els.map((e) => e.dataset.emoji));
  const a = 0;
  const b = emojis.indexOf(emojis[a], 1);
  await tiles.nth(a).tap();
  await tiles.nth(b).tap();
  await page.waitForFunction(
    (i) => document.querySelectorAll("#memory-grid .card-tile")[i].classList.contains("matched"),
    a, { timeout: 4000 }
  );
  assert.ok(await tiles.nth(a).evaluate((e) => e.classList.contains("matched")));
});

test("New game re-renders a full board (touch)", async () => {
  await page.locator("#memory-new").tap();
  await page.waitForFunction(
    () => document.querySelectorAll("#memory-grid .card-tile").length === 12,
    null, { timeout: 4000 }
  );
  assert.equal(await page.locator("#memory-grid .card-tile").count(), 12);
});

test("the daily note renders", async () => {
  const note = (await page.textContent("#daily-note")).trim();
  assert.ok(note.length > 0 && note !== "…", "daily note should be filled in");
});

test("no uncaught page errors on mobile", () => {
  assert.deepEqual(pageErrors, [], `page errors: ${pageErrors.join("; ")}`);
});
