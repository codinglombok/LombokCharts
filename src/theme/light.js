// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/theme/light.js
import { baseTokens } from './tokens.js';

/** @type {import('./tokens.js').Theme} */
export const lightTheme = {
  name: 'light',
  ...baseTokens,
  colors: {
    background: '#ffffff',
    surface: '#f8f9fa',
    text: '#212529',
    muted: '#868e96',
    grid: '#e9ecef',
    axis: '#adb5bd',
    tooltipBg: 'rgba(33,37,41,0.92)',
    tooltipText: '#ffffff',
  },
  sequential: ['#e7f0ff', '#1c5fd6'],
};
