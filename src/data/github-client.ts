export { GithubClient, getInputEither, getInputMaybe };

import { InputOptions, getInput } from '@actions/core';
import type { GitHub } from '@actions/github/lib/utils';
import { Either, Maybe } from 'purify-ts';

import * as either from 'data/either';

type GithubClient = InstanceType<typeof GitHub>;

type ParamsGetInput<Name extends string> = {
  name: Name;
  options?: InputOptions;
};

type Input<Name extends string> = {
  name: Name;
  value: string;
};

const getInputMaybe = (name: string, options?: InputOptions): Maybe<string> =>
  Maybe.encase(() => getInput(name, { ...options, required: true }));

const getInputEither = <First extends string, Second extends string>(
  first: ParamsGetInput<First>,
  second: ParamsGetInput<Second>,
): Maybe<Either<Input<First>, Input<Second>>> => {
  const maybeFirst = getInputMaybe(first.name, first.options).map((value) => ({
    name: first.name,
    value,
  }));

  const maybeSecond = getInputMaybe(
    second.name,
    second.options,
  ).map((value) => ({ name: second.name, value }));

  return either.fromMaybes(maybeFirst, maybeSecond);
};
