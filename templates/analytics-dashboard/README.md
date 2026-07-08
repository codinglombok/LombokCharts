# Analytics Dashboard — LombokCharts × LombokCSS

A general business-analytics dashboard template. Different mark mix from the trading
terminal — this one shows area/line, donut, horizontal bar, treemap, heatmap, KPI
stat-cards with sparklines, and a data table — to demonstrate LombokCharts beyond finance.

## What's inside

- **KPI cards** — Revenue, Users, Conversion, Avg Order Value, each with a
  period-over-period delta badge and a mini sparkline.
- **Revenue** — area/line (toggle) over a time x-axis.
- **Traffic Sources** — donut.
- **Top Channels** — horizontal bar.
- **Sales by Category** — squarified treemap.
- **Activity Heatmap** — hour × day matrix.
- **Recent Orders** — LombokCSS table with status dots.
- **Date range** — 7 / 30 / 90 days re-scopes every metric and recomputes deltas.

All data is synthetic, generated in the browser by [`analytics-sim.js`](analytics-sim.js)
(trends with drift + weekly seasonality, category splits, an activity matrix, and a
recent-orders feed). Swap it for your API and keep the same `update()` calls.

## Run

Open `index.html` (double-click works). It loads LombokCSS from CDN and LombokCharts
from this repo's build:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/lombokcss/dist/lombok.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/lombokcss/dist/lombok.js"></script>
<script src="analytics-sim.js"></script>
<script src="../../dist/lombok-charts.umd.js"></script>
<script src="analytics.js"></script>
```

> Run `npm run build` in the repo root once so `dist/` exists (or use the pre-built one).

## Theming

Uses LombokCSS's `data-style` (5 styles) and `data-theme` (light/dark). Charts render
with a transparent background so the card surface shows through, and follow the light/dark
token set automatically.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Layout (LombokCSS components + utilities). |
| `app.css` | ~25 lines of layout glue (KPI/main grids, chart heights, status dots). |
| `analytics-sim.js` | Zero-dependency data: trends, KPIs+deltas, traffic/channels/categories, activity matrix, orders. |
| `analytics.js` | Wires the data to charts and DOM; owns range/chart-type/theme controls. |

## License

Part of the LombokCharts project. Apache-2.0 © codinglombok.
