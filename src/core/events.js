// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/core/events.js — minimal event emitter used by Chart for hover/select/render hooks.
export class Emitter {
  constructor() {
    /** @type {Map<string, Set<Function>>} */ this._h = new Map();
  }
  on(type, fn) {
    if (!this._h.has(type)) this._h.set(type, new Set());
    this._h.get(type).add(fn);
    return () => this.off(type, fn);
  }
  off(type, fn) {
    const s = this._h.get(type);
    if (s) s.delete(fn);
  }
  emit(type, payload) {
    const s = this._h.get(type);
    if (s) for (const fn of s) fn(payload);
  }
  clear() {
    this._h.clear();
  }
}
