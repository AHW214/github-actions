export { attempt, withContext, withGithubClient };

import * as core from '@actions/core';
import { getOctokit, context as globalContext } from '@actions/github';
import type { Codec } from 'purify-ts';

import type { ContextOf } from 'data/context';
import { decodeWith } from 'data/context';
import type { GithubClient } from 'util/github';

const attempt = async <T>(
  run: () => T | Promise<T>,
): Promise<T | undefined> => {
  try {
    return await run();
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : `Unknown error: ${err}`;

    core.setFailed(message);

    return undefined;
  }
};

const withGithubClient = async <T>(
  run: (github: GithubClient) => Promise<T>,
): Promise<T> => {
  const token = core.getInput('github-token', { required: true });
  const debug = core.getBooleanInput('debug');

  const opts = debug
    ? {
        log: {
          debug: core.debug,
          info: core.info,
          warn: core.warning,
          error: core.error,
        },
      }
    : undefined;

  const github = getOctokit(token, opts);

  return run(github);
};

const withContext = <T, U>(
  Context: Codec<T>,
  run: (context: ContextOf<T>) => Promise<U>,
): Promise<U | undefined> =>
  decodeWith(Context, globalContext).caseOf<Promise<U | undefined>>({
    Left: async (err) => {
      core.setFailed(`Failed to decode action context: ${err}`);
      return undefined;
    },

    Right: run,
  });
