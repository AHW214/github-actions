"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github_1 = require("@actions/github");
const codec_1 = require("./codec");
const codec_2 = require("./codec");
const run_1 = require("../../control/run");
const context_1 = require("../../data/context");
const github_client_1 = require("../../data/github-client");
const array_1 = require("../../util/array");
const run = async (context, github) => {
    const { repo: { owner, repo }, payload: { ref, ref_type }, } = context;
    if (ref_type !== 'branch') {
        return core.info('Ref not a branch, exiting...');
    }
    core.info(`Pruning artifacts generated for branch ${ref}`);
    const { data: { workflow_runs: workflowRuns }, } = await github.rest.actions.listWorkflowRunsForRepo({
        owner,
        repo,
        branch: ref,
        per_page: 100,
    });
    core.info(JSON.stringify(workflowRuns));
    const results = await Promise.all(workflowRuns.map(async ({ id }) => {
        const { data: { artifacts }, } = await github.rest.actions.listWorkflowRunArtifacts({
            owner,
            repo,
            run_id: id,
            per_page: 100,
        });
        return artifacts;
    }));
    const artifacts = (0, array_1.flatten)(results);
    core.info(JSON.stringify(artifacts));
};
(0, run_1.attempt)(() => {
    return (0, codec_2.decode)(github_1.context).caseOf({
        Left: (err) => core.setFailed(`Failed to decode action context: ${err}`),
        Right: (context) => (0, run_1.withGithubClient)((github) => run(context, github)),
    });
});
//# sourceMappingURL=run.js.map