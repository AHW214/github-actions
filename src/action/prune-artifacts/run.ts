import * as core from '@actions/core';
import { context as globalContext } from '@actions/github';
import { Just, Maybe, Nothing } from 'purify-ts';

import type { Payload } from 'action/prune-artifacts/codec';
import { decode } from 'action/prune-artifacts/codec';
import { attempt, withGithubClient } from 'control/run';
import type { IssueComment } from 'data/comment';
import { authorIsBot } from 'data/comment';
import type { Context } from 'data/context';
import type { GithubClient } from 'data/github-client';
import { flatten } from 'util/array';

const COMMENT_TAG = 'POST_ARTIFACTS_COMMENT_TAG';

const findPostArtifactComments = (
  comments: Array<IssueComment>,
): Array<IssueComment> => {
  const regexTag = new RegExp(COMMENT_TAG);

  return Maybe.mapMaybe(
    (comment) =>
      authorIsBot(comment) && comment.body && regexTag.test(comment.body)
        ? Just(comment)
        : Nothing,
    comments,
  );
};

const run = async (
  context: Context<Payload>,
  github: GithubClient,
): Promise<void> => {
  const {
    repo: { owner, repo },
    payload: { ref, ref_type },
  } = context;

  if (ref_type !== 'branch') {
    return core.info('Ref not a branch, exiting...');
  }

  core.info(`Pruning artifacts generated for branch ${ref}`);

  const {
    data: { workflow_runs: workflowRuns },
  } = await github.rest.actions.listWorkflowRunsForRepo({
    owner,
    repo,
    branch: ref,
    per_page: 100,
  });

  core.info(JSON.stringify(workflowRuns));

  const results = await Promise.all(
    workflowRuns.map(async ({ id }) => {
      const {
        data: { artifacts },
      } = await github.rest.actions.listWorkflowRunArtifacts({
        owner,
        repo,
        run_id: id,
        per_page: 100,
      });

      return artifacts;
    }),
  );

  const artifacts = flatten(results);

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

  const commentsNested = await Promise.all(
    pullRequests.map(async ({ number }) => {
      const { data: comments } = await github.rest.issues.listComments({
        owner,
        repo,
        issue_number: number,
        per_page: 100,
      });

      return comments;
    }),
  );

  const comments = flatten(commentsNested);
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

attempt(() => {
  return decode(globalContext).caseOf({
    Left: (err) => core.setFailed(`Failed to decode action context: ${err}`),
    Right: (context) => withGithubClient((github) => run(context, github)),
  });
});
