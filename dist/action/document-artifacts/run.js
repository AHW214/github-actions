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
const dateformat_1 = __importDefault(require("dateformat"));
const fs = __importStar(require("fs"));
const mustache_1 = __importDefault(require("mustache"));
const pretty_bytes_1 = __importDefault(require("pretty-bytes"));
const codec_1 = require("./codec");
const codec_2 = require("./codec");
const run_1 = require("../../control/run");
const artifact_1 = require("../../data/artifact");
const context_1 = require("../../data/context");
const github_client_1 = require("../../data/github-client");
const github_client_2 = require("../../data/github-client");
const mkArtifactUrl = (owner, repo, checkSuiteId, artifactId) => `https://github.com/${owner}/${repo}/suites/${checkSuiteId}/artifacts/${artifactId}`;
const mkArtifactEntry = (owner, repo, checkSuiteId, artifact) => ({
    name: artifact.name,
    size: (0, pretty_bytes_1.default)(artifact.size_in_bytes),
    url: mkArtifactUrl(owner, repo, checkSuiteId, artifact.id),
});
const run = async (context, github, templateInput, templateOutput) => {
    const { repo: { owner, repo }, payload: { workflow_run: { id: runId, check_suite_id: checkSuiteId, head_branch: headBranch, head_commit: headCommit, head_sha: headSha, updated_at: updatedAt, }, }, } = context;
    const template = templateInput.name === 'template-path'
        ? fs.readFileSync(templateInput.value, 'utf-8')
        : templateInput.value;
    const { data: { artifacts }, } = await github.rest.actions.listWorkflowRunArtifacts({
        owner,
        repo,
        run_id: runId,
    });
    if (artifacts.length <= 0) {
        return core.info('No artifacts to document, exiting...');
    }
    const commitEntry = {
        author: headCommit.author.name,
        message: headCommit.message,
    };
    const formatUpdatedAt = (mask) => (0, dateformat_1.default)(updatedAt, `$UTC:${mask}`);
    const updatedAtEntry = {
        dateIso: formatUpdatedAt('isoDate'),
        dateMed: formatUpdatedAt('mediumDate'),
        timeIso: formatUpdatedAt('isoTime'),
        timeShort: formatUpdatedAt('shortTime'),
    };
    const workflowRunEntry = {
        headBranch,
        headCommit: commitEntry,
        headSha,
        headShaShort: headSha.substring(0, 7),
        updatedAt: updatedAtEntry,
    };
    const [artifactNamedEntries, artifactListEntries] = artifacts.reduce(([namedEntries, listEntries], artifact) => {
        const entry = mkArtifactEntry(owner, repo, checkSuiteId, artifact);
        const namedEntry = { [entry.name]: entry };
        const listEntry = { artifact: entry };
        return [{ ...namedEntries, ...namedEntry }, [...listEntries, listEntry]];
    }, [{}, []]);
    const rendered = mustache_1.default.render(template, {
        ...artifactNamedEntries,
        artifacts: artifactListEntries,
        workflowRun: workflowRunEntry,
    });
    core.info(`Writing template to ${templateOutput}`);
    fs.writeFileSync(templateOutput, rendered, 'utf-8');
};
(0, run_1.attempt)(() => {
    const templateOutput = core.getInput('output-path');
    const templateInput = (0, github_client_2.getInputOneOf)('template-text', 'template-path');
    if (templateInput.type === 'Many')
        return core.setFailed(`Can only set one of ${templateInput.names}`);
    if (templateInput.type === 'None')
        return core.setFailed('Template source not specified.');
    return (0, codec_2.decode)(github_1.context).caseOf({
        Left: (err) => core.setFailed(`Failed to decode action context: ${err}`),
        Right: (context) => (0, run_1.withGithubClient)((github) => run(context, github, templateInput, templateOutput)),
    });
});
//# sourceMappingURL=run.js.map