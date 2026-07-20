// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// analytics.js — wires AnalyticsSim + LombokCharts into an analytics dashboard.
(function () {
  "use strict";
  function boot() {
    if (
      typeof LombokCharts === "undefined" ||
      typeof AnalyticsSim === "undefined"
    )
      return setTimeout(boot, 30);
    const { chart } = LombokCharts;
    const $ = (id) => document.getElementById(id);
    const root = document.documentElement;
    const GREEN = "#2f9e44",
      RED = "#e03131";
    const A = AnalyticsSim.createAnalytics();
    let range = 30,
      revType = "area";
    const charts = {};
    const sparks = {};

    const theme = () => lombokTheme();

    const commas = (n) => Math.round(n).toLocaleString();
    const usd = (n) =>
      n >= 10000
        ? "$" + (n / 1000).toFixed(1) + "K"
        : "$" + n.toLocaleString(undefined, { maximumFractionDigits: 2 });
    const fmt = { usd: usd, int: commas, pct: (n) => n.toFixed(1) + "%" };

    // ---- KPI cards ----
    const KPI_META = [
      { key: "revenue", title: "Revenue" },
      { key: "users", title: "Users" },
      { key: "conversion", title: "Conversion" },
      { key: "aov", title: "Avg Order Value" },
    ];
    function buildKpis() {
      $("kpis").innerHTML = KPI_META.map(
        (m) =>
          `<div class="card"><div class="card-body">
           <div class="flex items-center justify-between">
             <span class="stat-label text-muted text-sm">${m.title}</span>
             <span class="badge badge-pill" id="d_${m.key}">—</span>
           </div>
           <div class="stat-value num" id="v_${m.key}">—</div>
           <div class="spark" id="sp_${m.key}"></div>
         </div></div>`,
      ).join("");
    }
    function refreshKpis() {
      const k = A.kpis(range);
      Object.values(sparks).forEach((s) => s.destroy());
      KPI_META.forEach((m) => {
        const d = k[m.key];
        $("v_" + m.key).textContent = fmt[d.fmt](d.value);
        const badge = $("d_" + m.key);
        const up = d.delta >= 0;
        badge.textContent = (up ? "+" : "") + d.delta.toFixed(1) + "%";
        badge.className =
          "badge badge-pill " + (up ? "badge-success" : "badge-danger");
        sparks[m.key] = chart("#sp_" + m.key, {
          xs: Float64Array.from(d.spark.map((_, i) => i)),
          ys: Float64Array.from(d.spark),
          count: d.spark.length,
          mark: "area",
          theme: theme(),
          animate: false,
          axes: false,
          grid: false,
          tooltip: false,
          margins: { top: 3, right: 2, bottom: 2, left: 2 },
          color: up ? GREEN : RED,
        });
      });
    }

    // ---- Main charts ----
    function buildCharts() {
      Object.values(charts).forEach((c) => c && c.destroy());
      const th = theme();
      charts.revenue = chart("#revenue", {
        data: A.revenueSeries(range),
        x: "t",
        y: "value",
        mark: {
          type: revType === "area" ? "area" : "line",
          mode: revType === "area" ? "area" : "spline",
          xScale: "time",
        },
        theme: th,
        animate: false,
        grid: true,
        tooltip: true,
        color: "#5b9bff",
        margins: { top: 12, right: 16, bottom: 26, left: 62 },
      });
      charts.traffic = chart("#traffic", {
        data: A.trafficSources(),
        mark: "donut",
        theme: th,
        animate: false,
      });
      charts.channels = chart("#channels", {
        data: A.topChannels(),
        mark: "hbar",
        theme: th,
        animate: false,
        tooltip: true,
      });
      charts.category = chart("#category", {
        data: A.categories(),
        mark: "treemap",
        theme: th,
        animate: false,
      });
      charts.activity = chart("#activity", {
        data: A.activity(),
        mark: "heatmap",
        theme: th,
        animate: false,
      });
    }

    // ---- Recent orders ----
    function renderOrders() {
      const rows = A.recentOrders(8)
        .map(
          (o) =>
            `<tr><td>${o.id}</td><td>${o.customer}</td><td style="text-align:right">$${o.amount.toFixed(2)}</td>` +
            `<td><span class="dot ${o.status}"></span>${o.status}</td><td style="text-align:right" class="text-muted">${o.mins}m ago</td></tr>`,
        )
        .join("");
      $("orders").querySelector("tbody").innerHTML = rows;
    }

    function rebuildAll() {
      buildCharts();
      refreshKpis();
      renderOrders();
    }

    // ---- Controls ----
    buildKpis();
    $("range").onchange = (e) => {
      range = +e.target.value;
      buildCharts();
      refreshKpis();
    };
    $("revType").onchange = (e) => {
      revType = e.target.value;
      buildCharts();
    };
    $("style").onchange = (e) => {
      root.setAttribute("data-style", e.target.value);
      rebuildAll();
    };
    $("theme").onclick = (e) => {
      const dark = root.getAttribute("data-theme") === "dark";
      root.setAttribute("data-theme", dark ? "light" : "dark");
      e.target.textContent = dark ? "Dark mode" : "Light mode";
      rebuildAll();
    };
    rebuildAll();
  }
  boot();
})();
