import * as core from '@actions/core';
import { context as globalContext } from '@actions/github';
import { Just, Maybe, Nothing } from 'purify-ts';

import { Context, decode } from 'action/post-artifacts/codec';
import { attempt, withGithubClient } from 'control/run';
import type { WorkflowRunArtifact } from 'data/artifact';
import type { IssueComment } from 'data/comment';
import { authorIsBot } from 'data/comment';
import type { GithubClient } from 'data/github-client';
import { getInputMaybe } from 'data/github-client';

type CommentInfo = {
  artifactIds: Array<number>;
  commentId: number;
};

const COMMENT_TAG = 'POST_ARTIFACTS_COMMENT_TAG';

const makeCommentBody = (
  context: Context,
  checkSuiteId: number,
  artifacts: Array<WorkflowRunArtifact>,
  commentHeader: Maybe<string>,
): string => {
  const {
    repo: { owner, repo },
  } = context;

  const tag = `<!-- ${COMMENT_TAG} -->`;

  const header = commentHeader.orDefault('Download your builds below:');

  const body = artifacts.reduce((acc, art) => {
    const name = `${art.name}.zip`;
    const link = `https://github.com/${owner}/${repo}/suites/${checkSuiteId}/artifacts/${art.id}`;
    return `${acc}\n* [${name}](${link})`;
  }, '');

  return `${tag}\n${header}\n${body}`;
};

const findOutdatedComments = async (
  context: Context,
  github: GithubClient,
  issueNumber: number,
): Promise<Array<CommentInfo>> => {
  const {
    repo: { owner, repo },
  } = context;

  const { data: comments } = await github.rest.issues.listComments({
    repo,
    owner,
    issue_number: issueNumber,
  });

  const regexTag = new RegExp(COMMENT_TAG);

  const regexArtifact = new RegExp(
    `${owner}\/${repo}\/suites\/\\d+\/artifacts\/(\\d+)`,
    'g',
  );

  return Maybe.mapMaybe((comment) => {
    if (!authorIsBot(comment) || !comment.body || !regexTag.test(comment.body))
      return Nothing;

    const matches = [...comment.body.matchAll(regexArtifact)];
    const artifactIds = matches
      .map((m) => Number(m[1]))
      .filter((id) => !isNaN(id));

    return Just({ commentId: comment.id, artifactIds });
  }, comments);
};

const handleOutdatedArtifacts = async (
  context: Context,
  github: GithubClient,
  newComment: IssueComment,
  outdatedComments: Array<CommentInfo>,
  outdatedCommentTemplate: Maybe<string>,
): Promise<void> => {
  const {
    repo: { owner, repo },
  } = context;

  for (const { commentId, artifactIds } of outdatedComments) {
    for (const artifactId of artifactIds) {
      core.info(`Deleting outdated artifact ${artifactId}`);

      try {
        await github.rest.actions.deleteArtifact({
          owner,
          repo,
          artifact_id: artifactId,
        });
      } catch (err) {
        // TODO
        core.info('Probably already deleted');
      }
    }

    core.info(`Updating outdated comment ${commentId}`);

    const tag = `<!-- ${COMMENT_TAG} -->`;

    const body = outdatedCommentTemplate.caseOf({
      Just: (template) => template.replace(':new-comment', newComment.html_url),
      Nothing: () =>
        '**These artifacts are outdated and have been deleted. ' +
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

const postNewComment = async (
  context: Context,
  github: GithubClient,
  issueNumber: number,
  body: string,
): Promise<IssueComment> => {
  const {
    repo: { owner, repo },
  } = context;

  core.info('Posting new comment');

  const { data } = await github.rest.issues.createComment({
    repo,
    owner,
    issue_number: issueNumber,
    body,
  });

  return data;
};

const run = async (
  context: Context,
  github: GithubClient,
  commentHeader: Maybe<string>,
  outdatedCommentTemplate: Maybe<string>,
  removeOutdatedArtifacts: boolean,
): Promise<void> => {
  const {
    repo: { owner, repo },
    payload: {
      workflow_run: {
        id: runId,
        check_suite_id: checkSuiteId,
        pull_requests: [{ number: issueNumber }],
      },
    },
  } = context;

  core.info(`Posting to pull request #${issueNumber}`);

  const {
    data: { artifacts },
  } = await github.rest.actions.listWorkflowRunArtifacts({
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

  const outdatedComments = await findOutdatedComments(
    context,
    github,
    issueNumber,
  );

  const newComment = await postNewComment(context, github, issueNumber, body);

  await handleOutdatedArtifacts(
    context,
    github,
    newComment,
    outdatedComments,
    outdatedCommentTemplate,
  );
};

attempt(() => {
  const commentHeader = getInputMaybe('comment-header');
  const outdatedCommentTemplate = getInputMaybe('outdated-comment-template');
  const removeOutdatedArtifacts = core.getBooleanInput(
    'remove-outdated-artifacts',
  );

  return decode(globalContext).caseOf({
    Left: (err) => core.setFailed(`Failed to decode action context: ${err}`),
    Right: (context) =>
      withGithubClient((github) =>
        run(
          context,
          github,
          commentHeader,
          outdatedCommentTemplate,
          removeOutdatedArtifacts,
        ),
      ),
  });
});
