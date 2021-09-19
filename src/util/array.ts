export { flatten, partition };

const flatten = <T>(xss: Array<Array<T>>): Array<T> =>
  xss.reduce((acc, xs) => [...acc, ...xs], []);

const partition = <T>(
  p: (x: T) => boolean,
  xs: Array<T>,
): [Array<T>, Array<T>] =>
  xs.reduce<[Array<T>, Array<T>]>(
    ([ys, zs], x) => (p(x) ? [[...ys, x], zs] : [ys, [...zs, x]]),
    [[], []],
  );
