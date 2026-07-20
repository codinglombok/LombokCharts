// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/utils/raf.js
// requestAnimationFrame helpers with a graceful Node fallback (used by tests/SSR guards).

const hasRAF = typeof requestAnimationFrame === "function";

/** @param {FrameRequestCallback} cb @returns {number} */
export const raf = hasRAF
  ? (cb) => requestAnimationFrame(cb)
  : (cb) => setTimeout(() => cb(Date.now()), 16);

/** @param {number} id */
export const caf = hasRAF
  ? (id) => cancelAnimationFrame(id)
  : (id) => clearTimeout(id);

/**
 * A coalescing scheduler: many `request()` calls in one frame run the task once.
 * Keeps live updates throttled to the display refresh rate.
 */
export class FrameScheduler {
  constructor(task) {
    this._task = task;
    this._id = 0;
    this._scheduled = false;
    this._run = this._run.bind(this);
  }
  request() {
    if (this._scheduled) return;
    this._scheduled = true;
    this._id = raf(this._run);
  }
  _run(ts) {
    this._scheduled = false;
    this._task(ts);
  }
  cancel() {
    if (this._scheduled) caf(this._id);
    this._scheduled = false;
  }
}
