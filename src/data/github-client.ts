export { GithubClient, getInputOneOf, getInputMaybe };

import { InputOptions, getInput } from '@actions/core';
import type { GitHub } from '@actions/github/lib/utils';
import { Maybe } from 'purify-ts';

type GithubClient = InstanceType<typeof GitHub>;

type OneOfResult<T extends string> =
  | { type: 'None' }
  | { type: 'Many'; names: [string, string, ...string[]] }
  | { type: 'One'; name: T; value: string };

const getInputMaybe = (name: string, options?: InputOptions): Maybe<string> =>
  Maybe.encase(() => getInput(name, { ...options, required: true }));

const getInputOneOf = <T extends Array<string>>(
  ...names: T
): OneOfResult<T[number]> => {
  const getInput = (name: string): Maybe<{ name: string; value: string }> =>
    getInputMaybe(name).map((value) => ({ name, value }));

  const inputs = Maybe.mapMaybe(getInput, names);

  if (inputs.length <= 0) {
    return { type: 'None' };
  }

  if (inputs.length > 1) {
    const names = inputs.map(({ name }) => name);
    const [first, second, ...rest] = names;

    return { type: 'Many', names: [first, second, ...rest] };
  }

  const [{ name, value }] = inputs;

  return { type: 'One', name, value };
};
