// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/scales/time.js
// CONTRACT: timeScale(domain:[t0,t1] in ms, range) -> linear over time + time-aware ticks.
import { linearScale } from './linear.js';

const STEPS = [
  1000, 5000, 15000, 30000,           // seconds
  60000, 300000, 900000, 1800000,     // minutes
  3600000, 10800000, 21600000,        // hours
  86400000, 604800000,                // day, week
  2592000000, 31536000000,            // ~month, ~year
];

export function timeScale(domain, range) {
  const base = linearScale(domain, range);
  const scale = (v) => base(+v);
  scale.invert = (px) => base.invert(px);
  scale.domain = base.domain;
  scale.range = base.range;
  scale.bandwidth = 0;
  scale.kind = 'time';
  scale.ticks = (n = 6) => {
    const [t0, t1] = base.domain;
    const span = t1 - t0;
    const target = span / n;
    let step = STEPS[STEPS.length - 1];
    for (const s of STEPS) { if (s >= target) { step = s; break; } }
    const start = Math.ceil(t0 / step) * step;
    const out = [];
    for (let t = start; t <= t1; t += step) out.push(t);
    return out;
  };
  scale.tickFormat = (t) => {
    const d = new Date(t);
    const span = base.domain[1] - base.domain[0];
    if (span < 86400000) return d.toLocaleTimeString();
    if (span < 31536000000) return `${d.getMonth() + 1}/${d.getDate()}`;
    return String(d.getFullYear());
  };
  return scale;
}
