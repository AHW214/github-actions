export { parseObject };

import { Either } from 'purify-ts';
import YAML from 'yaml';

type Value =
  | string
  | number
  | boolean
  | null
  | Array<Value>
  | { [key: string]: Value };

const parseObject = (yaml: string): Either<Error, { [key: string]: Value }> =>
  Either.encase(() => YAML.parse(yaml));
