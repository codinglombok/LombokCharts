// tests/decimate.test.js
import { test, eq, ok } from './_t.js';
import { lttb, minMaxDecimate } from '../src/data/decimate.js';

function gen(n) { const xs = new Float64Array(n); const ys = new Float64Array(n); for (let i = 0; i < n; i++) { xs[i] = i; ys[i] = Math.sin(i / 50) + (i === 5000 ? 100 : 0); } return { xs, ys }; }

test('lttb reduces to threshold', () => {
  const { xs, ys } = gen(100000);
  const r = lttb(xs, ys, 100000, 1000);
  ok(r.count <= 1000 && r.count > 900);
});
test('lttb keeps first and last point', () => {
  const { xs, ys } = gen(10000);
  const r = lttb(xs, ys, 10000, 500);
  eq(r.xs[0], xs[0]); eq(r.xs[r.count - 1], xs[9999]);
});
test('lttb returns all when threshold>=n', () => {
  const { xs, ys } = gen(100);
  const r = lttb(xs, ys, 100, 500);
  eq(r.count, 100);
});
test('minMax preserves the spike', () => {
  const { xs, ys } = gen(20000);
  const r = minMaxDecimate(xs, ys, 20000, 1000);
  let max = -Infinity; for (let i = 0; i < r.count; i++) max = Math.max(max, r.ys[i]);
  ok(max > 50, 'spike preserved');
});
