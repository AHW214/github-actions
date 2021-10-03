"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Context = void 0;
const purify_ts_1 = require("purify-ts");
const context_1 = require("../../data/context");
const Context = purify_ts_1.Codec.interface({
    eventName: (0, purify_ts_1.exactly)('workflow_run'),
    payload: purify_ts_1.Codec.interface({
        workflow_run: purify_ts_1.Codec.interface({
            id: purify_ts_1.number,
            check_suite_id: purify_ts_1.number,
        }),
    }),
});
exports.Context = Context;
//# sourceMappingURL=context.js.map