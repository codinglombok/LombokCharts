// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/theme/dark.js
import { baseTokens } from './tokens.js';

/** @type {import('./tokens.js').Theme} */
export const darkTheme = {
  name: 'dark',
  ...baseTokens,
  palette: ['#5b9bff', '#ff7b7b', '#3ad6ad', '#ffb866', '#b69dff', '#f877a5', '#86c8ff', '#ffe066'],
  colors: {
    background: '#16181d',
    surface: '#1e2128',
    text: '#e9ecef',
    muted: '#909296',
    grid: '#2b2f37',
    axis: '#4b515c',
    tooltipBg: 'rgba(248,249,250,0.95)',
    tooltipText: '#16181d',
  },
  sequential: ['#10243f', '#5b9bff'],
};
