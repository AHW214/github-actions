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
const purify_ts_1 = require("purify-ts");
const codec_1 = require("./codec");
const codec_2 = require("./codec");
const run_1 = require("../../control/run");
const comment_1 = require("../../data/comment");
const comment_2 = require("../../data/comment");
const context_1 = require("../../data/context");
const github_client_1 = require("../../data/github-client");
const array_1 = require("../../util/array");
const COMMENT_TAG = 'POST_ARTIFACTS_COMMENT_TAG';
const findPostArtifactComments = (comments) => {
    const regexTag = new RegExp(COMMENT_TAG);
    return purify_ts_1.Maybe.mapMaybe((comment) => (0, comment_2.authorIsBot)(comment) && comment.body && regexTag.test(comment.body)
        ? (0, purify_ts_1.Just)(comment)
        : purify_ts_1.Nothing, comments);
};
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
    core.info(`Found ${workflowRuns.length} workflow runs for branch ${ref}`);
    const artifactsNested = await Promise.all(workflowRuns.map(async ({ id }) => {
        const { data: { artifacts }, } = await github.rest.actions.listWorkflowRunArtifacts({
            owner,
            repo,
            run_id: id,
            per_page: 100,
        });
        return artifacts;
    }));
    const artifacts = (0, array_1.flatten)(artifactsNested);
    core.info(`Found ${artifacts.length} artifacts for all workflow runs`);
    for (const art of artifacts) {
        core.info(`Deleting artifact ${art.id}`);
        await github.rest.actions.deleteArtifact({
            owner,
            repo,
            artifact_id: art.id,
        });
    }
    const { data: pullRequests } = await github.rest.pulls.list({
        owner,
        repo,
        head: `${owner}:${ref}`,
        state: 'closed',
        per_page: 100,
    });
    const commentsNested = await Promise.all(pullRequests.map(async ({ number }) => {
        const { data: comments } = await github.rest.issues.listComments({
            owner,
            repo,
            issue_number: number,
            per_page: 100,
        });
        return comments;
    }));
    const comments = (0, array_1.flatten)(commentsNested);
    const postArtifactComments = findPostArtifactComments(comments);
    for (const comment of postArtifactComments) {
        core.info(`Updating outdated artifact post comment ${comment.id}`);
        const tag = `<!-- ${COMMENT_TAG} -->`;
        const body = '**These artifacts have been deleted.**';
        const taggedBody = `${tag}\n${body}`;
        await github.rest.issues.updateComment({
            owner,
            repo,
            comment_id: comment.id,
            body: taggedBody,
        });
    }
};
(0, run_1.attempt)(() => {
    return (0, codec_2.decode)(github_1.context).caseOf({
        Left: (err) => core.setFailed(`Failed to decode action context: ${err}`),
        Right: (context) => (0, run_1.withGithubClient)((github) => run(context, github)),
    });
});
//# sourceMappingURL=run.js.map