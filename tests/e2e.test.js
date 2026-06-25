// End-to-end browser tests: actually load the page in Chromium and click things.
// Runs with `node --test` alongside the unit tests. Requires Playwright + a
// Chromium binary (preinstalled locally at $PLAYWRIGHT_BROWSERS_PATH, or installed
// via `npx playwright install chromium` in CI).

const { test, before, after } = require("node:test");
const assert = require("node:assert");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const root = path.join(__dirname, "..");
const MIME = {
  ".html": "text/html", ".css": "text/css", ".js": "text/javascript",
  ".svg": "image/svg+xml", ".json": "application/json",
};

// Find a usable Chromium: prefer the one Playwright expects, else scan the
// preinstalled browser dir for any chrome / headless_shell binary.
function findChromium() {
  try {
    const p = chromium.executablePath();
    if (p && fs.existsSync(p)) return p; // CI: `playwright install` put it here
  } catch (_) { /* ignore */ }
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
  if (!fs.existsSync(base)) return null;
  for (const dir of fs.readdirSync(base)) {
    if (!/^chromium/.test(dir)) continue;
    for (const rel of ["chrome-linux/chrome", "chrome-linux64/chrome", "chrome-linux/headless_shell"]) {
      const cand = path.join(base, dir, rel);
      if (fs.existsSync(cand)) return cand;
    }
  }
  return null;
}

let server, browser, page;
const pageErrors = [];

before(async () => {
  // Serve the repo root.
  server = http.createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split("?")[0]);
    if (urlPath === "/") urlPath = "/index.html";
    const file = path.join(root, urlPath);
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.statusCode = 404;
      return res.end("not found");
    }
    res.setHeader("Content-Type", MIME[path.extname(file)] || "application/octet-stream");
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(0, r));
  const baseURL = `http://localhost:${server.address().port}/`;

  const executablePath = findChromium();
  browser = await chromium.launch({
    args: ["--no-sandbox", "--use-gl=swiftshader"],
    ...(executablePath ? { executablePath } : {}),
  });
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
