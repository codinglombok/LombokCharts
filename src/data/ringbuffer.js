// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/data/ringbuffer.js
// CONTRACT (pure logic, portable): fixed-capacity ring buffer over typed arrays.
//   Constant memory for unbounded streams. push() overwrites oldest when full.

export class RingBuffer {
  /** @param {number} capacity */
  constructor(capacity) {
    this.capacity = Math.max(1, capacity | 0);
    this.xs = new Float64Array(this.capacity);
    this.ys = new Float64Array(this.capacity);
    this._head = 0;   // next write position
    this._size = 0;   // valid items
  }

  get size() { return this._size; }
  get full() { return this._size === this.capacity; }

  /** @param {number} x @param {number} y */
  push(x, y) {
    this.xs[this._head] = x;
    this.ys[this._head] = y;
    this._head = (this._head + 1) % this.capacity;
    if (this._size < this.capacity) this._size++;
  }

  /** Logical index (0 = oldest) -> physical index. */
  _phys(i) {
    const start = this.full ? this._head : 0;
    return (start + i) % this.capacity;
  }

  x(i) { return this.xs[this._phys(i)]; }
  y(i) { return this.ys[this._phys(i)]; }

  /**
   * Copy logical-order data into contiguous typed arrays for rendering.
   * @returns {{xs:Float64Array, ys:Float64Array, count:number}}
   */
  toArrays() {
    const n = this._size;
    const ox = new Float64Array(n);
    const oy = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const p = this._phys(i);
      ox[i] = this.xs[p];
      oy[i] = this.ys[p];
    }
    return { xs: ox, ys: oy, count: n };
  }

  clear() { this._head = 0; this._size = 0; }
}
