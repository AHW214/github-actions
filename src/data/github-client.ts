export { GithubClient, getInputMaybe };

import { InputOptions, getInput } from '@actions/core';
import type { GitHub } from '@actions/github/lib/utils';
import { Maybe } from 'purify-ts';

type GithubClient = InstanceType<typeof GitHub>;

const getInputMaybe = (name: string, options?: InputOptions): Maybe<string> =>
  Maybe.encase(() => getInput(name, { ...options, required: true }));
