import * as core from '@actions/core';
import { context as globalContext } from '@actions/github';
import * as fs from 'fs';
import mustache from 'mustache';

import type { Payload } from 'action/document-artifacts/codec';
import { decode } from 'action/document-artifacts/codec';
import { attempt, withGithubClient } from 'control/run';
import type { WorkflowRunArtifact } from 'data/artifact';
import type { Context } from 'data/context';
import type { GithubClient } from 'data/github-client';
import { getInputOneOf } from 'data/github-client';

type TemplateInput = { name: 'template-text' | 'template-path'; value: string };

type ArtifactEntries = {
  [name: string]: string;
};

type ArtifactListEntry = {
  name: string;
  url: string;
};

const mkArtifactUrl = (
  owner: string,
  repo: string,
  checkSuiteId: number,
  artifactId: number,
) =>
  `https://github.com/${owner}/${repo}/suites/${checkSuiteId}/artifacts/${artifactId}`;

const mkArtifactEntry = (
  owner: string,
  repo: string,
  checkSuiteId: number,
  { name, id }: WorkflowRunArtifact,
): ArtifactEntries => ({
  [name]: mkArtifactUrl(owner, repo, checkSuiteId, id),
});

const mkArtifactListEntry = (
  owner: string,
  repo: string,
  checkSuiteId: number,
  { name, id }: WorkflowRunArtifact,
): ArtifactListEntry => ({
  name,
  url: mkArtifactUrl(owner, repo, checkSuiteId, id),
});

const run = async (
  context: Context<Payload>,
  github: GithubClient,
  templateInput: TemplateInput,
  templateOutput: string,
): Promise<void> => {
  const {
    repo: { owner, repo },
    payload: {
      workflow_run: { id: runId, check_suite_id: checkSuiteId },
    },
  } = context;

  const template =
    templateInput.name === 'template-path'
      ? fs.readFileSync(templateInput.value, 'utf-8')
      : templateInput.value;

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

  const artifactEntries = artifacts.reduce<ArtifactEntries>((acc, art) => {
    const entry = mkArtifactEntry(owner, repo, checkSuiteId, art);
    return { ...acc, ...entry };
  }, {});

  const artifactListEntries = artifacts.map((art) =>
    mkArtifactListEntry(owner, repo, checkSuiteId, art),
  );

  const rendered = mustache.render(template, {
    artifacts: artifactListEntries,
    ...artifactEntries,
  });

  core.info(`Writing template to ${templateOutput}`);

  fs.writeFileSync(templateOutput, rendered, 'utf-8');
};

attempt(() => {
  const templateOutput = core.getInput('output-path');
  const templateInput = getInputOneOf('template-text', 'template-path');

  if (templateInput.type === 'Many')
    return core.setFailed(`Can only set one of ${templateInput.names}`);

  if (templateInput.type === 'None')
    return core.setFailed('Template source not specified.');

  return decode(globalContext).caseOf({
    Left: (err) => core.setFailed(`Failed to decode action context: ${err}`),
    Right: (context) =>
      withGithubClient((github) =>
        run(context, github, templateInput, templateOutput),
      ),
  });
});
