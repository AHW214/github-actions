"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInputMaybe = exports.getInputOneOf = void 0;
const core_1 = require("@actions/core");
const purify_ts_1 = require("purify-ts");
const getInputMaybe = (name, options) => purify_ts_1.Maybe.encase(() => (0, core_1.getInput)(name, { ...options, required: true }));
exports.getInputMaybe = getInputMaybe;
const getInputOneOf = (...names) => {
    const getInput = (name) => getInputMaybe(name).map((value) => ({ name, value }));
    const inputs = purify_ts_1.Maybe.mapMaybe(getInput, names);
    if (inputs.length <= 0) {
        return { type: 'None' };
    }
    if (inputs.length > 1) {
        const names = inputs.map(({ name }) => name);
        const [first, second, ...rest] = names;
        return { type: 'Many', names: [first, second, ...rest] };
    }
    const [{ name, value }] = inputs;
    return { type: 'One', name, value };
};
exports.getInputOneOf = getInputOneOf;
//# sourceMappingURL=github-client.js.map