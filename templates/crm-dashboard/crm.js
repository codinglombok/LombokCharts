// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// crm.js — wires CrmSim + LombokCharts into an admin/CRM dashboard.
(function () {
  "use strict";
  function boot() {
    if (typeof LombokCharts === "undefined" || typeof CrmSim === "undefined")
      return setTimeout(boot, 30);
    const { chart } = LombokCharts;
    const $ = (id) => document.getElementById(id);
    const root = document.documentElement;
    const C = CrmSim.createCrm();
    const charts = {};
    const sparks = {};
    const GREEN = "#2f9e44",
      RED = "#e03131",
      ACCENT = "#5b9bff";

    const theme = () => lombokTheme();
    const usd = (n) =>
      n >= 10000
        ? "$" + (n / 1000).toFixed(1) + "K"
        : "$" + Math.round(n).toLocaleString();
    const fmt = {
      usd: usd,
      int: (n) => Math.round(n).toLocaleString(),
      pct: (n) => n.toFixed(1) + "%",
    };
    const initials = (name) =>
      name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    const stageBadge = {
      Lead: "badge-soft",
      Qualified: "badge-info",
      Proposal: "badge-warning",
      Negotiation: "badge-primary",
      Won: "badge-success",
    };

    // KPIs
    const KPI = [
      ["customers", "Customers"],
      ["openDeals", "Open Deals"],
      ["mrr", "MRR"],
      ["winRate", "Win Rate"],
    ];
    function buildKpis() {
      $("kpis").innerHTML = KPI.map(
        ([k, t]) =>
          `<div class="card"><div class="card-body">
          <div class="flex items-center justify-between"><span class="text-muted text-sm">${t}</span><span class="badge badge-pill" id="d_${k}">—</span></div>
          <div class="stat-value num" id="v_${k}">—</div><div class="spark" id="sp_${k}"></div>
        </div></div>`,
      ).join("");
    }
    function refreshKpis() {
      const k = C.kpis();
      Object.values(sparks).forEach((s) => s.destroy());
      KPI.forEach(([key]) => {
        const d = k[key],
          up = d.delta >= 0;
        $("v_" + key).textContent = fmt[d.fmt](d.value);
        const b = $("d_" + key);
        b.textContent = (up ? "+" : "") + d.delta.toFixed(1) + "%";
        b.className =
          "badge badge-pill " + (up ? "badge-success" : "badge-danger");
        sparks[key] = chart("#sp_" + key, {
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

    function buildCharts() {
      Object.values(charts).forEach((c) => c && c.destroy());
      const th = theme();
      charts.pipeline = chart("#pipeline", {
        data: C.pipeline(),
        mark: "funnel",
        theme: th,
        animate: false,
      });
      charts.revenue = chart("#revenue", {
        data: C.revenue(),
        mark: "bar",
        theme: th,
        animate: false,
        tooltip: true,
        color: ACCENT,
      });
      charts.reps = chart("#reps", {
        data: C.reps(),
        mark: "hbar",
        theme: th,
        animate: false,
        tooltip: true,
      });
      charts.sources = chart("#sources", {
        data: C.leadSources(),
        mark: "donut",
        theme: th,
        animate: false,
      });
      const f = C.flow();
      charts.flow = chart("#flow", {
        data: [{}],
        mark: { type: "sankey", nodes: f.nodes, links: f.links },
        theme: th,
        animate: false,
      });
    }

    function renderFeed() {
      $("feed").innerHTML = C.activity()
        .map(
          (a) =>
            `<div class="it"><span class="avatar">${initials(a.who)}</span>` +
            `<span><strong>${a.who}</strong> ${a.action} · <span class="text-muted">${a.company}</span></span>` +
            `<span class="text-muted num">${a.mins}m</span></div>`,
        )
        .join("");
    }
    function renderContacts() {
      $("contacts").querySelector("tbody").innerHTML = C.contacts()
        .map(
          (c) =>
            `<tr><td>${c.name}</td><td class="text-muted">${c.company}</td>` +
            `<td><span class="badge badge-pill ${stageBadge[c.stage] || "badge-soft"}">${c.stage}</span></td>` +
            `<td style="text-align:right">$${(c.value / 1000).toFixed(0)}K</td><td class="text-muted">${c.owner}</td></tr>`,
        )
        .join("");
    }

    function rebuild() {
      buildCharts();
      refreshKpis();
      renderFeed();
      renderContacts();
    }

    // sidebar nav (visual)
    document.querySelectorAll(".side-nav a").forEach((a) =>
      a.addEventListener("click", (e) => {
        e.preventDefault();
        document
          .querySelectorAll(".side-nav a")
          .forEach((x) => x.classList.remove("active"));
        a.classList.add("active");
        $("pageTitle").textContent = a.dataset.page || "Dashboard";
      }),
    );

    buildKpis();
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
  }
  boot();
})();
