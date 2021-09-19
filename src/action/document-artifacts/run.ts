import * as core from '@actions/core';
import { context as globalContext } from '@actions/github';
import * as fs from 'fs';
import mustache from 'mustache';
import prettyBytes from 'pretty-bytes';

import type { Payload } from 'action/document-artifacts/codec';
import { decode } from 'action/document-artifacts/codec';
import { attempt, withGithubClient } from 'control/run';
import type { WorkflowRunArtifact } from 'data/artifact';
import type { Context } from 'data/context';
import type { GithubClient } from 'data/github-client';
import { getInputOneOf } from 'data/github-client';

type TemplateInput = { name: 'template-text' | 'template-path'; value: string };

type ArtifactEntry = {
  name: string;
  size: string;
  url: string;
};

type ArtifactNamedEntries = {
  [name: string]: ArtifactEntry;
};

type ArtifactListEntry = {
  artifact: ArtifactEntry;
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
  artifact: WorkflowRunArtifact,
): ArtifactEntry => ({
  name: artifact.name,
  size: prettyBytes(artifact.size_in_bytes),
  url: mkArtifactUrl(owner, repo, checkSuiteId, artifact.id),
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

  const [artifactNamedEntries, artifactListEntries] = artifacts.reduce<
    [ArtifactNamedEntries, Array<ArtifactListEntry>]
  >(
    ([namedEntries, listEntries], artifact) => {
      const entry = mkArtifactEntry(owner, repo, checkSuiteId, artifact);

      const namedEntry = { [entry.name]: entry };
      const listEntry = { artifact: entry };

      return [{ ...namedEntries, ...namedEntry }, [...listEntries, listEntry]];
    },
    [{}, []],
  );

  const rendered = mustache.render(template, {
    artifacts: artifactListEntries,
    ...artifactNamedEntries,
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

  core.info(JSON.stringify(globalContext.payload));

  return decode(globalContext).caseOf({
    Left: (err) => core.setFailed(`Failed to decode action context: ${err}`),
    Right: (context) =>
      withGithubClient((github) =>
        run(context, github, templateInput, templateOutput),
      ),
  });
});
