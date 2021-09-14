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
const run_1 = require("../../control/run");
const artifact_1 = require("../../data/artifact");
const comment_1 = require("../../data/comment");
const comment_2 = require("../../data/comment");
const github_client_1 = require("../../data/github-client");
const github_client_2 = require("../../data/github-client");
const COMMENT_TAG = 'POST_ARTIFACTS_COMMENT_TAG';
const makeCommentBody = (context, checkSuiteId, artifacts, commentHeader) => {
    const { repo: { owner, repo }, } = context;
    const tag = `<!-- ${COMMENT_TAG} -->`;
    const header = commentHeader.orDefault('Download your builds below:');
    const body = artifacts.reduce((acc, art) => {
        const name = `${art.name}.zip`;
        const link = `https://github.com/${owner}/${repo}/suites/${checkSuiteId}/artifacts/${art.id}`;
        return `${acc}\n* [${name}](${link})`;
    }, '');
    return `${tag}\n${header}\n${body}`;
};
const findOutdatedComments = async (context, github, issueNumber) => {
    const { repo: { owner, repo }, } = context;
    const { data: comments } = await github.rest.issues.listComments({
        repo,
        owner,
        issue_number: issueNumber,
    });
    const regexTag = new RegExp(COMMENT_TAG);
    const regexArtifact = new RegExp(`${owner}\/${repo}\/suites\/\\d+\/artifacts\/(\\d+)`, 'g');
    return purify_ts_1.Maybe.mapMaybe((comment) => {
        if (!(0, comment_2.authorIsBot)(comment) || !comment.body || !regexTag.test(comment.body))
            return purify_ts_1.Nothing;
        const matches = [...comment.body.matchAll(regexArtifact)];
        const artifactIds = matches
            .map((m) => Number(m[1]))
            .filter((id) => !isNaN(id));
        return (0, purify_ts_1.Just)({ commentId: comment.id, artifactIds });
    }, comments);
};
const handleOutdatedArtifacts = async (context, github, newComment, outdatedComments, outdatedCommentTemplate) => {
    const { repo: { owner, repo }, } = context;
    for (const { commentId, artifactIds } of outdatedComments) {
        for (const artifactId of artifactIds) {
            core.info(`Deleting outdated artifact ${artifactId}`);
            try {
                await github.rest.actions.deleteArtifact({
                    owner,
                    repo,
                    artifact_id: artifactId,
                });
            }
            catch (err) {
                // TODO
                core.info('Probably already deleted');
            }
        }
        core.info(`Updating outdated comment ${commentId}`);
        const tag = `<!-- ${COMMENT_TAG} -->`;
        const body = outdatedCommentTemplate.caseOf({
            Just: (template) => template.replace(':new-comment', newComment.html_url),
            Nothing: () => '**These artifacts are outdated and have been deleted. ' +
                `View [this comment](${newComment.html_url}) for the most recent artifacts.**`,
        });
        const taggedBody = `${tag}\n${body}`;
        await github.rest.issues.updateComment({
            repo,
            owner,
            comment_id: commentId,
            body: taggedBody,
        });
    }
};
const postNewComment = async (context, github, issueNumber, body) => {
    const { repo: { owner, repo }, } = context;
    core.info('Posting new comment');
    const { data } = await github.rest.issues.createComment({
        repo,
        owner,
        issue_number: issueNumber,
        body,
    });
    return data;
};
const run = async (context, github, commentHeader, outdatedCommentTemplate, removeOutdatedArtifacts) => {
    const { repo: { owner, repo }, payload: { workflow_run: { id: runId, check_suite_id: checkSuiteId, pull_requests: [{ number: issueNumber }], }, }, } = context;
    core.info(`Posting to pull request #${issueNumber}`);
    const { data: { artifacts }, } = await github.rest.actions.listWorkflowRunArtifacts({
        owner,
        repo,
        run_id: runId,
    });
    if (artifacts.length <= 0) {
        return core.info('No artifacts to post, exiting...');
    }
    const body = makeCommentBody(context, checkSuiteId, artifacts, commentHeader);
    if (!removeOutdatedArtifacts) {
        await postNewComment(context, github, issueNumber, body);
        return core.info('Leaving outdated artifacts, exiting...');
    }
    const outdatedComments = await findOutdatedComments(context, github, issueNumber);
    const newComment = await postNewComment(context, github, issueNumber, body);
    await handleOutdatedArtifacts(context, github, newComment, outdatedComments, outdatedCommentTemplate);
};
(0, run_1.attempt)(() => {
    const commentHeader = (0, github_client_2.getInputMaybe)('comment-header');
    const outdatedCommentTemplate = (0, github_client_2.getInputMaybe)('outdated-comment-template');
    const removeOutdatedArtifacts = core.getBooleanInput('remove-outdated-artifacts');
    return (0, codec_1.decode)(github_1.context).caseOf({
        Left: (err) => core.setFailed(`Failed to decode action context: ${err}`),
        Right: (context) => (0, run_1.withGithubClient)((github) => run(context, github, commentHeader, outdatedCommentTemplate, removeOutdatedArtifacts)),
    });
});
//# sourceMappingURL=run.js.map