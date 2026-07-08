// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/core/Scene.js
// Lightweight cartesian frame: computes the plot area inside margins, draws grid,
// axes and tick labels from scales. Also exposes a dirty-rect tracker for the
// incremental/live path so we never repaint the whole canvas on every append.

/**
 * @typedef {Object} PlotArea
 * @property {number} x @property {number} y @property {number} width @property {number} height
 */

export class Scene {
  /** @param {import('../theme/tokens.js').Theme} theme */
  constructor(theme) {
    this.theme = theme;
    this._dirty = null; // {x,y,w,h} | 'all' | null
  }

  setTheme(theme) { this.theme = theme; }

  /** Compute the inner plot rectangle given total size and axis presence. */
  computePlotArea(width, height, margins) {
    const m = margins;
    return {
      x: m.left,
      y: m.top,
      width: Math.max(1, width - m.left - m.right),
      height: Math.max(1, height - m.top - m.bottom),
    };
  }

  markDirty(rect) {
    if (this._dirty === 'all') return;
    if (!rect) { this._dirty = 'all'; return; }
    if (!this._dirty) { this._dirty = { ...rect }; return; }
    const a = this._dirty;
    const x = Math.min(a.x, rect.x);
    const y = Math.min(a.y, rect.y);
    const r = Math.max(a.x + a.w, rect.x + rect.w);
    const b = Math.max(a.y + a.h, rect.y + rect.h);
    this._dirty = { x, y, w: r - x, h: b - y };
  }
  consumeDirty() { const d = this._dirty; this._dirty = null; return d; }

  /**
   * Draw grid + axes for a cartesian chart.
   * @param {import('./Renderer.js').Renderer} r
   * @param {PlotArea} area
   * @param {{x:any, y:any}} scales  scale functions (x may be band/linear/time)
   * @param {{showGrid?:boolean, xLabel?:string, yLabel?:string, yTickFormat?:Function, xTickFormat?:Function}} opts
   */
  drawAxes(r, area, scales, opts = {}) {
    const t = this.theme;
    const { x: sx, y: sy } = scales;
    const fontAxis = { size: t.typography.axisSize, family: t.typography.family, fill: t.colors.muted };
    const bottom = area.y + area.height;

    // Y grid + labels (handles linear/time/log OR band when y carries categories)
    if (sy && sy.ticks) {
      const yIsBand = sy.kind === 'band';
      const yticks = sy.ticks(6);
      for (const v of yticks) {
        const py = Math.round(yIsBand ? sy.center(v) : sy(v)) + 0.5;
        if (py < area.y - 1 || py > bottom + 1) continue;
        if (!yIsBand && opts.showGrid !== false) r.line(area.x, py, area.x + area.width, py, { stroke: t.colors.grid, width: 1 });
        const label = typeof v === 'number' ? (opts.yTickFormat ? opts.yTickFormat(v) : formatNumber(v)) : String(v);
        r.text(area.x - 6, py, label, { ...fontAxis, align: 'end', baseline: 'middle' });
      }
    }

    // X ticks + labels
    if (sx && sx.ticks) {
      const xticks = sx.ticks(8);
      const isBand = sx.kind === 'band';
      const maxLabels = Math.max(2, Math.floor(area.width / 60));
      const stride = Math.max(1, Math.ceil(xticks.length / maxLabels));
      xticks.forEach((v, i) => {
        if (i % stride !== 0 && i !== xticks.length - 1) return;
        const px = Math.round(isBand ? sx.center(v) : sx(v)) + 0.5;
        if (px < area.x - 1 || px > area.x + area.width + 1) return;
        if (!isBand && opts.showGrid === 'both') r.line(px, area.y, px, bottom, { stroke: t.colors.grid, width: 1 });
        r.line(px, bottom, px, bottom + t.spacing.tickLength, { stroke: t.colors.axis, width: 1 });
        const label = typeof v !== 'number' ? String(v) : (opts.xTickFormat ? opts.xTickFormat(v) : (sx.tickFormat ? sx.tickFormat(v) : formatNumber(v)));
        r.text(px, bottom + t.spacing.tickLength + 3, label, { ...fontAxis, align: 'center', baseline: 'top' });
      });
    }

    // Axis lines
    r.line(area.x, area.y, area.x, bottom, { stroke: t.colors.axis, width: 1 });
    r.line(area.x, bottom, area.x + area.width, bottom, { stroke: t.colors.axis, width: 1 });

    if (opts.yLabel) r.text(12, area.y + area.height / 2, opts.yLabel, { ...fontAxis, fill: t.colors.text, align: 'center', baseline: 'middle', rotate: -Math.PI / 2 });
    if (opts.xLabel) r.text(area.x + area.width / 2, bottom + 28, opts.xLabel, { ...fontAxis, fill: t.colors.text, align: 'center', baseline: 'top' });
  }
}

/** Compact numeric label (1.2k, 3.4M). */
export function formatNumber(v) {
  const abs = Math.abs(v);
  if (abs >= 1e9) return (v / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  if (abs >= 1e6) return (v / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (abs >= 1e3) return (v / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
  if (Number.isInteger(v)) return String(v);
  return v.toFixed(2).replace(/\.?0+$/, '');
}
