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
const context_1 = require("./context");
const run_1 = require("../../control/run");
const artifact_1 = require("../../data/artifact");
const artifact_2 = require("../../data/artifact");
const github_1 = require("../../util/github");
const run = async (context, github) => {
    const { repo: { owner, repo }, payload: { workflow_run: { id: runId, check_suite_id: checkSuiteId }, }, } = context;
    const { data: { artifacts }, } = await github.rest.actions.listWorkflowRunArtifacts({
        owner,
        repo,
        run_id: runId,
    });
    core.info(`Found ${artifacts.length} artifacts for workflow run #${runId}`);
    const [artifactInfoObject, artifactInfoArray] = artifacts.reduce(([infoObject, infoArray], artifact) => {
        const info = (0, artifact_2.mkArtifactInfo)(owner, repo, checkSuiteId, artifact);
        return [
            { ...infoObject, [info.name]: info },
            [...infoArray, { artifact: info }],
        ];
    }, [{}, []]);
    core.info('Writing artifact info to outputs...');
    core.setOutput('artifact-info-object', artifactInfoObject);
    core.setOutput('artifact-info-array', artifactInfoArray);
    core.info('Done!');
};
(0, run_1.attempt)(() => (0, run_1.withContext)(context_1.Context, (context) => (0, run_1.withGithubClient)((github) => run(context, github))));
//# sourceMappingURL=run.js.map