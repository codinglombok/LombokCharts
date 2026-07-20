// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/interaction/quadtree.js
// CONTRACT (pure logic, portable): point quadtree for O(log n) nearest-neighbour
// hit-testing. Stores (x, y, index). build() accepts typed arrays in PIXEL space.

class QNode {
  constructor(x0, y0, x1, y1) { this.x0 = x0; this.y0 = y0; this.x1 = x1; this.y1 = y1; this.pts = []; this.kids = null; }
}

export class Quadtree {
  constructor(x0, y0, x1, y1, capacity = 16, maxDepth = 12) {
    this.root = new QNode(x0, y0, x1, y1);
    this.capacity = capacity;
    this.maxDepth = maxDepth;
  }

  _insert(node, x, y, idx, depth) {
    if (node.kids) { this._insert(node.kids[this._quadrant(node, x, y)], x, y, idx, depth + 1); return; }
    node.pts.push(x, y, idx);
    if (node.pts.length / 3 > this.capacity && depth < this.maxDepth) this._subdivide(node, depth);
  }

  _quadrant(node, x, y) {
    const mx = (node.x0 + node.x1) / 2;
    const my = (node.y0 + node.y1) / 2;
    return (x >= mx ? 1 : 0) + (y >= my ? 2 : 0);
  }

  _subdivide(node, depth) {
    const mx = (node.x0 + node.x1) / 2;
    const my = (node.y0 + node.y1) / 2;
    node.kids = [
      new QNode(node.x0, node.y0, mx, my),
      new QNode(mx, node.y0, node.x1, my),
      new QNode(node.x0, my, mx, node.y1),
      new QNode(mx, my, node.x1, node.y1),
    ];
    const pts = node.pts; node.pts = [];
    for (let i = 0; i < pts.length; i += 3) this._insert(node, pts[i], pts[i + 1], pts[i + 2], depth);
  }

  insert(x, y, idx) { this._insert(this.root, x, y, idx, 0); }

  /** Build from typed arrays already mapped to pixel space. */
  static fromPixels(xs, ys, count, bounds) {
    const qt = new Quadtree(bounds.x0, bounds.y0, bounds.x1, bounds.y1);
    for (let i = 0; i < count; i++) qt.insert(xs[i], ys[i], i);
    return qt;
  }

  /** @returns {{index:number, x:number, y:number, dist:number}|null} */
  nearest(px, py, radius = Infinity) {
    let best = null;
    let bestD2 = radius * radius;
    const stack = [this.root];
    while (stack.length) {
      const node = stack.pop();
      // prune: skip node whose bounding box is farther than current best
      const dx = px < node.x0 ? node.x0 - px : px > node.x1 ? px - node.x1 : 0;
      const dy = py < node.y0 ? node.y0 - py : py > node.y1 ? py - node.y1 : 0;
      if (dx * dx + dy * dy > bestD2) continue;
      if (node.kids) { for (const k of node.kids) stack.push(k); continue; }
      const pts = node.pts;
      for (let i = 0; i < pts.length; i += 3) {
        const ex = pts[i] - px, ey = pts[i + 1] - py;
        const d2 = ex * ex + ey * ey;
        if (d2 < bestD2) { bestD2 = d2; best = { index: pts[i + 2], x: pts[i], y: pts[i + 1], dist: Math.sqrt(d2) }; }
      }
    }
    return best;
  }
}
