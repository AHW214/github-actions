"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapFalsy = void 0;
const mapFalsy = (f, xs) => xs.reduce((ys, x) => {
    const y = f(x);
    return y ? [...ys, y] : ys;
}, []);
exports.mapFalsy = mapFalsy;
//# sourceMappingURL=maybe.js.map