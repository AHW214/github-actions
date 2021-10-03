export type { ArtifactInfo, WorkflowRunArtifact };
export { mkArtifactInfo };

import prettyBytes from 'pretty-bytes';

import type { Awaited } from 'util/type';
import type { GithubClient } from 'data/github-client';

type WorkflowRunArtifact = Awaited<
  ReturnType<GithubClient['rest']['actions']['listWorkflowRunArtifacts']>
>['data']['artifacts'][0];

type ArtifactInfo = {
  name: string;
  size: string;
  url: string;
};

const mkArtifactUrl = (
  owner: string,
  repo: string,
  checkSuiteId: number,
  artifactId: number,
) =>
  `https://github.com/${owner}/${repo}/suites/${checkSuiteId}/artifacts/${artifactId}`;

const mkArtifactInfo = (
  owner: string,
  repo: string,
  checkSuiteId: number,
  artifact: WorkflowRunArtifact,
): ArtifactInfo => ({
  name: artifact.name,
  size: prettyBytes(artifact.size_in_bytes),
  url: mkArtifactUrl(owner, repo, checkSuiteId, artifact.id),
});
