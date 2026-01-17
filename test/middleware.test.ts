import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  withMiddleware,
  loggingMiddleware,
  retryMiddleware,
  responseTransformMiddleware,
  commandTransformMiddleware,
  type Middleware,
} from '../src/middleware.js';
import type { MessageBasedResource } from '../src/resources/message-based-resource.js';
import type { ResourceInfo } from '../src/types.js';
import { Ok, Err } from '../src/result.js';

/**
 * Creates a mock MessageBasedResource for testing middleware.
 */
function createMockResource(overrides: Partial<MessageBasedResource> = {}): MessageBasedResource {
  const mockResourceInfo: ResourceInfo = {
    resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123456789::INSTR',
    interfaceType: 'USB',
    manufacturer: 'RIGOL TECHNOLOGIES',
    model: 'DS1054Z',
    serialNumber: 'DS1ZA123456789',
  };

  let timeout = 2000;
  let writeTermination = '\n';
  let readTermination = '\n';
  let chunkSize = 65536;

  return {
    get resourceString() {
      return mockResourceInfo.resourceString;
    },
    get resourceInfo() {
      return mockResourceInfo;
    },
    get timeout() {
      return timeout;
    },
    set timeout(value: number) {
      timeout = value;
    },
    get writeTermination() {
      return writeTermination;
    },
    set writeTermination(value: string) {
      writeTermination = value;
    },
    get readTermination() {
      return readTermination;
    },
    set readTermination(value: string) {
      readTermination = value;
    },
    get chunkSize() {
      return chunkSize;
    },
    set chunkSize(value: number) {
      chunkSize = value;
    },
    get isOpen() {
      return true;
    },
    query: vi.fn().mockResolvedValue(Ok('response')),
    write: vi.fn().mockResolvedValue(Ok(undefined)),
    read: vi.fn().mockResolvedValue(Ok('response')),
    queryBinaryValues: vi.fn().mockResolvedValue(Ok([1, 2, 3])),
    writeBinaryValues: vi.fn().mockResolvedValue(Ok(undefined)),
    queryBinary: vi.fn().mockResolvedValue(Ok(Buffer.from([1, 2, 3]))),
    readBinary: vi.fn().mockResolvedValue(Ok(Buffer.from([1, 2, 3]))),
    queryAsciiValues: vi.fn().mockResolvedValue(Ok([1.0, 2.0, 3.0])),
    readAsciiValues: vi.fn().mockResolvedValue(Ok([1.0, 2.0, 3.0])),
    writeAsciiValues: vi.fn().mockResolvedValue(Ok(undefined)),
    writeRaw: vi.fn().mockResolvedValue(Ok(10)),
    readRaw: vi.fn().mockResolvedValue(Ok(Buffer.from([1, 2, 3]))),
    readBytes: vi.fn().mockResolvedValue(Ok(Buffer.from([1, 2, 3]))),
    clear: vi.fn().mockResolvedValue(Ok(undefined)),
    trigger: vi.fn().mockResolvedValue(Ok(undefined)),
    readStb: vi.fn().mockResolvedValue(Ok(16)),
    close: vi.fn().mockResolvedValue(Ok(undefined)),
    ...overrides,
  };
}

