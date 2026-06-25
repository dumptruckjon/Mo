// Mobile / iOS Safari checks. Emulates an iPhone viewport with touch and asserts
// the layout and touch interactions hold up (no horizontal overflow, tap targets
// big enough, tap-to-use works).
//
// NOTE: This uses Chromium with iPhone emulation (viewport + touch + iOS UA),
// which catches responsive-layout and touch regressions. True WebKit/Safari
// rendering isn't available in this environment's preinstalled browser; pair this
// with a manual check on a real iPhone for pixel-level Safari quirks.

const { test, before, after } = require("node:test");
const assert = require("node:assert");
const { startServer, launchBrowser } = require("./helpers");

// iPhone 13/14-class device.
const IPHONE = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 " +
    "(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
};

let server, browser, context, page;
const pageErrors = [];

before(async () => {
  let baseURL;
  ({ server, baseURL } = await startServer());
  browser = await launchBrowser();
  context = await browser.newContext(IPHONE);
  page = await context.newPage();
  page.on("pageerror", (e) => pageErrors.push(String(e)));
  await page.goto(baseURL, { waitUntil: "load" });
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

  await page.waitForSelector("#restart:not([hidden])", { timeout: 9000 });
  const again = await page.locator("#restart").boundingBox();
  assert.ok(again && again.height >= 44, `Again button too short: ${JSON.stringify(again)}`);
});

test("tapping the cookie works with touch", async () => {
  const before = (await page.textContent("#fortune-text")).trim();
  await page.locator("#fortune-cookie").tap({ force: true });
  await page.waitForFunction(
    (b) => document.getElementById("fortune-text").textContent.trim() !== b,
    before, { timeout: 3000 }
  );
  const after = (await page.textContent("#fortune-text")).trim();
  assert.notEqual(after, before, "fortune should change on tap");
});

test("tapping the garden plants a flower with touch", async () => {
  const c0 = parseInt(await page.textContent("#flower-count"), 10);
  await page.locator("#garden").tap({ position: { x: 50, y: 60 }, force: true });
  await page.waitForFunction(
    (c) => parseInt(document.getElementById("flower-count").textContent, 10) > c,
    c0, { timeout: 3000 }
  );
  const c1 = parseInt(await page.textContent("#flower-count"), 10);
  assert.equal(c1, c0 + 1, "tapping soil should plant one flower");
});

test("no uncaught page errors on mobile", () => {
  assert.deepEqual(pageErrors, [], `page errors: ${pageErrors.join("; ")}`);
});
