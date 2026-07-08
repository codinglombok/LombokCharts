// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/core/SvgRenderer.js
// Vector renderer for crisp output and SVG export. Builds an SVG markup buffer
// per frame and commits it in one DOM write (fast for static/decimated data).
import { Renderer } from './Renderer.js';

const NS = 'http://www.w3.org/2000/svg';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export class SvgRenderer extends Renderer {
  constructor(container, size) {
    super(container, size);
    this.type = 'svg';
    this.svg = document.createElementNS(NS, 'svg');
    this.svg.style.display = 'block';
    /** @type {string[]} */
    this._buf = [];
  }

  mount() {
    this.container.appendChild(this.svg);
    this.resize(this.width, this.height);
    return this;
  }

  resize(w, h) {
    this.width = w; this.height = h;
    this.svg.setAttribute('width', String(w));
    this.svg.setAttribute('height', String(h));
    this.svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  }

  beginFrame() { this._buf = []; }
  beginIncremental() { /* SVG re-renders whole frame; kept for API parity */ this._buf = []; }
  endFrame() { this.svg.innerHTML = this._buf.join(''); }
  clear() { this._buf = []; this.svg.innerHTML = ''; }

  _common(style) {
    let s = '';
    if (style.fill) s += ` fill="${style.fill}"`; else s += ' fill="none"';
    if (style.stroke) s += ` stroke="${style.stroke}"`;
    if (style.width != null) s += ` stroke-width="${style.width}"`;
    if (style.opacity != null) s += ` opacity="${style.opacity}"`;
    if (style.dash) s += ` stroke-dasharray="${style.dash.join(',')}"`;
    return s;
  }

  rect(x, y, w, h, style = {}) {
    const r = style.radius ? ` rx="${style.radius}"` : '';
    this._buf.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}"${r}${this._common(style)}/>`);
  }

  line(x1, y1, x2, y2, style = {}) {
    this._buf.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${this._common({ ...style, fill: undefined })}/>`);
  }

  polyline(pts, style = {}) {
    let d = '';
    for (let i = 0; i < pts.length; i += 2) d += (i === 0 ? 'M' : 'L') + pts[i] + ' ' + pts[i + 1] + ' ';
    if (style.closed) d += 'Z';
    this._buf.push(`<path d="${d}"${this._common(style)}/>`);
  }

  polylineTyped(xs, ys, count, sx, sy, style = {}) {
    if (count < 2) return;
    let d = 'M' + sx(xs[0]) + ' ' + sy(ys[0]);
    for (let i = 1; i < count; i++) d += 'L' + sx(xs[i]) + ' ' + sy(ys[i]);
    if (style.fillTo != null && style.fill) {
      const area = d + 'L' + sx(xs[count - 1]) + ' ' + style.fillTo + 'L' + sx(xs[0]) + ' ' + style.fillTo + 'Z';
      this._buf.push(`<path d="${area}" fill="${style.fill}" stroke="none"/>`);
    }
    if (style.stroke) this._buf.push(`<path d="${d}" fill="none" stroke="${style.stroke}" stroke-width="${style.width || 1}" stroke-linejoin="round"/>`);
  }

  pointsTyped(xs, ys, count, sx, sy, r, style = {}) {
    const rr = r || 2;
    const fill = style.fill || '#000';
    // One <path> of tiny rects is far lighter than thousands of <circle> nodes.
    let d = '';
    for (let i = 0; i < count; i++) {
      const x = sx(xs[i]) - rr; const y = sy(ys[i]) - rr; const s = rr * 2;
      d += `M${x} ${y}h${s}v${s}h${-s}z`;
    }
    this._buf.push(`<path d="${d}" fill="${fill}" stroke="none"${style.opacity != null ? ` opacity="${style.opacity}"` : ''}/>`);
  }

  circle(cx, cy, r, style = {}) {
    this._buf.push(`<circle cx="${cx}" cy="${cy}" r="${r}"${this._common(style)}/>`);
  }

  arcSlice(cx, cy, rIn, rOut, a0, a1, style = {}) {
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const x0 = cx + rOut * Math.cos(a0), y0 = cy + rOut * Math.sin(a0);
    const x1 = cx + rOut * Math.cos(a1), y1 = cy + rOut * Math.sin(a1);
    let d;
    if (rIn > 0) {
      const xi0 = cx + rIn * Math.cos(a1), yi0 = cy + rIn * Math.sin(a1);
      const xi1 = cx + rIn * Math.cos(a0), yi1 = cy + rIn * Math.sin(a0);
      d = `M${x0} ${y0}A${rOut} ${rOut} 0 ${large} 1 ${x1} ${y1}L${xi0} ${yi0}A${rIn} ${rIn} 0 ${large} 0 ${xi1} ${yi1}Z`;
    } else {
      d = `M${cx} ${cy}L${x0} ${y0}A${rOut} ${rOut} 0 ${large} 1 ${x1} ${y1}Z`;
    }
    this._buf.push(`<path d="${d}"${this._common(style)}/>`);
  }

  pathCmds(cmds, style = {}) {
    let d = '';
    for (const c of cmds) {
      const t = c[0];
      if (t === 'M') d += `M${c[1]} ${c[2]}`;
      else if (t === 'L') d += `L${c[1]} ${c[2]}`;
      else if (t === 'Q') d += `Q${c[1]} ${c[2]} ${c[3]} ${c[4]}`;
      else if (t === 'C') d += `C${c[1]} ${c[2]} ${c[3]} ${c[4]} ${c[5]} ${c[6]}`;
      else if (t === 'Z') d += 'Z';
    }
    this._buf.push(`<path d="${d}"${this._common(style)}/>`);
  }

  text(x, y, str, style = {}) {
    const anchor = style.align === 'center' ? 'middle' : style.align === 'end' ? 'end' : 'start';
    const baseline = style.baseline === 'middle' ? 'central' : style.baseline === 'top' ? 'hanging' : 'auto';
    const rot = style.rotate ? ` transform="rotate(${(style.rotate * 180) / Math.PI} ${x} ${y})"` : '';
    this._buf.push(
      `<text x="${x}" y="${y}" fill="${style.fill || '#000'}" font-size="${style.size || 12}" ` +
      `font-family="${esc(style.family || 'sans-serif')}" text-anchor="${anchor}" ` +
      `dominant-baseline="${baseline}"${style.weight ? ` font-weight="${style.weight}"` : ''}${rot}>${esc(str)}</text>`
    );
  }

  // SVG text measurement without DOM layout: estimate ~0.55em advance.
  measureText(str, style = {}) { return String(str).length * (style.size || 12) * 0.55; }

  toSVGString() {
    return `<svg xmlns="${NS}" width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}">${this._buf.join('')}</svg>`;
  }

  destroy() { if (this.svg.parentNode) this.svg.parentNode.removeChild(this.svg); }
}
