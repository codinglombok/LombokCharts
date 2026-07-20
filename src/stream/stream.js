// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/stream/stream.js
// Source-agnostic streaming bridge. Accepts: async iterator, EventSource,
// WebSocket, or a function(emit, stop) producer. Each yielded value is mapped
// to {x,y} and forwarded to the chart's appendData.

/**
 * @param {any} source
 * @param {(point:{x:number,y:number})=>void} onPoint
 * @param {(raw:any)=>{x:number,y:number}} [map]
 * @returns {{stop:()=>void}}
 */
export function connectStream(source, onPoint, map = (v) => v) {
  let stopped = false;
  const stop = () => { stopped = true; cleanup(); };
  let cleanup = () => {};

  // Async iterator / async generator
  if (source && typeof source[Symbol.asyncIterator] === 'function') {
    (async () => {
      for await (const raw of source) { if (stopped) break; onPoint(map(raw)); }
    })();
    return { stop };
  }

  // EventSource
  if (typeof EventSource !== 'undefined' && source instanceof EventSource) {
    const handler = (e) => { try { onPoint(map(JSON.parse(e.data))); } catch { onPoint(map(e.data)); } };
    source.addEventListener('message', handler);
    cleanup = () => source.removeEventListener('message', handler);
    return { stop };
  }

  // WebSocket
  if (typeof WebSocket !== 'undefined' && source instanceof WebSocket) {
    const handler = (e) => { try { onPoint(map(JSON.parse(e.data))); } catch { onPoint(map(e.data)); } };
    source.addEventListener('message', handler);
    cleanup = () => source.removeEventListener('message', handler);
    return { stop };
  }

  // Producer function: source(emit, isStopped)
  if (typeof source === 'function') {
    source((raw) => { if (!stopped) onPoint(map(raw)); }, () => stopped);
    return { stop };
  }

  throw new Error('connectStream: unsupported source type');
}
