export { Falsy, mapFalsy };

type Falsy = undefined | null | false | 0 | '';

const mapFalsy = <T, U>(f: (x: T) => U | Falsy, xs: Array<T>): Array<U> =>
  xs.reduce<Array<U>>((ys, x) => {
    const y = f(x);
    return y ? [...ys, y] : ys;
  }, []);
