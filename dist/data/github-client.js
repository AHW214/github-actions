"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInputMaybe = void 0;
const core_1 = require("@actions/core");
const purify_ts_1 = require("purify-ts");
const getInputMaybe = (name, options) => purify_ts_1.Maybe.encase(() => core_1.getInput(name, Object.assign(Object.assign({}, options), { required: true })));
exports.getInputMaybe = getInputMaybe;
//# sourceMappingURL=github-client.js.map