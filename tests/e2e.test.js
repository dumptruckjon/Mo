// End-to-end browser tests: load the page in Chromium and click every feature.
// Runs with `node --test` alongside the unit tests.

const { test, before, after } = require("node:test");
const assert = require("node:assert");
const { startServer, launchBrowser } = require("./helpers");

let server, browser, page, baseURL;
const pageErrors = [];

before(async () => {
  ({ server, baseURL } = await startServer());
  browser = await launchBrowser();
  page = await browser.newPage();
  page.on("pageerror", (e) => pageErrors.push(String(e)));
  // The festival now lives at festival.html (index.html is the quiz gate).
  await page.goto(baseURL + "festival.html", { waitUntil: "load" });
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

test("scratch-off card reveals its prize when scratched", async () => {
  const before = (await page.textContent("#scratch-text")).trim();
  assert.ok(before.length > 0 && before !== "…", "a hidden prize should be set");
  await page.locator("#scratch-canvas").scrollIntoViewIfNeeded();
  const box = await page.locator("#scratch-canvas").boundingBox();
  const left = box.x + 6;
  const right = box.x + box.width - 6;
  const lines = 8;
  for (let i = 0; i < lines; i++) {
    const y = box.y + 8 + ((box.height - 16) * i) / (lines - 1);
    await page.mouse.move(left, y);
    await page.mouse.down();
    for (let s = 1; s <= 24; s++) {
      await page.mouse.move(left + ((right - left) * s) / 24, y);
    }
    await page.mouse.up();
  }
  await page.waitForSelector("#scratch.revealed", { timeout: 4000 });
  assert.ok(await page.locator("#scratch.revealed").count(), "card should be revealed after scratching");
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

test("the daily note shows and is stable on reload (same day)", async () => {
  const note1 = (await page.textContent("#daily-note")).trim();
  assert.ok(note1.length > 0 && note1 !== "…", "daily note should be filled in");
  await page.reload({ waitUntil: "load" });
  const note2 = (await page.textContent("#daily-note")).trim();
  assert.equal(note2, note1, "same day should show the same note");
});

test("PWA: the service worker registers", async () => {
  await page.waitForFunction(
    async () => !!(await navigator.serviceWorker.getRegistration()),
    null, { timeout: 5000 }
  );
  const has = await page.evaluate(async () => !!(await navigator.serviceWorker.getRegistration()));
  assert.ok(has, "a service worker should be registered");
});

test("PWA: the site still loads offline (served from cache)", async () => {
  // Make sure the SW is active and controlling, then go offline and reload.
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 5000 });
  const ctx = page.context();
  await ctx.setOffline(true);
  try {
    await page.reload({ waitUntil: "load" });
    await page.waitForSelector("h1.hero__title", { timeout: 5000 });
    assert.match((await page.textContent("h1.hero__title")).trim(), /Mo/);
    // Interactive JS should still be alive offline.
    assert.equal(await page.locator("#memory-grid .card-tile").count(), 12);
  } finally {
    await ctx.setOffline(false);
  }
});

test("reliability: features still work if the fireworks canvas is missing", async () => {
  const ctx = await browser.newContext();
  try {
    const p = await ctx.newPage();
    // Remove #fireworks before the app's DOMContentLoaded handler runs.
    await p.addInitScript(() => {
      document.addEventListener("DOMContentLoaded", () => {
        const c = document.getElementById("fireworks");
        if (c) c.remove();
      });
    });
    const errs = [];
    p.on("pageerror", (e) => errs.push(String(e)));
    await p.goto(baseURL + "festival.html", { waitUntil: "load" });
    // Countdown/joke + memory still initialise despite no canvas.
    await p.waitForSelector("#joke:not([hidden])", { timeout: 9000 });
    assert.equal(await p.locator("#memory-grid .card-tile").count(), 12);
    assert.deepEqual(errs, [], `unexpected page errors: ${errs.join("; ")}`);
  } finally {
    await ctx.close();
  }
});

test("respects prefers-reduced-motion: no fireworks", async () => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  try {
    const rm = await ctx.newPage();
    await rm.goto(baseURL + "festival.html", { waitUntil: "load" });
    await rm.waitForSelector("#joke:not([hidden])", { timeout: 9000 });
    await rm.waitForTimeout(400);
    const blank = await rm.evaluate(() => {
      const c = document.getElementById("fireworks");
      const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
      for (let i = 3; i < d.length; i += 4) if (d[i] !== 0) return false;
      return true;
    });
    assert.ok(blank, "fireworks canvas should stay blank under reduced-motion");
  } finally {
    await ctx.close();
  }
});

test("love-letter types itself out", async () => {
  await page.waitForFunction(
    () => document.getElementById("love-letter").classList.contains("done"),
    null, { timeout: 6000 }
  );
  assert.ok((await page.textContent("#love-letter")).trim().length > 0);
});

test("mascot reacts when tapped", async () => {
  await page.click("#mascot");
  await page.waitForFunction(
    () => !document.getElementById("mascot-bubble").hidden, null, { timeout: 3000 }
  );
  assert.ok((await page.textContent("#mascot-bubble")).trim().length > 0);
});

test("releasing a wish lantern shows a wish and floats a lantern", async () => {
  await page.click("#lantern-release");
  assert.ok((await page.textContent("#lantern-wish")).trim().length > 0, "a wish should show");
  assert.ok(await page.locator("#lantern-layer .sky-lantern").count(), "a lantern should appear");
});

test("spin wheel lands on a result", async () => {
  await page.click("#wheel-spin");
  await page.waitForFunction(
    () => document.getElementById("wheel-result").textContent.includes("→"),
    null, { timeout: 5000 }
  );
});

test("slot machine spins and resolves", async () => {
  await page.click("#slot-spin");
  await page.waitForFunction(
    () => document.getElementById("slot-result").textContent.trim().length > 0,
    null, { timeout: 5000 }
  );
});

test("love-note draw shows a note", async () => {
  const before = (await page.textContent("#draw-note")).trim();
  await page.click("#draw-btn");
  await page.waitForFunction(
    (b) => {
      const t = document.getElementById("draw-note").textContent.trim();
      return t.length > 0 && t !== "Tap for a love note…" && t !== b;
    }, before, { timeout: 3000 }
  );
});

test("whack-a-dumpling: starting and bopping scores a point", async () => {
  await page.click("#whack-start");
  let scored = false;
  for (let i = 0; i < 50 && !scored; i++) {
    await page.evaluate(() => { const c = document.querySelector(".whack-cell.up"); if (c) c.click(); });
    scored = await page.evaluate(() => /Score: [1-9]/.test(document.getElementById("whack-status").textContent));
    if (!scored) await page.waitForTimeout(100);
  }
  assert.ok(scored, "should be able to bop a dumpling for a point");
});

test("fortune teller: color then number reveals a fortune", async () => {
  await page.locator("#teller-options .teller__opt").first().click(); // color
  await page.locator("#teller-options .teller__opt").first().click(); // number
  await page.waitForFunction(
    () => document.getElementById("teller-result").textContent.trim().length > 0,
    null, { timeout: 3000 }
  );
  assert.ok(await page.locator("#teller-reset:not([hidden])").count());
});

test("constellation: connecting the stars in order completes the heart", async () => {
  const stars = page.locator("#constellation .star");
  const n = await stars.count();
  assert.equal(n, 10, "should render 10 stars");
  for (let i = 0; i < n; i++) await stars.nth(i).click();
  await page.waitForSelector("#constellation.done", { timeout: 3000 });
  assert.match((await page.textContent("#constellation-msg")).trim(), /heart/i);
});

test("idle butterfly appears after inactivity", async () => {
  const ctx = await browser.newContext();
  try {
    const p = await ctx.newPage();
    await p.addInitScript(() => { window.MO_IDLE_MS = 300; });
    await p.goto(baseURL + "festival.html", { waitUntil: "load" });
    await p.waitForSelector(".butterfly", { timeout: 4000 });
    assert.ok(await p.locator(".butterfly").count(), "a butterfly should drift in when idle");
  } finally {
    await ctx.close();
  }
});

test("cinematic intro plays when arriving from the quiz", async () => {
  const ctx = await browser.newContext();
  try {
    const p = await ctx.newPage();
    await p.addInitScript(() => {
      try { sessionStorage.setItem("mo-fromQuiz", "1"); } catch (e) { /* ignore */ }
    });
    await p.goto(baseURL + "festival.html", { waitUntil: "load" });
    await p.waitForSelector("#intro.show", { timeout: 3000 });
    assert.ok(await p.locator("#intro.show").count(), "intro overlay should play");
  } finally {
    await ctx.close();
  }
});

test("no uncaught page errors occurred during interaction", () => {
  assert.deepEqual(pageErrors, [], `page errors: ${pageErrors.join("; ")}`);
});
