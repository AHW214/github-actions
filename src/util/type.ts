export type { Awaited };

type Awaited<T> = T extends PromiseLike<infer U> ? U : T;
