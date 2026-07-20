// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/core/Renderer.js
// Abstract renderer contract. CanvasRenderer (perf) and SvgRenderer (sharp/exportable)
// implement the SAME drawing API so Marks stay renderer-agnostic.
//
// Drawing primitives (all coordinates already in pixel space):
//   rect, line, polyline, polylineTyped, circle, pointsTyped, arcSlice, pathCmds, text
// Frame lifecycle: beginFrame() / endFrame()
// A WebGL adapter would implement this same interface (see comment at file end).

/**
 * @typedef {Object} FillStroke
 * @property {string} [fill]
 * @property {string} [stroke]
 * @property {number} [width]
 * @property {number} [opacity]
 * @property {number[]} [dash]
 * @property {number} [radius]
 */

export class Renderer {
  /** @param {HTMLElement} container @param {{width:number,height:number}} size */
  constructor(container, size) {
    this.container = container;
    this.width = size.width;
    this.height = size.height;
    /** @type {'canvas'|'svg'|'webgl'} */
    this.type = "abstract";
  }

  /* eslint-disable no-unused-vars */
  mount() {
    throw new Error("Renderer.mount not implemented");
  }
  resize(w, h) {
    this.width = w;
    this.height = h;
  }
  beginFrame() {}
  endFrame() {}
  clear() {}
  rect(x, y, w, h, style) {}
  line(x1, y1, x2, y2, style) {}
  polyline(pts, style) {}
  polylineTyped(xs, ys, count, sx, sy, style) {}
  pointsTyped(xs, ys, count, sx, sy, r, style) {}
  circle(cx, cy, r, style) {}
  arcSlice(cx, cy, rIn, rOut, a0, a1, style) {}
  pathCmds(cmds, style) {}
  text(x, y, str, style) {}
  /** @returns {string|null} data URL (PNG) — Canvas only. */
  toDataURL() {
    return null;
  }
  /** @returns {string|null} serialized SVG markup — SVG only. */
  toSVGString() {
    return null;
  }
  destroy() {}
  /* eslint-enable no-unused-vars */
}

// --- WebGL adapter (architectural stub) -------------------------------------
// A WebGLRenderer would extend Renderer and:
//   * upload xs/ys typed arrays into a single VBO,
//   * use an instanced/point shader for pointsTyped,
//   * use gl.LINE_STRIP for polylineTyped,
//   * keep arcSlice/text on a 2D overlay canvas.
// It is intentionally not shipped as a no-op class so the registry never
// advertises a renderer that silently draws nothing.
