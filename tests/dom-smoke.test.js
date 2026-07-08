// tests/dom-smoke.test.js
// Exercises the full Chart pipeline under a minimal DOM/Canvas shim so we catch
// integration bugs (scales -> axes -> mark -> renderer) without a browser.
import { test, ok, eq } from './_t.js';
import { installDomShim } from './_domshim.js';
installDomShim();

const { chart } = await import('../src/lombok-charts.js');

function makeContainer() {
  const el = document.createElement('div');
  el._rect = { width: 600, height: 360, left: 0, top: 0 };
  document.body.appendChild(el);
  return el;
}

test('bar chart renders with hits', () => {
  const data = [{ label: 'A', value: 30 }, { label: 'B', value: 80 }, { label: 'C', value: 45 }];
  const c = chart(makeContainer(), { data, mark: 'bar', animate: false });
  ok(c.lastStats.drawn === 3, 'drew 3 bars');
  ok(c._hits.length === 3);
  c.destroy();
});

test('line chart with 100k points decimates', () => {
  const xs = new Float64Array(100000); const ys = new Float64Array(100000);
  for (let i = 0; i < xs.length; i++) { xs[i] = i; ys[i] = Math.sin(i / 1000); }
  const c = chart(makeContainer(), { xs, ys, mark: 'line', animate: false });
  ok(c.lastStats.drawn < 5000, 'decimated below 5k, got ' + c.lastStats.drawn);
  c.destroy();
});

test('pie chart (arc) renders slices', () => {
  const data = [{ label: 'X', value: 1 }, { label: 'Y', value: 2 }, { label: 'Z', value: 3 }];
  const c = chart(makeContainer(), { data, mark: 'pie', animate: false });
  eq(c.lastStats.drawn, 3);
  c.destroy();
});

test('toSVG produces svg markup', () => {
  const data = [{ label: 'A', value: 10 }, { label: 'B', value: 20 }];
  const c = chart(makeContainer(), { data, mark: 'bar', renderer: 'svg', animate: false });
  const svg = c.toSVG();
  ok(svg.startsWith('<svg') && svg.includes('</svg>'), 'svg string');
  c.destroy();
});

test('candlestick + heatmap + radar + treemap + sankey all draw', () => {
  const ohlc = []; let p = 100;
  for (let i = 0; i < 20; i++) { const o = p, cl = p + (Math.random() - 0.5) * 4; ohlc.push({ x: i, open: o, high: Math.max(o, cl) + 1, low: Math.min(o, cl) - 1, close: cl }); p = cl; }
  const c1 = chart(makeContainer(), { data: ohlc, mark: 'candlestick', animate: false }); ok(c1.lastStats.drawn === 20); c1.destroy();

  const heat = []; for (const r of ['r1', 'r2']) for (const col of ['c1', 'c2', 'c3']) heat.push({ x: col, y: r, value: Math.random() });
  const c2 = chart(makeContainer(), { data: heat, mark: 'heatmap', animate: false }); ok(c2.lastStats.drawn === 6); c2.destroy();

  const radar = [{ axis: 'Speed', a: 80 }, { axis: 'Power', a: 60 }, { axis: 'Range', a: 70 }];
  const c3 = chart(makeContainer(), { data: radar, x: 'axis', series: [{ key: 'a', label: 'Car' }], mark: 'radar', animate: false }); ok(c3.lastStats.drawn >= 1); c3.destroy();

  const tm = [{ label: 'A', value: 40 }, { label: 'B', value: 30 }, { label: 'C', value: 20 }, { label: 'D', value: 10 }];
  const c4 = chart(makeContainer(), { data: tm, mark: 'treemap', animate: false }); eq(c4.lastStats.drawn, 4); c4.destroy();

  const c5 = chart(makeContainer(), { mark: { type: 'sankey', nodes: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }, { id: 'c', name: 'C' }], links: [{ source: 'a', target: 'b', value: 5 }, { source: 'b', target: 'c', value: 3 }] }, data: [{}], animate: false });
  ok(c5.lastStats.drawn >= 5); c5.destroy();
});

test('appendData grows the live series', () => {
  const c = chart(makeContainer(), { xs: new Float64Array([0]), ys: new Float64Array([0]), mark: 'line', animate: false, maxPoints: 100 });
  for (let i = 1; i <= 50; i++) c.appendData({ x: i, y: Math.sin(i) });
  c._streamSched._scheduler._task(); // flush synchronously
  ok(c.config.count > 1, 'count grew to ' + c.config.count);
  c.destroy();
});
