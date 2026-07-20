// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// monitor.js — wires MonitorSim + LombokCharts into a real-time monitoring board.
(function () {
  "use strict";
  function boot() {
    if (
      typeof LombokCharts === "undefined" ||
      typeof MonitorSim === "undefined"
    )
      return setTimeout(boot, 30);
    const { chart } = LombokCharts;
    const $ = (id) => document.getElementById(id);
    const root = document.documentElement;
    const M = MonitorSim.createMonitor();
    const charts = {};
    const sparks = {};
    let t = 0;

    const theme = () => lombokTheme();
    const GREEN = "#2f9e44",
      AMBER = "#f59f00",
      RED = "#e03131",
      ACCENT = "#5b9bff";
    const lvl = (v) => (v >= 85 ? RED : v >= 65 ? AMBER : GREEN);

    // ---- Gauges (CPU / Mem / Disk) ----
    const GAUGES = [
      ["cpu", "CPU"],
      ["mem", "Memory"],
      ["disk", "Disk"],
    ];
    function buildGauges() {
      const th = theme();
      GAUGES.forEach(([k, label]) => {
        if (charts["g_" + k]) charts["g_" + k].destroy();
        charts["g_" + k] = chart("#g_" + k, {
          data: [{ value: Math.round(M.metrics[k].value) }],
          mark: { type: "gauge", min: 0, max: 100 },
          color: lvl(M.metrics[k].value),
          theme: th,
          animate: false,
        });
      });
    }
    function refreshGauges() {
      GAUGES.forEach(([k]) => {
        charts["g_" + k].config.color = lvl(M.metrics[k].value);
        charts["g_" + k].update([{ value: Math.round(M.metrics[k].value) }]);
      });
    }

    // ---- Streaming metric cards (Network / RPS / Latency) ----
    const STREAMS = [
      ["net", "Network", "Mbps"],
      ["rps", "Requests", "req/s"],
      ["latency", "Latency", "ms"],
    ];
    function buildStreams() {
      const th = theme();
      STREAMS.forEach(([k]) => {
        if (charts["s_" + k]) charts["s_" + k].destroy();
        const seed = M.metrics[k].hist.slice(-120);
        charts["s_" + k] = chart("#s_" + k, {
          xs: Float64Array.from(seed.map((_, i) => i)),
          ys: Float64Array.from(seed),
          count: seed.length,
          mark: "area",
          theme: th,
          animate: false,
          axes: false,
          grid: false,
          tooltip: false,
          maxPoints: 120,
          margins: { top: 4, right: 4, bottom: 4, left: 4 },
          color: ACCENT,
        });
      });
    }

    // ---- Wide live throughput ----
    function buildWide() {
      const th = theme();
      if (charts.wide) charts.wide.destroy();
      const seed = M.metrics.rps.hist.slice(-120);
      charts.wide = chart("#wide", {
        xs: Float64Array.from(seed.map((_, i) => i)),
        ys: Float64Array.from(seed),
        count: seed.length,
        mark: "area",
        theme: th,
        animate: false,
        grid: true,
        tooltip: true,
        maxPoints: 120,
        color: "#3ad6ad",
        margins: { top: 12, right: 14, bottom: 22, left: 60 },
      });
    }

    // ---- Host table + sparklines ----
    function buildHosts() {
      Object.values(sparks).forEach((s) => s.destroy());
      $("hosts").querySelector("tbody").innerHTML = M.hosts
        .map(
          (h) =>
            `<tr><td><span class="dot ${h.status}" id="st_${h.name}"></span>${h.name}</td>` +
            `<td class="text-muted">${h.region}</td>` +
            `<td style="text-align:right" id="cpu_${h.name}">${Math.round(h.cpu)}%</td>` +
            `<td style="text-align:right" id="lat_${h.name}">${Math.round(h.latency)}ms</td>` +
            `<td><div class="spark" id="sp_${h.name}"></div></td></tr>`,
        )
        .join("");
      const th = theme();
      M.hosts.forEach((h) => {
        sparks[h.name] = chart("#sp_" + h.name, {
          xs: Float64Array.from(h.spark.map((_, i) => i)),
          ys: Float64Array.from(h.spark),
          count: h.spark.length,
          mark: "line",
          theme: th,
          animate: false,
          axes: false,
          grid: false,
          tooltip: false,
          margins: { top: 3, right: 3, bottom: 3, left: 3 },
          color: ACCENT,
        });
      });
    }

    // ---- Live loop ----
    function refresh() {
      M.tick();
      t++;
      refreshGauges();
      STREAMS.forEach(([k, , unit]) => {
        charts["s_" + k].appendData({ x: t + 120, y: M.metrics[k].value });
        $("v_" + k).textContent = Math.round(
          M.metrics[k].value,
        ).toLocaleString();
      });
      charts.wide.appendData({ x: t + 120, y: M.metrics.rps.value });
      M.hosts.forEach((h) => {
        const st = $("st_" + h.name);
        if (st) st.className = "dot " + h.status;
        const c = $("cpu_" + h.name);
        if (c) c.textContent = Math.round(h.cpu) + "%";
        const l = $("lat_" + h.name);
        if (l) l.textContent = Math.round(h.latency) + "ms";
        sparks[h.name].appendData({ x: t, y: h.latency });
      });
      const health = M.health();
      const pill = $("health");
      pill.textContent =
        health === "operational"
          ? "All systems operational"
          : health === "warning"
            ? "Degraded performance"
            : "Incident";
      pill.className =
        "badge badge-pill " +
        (health === "operational"
          ? "badge-success"
          : health === "warning"
            ? "badge-warning"
            : "badge-danger");
    }

    function rebuild() {
      buildGauges();
      buildStreams();
      buildWide();
      buildHosts();
    }

    $("style").onchange = (e) => {
      root.setAttribute("data-style", e.target.value);
      rebuild();
    };
    $("theme").onclick = (e) => {
      const d = root.getAttribute("data-theme") === "dark";
      root.setAttribute("data-theme", d ? "light" : "dark");
      e.target.textContent = d ? "Dark" : "Light";
      rebuild();
    };

    rebuild();
    setInterval(refresh, 800);
  }
  boot();
})();
