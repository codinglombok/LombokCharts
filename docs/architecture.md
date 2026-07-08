# Architecture

LombokCharts is a thin orchestrator around three replaceable layers.

```
config ─▶ Chart ─▶ Scales ─▶ Mark.draw(ctx) ─▶ Renderer ─▶ Canvas | SVG
                    ▲                              ▲
                 data adapter                 Scene (axes, plot area)
```

## Layers

**Renderer** (`core/Renderer.js`, `CanvasRenderer`, `SvgRenderer`). An abstract drawing surface:
`rect`, `line`, `polyline`, `circle`, `arcSlice`, `text`, `pathCmds`, plus typed fast paths
`polylineTyped` / `pointsTyped`. Both renderers implement the same API, so marks never know which
surface they draw on. A WebGL renderer would slot in here behind the same interface (a stub
comment marks the seam).

**Scales** (`scales/*`). Pure functions mapping data space to pixel space: `linear`, `log`,
`time`, `band`, `sqrt`, `radial`, plus categorical and sequential `color`. Every scale is a
plain function with `.domain`, `.range`, `.ticks()`, and (where meaningful) `.invert()`. No DOM,
no canvas — portable by construction.

**Marks** (`marks/*`). A mark turns scaled data into renderer calls. Core marks (bar, line, area,
point, arc) and extended marks (radar, heatmap, boxplot, histogram, candlestick, funnel, treemap,
sankey) all extend `Mark` and are looked up through a registry, so a build only includes the
marks it imports.

**Chart** (`core/Chart.js`) wires them together: resolves the container, theme, and mark; builds
series from the data adapter; constructs scales from the mark's declared domains; draws axes via
`Scene`; calls `mark.draw`; then builds the interaction quadtree and renders the legend. It also
owns the lifecycle methods (`update`, `appendData`, `stream`, `setTheme`, `resize`, export, `destroy`).

## The draw context

`mark.draw(ctx)` receives:

| Field | Meaning |
| --- | --- |
| `r` | the active renderer |
| `sx`, `sy` | x / y scales (for `coordinate() === 'cartesian'`) |
| `area` | plot rectangle `{x, y, width, height}` |
| `series` | resolved series: `{ xs, ys, count, label, color, visible, categories?, sizes? }` |
| `rawData` | the original `config.data` (for marks with custom shapes) |
| `opts` | resolved mark options `{ type, mode, … }` |
| `color` | categorical color scale (`color.byIndex(i)`) |
| `theme` | active theme tokens |
| `t` | animation progress 0→1 |
| `hits` | push `{x, y, seriesIndex, index, label, value, color, extra?}` for tooltips |
| `stats` | set `{ drawn }` (used by the benchmark/overlay) |

## Coordinate kinds

- `coordinate() === 'cartesian'` — the Chart builds x/y scales from `mark.domains(series, opts, rawData)`
  and draws axes. Horizontal bars swap roles (value on x, band categories on y).
- `coordinate() === 'none'` — the mark lays itself out inside `area` (arc, radar, heatmap, funnel,
  treemap, sankey). No axes are drawn.

## Adding a mark

1. Extend `Mark`, implement `coordinate()`, `draw(ctx)`, and — for cartesian marks — `domains()`.
2. Push hit records into `ctx.hits` for tooltips, and set `ctx.stats.drawn`.
3. `registerMark('name', YourMark)` before constructing a chart with `mark: 'name'`.

Because marks read scaled coordinates through `sx`/`sy` and draw through the renderer API, the
same mark works on Canvas and SVG and respects zoom, theming, and export with no extra code.

## Performance seams

- Typed-array series avoid per-point object allocation end to end.
- `polylineTyped` / `pointsTyped` iterate typed arrays directly into one path.
- Line/area/point marks call LTTB when `count` exceeds the pixel width, bounding rasterized work.
- Live updates funnel through a frame scheduler that coalesces bursts into one redraw per frame.
