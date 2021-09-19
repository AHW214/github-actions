export { Payload, decode };

import type { GetType } from 'purify-ts';
import { Codec, number, string } from 'purify-ts';

import { decodeWith } from 'data/context';

type Payload = GetType<typeof Payload>;

const Author = Codec.interface({
  name: string,
});

const Commit = Codec.interface({
  author: Author,
  message: string,
});

const WorkflowRun = Codec.interface({
  id: number,
  check_suite_id: number,
  head_branch: string,
  head_commit: Commit,
  head_sha: string,
  updated_at: string,
});

const Payload = Codec.interface({
  workflow_run: WorkflowRun,
});

const decode = decodeWith(Payload);
