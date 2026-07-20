// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/data/decimate.js
// CONTRACT (pure logic, portable): LTTB downsampling.
//   lttb(xs:Float64Array, ys:Float64Array, n:number, threshold:number)
//     -> { xs:Float64Array, ys:Float64Array, count:number }
// Largest-Triangle-Three-Buckets keeps visual shape while reducing point count.
// Reference: Sveinn Steinarsson, 2013.

/**
 * @param {ArrayLike<number>} xs
 * @param {ArrayLike<number>} ys
 * @param {number} n        number of valid points in xs/ys
 * @param {number} threshold target output point count
 * @returns {{xs:Float64Array, ys:Float64Array, count:number}}
 */
export function lttb(xs, ys, n, threshold) {
  if (threshold >= n || threshold <= 2) {
    const ox = new Float64Array(n);
    const oy = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      ox[i] = xs[i];
      oy[i] = ys[i];
    }
    return { xs: ox, ys: oy, count: n };
  }

  const sampledX = new Float64Array(threshold);
  const sampledY = new Float64Array(threshold);
  let sampledIndex = 0;

  // Bucket size, leaving room for the first and last points.
  const every = (n - 2) / (threshold - 2);

  let a = 0; // initially the first point is always included
  sampledX[sampledIndex] = xs[0];
  sampledY[sampledIndex] = ys[0];
  sampledIndex++;

  for (let i = 0; i < threshold - 2; i++) {
    // Average point of the NEXT bucket (used to form the triangle).
    let avgX = 0;
    let avgY = 0;
    let avgRangeStart = Math.floor((i + 1) * every) + 1;
    let avgRangeEnd = Math.floor((i + 2) * every) + 1;
    avgRangeEnd = avgRangeEnd < n ? avgRangeEnd : n;
    const avgRangeLength = avgRangeEnd - avgRangeStart;
    for (; avgRangeStart < avgRangeEnd; avgRangeStart++) {
      avgX += xs[avgRangeStart];
      avgY += ys[avgRangeStart];
    }
    avgX /= avgRangeLength || 1;
    avgY /= avgRangeLength || 1;

    // Range of the CURRENT bucket we pick a point from.
    let rangeOffs = Math.floor(i * every) + 1;
    const rangeTo = Math.floor((i + 1) * every) + 1;

    const pointAX = xs[a];
    const pointAY = ys[a];

    let maxArea = -1;
    let nextA = rangeOffs;
    for (; rangeOffs < rangeTo; rangeOffs++) {
      // Triangle area between point A, candidate, and next-bucket average.
      const area =
        Math.abs(
          (pointAX - avgX) * (ys[rangeOffs] - pointAY) -
            (pointAX - xs[rangeOffs]) * (avgY - pointAY),
        ) * 0.5;
      if (area > maxArea) {
        maxArea = area;
        nextA = rangeOffs;
      }
    }
    sampledX[sampledIndex] = xs[nextA];
    sampledY[sampledIndex] = ys[nextA];
    sampledIndex++;
    a = nextA;
  }

  // Always include the last point.
  sampledX[sampledIndex] = xs[n - 1];
  sampledY[sampledIndex] = ys[n - 1];
  sampledIndex++;

  return { xs: sampledX, ys: sampledY, count: sampledIndex };
}

/**
 * Min/max decimation: for each output bucket keep the min and max y, preserving
 * spikes. Useful for dense oscillating signals. Returns interleaved pairs.
 */
export function minMaxDecimate(xs, ys, n, threshold) {
  if (threshold >= n) {
    const ox = new Float64Array(n);
    const oy = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      ox[i] = xs[i];
      oy[i] = ys[i];
    }
    return { xs: ox, ys: oy, count: n };
  }
  const buckets = Math.floor(threshold / 2);
  const size = n / buckets;
  const ox = new Float64Array(buckets * 2);
  const oy = new Float64Array(buckets * 2);
  let k = 0;
  for (let b = 0; b < buckets; b++) {
    const s = Math.floor(b * size);
    const e = Math.min(n, Math.floor((b + 1) * size));
    let minI = s;
    let maxI = s;
    for (let i = s; i < e; i++) {
      if (ys[i] < ys[minI]) minI = i;
      if (ys[i] > ys[maxI]) maxI = i;
    }
    const first = Math.min(minI, maxI);
    const second = Math.max(minI, maxI);
    ox[k] = xs[first];
    oy[k] = ys[first];
    k++;
    ox[k] = xs[second];
    oy[k] = ys[second];
    k++;
  }
  return { xs: ox, ys: oy, count: k };
}
