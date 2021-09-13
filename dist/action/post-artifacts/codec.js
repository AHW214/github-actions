"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Context = void 0;
const purify_ts_1 = require("purify-ts");
const PullRequest = purify_ts_1.Codec.interface({
    number: purify_ts_1.number,
});
const WorkflowRun = purify_ts_1.Codec.interface({
    id: purify_ts_1.number,
    check_suite_id: purify_ts_1.number,
    pull_requests: purify_ts_1.nonEmptyList(PullRequest),
});
const Payload = purify_ts_1.Codec.interface({
    workflow_run: WorkflowRun,
});
const Repository = purify_ts_1.Codec.interface({
    owner: purify_ts_1.string,
    repo: purify_ts_1.string,
});
const Context = purify_ts_1.Codec.interface({
    repo: Repository,
    payload: Payload,
});
exports.Context = Context;
//# sourceMappingURL=codec.js.map