"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapMaybe = exports.mapFalsy = void 0;
const mapMaybe = (f, xs) => mapKeepWhen((y) => y !== undefined && y !== null, f, xs);
exports.mapMaybe = mapMaybe;
const mapFalsy = (f, xs) => mapKeepWhen((y) => !!y, f, xs);
exports.mapFalsy = mapFalsy;
const mapKeepWhen = (p, f, xs) => xs.reduce((ys, x) => {
    const y = f(x);
    return p(y) ? [...ys, y] : ys;
}, []);
//# sourceMappingURL=maybe.js.map