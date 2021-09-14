export { flatten };

const flatten = <T>(xss: Array<Array<T>>): Array<T> =>
  xss.reduce((acc, xs) => [...acc, ...xs], []);
