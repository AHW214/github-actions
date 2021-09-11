import * as core from '@actions/core';
import { context as globalContext } from '@actions/github';
import type { Context } from '@actions/github/lib/context';
import { Maybe } from 'purify-ts';

import { attempt, withGithubClient } from './control/run';
import type { WorkflowRunArtifact } from './data/artifact';
import type { IssueComment } from './data/comment';
import { authorIsBot } from './data/comment';
import type { GithubClient } from './data/github-client';
import { getInputMaybe } from './data/github-client';
import { mapFalsy } from './data/maybe';

type CommentInfo = {
  artifactIds: Array<number>;
  commentId: number;
};

const makeCommentBody = (
  context: Context,
  checkSuiteId: number,
  artifacts: Array<WorkflowRunArtifact>,
  commentHeader: Maybe<string>,
): string => {
  const {
    repo: { owner, repo },
  } = context;

  const header = commentHeader.orDefault('Download your builds below:\n');

  return artifacts.reduce((acc, art) => {
    const name = `${art.name}.zip`;
    const link = `https://github.com/${owner}/${repo}/suites/${checkSuiteId}/artifacts/${art.id}`;
    return `${acc}\n* [${name}](${link})`;
  }, header);
};

const findOutdatedComments = async (
  context: Context,
  github: GithubClient,
): Promise<Array<CommentInfo>> => {
  const {
    issue,
    repo: { owner, repo },
  } = context;

  const { data: comments } = await github.rest.issues.listComments({
    repo,
    owner,
    issue_number: issue.number,
  });

  const regexArtifact = new RegExp(
    `${owner}\/${repo}\/suites\/\\d+\/artifacts\/(\\d+)`,
    'g',
  );

  return mapFalsy((comment) => {
    if (!authorIsBot(comment) || !comment.body) return undefined;

    const matches = [...comment.body.matchAll(regexArtifact)];
    const artifactIds = matches.map((m) => Number(m[1])).filter(isNaN);

    return artifactIds.length > 0 && { commentId: comment.id, artifactIds };
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

    core.info(`Marking comment ${commentId} as outdated`);

    const body = outdatedCommentTemplate.caseOf({
      Just: (template) => template.replace(':new-comment', newComment.html_url),
      Nothing: () =>
        '**These artifacts are outdated and have been deleted. ' +
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

const postNewComment = async (
  context: Context,
  github: GithubClient,
  body: string,
): Promise<IssueComment> => {
  const {
    issue,
    repo: { owner, repo },
  } = context;

  core.info('Posting new comment');

  const { data } = await github.rest.issues.createComment({
    repo,
    owner,
    issue_number: issue.number,
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
    issue: { number: issueNumber },
    repo: { owner, repo },
    runId,
  } = context;

  core.info(JSON.stringify(context.payload));

  core.info(`Posting to pull request #${issueNumber}`);

  const {
    data: { check_suite_id: checkSuiteId },
  } = await github.rest.actions.getWorkflowRun({ owner, repo, run_id: runId });

  if (checkSuiteId === undefined) {
    return core.error('No check suite found');
  }

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
    await postNewComment(context, github, body);
    return core.info('Leaving outdated artifacts, exiting...');
  }

  const outdatedComments = await findOutdatedComments(context, github);
  const newComment = await postNewComment(context, github, body);

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

  return withGithubClient((github) =>
    run(
      globalContext,
      github,
      commentHeader,
      outdatedCommentTemplate,
      removeOutdatedArtifacts,
    ),
  );
});
