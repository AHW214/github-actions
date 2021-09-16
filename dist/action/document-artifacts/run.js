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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github_1 = require("@actions/github");
const mustache_1 = __importDefault(require("mustache"));
const codec_1 = require("./codec");
const codec_2 = require("./codec");
const run_1 = require("../../control/run");
const artifact_1 = require("../../data/artifact");
const context_1 = require("../../data/context");
const github_client_1 = require("../../data/github-client");
const artifactView = (owner, repo, checkSuiteId, { name, id }) => ({
    name,
    url: `https://github.com/${owner}/${repo}/suites/${checkSuiteId}/artifacts/${id}`,
});
const thing = (owner, repo, checkSuiteId, { name, id }) => ({
    [name]: `https://github.com/${owner}/${repo}/suites/${checkSuiteId}/artifacts/${id}`,
});
const run = async (context, github, template) => {
    const { repo: { owner, repo }, payload: { workflow_run: { id: runId, check_suite_id: checkSuiteId }, }, } = context;
    const { data: { artifacts }, } = await github.rest.actions.listWorkflowRunArtifacts({
        owner,
        repo,
        run_id: runId,
    });
    if (artifacts.length <= 0) {
        return core.info('No artifacts to document, exiting...');
    }
    const artifactViews = artifacts.map((art) => artifactView(owner, repo, checkSuiteId, art));
    const things = artifacts.map((art) => thing(owner, repo, checkSuiteId, art));
    const rendered = mustache_1.default.render(template, {
        artifacts: artifactViews,
        ...things,
    });
    core.info(rendered);
};
(0, run_1.attempt)(() => {
    const template = core.getInput('template', { required: true });
    return (0, codec_2.decode)(github_1.context).caseOf({
        Left: (err) => core.setFailed(`Failed to decode action context: ${err}`),
        Right: (context) => (0, run_1.withGithubClient)((github) => run(context, github, template)),
    });
});
//# sourceMappingURL=run.js.map