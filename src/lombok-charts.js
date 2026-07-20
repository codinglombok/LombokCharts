// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/lombok-charts.js — LombokCharts public API (full build registers every mark).
// For a minimal custom bundle, import { Chart, registerMark } and register only
// the marks you need (tree-shaking drops the rest).
import { Chart } from "./core/Chart.js";
import { registerMark, getMark, hasMark, listMarks } from "./registry.js";

// Core marks
import { BarMark } from "./marks/core/BarMark.js";
import { LineMark } from "./marks/core/LineMark.js";
import { AreaMark } from "./marks/core/AreaMark.js";
import { PointMark } from "./marks/core/PointMark.js";
import { ArcMark } from "./marks/core/ArcMark.js";
// Extended marks
import { RadarMark } from "./marks/extended/RadarMark.js";
import { HeatmapMark } from "./marks/extended/HeatmapMark.js";
import { BoxPlotMark } from "./marks/extended/BoxPlotMark.js";
import { HistogramMark } from "./marks/extended/HistogramMark.js";
import { CandlestickMark } from "./marks/extended/CandlestickMark.js";
import { FunnelMark } from "./marks/extended/FunnelMark.js";
import { TreemapMark } from "./marks/extended/TreemapMark.js";
import { SankeyMark } from "./marks/extended/SankeyMark.js";

// Register defaults (idempotent).
registerMark("bar", BarMark);
registerMark("line", LineMark);
registerMark("area", AreaMark);
registerMark("point", PointMark);
registerMark("arc", ArcMark);
registerMark("radar", RadarMark);
registerMark("heatmap", HeatmapMark);
registerMark("boxplot", BoxPlotMark);
registerMark("histogram", HistogramMark);
registerMark("candlestick", CandlestickMark);
registerMark("funnel", FunnelMark);
registerMark("treemap", TreemapMark);
registerMark("sankey", SankeyMark);

/** Convenience factory. @param {HTMLElement|string} el @param {Object} config @returns {Chart} */
export function chart(el, config) {
  return new Chart(el, config);
}

export { Chart, registerMark, getMark, hasMark, listMarks };
export { Mark } from "./marks/Mark.js";
export { BarMark, LineMark, AreaMark, PointMark, ArcMark };
export {
  RadarMark,
  HeatmapMark,
  BoxPlotMark,
  HistogramMark,
  CandlestickMark,
  FunnelMark,
  TreemapMark,
  SankeyMark,
};
export { CanvasRenderer } from "./core/CanvasRenderer.js";
export { SvgRenderer } from "./core/SvgRenderer.js";
export { Renderer } from "./core/Renderer.js";
export { lightTheme } from "./theme/light.js";
export { darkTheme } from "./theme/dark.js";
export { lttb, minMaxDecimate } from "./data/decimate.js";
export { RingBuffer } from "./data/ringbuffer.js";
export * from "./scales/index.js";

export const version = "0.1.0";
export default { Chart, chart, registerMark, version };
