export { Payload, decode };

import type { GetType } from 'purify-ts';
import { Codec, number } from 'purify-ts';

import { decodeWith } from 'data/context';

type Payload = GetType<typeof Payload>;

const WorkflowRun = Codec.interface({
  id: number,
  check_suite_id: number,
});

const Payload = Codec.interface({
  workflow_run: WorkflowRun,
});

const decode = decodeWith(Payload);
