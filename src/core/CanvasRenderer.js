// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/core/CanvasRenderer.js
// Default renderer. Optimized for big data: typed-array fast paths draw a whole
// series in a single Canvas path. Handles devicePixelRatio for crisp output.
import { Renderer } from './Renderer.js';
import { getDPR, sizeCanvas } from '../utils/dpr.js';

export class CanvasRenderer extends Renderer {
  constructor(container, size) {
    super(container, size);
    this.type = 'canvas';
    this.dpr = getDPR();
    this.canvas = document.createElement('canvas');
    this.canvas.style.display = 'block';
    this.ctx = /** @type {CanvasRenderingContext2D} */ (this.canvas.getContext('2d'));
  }

  mount() {
    this.container.appendChild(this.canvas);
    this.resize(this.width, this.height);
    return this;
  }

  resize(w, h) {
    this.width = w; this.height = h;
    this.dpr = getDPR();
    sizeCanvas(this.canvas, w, h, this.dpr);
  }

  beginFrame() {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
  }

  // Live mode: keep existing pixels, only set up the transform.
  beginIncremental() {
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  endFrame() { /* canvas draws immediately */ }

  clear() { this.beginFrame(); }

  _apply(style) {
    const ctx = this.ctx;
    ctx.globalAlpha = style.opacity != null ? style.opacity : 1;
    if (style.dash) ctx.setLineDash(style.dash); else ctx.setLineDash([]);
    ctx.lineWidth = style.width != null ? style.width : 1;
  }

  rect(x, y, w, h, style = {}) {
    const ctx = this.ctx;
    this._apply(style);
    const r = style.radius || 0;
    if (r > 0) {
      const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
      ctx.beginPath();
      ctx.moveTo(x + rr, y);
      ctx.arcTo(x + w, y, x + w, y + h, rr);
      ctx.arcTo(x + w, y + h, x, y + h, rr);
      ctx.arcTo(x, y + h, x, y, rr);
      ctx.arcTo(x, y, x + w, y, rr);
      ctx.closePath();
      if (style.fill) { ctx.fillStyle = style.fill; ctx.fill(); }
      if (style.stroke) { ctx.strokeStyle = style.stroke; ctx.stroke(); }
    } else {
      if (style.fill) { ctx.fillStyle = style.fill; ctx.fillRect(x, y, w, h); }
      if (style.stroke) { ctx.strokeStyle = style.stroke; ctx.strokeRect(x, y, w, h); }
    }
    ctx.globalAlpha = 1;
  }

  line(x1, y1, x2, y2, style = {}) {
    const ctx = this.ctx;
    this._apply(style);
    ctx.strokeStyle = style.stroke || '#000';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  polyline(pts, style = {}) {
    if (pts.length < 4) return;
    const ctx = this.ctx;
    this._apply(style);
    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    if (style.closed) ctx.closePath();
    if (style.fill) { ctx.fillStyle = style.fill; ctx.fill(); }
    if (style.stroke) { ctx.strokeStyle = style.stroke; ctx.lineJoin = 'round'; ctx.stroke(); }
    ctx.globalAlpha = 1;
  }

  // FAST PATH: whole series as one path. xs/ys are typed arrays; sx/sy are scale fns.
  polylineTyped(xs, ys, count, sx, sy, style = {}) {
    if (count < 2) return;
    const ctx = this.ctx;
    this._apply(style);
    ctx.beginPath();
    ctx.moveTo(sx(xs[0]), sy(ys[0]));
    for (let i = 1; i < count; i++) ctx.lineTo(sx(xs[i]), sy(ys[i]));
    if (style.fillTo != null) {
      ctx.lineTo(sx(xs[count - 1]), style.fillTo);
      ctx.lineTo(sx(xs[0]), style.fillTo);
      ctx.closePath();
      if (style.fill) { ctx.fillStyle = style.fill; ctx.fill(); }
      // re-stroke the top edge only
      ctx.beginPath();
      ctx.moveTo(sx(xs[0]), sy(ys[0]));
      for (let i = 1; i < count; i++) ctx.lineTo(sx(xs[i]), sy(ys[i]));
    }
    if (style.stroke) { ctx.strokeStyle = style.stroke; ctx.lineJoin = 'round'; ctx.stroke(); }
    ctx.globalAlpha = 1;
  }

  pointsTyped(xs, ys, count, sx, sy, r, style = {}) {
    const ctx = this.ctx;
    this._apply(style);
    ctx.fillStyle = style.fill || '#000';
    const rr = r || 2;
    // For many points, filled rects are far cheaper than arcs.
    if (count > 2000 || rr <= 2) {
      const d = rr * 2;
      for (let i = 0; i < count; i++) ctx.fillRect(sx(xs[i]) - rr, sy(ys[i]) - rr, d, d);
    } else {
      for (let i = 0; i < count; i++) {
        ctx.beginPath();
        ctx.arc(sx(xs[i]), sy(ys[i]), rr, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  circle(cx, cy, r, style = {}) {
    const ctx = this.ctx;
    this._apply(style);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    if (style.fill) { ctx.fillStyle = style.fill; ctx.fill(); }
    if (style.stroke) { ctx.strokeStyle = style.stroke; ctx.stroke(); }
    ctx.globalAlpha = 1;
  }

  arcSlice(cx, cy, rIn, rOut, a0, a1, style = {}) {
    const ctx = this.ctx;
    this._apply(style);
    ctx.beginPath();
    ctx.arc(cx, cy, rOut, a0, a1, false);
    if (rIn > 0) ctx.arc(cx, cy, rIn, a1, a0, true);
    else ctx.lineTo(cx, cy);
    ctx.closePath();
    if (style.fill) { ctx.fillStyle = style.fill; ctx.fill(); }
    if (style.stroke) { ctx.strokeStyle = style.stroke; ctx.lineWidth = style.width || 1; ctx.stroke(); }
    ctx.globalAlpha = 1;
  }

  // Tiny path command interpreter: ['M',x,y]['L',x,y]['Q',cx,cy,x,y]['C',..]['Z']
  pathCmds(cmds, style = {}) {
    const ctx = this.ctx;
    this._apply(style);
    ctx.beginPath();
    for (const c of cmds) {
      const t = c[0];
      if (t === 'M') ctx.moveTo(c[1], c[2]);
      else if (t === 'L') ctx.lineTo(c[1], c[2]);
      else if (t === 'Q') ctx.quadraticCurveTo(c[1], c[2], c[3], c[4]);
      else if (t === 'C') ctx.bezierCurveTo(c[1], c[2], c[3], c[4], c[5], c[6]);
      else if (t === 'Z') ctx.closePath();
    }
    if (style.fill) { ctx.fillStyle = style.fill; ctx.fill(); }
    if (style.stroke) { ctx.strokeStyle = style.stroke; ctx.lineJoin = 'round'; ctx.stroke(); }
    ctx.globalAlpha = 1;
  }

  text(x, y, str, style = {}) {
    const ctx = this.ctx;
    ctx.globalAlpha = style.opacity != null ? style.opacity : 1;
    ctx.fillStyle = style.fill || '#000';
    ctx.font = `${style.weight ? style.weight + ' ' : ''}${style.size || 12}px ${style.family || 'sans-serif'}`;
    ctx.textAlign = style.align || 'start';
    ctx.textBaseline = style.baseline || 'alphabetic';
    if (style.rotate) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(style.rotate);
      ctx.fillText(str, 0, 0);
      ctx.restore();
    } else {
      ctx.fillText(str, x, y);
    }
    ctx.globalAlpha = 1;
  }

  measureText(str, style = {}) {
    this.ctx.font = `${style.size || 12}px ${style.family || 'sans-serif'}`;
    return this.ctx.measureText(str).width;
  }

  toDataURL(type = 'image/png') { return this.canvas.toDataURL(type); }

  destroy() {
    if (this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
  }
}
