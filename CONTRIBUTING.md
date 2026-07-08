# Contributing to LombokCharts

Thanks for your interest in improving LombokCharts! This project is a
zero-dependency chart library, and that constraint is central: **no runtime
dependencies** may be added. Build-time dev tooling (esbuild, linters) is fine.

## Getting started

```bash
git clone https://github.com/codinglombok/LombokCharts.git
cd LombokCharts
npm install      # dev-only tooling (esbuild)
npm test         # unit + headless DOM smoke tests
npm run build    # produces dist/
npm run dev      # watch build while you work
```

Open `examples/index.html` (double-click works — the examples use the UMD global
build) to see your changes across every chart type.

## Project layout

```
src/
  core/       Renderer (Canvas/SVG), Scene, Chart orchestrator, events
  scales/     pure value->pixel functions (linear, log, time, band, sqrt, radial, color)
  marks/      core/ and extended/ chart types (extend Mark, register in index.js)
  data/       adapter, LTTB decimation, ring buffer
  stream/     live scheduler + source connectors
  interaction/tooltip, legend, zoom/pan, quadtree
  theme/      design tokens (light/dark)
tests/        zero-dependency test harness
examples/     HTML demos (styled with LombokCSS)
docs/         api, theming, architecture, porting
```

Read [`docs/architecture.md`](docs/architecture.md) before adding features — it
explains the Data → Scale → Mark pipeline and the draw-context contract.

## Guidelines

- **Zero runtime dependencies.** PRs adding a runtime dependency will not be merged.
- **Keep pure logic pure.** Scales, decimation, layout math, and the ring buffer
  must stay DOM-free and side-effect-free so they remain portable and testable.
- **Add tests.** New scales/marks/utilities need coverage in `tests/`. The suite
  runs in plain Node with a tiny DOM/Canvas shim — no browser required.
- **Run `npm test`, `npm run lint`, and `npm run build`** before opening a PR.
- **Match the code style.** ESM, JSDoc `@typedef`/`@param`, `checkJs`-clean.

## Adding a chart type (mark)

1. Create `src/marks/core|extended/YourMark.js`, extending `Mark`.
2. Implement `coordinate()`, `draw(ctx)`, and — for cartesian marks — `domains()`.
3. Push hit records into `ctx.hits` and set `ctx.stats.drawn`.
4. Register it in `src/lombok-charts.js` via `registerMark('yourmark', YourMark)`.
5. Add it to `examples/index.html` and a test in `tests/dom-smoke.test.js`.

## Commit messages

This repo uses [Conventional Commits](https://www.conventionalcommits.org/) so
release automation can generate the changelog and version bumps:

```
feat: add violin mark
fix: correct band-scale center on odd counts
docs: expand porting guide
perf: reuse typed-array buffers in live flush
```

`feat:` → minor bump, `fix:`/`perf:` → patch, `feat!:` or `BREAKING CHANGE:` → major.

## Reporting bugs

Use the issue forms under **New issue**. A minimal reproduction (data + config)
is worth a thousand words. For security issues, see [SECURITY.md](SECURITY.md).

By contributing, you agree your contributions are licensed under the Apache License 2.0.
