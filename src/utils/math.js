// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/utils/math.js
// Pure math helpers. No DOM access — safe to port to other languages.

/** @param {number} v @param {number} lo @param {number} hi @returns {number} */
export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Linear interpolation. @param {number} a @param {number} b @param {number} t */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Compute [min, max] over a numeric accessor of an array of objects.
 * @param {ReadonlyArray<any>} data
 * @param {(d:any,i:number)=>number} accessor
 * @returns {[number, number]}
 */
export function extent(data, accessor) {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < data.length; i++) {
    const v = accessor(data[i], i);
    if (v == null || Number.isNaN(v)) continue;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (min === Infinity) return [0, 1];
  if (min === max) return [min - 1, max + 1];
  return [min, max];
}

/** Min/max over a typed array slice. @param {ArrayLike<number>} arr @param {number} n */
export function extentTyped(arr, n) {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < n; i++) {
    const v = arr[i];
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (min === Infinity) return [0, 1];
  if (min === max) return [min - 1, max + 1];
  return [min, max];
}

/**
 * Produce "nice" tick values for a numeric axis.
 * @param {number} min @param {number} max @param {number} [count]
 * @returns {number[]}
 */
export function ticks(min, max, count = 6) {
  if (min === max) return [min];
  const span = max - min;
  const step0 = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const norm = step0 / mag;
  let step;
  if (norm < 1.5) step = 1;
  else if (norm < 3) step = 2;
  else if (norm < 7) step = 5;
  else step = 10;
  step *= mag;
  const start = Math.ceil(min / step) * step;
  const out = [];
  for (let v = start; v <= max + step * 1e-9; v += step) {
    // avoid floating point dust like 0.30000000004
    out.push(Math.round(v / step) * step);
  }
  return out;
}

/** Deep merge plain objects (used for theme token overrides). */
export function deepMerge(target, source) {
  if (!source) return target;
  const out = Array.isArray(target) ? target.slice() : { ...target };
  for (const key of Object.keys(source)) {
    const sv = source[key];
    const tv = out[key];
    if (sv && typeof sv === 'object' && !Array.isArray(sv) && tv && typeof tv === 'object') {
      out[key] = deepMerge(tv, sv);
    } else {
      out[key] = sv;
    }
  }
  return out;
}

/** Sum of numbers. @param {number[]} arr */
export function sum(arr) {
  let s = 0;
  for (let i = 0; i < arr.length; i++) s += arr[i];
  return s;
}

/** Quantile of a SORTED numeric array using linear interpolation. */
export function quantileSorted(sorted, p) {
  if (sorted.length === 0) return NaN;
  if (sorted.length === 1) return sorted[0];
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return lerp(sorted[lo], sorted[hi], idx - lo);
}
