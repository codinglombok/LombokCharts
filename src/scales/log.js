// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/scales/log.js
// CONTRACT: logScale(domain:[d0>0,d1>0], range) -> { scale, invert, ticks, domain, range }
export function logScale(domain, range, base = 10) {
  let [d0, d1] = domain;
  const [r0, r1] = range;
  d0 = d0 <= 0 ? 1e-6 : d0;
  d1 = d1 <= 0 ? 1e-6 : d1;
  const logb = (x) => Math.log(x) / Math.log(base);
  const l0 = logb(d0);
  const l1 = logb(d1);
  const m = (r1 - r0) / (l1 - l0 || 1);
  const scale = (v) => r0 + (logb(v <= 0 ? 1e-6 : v) - l0) * m;
  scale.invert = (px) => Math.pow(base, l0 + (px - r0) / m);
  scale.domain = [d0, d1];
  scale.range = [r0, r1];
  scale.bandwidth = 0;
  scale.kind = 'log';
  scale.ticks = () => {
    const out = [];
    const start = Math.floor(l0);
    const end = Math.ceil(l1);
    for (let e = start; e <= end; e++) out.push(Math.pow(base, e));
    return out.filter((v) => v >= d0 && v <= d1);
  };
  return scale;
}
