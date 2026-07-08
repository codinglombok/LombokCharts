// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// build.js — zero-config bundler (esbuild) producing ESM + IIFE (UMD-style global)
// and minified variants. The library itself ships ZERO runtime dependencies;
// esbuild is a build-only devDependency.
import esbuild from 'esbuild';
import { mkdirSync } from 'node:fs';

mkdirSync('dist', { recursive: true });
const watch = process.argv.includes('--watch');
const entry = 'src/lombok-charts.js';
const banner = { js: `/* LombokCharts v0.1.0 | Apache-2.0 | https://github.com/codinglombok/LombokCharts */` };

/** @type {import('esbuild').BuildOptions[]} */
const targets = [
  { format: 'esm', outfile: 'dist/lombok-charts.esm.js', minify: false },
  { format: 'esm', outfile: 'dist/lombok-charts.esm.min.js', minify: true },
  { format: 'iife', globalName: 'LombokCharts', outfile: 'dist/lombok-charts.umd.js', minify: false },
  { format: 'iife', globalName: 'LombokCharts', outfile: 'dist/lombok-charts.umd.min.js', minify: true },
  { format: 'cjs', outfile: 'dist/lombok-charts.cjs', minify: false },
];

async function run() {
  for (const t of targets) {
    const opts = { entryPoints: [entry], bundle: true, banner, target: 'es2020', ...t };
    if (watch) { const c = await esbuild.context(opts); await c.watch(); console.log('watching', t.outfile); }
    else { await esbuild.build(opts); console.log('built', t.outfile); }
  }
  if (!watch) console.log('Build complete.');
}
run().catch((e) => { console.error(e); process.exit(1); });
