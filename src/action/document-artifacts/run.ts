import * as core from '@actions/core';
import { context as globalContext } from '@actions/github';
import mustache from 'mustache';

import type { Payload } from 'action/document-artifacts/codec';
import { decode } from 'action/document-artifacts/codec';
import { attempt, withGithubClient } from 'control/run';
import type { WorkflowRunArtifact } from 'data/artifact';
import type { Context } from 'data/context';
import type { GithubClient } from 'data/github-client';

type ArtifactView = {
  name: string;
  url: string;
};

const artifactView = (
  owner: string,
  repo: string,
  checkSuiteId: number,
  { name, id }: WorkflowRunArtifact,
): ArtifactView => ({
  name,
  url: `https://github.com/${owner}/${repo}/suites/${checkSuiteId}/artifacts/${id}`,
});

const thing = (
  owner: string,
  repo: string,
  checkSuiteId: number,
  { name, id }: WorkflowRunArtifact,
) => ({
  [name]: `https://github.com/${owner}/${repo}/suites/${checkSuiteId}/artifacts/${id}`,
});

const run = async (
  context: Context<Payload>,
  github: GithubClient,
  template: string,
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

  if (artifacts.length <= 0) {
    return core.info('No artifacts to document, exiting...');
  }

  const artifactViews = artifacts.map((art) =>
    artifactView(owner, repo, checkSuiteId, art),
  );

  const things = artifacts.reduce<{ [x: string]: string }>(
    (acc, art) => ({ ...acc, ...thing(owner, repo, checkSuiteId, art) }),
    {},
  );

  core.info(JSON.stringify(things));

  const rendered = mustache.render(template, {
    artifacts: artifactViews,
    ...things,
  });

  core.info(rendered);
};

attempt(() => {
  const template = core.getInput('template', { required: true });

  return decode(globalContext).caseOf({
    Left: (err) => core.setFailed(`Failed to decode action context: ${err}`),
    Right: (context) =>
      withGithubClient((github) => run(context, github, template)),
  });
});
