import * as core from '@actions/core';

import { Context } from 'action/get-artifact-info/context';
import { attempt, withContext, withGithubClient } from 'control/run';
import type { ArtifactInfo } from 'data/artifact';
import { mkArtifactInfo } from 'data/artifact';
import type { GithubClient } from 'util/github';

type ArtifactInfoArray = Array<{
  artifact: ArtifactInfo;
}>;

type ArtifactInfoObject = {
  [name: string]: ArtifactInfo;
};

const run = async (context: Context, github: GithubClient): Promise<void> => {
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

      return [
        { ...infoObject, [info.name]: info },
        [...infoArray, { artifact: info }],
      ];
    },
    [{}, []],
  );

  core.info('Writing artifact info to outputs...');

  core.setOutput('artifact-info-object', artifactInfoObject);
  core.setOutput('artifact-info-array', artifactInfoArray);

  core.info('Done!');
};

attempt(() =>
  withContext(Context, (context) =>
    withGithubClient((github) => run(context, github)),
  ),
);
