// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// Visual-regression: snapshot the deterministic fixture (every mark, fixed data,
// animate:false) across representative LombokCSS styles + themes. The fixture sets
// body[data-ready="1"] once all charts are drawn, so there is nothing time-based.
import { test, expect } from '@playwright/test';

const COMBOS = [
  { style: 'modern-corporate-flat', theme: 'light' },
  { style: 'resonant-stark', theme: 'dark' },
  { style: 'glassmorphism', theme: 'dark' },
  { style: 'neo-brutalism', theme: 'light' },
  { style: 'semantic-minimalist', theme: 'light' },
];

for (const { style, theme } of COMBOS) {
  test(`marks — ${style} (${theme})`, async ({ page }) => {
    await page.goto(`/tests/visual/fixtures/index.html?style=${style}&theme=${theme}`);
    await page.waitForSelector('body[data-ready="1"]');
    await page.waitForTimeout(150); // let webfonts/layout settle
    await expect(page).toHaveScreenshot(`marks-${style}-${theme}.png`, { fullPage: true });
  });
}
