export { Payload, decode };

import { Codec, GetType, string } from 'purify-ts';

import { decodeWith } from 'data/context';

type Payload = GetType<typeof Payload>;

const Payload = Codec.interface({
  ref: string,
  ref_type: string,
});

const decode = decodeWith(Payload);
