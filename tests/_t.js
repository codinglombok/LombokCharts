// tests/_t.js — minimal zero-dependency test harness.
export const results = { pass: 0, fail: 0, failures: [] };
export function test(name, fn) {
  try { fn(); results.pass++; console.log('  \x1b[32m✓\x1b[0m ' + name); }
  catch (e) { results.fail++; results.failures.push(name + ': ' + e.message); console.log('  \x1b[31m✗\x1b[0m ' + name + ' — ' + e.message); }
}
export function eq(a, b, msg) { if (a !== b) throw new Error((msg || 'eq') + ` expected ${b} got ${a}`); }
export function approx(a, b, eps = 1e-6, msg) { if (Math.abs(a - b) > eps) throw new Error((msg || 'approx') + ` expected ~${b} got ${a}`); }
export function ok(v, msg) { if (!v) throw new Error(msg || 'expected truthy'); }
