"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decode = exports.Payload = void 0;
const purify_ts_1 = require("purify-ts");
const context_1 = require("../../data/context");
const WorkflowRun = purify_ts_1.Codec.interface({
    id: purify_ts_1.number,
    check_suite_id: purify_ts_1.number,
});
const Payload = purify_ts_1.Codec.interface({
    workflow_run: WorkflowRun,
});
exports.Payload = Payload;
const decode = (0, context_1.decodeWith)(Payload);
exports.decode = decode;
//# sourceMappingURL=codec.js.map