# Trading Terminal — LombokCharts × LombokCSS

A live, self-contained crypto/trading dashboard template. UI by **LombokCSS**,
charts by **LombokCharts**, market data by a zero-dependency in-browser simulator.
No backend, no build step — open `index.html` and it runs.

## What's inside

- **Price panel** — candlestick (OHLC), 1-minute simulated bars.
- **Volume panel** — volume bars colored by candle direction (up/down), rendered by a
  small custom mark (`registerMark('volbars', …)`) that shares the price panel's exact
  linear x-domain, so price / volume / RSI line up pixel-perfect.
- **RSI(14) panel** — Wilder's RSI with 30 / 70 reference bands.
- **Order book** — synthetic bids/asks with cumulative depth bars and live spread.
- **Trade form** — buy/sell, limit/market, amount → total, with an order blotter.
- **Watchlist** — multiple assets, each with a live sparkline.
- **Synchronized crosshair** — hovering any panel draws a vertical guide at the same x across
  all three and updates the OHLC readout (via the `crosshair` event + `setCrosshair()`).
- **Live feed** — everything updates on an interval; charts stream via LombokCharts
  `update()` / `appendData()`.

Every value is generated client-side by [`market-sim.js`](market-sim.js): candles via
Geometric Brownian Motion, a synthetic order book around the mid price, and
indicators (RSI / SMA / EMA). Swap it for a real WebSocket feed by feeding ticks
into the same functions.

## Run

Just open `index.html` in a browser (double-click works). It loads:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/lombokcss/dist/lombok.min.css"
/>
<script
  defer
  src="https://cdn.jsdelivr.net/npm/lombokcss/dist/lombok.js"
></script>
<script src="market-sim.js"></script>
<script src="../../dist/lombok-charts.umd.js"></script>
<!-- from this repo's build -->
<script src="dashboard.js"></script>
```

> The template references LombokCharts from `../../dist`. Run `npm run build` in the
> repo root once (or use the pre-built `dist/`). When LombokCharts is published to
> npm, replace that line with the CDN, exactly like the LombokCSS line above.

## Theming

The page uses LombokCSS's two independent axes:

- `data-style` on `<html>` — try `resonant-stark` (default), `modern-corporate-flat`,
  `neo-brutalism`, `semantic-minimalist`, `glassmorphism`.
- `data-theme="dark" | "light"`.

Charts follow along: they're created with a transparent background and the dark
token set, so the LombokCSS card surface shows through. To hard-couple chart colors
to LombokCSS tokens, read them at runtime with `getComputedStyle` and pass them as
a `theme` override (the canonical LombokCharts ↔ LombokCSS bridge).

## Wiring a real feed

`dashboard.js` centralizes updates in two intervals. Replace the simulator calls
with your data source:

```js
// instead of market.tick():
socket.onmessage = (msg) => {
  const candle = JSON.parse(msg.data); // { t, open, high, low, close, volume }
  market.candles.push(candle);
  refreshCharts();
  renderBook();
  refreshHeader();
};
```

The chart objects (`priceChart`, `volChart`, `rsiChart`, and the watchlist sparklines)
are plain LombokCharts instances — call `update(data)` or `appendData(point)` on them.

## Files

| File            | Purpose                                                                    |
| --------------- | -------------------------------------------------------------------------- |
| `index.html`    | Layout (LombokCSS components + utilities).                                 |
| `app.css`       | ~30 lines of layout glue (grid, order-book depth bars, sparkline sizing).  |
| `market-sim.js` | Zero-dependency market data: GBM candles, order book, RSI/SMA/EMA, ticker. |
| `dashboard.js`  | Wires the simulator to charts and DOM; owns the live loop.                 |

## License

Part of the LombokCharts project. Apache-2.0 © codinglombok.
