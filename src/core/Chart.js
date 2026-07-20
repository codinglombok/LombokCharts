// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/core/Chart.js
// Orchestrates the lifecycle: init -> measure -> layout -> scales -> render ->
// update/appendData/stream -> destroy. Wires marks, theme, interaction and live.
import { CanvasRenderer } from "./CanvasRenderer.js";
import { SvgRenderer } from "./SvgRenderer.js";
import { Scene, formatNumber } from "./Scene.js";
import { Emitter } from "./events.js";
import { getMark } from "../registry.js";
import { toSeries } from "../data/adapter.js";
import { RingBuffer } from "../data/ringbuffer.js";
import { linearScale } from "../scales/linear.js";
import { logScale } from "../scales/log.js";
import { timeScale } from "../scales/time.js";
import { bandScale } from "../scales/band.js";
import { categoricalScale } from "../scales/color.js";
import { lightTheme } from "../theme/light.js";
import { darkTheme } from "../theme/dark.js";
import { deepMerge } from "../utils/math.js";
import { FrameScheduler, raf } from "../utils/raf.js";
import { Quadtree } from "../interaction/quadtree.js";
import { Tooltip } from "../interaction/tooltip.js";
import { Legend } from "../interaction/legend.js";
import { ZoomPan } from "../interaction/zoom.js";
import { StreamScheduler } from "../stream/scheduler.js";
import { connectStream } from "../stream/stream.js";

/**
 * @typedef {Object} DrawContext
 * @property {import('./Renderer.js').Renderer} r
 * @property {Function} sx @property {Function} sy
 * @property {Array<any>} series
 * @property {Object} opts
 * @property {Function} color
 * @property {Object} theme
 * @property {{x:number,y:number,width:number,height:number}} area
 * @property {Array<any>} hits
 * @property {number} t
 * @property {Array<any>} rawData
 */

const ALIASES = {
  column: { type: "bar", mode: "vertical" },
  bar: { type: "bar", mode: "vertical" },
  hbar: { type: "bar", mode: "horizontal" },
  stackedbar: { type: "bar", mode: "stacked" },
  groupedbar: { type: "bar", mode: "grouped" },
  waterfall: { type: "bar", mode: "waterfall" },
  line: { type: "line", mode: "line" },
  spline: { type: "line", mode: "spline" },
  step: { type: "line", mode: "step" },
  area: { type: "area", mode: "area" },
  stackedarea: { type: "area", mode: "stacked" },
  streamgraph: { type: "area", mode: "streamgraph" },
  scatter: { type: "point", mode: "scatter" },
  bubble: { type: "point", mode: "bubble" },
  pie: { type: "arc", mode: "pie" },
  donut: { type: "arc", mode: "donut" },
  gauge: { type: "arc", mode: "gauge" },
  radialbar: { type: "arc", mode: "radial-bar" },
};

export class Chart {
  /**
   * @param {HTMLElement|string} container
   * @param {Object} config
   */
  constructor(container, config) {
    this.container =
      typeof container === "string"
        ? document.querySelector(container)
        : container;
    if (!this.container) throw new Error("LombokCharts: container not found");
    this.config = config || {};
    this.emitter = new Emitter();
    this._destroyed = false;
    this._animT = 1;
    this._xWindow = null; // zoom/pan window over numeric x
    this._hidden = new Set();
    this._hits = [];
    this._crosshairX = null;
    this._init();
  }

  on(type, fn) {
    return this.emitter.on(type, fn);
  }

