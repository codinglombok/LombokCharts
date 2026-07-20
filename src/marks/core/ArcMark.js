// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/marks/core/ArcMark.js
// modes: 'pie' | 'donut' | 'gauge' | 'radial-bar'. Self-laid-out (polar), no axes.
import { Mark } from '../Mark.js';
import { polarToCartesian } from '../../scales/radial.js';
import { sum } from '../../utils/math.js';

export class ArcMark extends Mark {
  coordinate() { return 'none'; }

  draw(ctx) {
    const { r, area, opts, theme } = ctx;
    const mode = opts.mode || 'pie';
    const cx = area.x + area.width / 2;
    const cy = area.y + area.height / 2;
    const maxR = Math.min(area.width, area.height) / 2 - 8;
    const s = ctx.series[0];
    const vals = []; for (let i = 0; i < s.count; i++) vals.push(s.ys[i]);
    const labels = s.categories || vals.map((_, i) => String(i));
    let drawn = 0;

    if (mode === 'gauge') {
      const value = opts.value != null ? opts.value : vals[0];
      const min = opts.min != null ? opts.min : 0;
      const max = opts.max != null ? opts.max : 100;
      const a0 = Math.PI * 0.75, a1 = Math.PI * 2.25;
      const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
      const rIn = maxR * 0.62;
      r.arcSlice(cx, cy, rIn, maxR, a0, a1, { fill: theme.colors.grid });
      r.arcSlice(cx, cy, rIn, maxR, a0, a0 + (a1 - a0) * t, { fill: s.color || ctx.color.byIndex(0) });
      r.text(cx, cy, String(value), { fill: theme.colors.text, size: maxR * 0.4, align: 'center', baseline: 'middle', family: theme.typography.family, weight: 'bold' });
      ctx.hits.push({ x: cx, y: cy, seriesIndex: 0, index: 0, label: 'value', value, color: s.color || ctx.color.byIndex(0) });
      ctx.stats = { drawn: 2 };
      return;
    }

    if (mode === 'radial-bar') {
      const maxV = Math.max(...vals);
      const ring = (maxR * 0.75) / vals.length;
      vals.forEach((v, i) => {
        const rr = maxR - i * ring;
        const color = ctx.color.byIndex(i);
        r.arcSlice(cx, cy, rr - ring * 0.8, rr, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * v) / maxV, { fill: color });
        r.arcSlice(cx, cy, rr - ring * 0.8, rr, -Math.PI / 2, Math.PI * 1.5, { stroke: theme.colors.grid, width: 1 });
        const p = polarToCartesian(cx, cy, rr - ring * 0.4, -Math.PI / 2 + (Math.PI * 2 * v) / maxV);
        ctx.hits.push({ x: p.x, y: p.y, seriesIndex: 0, index: i, label: labels[i], value: v, color });
        drawn++;
      });
      ctx.stats = { drawn };
      return;
    }

    // pie / donut
    const total = sum(vals) || 1;
    const rIn = mode === 'donut' ? maxR * (opts.innerRatio || 0.55) : 0;
    let angle = -Math.PI / 2;
    const t = ctx.t != null ? ctx.t : 1;
    vals.forEach((v, i) => {
      const sweep = (v / total) * Math.PI * 2 * t;
      const color = s.color && Array.isArray(s.color) ? s.color[i] : ctx.color.byIndex(i);
      r.arcSlice(cx, cy, rIn, maxR, angle, angle + sweep, { fill: color, stroke: theme.colors.background, width: 2 });
      const mid = angle + sweep / 2;
      const lp = polarToCartesian(cx, cy, (rIn + maxR) / 2, mid);
      if (sweep > 0.35) r.text(lp.x, lp.y, Math.round((v / total) * 100) + '%', { fill: contrastColor(color), size: theme.typography.labelSize, align: 'center', baseline: 'middle', family: theme.typography.family, weight: 'bold' });
      ctx.hits.push({ x: lp.x, y: lp.y, seriesIndex: 0, index: i, label: labels[i], value: v, color });
      angle += sweep;
      drawn++;
    });
    if (mode === 'donut' && opts.centerLabel) {
      r.text(cx, cy, opts.centerLabel, { fill: theme.colors.text, size: 18, align: 'center', baseline: 'middle', family: theme.typography.family, weight: 'bold' });
    }
    ctx.stats = { drawn };
  }

  legendItems(series, ctx) {
    const s = series[0];
    const labels = s.categories || [];
    return labels.map((l, i) => ({ label: l, color: ctx.color.byIndex(i) }));
  }
}

// Pick a readable text color (black/white) for a hex slice fill by luminance.
function contrastColor(c) {
  if (typeof c !== 'string' || c[0] !== '#') return '#fff';
  let h = c.slice(1);
  if (h.length === 3) h = h.split('').map((x) => x + x).join('');
  const n = parseInt(h, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? '#111' : '#fff';
}
