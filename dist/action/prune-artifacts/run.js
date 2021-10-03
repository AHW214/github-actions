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
const purify_ts_1 = require("purify-ts");
const codec_1 = require("./codec");
const tag_1 = require("../shared/tag");
const run_1 = require("../../control/run");
const comment_1 = require("../../data/comment");
const comment_2 = require("../../data/comment");
const array_1 = require("../../util/array");
const codec_2 = require("../../util/codec");
const github_1 = require("../../util/github");
const findPostArtifactComments = (comments) => {
    const regexTag = new RegExp(tag_1.COMMENT_TAG);
    const hasCommentTag = (body) => regexTag.test(body);
    return purify_ts_1.Maybe.mapMaybe((comment) => purify_ts_1.Maybe.fromNullable(comment.body).chain((body) => (0, comment_2.authorIsBot)(comment) && hasCommentTag(body) ? (0, purify_ts_1.Just)(comment) : purify_ts_1.Nothing), comments);
};
const pruneArtifacts = async (github, excludeWorkflowRuns, owner, repo, ref) => {
    core.info(`Pruning artifacts generated for branch ${ref}`);
    const { data: { workflow_runs: workflowRuns }, } = await github.rest.actions.listWorkflowRunsForRepo({
        owner,
        repo,
        branch: ref,
        per_page: 100,
    });
    core.info(`Found ${workflowRuns.length} workflow runs for branch ${ref}`);
    const [excludeRuns, includeRuns] = (0, array_1.partition)((run) => excludeWorkflowRuns.includes(run.id), workflowRuns);
    if (excludeRuns.length > 0) {
        const excludeIds = excludeRuns.map((run) => run.id);
        core.info(`Excluding workflow runs with IDs: [${excludeIds}]`);
    }
    const artifactsNested = await Promise.all(includeRuns.map(async (run) => {
        const { data: { artifacts }, } = await github.rest.actions.listWorkflowRunArtifacts({
            owner,
            repo,
            run_id: run.id,
            per_page: 100,
        });
        return artifacts;
    }));
    const artifactsToRemove = (0, array_1.flatten)(artifactsNested);
    core.info(`Found ${artifactsToRemove.length} artifacts to remove for all included workflow runs`);
    for (const art of artifactsToRemove) {
        core.info(`Deleting artifact ${art.id}`);
        await github.rest.actions.deleteArtifact({
            owner,
            repo,
            artifact_id: art.id,
        });
    }
};
const updateArtifactComments = async (github, owner, repo, ref) => {
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
        const tag = `<!-- ${tag_1.COMMENT_TAG} -->`;
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
const run = async (context, github, excludeWorkflowRuns) => {
    const { repo: { owner, repo }, } = context;
    const ref = context.eventName === 'workflow_run'
        ? context.payload.workflow_run.head_branch
        : context.payload.ref;
    pruneArtifacts(github, excludeWorkflowRuns, owner, repo, ref);
    if (context.eventName === 'delete') {
        updateArtifactComments(github, owner, repo, ref);
    }
};
(0, run_1.attempt)(() => {
    const input = core.getMultilineInput('exclude-workflow-runs');
    (0, purify_ts_1.array)(codec_2.numericString)
        .decode(input)
        .caseOf({
        Left: (err) => core.setFailed(`Failed to parse input 'exclude-workflow-runs': ${err}`),
        Right: (excludeWorkflowRuns) => (0, run_1.withContext)(codec_1.Context, (context) => (0, run_1.withGithubClient)((github) => run(context, github, excludeWorkflowRuns))),
    });
});
//# sourceMappingURL=run.js.map