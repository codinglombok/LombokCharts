// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/stream/scheduler.js
// Batches incoming points and flushes them once per animation frame, so a 1000
// points/sec feed still results in ~60 coalesced redraws/sec (constant 60fps).
import { FrameScheduler } from '../utils/raf.js';

export class StreamScheduler {
  /** @param {(batch:Array<{x:number,y:number}>)=>void} flush */
  constructor(flush) {
    this._buffer = [];
    this._flush = flush;
    this._scheduler = new FrameScheduler(() => {
      if (this._buffer.length === 0) return;
      const batch = this._buffer;
      this._buffer = [];
      this._flush(batch);
    });
  }
  /** @param {{x:number,y:number}|Array<{x:number,y:number}>} point */
  push(point) {
    if (Array.isArray(point)) for (const p of point) this._buffer.push(p);
    else this._buffer.push(point);
    this._scheduler.request();
  }
  cancel() { this._scheduler.cancel(); this._buffer = []; }
}
