// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/scales/band.js
// CONTRACT: bandScale(categories:string[], range, {padding,paddingInner,paddingOuter})
//   -> { scale(cat)->number (left edge), bandwidth, step, domain, range, ticks }
export function bandScale(categories, range, opts = {}) {
  const [r0, r1] = range;
  const n = categories.length;
  const paddingInner = opts.paddingInner != null ? opts.paddingInner : (opts.padding != null ? opts.padding : 0.1);
  const paddingOuter = opts.paddingOuter != null ? opts.paddingOuter : (opts.padding != null ? opts.padding : 0.1);
  const width = r1 - r0;
  const step = n > 0 ? width / (n - paddingInner + 2 * paddingOuter) : width;
  const bandwidth = step * (1 - paddingInner);
  const index = new Map();
  categories.forEach((c, i) => index.set(String(c), i));
  const start = r0 + step * paddingOuter;
  const scale = (cat) => {
    const i = index.get(String(cat));
    if (i == null) return NaN;
    return start + i * step;
  };
  scale.bandwidth = bandwidth;
  scale.step = step;
  scale.domain = categories;
  scale.range = [r0, r1];
  scale.kind = 'band';
  scale.ticks = () => categories;
  scale.center = (cat) => scale(cat) + bandwidth / 2;
  scale.invert = (px) => {
    const i = Math.floor((px - start) / step);
    return categories[Math.max(0, Math.min(n - 1, i))];
  };
  return scale;
}
