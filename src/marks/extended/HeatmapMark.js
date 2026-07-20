// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/marks/extended/HeatmapMark.js — matrix heatmap from rawData [{x,y,value}].
import { Mark } from "../Mark.js";
import { sequentialScale } from "../../scales/color.js";
import { bandScale } from "../../scales/band.js";

export class HeatmapMark extends Mark {
  coordinate() {
    return "none";
  }
  draw(ctx) {
    const { r, area, theme, opts } = ctx;
    const data = ctx.rawData || [];
    const xk = opts.x || "x",
      yk = opts.y || "y",
      vk = opts.value || "value";
    const cols = [...new Set(data.map((d) => String(d[xk])))];
    const rows = [...new Set(data.map((d) => String(d[yk])))];
    let vmin = Infinity,
      vmax = -Infinity;
    for (const d of data) {
      const v = +d[vk];
      if (v < vmin) vmin = v;
      if (v > vmax) vmax = v;
    }
    const pad = { l: 70, b: 28 };
    const gx = bandScale(cols, [area.x + pad.l, area.x + area.width], {
      padding: 0.04,
    });
    const gy = bandScale(rows, [area.y, area.y + area.height - pad.b], {
      padding: 0.04,
    });
    const cscale = sequentialScale(opts.colors || theme.sequential, [
      vmin,
      vmax,
    ]);

    for (const d of data) {
      const x = gx(String(d[xk])),
        y = gy(String(d[yk]));
      const v = +d[vk];
      r.rect(x, y, gx.bandwidth, gy.bandwidth, { fill: cscale(v), radius: 2 });
      ctx.hits.push({
        x: x + gx.bandwidth / 2,
        y: y + gy.bandwidth / 2,
        seriesIndex: 0,
        index: 0,
        label: `${d[yk]} · ${d[xk]}`,
        value: v,
        color: cscale(v),
      });
    }
    cols.forEach((c) =>
      r.text(gx.center(c), area.y + area.height - pad.b + 6, c, {
        fill: theme.colors.muted,
        size: theme.typography.axisSize,
        align: "center",
        baseline: "top",
        family: theme.typography.family,
      }),
    );
    rows.forEach((rw) =>
      r.text(area.x + pad.l - 6, gy.center(rw), rw, {
        fill: theme.colors.muted,
        size: theme.typography.axisSize,
        align: "end",
        baseline: "middle",
        family: theme.typography.family,
      }),
    );
    ctx.stats = { drawn: data.length };
  }
}
