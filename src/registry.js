// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// src/registry.js
// Registry pattern: users register only the marks/scales they use, keeping
// bundles small (tree-shakeable). Adding a mark NEVER touches the core.
const marks = new Map();

/** @param {string} type @param {Function} MarkClass */
export function registerMark(type, MarkClass) {
  marks.set(type, MarkClass);
}
export function getMark(type) {
  return marks.get(type);
}
export function hasMark(type) {
  return marks.has(type);
}
export function listMarks() {
  return [...marks.keys()];
}
