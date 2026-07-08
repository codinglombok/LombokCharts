// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// monitor-sim.js — zero-dependency synthetic infrastructure/IoT telemetry.
// Browser: window.MonitorSim. Node (tests): module.exports.
(function (root) {
  'use strict';
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function walk(v, min, max, vol) {
    let n = v + (Math.random() - 0.5) * vol * 2;
    if (n < min || n > max) n = v - (n - v); // reflect at bounds
    return clamp(n, min, max);
  }

  const HOSTS = [
    ['web-01', 'us-east'], ['web-02', 'us-east'], ['api-01', 'eu-west'],
    ['api-02', 'eu-west'], ['db-01', 'us-east'], ['cache-01', 'ap-south'],
  ];

  function createMonitor(opt) {
    opt = opt || {};
    const HIST = opt.hist || 120;
    const seed = (v, min, max, vol, unit) => {
      const hist = []; let x = v;
      for (let i = 0; i < HIST; i++) { x = walk(x, min, max, vol); hist.push(x); }
      return { value: x, min: min, max: max, vol: vol, unit: unit || '', hist: hist };
    };
    const metrics = {
      cpu: seed(42, 3, 99, 7, '%'),
      mem: seed(63, 20, 95, 3, '%'),
      disk: seed(57, 30, 92, 0.8, '%'),
      net: seed(240, 0, 1000, 70, 'Mbps'),
      rps: seed(3200, 200, 9000, 450, 'req/s'),
      latency: seed(120, 20, 900, 35, 'ms'),
    };
    const hosts = HOSTS.map(function (h) {
      const lat = []; let x = 60 + Math.random() * 80;
      for (let i = 0; i < 40; i++) { x = walk(x, 20, 400, 25); lat.push(x); }
      return { name: h[0], region: h[1], cpu: 20 + Math.random() * 60, latency: x, spark: lat, status: 'healthy' };
    });

    function status(host) {
      if (host.latency > 320 || host.cpu > 92) return 'down';
      if (host.latency > 220 || host.cpu > 80) return 'warn';
      return 'healthy';
    }

    return {
      metrics: metrics, hosts: hosts,
      /** Advance one sample for every metric and host. */
      tick: function () {
        for (const k in metrics) {
          const m = metrics[k];
          m.value = walk(m.value, m.min, m.max, m.vol);
          m.hist.push(m.value);
          if (m.hist.length > HIST) m.hist.shift();
        }
        for (const h of hosts) {
          h.cpu = walk(h.cpu, 5, 99, 6);
          h.latency = walk(h.latency, 20, 400, 22);
          h.spark.push(h.latency);
          if (h.spark.length > 40) h.spark.shift();
          h.status = status(h);
        }
        return metrics;
      },
      /** Overall system status derived from hosts. */
      health: function () {
        if (hosts.some((h) => h.status === 'down')) return 'degraded';
        if (hosts.some((h) => h.status === 'warn')) return 'warning';
        return 'operational';
      },
    };
  }

  const api = { createMonitor: createMonitor, walk: walk };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MonitorSim = api;
})(typeof self !== 'undefined' ? self : this);
