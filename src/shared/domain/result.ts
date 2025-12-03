/**
 * Result type for explicit error handling without exceptions.
 * A discriminated union type representing either success (Ok) or failure (Err).
 */

interface Ok<T> {
  readonly _tag: "Ok";
  readonly value: T;
  isOk(): this is Ok<T>;
  isErr(): this is Err<never>;
}

interface Err<E> {
  readonly _tag: "Err";
  readonly error: E;
  isOk(): this is Ok<never>;
  isErr(): this is Err<E>;
}

export type Result<T, E> = Ok<T> | Err<E>;

class OkImpl<T> implements Ok<T> {
  readonly _tag = "Ok" as const;
  constructor(readonly value: T) {}

  isOk(): this is Ok<T> {
    return true;
  }

  isErr(): this is Err<never> {
    return false;
  }
}

class ErrImpl<E> implements Err<E> {
  readonly _tag = "Err" as const;
  constructor(readonly error: E) {}

  isOk(): this is Ok<never> {
    return false;
  }

  isErr(): this is Err<E> {
    return true;
  }
}

export const Result = {
  ok<T>(value: T): Ok<T> {
    return new OkImpl(value);
  },

  err<E>(error: E): Err<E> {
    return new ErrImpl(error);
  },
};
