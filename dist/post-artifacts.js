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
const run_1 = require("./control/run");
const comment_1 = require("./data/comment");
const github_client_1 = require("./data/github-client");
const maybe_1 = require("./data/maybe");
const makeCommentBody = (context, checkSuiteId, artifacts, commentHeader) => {
    const { repo: { owner, repo }, } = context;
    const header = commentHeader.orDefault('Download your builds below:\n');
    return artifacts.reduce((acc, art) => {
        const name = `${art.name}.zip`;
        const link = `https://github.com/${owner}/${repo}/suites/${checkSuiteId}/artifacts/${art.id}`;
        return `${acc}\n* [${name}](${link})`;
    }, header);
};
const findOutdatedComments = async (context, github, issueNumber) => {
    const { repo: { owner, repo }, } = context;
    const { data: comments } = await github.rest.issues.listComments({
        repo,
        owner,
        issue_number: issueNumber,
    });
    const regexArtifact = new RegExp(`${owner}\/${repo}\/suites\/\\d+\/artifacts\/(\\d+)`, 'g');
    return maybe_1.mapFalsy((comment) => {
        core.info(JSON.stringify(comment));
        if (!comment_1.authorIsBot(comment) || !comment.body)
            return undefined;
        core.info('1');
        const matches = [...comment.body.matchAll(regexArtifact)];
        core.info(`${matches}`);
        const artifactIds = matches.map((m) => Number(m[1])).filter(isNaN);
        return artifactIds.length > 0 && { commentId: comment.id, artifactIds };
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
        core.info(`Marking comment ${commentId} as outdated`);
        const body = outdatedCommentTemplate.caseOf({
            Just: (template) => template.replace(':new-comment', newComment.html_url),
            Nothing: () => '**These artifacts are outdated and have been deleted. ' +
                `View [this comment](${newComment.html_url}) for the most recent artifacts.**`,
        });
        await github.rest.issues.updateComment({
            repo,
            owner,
            comment_id: commentId,
            body,
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
    var _a, _b;
    const { payload: { workflow_run: workflowRun }, repo: { owner, repo }, } = context;
    const runId = workflowRun === null || workflowRun === void 0 ? void 0 : workflowRun.id;
    const checkSuiteId = workflowRun === null || workflowRun === void 0 ? void 0 : workflowRun.check_suite_id;
    const issueNumber = (_b = (_a = workflowRun === null || workflowRun === void 0 ? void 0 : workflowRun.pull_requests) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.number;
    if (runId === undefined) {
        return core.error('No workflow run found');
    }
    if (checkSuiteId === undefined) {
        return core.error('No check suite found');
    }
    if (issueNumber === undefined) {
        return core.error('No issue number found');
    }
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
run_1.attempt(() => {
    const commentHeader = github_client_1.getInputMaybe('comment-header');
    const outdatedCommentTemplate = github_client_1.getInputMaybe('outdated-comment-template');
    const removeOutdatedArtifacts = core.getBooleanInput('remove-outdated-artifacts');
    return run_1.withGithubClient((github) => run(github_1.context, github, commentHeader, outdatedCommentTemplate, removeOutdatedArtifacts));
});
//# sourceMappingURL=post-artifacts.js.map