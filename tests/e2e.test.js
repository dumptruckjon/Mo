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

test("music toggle flips on and off", async () => {
  assert.equal(await page.getAttribute("#music-toggle", "aria-pressed"), "false");
  await page.click("#music-toggle", { force: true });
  assert.equal(await page.getAttribute("#music-toggle", "aria-pressed"), "true");
  await page.click("#music-toggle", { force: true });
  assert.equal(await page.getAttribute("#music-toggle", "aria-pressed"), "false");
});

test("no uncaught page errors occurred during interaction", () => {
  assert.deepEqual(pageErrors, [], `page errors: ${pageErrors.join("; ")}`);
});
