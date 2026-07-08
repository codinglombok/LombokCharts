// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/marks/extended/HistogramMark.js — bins numeric values; cartesian (linear x & y).
import { Mark } from '../Mark.js';

export class HistogramMark extends Mark {
  _bins(ctx) {
    const data = ctx.rawData || [];
    const vk = (this.options || {}).value || 'value';
    const vals = data.map((d) => +d[vk]).filter((v) => !Number.isNaN(v));
    const min = Math.min(...vals), max = Math.max(...vals);
    const k = this.options.bins || Math.ceil(Math.sqrt(vals.length)) || 1;
    const w = (max - min) / k || 1;
    const counts = new Array(k).fill(0);
    for (const v of vals) { let i = Math.floor((v - min) / w); if (i >= k) i = k - 1; if (i < 0) i = 0; counts[i]++; }
    return { min, max, w, k, counts };
  }
  domains(series, opts, rawData) {
    const ctx = { rawData };
    const b = this._bins(ctx);
    return { x: { type: 'linear', domain: [b.min, b.max] }, y: { domain: [0, Math.max(...b.counts) * 1.05] } };
  }
  draw(ctx) {
    const { r, sx, sy, theme } = ctx;
    const b = this._bins(ctx);
    const color = this.options.color || ctx.color.byIndex(0);
    const y0 = sy(0);
    for (let i = 0; i < b.k; i++) {
      const x0 = sx(b.min + i * b.w), x1 = sx(b.min + (i + 1) * b.w);
      const h = y0 - sy(b.counts[i]);
      r.rect(x0 + 1, sy(b.counts[i]), Math.max(1, x1 - x0 - 2), Math.max(0, h), { fill: color, radius: 2 });
      ctx.hits.push({ x: (x0 + x1) / 2, y: sy(b.counts[i]), seriesIndex: 0, index: i, label: `${(b.min + i * b.w).toFixed(1)}–${(b.min + (i + 1) * b.w).toFixed(1)}`, value: b.counts[i], color });
    }
    ctx.stats = { drawn: b.k };
  }
}
