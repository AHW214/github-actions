"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.partition = exports.flatten = void 0;
const flatten = (xss) => xss.reduce((acc, xs) => [...acc, ...xs], []);
exports.flatten = flatten;
const partition = (p, xs) => xs.reduce(([ys, zs], x) => (p(x) ? [[...ys, x], zs] : [ys, [...zs, x]]), [[], []]);
exports.partition = partition;
//# sourceMappingURL=array.js.map