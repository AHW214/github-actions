"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flatten = void 0;
const flatten = (xss) => xss.reduce((acc, xs) => [...acc, ...xs], []);
exports.flatten = flatten;
//# sourceMappingURL=array.js.map