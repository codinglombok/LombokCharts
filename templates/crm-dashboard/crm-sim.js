// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// crm-sim.js — zero-dependency synthetic CRM data. Browser: window.CrmSim; Node: module.exports.
(function (root) {
  'use strict';
  function randn() { let u = 0, v = 0; while (u === 0) u = Math.random(); while (v === 0) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  const REPS = ['Amara O.', 'Ben K.', 'Chloe R.', 'Diego M.', 'Elif Y.'];
  const COMPANIES = ['Acme', 'Globex', 'Initech', 'Umbrella', 'Stark Ind.', 'Wayne Ent.', 'Soylent', 'Hooli', 'Pied Piper', 'Vehement'];
  const STAGES = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function createCrm() {
    // Pipeline funnel (monotonic decreasing)
    let n = 1200;
    const pipeline = STAGES.map(function (s, i) { const v = Math.round(n); n *= (0.52 + Math.random() * 0.16); return { label: s, value: v }; });

    const revenue = MONTHS.map(function (m, i) { return { label: m, value: Math.round(38000 + i * 2200 + randn() * 6000) }; });

    const reps = REPS.map(function (r) { return { label: r, value: Math.round(12 + Math.random() * 40) }; })
      .sort(function (a, b) { return b.value - a.value; });

    const leadSources = [['Referral', 34], ['Website', 28], ['Outbound', 18], ['Events', 12], ['Partner', 8]]
      .map(function (s) { return { label: s[0], value: s[1] + Math.round(randn() * 3) }; });

    const actions = ['created a deal', 'moved to Qualified', 'sent a proposal', 'closed a deal', 'logged a call', 'added a note'];
    const activity = Array.from({ length: 8 }, function (_, i) {
      return { who: pick(REPS), action: pick(actions), company: pick(COMPANIES), mins: Math.floor(Math.random() * 300) };
    }).sort(function (a, b) { return a.mins - b.mins; });

    const contacts = Array.from({ length: 10 }, function () {
      const stage = pick(STAGES);
      return { name: pick(['A. Chen', 'M. Silva', 'K. Novak', 'R. Ali', 'J. Park', 'L. Rossi', 'T. Mbeki', 'S. Haas']),
        company: pick(COMPANIES), stage: stage, value: Math.round((3 + Math.random() * 45)) * 1000, owner: pick(REPS) };
    });

    function delta() { return (Math.random() * 24 - 6); }
    function spark(base, n2) { const out = []; let x = base; for (let i = 0; i < (n2 || 20); i++) { x = Math.max(1, x * (1 + (Math.random() - 0.45) * 0.06)); out.push(x); } return out; }

    return {
      STAGES: STAGES,
      kpis: function () {
        const customers = 842 + Math.floor(Math.random() * 40);
        const openDeals = pipeline.slice(0, 4).reduce(function (s, p) { return s + p.value; }, 0);
        const mrr = revenue[revenue.length - 1].value;
        const winRate = (pipeline[4].value / pipeline[0].value) * 100;
        return {
          customers: { value: customers, delta: delta(), spark: spark(customers), fmt: 'int' },
          openDeals: { value: openDeals, delta: delta(), spark: spark(openDeals), fmt: 'int' },
          mrr: { value: mrr, delta: delta(), spark: spark(mrr), fmt: 'usd' },
          winRate: { value: winRate, delta: delta(), spark: spark(winRate), fmt: 'pct' },
        };
      },
      pipeline: function () { return pipeline; },
      revenue: function () { return revenue; },
      reps: function () { return reps; },
      leadSources: function () { return leadSources; },
      activity: function () { return activity; },
      contacts: function () { return contacts; },
      // Sankey: lead source -> stage bucket (won/lost/open)
      flow: function () {
        const nodes = [{ id: 'ref', name: 'Referral' }, { id: 'web', name: 'Website' }, { id: 'out', name: 'Outbound' },
          { id: 'open', name: 'Open' }, { id: 'won', name: 'Won' }, { id: 'lost', name: 'Lost' }];
        const links = [
          { source: 'ref', target: 'won', value: 18 }, { source: 'ref', target: 'open', value: 10 }, { source: 'ref', target: 'lost', value: 6 },
          { source: 'web', target: 'won', value: 12 }, { source: 'web', target: 'open', value: 14 }, { source: 'web', target: 'lost', value: 8 },
          { source: 'out', target: 'won', value: 7 }, { source: 'out', target: 'open', value: 9 }, { source: 'out', target: 'lost', value: 11 },
        ];
        return { nodes: nodes, links: links };
      },
    };
  }

  const api = { createCrm: createCrm };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CrmSim = api;
})(typeof self !== 'undefined' ? self : this);
