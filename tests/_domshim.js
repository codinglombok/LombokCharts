// tests/_domshim.js — tiny headless DOM + Canvas2D shim (no dependencies).
// Records nothing meaningful but lets the Chart pipeline run end-to-end in Node.
export function installDomShim() {
  if (globalThis.__lcShim) return;
  globalThis.__lcShim = true;

  const ctx2d = new Proxy({}, {
    get(_t, k) {
      if (k === 'measureText') return () => ({ width: 10 });
      if (k === 'createLinearGradient') return () => ({ addColorStop() {} });
      if (k === 'setTransform' || k === 'getImageData') return () => {};
      return (typeof k === 'string') ? () => {} : undefined;
    },
    set() { return true; },
  });

  function makeEl(tag) {
    const children = [];
    const listeners = {};
    const el = {
      tagName: tag, style: {}, children, attributes: {},
      _rect: { width: 600, height: 360, left: 0, top: 0 },
      appendChild(c) { children.push(c); c.parentNode = el; return c; },
      removeChild(c) { const i = children.indexOf(c); if (i >= 0) children.splice(i, 1); return c; },
      setAttribute(k, v) { el.attributes[k] = v; },
      getAttribute(k) { return el.attributes[k]; },
      addEventListener(t, fn) { (listeners[t] = listeners[t] || []).push(fn); },
      removeEventListener() {},
      getBoundingClientRect() { return el._rect; },
      getContext() { return ctx2d; },
      toDataURL() { return 'data:image/png;base64,'; },
      set innerHTML(v) { el._html = v; }, get innerHTML() { return el._html || ''; },
      set textContent(v) { el._text = v; }, get textContent() { return el._text || ''; },
      set width(v) { el._w = v; }, get width() { return el._w || 600; },
      set height(v) { el._h = v; }, get height() { return el._h || 360; },
      querySelector() { return null; },
    };
    return el;
  }

  globalThis.document = {
    body: makeEl('body'),
    createElement: (t) => makeEl(t),
    createElementNS: (_ns, t) => makeEl(t),
    querySelector: () => null,
  };
  globalThis.devicePixelRatio = 1;
  globalThis.performance = globalThis.performance || { now: () => Date.now() };
  globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
}
