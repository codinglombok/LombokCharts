// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/marks/core/AreaMark.js
// modes: 'area' | 'stacked' | 'streamgraph'. Decimation-aware via fast path.
import { Mark } from "../Mark.js";
import { lttb } from "../../data/decimate.js";
import { extentTyped } from "../../utils/math.js";

export class AreaMark extends Mark {
  domains(series, opts) {
    const mode = opts.mode || "area";
    let xmin = Infinity,
      xmax = -Infinity,
      ymin = Infinity,
      ymax = -Infinity;
    let categorical = series[0].categories;
    if (mode === "stacked" || mode === "streamgraph") {
      const n = series[0].count;
      for (let i = 0; i < n; i++) {
        let tot = 0;
        for (const s of series) tot += s.ys[i];
        if (tot > ymax) ymax = tot;
      }
      ymin = mode === "streamgraph" ? -ymax / 2 : 0;
      const [a, b] = extentTyped(series[0].xs, series[0].count);
      xmin = a;
      xmax = b;
    } else {
      for (const s of series) {
        const [a, b] = extentTyped(s.xs, s.count);
        const [c, d] = extentTyped(s.ys, s.count);
        if (a < xmin) xmin = a;
        if (b > xmax) xmax = b;
        if (c < ymin) ymin = c;
        if (d > ymax) ymax = d;
      }
      ymin = Math.min(0, ymin);
    }
    return {
      x: categorical
        ? { type: "band", values: categorical }
        : { type: opts.xScale || "linear", domain: [xmin, xmax] },
      y: { domain: [ymin, ymax * 1.05] },
    };
  }

  draw(ctx) {
    const { r, sx, sy, series, opts, area } = ctx;
    const mode = opts.mode || "area";
    let drawn = 0;
    const xPix = (v, i) =>
      sx.kind === "band" ? sx.center(series[0].categories[i]) : sx(v);

    if (mode === "stacked" || mode === "streamgraph") {
      const n = series[0].count;
      const baseArr = new Float64Array(n);
      if (mode === "streamgraph")
        for (let i = 0; i < n; i++) {
          let t = 0;
          for (const s of series) t += s.ys[i];
          baseArr[i] = -t / 2;
        }
      const visible = series.filter((s) => s.visible !== false);
      visible.forEach((s, si) => {
        const top = [];
        const bottom = [];
        for (let i = 0; i < n; i++) {
          const px = xPix(s.xs[i], i);
          const b = baseArr[i];
          const t = b + s.ys[i];
          top.push(px, sy(t));
          bottom.unshift(px, sy(b));
          baseArr[i] = t;
        }
        const color = s.color || ctx.color.byIndex(series.indexOf(s));
        r.polyline(top.concat(bottom), {
          fill: color,
          opacity: 0.85,
          closed: true,
        });
        drawn += n;
        for (let i = 0; i < n; i++)
          ctx.hits.push({
            x: top[i * 2],
            y: top[i * 2 + 1],
            seriesIndex: series.indexOf(s),
            index: i,
            label: s.label,
            value: s.ys[i],
            color,
          });
      });
    } else {
      const y0 = sy(0);
      series.forEach((s, si) => {
        if (s.visible === false) return;
        let xs = s.xs,
          ys = s.ys,
          count = s.count;
        const target = Math.max(2, Math.floor(area.width * 2));
        if (opts.decimate !== false && count > target && sx.kind !== "band") {
          const d = lttb(xs, ys, count, target);
          xs = d.xs;
          ys = d.ys;
          count = d.count;
        }
        const color = s.color || ctx.color.byIndex(si);
        r.polylineTyped(
          xs,
          ys,
          count,
          (v) =>
            sx.kind === "band"
              ? sx.center(series[si].categories[Math.round(v)])
              : sx(v),
          sy,
          {
            stroke: color,
            width: opts.width || 2,
            fill: hexA(color, 0.25),
            fillTo: y0,
          },
        );
        drawn += count;
        if (count <= 2000)
          for (let i = 0; i < count; i++)
            ctx.hits.push({
              x: xPix(xs[i], i),
              y: sy(ys[i]),
              seriesIndex: si,
              index: i,
              label: s.label,
              value: ys[i],
              color,
            });
      });
    }
    ctx.stats = { drawn };
  }

  legendItems(series, ctx) {
    if (series.length <= 1) return null;
    return series.map((s, i) => ({
      label: s.label || `Series ${i + 1}`,
      color: s.color || ctx.color.byIndex(i),
    }));
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
