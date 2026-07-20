// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/interaction/legend.js — toggleable legend with full keyboard navigation.
export class Legend {
  /** @param {HTMLElement} container @param {object} theme @param {(i:number,visible:boolean)=>void} onToggle */
  constructor(container, theme, onToggle) {
    this.container = container;
    this.theme = theme;
    this.onToggle = onToggle;
    this.el = document.createElement('div');
    Object.assign(this.el.style, {
      display: 'flex', flexWrap: 'wrap', gap: '12px', padding: '8px 4px 2px',
      font: `${theme.typography.labelSize}px ${theme.typography.family}`, color: theme.colors.text,
    });
    this.el.setAttribute('role', 'list');
    container.appendChild(this.el);
    this.items = [];
  }
  setTheme(theme) { this.theme = theme; this.el.style.color = theme.colors.text; }
  /** @param {{label:string,color:string,visible:boolean}[]} entries */
  render(entries) {
    this.el.innerHTML = '';
    this.items = entries.map((e, i) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.setAttribute('role', 'listitem');
      item.setAttribute('aria-pressed', String(e.visible));
      item.tabIndex = 0;
      Object.assign(item.style, {
        display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
        background: 'none', border: 'none', padding: '2px 4px', borderRadius: '4px',
        color: 'inherit', font: 'inherit', opacity: e.visible ? '1' : '0.4',
      });
      const swatch = document.createElement('span');
      Object.assign(swatch.style, { width: '11px', height: '11px', borderRadius: '3px', background: e.color, display: 'inline-block' });
      const text = document.createElement('span');
      text.textContent = e.label;
      item.appendChild(swatch); item.appendChild(text);
      const toggle = () => { e.visible = !e.visible; item.style.opacity = e.visible ? '1' : '0.4'; item.setAttribute('aria-pressed', String(e.visible)); this.onToggle(i, e.visible); };
      item.addEventListener('click', toggle);
      item.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); toggle(); }
        else if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') { ev.preventDefault(); const n = this.items[(i + 1) % this.items.length]; if (n) n.focus(); }
        else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') { ev.preventDefault(); const p = this.items[(i - 1 + this.items.length) % this.items.length]; if (p) p.focus(); }
      });
      this.el.appendChild(item);
      return item;
    });
  }
  destroy() { if (this.el.parentNode) this.el.parentNode.removeChild(this.el); }
}
