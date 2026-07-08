// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// market-sim.js — zero-dependency synthetic market data for the Trading Dashboard.
// Works in the browser (window.MarketSim) and in Node (module.exports) for testing.
// Covers: GBM OHLC generation, streaming next-candle, synthetic order book,
// RSI / SMA / EMA indicators, and a multi-asset ticker with sparkline history.
(function (root) {
  'use strict';

  /** Standard normal via Box–Muller. @returns {number} */
  function randn() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /**
   * Generate OHLC candles via Geometric Brownian Motion.
   * @param {{n?:number,start?:number,drift?:number,vol?:number,intervalMs?:number,startTime?:number}} [opt]
   * @returns {Array<{t:number,open:number,high:number,low:number,close:number,volume:number}>}
   */
  function generateOHLC(opt) {
    opt = opt || {};
    const n = opt.n || 200;
    const drift = opt.drift != null ? opt.drift : 0.0002;
    const vol = opt.vol != null ? opt.vol : 0.02;
    const intervalMs = opt.intervalMs || 60000;
    let price = opt.start || 100;
    let t = opt.startTime || (Date.now() - n * intervalMs);
    const out = [];
    for (let i = 0; i < n; i++) {
      const c = stepCandle(price, drift, vol, t, intervalMs);
      out.push(c);
      price = c.close;
      t += intervalMs;
    }
    return out;
  }

  /** One GBM candle from an open price. */
  function stepCandle(open, drift, vol, t, intervalMs) {
    const ret = drift + vol * randn();
    const close = Math.max(0.01, open * (1 + ret));
    // Intrabar extremes: extend beyond open/close by a fraction of volatility.
    const wick = Math.abs(vol) * open * (0.4 + Math.random() * 0.9);
    const high = Math.max(open, close) + Math.random() * wick;
    const low = Math.min(open, close) - Math.random() * wick;
    const volume = Math.round((800 + Math.random() * 4200) * (1 + Math.abs(ret) * 40));
    return { t: t, open: open, high: high, low: low, close: close, volume: volume };
  }

  /**
   * Next streaming candle continuing from the previous one.
   * @param {{close:number,t:number}} prev
   * @param {{drift?:number,vol?:number,intervalMs?:number}} [opt]
   */
  function nextCandle(prev, opt) {
    opt = opt || {};
    const drift = opt.drift != null ? opt.drift : 0.0002;
    const vol = opt.vol != null ? opt.vol : 0.02;
    const intervalMs = opt.intervalMs || 60000;
    return stepCandle(prev.close, drift, vol, prev.t + intervalMs, intervalMs);
  }

  /**
   * Synthetic order book around a mid price.
   * @param {number} mid
   * @param {{levels?:number,spreadBps?:number,tick?:number}} [opt]
   * @returns {{bids:Array<{price:number,size:number,total:number}>,asks:Array<{price:number,size:number,total:number}>,spread:number}}
   */
  function orderBook(mid, opt) {
    opt = opt || {};
    const levels = opt.levels || 12;
    const spreadBps = opt.spreadBps || 4;           // half-spread in basis points
    const step = opt.tick || mid * 0.0005;
    const halfSpread = mid * (spreadBps / 10000);
    const bids = [], asks = [];
    let bTotal = 0, aTotal = 0;
    for (let i = 0; i < levels; i++) {
      const bSize = Math.round((0.5 + Math.random() * 3) * 1000) / 100;
      const aSize = Math.round((0.5 + Math.random() * 3) * 1000) / 100;
      bTotal += bSize; aTotal += aSize;
      bids.push({ price: mid - halfSpread - i * step, size: bSize, total: bTotal });
      asks.push({ price: mid + halfSpread + i * step, size: aSize, total: aTotal });
    }
    return { bids: bids, asks: asks, spread: (asks[0].price - bids[0].price) };
  }

  /** Simple moving average. @param {number[]} values @param {number} period */
  function sma(values, period) {
    const out = new Array(values.length).fill(null);
    let sum = 0;
    for (let i = 0; i < values.length; i++) {
      sum += values[i];
      if (i >= period) sum -= values[i - period];
      if (i >= period - 1) out[i] = sum / period;
    }
    return out;
  }

  /** Exponential moving average. */
  function ema(values, period) {
    const out = new Array(values.length).fill(null);
    const k = 2 / (period + 1);
    let prev;
    for (let i = 0; i < values.length; i++) {
      prev = i === 0 ? values[0] : values[i] * k + prev * (1 - k);
      out[i] = prev;
    }
    return out;
  }

  /**
   * Wilder's RSI. @param {number[]} closes @param {number} [period=14]
   * @returns {Array<number|null>} 0..100 (null until warmed up)
   */
  function rsi(closes, period) {
    period = period || 14;
    const out = new Array(closes.length).fill(null);
    if (closes.length <= period) return out;
    let gain = 0, loss = 0;
    for (let i = 1; i <= period; i++) {
      const d = closes[i] - closes[i - 1];
      if (d >= 0) gain += d; else loss -= d;
    }
    let avgG = gain / period, avgL = loss / period;
    out[period] = 100 - 100 / (1 + (avgL === 0 ? 100 : avgG / avgL));
    for (let i = period + 1; i < closes.length; i++) {
      const d = closes[i] - closes[i - 1];
      const g = d >= 0 ? d : 0, l = d < 0 ? -d : 0;
      avgG = (avgG * (period - 1) + g) / period;
      avgL = (avgL * (period - 1) + l) / period;
      out[i] = avgL === 0 ? 100 : 100 - 100 / (1 + avgG / avgL);
    }
    return out;
  }

  /**
   * Multi-asset ticker. Each asset random-walks and keeps a short sparkline history.
   * @param {Array<{symbol:string,price:number,vol?:number}>} defs
   */
  function createTicker(defs, sparkLen) {
    sparkLen = sparkLen || 40;
    const assets = defs.map(function (d) {
      const hist = [];
      for (let i = 0; i < sparkLen; i++) hist.push(d.price);
      return { symbol: d.symbol, price: d.price, open: d.price, vol: d.vol || 0.015, changePct: 0, spark: hist };
    });
    return {
      assets: assets,
      tick: function () {
        for (const a of assets) {
          a.price = Math.max(0.0001, a.price * (1 + (0.0001 + a.vol * randn())));
          a.changePct = ((a.price - a.open) / a.open) * 100;
          a.spark.push(a.price);
          if (a.spark.length > sparkLen) a.spark.shift();
        }
        return assets;
      },
    };
  }

  /**
   * Convenience: a whole market for one symbol — candles + book + indicators + a
   * `tick()` that advances one interval and returns the delta.
   */
  function createMarket(opt) {
    opt = opt || {};
    const params = { drift: opt.drift, vol: opt.vol, intervalMs: opt.intervalMs || 60000 };
    let candles = generateOHLC(Object.assign({ n: opt.n || 180, start: opt.start || 100 }, params));
    return {
      params: params,
      get candles() { return candles; },
      closes: function () { return candles.map(function (c) { return c.close; }); },
      book: function () { return orderBook(candles[candles.length - 1].close, opt.book); },
      rsi: function (p) { return rsi(candles.map(function (c) { return c.close; }), p); },
      last: function () { return candles[candles.length - 1]; },
      tick: function () {
        const c = nextCandle(candles[candles.length - 1], params);
        candles.push(c);
        if (candles.length > (opt.max || 600)) candles.shift();
        return c;
      },
    };
  }

  const api = {
    randn: randn,
    generateOHLC: generateOHLC,
    nextCandle: nextCandle,
    orderBook: orderBook,
    sma: sma, ema: ema, rsi: rsi,
    createTicker: createTicker,
    createMarket: createMarket,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MarketSim = api;
})(typeof self !== 'undefined' ? self : this);
