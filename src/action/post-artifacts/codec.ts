export { Context, decode };

import type { Context as GithubContext } from '@actions/github/lib/context';
import type { Either, GetType } from 'purify-ts';
import { Codec, nonEmptyList, number } from 'purify-ts';

type Payload = GetType<typeof Payload>;

type Context = {
  repo: {
    owner: string;
    repo: string;
  };
  payload: Payload;
};

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

const decode = (context: GithubContext): Either<string, Context> => {
  const { repo, payload } = context;
  return Payload.decode(payload).map((payload) => ({ repo, payload }));
};
