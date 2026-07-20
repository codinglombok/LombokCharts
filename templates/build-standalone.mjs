// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// build-standalone.mjs — produce a single self-contained standalone.html per
// template by inlining local <script src> (sim + wiring) and the dist UMD bundle.
// External CDN links (LombokCSS) are left as-is. Result renders anywhere, including
// isolated HTML previews, with no sibling files or build folder needed.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "..",
);
const tplDir = path.join(root, "templates");
const dirs = fs
  .readdirSync(tplDir)
  .filter((d) => fs.statSync(path.join(tplDir, d)).isDirectory());

const esc = (js) => js.replace(/<\/script>/gi, "<\\/script>"); // guard against premature tag close

for (const d of dirs) {
  const dir = path.join(tplDir, d);
  const indexPath = path.join(dir, "index.html");
  if (!fs.existsSync(indexPath)) continue;
  let html = fs.readFileSync(indexPath, "utf8");

  //  html = html.replace(/<script\s+src="([^"]+)"><\/script>/g, (m, src) => {
  //    if (/^https?:\/\//.test(src)) return m; // keep CDN scripts
  //    const abs = path.resolve(dir, src);      // resolves ../../dist/... and local files
  //    if (!fs.existsSync(abs)) { console.warn('  ! missing', src, 'in', d); return m; }
  //    const code = esc(fs.readFileSync(abs, 'utf8'));
  //    return `<script>\n${code}\n</script>`;
  //  });
  // new update
  html = html.replace(
    /<script\s+src=["']([^"']+)["']\s*>\s*<\/script\s*>/gi,
    (m, src) => {
      if (/^https?:\/\//.test(src)) return m; // keep CDN scripts
      const abs = path.resolve(dir, src);
      if (!fs.existsSync(abs)) {
        console.warn("! missing", src, "in", d);
        return m;
      }
      // ... inline logic
    },
  );

  // point the app.css <link> inline too, so the single file needs nothing local
  html = html.replace(
    /<link\s+rel="stylesheet"\s+href="app\.css"\s*\/?>/,
    () => {
      const cssPath = path.join(dir, "app.css");
      if (!fs.existsSync(cssPath)) return "";
      return `<style>\n${fs.readFileSync(cssPath, "utf8")}\n</style>`;
    },
  );

  const out = path.join(dir, "standalone.html");
  fs.writeFileSync(out, html);
  console.log(
    `built ${d}/standalone.html (${(html.length / 1024).toFixed(0)} KB)`,
  );
}
console.log("Standalone build complete.");
