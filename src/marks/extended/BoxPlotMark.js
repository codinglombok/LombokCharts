// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/marks/extended/BoxPlotMark.js — box-and-whisker; cartesian band x, linear y.
// Reads config.groups = [{label, values:[]}] (preferred) or rawData grouped by key.
import { Mark } from '../Mark.js';
import { quantileSorted } from '../../utils/math.js';

export class BoxPlotMark extends Mark {
  _groups(ctx) {
    if (this.options.groups) return this.options.groups.map((g) => ({ label: g.label, values: [...g.values].sort((a, b) => a - b) }));
    const data = ctx.rawData || [];
    const gk = this.options.group || 'group', vk = this.options.value || 'value';
    const map = new Map();
    for (const d of data) { const k = String(d[gk]); if (!map.has(k)) map.set(k, []); map.get(k).push(+d[vk]); }
    return [...map.entries()].map(([label, values]) => ({ label, values: values.sort((a, b) => a - b) }));
  }
  domains(series, opts, rawData) {
    const groups = this._groups({ rawData });
    let min = Infinity, max = -Infinity;
    for (const g of groups) { min = Math.min(min, g.values[0]); max = Math.max(max, g.values[g.values.length - 1]); }
    const pad = (max - min) * 0.08 || 1;
    return { x: { type: 'band', values: groups.map((g) => g.label) }, y: { domain: [min - pad, max + pad] } };
  }
  draw(ctx) {
    const { r, sx, sy, theme } = ctx;
    const groups = this._groups(ctx);
    const bw = Math.min(sx.bandwidth, 60);
    groups.forEach((g, i) => {
      const v = g.values;
      const q1 = quantileSorted(v, 0.25), q2 = quantileSorted(v, 0.5), q3 = quantileSorted(v, 0.75);
      const iqr = q3 - q1;
      const lo = Math.max(v[0], q1 - 1.5 * iqr), hi = Math.min(v[v.length - 1], q3 + 1.5 * iqr);
      const cx = sx.center(g.label);
      const color = this.options.color || ctx.color.byIndex(i);
      r.line(cx, sy(lo), cx, sy(hi), { stroke: color, width: 1 });
      r.line(cx - bw / 4, sy(hi), cx + bw / 4, sy(hi), { stroke: color, width: 1 });
      r.line(cx - bw / 4, sy(lo), cx + bw / 4, sy(lo), { stroke: color, width: 1 });
      r.rect(cx - bw / 2, sy(q3), bw, sy(q1) - sy(q3), { fill: hexA(color, 0.3), stroke: color, width: 1.5, radius: 2 });
      r.line(cx - bw / 2, sy(q2), cx + bw / 2, sy(q2), { stroke: color, width: 2 });
      for (const pt of v) if (pt < lo || pt > hi) r.circle(cx, sy(pt), 2, { fill: theme.semantic.negative });
      ctx.hits.push({ x: cx, y: sy(q2), seriesIndex: 0, index: i, label: g.label, value: q2, color, extra: `Q1 ${q1.toFixed(1)} · Q3 ${q3.toFixed(1)}` });
    });
    ctx.stats = { drawn: groups.length };
  }
}
function hexA(hex, a) { const h = hex.replace('#', ''); const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h; const n = parseInt(f, 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; }
