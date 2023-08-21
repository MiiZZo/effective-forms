export type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> &
  U[keyof U];

export interface NonEmptyArray<T> extends Array<T> {
  0: T
};
