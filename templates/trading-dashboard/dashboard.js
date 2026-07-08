// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// dashboard.js — wires MarketSim + LombokCharts into a live trading terminal.
(function () {
  'use strict';
  function boot() {
    if (typeof LombokCharts === 'undefined' || typeof MarketSim === 'undefined') { return setTimeout(boot, 30); }
    const { chart, registerMark, Mark } = LombokCharts;
    const M = MarketSim;
    const $ = (id) => document.getElementById(id);
    const root = document.documentElement;
    const CHART_THEME = lombokTheme();
    const GREEN = '#2f9e44', RED = '#e03131', ACCENT = '#5b9bff', MUTED = '#6b7280';

    // Custom mark: volume bars on the SAME linear index x-domain as the candlestick,
    // so price / volume / RSI panels line up pixel-perfect. Colored by candle direction.
    class VolBarsMark extends Mark {
      domains(series, opts, rawData) {
        let max = 0, xmax = 0;
        for (const d of rawData) { if (d.volume > max) max = d.volume; if (d.x > xmax) xmax = d.x; }
        return { x: { type: 'linear', domain: [0, xmax] }, y: { domain: [0, max * 1.12] } };
      }
      draw(ctx) {
        const { r, sx, sy, rawData } = ctx;
        const step = rawData.length > 1 ? Math.abs(sx(rawData[1].x) - sx(rawData[0].x)) : 10;
        const w = Math.max(1, step * 0.62);
        const y0 = sy(0);
        for (let i = 0; i < rawData.length; i++) {
          const d = rawData[i], cx = sx(d.x), yv = sy(d.volume);
          r.rect(cx - w / 2, yv, w, Math.max(0, y0 - yv), { fill: d.up ? GREEN : RED, opacity: 0.5 });
          ctx.hits.push({ x: cx, y: yv, seriesIndex: 0, index: i, label: 'Vol', value: d.volume, color: d.up ? GREEN : RED });
        }
        ctx.stats = { drawn: rawData.length };
      }
    }
    registerMark('volbars', VolBarsMark);
    const volData = () => market.candles.map((c, i) => ({ x: i, volume: c.volume, up: c.close >= c.open }));

    const fmtP = (v) => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtV = (v) => v >= 1e6 ? (v / 1e6).toFixed(2) + 'M' : v >= 1e3 ? (v / 1e3).toFixed(1) + 'K' : String(v);

    // ---- Symbols ----
    const SYMBOLS = {
      'BTC-USD': { start: 64200, vol: 0.012, intervalMs: 60000 },
      'ETH-USD': { start: 3180, vol: 0.016, intervalMs: 60000 },
      'SOL-USD': { start: 148, vol: 0.024, intervalMs: 60000 },
    };
    let symbol = 'BTC-USD';
    let market, priceChart, volChart, rsiChart;

    const COUNT = 72; // visible candles

    function buildCharts() {
      [priceChart, volChart, rsiChart].forEach((c) => c && c.destroy());
      const margins = { top: 10, right: 14, bottom: 4, left: 62 };

      priceChart = chart('#priceChart', {
        data: market.candles.map((c, i) => ({ x: i, open: c.open, high: c.high, low: c.low, close: c.close })),
        mark: 'candlestick', theme: CHART_THEME, animate: false, margins, grid: true, tooltip: true, crosshair: true, xPad: 0.5,
      });

      volChart = chart('#vol', {
        data: volData(), x: 'x', y: 'volume', mark: 'volbars',
        theme: CHART_THEME, animate: false, margins, grid: false, legend: false, tooltip: true, crosshair: true, xPad: 0.5,
      });

      rsiChart = chart('#rsi', rsiConfig(margins));

      // Synchronize the crosshair across all three panels + drive the OHLC readout.
      const panels = [priceChart, volChart, rsiChart];
      panels.forEach((p) => p.on('crosshair', (info) => {
        panels.forEach((q) => { if (q !== p) q.setCrosshair(info ? info.x : null); });
        if (info) { const i = Math.round(info.x); const c = market.candles[i]; if (c) updateReadout(c); }
        else clearReadout();
      }));
    }

    function updateReadout(c) {
      const el = $('ohlc'); if (!el) return;
      const up = c.close >= c.open;
      el.innerHTML = `O ${fmtP(c.open)}  H ${fmtP(c.high)}  L ${fmtP(c.low)}  C <span style="color:${up ? GREEN : RED}">${fmtP(c.close)}</span>  ` +
        `<span style="color:${up ? GREEN : RED}">${up ? '+' : ''}${((c.close - c.open) / c.open * 100).toFixed(2)}%</span>`;
    }
    function clearReadout() { const el = $('ohlc'); if (el) el.innerHTML = ''; }

    function rsiConfig(margins) {
      const r = market.rsi(14);
      const data = r.map((v, i) => ({ label: i, rsi: v == null ? 50 : v, l30: 30, l70: 70 }));
      return {
        data, x: 'label',
        series: [
          { key: 'rsi', label: 'RSI(14)', color: ACCENT },
          { key: 'l70', label: '70', color: 'rgba(224,49,49,0.5)' },
          { key: 'l30', label: '30', color: 'rgba(47,158,68,0.5)' },
        ],
        mark: 'line', theme: CHART_THEME, animate: false, margins, grid: true, legend: false, tooltip: false, crosshair: true, xPad: 0.5,
      };
    }

    function refreshCharts() {
      priceChart.update(market.candles.map((c, i) => ({ x: i, open: c.open, high: c.high, low: c.low, close: c.close })));
      volChart.update(volData());
      const r = market.rsi(14);
      rsiChart.update(r.map((v, i) => ({ label: i, rsi: v == null ? 50 : v, l30: 30, l70: 70 })));
    }

    // ---- Order book ----
    function renderBook() {
      const book = market.book();
      const max = Math.max(book.asks[book.asks.length - 1].total, book.bids[book.bids.length - 1].total);
      const row = (o, side) => {
        const w = (o.total / max * 100).toFixed(1);
        return `<div class="ob-row ${side}"><span class="ob-depth" style="width:${w}%"></span>` +
          `<span class="ob-price">${fmtP(o.price)}</span><span class="sz">${o.size.toFixed(2)}</span><span class="tot">${o.total.toFixed(1)}</span></div>`;
      };
      $('asks').innerHTML = book.asks.slice().reverse().map((a) => row(a, 'ask')).join('');
      $('bids').innerHTML = book.bids.map((b) => row(b, 'bid')).join('');
      $('spread').textContent = `Spread ${fmtP(book.spread)} (${(book.spread / market.last().close * 100).toFixed(3)}%)`;
    }

    // ---- Top bar ----
    function refreshHeader() {
      const c = market.candles;
      const last = c[c.length - 1].close;
      const first = c[Math.max(0, c.length - COUNT)].close;
      const chg = (last - first) / first * 100;
      $('lastPrice').textContent = fmtP(last);
      $('lastPrice').style.color = chg >= 0 ? GREEN : RED;
      const badge = $('change');
      badge.textContent = (chg >= 0 ? '+' : '') + chg.toFixed(2) + '%';
      badge.className = 'badge badge-pill ' + (chg >= 0 ? 'badge-success' : 'badge-danger');
      let hi = -Infinity, lo = Infinity, vol = 0;
      for (let i = Math.max(0, c.length - COUNT); i < c.length; i++) { hi = Math.max(hi, c[i].high); lo = Math.min(lo, c[i].low); vol += c[i].volume; }
      $('high').textContent = fmtP(hi); $('low').textContent = fmtP(lo); $('vol24').textContent = fmtV(vol);
    }

    // ---- Watchlist with sparklines ----
    let ticker, sparks = {};
    function buildWatchlist() {
      Object.values(sparks).forEach((s) => s.destroy()); sparks = {};
      ticker = M.createTicker(Object.keys(SYMBOLS).map((s) => ({ symbol: s, price: SYMBOLS[s].start, vol: SYMBOLS[s].vol })), 48);
      $('watchlist').innerHTML = ticker.assets.map((a) =>
        `<div class="wl-row"><span class="wl-sym">${a.symbol}</span>` +
        `<span class="wl-px" id="wl_${a.symbol.replace(/\W/g, '')}">${fmtP(a.price)}</span>` +
        `<div class="spark" id="sp_${a.symbol.replace(/\W/g, '')}"></div></div>`).join('');
      ticker.assets.forEach((a) => {
        const id = a.symbol.replace(/\W/g, '');
        sparks[a.symbol] = chart('#sp_' + id, {
          xs: Float64Array.from(a.spark.map((_, i) => i)), ys: Float64Array.from(a.spark),
          mark: 'line', theme: { name: 'dark', colors: { background: 'transparent' } },
          animate: false, axes: false, grid: false, tooltip: false,
          margins: { top: 3, right: 3, bottom: 3, left: 3 },
          color: a.changePct >= 0 ? GREEN : RED,
        });
      });
    }
    function refreshWatchlist() {
      ticker.tick();
      ticker.assets.forEach((a) => {
        const id = a.symbol.replace(/\W/g, '');
        const px = $('wl_' + id); if (px) { px.textContent = fmtP(a.price); px.style.color = a.changePct >= 0 ? GREEN : RED; }
        sparks[a.symbol].update({ xs: Float64Array.from(a.spark.map((_, i) => i)), ys: Float64Array.from(a.spark), count: a.spark.length });
      });
    }

    // ---- Trade form ----
    let side = 'buy';
    function bindForm() {
      $('buyBtn').onclick = () => setSide('buy');
      $('sellBtn').onclick = () => setSide('sell');
      $('amount').oninput = updateTotal;
      $('price').oninput = updateTotal;
      $('place').onclick = placeOrder;
    }
    function setSide(s) {
      side = s;
      $('buyBtn').className = 'btn btn-sm ' + (s === 'buy' ? 'btn-primary' : 'btn-soft');
      $('sellBtn').className = 'btn btn-sm ' + (s === 'sell' ? 'btn-danger' : 'btn-soft');
      $('place').className = 'btn btn-block ' + (s === 'buy' ? 'btn-primary' : 'btn-danger');
      $('place').textContent = (s === 'buy' ? 'Buy ' : 'Sell ') + symbol.split('-')[0];
    }
    function currentPrice() { return parseFloat($('price').value) || market.last().close; }
    function updateTotal() {
      const amt = parseFloat($('amount').value) || 0;
      $('total').value = (amt * currentPrice()).toFixed(2);
    }
    function placeOrder() {
      const amt = parseFloat($('amount').value);
      if (!amt || amt <= 0) { $('amount').classList.add('is-invalid'); return; }
      $('amount').classList.remove('is-invalid');
      const px = currentPrice();
      const tr = document.createElement('div');
      tr.className = 'tr';
      tr.innerHTML = `<span class="badge ${side === 'buy' ? 'badge-success' : 'badge-danger'} badge-pill">${side.toUpperCase()}</span>` +
        `<span>${amt.toFixed(4)} @ ${fmtP(px)}</span><span style="text-align:right">${fmtP(amt * px)}</span>`;
      $('blotter').prepend(tr);
      $('amount').value = ''; $('total').value = '';
    }

    // ---- Symbol switch ----
    function loadSymbol(sym) {
      symbol = sym;
      const cfg = SYMBOLS[sym];
      market = M.createMarket({ n: COUNT, start: cfg.start, vol: cfg.vol, intervalMs: cfg.intervalMs, max: 240, book: { levels: 11 } });
      $('symbolName').textContent = sym;
      $('price').value = market.last().close.toFixed(2);
      buildCharts(); renderBook(); refreshHeader(); updateTotal();
    }

    // ---- Init ----
    Object.keys(SYMBOLS).forEach((s) => { const o = document.createElement('option'); o.value = s; o.textContent = s; $('symbol').appendChild(o); });
    $('symbol').onchange = (e) => loadSymbol(e.target.value);
    bindForm(); setSide('buy');
    loadSymbol(symbol);
    buildWatchlist();

    // ---- Live loop ----
    setInterval(() => {
      market.tick();
      refreshCharts(); renderBook(); refreshHeader();
      $('price').value = market.last().close.toFixed(2); updateTotal();
    }, 1200);
    setInterval(refreshWatchlist, 900);
  }
  boot();
})();
