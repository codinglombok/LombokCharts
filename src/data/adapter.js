// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/data/adapter.js
// Normalize user input (array of objects) into typed arrays + category info.
// Pure logic (no DOM).
import { extent } from "../utils/math.js";

/**
 * @typedef {Object} SeriesData
 * @property {Float64Array} xs
 * @property {Float64Array} ys
 * @property {number} count
 * @property {string[]|null} categories  category labels if x is categorical
 * @property {(d:any,i:number)=>number} xAccessor
 */

/** Resolve an accessor for a key that may be a string or a function. */
export function accessor(key) {
  if (typeof key === "function") return key;
  return (d) => d[key];
}

/**
 * Convert array-of-objects to typed arrays.
 * If xKey values are non-numeric, treats them as categories (index used for xs).
 * @param {ReadonlyArray<any>} data
 * @param {string|((d:any)=>any)} xKey
 * @param {string|((d:any)=>number)} yKey
 * @returns {SeriesData}
 */
export function toSeries(data, xKey, yKey) {
  const xa = accessor(xKey);
  const ya = accessor(yKey);
  const n = data.length;
  const xs = new Float64Array(n);
  const ys = new Float64Array(n);
  let categorical = false;
  for (let i = 0; i < n; i++) {
    const xv = xa(data[i], i);
    if (typeof xv !== "number") categorical = true;
    ys[i] = +ya(data[i], i);
  }
  let categories = null;
  if (categorical) {
    categories = data.map((d, i) => String(xa(d, i)));
    for (let i = 0; i < n; i++) xs[i] = i;
  } else {
    for (let i = 0; i < n; i++) xs[i] = +xa(data[i], i);
  }
  return { xs, ys, count: n, categories, xAccessor: xa };
}

/** Extent over a key (handles array of objects). */
export { extent };
