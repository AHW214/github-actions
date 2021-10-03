export type { Context };
export { decodeWith };

import type { Codec, Either } from 'purify-ts';
import type { Context as GithubContext } from '@actions/github/lib/context';

type Context<T> = {
  repo: {
    owner: string;
    repo: string;
  };
  payload: T;
};

const decodeWith = <T>(Payload: Codec<T>) => (
  context: GithubContext,
): Either<string, Context<T>> => {
  const { repo, payload } = context;
  return Payload.decode(payload).map((payload) => ({ repo, payload }));
};
