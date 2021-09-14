"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decode = exports.Payload = void 0;
const purify_ts_1 = require("purify-ts");
const context_1 = require("../../data/context");
const Payload = purify_ts_1.Codec.interface({
    ref: purify_ts_1.string,
    ref_type: purify_ts_1.string,
});
exports.Payload = Payload;
const decode = (0, context_1.decodeWith)(Payload);
exports.decode = decode;
//# sourceMappingURL=codec.js.map