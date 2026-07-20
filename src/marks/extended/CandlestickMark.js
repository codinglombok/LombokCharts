// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/marks/extended/CandlestickMark.js — OHLC candlesticks; cartesian.
// rawData = [{ t|date|x, open, high, low, close }]. Also supports live appendData.
import { Mark } from "../Mark.js";

export class CandlestickMark extends Mark {
  _rows(ctx) {
    const data = ctx.rawData || [];
    const o = this.options || {};
    return data.map((d, i) => ({
      x:
        typeof d[o.x || "x"] === "number"
          ? d[o.x || "x"]
          : d.t != null
            ? +d.t
            : i,
      open: +d[o.open || "open"],
      high: +d[o.high || "high"],
      low: +d[o.low || "low"],
      close: +d[o.close || "close"],
    }));
  }
  domains(series, opts, rawData) {
    const rows = this._rows({ rawData });
    let lo = Infinity,
      hi = -Infinity,
      xmin = Infinity,
      xmax = -Infinity;
    for (const r of rows) {
      lo = Math.min(lo, r.low);
      hi = Math.max(hi, r.high);
      xmin = Math.min(xmin, r.x);
      xmax = Math.max(xmax, r.x);
    }
    const pad = (hi - lo) * 0.05 || 1;
    return {
      x: { type: opts.xScale || "linear", domain: [xmin, xmax] },
      y: { domain: [lo - pad, hi + pad] },
    };
  }
  draw(ctx) {
    const { r, sx, sy, theme } = ctx;
    const rows = this._rows(ctx);
    const up = theme.semantic.positive,
      down = theme.semantic.negative;
    const step = rows.length > 1 ? Math.abs(sx(rows[1].x) - sx(rows[0].x)) : 8;
    const cw = Math.max(1, Math.min(step * 0.7, 16));
    for (let i = 0; i < rows.length; i++) {
      const d = rows[i];
      const cx = sx(d.x);
      const color = d.close >= d.open ? up : down;
      r.line(cx, sy(d.high), cx, sy(d.low), { stroke: color, width: 1 });
      const yo = sy(d.open),
        yc = sy(d.close);
      r.rect(
        cx - cw / 2,
        Math.min(yo, yc),
        cw,
        Math.max(1, Math.abs(yc - yo)),
        { fill: color },
      );
      ctx.hits.push({
        x: cx,
        y: Math.min(yo, yc),
        seriesIndex: 0,
        index: i,
        label: "OHLC",
        value: d.close,
        color,
        extra: `O ${d.open} H ${d.high} L ${d.low} C ${d.close}`,
      });
    }
    ctx.stats = { drawn: rows.length };
  }
}
