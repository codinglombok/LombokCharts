// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// lombokcss-theme.js — the LombokCSS <-> LombokCharts bridge.
// Reads the live LombokCSS design tokens off <html> and returns a LombokCharts
// theme override, so chart text/grid/axis colors always match the active
// data-style / data-theme (works for every style, not just the dark ones).
(function (root) {
  'use strict';
  function lombokTheme() {
    var cs = getComputedStyle(document.documentElement);
    var g = function (name, fallback) { var v = cs.getPropertyValue(name); return (v && v.trim()) || fallback; };
    return {
      colors: {
        background: 'transparent',            // let the LombokCSS card surface show through
        surface: g('--lc-surface', '#ffffff'),
        text: g('--lc-text', '#212529'),
        muted: g('--lc-muted', '#868e96'),
        grid: g('--lc-border', '#e9ecef'),
        axis: g('--lc-muted', '#868e96'),
        tooltipBg: g('--lc-text', '#212529'),  // inverted -> always contrasts
        tooltipText: g('--lc-surface', '#ffffff'),
      },
    };
  }
  root.lombokTheme = lombokTheme;
})(typeof self !== 'undefined' ? self : this);
