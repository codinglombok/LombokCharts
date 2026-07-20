// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/scales/radial.js
// CONTRACT: radialScale maps a linear value domain to an angle range [a0,a1] (radians).
//   Used by pie/donut/gauge/radar. Pure logic.
export function radialScale(
  domain,
  angleRange = [-Math.PI / 2, Math.PI * 1.5],
) {
  let [d0, d1] = domain;
  const [a0, a1] = angleRange;
  if (d0 === d1) d1 = d0 + 1;
  const m = (a1 - a0) / (d1 - d0);
  const scale = (v) => a0 + (v - d0) * m;
  scale.invert = (a) => d0 + (a - a0) / m;
  scale.domain = [d0, d1];
  scale.range = angleRange;
  scale.kind = "radial";
  scale.ticks = (n = 5) => {
    const out = [];
    for (let i = 0; i <= n; i++) out.push(d0 + (d1 - d0) * (i / n));
    return out;
  };
  return scale;
}

/** Geometry helper used by Arc/Radar marks (pure). @returns {{x:number,y:number}} */
export function polarToCartesian(cx, cy, r, angle) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}
