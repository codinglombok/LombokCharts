# LombokCharts Roadmap — 0.1 → 1.0

The path from a well-architected early-alpha to a library you can honestly recommend for
production. Milestones are ordered by what **unblocks** the most: correctness and real-browser
validation first, then robustness, accessibility, performance proof, ecosystem, and finally a
stability guarantee. Effort is sized S / M / L (relative, not calendar time).

Guiding principles: keep **zero runtime dependencies**; keep the pure-logic core DOM-free and
portable; never regress bundle size without reason; every milestone ships green tests + a build.

---

## 0.1 — Foundation (done)
Grammar-of-graphics core (Data → Scale → Mark), Canvas + SVG renderers, 13 marks, 7 scales,
LTTB decimation, streaming (ring buffer, rAF-coalesced), tooltip/legend/zoom/synchronized
crosshair, theming + LombokCSS token bridge, 5 build targets (~18 KB gzip), 19 tests + headless
smoke, docs, examples (incl. 1M/5M stress page), Apache-2.0, CI/release-please/Pages, 4 templates.

**Known gaps:** not validated in a real browser at scale; minimal a11y; thin test coverage;
API not frozen; WebGL is a stub; no published benchmarks; not yet on npm.

---

## 0.2 — Validation & release *(the unblocker)* — **L**
You cannot claim anything until it's proven in real browsers and installable.
- Set up **Playwright** with visual-regression baselines generated in a pinned CI container (Chromium/Firefox/WebKit); snapshot every mark in light + dark + each LombokCSS style.
- Manually verify + fix every visual defect the snapshots surface (label collisions, axis density, legend fit, DPR crispness, RTL).
- **Publish to npm** via the existing release-please workflow (provenance) and confirm the jsDelivr/unpkg CDN URLs resolve; switch template/example CDN references to the published package.
- Wire an interactive example harness (a real `dev` server page) so contributors see changes live.
- **Exit criteria:** all marks render pixel-checked across 3 engines; `npm i lombok-charts` works; CDN live; visual CI green.

## 0.3 — Robustness & developer experience — **M**
- Hardening: empty / single-point / NaN / Infinity / all-equal / negative-domain data; degenerate sizes (0×0, 1px); rapid resize; destroy during animation/stream.
- Explicit error + empty states; never throw into user render loops.
- **TypeScript declarations**: generate and ship `.d.ts` (the `types` script already exists); typecheck examples.
- API-stabilization pass: consistent option names, sane defaults, deprecation shims; document every public option.
- Grow tests from 19 → a meaningful suite (target: every scale/mark/util + interaction reducers) with coverage reporting in CI.
- **Exit criteria:** fuzzed edge-case data never crashes; typed API published; coverage gate in CI.

## 0.4 — Accessibility & interaction polish — **M**
- Full **ARIA**: `role`, `aria-label`, a live text summary/description per chart; a data-table fallback for screen readers.
- **Keyboard** navigation across legend toggle, tooltip focus, and zoom/pan; visible focus; `prefers-reduced-motion`; high-contrast support.
- Interaction polish: smarter tooltip positioning (flip at edges), crosshair value labels on axes, **synchronized zoom/pan** across panels (pairs with the crosshair sync already shipped).
- **Exit criteria:** an a11y audit (axe) passes on the gallery + one template; keyboard-only operable.

## 0.5 — Performance proof & WebGL — **L**
- Publish **real benchmark numbers** (1M/5M, Canvas vs SVG, LTTB on/off) captured on named hardware across browsers — replace the "machine-dependent" caveat with data.
- Implement the **WebGL renderer** behind the existing `Renderer` seam (line/point/area first) for extreme point counts; feature-detect and fall back to Canvas.
- Offscreen-canvas / worker rendering option for heavy dashboards; memory profiling for long-running streams (verify ring-buffer constancy).
- **Exit criteria:** documented, reproducible benchmarks; WebGL path passes the smoke + visual tests; no memory growth over a 1-hour stream.

## 0.6 — Framework wrappers & ecosystem — **M**
- Thin official wrappers: `@lombokcharts/react`, `-vue`, `-svelte`, `-angular` (lifecycle + reactive props → `update`/`appendData`/`setTheme`).
- Documented extension points: custom marks (already supported via exported `Mark`), custom scales, custom renderers; a plugin registration pattern.
- First-class docs for the **design-token bridge** (LombokCSS and generic CSS-variable systems).
- **Exit criteria:** each wrapper has a demo + test; "author a custom mark" tutorial verified end-to-end.

## 0.7 → 0.9 — Feature completeness, docs, marketplace — **M each**
- More marks where demand is real: violin/density, OHLC volume overlay, gauge variants, more network/hierarchy layouts.
- Declarative **axis/legend configuration** surface; number/date **i18n** formatting; annotations & reference lines as a first-class API.
- Export improvements (crisp PNG scaling; **PDF export** as a planned open-core Pro feature; financial charts as Pro).
- Complete the docs site content (every option documented, recipes, migration notes); polish and package the commercial templates for ThemeForest/Gumroad.
- **Exit criteria:** docs cover 100% of public API; templates ship as sellable, self-contained bundles; no "TODO" in reference docs.

## 1.0 — Stability guarantee — **M**
1.0 is a promise, not a feature dump. Ship it only when all of the below are true.

### Definition of 1.0 (checklist)
- [ ] Public API **frozen** and semver-committed; deprecations documented with a migration guide.
- [ ] Cross-browser **visual + unit CI green** (Chromium, Firefox, WebKit); meaningful coverage gate.
- [ ] **Accessibility** audit passed (ARIA, keyboard, reduced-motion, contrast) on gallery + templates.
- [ ] **Published benchmarks** for 1M/5M across browsers; WebGL path shipped and documented.
- [ ] **Docs complete**: every option + event + method, recipes, theming/token bridge, porting guide, framework wrappers.
- [ ] **Bundle-size budget** enforced in CI; tree-shaking verified for custom subsets.
- [ ] **Dogfooded** by all four templates on the live Pages site with no known rendering defects.
- [ ] Security policy + responsible-disclosure tested; SBOM/provenance on release.
- [ ] A real changelog history and ≥ a handful of external issues triaged (signals real use).

---

## Prioritization at a glance
`0.2` first (nothing is real until it's validated + installable) → `0.3` robustness (safe to build
on) → `0.4` a11y (table stakes for production) → `0.5` performance proof + WebGL (backs the core
claim) → `0.6` wrappers (adoption) → `0.7–0.9` completeness + docs + marketplace → `1.0` freeze.

## Open-core alignment (business)
Free OSS core drives adoption; **Pro** features slot in cleanly: WebGL renderer (0.5), PDF export
and financial charts (0.7–0.9), premium templates (ongoing). Keep the OSS/Pro boundary at
capabilities, never at correctness or accessibility — those stay free.

## Non-goals (for 1.0)
Not trying to match ECharts' breadth or Highcharts' feature surface. LombokCharts' lane is
**small, zero-dependency, fast on large data, clean to extend**. Stay in it.
