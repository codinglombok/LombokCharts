// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/scales/linear.js
// CONTRACT (pure logic, portable): linearScale(domain:[d0,d1], range:[r0,r1])
//   -> { scale(v)->number, invert(px)->number, domain, range, ticks(n)->number[] }
// No DOM access.
import { ticks as niceTicks } from '../utils/math.js';

/**
 * @param {[number,number]} domain
 * @param {[number,number]} range
 */
export function linearScale(domain, range) {
  let [d0, d1] = domain;
  const [r0, r1] = range;
  if (d0 === d1) { d0 -= 0.5; d1 += 0.5; }
  const m = (r1 - r0) / (d1 - d0);
  const scale = (v) => r0 + (v - d0) * m;
  scale.invert = (px) => d0 + (px - r0) / m;
  scale.domain = [d0, d1];
  scale.range = [r0, r1];
  scale.bandwidth = 0;
  scale.ticks = (n = 6) => niceTicks(d0, d1, n);
  scale.kind = 'linear';
  return scale;
}
