"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.numericString = void 0;
const purify_ts_1 = require("purify-ts");
const numericString = purify_ts_1.Codec.custom({
    decode: (value) => purify_ts_1.string.decode(value).chain((str) => {
        const num = Number(str);
        return Number.isNaN(num)
            ? (0, purify_ts_1.Left)(`${str} could not be parsed as a number`)
            : (0, purify_ts_1.Right)(num);
    }),
    encode: (value) => `${value}`,
});
exports.numericString = numericString;
//# sourceMappingURL=codec.js.map