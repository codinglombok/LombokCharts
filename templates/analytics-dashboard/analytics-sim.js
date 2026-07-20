// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// analytics-sim.js — zero-dependency synthetic business-analytics data.
// Browser: window.AnalyticsSim. Node (tests): module.exports.
(function (root) {
  "use strict";
  function randn() {
    let u = 0,
      v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  const DAY = 86400000;

  /** A daily trend with drift + noise + weekly seasonality. */
  function trend(days, start, driftPct, noisePct, endTime) {
    endTime = endTime || Date.now();
    const out = [];
    let v = start;
    for (let i = days - 1; i >= 0; i--) {
      const season = 1 + 0.12 * Math.sin((i / 7) * Math.PI * 2); // weekly wave
      v = Math.max(1, v * (1 + driftPct + noisePct * randn()));
      out.push({ t: endTime - i * DAY, value: Math.round(v * season) });
    }
    return out;
  }

  function sum(a, key) {
    return a.reduce((s, x) => s + (key ? x[key] : x), 0);
  }

  /**
   * Build a coherent analytics snapshot with 90 days of history that can be
   * re-scoped to a shorter range, computing period-over-period deltas.
   */
  function createAnalytics(opt) {
    opt = opt || {};
    const HIST = 90;
    const revenue = trend(HIST, 5200, 0.0022, 0.05);
    const users = trend(HIST, 1800, 0.0025, 0.045);
    const orders = revenue.map((r, i) => ({
      t: r.t,
      value: Math.max(1, Math.round(r.value / (60 + randn() * 8))),
    }));

    function delta(arr, days) {
      const cur = arr.slice(-days),
        prev = arr.slice(-2 * days, -days);
      const c = sum(cur, "value"),
        p = sum(prev, "value") || 1;
      return ((c - p) / p) * 100;
    }
    function spark(arr, days) {
      return arr.slice(-days).map((d) => d.value);
    }

    return {
      DAY: DAY,
      revenue: revenue,
      users: users,
      orders: orders,
      /** KPI cards for a given range (7/30/90). */
      kpis: function (days) {
        const rev = sum(revenue.slice(-days), "value");
        const usr = sum(users.slice(-days), "value");
        const ord = sum(orders.slice(-days), "value");
        const conv = (ord / usr) * 100;
        const aov = rev / ord;
        return {
          revenue: {
            value: rev,
            delta: delta(revenue, days),
            spark: spark(revenue, days),
            fmt: "usd",
          },
          users: {
            value: usr,
            delta: delta(users, days),
            spark: spark(users, days),
            fmt: "int",
          },
          conversion: {
            value: conv,
            delta: delta(orders, days) - delta(users, days),
            spark: spark(orders, days).map(
              (v, i) => (v / (spark(users, days)[i] || 1)) * 100,
            ),
            fmt: "pct",
          },
          aov: {
            value: aov,
            delta: delta(revenue, days) - delta(orders, days),
            spark: spark(revenue, days).map(
              (v, i) => v / (spark(orders, days)[i] || 1),
            ),
            fmt: "usd",
          },
        };
      },
      revenueSeries: function (days) {
        return revenue.slice(-days);
      },
      usersSeries: function (days) {
        return users.slice(-days);
      },
      trafficSources: function () {
        const base = [
          ["Organic", 42],
          ["Direct", 24],
          ["Referral", 15],
          ["Social", 12],
          ["Email", 7],
        ];
        return base.map((b) => ({
          label: b[0],
          value: b[1] + Math.round(randn() * 3),
        }));
      },
      topChannels: function () {
        return [
          ["Google", 3200],
          ["Instagram", 2100],
          ["Direct", 1800],
          ["Newsletter", 1200],
          ["TikTok", 950],
          ["Twitter", 620],
        ].map((c) => ({
          label: c[0],
          value: c[1] + Math.round(randn() * 120),
        }));
      },
      categories: function () {
        return [
          ["Apparel", 38],
          ["Electronics", 27],
          ["Home", 18],
          ["Beauty", 10],
          ["Sports", 7],
        ].map((c) => ({
          label: c[0],
          value: c[1] + Math.round(Math.random() * 4),
        }));
      },
      activity: function () {
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const out = [];
        for (const d of days)
          for (let h = 0; h < 24; h += 2) {
            const peak = Math.exp(-Math.pow((h - 14) / 6, 2)); // afternoon peak
            const wk = d === "Sat" || d === "Sun" ? 0.6 : 1;
            out.push({
              x: (h < 10 ? "0" : "") + h + ":00",
              y: d,
              value: Math.round((20 + peak * 80) * wk + Math.random() * 12),
            });
          }
        return out;
      },
      recentOrders: function (n) {
        n = n || 8;
        const names = [
          "A. Chen",
          "M. Silva",
          "K. Novak",
          "R. Ali",
          "J. Park",
          "L. Rossi",
          "T. Mbeki",
          "S. Haas",
          "D. Kaur",
          "F. Costa",
        ];
        const status = ["paid", "paid", "paid", "pending", "refunded"];
        const out = [];
        for (let i = 0; i < n; i++)
          out.push({
            id: "#" + (10000 + Math.floor(Math.random() * 89999)),
            customer: names[Math.floor(Math.random() * names.length)],
            amount: Math.round((20 + Math.random() * 480) * 100) / 100,
            status: status[Math.floor(Math.random() * status.length)],
            mins: Math.floor(Math.random() * 240),
          });
        return out.sort((a, b) => a.mins - b.mins);
      },
    };
  }

  const api = { randn: randn, trend: trend, createAnalytics: createAnalytics };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.AnalyticsSim = api;
})(typeof self !== "undefined" ? self : this);
