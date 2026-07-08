// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/marks/core/LineMark.js
// modes: 'line' | 'step' | 'spline' | 'slope'. Multi-series. Big-data aware:
// applies LTTB decimation when a series exceeds the target width.
import { Mark } from '../Mark.js';
import { lttb } from '../../data/decimate.js';
import { extentTyped } from '../../utils/math.js';

export class LineMark extends Mark {
  domains(series, opts) {
    let xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity;
    let categorical = null;
    for (const s of series) {
      if (s.categories) categorical = s.categories;
      const [a, b] = extentTyped(s.xs, s.count);
      const [c, d] = extentTyped(s.ys, s.count);
      if (a < xmin) xmin = a; if (b > xmax) xmax = b;
      if (c < ymin) ymin = c; if (d > ymax) ymax = d;
    }
    const pad = (ymax - ymin) * 0.05 || 1;
    return {
      x: categorical ? { type: 'band', values: categorical } : { type: opts.xScale || 'linear', domain: [xmin, xmax] },
      y: { domain: [opts.baseline === 0 ? Math.min(0, ymin) : ymin - pad, ymax + pad] },
    };
  }

  draw(ctx) {
    const { r, sx, sy, series, opts, area } = ctx;
    const mode = opts.mode || 'line';
    let drawn = 0;
    const xPix = (sx.kind === 'band') ? (v, i) => sx.center(series[0].categories[i]) : (v) => sx(v);

    series.forEach((s, si) => {
      if (s.visible === false) return;
      let xs = s.xs, ys = s.ys, count = s.count;
      const target = Math.max(2, Math.floor(area.width * 2));
      let mapIdx = null;
      if (opts.decimate !== false && count > target && sx.kind !== 'band') {
        const dec = lttb(xs, ys, count, target);
        xs = dec.xs; ys = dec.ys; count = dec.count;
      }
      const color = s.color || ctx.color.byIndex(si);
      drawn += count;

      if (mode === 'spline') {
        const cmds = catmullRom(xs, ys, count, (v, i) => xPix(v, i), (v) => sy(v));
        r.pathCmds(cmds, { stroke: color, width: opts.width || 2 });
      } else if (mode === 'step') {
        const pts = [];
        for (let i = 0; i < count; i++) {
          const px = xPix(xs[i], i), py = sy(ys[i]);
          if (i > 0) pts.push(px, sy(ys[i - 1]));
          pts.push(px, py);
        }
        r.polyline(pts, { stroke: color, width: opts.width || 2 });
      } else {
        // 'line' and 'slope' both render as straight polylines (fast path).
        r.polylineTyped(xs, ys, count, (v) => (sx.kind === 'band' ? sx.center(series[si].categories[Math.round(v)]) : sx(v)), sy, { stroke: color, width: opts.width || 2 });
      }

      // markers + hit records only when the data is small enough to be useful
      if (count <= 2000) {
        for (let i = 0; i < count; i++) {
          const px = xPix(xs[i], i), py = sy(ys[i]);
          if (opts.points) r.circle(px, py, opts.pointRadius || 3, { fill: color });
          ctx.hits.push({ x: px, y: py, seriesIndex: si, index: i, label: s.label, value: ys[i], color });
        }
      }
    });
    ctx.stats = { drawn };
  }

  legendItems(series, ctx) {
    return series.map((s, i) => ({ label: s.label || `Series ${i + 1}`, color: s.color || ctx.color.byIndex(i) }));
  }
}

// Catmull-Rom -> cubic bezier path commands for smooth splines.
function catmullRom(xs, ys, n, fx, fy) {
  const cmds = [['M', fx(xs[0], 0), fy(ys[0])]];
  for (let i = 0; i < n - 1; i++) {
    const x0 = fx(xs[Math.max(0, i - 1)], Math.max(0, i - 1)), y0 = fy(ys[Math.max(0, i - 1)]);
    const x1 = fx(xs[i], i), y1 = fy(ys[i]);
    const x2 = fx(xs[i + 1], i + 1), y2 = fy(ys[i + 1]);
    const x3 = fx(xs[Math.min(n - 1, i + 2)], Math.min(n - 1, i + 2)), y3 = fy(ys[Math.min(n - 1, i + 2)]);
    cmds.push(['C', x1 + (x2 - x0) / 6, y1 + (y2 - y0) / 6, x2 - (x3 - x1) / 6, y2 - (y3 - y1) / 6, x2, y2]);
  }
  return cmds;
}
