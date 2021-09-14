import * as core from '@actions/core';
import { context as globalContext } from '@actions/github';

import type { Payload } from 'action/prune-artifacts/codec';
import { decode } from 'action/prune-artifacts/codec';
import { attempt, withGithubClient } from 'control/run';
import { Context } from 'data/context';
import { GithubClient } from 'data/github-client';
import { flatten } from 'util/array';

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

  core.info(JSON.stringify(artifacts));
};

attempt(() => {
  return decode(globalContext).caseOf({
    Left: (err) => core.setFailed(`Failed to decode action context: ${err}`),
    Right: (context) => withGithubClient((github) => run(context, github)),
  });
});
