export type { WorkflowRunArtifact };

import type { Awaited } from 'util/type';
import type { GithubClient } from 'data/github-client';

type WorkflowRunArtifact = Awaited<
  ReturnType<GithubClient['rest']['actions']['listWorkflowRunArtifacts']>
>['data']['artifacts'][0];
