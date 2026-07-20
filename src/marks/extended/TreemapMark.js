// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/marks/extended/TreemapMark.js — squarified treemap; rawData = [{label, value}].
import { Mark } from '../Mark.js';
export class TreemapMark extends Mark {
  coordinate() { return 'none'; }
  draw(ctx) {
    const { r, area, theme } = ctx;
    const data = (ctx.rawData || []).slice();
    const vk = (this.options || {}).value || 'value', lk = (this.options || {}).label || 'label';
    const total = data.reduce((s, d) => s + +d[vk], 0) || 1;
    const items = data.map((d, i) => ({ label: d[lk], value: +d[vk], i })).sort((a, b) => b.value - a.value);
    const rects = squarify(items, total, { x: area.x, y: area.y, w: area.width, h: area.height });
    rects.forEach((rc) => {
      const color = ctx.color.byIndex(rc.i);
      r.rect(rc.x, rc.y, rc.w, rc.h, { fill: color, stroke: theme.colors.background, width: 1 });
      if (rc.w > 40 && rc.h > 18) r.text(rc.x + 4, rc.y + 13, `${rc.label}`, { fill: '#fff', size: theme.typography.labelSize, family: theme.typography.family });
      ctx.hits.push({ x: rc.x + rc.w / 2, y: rc.y + rc.h / 2, seriesIndex: 0, index: rc.i, label: rc.label, value: rc.value, color });
    });
    ctx.stats = { drawn: rects.length };
  }
}
// Squarified treemap layout (Bruls, Huizing, van Wijk 2000) — pure geometry.
function squarify(items, total, rect) {
  const out = [];
  let { x, y, w, h } = rect;
  const scale = (w * h) / total;
  let row = []; let i = 0;
  const worst = (r, len) => {
    if (r.length === 0) return Infinity;
    const s = r.reduce((a, b) => a + b.area, 0);
    const max = Math.max(...r.map((b) => b.area)), min = Math.min(...r.map((b) => b.area));
    return Math.max((len * len * max) / (s * s), (s * s) / (len * len * min));
  };
  const layoutRow = (r, horizontal) => {
    const s = r.reduce((a, b) => a + b.area, 0);
    if (horizontal) { const rh = s / w; let cx = x; for (const b of r) { const bw = b.area / rh; out.push({ x: cx, y, w: bw, h: rh, label: b.label, value: b.value, i: b.i }); cx += bw; } y += rh; h -= rh; }
    else { const rw = s / h; let cy = y; for (const b of r) { const bh = b.area / rw; out.push({ x, y: cy, w: rw, h: bh, label: b.label, value: b.value, i: b.i }); cy += bh; } x += rw; w -= rw; }
  };
  const boxes = items.map((it) => ({ ...it, area: it.value * scale }));
  while (i < boxes.length) {
    const horizontal = w >= h;
    const len = horizontal ? w : h;
    const next = boxes[i];
    if (row.length === 0 || worst([...row, next], len) <= worst(row, len)) { row.push(next); i++; }
    else { layoutRow(row, horizontal); row = []; }
  }
  if (row.length) layoutRow(row, w >= h);
  return out;
}
