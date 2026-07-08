# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025

### Added
- Initial public release.
- Zero-dependency core with a grammar-of-graphics pipeline (Data → Scale → Mark).
- Canvas and SVG renderers behind a single interface, with a typed-array fast path.
- Scales: linear, log, time, band, sqrt, radial, and categorical/sequential color.
- Core marks: bar (column, horizontal, grouped, stacked, waterfall), line
  (line, step, spline, slope), area (area, stacked, streamgraph), point
  (scatter, bubble), arc (pie, donut, gauge, radial-bar).
- Extended marks: radar, heatmap, histogram, box plot, candlestick, funnel,
  treemap (squarified), sankey.
- LTTB decimation and min/max decimation for large series.
- Real-time layer: `appendData`, `stream` (async iterator / EventSource /
  WebSocket), ring buffer, rAF-coalesced redraws.
- Interaction: tooltip with quadtree hit-testing, toggleable keyboard-navigable
  legend, wheel/drag zoom & pan.
- Theming via light/dark design tokens with deep-merge overrides.
- Exports: `toPNG`, `toSVG`.
- Build targets: ESM, ESM.min, UMD (IIFE global), UMD.min, CJS (~18 KB gzipped full build).
- Documentation (api, theming, architecture, porting) and HTML examples styled
  with LombokCSS, including a 1M/5M-point stress benchmark.

[0.1.0]: https://github.com/codinglombok/LombokCharts/releases/tag/v0.1.0