describe('middleware', () => {
  describe('withMiddleware', () => {
    let mockResource: MessageBasedResource;

    beforeEach(() => {
      mockResource = createMockResource();
    });

    it('returns a resource with same properties as original', () => {
      const wrapped = withMiddleware(mockResource, []);

      expect(wrapped.resourceString).toBe(mockResource.resourceString);
      expect(wrapped.resourceInfo).toEqual(mockResource.resourceInfo);
      expect(wrapped.isOpen).toBe(mockResource.isOpen);
    });

    it('forwards timeout property get/set', () => {
      const wrapped = withMiddleware(mockResource, []);

      expect(wrapped.timeout).toBe(2000);
      wrapped.timeout = 5000;
      expect(mockResource.timeout).toBe(5000);
    });

    it('forwards writeTermination property get/set', () => {
      const wrapped = withMiddleware(mockResource, []);

      expect(wrapped.writeTermination).toBe('\n');
      wrapped.writeTermination = '\r\n';
      expect(mockResource.writeTermination).toBe('\r\n');
    });

    it('forwards readTermination property get/set', () => {
      const wrapped = withMiddleware(mockResource, []);

      expect(wrapped.readTermination).toBe('\n');
      wrapped.readTermination = '\r\n';
      expect(mockResource.readTermination).toBe('\r\n');
    });

    it('forwards chunkSize property get/set', () => {
      const wrapped = withMiddleware(mockResource, []);

      expect(wrapped.chunkSize).toBe(65536);
      wrapped.chunkSize = 4096;
      expect(mockResource.chunkSize).toBe(4096);
    });

    it('passes query through middleware chain', async () => {
      const middleware: Middleware = async (cmd, next) => {
        return next(cmd);
      };
      const wrapped = withMiddleware(mockResource, [middleware]);

      const result = await wrapped.query('*IDN?');

      expect(result.ok).toBe(true);
      expect(mockResource.query).toHaveBeenCalledWith('*IDN?');
    });

    it('passes write through middleware chain', async () => {
      const middleware: Middleware = async (cmd, next) => {
        return next(cmd);
      };
      const wrapped = withMiddleware(mockResource, [middleware]);

      const result = await wrapped.write('*RST');

      expect(result.ok).toBe(true);
      expect(mockResource.write).toHaveBeenCalledWith('*RST');
    });

    it('allows middleware to transform commands', async () => {
      const middleware: Middleware = async (cmd, next) => {
        return next(`:SYST${cmd}`);
      };
      const wrapped = withMiddleware(mockResource, [middleware]);

      await wrapped.query(':VERS?');

      expect(mockResource.query).toHaveBeenCalledWith(':SYST:VERS?');
    });

    it('allows middleware to transform responses', async () => {
      vi.mocked(mockResource.query).mockResolvedValue(Ok('  response  '));
      const middleware: Middleware = async (cmd, next) => {
        const result = await next(cmd);
        if (result.ok && typeof result.value === 'string') {
          return Ok(result.value.trim());
        }
        return result;
      };
      const wrapped = withMiddleware(mockResource, [middleware]);

      const result = await wrapped.query('*IDN?');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('response');
      }
    });

    it('chains multiple middleware in order', async () => {
      const order: string[] = [];

      const middleware1: Middleware = async (cmd, next) => {
        order.push('mw1-before');
        const result = await next(cmd);
        order.push('mw1-after');
        return result;
      };

      const middleware2: Middleware = async (cmd, next) => {
        order.push('mw2-before');
        const result = await next(cmd);
        order.push('mw2-after');
        return result;
      };

      const wrapped = withMiddleware(mockResource, [middleware1, middleware2]);

      await wrapped.query('*IDN?');

      expect(order).toEqual(['mw1-before', 'mw2-before', 'mw2-after', 'mw1-after']);
    });

    it('allows middleware to intercept errors', async () => {
      vi.mocked(mockResource.query).mockResolvedValue(Err(new Error('Timeout')));

      const middleware: Middleware = async (cmd, next) => {
        const result = await next(cmd);
        if (!result.ok) {
          return Ok('fallback response');
        }
        return result;
      };
      const wrapped = withMiddleware(mockResource, [middleware]);

      const result = await wrapped.query('*IDN?');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('fallback response');
      }
    });

    it('bypasses middleware when query has options', async () => {
      const middleware: Middleware = async (cmd, next) => {
        return next(`MODIFIED:${cmd}`);
      };
      const wrapped = withMiddleware(mockResource, [middleware]);

      await wrapped.query('*IDN?', { delay: 100 });

      // When options are provided, middleware is bypassed
      expect(mockResource.query).toHaveBeenCalledWith('*IDN?', { delay: 100 });
    });

    it('passes through read without middleware', async () => {
      const middleware: Middleware = async (cmd, next) => {
        return next(`MODIFIED:${cmd}`);
      };
      const wrapped = withMiddleware(mockResource, [middleware]);

      await wrapped.read();

      expect(mockResource.read).toHaveBeenCalled();
    });

    it('passes through close without middleware', async () => {
      const wrapped = withMiddleware(mockResource, []);

      await wrapped.close();

      expect(mockResource.close).toHaveBeenCalled();
    });

    it('passes through clear without middleware', async () => {
      const wrapped = withMiddleware(mockResource, []);

      await wrapped.clear();

      expect(mockResource.clear).toHaveBeenCalled();
    });

    it('passes through trigger without middleware', async () => {
      const wrapped = withMiddleware(mockResource, []);

      await wrapped.trigger();

      expect(mockResource.trigger).toHaveBeenCalled();
    });

    it('passes through readStb without middleware', async () => {
      const wrapped = withMiddleware(mockResource, []);

      await wrapped.readStb();

      expect(mockResource.readStb).toHaveBeenCalled();
    });

    it('passes through queryBinaryValues without middleware', async () => {
      const wrapped = withMiddleware(mockResource, []);

      await wrapped.queryBinaryValues(':WAV:DATA?', 'B');

      expect(mockResource.queryBinaryValues).toHaveBeenCalledWith(':WAV:DATA?', 'B', undefined);
    });

    it('passes through writeBinaryValues without middleware', async () => {
      const wrapped = withMiddleware(mockResource, []);

      await wrapped.writeBinaryValues(':DATA', [1, 2, 3], 'B');

      expect(mockResource.writeBinaryValues).toHaveBeenCalledWith(':DATA', [1, 2, 3], 'B');
    });
  });

  describe('loggingMiddleware', () => {
    let mockResource: MessageBasedResource;

    beforeEach(() => {
      mockResource = createMockResource();
    });

    it('logs outgoing commands with default prefix', async () => {
      const logs: string[] = [];
      const middleware = loggingMiddleware({
        log: (msg) => logs.push(msg),
      });
      const wrapped = withMiddleware(mockResource, [middleware]);

      await wrapped.query('*IDN?');

      expect(logs).toContain('> *IDN?');
    });

    it('logs incoming responses with default prefix', async () => {
      vi.mocked(mockResource.query).mockResolvedValue(Ok('RIGOL,DS1054Z'));
      const logs: string[] = [];
      const middleware = loggingMiddleware({
        log: (msg) => logs.push(msg),
      });
      const wrapped = withMiddleware(mockResource, [middleware]);

      await wrapped.query('*IDN?');

      expect(logs).toContain('< RIGOL,DS1054Z');
    });

    it('uses custom prefixes', async () => {
      vi.mocked(mockResource.query).mockResolvedValue(Ok('response'));
      const logs: string[] = [];
      const middleware = loggingMiddleware({
        log: (msg) => logs.push(msg),
        sendPrefix: 'TX:',
        receivePrefix: 'RX:',
      });
      const wrapped = withMiddleware(mockResource, [middleware]);

      await wrapped.query('CMD');

      expect(logs).toContain('TX: CMD');
      expect(logs).toContain('RX: response');
    });

    it('logs errors when logErrors is true', async () => {
      vi.mocked(mockResource.query).mockResolvedValue(Err(new Error('Timeout')));
      const logs: string[] = [];
      const middleware = loggingMiddleware({
        log: (msg) => logs.push(msg),
        logErrors: true,
      });
      const wrapped = withMiddleware(mockResource, [middleware]);

      await wrapped.query('*IDN?');

      expect(logs.some((log) => log.includes('Error: Timeout'))).toBe(true);
    });

    it('does not log errors when logErrors is false', async () => {
      vi.mocked(mockResource.query).mockResolvedValue(Err(new Error('Timeout')));
      const logs: string[] = [];
      const middleware = loggingMiddleware({
        log: (msg) => logs.push(msg),
        logErrors: false,
      });
      const wrapped = withMiddleware(mockResource, [middleware]);

      await wrapped.query('*IDN?');

      expect(logs.some((log) => log.includes('Error'))).toBe(false);
    });

    it('includes timestamps when enabled', async () => {
      const logs: string[] = [];
      const middleware = loggingMiddleware({
        log: (msg) => logs.push(msg),
        timestamps: true,
      });
      const wrapped = withMiddleware(mockResource, [middleware]);

      await wrapped.query('*IDN?');

      // Timestamp format: [2024-01-15T10:30:00.000Z]
      expect(logs[0]).toMatch(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\] > \*IDN\?$/);
    });

    it('truncates long responses', async () => {
      const longResponse = 'x'.repeat(300);
      vi.mocked(mockResource.query).mockResolvedValue(Ok(longResponse));
      const logs: string[] = [];
      const middleware = loggingMiddleware({
        log: (msg) => logs.push(msg),
      });
      const wrapped = withMiddleware(mockResource, [middleware]);

      await wrapped.query('*IDN?');

      const responseLog = logs.find((log) => log.startsWith('<'));
      expect(responseLog).toContain('...');
      expect(responseLog!.length).toBeLessThan(250);
    });

    it('does not log response for write operations (void result)', async () => {
      const logs: string[] = [];
      const middleware = loggingMiddleware({
        log: (msg) => logs.push(msg),
      });
      const wrapped = withMiddleware(mockResource, [middleware]);

      await wrapped.write('*RST');

      // Should only have the outgoing command log
      expect(logs.length).toBe(1);
      expect(logs[0]).toBe('> *RST');
    });
  });

  describe('retryMiddleware', () => {
    let mockResource: MessageBasedResource;

    beforeEach(() => {
      mockResource = createMockResource();
    });

    it('returns result on first success', async () => {
      vi.mocked(mockResource.query).mockResolvedValue(Ok('response'));
      const middleware = retryMiddleware({ maxRetries: 3 });
      const wrapped = withMiddleware(mockResource, [middleware]);

      const result = await wrapped.query('*IDN?');

      expect(result.ok).toBe(true);
      expect(mockResource.query).toHaveBeenCalledTimes(1);
    });

    it('retries on failure up to maxRetries', async () => {
      vi.mocked(mockResource.query)
        .mockResolvedValueOnce(Err(new Error('Timeout')))
        .mockResolvedValueOnce(Err(new Error('Timeout')))
        .mockResolvedValueOnce(Ok('response'));

      const middleware = retryMiddleware({
        maxRetries: 3,
        retryDelay: 1, // Use short delay for tests
      });
      const wrapped = withMiddleware(mockResource, [middleware]);

      const result = await wrapped.query('*IDN?');

      expect(result.ok).toBe(true);
      expect(mockResource.query).toHaveBeenCalledTimes(3);
    });

    it('returns error after exhausting retries', async () => {
      vi.mocked(mockResource.query).mockResolvedValue(Err(new Error('Timeout')));

      const middleware = retryMiddleware({
        maxRetries: 2,
        retryDelay: 1,
      });
      const wrapped = withMiddleware(mockResource, [middleware]);

      const result = await wrapped.query('*IDN?');

      expect(result.ok).toBe(false);
      // Initial attempt + 2 retries = 3 calls
      expect(mockResource.query).toHaveBeenCalledTimes(3);
    });

    it('respects isRetryable callback', async () => {
      vi.mocked(mockResource.query).mockResolvedValue(Err(new Error('Invalid command')));

      const middleware = retryMiddleware({
        maxRetries: 3,
        retryDelay: 1,
        isRetryable: (err) => err.message.includes('Timeout'),
      });
      const wrapped = withMiddleware(mockResource, [middleware]);

      const result = await wrapped.query('*IDN?');

      expect(result.ok).toBe(false);
      // Should not retry because error is not retryable
      expect(mockResource.query).toHaveBeenCalledTimes(1);
    });

    it('calls onRetry callback for each retry', async () => {
      vi.mocked(mockResource.query)
        .mockResolvedValueOnce(Err(new Error('Timeout')))
        .mockResolvedValueOnce(Err(new Error('Timeout')))
        .mockResolvedValueOnce(Ok('response'));

      const retryAttempts: number[] = [];
      const middleware = retryMiddleware({
        maxRetries: 3,
        retryDelay: 1,
        onRetry: (_error, attempt) => retryAttempts.push(attempt),
      });
      const wrapped = withMiddleware(mockResource, [middleware]);

      await wrapped.query('*IDN?');

      expect(retryAttempts).toEqual([1, 2]);
    });

    it('uses default maxRetries of 3', async () => {
      vi.mocked(mockResource.query).mockResolvedValue(Err(new Error('Timeout')));

      const middleware = retryMiddleware({ retryDelay: 1 });
      const wrapped = withMiddleware(mockResource, [middleware]);

      await wrapped.query('*IDN?');

      // Initial + 3 retries = 4 calls
      expect(mockResource.query).toHaveBeenCalledTimes(4);
    });

    it('retries write operations', async () => {
      vi.mocked(mockResource.write)
        .mockResolvedValueOnce(Err(new Error('Timeout')))
        .mockResolvedValueOnce(Ok(undefined));

      const middleware = retryMiddleware({
        maxRetries: 2,
        retryDelay: 1,
      });
      const wrapped = withMiddleware(mockResource, [middleware]);

      const result = await wrapped.write('*RST');

      expect(result.ok).toBe(true);
      expect(mockResource.write).toHaveBeenCalledTimes(2);
    });
  });

  describe('responseTransformMiddleware', () => {
    let mockResource: MessageBasedResource;

    beforeEach(() => {
      mockResource = createMockResource();
    });

    it('transforms string responses', async () => {
      vi.mocked(mockResource.query).mockResolvedValue(Ok('  response  '));
      const middleware = responseTransformMiddleware((s) => s.trim());
      const wrapped = withMiddleware(mockResource, [middleware]);

      const result = await wrapped.query('*IDN?');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('response');
      }
    });

    it('applies complex transformations', async () => {
      vi.mocked(mockResource.query).mockResolvedValue(Ok('1.234E+03'));
      const middleware = responseTransformMiddleware((s) => String(parseFloat(s)));
      const wrapped = withMiddleware(mockResource, [middleware]);

      const result = await wrapped.query(':VOLT?');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('1234');
      }
    });

    it('does not transform errors', async () => {
      vi.mocked(mockResource.query).mockResolvedValue(Err(new Error('Timeout')));
      const middleware = responseTransformMiddleware((s) => s.toUpperCase());
      const wrapped = withMiddleware(mockResource, [middleware]);

      const result = await wrapped.query('*IDN?');

      expect(result.ok).toBe(false);
    });

    it('does not transform non-string results', async () => {
      // Write returns void, should not be transformed
      const transform = vi.fn((s: string) => s.toUpperCase());
      const middleware = responseTransformMiddleware(transform);
      const wrapped = withMiddleware(mockResource, [middleware]);

      await wrapped.write('*RST');

      expect(transform).not.toHaveBeenCalled();
    });

    it('can fix device quirks like line ending issues', async () => {
      vi.mocked(mockResource.query).mockResolvedValue(Ok('response\r\n'));
      const middleware = responseTransformMiddleware((s) => s.replace(/\r\n/g, '\n').trim());
      const wrapped = withMiddleware(mockResource, [middleware]);

      const result = await wrapped.query('*IDN?');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('response');
      }
    });
  });

  describe('commandTransformMiddleware', () => {
    let mockResource: MessageBasedResource;

    beforeEach(() => {
      mockResource = createMockResource();
    });

    it('transforms commands before sending', async () => {
      const middleware = commandTransformMiddleware((cmd) => cmd.toUpperCase());
      const wrapped = withMiddleware(mockResource, [middleware]);

      await wrapped.query('volt?');

      expect(mockResource.query).toHaveBeenCalledWith('VOLT?');
    });

    it('can add prefixes to commands', async () => {
      const middleware = commandTransformMiddleware((cmd) => `:SYST${cmd}`);
      const wrapped = withMiddleware(mockResource, [middleware]);

      await wrapped.query(':VERS?');

      expect(mockResource.query).toHaveBeenCalledWith(':SYST:VERS?');
    });

    it('works for write operations', async () => {
      const middleware = commandTransformMiddleware((cmd) => `PREFIX:${cmd}`);
      const wrapped = withMiddleware(mockResource, [middleware]);

      await wrapped.write('CMD');

      expect(mockResource.write).toHaveBeenCalledWith('PREFIX:CMD');
    });

    it('can be used to fix device command quirks', async () => {
      // Some devices might need commands without leading colons
      const middleware = commandTransformMiddleware((cmd) => cmd.replace(/^:/, ''));
      const wrapped = withMiddleware(mockResource, [middleware]);

      await wrapped.query(':MEAS:VOLT?');

      expect(mockResource.query).toHaveBeenCalledWith('MEAS:VOLT?');
    });
  });

  describe('middleware composition', () => {
    let mockResource: MessageBasedResource;

    beforeEach(() => {
      mockResource = createMockResource();
    });

    it('combines logging and retry middleware (logging first)', async () => {
      vi.mocked(mockResource.query)
        .mockResolvedValueOnce(Err(new Error('Timeout')))
        .mockResolvedValueOnce(Ok('response'));

      const logs: string[] = [];
      const wrapped = withMiddleware(mockResource, [
        loggingMiddleware({ log: (msg) => logs.push(msg) }),
        retryMiddleware({ maxRetries: 2, retryDelay: 1 }),
      ]);

      const result = await wrapped.query('*IDN?');

      expect(result.ok).toBe(true);
      // Logging is first in chain, so only sees initial call (retries happen after)
      expect(logs.filter((log) => log.startsWith('>')).length).toBe(1);
    });

    it('combines retry and logging middleware (retry first to see all attempts)', async () => {
      vi.mocked(mockResource.query)
        .mockResolvedValueOnce(Err(new Error('Timeout')))
        .mockResolvedValueOnce(Ok('response'));

      const logs: string[] = [];
      const wrapped = withMiddleware(mockResource, [
        retryMiddleware({ maxRetries: 2, retryDelay: 1 }),
        loggingMiddleware({ log: (msg) => logs.push(msg) }),
      ]);

      const result = await wrapped.query('*IDN?');

      expect(result.ok).toBe(true);
      // Retry is first, logging second - each retry goes through logging
      expect(logs.filter((log) => log.startsWith('>')).length).toBe(2);
    });

    it('combines command and response transforms', async () => {
      vi.mocked(mockResource.query).mockResolvedValue(Ok('  RESPONSE  '));

      const wrapped = withMiddleware(mockResource, [
        commandTransformMiddleware((cmd) => cmd.toUpperCase()),
        responseTransformMiddleware((s) => s.trim().toLowerCase()),
      ]);

      const result = await wrapped.query('volt?');

      expect(mockResource.query).toHaveBeenCalledWith('VOLT?');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('response');
      }
    });

    it('combines all built-in middleware', async () => {
      vi.mocked(mockResource.query)
        .mockResolvedValueOnce(Err(new Error('Timeout')))
        .mockResolvedValueOnce(Ok('  ReSpoNsE  '));

      const logs: string[] = [];
      // Order: retry first (so retries go through the rest of the chain),
      // then logging (to see all attempts), then transforms
      const wrapped = withMiddleware(mockResource, [
        retryMiddleware({ maxRetries: 2, retryDelay: 1 }),
        loggingMiddleware({ log: (msg) => logs.push(msg) }),
        commandTransformMiddleware((cmd) => cmd.toUpperCase()),
        responseTransformMiddleware((s) => s.trim().toLowerCase()),
      ]);

      const result = await wrapped.query('volt?');

      expect(mockResource.query).toHaveBeenCalledWith('VOLT?');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('response');
      }
      // Retry is first, logging second - each retry goes through logging
      expect(logs.filter((log) => log.startsWith('>')).length).toBe(2);
    });
  });
});
