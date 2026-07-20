# Theming

Themes are plain JSON-able token objects. Two are built in (`lightTheme`, `darkTheme`); pass
`'light'`, `'dark'`, or a partial object that deep-merges onto a base.

## Token shape

```js
{
  name: 'light',
  colors: {
    background: '#ffffff',
    surface:    '#f8f9fa',
    text:       '#212529',
    muted:      '#868e96',
    grid:       '#e9ecef',
    axis:       '#adb5bd',
    tooltipBg:  '#212529',
    tooltipText:'#f8f9fa',
  },
  palette: ['#2f6bd8', '#3ad6ad', '#ffb866', '#ff7b7b', '#9b8cff', '#4dd0e1', '#f06595', '#94d82d'],
  semantic: { positive: '#2f9e44', negative: '#e03131', neutral: '#868e96' },
  sequential: ['#e7f0ff', '#2f6bd8'],   // [low, high] ramp for heatmaps / sequential color
  typography: { family: 'system-ui, sans-serif', size: 12, labelSize: 11, axisSize: 11 },
  spacing: { unit: 4 },
  motion: { duration: 600, easing: easeCubicOut },
}
```

## Partial overrides

Only specify what changes; the rest is inherited:

```js
chart("#app", {
  data,
  mark: "bar",
  theme: { palette: ["#111", "#555", "#999"], colors: { grid: "#eee" } },
});
```

To base a custom theme on dark, set `name: 'dark'`:

```js
theme: { name: 'dark', palette: ['#8ab4ff', '#7ee8c8'] }
```

## Switching at runtime

```js
const c = chart("#app", { data, mark: "line" });
document.querySelector("#toggle").onclick = () =>
  c.setTheme(c.theme.name === "dark" ? "light" : "dark");
```

`setTheme` re-resolves the categorical color scale, updates the tooltip and legend chrome, and
redraws without animation.

## Color scales

- **Categorical** (`palette`) assigns a stable color per series/category index.
- **Sequential** (`sequential` ramp) interpolates between two hex endpoints for heatmaps and any
  value-encoded color. Override per-mark with `mark: { type: 'heatmap', colors: ['#fff', '#000'] }`.

## Notes for dark mode

Status colors (`semantic.positive` / `negative`) are defined explicitly per theme rather than
derived, so contrast stays readable on dark surfaces. When building a custom dark theme, set
`semantic` and `sequential` explicitly instead of relying on inheritance from the light base.
