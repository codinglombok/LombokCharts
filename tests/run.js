// tests/run.js — runs every *.test.js file and prints a summary.
import { results } from './_t.js';

const files = ['./scale.test.js', './decimate.test.js', './ringbuffer.test.js', './dom-smoke.test.js'];
console.log('\nLombokCharts test suite\n');
for (const f of files) {
  console.log('• ' + f.replace('./', '').replace('.test.js', ''));
  await import(f);
}
console.log(`\n${results.pass} passed, ${results.fail} failed.`);
if (results.fail > 0) { for (const f of results.failures) console.log('   - ' + f); process.exit(1); }