  _init() {
    const c = this.container;
    c.style.position = c.style.position || "relative";
    this._wrap = document.createElement("div");
    this._wrap.style.position = "relative";
    c.appendChild(this._wrap);

    this.theme = this._resolveTheme(this.config.theme);
    this.scene = new Scene(this.theme);
    this.color = categoricalScale(this.theme.palette);

    const size = this._measure();
    const RendererCls =
      this.config.renderer === "svg" ? SvgRenderer : CanvasRenderer;
    this.renderer = new RendererCls(this._wrap, size).mount();

    // a11y
    const el = this.renderer.canvas || this.renderer.svg;
    el.setAttribute("role", "img");
    el.setAttribute(
      "aria-label",
      (this.config.a11y && this.config.a11y.label) ||
        this.config.title ||
        "Chart",
    );
    this._sr = document.createElement("div");
    Object.assign(this._sr.style, {
      position: "absolute",
      width: "1px",
      height: "1px",
      overflow: "hidden",
      clip: "rect(0 0 0 0)",
    });
    this._wrap.appendChild(this._sr);

    if (this.config.tooltip !== false)
      this.tooltip = new Tooltip(this._wrap, this.theme);
    this._bindPointer();

    if (this.config.zoom) {
      this.zoom = new ZoomPan(
        el,
        () => ({ x: this._xWindow || this._fullX, full: this._fullX }),
        (win) => {
          this._xWindow = win;
          this._draw(this.renderer);
          this._buildQuadtree();
        },
      );
    }

    // ResizeObserver for responsiveness
    if (typeof ResizeObserver !== "undefined") {
      this._ro = new ResizeObserver(() => this.resize());
      this._ro.observe(c);
    }

    // Live infrastructure
    this._streamSched = new StreamScheduler((batch) => this._liveFlush(batch));
    this._streamHandle = null;

    this.render();
  }

  _resolveTheme(t) {
    if (!t || t === "light") return lightTheme;
    if (t === "dark") return darkTheme;
    if (typeof t === "object")
      return deepMerge(t.name === "dark" ? darkTheme : lightTheme, t);
    return lightTheme;
  }

  _measure() {
    const rect = this.container.getBoundingClientRect();
    const w = this.config.width || rect.width || 640;
    const legendH =
      this.config.legend !== false && this._needsLegend() ? 30 : 0;
    const h = (this.config.height || rect.height || 360) - legendH;
    return { width: Math.max(1, w), height: Math.max(1, h) };
  }

  _needsLegend() {
    const m = this._resolveMark();
    if (this.config.legend === true) return true;
    return (
      ["arc", "radar"].includes(m.type) ||
      (this.config.series && this.config.series.length > 1)
    );
  }

  _resolveMark() {
    let m = this.config.mark || "line";
    if (typeof m === "string") {
      const key = m.toLowerCase().replace(/[-_\s]/g, "");
      return { ...(ALIASES[key] || { type: key, mode: undefined }) };
    }
    const key = String(m.type)
      .toLowerCase()
      .replace(/[-_\s]/g, "");
    const base = ALIASES[key] || { type: m.type };
    return { ...base, ...m, type: base.type };
  }

  _resolveSeries() {
    const cfg = this.config;
    // Raw typed-array path (big data / live): xs + ys provided directly.
    if (cfg.xs && cfg.ys) {
      return [
        {
          key: "raw",
          label: cfg.label || "Series",
          xs: cfg.xs,
          ys: cfg.ys,
          count: cfg.count != null ? cfg.count : cfg.ys.length,
          categories: null,
          color: cfg.color,
          visible: !this._hidden.has(0),
        },
      ];
    }
    const data = cfg.data || [];
    if (cfg.series && cfg.series.length) {
      return cfg.series.map((sd, i) => {
        const s = toSeries(data, cfg.x || "x", sd.y || sd.key);
        return {
          key: sd.key || sd.y,
          label: sd.label || sd.key || sd.y,
          xs: s.xs,
          ys: s.ys,
          count: s.count,
          categories: s.categories,
          color: sd.color,
          visible: !this._hidden.has(i),
        };
      });
    }
    const s = toSeries(data, cfg.x || "label", cfg.y || "value");
    const out = {
      key: "value",
      label: cfg.label || "value",
      xs: s.xs,
      ys: s.ys,
      count: s.count,
      categories: s.categories,
      color: cfg.color,
      visible: !this._hidden.has(0),
    };
    if (cfg.size) {
      const sz = toSeries(data, cfg.x || "label", cfg.size);
      out.sizes = sz.ys;
    }
    return [out];
  }

