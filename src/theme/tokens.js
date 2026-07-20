// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/theme/tokens.js
/**
 * @typedef {Object} Theme
 * @property {string} name
 * @property {{ background:string, surface:string, text:string, muted:string,
 *   grid:string, axis:string, tooltipBg:string, tooltipText:string }} colors
 * @property {string[]} palette                 categorical series colors
 * @property {{ positive:string, negative:string, neutral:string }} semantic
 * @property {[string,string]} sequential        endpoints for continuous color ramps
 * @property {{ family:string, size:number, axisSize:number, labelSize:number }} typography
 * @property {{ padding:number, tickLength:number, radius:number }} spacing
 * @property {{ duration:number, easing:(t:number)=>number }} motion
 */

/** Shared structural tokens (overridden per theme below). */
export const baseTokens = {
  palette: ['#4f8cff', '#ff6b6b', '#36c5a0', '#ffa94d', '#a78bfa', '#f06595', '#74c0fc', '#ffd43b'],
  semantic: { positive: '#36c5a0', negative: '#ff6b6b', neutral: '#868e96' },
  typography: { family: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", size: 13, axisSize: 11, labelSize: 12 },
  spacing: { padding: 12, tickLength: 5, radius: 4 },
  motion: { duration: 450, easing: easeCubicOut },
};

/** Cubic ease-out, used for entrance/transition animations. */
export function easeCubicOut(t) {
  const u = 1 - t;
  return 1 - u * u * u;
}
