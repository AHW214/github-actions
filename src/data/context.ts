export type { ContextOf };
export { decodeWith };

import type { Codec, Either } from 'purify-ts';
import type { Context as GithubContext } from '@actions/github/lib/context';

type ContextOf<T> = T & {
  repo: {
    owner: string;
    repo: string;
  };
};

const decodeWith = <T>(
  Context: Codec<T>,
  context: GithubContext,
): Either<string, ContextOf<T>> => {
  const { repo } = context;
  return Context.decode(context).map((ctx) => ({ ...ctx, repo }));
};
