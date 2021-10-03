import * as core from '@actions/core';
import { Just, Maybe, Nothing } from 'purify-ts';
import { array } from 'purify-ts';

import { Context } from 'action/prune-artifacts/codec';
import { COMMENT_TAG } from 'action/shared/tag';
import { attempt, withContext, withGithubClient } from 'control/run';
import type { IssueComment } from 'data/comment';
import { authorIsBot } from 'data/comment';
import { flatten, partition } from 'util/array';
import { numericString } from 'util/codec';
import type { GithubClient } from 'util/github';

const findPostArtifactComments = (
  comments: Array<IssueComment>,
): Array<IssueComment> => {
  const regexTag = new RegExp(COMMENT_TAG);
  const hasCommentTag = (body: string) => regexTag.test(body);

  return Maybe.mapMaybe(
    (comment) =>
      Maybe.fromNullable(comment.body).chain((body) =>
        authorIsBot(comment) && hasCommentTag(body) ? Just(comment) : Nothing,
      ),
    comments,
  );
};

const pruneArtifacts = async (
  github: GithubClient,
  excludeWorkflowRuns: Array<number>,
  owner: string,
  repo: string,
  ref: string,
) => {
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
};

const updateArtifactComments = async (
  github: GithubClient,
  owner: string,
  repo: string,
  ref: string,
) => {
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

const run = async (
  context: Context,
  github: GithubClient,
  excludeWorkflowRuns: Array<number>,
): Promise<void> => {
  const {
    repo: { owner, repo },
  } = context;

  const ref =
    context.eventName === 'workflow_run'
      ? context.payload.workflow_run.head_branch
      : context.payload.ref;

  pruneArtifacts(github, excludeWorkflowRuns, owner, repo, ref);

  if (context.eventName === 'delete') {
    updateArtifactComments(github, owner, repo, ref);
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
        withContext(Context, (context) =>
          withGithubClient((github) =>
            run(context, github, excludeWorkflowRuns),
          ),
        ),
    });
});
