// End-to-end browser tests: load the page in Chromium and click every feature.
// Runs with `node --test` alongside the unit tests.

const { test, before, after } = require("node:test");
const assert = require("node:assert");
const { startServer, launchBrowser } = require("./helpers");

let server, browser, page;
const pageErrors = [];

before(async () => {
  let baseURL;
  ({ server, baseURL } = await startServer());
  browser = await launchBrowser();
  page = await browser.newPage();
  page.on("pageerror", (e) => pageErrors.push(String(e)));
  await page.goto(baseURL, { waitUntil: "load" });
});

after(async () => {
  if (browser) await browser.close();
  if (server) await new Promise((r) => server.close(r));
});

test("floating Chinese food is rendered", async () => {
  const n = await page.$$eval("#food-bg .food", (els) => els.length);
  assert.ok(n > 0, "expected drifting food elements in #food-bg");
});

test("countdown reveals a joke at zero", async () => {
  const start = (await page.textContent("#countdown")).trim();
  assert.match(start, /^[1-5]$/, `countdown should show 1–5, saw "${start}"`);
  await page.waitForSelector("#joke:not([hidden])", { timeout: 9000 });
  const zh = (await page.textContent("#joke-zh")).trim();
  assert.ok(zh.length > 0, "joke text should be filled in");
  assert.ok(await page.isVisible("#restart"), "Again button should appear");
});

test("fortune cookie reveals a note when clicked", async () => {
  const before = (await page.textContent("#fortune-text")).trim();
  await page.click("#fortune-cookie", { force: true }); // force: it bobs continuously
  await page.waitForFunction(
    (b) => document.getElementById("fortune-text").textContent.trim() !== b,
    before, { timeout: 3000 }
  );
  const after = (await page.textContent("#fortune-text")).trim();
  assert.notEqual(after, before, "fortune text should change");
  assert.ok(after.length > 0, "a fortune should be shown");
});

test("garden plants a flower and increments the counter", async () => {
  const c0 = parseInt(await page.textContent("#flower-count"), 10);
  const soil = await page.$("#garden");
  await soil.click({ position: { x: 40, y: 60 }, force: true });
  await page.waitForFunction(
    (c) => parseInt(document.getElementById("flower-count").textContent, 10) > c,
    c0, { timeout: 3000 }
  );
  const c1 = parseInt(await page.textContent("#flower-count"), 10);
  assert.equal(c1, c0 + 1, "counter should increase by one");
  const flowers = await page.$$("#garden .flower");
  assert.ok(flowers.length >= 1, "a flower element should be planted");
});

test("a red envelope reveals a coupon when tapped", async () => {
  const before = (await page.textContent("#envelope-text")).trim();
  await page.locator("#envelopes .envelope").first().click({ force: true });
  await page.waitForFunction(
    (b) => document.getElementById("envelope-text").textContent.trim() !== b,
    before, { timeout: 3000 }
  );
  const after = (await page.textContent("#envelope-text")).trim();
  assert.notEqual(after, before, "coupon text should change");
  assert.match(after, /Coupon/i, "should reveal a coupon");
});

test("memory game: a board renders and a known pair matches", async () => {
  const tiles = page.locator("#memory-grid .card-tile");
  assert.equal(await tiles.count(), 12, "expected 12 cards (6 pairs)");

  // Find two cards with the same hidden emoji and match them.
  const emojis = await tiles.evaluateAll((els) => els.map((e) => e.dataset.emoji));
  const idxA = 0;
  const idxB = emojis.indexOf(emojis[idxA], 1);
  assert.ok(idxB > 0, "should find a matching pair");

  await tiles.nth(idxA).click();
  await tiles.nth(idxB).click();
  await page.waitForFunction(
    (i) => document.querySelectorAll("#memory-grid .card-tile")[i].classList.contains("matched"),
    idxA, { timeout: 3000 }
  );
  assert.ok(await tiles.nth(idxA).evaluate((e) => e.classList.contains("matched")));
  assert.ok(await tiles.nth(idxB).evaluate((e) => e.classList.contains("matched")));
});

test("memory game: solving the whole board wins", async () => {
  await page.click("#memory-new"); // fresh board
  const tiles = page.locator("#memory-grid .card-tile");
  const emojis = await tiles.evaluateAll((els) => els.map((e) => e.dataset.emoji));

  // Group indices by emoji and click each pair in turn.
  const byEmoji = {};
  emojis.forEach((e, i) => { (byEmoji[e] = byEmoji[e] || []).push(i); });
  for (const idxs of Object.values(byEmoji)) {
    await tiles.nth(idxs[0]).click();
    await tiles.nth(idxs[1]).click();
    await page.waitForFunction(
      (i) => document.querySelectorAll("#memory-grid .card-tile")[i].classList.contains("matched"),
      idxs[0], { timeout: 3000 }
    );
  }
  const status = (await page.textContent("#memory-status")).trim();
  assert.match(status, /did it/i, `expected a win message, got "${status}"`);
});

test("fireworks fire only after the countdown — not on tap or scroll", async () => {
  // Fresh countdown so this test doesn't depend on earlier test timing.
  await page.reload({ waitUntil: "load" });

  // Returns true if the fireworks canvas has no drawn pixels.
  const canvasBlank = () => {
    const c = document.getElementById("fireworks");
    const data = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    for (let i = 3; i < data.length; i += 4) if (data[i] !== 0) return false;
    return true;
  };

  // During the countdown, tapping and scrolling must NOT spawn fireworks.
  await page.mouse.click(5, 300);
  await page.mouse.wheel(0, 200);
  await page.waitForTimeout(300);
  assert.ok(await page.evaluate(canvasBlank),
    "canvas should stay blank during the countdown (no tap/scroll fireworks)");

  // After the countdown reaches zero, fireworks should appear.
  await page.waitForSelector("#joke:not([hidden])", { timeout: 9000 });
  await page.waitForTimeout(300);
  assert.ok(!(await page.evaluate(canvasBlank)),
    "fireworks should be drawn after the countdown");
});

test("no uncaught page errors occurred during interaction", () => {
  assert.deepEqual(pageErrors, [], `page errors: ${pageErrors.join("; ")}`);
});
