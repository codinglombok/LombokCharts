// tests/ringbuffer.test.js
import { test, eq, ok } from './_t.js';
import { RingBuffer } from '../src/data/ringbuffer.js';
import { Quadtree } from '../src/interaction/quadtree.js';

test('ring buffer fills then overwrites oldest', () => {
  const rb = new RingBuffer(3);
  rb.push(1, 1); rb.push(2, 2); rb.push(3, 3);
  eq(rb.size, 3); eq(rb.x(0), 1); eq(rb.x(2), 3);
  rb.push(4, 4);
  eq(rb.size, 3); eq(rb.x(0), 2); eq(rb.x(2), 4);
});
test('ring buffer toArrays in logical order', () => {
  const rb = new RingBuffer(3);
  for (let i = 1; i <= 5; i++) rb.push(i, i * 10);
  const a = rb.toArrays();
  eq(a.count, 3); eq(a.xs[0], 3); eq(a.ys[2], 50);
});
test('quadtree finds nearest point', () => {
  const xs = new Float64Array([10, 50, 90]); const ys = new Float64Array([10, 50, 90]);
  const qt = Quadtree.fromPixels(xs, ys, 3, { x0: 0, y0: 0, x1: 100, y1: 100 });
  const hit = qt.nearest(48, 52, 20);
  ok(hit && hit.index === 1);
});
