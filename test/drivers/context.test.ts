import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDriverContext } from '../../src/drivers/context.js';
import type { MessageBasedResource } from '../../src/resources/message-based-resource.js';
import type { QuirkConfig } from '../../src/drivers/types.js';
import { Ok, Err } from '../../src/result.js';

describe('DriverContext', () => {
  let mockResource: MessageBasedResource;

  beforeEach(() => {
    mockResource = {
      resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
      resourceInfo: {
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
        interfaceType: 'USB',
      },
      timeout: 2000,
      writeTermination: '\n',
      readTermination: '\n',
      chunkSize: 65536,
      isOpen: true,
      query: vi.fn(),
      write: vi.fn(),
      read: vi.fn(),
      queryBinaryValues: vi.fn(),
      writeBinaryValues: vi.fn(),
      queryBinary: vi.fn(),
      readBinary: vi.fn(),
      queryAsciiValues: vi.fn(),
      readAsciiValues: vi.fn(),
      writeAsciiValues: vi.fn(),
      writeRaw: vi.fn(),
      readRaw: vi.fn(),
      readBytes: vi.fn(),
      clear: vi.fn(),
      trigger: vi.fn(),
      readStb: vi.fn(),
      close: vi.fn(),
    } as unknown as MessageBasedResource;
  });

  describe('createDriverContext', () => {
    it('creates context with default quirks', () => {
      const ctx = createDriverContext(mockResource);

      expect(ctx.resource).toBe(mockResource);
      expect(ctx.quirks).toEqual({});
    });

    it('creates context with custom quirks', () => {
      const quirks: QuirkConfig = {
        postCommandDelay: 50,
        postQueryDelay: 100,
      };
      const ctx = createDriverContext(mockResource, quirks);

      expect(ctx.quirks).toEqual(quirks);
    });
  });

  describe('write', () => {
    it('writes command to resource', async () => {
      vi.mocked(mockResource.write).mockResolvedValue(Ok(undefined));
      const ctx = createDriverContext(mockResource);

      const result = await ctx.write(':VOLT 5.0');

      expect(mockResource.write).toHaveBeenCalledWith(':VOLT 5.0');
      expect(result.ok).toBe(true);
    });

    it('applies postCommandDelay after write', async () => {
      vi.mocked(mockResource.write).mockResolvedValue(Ok(undefined));
      const quirks: QuirkConfig = { postCommandDelay: 50 };
      const ctx = createDriverContext(mockResource, quirks);

      const start = Date.now();
      await ctx.write(':VOLT 5.0');
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(45); // Allow some timing variance
    });

    it('propagates write errors', async () => {
      const error = new Error('Write failed');
      vi.mocked(mockResource.write).mockResolvedValue(Err(error));
      const ctx = createDriverContext(mockResource);

      const result = await ctx.write(':VOLT 5.0');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe(error);
      }
    });
  });

  describe('query', () => {
    it('queries resource and returns response', async () => {
      vi.mocked(mockResource.query).mockResolvedValue(Ok('5.000'));
      const ctx = createDriverContext(mockResource);

      const result = await ctx.query(':VOLT?');

      expect(mockResource.query).toHaveBeenCalledWith(':VOLT?', undefined);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('5.000');
      }
    });

    it('applies postQueryDelay as query delay option', async () => {
      vi.mocked(mockResource.query).mockResolvedValue(Ok('5.000'));
      const quirks: QuirkConfig = { postQueryDelay: 100 };
      const ctx = createDriverContext(mockResource, quirks);

      await ctx.query(':VOLT?');

      expect(mockResource.query).toHaveBeenCalledWith(':VOLT?', { delay: 100 });
    });

    it('propagates query errors', async () => {
      const error = new Error('Query failed');
      vi.mocked(mockResource.query).mockResolvedValue(Err(error));
      const ctx = createDriverContext(mockResource);

      const result = await ctx.query(':VOLT?');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe(error);
      }
    });
  });

  describe('delay', () => {
    it('delays for specified milliseconds', async () => {
      const ctx = createDriverContext(mockResource);

      const start = Date.now();
      await ctx.delay(50);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(45); // Allow some timing variance
    });

    it('resolves immediately for zero delay', async () => {
      const ctx = createDriverContext(mockResource);

      const start = Date.now();
      await ctx.delay(0);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(10);
    });
  });
});
