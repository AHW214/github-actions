export { Falsy, mapFalsy, mapMaybe };

type Falsy = undefined | null | false | 0 | '';

const mapMaybe = <T, U>(
  f: (x: T) => U | undefined | null,
  xs: Array<T>,
): Array<U> => mapKeepWhen((y): y is U => y !== undefined && y !== null, f, xs);

const mapFalsy = <T, U>(f: (x: T) => U | Falsy, xs: Array<T>): Array<U> =>
  mapKeepWhen((y): y is U => !!y, f, xs);

const mapKeepWhen = <T, U, V extends U>(
  p: (y: U) => y is V,
  f: (x: T) => U,
  xs: Array<T>,
): Array<V> =>
  xs.reduce<Array<V>>((ys, x) => {
    const y = f(x);
    return p(y) ? [...ys, y] : ys;
  }, []);
