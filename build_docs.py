#!/usr/bin/env python3
# Copyright 2025 codinglombok
# Licensed under the Apache License, Version 2.0 (see LICENSE or
# http://www.apache.org/licenses/LICENSE-2.0).
"""build_docs.py — assemble the static docs site into _site/.

Copies the landing page, built dist, runnable examples and templates, and renders
the Markdown docs into LombokCSS-styled HTML with a sidebar. Prefers the optional
`markdown` package (tables + fenced code); falls back to a small built-in converter
so the script stays self-contained.

Usage:  python3 build_docs.py
"""
import os
import re
import shutil
import html as _html

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "_site")

DOCS = [
    ("index", "Overview", None),
    ("api", "API Reference", "api.md"),
    ("theming", "Theming", "theming.md"),
    ("architecture", "Architecture", "architecture.md"),
    ("porting", "Porting", "porting.md"),
]

OVERVIEW = """# LombokCharts documentation

Zero-dependency charts with a grammar-of-graphics core, Canvas/SVG renderers, LTTB
decimation and real-time streaming. Use the sidebar to browse the reference.

- [Live examples](../examples/index.html) — every chart type, dark mode, styles.
- [Stress benchmark](../examples/stress.html) — 1M / 5M points.
- [Trading terminal template](../templates/trading-dashboard/index.html)
- [Analytics dashboard template](../templates/analytics-dashboard/index.html)
- [Monitoring dashboard template](../templates/monitoring-dashboard/index.html)
- [CRM dashboard template](../templates/crm-dashboard/index.html)
"""


def render_markdown(text):
    """Return HTML for a Markdown string, preferring python-markdown."""
    try:
        import markdown  # type: ignore
        return markdown.markdown(text, extensions=["tables", "fenced_code", "sane_lists"])
    except Exception:
        return _builtin_markdown(text)


def _inline(s):
    s = _html.escape(s, quote=False)
    # inline code first (protect content)
    codes = []
    def stash(m):
        codes.append(m.group(1))
        return "\x00%d\x00" % (len(codes) - 1)
    s = re.sub(r"`([^`]+)`", stash, s)
    s = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<em>\1</em>", s)
    s = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', s)
    s = re.sub(r"\x00(\d+)\x00", lambda m: "<code>%s</code>" % codes[int(m.group(1))], s)
    return s


def _builtin_markdown(text):
    """Minimal converter: headings, lists, tables, fenced code, hr, paragraphs."""
    lines = text.split("\n")
    out, i, n = [], 0, len(lines)
    while i < n:
        line = lines[i]
        # fenced code
        if line.startswith("```"):
            i += 1
            buf = []
            while i < n and not lines[i].startswith("```"):
                buf.append(_html.escape(lines[i], quote=False))
                i += 1
            i += 1
            out.append("<pre><code>%s</code></pre>" % "\n".join(buf))
            continue
        # table: header row + separator row
        if line.strip().startswith("|") and i + 1 < n and re.match(r"^\s*\|?[\s:|-]+\|?\s*$", lines[i + 1]):
            def cells(r):
                return [c.strip() for c in r.strip().strip("|").split("|")]
            head = cells(line)
            i += 2
            body = []
            while i < n and lines[i].strip().startswith("|"):
                body.append(cells(lines[i]))
                i += 1
            th = "".join("<th>%s</th>" % _inline(c) for c in head)
            rows = "".join("<tr>%s</tr>" % "".join("<td>%s</td>" % _inline(c) for c in r) for r in body)
            out.append("<table><thead><tr>%s</tr></thead><tbody>%s</tbody></table>" % (th, rows))
            continue
        # heading
        m = re.match(r"^(#{1,6})\s+(.*)$", line)
        if m:
            lvl = len(m.group(1))
            out.append("<h%d>%s</h%d>" % (lvl, _inline(m.group(2)), lvl))
            i += 1
            continue
        # hr
        if re.match(r"^\s*---+\s*$", line):
            out.append("<hr>")
            i += 1
            continue
        # unordered list
        if re.match(r"^\s*[-*]\s+", line):
            items = []
            while i < n and re.match(r"^\s*[-*]\s+", lines[i]):
                items.append("<li>%s</li>" % _inline(re.sub(r"^\s*[-*]\s+", "", lines[i])))
                i += 1
            out.append("<ul>%s</ul>" % "".join(items))
            continue
        # ordered list
        if re.match(r"^\s*\d+\.\s+", line):
            items = []
            while i < n and re.match(r"^\s*\d+\.\s+", lines[i]):
                items.append("<li>%s</li>" % _inline(re.sub(r"^\s*\d+\.\s+", "", lines[i])))
                i += 1
            out.append("<ol>%s</ol>" % "".join(items))
            continue
        # blank
        if line.strip() == "":
            i += 1
            continue
        # paragraph (gather until blank)
        para = [line]
        i += 1
        while i < n and lines[i].strip() != "" and not re.match(r"^(#{1,6}\s|```|\s*[-*]\s|\s*\d+\.\s|\s*\|)", lines[i]):
            para.append(lines[i])
            i += 1
        out.append("<p>%s</p>" % _inline(" ".join(para)))
    return "\n".join(out)


def shell(title, body, slug, nav):
    return """<!DOCTYPE html>
<html lang="en" data-style="modern-corporate-flat" data-theme="light">
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>{title} — LombokCharts docs</title>
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
  <aside class="docs-nav">{nav}</aside>
  <main class="docs-content">{body}</main>
</div>
<script>
  var slug='{slug}';
  document.querySelectorAll('.docs-nav a').forEach(function(a){{ if(a.dataset.slug===slug) a.classList.add('active'); }});
</script>
</body>
</html>""".format(title=_html.escape(title), nav=nav, body=body, slug=slug)


def main():
    if os.path.exists(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT)

    def copy(src, dst):
        s = os.path.join(ROOT, src)
        d = os.path.join(OUT, dst)
        if os.path.isdir(s):
            shutil.copytree(s, d)
        elif os.path.exists(s):
            shutil.copy2(s, d)

    copy("site/index.html", "index.html")
    copy("site/site.css", "site.css")
    for d in ("dist", "examples", "templates"):
        copy(d, d)
    copy("assets/social-preview.png", "social-preview.png")

    os.makedirs(os.path.join(OUT, "docs"), exist_ok=True)
    nav = "\n".join('<a href="{s}.html" data-slug="{s}">{t}</a>'.format(s=s, t=t) for s, t, _ in DOCS)

    for slug, title, fname in DOCS:
        md = OVERVIEW if fname is None else open(os.path.join(ROOT, "docs", fname), encoding="utf-8").read()
        body = render_markdown(md)
        body = re.sub(r'href="([^"]+)\.md"', r'href="\1.html"', body)  # cross-doc links
        with open(os.path.join(OUT, "docs", slug + ".html"), "w", encoding="utf-8") as f:
            f.write(shell(title, body, slug, nav))

    print("Docs site assembled at _site/ ({} doc pages + examples + templates + dist).".format(len(DOCS)))


if __name__ == "__main__":
    main()
