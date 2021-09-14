export { Payload, decode };

import type { GetType } from 'purify-ts';
import { Codec, nonEmptyList, number } from 'purify-ts';

import { decodeWith } from 'data/context';

type Payload = GetType<typeof Payload>;

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

const decode = decodeWith(Payload);
