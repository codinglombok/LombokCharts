// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/marks/extended/RadarMark.js — spider/radar. Multi-series polygons over shared axes.
import { Mark } from "../Mark.js";
import { polarToCartesian } from "../../scales/radial.js";
import { extentTyped } from "../../utils/math.js";

export class RadarMark extends Mark {
  coordinate() {
    return "none";
  }
  draw(ctx) {
    const { r, area, series, theme, opts } = ctx;
    const cx = area.x + area.width / 2,
      cy = area.y + area.height / 2;
    const maxR = Math.min(area.width, area.height) / 2 - 20;
    const axes = series[0].categories || series[0].ys.map((_, i) => "A" + i);
    const n = axes.length;
    let max = -Infinity;
    for (const s of series) {
      const [, b] = extentTyped(s.ys, s.count);
      if (b > max) max = b;
    }
    max = opts.max || max || 1;
    const ang = (i) => -Math.PI / 2 + (i / n) * Math.PI * 2;

    // grid rings + spokes
    const rings = opts.rings || 4;
    for (let g = 1; g <= rings; g++) {
      const rr = (maxR * g) / rings;
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const p = polarToCartesian(cx, cy, rr, ang(i % n));
        pts.push(p.x, p.y);
      }
      r.polyline(pts, { stroke: theme.colors.grid, width: 1 });
    }
    for (let i = 0; i < n; i++) {
      const p = polarToCartesian(cx, cy, maxR, ang(i));
      r.line(cx, cy, p.x, p.y, { stroke: theme.colors.grid, width: 1 });
      const lp = polarToCartesian(cx, cy, maxR + 12, ang(i));
      r.text(lp.x, lp.y, axes[i], {
        fill: theme.colors.muted,
        size: theme.typography.axisSize,
        align: "center",
        baseline: "middle",
        family: theme.typography.family,
      });
    }

    series.forEach((s, si) => {
      if (s.visible === false) return;
      const color = s.color || ctx.color.byIndex(si);
      const pts = [];
      for (let i = 0; i < n; i++) {
        const rr = (s.ys[i] / max) * maxR;
        const p = polarToCartesian(cx, cy, rr, ang(i));
        pts.push(p.x, p.y);
        ctx.hits.push({
          x: p.x,
          y: p.y,
          seriesIndex: si,
          index: i,
          label: axes[i],
          value: s.ys[i],
          color,
        });
      }
      r.polyline(pts, {
        fill: hexA(color, 0.18),
        stroke: color,
        width: 2,
        closed: true,
      });
    });
    ctx.stats = { drawn: series.length };
  }
  legendItems(series, ctx) {
    return series.length > 1
      ? series.map((s, i) => ({
          label: s.label || "Series " + (i + 1),
          color: s.color || ctx.color.byIndex(i),
        }))
      : null;
  }
}
function hexA(hex, a) {
  const h = hex.replace("#", "");
  const f =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = parseInt(f, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
