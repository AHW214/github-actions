"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Context = void 0;
const purify_ts_1 = require("purify-ts");
const context_1 = require("../../data/context");
const DeleteContext = purify_ts_1.Codec.interface({
    eventName: (0, purify_ts_1.exactly)('delete'),
    payload: purify_ts_1.Codec.interface({
        ref: purify_ts_1.string,
        ref_type: (0, purify_ts_1.exactly)('branch'),
    }),
});
const WorkflowRunContext = purify_ts_1.Codec.interface({
    eventName: (0, purify_ts_1.exactly)('workflow_run'),
    payload: purify_ts_1.Codec.interface({
        workflow_run: purify_ts_1.Codec.interface({
            event: (0, purify_ts_1.exactly)('push'),
            head_branch: purify_ts_1.string,
        }),
    }),
});
const Context = (0, purify_ts_1.oneOf)([DeleteContext, WorkflowRunContext]);
exports.Context = Context;
//# sourceMappingURL=codec.js.map