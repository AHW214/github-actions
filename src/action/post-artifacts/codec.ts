export { Context };

import type { GetType } from 'purify-ts';
import { Codec, nonEmptyList, number, string } from 'purify-ts';

type Context = GetType<typeof Context>;

const PullRequest = Codec.interface({
  number: number,
});

const WorkflowRun = Codec.interface({
  id: number,
  check_suite_id: number,
  pull_requests: nonEmptyList(PullRequest),
});

const Payload = Codec.interface({
  workflow_run: WorkflowRun,
});

const Repository = Codec.interface({
  owner: string,
  repo: string,
});

const Context = Codec.interface({
  repo: Repository,
  payload: Payload,
});
