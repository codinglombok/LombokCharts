# CRM Dashboard — LombokCharts × LombokCSS

An admin/CRM dashboard with a sidebar app-shell layout. Showcases the funnel and
sankey marks (not used in the other templates) alongside KPI cards, a revenue bar
chart, a rep leaderboard, a lead-source donut, an activity feed, and a contacts table.

## What's inside

- **App shell** — sticky sidebar navigation + content area (a different LombokCSS layout pattern).
- **KPI cards** — Customers, Open Deals, MRR, Win Rate with delta badges and sparklines.
- **Sales pipeline** — funnel (Lead → Qualified → Proposal → Negotiation → Won).
- **Revenue by month** — bar chart.
- **Deals by rep** — horizontal bar leaderboard.
- **Lead sources** — donut.
- **Lead flow** — sankey (source → outcome: won / open / lost).
- **Activity feed** and **contacts table** with stage badges.

Data is synthetic, from [`crm-sim.js`](crm-sim.js) (a monotonic pipeline, monthly revenue,
rep performance, lead sources, activity, and a source→outcome flow for the sankey).

## Run

Open `index.html` (double-click works). Loads LombokCSS from CDN and LombokCharts from
this repo's build:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/lombokcss/dist/lombok.min.css"
/>
<script
  defer
  src="https://cdn.jsdelivr.net/npm/lombokcss/dist/lombok.js"
></script>
<script src="crm-sim.js"></script>
<script src="../../dist/lombok-charts.umd.js"></script>
<script src="crm.js"></script>
```

> Run `npm run build` in the repo root once so `dist/` exists.

## Files

| File         | Purpose                                                                     |
| ------------ | --------------------------------------------------------------------------- |
| `index.html` | App-shell layout (LombokCSS sidebar, cards, table, badges).                 |
| `app.css`    | Shell + grid glue (~30 lines).                                              |
| `crm-sim.js` | Zero-dependency CRM data: pipeline, revenue, reps, sources, activity, flow. |
| `crm.js`     | Wires data to charts, feed, and table; sidebar nav; style/theme controls.   |

## License

Part of the LombokCharts project. Apache-2.0 © codinglombok.
