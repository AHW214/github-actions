"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decode = exports.Payload = void 0;
const purify_ts_1 = require("purify-ts");
const context_1 = require("../../data/context");
const Author = purify_ts_1.Codec.interface({
    name: purify_ts_1.string,
});
const Commit = purify_ts_1.Codec.interface({
    author: Author,
    message: purify_ts_1.string,
});
const WorkflowRun = purify_ts_1.Codec.interface({
    id: purify_ts_1.number,
    check_suite_id: purify_ts_1.number,
    head_branch: purify_ts_1.string,
    head_commit: Commit,
    head_sha: purify_ts_1.string,
    updated_at: purify_ts_1.string,
});
const Payload = purify_ts_1.Codec.interface({
    workflow_run: WorkflowRun,
});
exports.Payload = Payload;
const decode = (0, context_1.decodeWith)(Payload);
exports.decode = decode;
//# sourceMappingURL=codec.js.map