# Porting the pure-logic core

A deliberate split keeps the math portable: scales, decimation, layout helpers, and the ring
buffer are DOM-free and side-effect-free. Only renderers, the Chart orchestrator, and the
interaction layer touch the browser. To port LombokCharts to another language, reimplement the
pure layer and wire it to a native drawing surface.

## What is portable (no DOM, no canvas)

| Module | Responsibility | Contract |
| --- | --- | --- |
| `scales/linear` | value→pixel, `invert`, `ticks` | `s(v)=r0+(v-d0)/(d1-d0)*(r1-r0)` |
| `scales/log` | log-domain mapping | base-10; domain must be > 0 |
| `scales/time` | timestamps→pixels | linear over epoch ms; calendar ticks |
| `scales/band` | categories→bands | `step`, `bandwidth`, `center(cat)` |
| `scales/sqrt` | area-proportional radius | `r = sqrt(v) `-normalized |
| `scales/radial` | polar mapping | `polarToCartesian(cx,cy,r,θ)` |
| `scales/color` | categorical + sequential | stable index map; hex lerp |
| `data/decimate` | LTTB + min/max | preserves first/last + bucket extremes |
| `data/ringbuffer` | sliding window | fixed capacity, overwrite oldest |
| `utils/math` | clamp/lerp/extent/ticks/quantile | numeric only |

## LTTB contract (the important one)

Largest-Triangle-Three-Buckets reduces `n` points to `threshold` while preserving visual shape:

1. Always keep the first and last point.
2. Split the remaining points into `threshold - 2` equal buckets.
3. For each bucket, pick the point forming the largest-area triangle with the previously chosen
   point and the average point of the next bucket.

This preserves peaks/outliers that uniform sampling would drop. A reference implementation lives
in `src/data/decimate.js`; it operates on parallel typed arrays and returns `{xs, ys, count}`.

## Suggested target structure

```
core/        scales, decimate, ringbuffer, layout   (port first — pure)
render/       native surface adapter (the equivalent of Renderer)
marks/        port mark-by-mark, drawing through your render adapter
```

Port and unit-test the pure core first (the tests in `tests/scale.test.js`,
`decimate.test.js`, and `ringbuffer.test.js` translate directly), then implement a single
renderer and one mark (bar or line) end to end before adding the rest.

## Language notes

- **Python**: NumPy arrays map cleanly onto the typed-array pipeline; render via a backend such as
  a canvas/skia binding or by emitting SVG strings.
- **Go / Rust**: slices of `float64` mirror `Float64Array`; the scales and LTTB are allocation-light
  and translate almost line-for-line.
- **Dart / Flutter**: `Float64List` plus `CustomPainter` is a natural fit for the renderer seam.

The grammar (Data → Scale → Mark) and the draw-context contract in
[`architecture.md`](architecture.md) are the parts worth keeping identical across ports, so charts
behave the same regardless of host language.
