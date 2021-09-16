export { fromMaybes };

import { Either, Just, Left, Maybe, Nothing, Right } from 'purify-ts';

const fromMaybes = <T, U>(mx: Maybe<T>, my: Maybe<U>): Maybe<Either<T, U>> => {
  if (mx.isJust() && my.isNothing()) return Just(Left(mx.extract()));
  if (mx.isNothing() && my.isJust()) return Just(Right(my.extract()));
  return Nothing;
};
