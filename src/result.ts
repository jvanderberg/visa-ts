/**
 * Result type for explicit error handling.
 * All I/O operations return Result<T, E> instead of throwing exceptions.
 */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

/**
 * Creates a successful Result containing a value.
 */
export function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/**
 * Creates a failed Result containing an error.
 */
export function Err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

/**
 * Type guard to check if a Result is Ok.
 */
export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok;
}

/**
 * Type guard to check if a Result is Err.
 */
export function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
  return !result.ok;
}

/**
 * Returns the value if Ok, otherwise returns the provided default.
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return result.ok ? result.value : defaultValue;
}

/**
 * Returns the value if Ok, otherwise calls the provided function with the error.
 */
export function unwrapOrElse<T, E>(result: Result<T, E>, fn: (error: E) => T): T {
  return result.ok ? result.value : fn(result.error);
}

/**
 * Maps a Result<T, E> to Result<U, E> by applying a function to a contained Ok value,
 * leaving an Err value untouched.
 */
export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return result.ok ? Ok(fn(result.value)) : result;
}

/**
 * Maps a Result<T, E> to Result<T, F> by applying a function to a contained Err value,
 * leaving an Ok value untouched.
 */
export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  return result.ok ? result : Err(fn(result.error));
}
