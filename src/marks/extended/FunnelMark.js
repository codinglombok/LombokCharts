// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/marks/extended/FunnelMark.js — funnel; rawData = [{label, value}] descending.
import { Mark } from "../Mark.js";
export class FunnelMark extends Mark {
  coordinate() {
    return "none";
  }
  draw(ctx) {
    const { r, area, theme } = ctx;
    const data = ctx.rawData || [];
    const vk = (this.options || {}).value || "value",
      lk = (this.options || {}).label || "label";
    const max = Math.max(...data.map((d) => +d[vk])) || 1;
    const h = area.height / data.length;
    const cx = area.x + area.width / 2;
    let prevHalf = (data.length ? +data[0][vk] / max : 1) * (area.width / 2);
    data.forEach((d, i) => {
      const w0 = (+d[vk] / max) * (area.width / 2);
      const next =
        i < data.length - 1
          ? (+data[i + 1][vk] / max) * (area.width / 2)
          : w0 * 0.85;
      const y0 = area.y + i * h,
        y1 = y0 + h * 0.92;
      const color = ctx.color.byIndex(i);
      r.pathCmds(
        [
          ["M", cx - w0, y0],
          ["L", cx + w0, y0],
          ["L", cx + next, y1],
          ["L", cx - next, y1],
          ["Z"],
        ],
        { fill: color },
      );
      r.text(cx, (y0 + y1) / 2, `${d[lk]}: ${d[vk]}`, {
        fill: "#fff",
        size: theme.typography.labelSize,
        align: "center",
        baseline: "middle",
        family: theme.typography.family,
      });
      ctx.hits.push({
        x: cx,
        y: (y0 + y1) / 2,
        seriesIndex: 0,
        index: i,
        label: d[lk],
        value: +d[vk],
        color,
      });
    });
    ctx.stats = { drawn: data.length };
  }
}
