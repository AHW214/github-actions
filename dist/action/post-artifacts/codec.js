"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decode = void 0;
const purify_ts_1 = require("purify-ts");
const PullRequest = purify_ts_1.Codec.interface({
    number: purify_ts_1.number,
});
const WorkflowRun = purify_ts_1.Codec.interface({
    id: purify_ts_1.number,
    check_suite_id: purify_ts_1.number,
    pull_requests: (0, purify_ts_1.nonEmptyList)(PullRequest),
});
const Payload = purify_ts_1.Codec.interface({
    workflow_run: WorkflowRun,
});
const decode = (context) => {
    const { repo, payload } = context;
    return Payload.decode(payload).map((payload) => ({ repo, payload }));
};
exports.decode = decode;
//# sourceMappingURL=codec.js.map