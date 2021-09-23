import * as core from '@actions/core';
import { context as globalContext } from '@actions/github';
import dateformat from 'dateformat';
import * as fs from 'fs';
import mustache from 'mustache';
import prettyBytes from 'pretty-bytes';
import type { Maybe } from 'purify-ts';

import type { Payload } from 'action/document-artifacts/codec';
import { decode } from 'action/document-artifacts/codec';
import { attempt, withGithubClient } from 'control/run';
import type { WorkflowRunArtifact } from 'data/artifact';
import type { Context } from 'data/context';
import type { GithubClient } from 'data/github-client';
import {
  getInputMaybe,
  getInputOneOf,
  getInputRequired,
} from 'data/github-client';
import { parseObject } from 'data/yaml';

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

type CommitEntry = {
  author: string;
  message: string;
};

type UpdatedAtEntry = {
  dateIso: string;
  dateMed: string;
  timeIso: string;
  timeShort: string;
};

type WorkflowRunEntry = {
  headBranch: string;
  headCommit: CommitEntry;
  headSha: string;
  headShaShort: string;
  updatedAt: UpdatedAtEntry;
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
  templateVariables: Maybe<string>,
): Promise<void> => {
  const {
    repo: { owner, repo },
    payload: {
      workflow_run: {
        id: runId,
        check_suite_id: checkSuiteId,
        head_branch: headBranch,
        head_commit: headCommit,
        head_sha: headSha,
        updated_at: updatedAt,
      },
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

  const commitEntry: CommitEntry = {
    author: headCommit.author.name,
    // TODO - Truncate if Long
    message: headCommit.message,
  };

  const formatUpdatedAt = (mask: string): string =>
    dateformat(updatedAt, `UTC:${mask}`);

  const updatedAtEntry: UpdatedAtEntry = {
    dateIso: formatUpdatedAt('yyyy-mm-dd'),
    dateMed: formatUpdatedAt('mmm d, yyyy'),
    timeIso: formatUpdatedAt('HH:MM:ss'),
    timeShort: formatUpdatedAt('h:MM TT'),
  };

  const workflowRunEntry: WorkflowRunEntry = {
    headBranch,
    headCommit: commitEntry,
    headSha,
    headShaShort: headSha.substring(0, 7),
    updatedAt: updatedAtEntry,
  };

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

  const variablesEntries = templateVariables
    .chain((vars) =>
      parseObject(vars)
        .ifLeft((err) =>
          core.warning(`Could not parse template variables: ${err}`),
        )
        .toMaybe(),
    )
    .orDefault({});

  const rendered = mustache.render(template, {
    ...variablesEntries,
    ...artifactNamedEntries,
    artifacts: artifactListEntries,
    workflowRun: workflowRunEntry,
  });

  core.info(`Writing template to ${templateOutput}`);

  fs.writeFileSync(templateOutput, rendered, 'utf-8');
};

attempt(() => {
  const templateOutput = getInputRequired('output-path');
  const templateInput = getInputOneOf('template-text', 'template-path');
  const templateVariables = getInputMaybe('template-variables');

  if (templateInput.type === 'Many')
    return core.setFailed(`Can only set one of ${templateInput.names}`);

  if (templateInput.type === 'None')
    return core.setFailed('Template source not specified.');

  return decode(globalContext).caseOf({
    Left: (err) => core.setFailed(`Failed to decode action context: ${err}`),
    Right: (context) =>
      withGithubClient((github) =>
        run(context, github, templateInput, templateOutput, templateVariables),
      ),
  });
});
