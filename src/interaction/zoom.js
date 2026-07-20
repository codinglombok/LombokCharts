// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/interaction/zoom.js — wheel zoom + drag pan over the x-domain (and optional y).
// Emits new domain windows; the Chart re-renders with the clamped domain.
export class ZoomPan {
  /**
   * @param {HTMLElement} target overlay element receiving pointer events
   * @param {() => {x:[number,number], full:[number,number]}} getState
   * @param {(xDomain:[number,number]) => void} onChange
   */
  constructor(target, getState, onChange) {
    this.target = target;
    this.getState = getState;
    this.onChange = onChange;
    this._dragging = false;
    this._lastX = 0;
    this._bind();
  }
  _bind() {
    this._onWheel = (e) => {
      e.preventDefault();
      const { x, full } = this.getState();
      const rect = this.target.getBoundingClientRect();
      const frac = (e.clientX - rect.left) / rect.width;
      const span = x[1] - x[0];
      const factor = e.deltaY > 0 ? 1.15 : 1 / 1.15;
      const newSpan = Math.min(full[1] - full[0], span * factor);
      const center = x[0] + span * frac;
      let lo = center - newSpan * frac;
      let hi = center + newSpan * (1 - frac);
      [lo, hi] = this._clamp(lo, hi, full);
      this.onChange([lo, hi]);
    };
    this._onDown = (e) => { this._dragging = true; this._lastX = e.clientX; this.target.style.cursor = 'grabbing'; };
    this._onMove = (e) => {
      if (!this._dragging) return;
      const { x, full } = this.getState();
      const rect = this.target.getBoundingClientRect();
      const dxFrac = (e.clientX - this._lastX) / rect.width;
      this._lastX = e.clientX;
      const span = x[1] - x[0];
      let lo = x[0] - dxFrac * span;
      let hi = x[1] - dxFrac * span;
      [lo, hi] = this._clamp(lo, hi, full);
      this.onChange([lo, hi]);
    };
    this._onUp = () => { this._dragging = false; this.target.style.cursor = ''; };
    this.target.addEventListener('wheel', this._onWheel, { passive: false });
    this.target.addEventListener('mousedown', this._onDown);
    window.addEventListener('mousemove', this._onMove);
    window.addEventListener('mouseup', this._onUp);
  }
  _clamp(lo, hi, full) {
    const span = hi - lo;
    if (lo < full[0]) { lo = full[0]; hi = lo + span; }
    if (hi > full[1]) { hi = full[1]; lo = hi - span; }
    if (lo < full[0]) lo = full[0];
    return [lo, hi];
  }
  destroy() {
    this.target.removeEventListener('wheel', this._onWheel);
    this.target.removeEventListener('mousedown', this._onDown);
    window.removeEventListener('mousemove', this._onMove);
    window.removeEventListener('mouseup', this._onUp);
  }
}
