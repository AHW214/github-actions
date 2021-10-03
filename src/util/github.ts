export type { GithubClient };

import type { GitHub } from '@actions/github/lib/utils';

type GithubClient = InstanceType<typeof GitHub>;
