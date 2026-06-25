// Shared helpers for the Playwright browser tests: locate a Chromium binary and
// serve the site over a local HTTP server.

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const ROOT = path.join(__dirname, "..");
const MIME = {
  ".html": "text/html", ".css": "text/css", ".js": "text/javascript",
  ".svg": "image/svg+xml", ".json": "application/json",
};

// Prefer the browser Playwright expects; otherwise scan the preinstalled dir.
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

async function startServer(root = ROOT) {
  const server = http.createServer((req, res) => {
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
  return { server, baseURL: `http://localhost:${server.address().port}/` };
}

async function launchBrowser() {
  const executablePath = findChromium();
  return chromium.launch({
    args: ["--no-sandbox", "--use-gl=swiftshader"],
    ...(executablePath ? { executablePath } : {}),
  });
}

module.exports = { findChromium, startServer, launchBrowser, ROOT };
