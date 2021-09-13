export type { WorkflowRunArtifact };

import type { GithubClient } from 'data/github-client';
import type { Awaited } from 'util/type';

type WorkflowRunArtifact = Awaited<
  ReturnType<GithubClient['rest']['actions']['listWorkflowRunArtifacts']>
>['data']['artifacts'][0];
