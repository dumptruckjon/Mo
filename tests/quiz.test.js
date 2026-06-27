// Browser tests for the front-door quiz (index.html). Pass all 3 → festival link.
// Any wrong answer restarts at question 1. Set MO_BASE_URL to test the live site.

const { test, before, after } = require("node:test");
const assert = require("node:assert");
const { startServer, launchBrowser } = require("./helpers");
const { QUIZ } = require("../scripts/content.js");

let server, browser, page, baseURL;
const pageErrors = [];

before(async () => {
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

function currentItem() {
  return page.textContent("#quiz-question").then((t) => {
    const q = t.trim();
    return QUIZ.find((it) => it.q === q);
  });
}

async function answer(text) {
  await page.getByRole("button", { name: text, exact: true }).click();
}

async function waitForQuestionChange(prevQ) {
  await page.waitForFunction(
    (p) => document.getElementById("quiz-question").textContent.trim() !== p,
    prevQ, { timeout: 4000 }
  );
}

test("renders the first question with multiple options", async () => {
  const q = (await page.textContent("#quiz-question")).trim();
  assert.ok(q.length > 0 && q !== "…", "first question should render");
  const opts = await page.locator("#quiz-options button").count();
  assert.ok(opts >= 2, `expected options, got ${opts}`);
  assert.match(await page.textContent("#quiz-h"), /1 of 3/);
});

test("a wrong answer restarts the quiz at question 1", async () => {
  await page.reload({ waitUntil: "load" });
  // Answer Q1 correctly to advance to Q2.
  const q1 = (await page.textContent("#quiz-question")).trim();
  await answer((await currentItem()).answer);
  await waitForQuestionChange(q1);
  assert.match(await page.textContent("#quiz-h"), /2 of 3/);
  // Now answer Q2 wrong → should reset to Q1.
  const item2 = await currentItem();
  const wrong = item2.options.find((o) => o !== item2.answer);
  await answer(wrong);
  await page.waitForFunction(
    () => document.getElementById("quiz-h").textContent.includes("1 of 3"),
    null, { timeout: 4000 }
  );
  assert.equal((await page.textContent("#quiz-question")).trim(), q1, "should be back on question 1");
  assert.ok(await page.locator("#quiz-prize").isHidden(), "prize must stay locked");
});

test("answering all 3 correctly reveals the festival link + perfect badge", async () => {
  await page.reload({ waitUntil: "load" });
  for (let n = 0; n < 3; n++) {
    const q = (await page.textContent("#quiz-question")).trim();
    const item = QUIZ.find((it) => it.q === q);
    await answer(item.answer);
    if (n < 2) await waitForQuestionChange(q);
  }
  await page.waitForSelector("#quiz-prize:not([hidden])", { timeout: 4000 });
  const href = await page.getAttribute("#prize-link", "href");
  assert.match(href, /festival\.html/, "prize should link to the festival");
  assert.match((await page.textContent("#prize-badge")).trim(), /100%/, "perfect-score badge should show");
});

test("the prize link actually opens the festival", async () => {
  await page.locator("#prize-link").click();
  await page.waitForURL(/festival\.html/, { timeout: 5000 });
  await page.waitForSelector("#countdown", { timeout: 5000 });
  assert.ok(await page.locator("#countdown").count(), "festival should load");
});

test("PWA: the service worker registers on the quiz page", async () => {
  await page.goto(baseURL, { waitUntil: "load" });
  await page.waitForFunction(
    async () => !!(await navigator.serviceWorker.getRegistration()),
    null, { timeout: 5000 }
  );
  assert.ok(await page.evaluate(async () => !!(await navigator.serviceWorker.getRegistration())));
});

test("no uncaught page errors on the quiz", () => {
  assert.deepEqual(pageErrors, [], `page errors: ${pageErrors.join("; ")}`);
});
