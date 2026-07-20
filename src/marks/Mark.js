// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/marks/Mark.js — base class documenting the mark contract.
// A Mark turns resolved series + scales into renderer draw calls. It may push
// hit-test records into ctx.hits and report how many primitives it drew via ctx.stats.
export class Mark {
  constructor(options = {}) { this.options = options; }
  /**
   * Coordinate system this mark draws in.
   * @returns {string} 'cartesian' | 'polar' | 'none'
   */
  coordinate() { return 'cartesian'; }
  /**
   * Domain hints so the Chart can build cartesian scales.
   * @param {Array<Object>} [series]
   * @param {Object} [opts]
   * @param {Array<Object>} [rawData]
   * @returns {{x:{type:string,values?:string[],domain?:number[]}, y:{domain:number[]}}|null}
   */
  // eslint-disable-next-line no-unused-vars
  domains(series, opts, rawData) { return null; }
  /**
   * Draw the mark. Concrete marks must override this.
   * @param {import('../core/Chart.js').DrawContext} ctx
   * @returns {void}
   */
  // eslint-disable-next-line no-unused-vars
  draw(ctx) { throw new Error('Mark.draw not implemented'); }
  /**
   * Legend entries for this mark, if any.
   * @param {Array<Object>} [series]
   * @param {Object} [ctx]
   * @returns {{label:string,color:string}[]|null}
   */
  // eslint-disable-next-line no-unused-vars
  legendItems(series, ctx) { return null; }
}
