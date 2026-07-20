// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// screenshots.mjs — capture real browser screenshots of the templates/examples
// into assets/previews/ (replacing the generated placeholder cards). Run where
// Playwright browsers are available:  node scripts/screenshots.mjs
import { chromium } from '@playwright/test';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };

const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  const file = fs.existsSync(p) && fs.statSync(p).isDirectory() ? path.join(p, 'index.html') : p;
  if (!fs.existsSync(file)) { res.writeHead(404); return res.end('nope'); }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

const PAGES = [
  ['trading.png', '/templates/trading-dashboard/index.html'],
  ['analytics.png', '/templates/analytics-dashboard/index.html'],
  ['monitoring.png', '/templates/monitoring-dashboard/index.html'],
  ['crm.png', '/templates/crm-dashboard/index.html'],
  ['examples.png', '/examples/index.html'],
  ['stress.png', '/examples/stress.html'],
];

await new Promise((r) => server.listen(4174, r));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 640 }, deviceScaleFactor: 1 });
fs.mkdirSync(path.join(root, 'assets/previews'), { recursive: true });

for (const [file, url] of PAGES) {
  await page.goto(`http://localhost:4174${url}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500); // let live charts stream a few frames
  await page.screenshot({ path: path.join(root, 'assets/previews', file) });
  console.log('captured', file, '<-', url);
}

await browser.close();
server.close();
console.log('Real screenshots written to assets/previews/.');
