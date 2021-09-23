"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDeletePayload = exports.decode = exports.Payload = void 0;
const purify_ts_1 = require("purify-ts");
const context_1 = require("../../data/context");
// TODO - meh
const isDeletePayload = (payload) => 'ref' in payload;
exports.isDeletePayload = isDeletePayload;
const DeletePayload = purify_ts_1.Codec.interface({
    ref: purify_ts_1.string,
    ref_type: (0, purify_ts_1.exactly)('branch'),
});
const WorkflowRun = purify_ts_1.Codec.interface({
    event: (0, purify_ts_1.exactly)('push'),
    head_branch: purify_ts_1.string,
});
const WorkflowRunPayload = purify_ts_1.Codec.interface({
    workflow_run: WorkflowRun,
});
const Payload = (0, purify_ts_1.oneOf)([DeletePayload, WorkflowRunPayload]);
exports.Payload = Payload;
const decode = (0, context_1.decodeWith)(Payload);
exports.decode = decode;
//# sourceMappingURL=codec.js.map