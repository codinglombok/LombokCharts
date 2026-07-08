// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/scales/sqrt.js
// CONTRACT: sqrtScale(domain:[d0,d1], range) -> area-proportional mapping (bubble radius).
export function sqrtScale(domain, range) {
  let [d0, d1] = domain;
  const [r0, r1] = range;
  if (d0 === d1) d1 = d0 + 1;
  const s0 = Math.sqrt(Math.max(0, d0));
  const s1 = Math.sqrt(Math.max(0, d1));
  const m = (r1 - r0) / (s1 - s0 || 1);
  const scale = (v) => r0 + (Math.sqrt(Math.max(0, v)) - s0) * m;
  scale.invert = (px) => { const s = s0 + (px - r0) / m; return s * s; };
  scale.domain = [d0, d1];
  scale.range = [r0, r1];
  scale.kind = 'sqrt';
  scale.ticks = (n = 4) => { const out = []; for (let i = 0; i <= n; i++) out.push(d0 + (d1 - d0) * (i / n)); return out; };
  return scale;
}
