// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/scales/color.js
// CONTRACT: categorical(palette) -> fn(key)->color (stable mapping);
//           sequential([c0,c1], domain) -> fn(v)->interpolated hex color. Pure logic.

/** @param {string} hex @returns {[number,number,number]} */
function hexToRgb(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3)
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(r, g, b) {
  const to = (x) =>
    Math.round(Math.max(0, Math.min(255, x)))
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

/** Stable categorical color: same key always maps to same palette color. */
export function categoricalScale(palette) {
  const cache = new Map();
  let next = 0;
  const scale = (key) => {
    const k = String(key);
    if (!cache.has(k)) {
      cache.set(k, palette[next % palette.length]);
      next++;
    }
    return cache.get(k);
  };
  scale.byIndex = (i) => palette[i % palette.length];
  scale.kind = "categorical";
  return scale;
}

/** Continuous color ramp between two hex endpoints. */
export function sequentialScale(range, domain = [0, 1]) {
  const c0 = hexToRgb(range[0]);
  const c1 = hexToRgb(range[1]);
  let [d0, d1] = domain;
  if (d0 === d1) d1 = d0 + 1;
  const scale = (v) => {
    const t = Math.max(0, Math.min(1, (v - d0) / (d1 - d0)));
    return rgbToHex(
      c0[0] + (c1[0] - c0[0]) * t,
      c0[1] + (c1[1] - c0[1]) * t,
      c0[2] + (c1[2] - c0[2]) * t,
    );
  };
  scale.domain = [d0, d1];
  scale.kind = "sequential";
  return scale;
}
