// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/marks/core/PointMark.js
// modes: 'scatter' | 'bubble'. Bubble radius via sqrt scale on a size accessor.
// Big-data aware: uses the renderer typed fast path for huge scatter clouds.
import { Mark } from '../Mark.js';
import { sqrtScale } from '../../scales/sqrt.js';
import { extentTyped } from '../../utils/math.js';

export class PointMark extends Mark {
  domains(series, opts) {
    let xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity;
    for (const s of series) {
      const [a, b] = extentTyped(s.xs, s.count); const [c, d] = extentTyped(s.ys, s.count);
      if (a < xmin) xmin = a; if (b > xmax) xmax = b; if (c < ymin) ymin = c; if (d > ymax) ymax = d;
    }
    const px = (xmax - xmin) * 0.05 || 1; const py = (ymax - ymin) * 0.05 || 1;
    return { x: { type: opts.xScale || 'linear', domain: [xmin - px, xmax + px] }, y: { domain: [ymin - py, ymax + py] } };
  }

  draw(ctx) {
    const { r, sx, sy, series, opts } = ctx;
    const mode = opts.mode || 'scatter';
    let drawn = 0;
    series.forEach((s, si) => {
      if (s.visible === false) return;
      const color = s.color || ctx.color.byIndex(si);
      if (mode === 'bubble' && s.sizes) {
        const [smin, smax] = extentTyped(s.sizes, s.count);
        const rscale = sqrtScale([smin, smax], [opts.minRadius || 4, opts.maxRadius || 28]);
        for (let i = 0; i < s.count; i++) {
          const px = sx(s.xs[i]), py = sy(s.ys[i]);
          r.circle(px, py, rscale(s.sizes[i]), { fill: color, opacity: 0.6, stroke: color });
          ctx.hits.push({ x: px, y: py, seriesIndex: si, index: i, label: s.label, value: s.ys[i], color });
        }
        drawn += s.count;
      } else {
        const rad = opts.pointRadius || 3;
        // Fast path for large clouds.
        r.pointsTyped(s.xs, s.ys, s.count, sx, sy, rad, { fill: color, opacity: s.count > 5000 ? 0.5 : 0.8 });
        drawn += s.count;
        if (s.count <= 4000) for (let i = 0; i < s.count; i++) ctx.hits.push({ x: sx(s.xs[i]), y: sy(s.ys[i]), seriesIndex: si, index: i, label: s.label, value: s.ys[i], color });
      }
    });
    ctx.stats = { drawn };
  }

  legendItems(series, ctx) {
    if (series.length <= 1) return null;
    return series.map((s, i) => ({ label: s.label || `Series ${i + 1}`, color: s.color || ctx.color.byIndex(i) }));
  }
}
