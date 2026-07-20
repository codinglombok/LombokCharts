// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/interaction/tooltip.js — DOM overlay tooltip positioned in container space.
export class Tooltip {
  constructor(container, theme) {
    this.container = container;
    this.theme = theme;
    this.el = document.createElement("div");
    Object.assign(this.el.style, {
      position: "absolute",
      pointerEvents: "none",
      zIndex: "20",
      opacity: "0",
      transition: "opacity .12s",
      padding: "6px 9px",
      borderRadius: "6px",
      font: `${theme.typography.labelSize}px ${theme.typography.family}`,
      maxWidth: "240px",
      transform: "translate(-50%, calc(-100% - 10px))",
      whiteSpace: "nowrap",
    });
    this._applyTheme();
    container.appendChild(this.el);
  }
  setTheme(theme) {
    this.theme = theme;
    this._applyTheme();
  }
  _applyTheme() {
    this.el.style.background = this.theme.colors.tooltipBg;
    this.el.style.color = this.theme.colors.tooltipText;
    this.el.style.boxShadow = "0 2px 12px rgba(0,0,0,.25)";
  }
  show(x, y, html) {
    this.el.innerHTML = html;
    this.el.style.left = x + "px";
    this.el.style.top = y + "px";
    this.el.style.opacity = "1";
  }
  hide() {
    this.el.style.opacity = "0";
  }
  destroy() {
    if (this.el.parentNode) this.el.parentNode.removeChild(this.el);
  }
}