  _buildScale(hint, range) {
    if (!hint) return linearScale([0, 1], range);
    if (hint.type === "band")
      return bandScale(hint.values, range, { padding: 0.18 });
    if (hint.type === "time") return timeScale(hint.domain, range);
    if (hint.type === "log") return logScale(hint.domain, range);
    return linearScale(hint.domain, range);
  }

  _layout() {
    const t = this.theme;
    const hasTitle = !!this.config.title;
    const markDef = this._resolveMark();
    const horizontal = markDef.type === "bar" && markDef.mode === "horizontal";
    const def = {
      top: hasTitle ? 34 : 14,
      right: 16,
      bottom: 38,
      left: horizontal ? 90 : 56,
    };
    const m = { ...def, ...(this.config.margins || {}) };
    return this.scene.computePlotArea(
      this.renderer.width,
      this.renderer.height,
      m,
    );
  }

  _draw(renderer) {
    const t = this.theme;
    renderer.beginFrame();
    if (renderer.type === "canvas") {
      renderer.rect(0, 0, renderer.width, renderer.height, {
        fill: t.colors.background,
      });
    }
    const markDef = this._resolveMark();
    const MarkCls = getMark(markDef.type);
    if (!MarkCls) {
      this._error(renderer, `Unknown mark: ${markDef.type}`);
      return;
    }
    const mark = new MarkCls(markDef);
    const series = this._resolveSeries();
    const rawData = this.config.data || [];

    if (!series.length || (series[0].count === 0 && rawData.length === 0)) {
      this._empty(renderer);
      renderer.endFrame();
      return;
    }

    const area = this._layout();
    const coord = mark.coordinate();
    const hits = [];
    const ctx = {
      r: renderer,
      series,
      opts: markDef,
      color: this.color,
      theme: t,
      area,
      hits,
      t: this._animT,
      rawData,
      width: renderer.width,
      height: renderer.height,
    };

    // Title
    if (this.config.title)
      renderer.text(area.x, 20, this.config.title, {
        fill: t.colors.text,
        size: 15,
        weight: "bold",
        family: t.typography.family,
        baseline: "middle",
      });

    let mainSx = null;
    if (coord === "cartesian") {
      const horizontal =
        markDef.type === "bar" && markDef.mode === "horizontal";
      const domains = mark.domains(series, markDef, rawData);
      let sx, sy;
      if (horizontal) {
        sx = linearScale(domains.y.domain, [area.x, area.x + area.width]);
        sy = bandScale(domains.x.values, [area.y, area.y + area.height], {
          padding: 0.18,
        });
      } else {
        let xdom = domains.x;
        if (this.config.xPad && xdom && xdom.type !== "band" && xdom.domain) {
          const p = this.config.xPad;
          xdom = Object.assign({}, xdom, {
            domain: [xdom.domain[0] - p, xdom.domain[1] + p],
          });
        }
        sx = this._buildScale(xdom, [area.x, area.x + area.width]);
        sy = linearScale(domains.y.domain, [area.y + area.height, area.y]);
      }
      // apply zoom window over numeric x
      if (sx.kind !== "band") {
        this._fullX = sx.domain.slice();
        if (this._xWindow)
          sx = (
            domains.x.type === "time"
              ? timeScale
              : domains.x.type === "log"
                ? logScale
                : linearScale
          )(this._xWindow, [area.x, area.x + area.width]);
      }
      ctx.sx = sx;
      ctx.sy = sy;
      mainSx = sx;
      if (this.config.axes !== false)
        this.scene.drawAxes(
          renderer,
          area,
          { x: sx, y: sy },
          {
            xLabel: this.config.xLabel,
            yLabel: this.config.yLabel,
            showGrid: this.config.grid !== false,
          },
        );
      mark.draw(ctx);
      // synchronized crosshair overlay (drawn on top of the mark)
      if (this._crosshairX != null) {
        const cx = sx(this._crosshairX);
        if (cx >= area.x - 1 && cx <= area.x + area.width + 1)
          renderer.line(cx, area.y, cx, area.y + area.height, {
            stroke: t.colors.text,
            width: 1,
            opacity: 0.5,
            dash: [4, 4],
          });
      }
    } else {
      mark.draw(ctx);
    }

    renderer.endFrame();
    if (renderer === this.renderer) {
      this._hits = hits;
      this._lastMark = mark;
      this.lastStats = ctx.stats || { drawn: 0 };
      this._sxMain = mainSx;
      this._plotArea = area;
      this._coordMain = coord;
      this._updateA11y(series, mark);
      if (this.config.legend !== false && this._needsLegend())
        this._renderLegend(mark, series, ctx);
    }
  }

