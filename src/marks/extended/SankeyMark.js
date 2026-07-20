// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/marks/extended/SankeyMark.js — layered Sankey. config.nodes + config.links.
import { Mark } from "../Mark.js";
export class SankeyMark extends Mark {
  coordinate() {
    return "none";
  }
  draw(ctx) {
    const { r, area, theme } = ctx;
    const o = this.options || {};
    const nodes = (o.nodes || []).map((n, i) => ({
      ...n,
      i,
      in: 0,
      out: 0,
      layer: 0,
    }));
    const links = (o.links || []).map((l) => ({ ...l }));
    const byId = new Map(nodes.map((n) => [n.id != null ? n.id : n.name, n]));
    // assign layers by longest path from sources
    links.forEach((l) => {
      const t = byId.get(l.target);
      if (t) t.layer = Math.max(t.layer, (byId.get(l.source)?.layer ?? 0) + 1);
    });
    const maxLayer = Math.max(0, ...nodes.map((n) => n.layer));
    nodes.forEach((n) => {
      n.out = links
        .filter((l) => l.source === (n.id ?? n.name))
        .reduce((s, l) => s + l.value, 0);
      n.in = links
        .filter((l) => l.target === (n.id ?? n.name))
        .reduce((s, l) => s + l.value, 0);
      n.total = Math.max(n.in, n.out);
    });
    const colW = 16;
    const layerX = (l) =>
      area.x + (area.width - colW) * (maxLayer === 0 ? 0 : l / maxLayer);
    const layers = [];
    nodes.forEach((n) => {
      (layers[n.layer] = layers[n.layer] || []).push(n);
    });
    const totalByLayer = layers.map((ns) =>
      ns.reduce((s, n) => s + n.total, 0),
    );
    const maxTotal = Math.max(...totalByLayer, 1);
    const scale = (area.height * 0.9) / maxTotal;
    layers.forEach((ns, li) => {
      let y = area.y;
      ns.forEach((n) => {
        n.x = layerX(li);
        n.y = y;
        n.h = n.total * scale;
        n.cursorOut = n.y;
        n.cursorIn = n.y;
        y += n.h + 12;
      });
    });
    // links
    links.forEach((l) => {
      const s = byId.get(l.source),
        t = byId.get(l.target);
      if (!s || !t) return;
      const sh = l.value * scale,
        th = l.value * scale;
      const sy0 = s.cursorOut;
      s.cursorOut += sh;
      const ty0 = t.cursorIn;
      t.cursorIn += th;
      const x0 = s.x + colW,
        x1 = t.x;
      const xm = (x0 + x1) / 2;
      const color = ctx.color.byIndex(s.i);
      r.pathCmds(
        [
          ["M", x0, sy0],
          ["C", xm, sy0, xm, ty0, x1, ty0],
          ["L", x1, ty0 + th],
          ["C", xm, ty0 + th, xm, sy0 + sh, x0, sy0 + sh],
          ["Z"],
        ],
        { fill: hexA(color, 0.35) },
      );
    });
    // nodes
    nodes.forEach((n) => {
      const color = ctx.color.byIndex(n.i);
      r.rect(n.x, n.y, colW, Math.max(1, n.h), { fill: color });
      r.text(
        n.x + (n.layer === maxLayer ? -4 : colW + 4),
        n.y + n.h / 2,
        n.name || String(n.id),
        {
          fill: theme.colors.text,
          size: theme.typography.labelSize,
          align: n.layer === maxLayer ? "end" : "start",
          baseline: "middle",
          family: theme.typography.family,
        },
      );
      ctx.hits.push({
        x: n.x + colW / 2,
        y: n.y + n.h / 2,
        seriesIndex: 0,
        index: n.i,
        label: n.name || n.id,
        value: n.total,
        color,
      });
    });
    ctx.stats = { drawn: nodes.length + links.length };
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
