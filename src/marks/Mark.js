// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/marks/Mark.js — base class documenting the mark contract.
// A Mark turns resolved series + scales into renderer draw calls. It may push
// hit-test records into ctx.hits and report how many primitives it drew via ctx.stats.
export class Mark {
  constructor(options = {}) {
    this.options = options;
  }
  /** @returns {'cartesian'|'polar'|'none'} */
  coordinate() {
    return "cartesian";
  }
  /**
   * Domain hints so the Chart can build cartesian scales.
   * @returns {{x:{type:string,values?:string[],domain?:number[]}, y:{domain:number[]}}|null}
   */
  domains(/* series, opts */) {
    return null;
  }
  /** @param {import('../core/Chart.js').DrawContext} ctx */
  draw(/* ctx */) {
    throw new Error("Mark.draw not implemented");
  }
  /** @returns {{label:string,color:string}[]|null} */
  legendItems(/* series, ctx */) {
    return null;
  }
}
