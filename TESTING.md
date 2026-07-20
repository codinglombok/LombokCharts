# Testing LombokCharts

Two layers, both run in CI.

## 1. Logic + smoke (zero-dependency, fast)

```bash
npm test
```

Pure-logic unit tests (scales, LTTB, ring buffer, quadtree) plus a headless DOM/Canvas smoke
test that runs the full pipeline and asserts marks were drawn. No browser required.

## 2. Visual regression (real browsers, Playwright)

Renders a **deterministic fixture** — `tests/visual/fixtures/index.html`, every mark with fixed
data and `animate:false` — across representative LombokCSS styles + themes, and compares
screenshots against committed baselines.

```bash
npm run test:visual         # compare against baselines
npm run test:visual:update  # regenerate baselines (locally, to iterate)
```

The fixture sets `body[data-ready="1"]` once all charts are drawn, so there is nothing
time-dependent to flake on. The config serves the repo over http so the fixture can load
`dist/` and `templates/lombokcss-theme.js` (LombokCSS comes from the CDN).

### Baselines are generated in CI, not locally

Screenshots are pixel-sensitive to OS/font/browser build. **Generate and commit baselines from
the pinned CI container** so they match what CI compares against:

- The `Visual` workflow runs inside `mcr.microsoft.com/playwright:v1.56.0-noble`.
- `@playwright/test` is pinned to `1.56.0` (exact) to match that container; Dependabot ignores it.
- To (re)generate baselines: run the **Visual** workflow via _workflow_dispatch_ with
  `update = true`. It runs `playwright test --update-snapshots` and commits the results under
  `tests/visual/__snapshots__/`.

Do **not** commit locally-generated baselines from a different OS — they will differ from CI.
