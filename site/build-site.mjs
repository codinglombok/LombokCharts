// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// build-site.mjs — assemble a static GitHub Pages site into _site/.
// Copies the landing page, dist, examples and templates, and renders docs
// markdown into LombokCSS-styled HTML. Build-time only (uses the `marked` devDep).
import { marked } from 'marked';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.join(root, '_site');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const cp = (src, dst) => fs.cpSync(path.join(root, src), path.join(out, dst), { recursive: true });

// Static assets + built library + runnable demos
cp('site/index.html', 'index.html');
cp('site/site.css', 'site.css');
cp('dist', 'dist');
cp('examples', 'examples');
cp('templates', 'templates');
cp('assets/social-preview.png', 'social-preview.png');

// Render docs markdown -> styled HTML with a sidebar
const DOCS = [
  ['index', 'Overview', null],
  ['api', 'API Reference', 'api.md'],
  ['theming', 'Theming', 'theming.md'],
  ['architecture', 'Architecture', 'architecture.md'],
  ['porting', 'Porting', 'porting.md'],
];
fs.mkdirSync(path.join(out, 'docs'), { recursive: true });

const overview = `# LombokCharts documentation

Zero-dependency charts with a grammar-of-graphics core, Canvas/SVG renderers, LTTB
decimation and real-time streaming. Use the sidebar to browse the reference.

- [Live examples](../examples/index.html) — every chart type, dark mode, styles.
- [Stress benchmark](../examples/stress.html) — 1M / 5M points.
- [Trading terminal template](../templates/trading-dashboard/index.html)
- [Analytics dashboard template](../templates/analytics-dashboard/index.html)
`;

const nav = DOCS.map(([slug, title]) => `<a href="${slug}.html" data-slug="${slug}">${title}</a>`).join('\n');

function shell(title, bodyHtml, slug) {
  return `<!DOCTYPE html>
<html lang="en" data-style="modern-corporate-flat" data-theme="light">
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title} — LombokCharts docs</title>
<meta property="og:type" content="website" />
<meta property="og:title" content="LombokCharts docs" />
<meta property="og:description" content="Zero-dependency charts for the web. ~19 KB gzipped." />
<meta property="og:image" content="https://codinglombok.github.io/LombokCharts/social-preview.png" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="https://codinglombok.github.io/LombokCharts/social-preview.png" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/lombokcss/dist/lombok.min.css">
<link rel="stylesheet" href="../site.css">
</head>
<body>
<nav class="navbar"><a class="navbar-brand" href="../index.html">LombokCharts</a>
  <span class="text-muted">docs</span>
  <a class="btn btn-soft btn-sm" href="../index.html" style="margin-inline-start:auto">← Home</a>
</nav>
<div class="docs-layout container">
  <aside class="docs-nav">${nav}</aside>
  <main class="docs-content">${bodyHtml}</main>
</div>
<script>
  var slug='${slug}';
  document.querySelectorAll('.docs-nav a').forEach(function(a){ if(a.dataset.slug===slug) a.classList.add('active'); });
</script>
</body>
</html>`;
}

for (const [slug, title, file] of DOCS) {
  const md = file ? fs.readFileSync(path.join(root, 'docs', file), 'utf8') : overview;
  // .md links -> .html so cross-doc navigation works on the static site
  let html = marked.parse(md).replace(/href="([^"]+)\.md"/g, 'href="$1.html"');
  fs.writeFileSync(path.join(out, 'docs', `${slug}.html`), shell(title, html, slug));
}

console.log('Site assembled at _site/ (' + DOCS.length + ' doc pages + examples + templates + dist).');
