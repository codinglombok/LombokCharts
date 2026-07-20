# API Reference

## `chart(container, config)` / `new Chart(container, config)`

Creates and immediately renders a chart. `container` is an element or a CSS selector string.
Returns a `Chart` instance.

### Config

| Option             | Type                            | Default           | Notes                                                                                                       |
| ------------------ | ------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------- |
| `data`             | `Array<object>`                 | —                 | Row data. Use with `x` / `y` / `series`.                                                                    |
| `x`                | `string`                        | `'label'` / `'x'` | Accessor key for the x value.                                                                               |
| `y`                | `string`                        | `'value'` / `'y'` | Accessor key for a single-series y value.                                                                   |
| `series`           | `Array<{key,label?,color?,y?}>` | —                 | Multiple series from the same rows.                                                                         |
| `xs`, `ys`         | `Float64Array`                  | —                 | Typed-array fast path. Bypasses row parsing.                                                                |
| `count`            | `number`                        | `ys.length`       | Number of valid entries in `xs`/`ys`.                                                                       |
| `size`             | `string`                        | —                 | Accessor for bubble radius (with `mark:'bubble'`).                                                          |
| `mark`             | `string \| object`              | `'line'`          | Chart type. Object form carries mark options.                                                               |
| `renderer`         | `'canvas' \| 'svg'`             | `'canvas'`        | Drawing surface.                                                                                            |
| `theme`            | `'light' \| 'dark' \| object`   | `'light'`         | Token set; objects deep-merge onto a base.                                                                  |
| `title`            | `string`                        | —                 | Drawn top-left.                                                                                             |
| `xLabel`, `yLabel` | `string`                        | —                 | Axis titles.                                                                                                |
| `width`, `height`  | `number`                        | container size    | Pixel size override.                                                                                        |
| `margins`          | `{top,right,bottom,left}`       | auto              | Plot insets.                                                                                                |
| `animate`          | `boolean`                       | `true`            | Auto-disabled above 50k points.                                                                             |
| `grid`             | `boolean`                       | `true`            | Background gridlines.                                                                                       |
| `legend`           | `boolean`                       | auto              | Forced on/off; auto for multi-series, arc, radar.                                                           |
| `tooltip`          | `boolean`                       | `true`            | Hover tooltip + quadtree hit-testing.                                                                       |
| `zoom`             | `boolean`                       | `false`           | Drag to pan, wheel to zoom (x-domain).                                                                      |
| `crosshair`        | `boolean`                       | `false`           | Vertical guide line following the pointer; emits `crosshair` events for multi-panel sync.                   |
| `xPad`             | `number`                        | —                 | Expand the numeric x-domain by this many x-units per side (e.g. `0.5` so edge bars/candles aren't clipped). |
| `axes`             | `boolean`                       | `true`            | Set `false` to hide axes entirely (e.g. for sparklines).                                                    |
| `maxPoints`        | `number`                        | —                 | Enables ring-buffer sliding window for live data.                                                           |
| `a11y`             | `{label,description}`           | —                 | Overrides the generated ARIA text.                                                                          |

### Mark options (object form)

```js
mark: { type: 'gauge', value: 72, min: 0, max: 100 }
mark: { type: 'donut', innerRatio: 0.6, centerLabel: 'Total' }
mark: { type: 'line', mode: 'spline', decimate: false }
mark: { type: 'histogram', value: 'amount', bins: 20 }
mark: { type: 'boxplot', groups: [{ label, values: [] }] }
mark: { type: 'sankey', nodes: [{ id, name }], links: [{ source, target, value }] }
```

String shorthands map to `{type, mode}`: `column`/`bar`, `hbar`, `stacked-bar`, `grouped-bar`,
`waterfall`, `line`, `spline`, `step`, `area`, `stacked-area`, `streamgraph`, `scatter`,
`bubble`, `pie`, `donut`, `gauge`, `radial-bar`.

## Instance methods

### `render(animate?)`

Draws the chart. Pass `false` to skip the entry animation.

### `update(data | { xs, ys, count })`

Replaces the dataset and redraws (re-animating). Accepts row arrays or typed arrays.

### `appendData(point | point[])`

Appends one or more `{x, y}` points for live charts. Multiple calls within a frame are batched
into a single redraw via the frame scheduler. With `maxPoints` set, data flows through a ring
buffer so memory stays constant.

### `stream(source, map?)`

Connects a streaming source and appends as data arrives. Supports:

- an async iterator / async generator,
- an `EventSource` (`map` receives the parsed `data`),
- a `WebSocket` (`map` receives the parsed message).

`map(raw) => {x, y}` adapts payloads. Returns the chart; call `stopStream()` to disconnect.

### `setTheme('light' | 'dark' | object)`

Swaps theme tokens and redraws without animation. Object themes deep-merge onto light (or dark if
`name: 'dark'`).

### `resize()`

Re-measures the container and redraws. Also invoked automatically by a `ResizeObserver`.

### `setCrosshair(x)`

Draws (or clears, with `null`) a vertical crosshair at a domain-x value **without** emitting an
event — use it to mirror one chart's crosshair onto others for synchronized multi-panel views
(see the trading-terminal template).

### `toPNG()` → `string`

Returns a PNG data URL. SVG-rendered charts are rasterized through a temporary canvas.

### `toSVG()` → `string`

Returns serialized `<svg>` markup, regardless of the active renderer.

### `on(type, fn)` → `off`

Subscribes to `'hover'`, `'select'` (click), `'append'` (live), or `'crosshair'` (pointer x over a
cartesian plot; payload `{x, px}` or `null` on leave). Returns an unsubscribe function.

### `destroy()`

Removes listeners, the `ResizeObserver`, the stream connection, and DOM nodes.

## Custom marks

```js
import { Chart, registerMark } from 'lombok-charts';
import { Mark } from 'lombok-charts'; // base class via deep import if needed

class MyMark extends Mark {
  coordinate() { return 'cartesian'; }      // or 'none' for self-laid-out marks
  domains(series, opts, rawData) { return { x: {…}, y: {…} }; }
  draw(ctx) { /* ctx.r, ctx.sx, ctx.sy, ctx.area, ctx.series, ctx.hits, ctx.t */ }
  legendItems(series, ctx) { return null; } // or [{label, color}]
}
registerMark('mymark', MyMark);
chart('#app', { data, mark: 'mymark' });
```

See [`architecture.md`](architecture.md) for the draw-context contract.