  _error(renderer, msg) {
    renderer.text(renderer.width / 2, renderer.height / 2, msg, {
      fill: this.theme.semantic.negative,
      size: 14,
      align: "center",
      baseline: "middle",
      family: this.theme.typography.family,
    });
    renderer.endFrame();
  }
  _empty(renderer) {
    renderer.text(
      renderer.width / 2,
      renderer.height / 2,
      this.config.emptyText || "No data",
      {
        fill: this.theme.colors.muted,
        size: 14,
        align: "center",
        baseline: "middle",
        family: this.theme.typography.family,
      },
    );
  }

  _updateA11y(series, mark) {
    const total = series.reduce((s, x) => s + x.count, 0);
    const summary = `${this.config.title || "Chart"}: ${this._resolveMark().type} with ${series.length} series, ${total} data points.`;
    this._sr.textContent =
      (this.config.a11y && this.config.a11y.description) || summary;
    const el = this.renderer.canvas || this.renderer.svg;
    el.setAttribute("aria-label", summary);
  }

  _renderLegend(mark, series, ctx) {
    const items = mark.legendItems ? mark.legendItems(series, ctx) : null;
    if (!items) {
      if (this.legend) {
        this.legend.destroy();
        this.legend = null;
      }
      return;
    }
    if (!this.legend)
      this.legend = new Legend(this.container, this.theme, (i, visible) => {
        if (visible) this._hidden.delete(i);
        else this._hidden.add(i);
        // arc/radar toggle by slice index isn't series-based; re-render handles series marks
        this.render(false);
      });
    this.legend.render(
      items.map((it, i) => ({ ...it, visible: !this._hidden.has(i) })),
    );
  }

  _buildQuadtree() {
    const area = this._layout();
    this._qt = new Quadtree(
      area.x - 5,
      0,
      area.x + area.width + 5,
      this.renderer.height,
    );
    for (const h of this._hits) this._qt.insert(h.x, h.y, this._hitsIndex(h));
    this._qtHits = this._hits;
  }
  _hitsIndex(h) {
    return this._hits.indexOf(h);
  }

