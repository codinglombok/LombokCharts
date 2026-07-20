# Monitoring Dashboard — LombokCharts × LombokCSS

A real-time infrastructure / IoT monitoring board. This template leans on
LombokCharts' streaming layer: gauges, ring-buffered live area charts, and a
per-host sparkline table that all update on an interval.

## What's inside

- **Gauges** — CPU, Memory, Disk (0–100%), recolored by threshold (green/amber/red).
- **Streaming metric cards** — Network, Requests/s, Latency: a live number plus a
  mini streaming area (constant-memory ring buffer).
- **Throughput** — a wide live requests/sec area chart.
- **Host table** — per-host status dot, CPU, latency, and a live latency sparkline.
- **Health pill** — overall status derived from host thresholds.

Telemetry is simulated in the browser by [`monitor-sim.js`](monitor-sim.js): bounded
random walks that reflect at their limits, windowed history, and host status derived
from latency/CPU thresholds. Point the same `appendData()` calls at a real WebSocket
or Server-Sent Events feed to go live.

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
<script src="monitor-sim.js"></script>
<script src="../../dist/lombok-charts.umd.js"></script>
<script src="monitor.js"></script>
```

> Run `npm run build` in the repo root once so `dist/` exists.

## Wiring a real feed

Replace `M.tick()` in the interval with your source and feed each chart:

```js
socket.onmessage = (msg) => {
  const s = JSON.parse(msg.data); // { cpu, mem, rps, latency, ... }
  charts.g_cpu.update([{ value: Math.round(s.cpu) }]);
  charts.wide.appendData({ x: Date.now(), y: s.rps });
};
```

## Files

| File             | Purpose                                                                  |
| ---------------- | ------------------------------------------------------------------------ |
| `index.html`     | Layout (LombokCSS components + utilities).                               |
| `app.css`        | ~20 lines of layout glue (grids, chart heights, status dots, pulse).     |
| `monitor-sim.js` | Zero-dependency telemetry: bounded walks, windowed history, host status. |
| `monitor.js`     | Wires the feed to gauges/streams/sparklines; owns the live loop.         |

## License

Part of the LombokCharts project. Apache-2.0 © codinglombok.
