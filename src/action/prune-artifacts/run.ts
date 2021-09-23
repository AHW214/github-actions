import * as core from '@actions/core';
import { context as globalContext } from '@actions/github';
import { Just, Maybe, Nothing } from 'purify-ts';
import { array } from 'purify-ts';

import { isDeletePayload, Payload } from 'action/prune-artifacts/codec';
import { decode } from 'action/prune-artifacts/codec';
import { attempt, withGithubClient } from 'control/run';
import type { WorkflowRunArtifact } from 'data/artifact';
import type { IssueComment } from 'data/comment';
import { authorIsBot } from 'data/comment';
import type { Context } from 'data/context';
import type { GithubClient } from 'data/github-client';
import { flatten, partition } from 'util/array';
import { numericString } from 'util/codec';

// TODO - export from shared actions module
const COMMENT_TAG = 'POST_ARTIFACTS_COMMENT_TAG';

const findPostArtifactComments = (
  comments: Array<IssueComment>,
  removedArtifacts: Array<WorkflowRunArtifact>,
): Array<IssueComment> => {
  const regexTag = new RegExp(COMMENT_TAG);

  const hasCommentTag = (body: string) => regexTag.test(body);

  // TODO - what if only some removed
  const includesRemovedArtifact = (body: string) =>
    // TODO - meh
    removedArtifacts.some((art) => body.includes(String(art.id)));

  return Maybe.mapMaybe(
    (comment) =>
      Maybe.fromNullable(comment.body).chain((body) =>
        authorIsBot(comment) &&
        hasCommentTag(body) &&
        includesRemovedArtifact(body)
          ? Just(comment)
          : Nothing,
      ),
    comments,
  );
};

const run = async (
  context: Context<Payload>,
  github: GithubClient,
  excludeWorkflowRuns: Array<number>,
): Promise<void> => {
  const {
    repo: { owner, repo },
    payload,
  } = context;

  const ref = isDeletePayload(payload)
    ? payload.ref
    : payload.workflow_run.head_branch;

  core.info(`Pruning artifacts generated for branch ${ref}`);

  const {
    data: { workflow_runs: workflowRuns },
  } = await github.rest.actions.listWorkflowRunsForRepo({
    owner,
    repo,
    branch: ref,
    per_page: 100,
  });

  core.info(`Found ${workflowRuns.length} workflow runs for branch ${ref}`);

  const [excludeRuns, includeRuns] = partition(
    (run) => excludeWorkflowRuns.includes(run.id),
    workflowRuns,
  );

  if (excludeRuns.length > 0) {
    const excludeIds = excludeRuns.map((run) => run.id);
    core.info(`Excluding workflow runs with IDs: [${excludeIds}]`);
  }

  const artifactsNested = await Promise.all(
    includeRuns.map(async (run) => {
      const {
        data: { artifacts },
      } = await github.rest.actions.listWorkflowRunArtifacts({
        owner,
        repo,
        run_id: run.id,
        per_page: 100,
      });

      return artifacts;
    }),
  );

  const artifactsToRemove = flatten(artifactsNested);

  core.info(
    `Found ${artifactsToRemove.length} artifacts to remove for all included workflow runs`,
  );

  for (const art of artifactsToRemove) {
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
  const postArtifactComments = findPostArtifactComments(
    comments,
    artifactsToRemove,
  );

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
  const input = core.getMultilineInput('exclude-workflow-runs');

  array(numericString)
    .decode(input)
    .caseOf({
      Left: (err) =>
        core.setFailed(`Failed to parse input 'exclude-workflow-runs': ${err}`),
      Right: (excludeWorkflowRuns) =>
        decode(globalContext).caseOf({
          Left: (err) =>
            core.setFailed(`Failed to decode action context: ${err}`),
          Right: (context) =>
            withGithubClient((github) =>
              run(context, github, excludeWorkflowRuns),
            ),
        }),
    });
});
