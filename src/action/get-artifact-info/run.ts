import * as core from '@actions/core';
import { context as globalContext } from '@actions/github';

import type { Payload } from 'action/get-artifact-info/codec';
import { decode } from 'action/get-artifact-info/codec';
import { attempt, withGithubClient } from 'control/run';
import type { ArtifactInfo } from 'data/artifact';
import { mkArtifactInfo } from 'data/artifact';
import type { Context } from 'data/context';
import type { GithubClient } from 'data/github-client';

type ArtifactInfoArray = Array<ArtifactInfo>;

type ArtifactInfoObject = {
  [name: string]: ArtifactInfo;
};

const run = async (
  context: Context<Payload>,
  github: GithubClient,
): Promise<void> => {
  const {
    repo: { owner, repo },
    payload: {
      workflow_run: { id: runId, check_suite_id: checkSuiteId },
    },
  } = context;

  const {
    data: { artifacts },
  } = await github.rest.actions.listWorkflowRunArtifacts({
    owner,
    repo,
    run_id: runId,
  });

  core.info(`Found ${artifacts.length} artifacts for workflow run #${runId}`);

  const [artifactInfoObject, artifactInfoArray] = artifacts.reduce<
    [ArtifactInfoObject, ArtifactInfoArray]
  >(
    ([infoObject, infoArray], artifact) => {
      const info = mkArtifactInfo(owner, repo, checkSuiteId, artifact);
      return [{ ...infoObject, [info.name]: info }, [...infoArray, info]];
    },
    [{}, []],
  );

  core.info('Writing artifact info to outputs...');

  core.setOutput('artifact-info-object', artifactInfoObject);
  core.setOutput('artifact-info-array', artifactInfoArray);

  core.info('Done!');
};

attempt(() =>
  decode(globalContext).caseOf({
    Left: (err) => core.setFailed(`Failed to decode action context: ${err}`),
    Right: (context) => withGithubClient((github) => run(context, github)),
  }),
);
