// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/marks/core/BarMark.js
// modes: 'vertical'(column) | 'horizontal' | 'grouped' | 'stacked' | 'waterfall'.
import { Mark } from "../Mark.js";

export class BarMark extends Mark {
  domains(series, opts) {
    const cats = series[0].categories || series[0].xs;
    const mode = opts.mode || "vertical";
    let ymin = 0,
      ymax = -Infinity;
    if (mode === "stacked") {
      const n = series[0].count;
      for (let i = 0; i < n; i++) {
        let pos = 0,
          neg = 0;
        for (const s of series) {
          const v = s.ys[i];
          if (v >= 0) pos += v;
          else neg += v;
        }
        if (pos > ymax) ymax = pos;
        if (neg < ymin) ymin = neg;
      }
    } else if (mode === "waterfall") {
      let acc = 0;
      const s = series[0];
      for (let i = 0; i < s.count; i++) {
        acc += s.ys[i];
        if (acc > ymax) ymax = acc;
        if (acc < ymin) ymin = acc;
      }
    } else {
      for (const s of series)
        for (let i = 0; i < s.count; i++) {
          const v = s.ys[i];
          if (v > ymax) ymax = v;
          if (v < ymin) ymin = v;
        }
    }
    if (ymax < 0) ymax = 0;
    const values = (series[0].categories || []).map((c) => c);
    return { x: { type: "band", values }, y: { domain: [ymin, ymax * 1.05] } };
  }

  draw(ctx) {
    const { r, sx, sy, series, opts, area, theme } = ctx;
    const mode = opts.mode || "vertical";
    const cats = series[0].categories || [];
    const band = sx.bandwidth;
    const y0 = sy(0);
    const radius = opts.radius != null ? opts.radius : theme.spacing.radius;
    let drawn = 0;

    if (mode === "stacked") {
      const n = series[0].count;
      for (let i = 0; i < n; i++) {
        const bx = sx(cats[i]);
        let pos = 0,
          neg = 0;
        series.forEach((s, si) => {
          if (s.visible === false) return;
          const v = s.ys[i];
          const base = v >= 0 ? pos : neg;
          const top = base + v;
          const yTop = sy(Math.max(base, top));
          const yBot = sy(Math.min(base, top));
          const color = s.color || ctx.color.byIndex(si);
          r.rect(bx, yTop, band, yBot - yTop, { fill: color });
          drawn++;
          ctx.hits.push({
            x: bx + band / 2,
            y: yTop,
            seriesIndex: si,
            index: i,
            label: s.label,
            value: v,
            color,
          });
          if (v >= 0) pos = top;
          else neg = top;
        });
      }
    } else if (mode === "waterfall") {
      const s = series[0];
      let acc = 0;
      for (let i = 0; i < s.count; i++) {
        const v = s.ys[i];
        const start = acc;
        const end = acc + v;
        const bx = sx(cats[i]);
        const yTop = sy(Math.max(start, end));
        const yBot = sy(Math.min(start, end));
        const color =
          v >= 0 ? theme.semantic.positive : theme.semantic.negative;
        r.rect(bx, yTop, band, Math.max(1, yBot - yTop), {
          fill: color,
          radius,
        });
        drawn++;
        ctx.hits.push({
          x: bx + band / 2,
          y: yTop,
          seriesIndex: 0,
          index: i,
          label: cats[i],
          value: v,
          color,
        });
        acc = end;
      }
    } else if (mode === "horizontal") {
      // Chart provides sx = linear(value) horizontal, sy = band(categories) vertical.
      const n = series[0].count;
      const groups = series.filter((s) => s.visible !== false);
      const each = sy.bandwidth / Math.max(1, groups.length);
      const x0 = sx(0);
      series.forEach((s, si) => {
        if (s.visible === false) return;
        const gi = groups.indexOf(s);
        const color = s.color || ctx.color.byIndex(si);
        for (let i = 0; i < n; i++) {
          const by = sy(cats[i]) + gi * each;
          const v = s.ys[i];
          const xv = sx(v);
          const left = Math.min(x0, xv);
          r.rect(left, by, Math.abs(xv - x0), each * 0.85, {
            fill: color,
            radius,
          });
          drawn++;
          ctx.hits.push({
            x: xv,
            y: by + each / 2,
            seriesIndex: si,
            index: i,
            label: s.label,
            value: v,
            color,
          });
        }
      });
    } else {
      // vertical / grouped
      const groups = series.filter((s) => s.visible !== false);
      const each =
        mode === "grouped" && groups.length > 1 ? band / groups.length : band;
      const n = series[0].count;
      series.forEach((s, si) => {
        if (s.visible === false) return;
        const color = s.color || ctx.color.byIndex(si);
        const gi = groups.indexOf(s);
        for (let i = 0; i < n; i++) {
          const bx = sx(cats[i]) + (mode === "grouped" ? gi * each : 0);
          const v = s.ys[i];
          const yTop = sy(Math.max(0, v));
          const h = Math.abs(sy(v) - y0);
          r.rect(
            bx,
            yTop,
            each * (mode === "grouped" ? 0.9 : 1),
            Math.max(1, h),
            { fill: color, radius },
          );
          drawn++;
          ctx.hits.push({
            x: bx + each / 2,
            y: yTop,
            seriesIndex: si,
            index: i,
            label: s.label,
            value: v,
            color,
          });
        }
      });
    }
    ctx.stats = { drawn };
  }

  legendItems(series, ctx) {
    if (
      series.length <= 1 &&
      (this.options.mode || "vertical") !== "grouped" &&
      this.options.mode !== "stacked"
    )
      return null;
    return series.map((s, i) => ({
      label: s.label || `Series ${i + 1}`,
      color: s.color || ctx.color.byIndex(i),
    }));
  }
}
