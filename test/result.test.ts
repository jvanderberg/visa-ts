import { describe, it, expect } from 'vitest';
import { Ok, Err, isOk, isErr, unwrapOr, unwrapOrElse, map, mapErr } from '../src/result.js';

describe('Result', () => {
  describe('Ok', () => {
    it('creates a successful result with a value', () => {
      const result = Ok(42);

      expect(result.ok).toBe(true);
      expect(result.value).toBe(42);
    });

    it('creates a successful result with a string value', () => {
      const result = Ok('hello');

      expect(result.ok).toBe(true);
      expect(result.value).toBe('hello');
    });

    it('creates a successful result with an object value', () => {
      const obj = { name: 'test', value: 123 };
      const result = Ok(obj);

      expect(result.ok).toBe(true);
      expect(result.value).toEqual(obj);
    });
  });

  describe('Err', () => {
    it('creates a failed result with an error', () => {
      const error = new Error('something went wrong');
      const result = Err(error);

      expect(result.ok).toBe(false);
      expect(result.error).toBe(error);
    });

    it('creates a failed result with a string error', () => {
      const result = Err('error message');

      expect(result.ok).toBe(false);
      expect(result.error).toBe('error message');
    });
  });

  describe('isOk', () => {
    it('returns true for Ok result', () => {
      const result = Ok(42);

      expect(isOk(result)).toBe(true);
    });

    it('returns false for Err result', () => {
      const result = Err(new Error('fail'));

      expect(isOk(result)).toBe(false);
    });

    it('narrows type to access value', () => {
      const result = Ok(42);

      if (isOk(result)) {
        // TypeScript should know result.value exists here
        expect(result.value).toBe(42);
      }
    });
  });

  describe('isErr', () => {
    it('returns true for Err result', () => {
      const result = Err(new Error('fail'));

      expect(isErr(result)).toBe(true);
    });

    it('returns false for Ok result', () => {
      const result = Ok(42);

      expect(isErr(result)).toBe(false);
    });

    it('narrows type to access error', () => {
      const result = Err(new Error('test error'));

      if (isErr(result)) {
        // TypeScript should know result.error exists here
        expect(result.error.message).toBe('test error');
      }
    });
  });

  describe('unwrapOr', () => {
    it('returns value when result is Ok', () => {
      const result = Ok(42);

      expect(unwrapOr(result, 0)).toBe(42);
    });

    it('returns default when result is Err', () => {
      const result = Err(new Error('fail'));

      expect(unwrapOr(result, 0)).toBe(0);
    });

    it('returns string value when result is Ok', () => {
      const result = Ok('success');

      expect(unwrapOr(result, 'default')).toBe('success');
    });

    it('returns string default when result is Err', () => {
      const result = Err(new Error('fail'));

      expect(unwrapOr(result, 'default')).toBe('default');
    });
  });

  describe('unwrapOrElse', () => {
    it('returns value when result is Ok', () => {
      const result = Ok(42);

      expect(unwrapOrElse(result, () => 0)).toBe(42);
    });

    it('calls function with error when result is Err', () => {
      const error = new Error('fail');
      const result = Err(error);

      expect(unwrapOrElse(result, (e) => e.message.length)).toBe(4);
    });

    it('does not call function when result is Ok', () => {
      const result = Ok(42);
      let called = false;

      unwrapOrElse(result, () => {
        called = true;
        return 0;
      });

      expect(called).toBe(false);
    });

    it('receives the error in the callback', () => {
      const error = new Error('specific error');
      const result = Err(error);
      let receivedError: Error | null = null;

      unwrapOrElse(result, (e) => {
        receivedError = e;
        return 0;
      });

      expect(receivedError).toBe(error);
    });
  });

  describe('map', () => {
    it('transforms the value when result is Ok', () => {
      const result = Ok(5);

      const mapped = map(result, (x) => x * 2);

      expect(mapped.ok).toBe(true);
      if (mapped.ok) {
        expect(mapped.value).toBe(10);
      }
    });

    it('preserves the error when result is Err', () => {
      const error = new Error('fail');
      const result = Err(error);

      const mapped = map(result, (x: number) => x * 2);

      expect(mapped.ok).toBe(false);
      if (!mapped.ok) {
        expect(mapped.error).toBe(error);
      }
    });

    it('does not call the function when result is Err', () => {
      const result = Err(new Error('fail'));
      let called = false;

      map(result, (x: number) => {
        called = true;
        return x * 2;
      });

      expect(called).toBe(false);
    });

    it('can change the value type', () => {
      const result = Ok(42);

      const mapped = map(result, (x) => x.toString());

      expect(mapped.ok).toBe(true);
      if (mapped.ok) {
        expect(mapped.value).toBe('42');
      }
    });
  });

  describe('mapErr', () => {
    it('transforms the error when result is Err', () => {
      const result = Err(new Error('original'));

      const mapped = mapErr(result, (e) => new Error(`wrapped: ${e.message}`));

      expect(mapped.ok).toBe(false);
      if (!mapped.ok) {
        expect(mapped.error.message).toBe('wrapped: original');
      }
    });

    it('preserves the value when result is Ok', () => {
      const result = Ok(42);

      const mapped = mapErr(result, (e: Error) => new Error(`wrapped: ${e.message}`));

      expect(mapped.ok).toBe(true);
      if (mapped.ok) {
        expect(mapped.value).toBe(42);
      }
    });

    it('does not call the function when result is Ok', () => {
      const result = Ok(42);
      let called = false;

      mapErr(result, (e: Error) => {
        called = true;
        return new Error(`wrapped: ${e.message}`);
      });

      expect(called).toBe(false);
    });

    it('can change the error type', () => {
      const result = Err('string error');

      const mapped = mapErr(result, (e) => new Error(e));

      expect(mapped.ok).toBe(false);
      if (!mapped.ok) {
        expect(mapped.error).toBeInstanceOf(Error);
        expect(mapped.error.message).toBe('string error');
      }
    });
  });
});
