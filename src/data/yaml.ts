export { parseObject };

import { Either, Left, Right } from 'purify-ts';
import YAML from 'yaml';

type Value =
  | string
  | number
  | boolean
  | null
  | Array<Value>
  | { [key: string]: Value };

const isYamlObject = (value: Value): value is { [key: string]: Value } =>
  typeof value === 'object';

const parseValue = (yaml: string): Either<string, Value> =>
  Either.encase(() => YAML.parse(yaml)).mapLeft((err) => err.message);

const parseObject = (yaml: string): Either<string, { [key: string]: Value }> =>
  parseValue(yaml).chain((value) =>
    isYamlObject(value)
      ? Right(value)
      : Left(`Expecting a YAML object, but given: ${value}`),
  );
