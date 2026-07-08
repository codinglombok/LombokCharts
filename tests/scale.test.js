// tests/scale.test.js
import { test, approx, eq, ok } from './_t.js';
import { linearScale } from '../src/scales/linear.js';
import { logScale } from '../src/scales/log.js';
import { bandScale } from '../src/scales/band.js';
import { sqrtScale } from '../src/scales/sqrt.js';
import { ticks } from '../src/utils/math.js';

test('linear maps domain to range', () => {
  const s = linearScale([0, 100], [0, 200]);
  approx(s(50), 100); approx(s(0), 0); approx(s(100), 200);
});
test('linear invert round-trips', () => {
  const s = linearScale([10, 20], [0, 500]);
  approx(s.invert(s(17)), 17);
});
test('log scale increasing & ticks are powers', () => {
  const s = logScale([1, 1000], [0, 300]);
  ok(s(10) < s(100));
  ok(s.ticks().includes(10));
});
test('band scale produces non-overlapping bands', () => {
  const s = bandScale(['a', 'b', 'c'], [0, 300]);
  ok(s.bandwidth > 0);
  ok(s('b') > s('a'));
  ok(s('a') + s.bandwidth <= s('b') + 1e-6);
});
test('sqrt scale is area-proportional', () => {
  const s = sqrtScale([0, 100], [0, 10]);
  approx(s(100), 10); approx(s(25), 5);
});
test('nice ticks span the domain', () => {
  const t = ticks(0, 100, 5);
  ok(t.length >= 4 && t[0] <= 0 + 1e-9 && t[t.length - 1] >= 100 - 25);
});
