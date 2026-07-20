// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/utils/dpr.js
// devicePixelRatio helpers for crisp Canvas rendering on HiDPI screens.

/** @returns {number} */
export function getDPR() {
  return typeof devicePixelRatio === "number" && devicePixelRatio > 0
    ? devicePixelRatio
    : 1;
}

/**
 * Size a canvas for a logical (CSS) width/height at the current DPR.
 * @param {HTMLCanvasElement} canvas
 * @param {number} cssW @param {number} cssH @param {number} dpr
 */
export function sizeCanvas(canvas, cssW, cssH, dpr) {
  canvas.width = Math.max(1, Math.round(cssW * dpr));
  canvas.height = Math.max(1, Math.round(cssH * dpr));
  canvas.style.width = cssW + "px";
  canvas.style.height = cssH + "px";
}
