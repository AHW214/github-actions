export { attempt, withGithubClient };

import * as core from '@actions/core';
import { getOctokit } from '@actions/github';

import type { GithubClient } from 'data/github-client';

const attempt = async <T>(run: () => Promise<T>): Promise<T | undefined> => {
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