  _bindPointer() {
    const el = this.renderer.canvas || this.renderer.svg;
    this._onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left,
        py = e.clientY - rect.top;
      if (this._qt && this.tooltip) {
        const hit = this._qt.nearest(px, py, 40);
        if (hit) {
          const h = this._qtHits[hit.index];
          const valTxt =
            typeof h.value === "number" ? formatNumber(h.value) : h.value;

          const esc = (v) =>
            String(v)
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#39;");
          this.tooltip.show(
            h.x,
            h.y,
            `<strong>${h.label != null ? esc(h.label) : ""}</strong><br>${esc(valTxt)}${h.extra ? "<br>" + esc(h.extra) : ""}`,
          );

          this.emitter.emit("hover", h);
        } else this.tooltip.hide();
      }
      if (
        this.config.crosshair &&
        this._coordMain === "cartesian" &&
        this._sxMain
      ) {
        const dx = this._domainXAt(px);
        if (dx !== this._crosshairX) {
          this._crosshairX = dx;
          this._draw(this.renderer);
          this.emitter.emit("crosshair", { x: dx, px: px });
        }
      }
    };
    this._onLeave = () => {
      if (this.tooltip) this.tooltip.hide();
      if (this.config.crosshair && this._crosshairX != null) {
        this._crosshairX = null;
        this._draw(this.renderer);
        this.emitter.emit("crosshair", null);
      }
    };
    this._onClick = (e) => {
      if (!this._qt) return;
      const rect = el.getBoundingClientRect();
      const hit = this._qt.nearest(
        e.clientX - rect.left,
        e.clientY - rect.top,
        40,
      );
      if (hit) this.emitter.emit("select", this._qtHits[hit.index]);
    };
    el.addEventListener("mousemove", this._onMove);
    el.addEventListener("mouseleave", this._onLeave);
    el.addEventListener("click", this._onClick);
  }

  /** Map a pixel x to a domain x using the last-drawn x scale. @param {number} px */
  _domainXAt(px) {
    const sx = this._sxMain;
    if (!sx) return null;
    if (typeof sx.invert === "function") return sx.invert(px);
    if (
      sx.kind === "band" &&
      typeof sx.center === "function" &&
      Array.isArray(sx.domain)
    ) {
      let best = null,
        bd = Infinity;
      for (const cat of sx.domain) {
        const d = Math.abs(sx.center(cat) - px);
        if (d < bd) {
          bd = d;
          best = cat;
        }
      }
      return best;
    }
    return null;
  }

  /**
   * Draw (or clear) a vertical crosshair at a domain-x value without emitting an
   * event — used to mirror a crosshair from another chart (multi-panel sync).
   * @param {number|string|null} x
   */
  setCrosshair(x) {
    if (this._destroyed) return this;
    this._crosshairX = x;
    this._draw(this.renderer);
    return this;
  }

  /* ---------------------------- public API ---------------------------- */

  /** Full render. @param {boolean} [animate] */
  render(animate) {
    if (this._destroyed) return this;
    const total = this._resolveSeries().reduce((s, x) => s + x.count, 0);
    const doAnim =
      animate !== false &&
      this.config.animate !== false &&
      total <= 50000 &&
      this._lastMark === undefined;
    if (doAnim) {
      const start = performance.now();
      const dur = this.theme.motion.duration;
      const tick = (now) => {
        const p = Math.min(1, (now - start) / dur);
        this._animT = this.theme.motion.easing(p);
        this._draw(this.renderer);
        if (p < 1 && !this._destroyed) raf(tick);
        else {
          this._animT = 1;
          this._buildQuadtree();
          this._fitLegend();
        }
      };
      raf(tick);
    } else {
      this._animT = 1;
      this._draw(this.renderer);
      this._buildQuadtree();
    }
    this._scheduleFitLegend();
    return this;
  }

  /** Replace data and re-render. @param {Array<any>|{xs:Float64Array,ys:Float64Array,count?:number}} newData */
  update(newData) {
    if (Array.isArray(newData)) this.config.data = newData;
    else if (newData && newData.xs) {
      this.config.xs = newData.xs;
      this.config.ys = newData.ys;
      this.config.count = newData.count;
    }
    this._lastMark = undefined; // allow re-animate
    this.render();
    return this;
  }

  /**
   * Append data point(s) for live charts. Throttled to one redraw per frame.
   * @param {{x:number,y:number}|Array<{x:number,y:number}>} point
   */
  appendData(point) {
    this._ensureLiveStore();
    this._streamSched.push(point);
    return this;
  }

  _ensureLiveStore() {
    if (this._live) return;
    const max = this.config.maxPoints || 0;
    if (max > 0) {
      this._live = { ring: new RingBuffer(max) };
      const s = this._resolveSeries()[0];
      if (s)
        for (let i = 0; i < s.count; i++)
          this._live.ring.push(s.xs[i], s.ys[i]);
    } else {
      const s = this._resolveSeries()[0];
      const cap = Math.max(64, (s ? s.count : 0) * 2);
      this._live = {
        xs: growFrom(s, "xs", cap),
        ys: growFrom(s, "ys", cap),
        count: s ? s.count : 0,
      };
    }
  }

  _liveFlush(batch) {
    if (this._destroyed) return;
    const L = this._live;
    if (L.ring) {
      for (const p of batch) L.ring.push(p.x, p.y);
      const a = L.ring.toArrays();
      this.config.xs = a.xs;
      this.config.ys = a.ys;
      this.config.count = a.count;
    } else {
      for (const p of batch) {
        if (L.count >= L.xs.length) {
          L.xs = grow(L.xs);
          L.ys = grow(L.ys);
        }
        L.xs[L.count] = p.x;
        L.ys[L.count] = p.y;
        L.count++;
      }
      this.config.xs = L.xs;
      this.config.ys = L.ys;
      this.config.count = L.count;
    }
    // Throttled full redraw within a single rAF -> flicker-free 60fps.
    this._animT = 1;
    this._draw(this.renderer);
    this._buildQuadtree();
    this.emitter.emit("append", batch);
  }

  /** Connect a streaming source. @param {any} source @param {(raw:any)=>{x:number,y:number}} [map] */
  stream(source, map) {
    this._ensureLiveStore();
    this._streamHandle = connectStream(source, (p) => this.appendData(p), map);
    return this;
  }
  stopStream() {
    if (this._streamHandle) this._streamHandle.stop();
    this._streamHandle = null;
    return this;
  }

  /** @param {'light'|'dark'|object} theme */
  setTheme(theme) {
    this.theme = this._resolveTheme(theme);
    this.color = categoricalScale(this.theme.palette);
    this.scene.setTheme(this.theme);
    if (this.tooltip) this.tooltip.setTheme(this.theme);
    if (this.legend) this.legend.setTheme(this.theme);
    this._lastMark = undefined;
    this.render(false);
    return this;
  }

  resize() {
    if (this._destroyed) return this;
    const size = this._measure();
    this.renderer.resize(size.width, size.height);
    this._draw(this.renderer);
    this._buildQuadtree();
    this._scheduleFitLegend();
    return this;
  }

  /** Reconcile canvas height with the legend's real height so it never clips. */
  _scheduleFitLegend() {
    if (typeof requestAnimationFrame === "undefined") return;
    requestAnimationFrame(() => this._fitLegend());
  }
  _fitLegend() {
    if (this._destroyed || !this.legend || !this.legend.el) return;
    const lh = this.legend.el.offsetHeight || 0;
    if (!lh) return;
    const rect = this.container.getBoundingClientRect();
    const target = Math.max(48, (this.config.height || rect.height || 0) - lh);
    if (target && Math.abs(this.renderer.height - target) > 2) {
      this.renderer.resize(this.renderer.width, target);
      this._draw(this.renderer);
      this._buildQuadtree();
    }
  }

  /** @returns {string} PNG data URL. */
  toPNG() {
    if (this.renderer.type === "canvas") {
      this._draw(this.renderer);
      return this.renderer.toDataURL();
    }
    // SVG renderer: rasterize via a temporary canvas renderer.
    const tmp = new CanvasRenderer(document.createElement("div"), {
      width: this.renderer.width,
      height: this.renderer.height,
    });
    tmp.mount();
    const saveHits = this._hits;
    this._draw(tmp);
    this._hits = saveHits;
    const url = tmp.toDataURL();
    tmp.destroy();
    return url;
  }

  /** @returns {string} serialized SVG markup. */
  toSVG() {
    const tmp = new SvgRenderer(document.createElement("div"), {
      width: this.renderer.width,
      height: this.renderer.height,
    });
    tmp.mount();
    const saveHits = this._hits;
    this._draw(tmp);
    this._hits = saveHits;
    const svg = tmp.toSVGString();
    tmp.destroy();
    return svg;
  }

  destroy() {
    this._destroyed = true;
    this._streamSched.cancel();
    this.stopStream();
    if (this._ro) this._ro.disconnect();
    const el = this.renderer.canvas || this.renderer.svg;
    el.removeEventListener("mousemove", this._onMove);
    el.removeEventListener("mouseleave", this._onLeave);
    el.removeEventListener("click", this._onClick);
    if (this.zoom) this.zoom.destroy();
    if (this.tooltip) this.tooltip.destroy();
    if (this.legend) this.legend.destroy();
    this.renderer.destroy();
    if (this._wrap.parentNode) this._wrap.parentNode.removeChild(this._wrap);
    this.emitter.clear();
  }
}

function grow(arr) {
  const n = new Float64Array(arr.length * 2);
  n.set(arr);
  return n;
}
function growFrom(series, key, cap) {
  const n = new Float64Array(cap);
  if (series && series[key]) n.set(series[key].subarray(0, series.count));
  return n;
}
