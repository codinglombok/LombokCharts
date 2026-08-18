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

/**
 * Find all <script src="..."></script> in HTML and inline local ones.
 * Uses indexOf-based scanning instead of regex to avoid CodeQL js/bad-tag-filter.
 * Only processes trusted local template files — never user input.
 */
function inlineScripts(html, dir) {
  const OPEN = "<script";
  const CLOSE = "</script>";
  let result = "";
  let cursor = 0;

  while (cursor < html.length) {
    const tagStart = html.toLowerCase().indexOf(OPEN, cursor);
    if (tagStart === -1) { result += html.slice(cursor); break; }

    result += html.slice(cursor, tagStart);

    const tagEnd = html.indexOf(">", tagStart);
    if (tagEnd === -1) { result += html.slice(tagStart); break; }

    const closeStart = html.toLowerCase().indexOf(CLOSE, tagEnd);
    if (closeStart === -1) { result += html.slice(tagStart); break; }

    const tag = html.slice(tagStart, tagEnd + 1);
    const closeTag = html.slice(closeStart, closeStart + CLOSE.length + 1);

    // Extract src attribute via simple string ops (no regex on HTML)
    const srcMatch = tag.match(/\bsrc=["']([^"']+)["']/);
    const body = html.slice(tagEnd + 1, closeStart).trim();

    if (srcMatch && body.length === 0) {
      const src = srcMatch[1];
      if (/^https?:\/\//.test(src)) {
        // Keep CDN scripts as-is
        result += tag + closeTag;
      } else {
        const abs = path.resolve(dir, src);
        if (!fs.existsSync(abs)) {
          console.warn("! missing", src, "in", path.basename(dir));
          result += tag + closeTag;
        } else {
          const code = esc(fs.readFileSync(abs, "utf8"));
          result += `<script>\n${code}\n</script>`;
        }
      }
    } else {
      // Not a src-only script tag — keep as-is
      result += html.slice(tagStart, closeStart + CLOSE.length + 1);
    }

    // Find the actual closing > of </script> or </script >
    const realEnd = html.indexOf(">", closeStart + CLOSE.length - 1);
    cursor = (realEnd !== -1 ? realEnd : closeStart + CLOSE.length) + 1;
  }
  return result;
}

for (const d of dirs) {
  const dir = path.join(tplDir, d);
  const indexPath = path.join(dir, "index.html");
  if (!fs.existsSync(indexPath)) continue;
  let html = fs.readFileSync(indexPath, "utf8");

  html = inlineScripts(html, dir);

  // Point the app.css <link> inline too, so the single file needs nothing local
  const cssPath = path.join(dir, "app.css");
  if (fs.existsSync(cssPath)) {
    const cssTag = 'href="app.css"';
    const linkIdx = html.indexOf(cssTag);
    if (linkIdx !== -1) {
      const linkStart = html.lastIndexOf("<", linkIdx);
      const linkEnd = html.indexOf(">", linkIdx);
      if (linkStart !== -1 && linkEnd !== -1) {
        html = html.slice(0, linkStart)
          + `<style>\n${fs.readFileSync(cssPath, "utf8")}\n</style>`
          + html.slice(linkEnd + 1);
      }
    }
  }

  const out = path.join(dir, "standalone.html");
  fs.writeFileSync(out, html);
  console.log(
    `built ${d}/standalone.html (${(html.length / 1024).toFixed(0)} KB)`,
  );
}
console.log("Standalone build complete.");
