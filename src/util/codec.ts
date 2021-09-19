export { numericString };

import { Codec, Left, Right, string } from 'purify-ts';

const numericString = Codec.custom<number>({
  decode: (value) =>
    string.decode(value).chain((str) => {
      const num = Number(str);
      return Number.isNaN(num)
        ? Left(`${str} could not be parsed as a number`)
        : Right(num);
    }),
  encode: (value) => `${value}`,
});
