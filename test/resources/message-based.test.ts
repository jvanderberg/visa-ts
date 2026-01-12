import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMessageBasedResource } from '../../src/resources/message-based.js';
import type { Transport, TransportState } from '../../src/transports/transport.js';
import type { ResourceInfo } from '../../src/types.js';
import { Ok, Err } from '../../src/result.js';

/**
 * Creates a mock transport for testing MessageBasedResource
 */
function createMockTransport(overrides: Partial<Transport> = {}): Transport {
  let state: TransportState = 'open';
  let timeout = 2000;
  let readTermination = '\n';
  let writeTermination = '\n';

  return {
    get state() {
      return state;
    },
    get isOpen() {
      return state === 'open';
    },
    get timeout() {
      return timeout;
    },
    set timeout(value: number) {
      timeout = value;
    },
    get readTermination() {
      return readTermination;
    },
    set readTermination(value: string) {
      readTermination = value;
    },
    get writeTermination() {
      return writeTermination;
    },
    set writeTermination(value: string) {
      writeTermination = value;
    },
    open: vi.fn().mockResolvedValue(Ok(undefined)),
    close: vi.fn().mockImplementation(async () => {
      state = 'closed';
      return Ok(undefined);
    }),
    write: vi.fn().mockResolvedValue(Ok(undefined)),
    read: vi.fn().mockResolvedValue(Ok('response')),
    query: vi.fn().mockResolvedValue(Ok('response')),
    writeRaw: vi.fn().mockResolvedValue(Ok(10)),
    readRaw: vi.fn().mockResolvedValue(Ok(Buffer.from([0x01, 0x02, 0x03]))),
    readBytes: vi.fn().mockResolvedValue(Ok(Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05]))),
    clear: vi.fn().mockResolvedValue(Ok(undefined)),
    trigger: vi.fn().mockResolvedValue(Ok(undefined)),
    readStb: vi.fn().mockResolvedValue(Ok(16)),
    ...overrides,
  };
}

const mockResourceInfo: ResourceInfo = {
  resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123456789::INSTR',
  interfaceType: 'USB',
  manufacturer: 'RIGOL TECHNOLOGIES',
  model: 'DS1054Z',
  serialNumber: 'DS1ZA123456789',
};

describe('MessageBasedResource', () => {
  let mockTransport: Transport;

  beforeEach(() => {
    mockTransport = createMockTransport();
  });

  describe('createMessageBasedResource', () => {
    it('creates a resource with provided transport and resourceInfo', () => {
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      expect(resource).toBeDefined();
      expect(resource.resourceString).toBe('USB0::0x1AB1::0x04CE::DS1ZA123456789::INSTR');
      expect(resource.resourceInfo).toEqual(mockResourceInfo);
    });

    it('exposes isOpen from transport', () => {
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      expect(resource.isOpen).toBe(true);
    });

    it('exposes isOpen as false when transport is closed', () => {
      const closedTransport = createMockTransport({
        get state() {
          return 'closed' as TransportState;
        },
        get isOpen() {
          return false;
        },
      });
      const resource = createMessageBasedResource(closedTransport, mockResourceInfo);

      expect(resource.isOpen).toBe(false);
    });

    it('has default chunkSize of 65536', () => {
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      expect(resource.chunkSize).toBe(65536);
    });

    it('allows modifying chunkSize', () => {
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      resource.chunkSize = 4096;

      expect(resource.chunkSize).toBe(4096);
    });
  });

  describe('timeout', () => {
    it('returns timeout from transport', () => {
      mockTransport.timeout = 5000;
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      expect(resource.timeout).toBe(5000);
    });

    it('sets timeout on transport', () => {
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      resource.timeout = 10000;

      expect(mockTransport.timeout).toBe(10000);
    });
  });

  describe('readTermination', () => {
    it('returns readTermination from transport', () => {
      mockTransport.readTermination = '\r\n';
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      expect(resource.readTermination).toBe('\r\n');
    });

    it('sets readTermination on transport', () => {
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      resource.readTermination = '\r\n';

      expect(mockTransport.readTermination).toBe('\r\n');
    });
  });

  describe('writeTermination', () => {
    it('returns writeTermination from transport', () => {
      mockTransport.writeTermination = '\r\n';
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      expect(resource.writeTermination).toBe('\r\n');
    });

    it('sets writeTermination on transport', () => {
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      resource.writeTermination = '\r\n';

      expect(mockTransport.writeTermination).toBe('\r\n');
    });
  });

  describe('query', () => {
    it('delegates to transport query', async () => {
      vi.mocked(mockTransport.query).mockResolvedValue(Ok('RIGOL TECHNOLOGIES,DS1054Z'));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.query('*IDN?');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('RIGOL TECHNOLOGIES,DS1054Z');
      }
      expect(mockTransport.query).toHaveBeenCalledWith('*IDN?', undefined);
    });

    it('passes delay option to transport', async () => {
      vi.mocked(mockTransport.query).mockResolvedValue(Ok('1.234'));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      await resource.query(':MEAS:VOLT?', { delay: 100 });

      expect(mockTransport.query).toHaveBeenCalledWith(':MEAS:VOLT?', 100);
    });

    it('returns Err when transport returns Err', async () => {
      vi.mocked(mockTransport.query).mockResolvedValue(Err(new Error('Timeout')));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.query('*IDN?');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Timeout');
      }
    });
  });

  describe('write', () => {
    it('delegates to transport write', async () => {
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.write('*RST');

      expect(result.ok).toBe(true);
      expect(mockTransport.write).toHaveBeenCalledWith('*RST');
    });

    it('returns Err when transport returns Err', async () => {
      vi.mocked(mockTransport.write).mockResolvedValue(Err(new Error('Write failed')));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.write('*RST');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Write failed');
      }
    });
  });

  describe('read', () => {
    it('delegates to transport read', async () => {
      vi.mocked(mockTransport.read).mockResolvedValue(Ok('RIGOL TECHNOLOGIES,DS1054Z'));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.read();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('RIGOL TECHNOLOGIES,DS1054Z');
      }
      expect(mockTransport.read).toHaveBeenCalled();
    });

    it('returns Err when transport returns Err', async () => {
      vi.mocked(mockTransport.read).mockResolvedValue(Err(new Error('Read timeout')));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.read();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Read timeout');
      }
    });
  });

  describe('writeRaw', () => {
    it('delegates to transport writeRaw', async () => {
      vi.mocked(mockTransport.writeRaw).mockResolvedValue(Ok(5));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const data = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05]);
      const result = await resource.writeRaw(data);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(5);
      }
      expect(mockTransport.writeRaw).toHaveBeenCalledWith(data);
    });

    it('returns Err when transport returns Err', async () => {
      vi.mocked(mockTransport.writeRaw).mockResolvedValue(Err(new Error('Write error')));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.writeRaw(Buffer.from([0x01]));

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Write error');
      }
    });
  });

  describe('readRaw', () => {
    it('delegates to transport readRaw', async () => {
      const expectedBuffer = Buffer.from([0x01, 0x02, 0x03]);
      vi.mocked(mockTransport.readRaw).mockResolvedValue(Ok(expectedBuffer));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.readRaw(100);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(expectedBuffer);
      }
      expect(mockTransport.readRaw).toHaveBeenCalledWith(100);
    });

    it('uses chunkSize as default size', async () => {
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);
      resource.chunkSize = 4096;

      await resource.readRaw();

      expect(mockTransport.readRaw).toHaveBeenCalledWith(4096);
    });

    it('returns Err when transport returns Err', async () => {
      vi.mocked(mockTransport.readRaw).mockResolvedValue(Err(new Error('Read error')));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.readRaw();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Read error');
      }
    });
  });

  describe('readBytes', () => {
    it('delegates to transport readBytes', async () => {
      const expectedBuffer = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05]);
      vi.mocked(mockTransport.readBytes).mockResolvedValue(Ok(expectedBuffer));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.readBytes(5);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(expectedBuffer);
        expect(result.value.length).toBe(5);
      }
      expect(mockTransport.readBytes).toHaveBeenCalledWith(5);
    });

    it('returns Err when transport returns Err', async () => {
      vi.mocked(mockTransport.readBytes).mockResolvedValue(Err(new Error('Timeout')));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.readBytes(100);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Timeout');
      }
    });
  });

  describe('clear', () => {
    it('delegates to transport clear', async () => {
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.clear();

      expect(result.ok).toBe(true);
      expect(mockTransport.clear).toHaveBeenCalled();
    });

    it('returns Err when transport returns Err', async () => {
      vi.mocked(mockTransport.clear).mockResolvedValue(Err(new Error('Clear failed')));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.clear();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Clear failed');
      }
    });
  });

  describe('trigger', () => {
    it('delegates to transport trigger', async () => {
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.trigger();

      expect(result.ok).toBe(true);
      expect(mockTransport.trigger).toHaveBeenCalled();
    });

    it('returns Err when transport returns Err', async () => {
      vi.mocked(mockTransport.trigger).mockResolvedValue(Err(new Error('Trigger failed')));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.trigger();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Trigger failed');
      }
    });
  });

  describe('readStb', () => {
    it('delegates to transport readStb', async () => {
      vi.mocked(mockTransport.readStb).mockResolvedValue(Ok(32));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.readStb();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(32);
      }
      expect(mockTransport.readStb).toHaveBeenCalled();
    });

    it('returns Err when transport returns Err', async () => {
      vi.mocked(mockTransport.readStb).mockResolvedValue(Err(new Error('STB error')));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.readStb();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('STB error');
      }
    });
  });

  describe('close', () => {
    it('delegates to transport close', async () => {
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.close();

      expect(result.ok).toBe(true);
      expect(mockTransport.close).toHaveBeenCalled();
    });

    it('returns Err when transport returns Err', async () => {
      vi.mocked(mockTransport.close).mockResolvedValue(Err(new Error('Close failed')));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.close();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Close failed');
      }
    });

    it('updates isOpen after close', async () => {
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      expect(resource.isOpen).toBe(true);

      await resource.close();

      expect(resource.isOpen).toBe(false);
    });
  });

  describe('queryAsciiValues', () => {
    it('parses comma-separated numeric response', async () => {
      vi.mocked(mockTransport.query).mockResolvedValue(Ok('1.23,4.56,7.89'));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.queryAsciiValues(':DATA?');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([1.23, 4.56, 7.89]);
      }
    });

    it('parses whitespace-separated numeric response', async () => {
      vi.mocked(mockTransport.query).mockResolvedValue(Ok('1.23 4.56 7.89'));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.queryAsciiValues(':DATA?');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([1.23, 4.56, 7.89]);
      }
    });

    it('parses mixed comma and whitespace response', async () => {
      vi.mocked(mockTransport.query).mockResolvedValue(Ok('1.23, 4.56, 7.89'));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.queryAsciiValues(':DATA?');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([1.23, 4.56, 7.89]);
      }
    });

    it('uses custom separator', async () => {
      vi.mocked(mockTransport.query).mockResolvedValue(Ok('1.23;4.56;7.89'));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.queryAsciiValues(':DATA?', { separator: ';' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([1.23, 4.56, 7.89]);
      }
    });

    it('uses custom converter', async () => {
      vi.mocked(mockTransport.query).mockResolvedValue(Ok('1,2,3'));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.queryAsciiValues(':DATA?', {
        converter: (s) => parseInt(s, 10) * 10,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([10, 20, 30]);
      }
    });

    it('uses regex separator', async () => {
      vi.mocked(mockTransport.query).mockResolvedValue(Ok('1.23;;4.56;;7.89'));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.queryAsciiValues(':DATA?', { separator: /;+/ });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([1.23, 4.56, 7.89]);
      }
    });

    it('handles empty response', async () => {
      vi.mocked(mockTransport.query).mockResolvedValue(Ok(''));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.queryAsciiValues(':DATA?');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([]);
      }
    });

    it('filters out NaN values from response', async () => {
      vi.mocked(mockTransport.query).mockResolvedValue(Ok('1.23,,4.56'));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.queryAsciiValues(':DATA?');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([1.23, 4.56]);
      }
    });

    it('returns Err when transport returns Err', async () => {
      vi.mocked(mockTransport.query).mockResolvedValue(Err(new Error('Query failed')));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.queryAsciiValues(':DATA?');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Query failed');
      }
    });
  });

  describe('readAsciiValues', () => {
    it('parses comma-separated numeric response from read', async () => {
      vi.mocked(mockTransport.read).mockResolvedValue(Ok('1.23,4.56,7.89'));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.readAsciiValues();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([1.23, 4.56, 7.89]);
      }
    });

    it('uses custom separator', async () => {
      vi.mocked(mockTransport.read).mockResolvedValue(Ok('1.23;4.56;7.89'));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.readAsciiValues({ separator: ';' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([1.23, 4.56, 7.89]);
      }
    });

    it('returns Err when transport returns Err', async () => {
      vi.mocked(mockTransport.read).mockResolvedValue(Err(new Error('Read failed')));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.readAsciiValues();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Read failed');
      }
    });
  });

  describe('writeAsciiValues', () => {
    it('writes comma-separated values', async () => {
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.writeAsciiValues(':DATA', [1.0, 2.0, 3.0]);

      expect(result.ok).toBe(true);
      expect(mockTransport.write).toHaveBeenCalledWith(':DATA 1,2,3');
    });

    it('uses custom separator', async () => {
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.writeAsciiValues(':DATA', [1.0, 2.0, 3.0], { separator: ';' });

      expect(result.ok).toBe(true);
      expect(mockTransport.write).toHaveBeenCalledWith(':DATA 1;2;3');
    });

    it('handles empty array', async () => {
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.writeAsciiValues(':DATA', []);

      expect(result.ok).toBe(true);
      expect(mockTransport.write).toHaveBeenCalledWith(':DATA ');
    });

    it('returns Err when transport returns Err', async () => {
      vi.mocked(mockTransport.write).mockResolvedValue(Err(new Error('Write failed')));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.writeAsciiValues(':DATA', [1.0, 2.0, 3.0]);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Write failed');
      }
    });

    it('falls back to comma separator when RegExp is provided', async () => {
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.writeAsciiValues(':DATA', [1.0, 2.0, 3.0], { separator: /,/ });

      expect(result.ok).toBe(true);
      // RegExp separators are not supported for writing, defaults to comma
      expect(mockTransport.write).toHaveBeenCalledWith(':DATA 1,2,3');
    });
  });

  describe('queryBinaryValues', () => {
    it('reads unsigned 8-bit values from IEEE 488.2 block', async () => {
      // #210<10 bytes of data> - definite length block
      const header = Buffer.from('#210');
      const data = Buffer.from([0, 50, 100, 150, 200, 250, 128, 64, 32, 16]);
      const block = Buffer.concat([header, data]);

      vi.mocked(mockTransport.write).mockResolvedValue(Ok(undefined));
      vi.mocked(mockTransport.readRaw).mockResolvedValue(Ok(block));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.queryBinaryValues(':WAV:DATA?', 'B');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([0, 50, 100, 150, 200, 250, 128, 64, 32, 16]);
      }
    });

    it('reads signed 8-bit values', async () => {
      const header = Buffer.from('#14');
      const data = Buffer.from([0, 127, -128, -1]);
      const block = Buffer.concat([header, data]);

      vi.mocked(mockTransport.write).mockResolvedValue(Ok(undefined));
      vi.mocked(mockTransport.readRaw).mockResolvedValue(Ok(block));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.queryBinaryValues(':WAV:DATA?', 'b');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([0, 127, -128, -1]);
      }
    });

    it('reads big-endian 16-bit unsigned values', async () => {
      const header = Buffer.from('#14');
      const data = Buffer.alloc(4);
      data.writeUInt16BE(0x0102, 0); // 258
      data.writeUInt16BE(0xfffe, 2); // 65534
      const block = Buffer.concat([header, data]);

      vi.mocked(mockTransport.write).mockResolvedValue(Ok(undefined));
      vi.mocked(mockTransport.readRaw).mockResolvedValue(Ok(block));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.queryBinaryValues(':WAV:DATA?', 'H');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([258, 65534]);
      }
    });

    it('reads little-endian 16-bit unsigned values', async () => {
      const header = Buffer.from('#14');
      const data = Buffer.alloc(4);
      data.writeUInt16LE(0x0102, 0); // 258
      data.writeUInt16LE(0xfffe, 2); // 65534
      const block = Buffer.concat([header, data]);

      vi.mocked(mockTransport.write).mockResolvedValue(Ok(undefined));
      vi.mocked(mockTransport.readRaw).mockResolvedValue(Ok(block));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.queryBinaryValues(':WAV:DATA?', 'H<');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([258, 65534]);
      }
    });

    it('reads big-endian 16-bit signed values', async () => {
      const header = Buffer.from('#14');
      const data = Buffer.alloc(4);
      data.writeInt16BE(1000, 0);
      data.writeInt16BE(-1000, 2);
      const block = Buffer.concat([header, data]);

      vi.mocked(mockTransport.write).mockResolvedValue(Ok(undefined));
      vi.mocked(mockTransport.readRaw).mockResolvedValue(Ok(block));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.queryBinaryValues(':WAV:DATA?', 'h');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([1000, -1000]);
      }
    });

    it('reads little-endian 16-bit signed values', async () => {
      const header = Buffer.from('#14');
      const data = Buffer.alloc(4);
      data.writeInt16LE(1000, 0);
      data.writeInt16LE(-1000, 2);
      const block = Buffer.concat([header, data]);

      vi.mocked(mockTransport.write).mockResolvedValue(Ok(undefined));
      vi.mocked(mockTransport.readRaw).mockResolvedValue(Ok(block));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.queryBinaryValues(':WAV:DATA?', 'h<');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([1000, -1000]);
      }
    });

    it('reads big-endian 32-bit unsigned values', async () => {
      const header = Buffer.from('#18');
      const data = Buffer.alloc(8);
      data.writeUInt32BE(0x01020304, 0);
      data.writeUInt32BE(0xfffffffe, 4);
      const block = Buffer.concat([header, data]);

      vi.mocked(mockTransport.write).mockResolvedValue(Ok(undefined));
      vi.mocked(mockTransport.readRaw).mockResolvedValue(Ok(block));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.queryBinaryValues(':WAV:DATA?', 'I');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([16909060, 4294967294]);
      }
    });

    it('reads little-endian 32-bit unsigned values', async () => {
      const header = Buffer.from('#18');
      const data = Buffer.alloc(8);
      data.writeUInt32LE(0x01020304, 0);
      data.writeUInt32LE(0xfffffffe, 4);
      const block = Buffer.concat([header, data]);

      vi.mocked(mockTransport.write).mockResolvedValue(Ok(undefined));
      vi.mocked(mockTransport.readRaw).mockResolvedValue(Ok(block));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.queryBinaryValues(':WAV:DATA?', 'I<');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([16909060, 4294967294]);
      }
    });

    it('reads big-endian 32-bit signed values', async () => {
      const header = Buffer.from('#18');
      const data = Buffer.alloc(8);
      data.writeInt32BE(100000, 0);
      data.writeInt32BE(-100000, 4);
      const block = Buffer.concat([header, data]);

      vi.mocked(mockTransport.write).mockResolvedValue(Ok(undefined));
      vi.mocked(mockTransport.readRaw).mockResolvedValue(Ok(block));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.queryBinaryValues(':WAV:DATA?', 'i');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([100000, -100000]);
      }
    });

    it('reads little-endian 32-bit signed values', async () => {
      const header = Buffer.from('#18');
      const data = Buffer.alloc(8);
      data.writeInt32LE(100000, 0);
      data.writeInt32LE(-100000, 4);
      const block = Buffer.concat([header, data]);

      vi.mocked(mockTransport.write).mockResolvedValue(Ok(undefined));
      vi.mocked(mockTransport.readRaw).mockResolvedValue(Ok(block));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.queryBinaryValues(':WAV:DATA?', 'i<');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([100000, -100000]);
      }
    });

    it('reads big-endian 32-bit float values', async () => {
      const header = Buffer.from('#18');
      const data = Buffer.alloc(8);
      data.writeFloatBE(1.5, 0);
      data.writeFloatBE(-2.5, 4);
      const block = Buffer.concat([header, data]);

      vi.mocked(mockTransport.write).mockResolvedValue(Ok(undefined));
      vi.mocked(mockTransport.readRaw).mockResolvedValue(Ok(block));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.queryBinaryValues(':WAV:DATA?', 'f');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0]).toBeCloseTo(1.5, 5);
        expect(result.value[1]).toBeCloseTo(-2.5, 5);
      }
    });

    it('reads little-endian 32-bit float values', async () => {
      const header = Buffer.from('#18');
      const data = Buffer.alloc(8);
      data.writeFloatLE(1.5, 0);
      data.writeFloatLE(-2.5, 4);
      const block = Buffer.concat([header, data]);

      vi.mocked(mockTransport.write).mockResolvedValue(Ok(undefined));
      vi.mocked(mockTransport.readRaw).mockResolvedValue(Ok(block));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.queryBinaryValues(':WAV:DATA?', 'f<');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0]).toBeCloseTo(1.5, 5);
        expect(result.value[1]).toBeCloseTo(-2.5, 5);
      }
    });

    it('reads big-endian 64-bit double values', async () => {
      const header = Buffer.from('#216');
      const data = Buffer.alloc(16);
      data.writeDoubleBE(1.23456789, 0);
      data.writeDoubleBE(-9.87654321, 8);
      const block = Buffer.concat([header, data]);

      vi.mocked(mockTransport.write).mockResolvedValue(Ok(undefined));
      vi.mocked(mockTransport.readRaw).mockResolvedValue(Ok(block));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.queryBinaryValues(':WAV:DATA?', 'd');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0]).toBeCloseTo(1.23456789, 8);
        expect(result.value[1]).toBeCloseTo(-9.87654321, 8);
      }
    });

    it('reads little-endian 64-bit double values', async () => {
      const header = Buffer.from('#216');
      const data = Buffer.alloc(16);
      data.writeDoubleLE(1.23456789, 0);
      data.writeDoubleLE(-9.87654321, 8);
      const block = Buffer.concat([header, data]);

      vi.mocked(mockTransport.write).mockResolvedValue(Ok(undefined));
      vi.mocked(mockTransport.readRaw).mockResolvedValue(Ok(block));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.queryBinaryValues(':WAV:DATA?', 'd<');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0]).toBeCloseTo(1.23456789, 8);
        expect(result.value[1]).toBeCloseTo(-9.87654321, 8);
      }
    });

    it('defaults to unsigned 8-bit when no datatype specified', async () => {
      const header = Buffer.from('#13');
      const data = Buffer.from([100, 200, 255]);
      const block = Buffer.concat([header, data]);

      vi.mocked(mockTransport.write).mockResolvedValue(Ok(undefined));
      vi.mocked(mockTransport.readRaw).mockResolvedValue(Ok(block));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.queryBinaryValues(':WAV:DATA?');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([100, 200, 255]);
      }
    });

    it('returns raw buffer when container is buffer', async () => {
      const header = Buffer.from('#13');
      const data = Buffer.from([100, 200, 255]);
      const block = Buffer.concat([header, data]);

      vi.mocked(mockTransport.write).mockResolvedValue(Ok(undefined));
      vi.mocked(mockTransport.readRaw).mockResolvedValue(Ok(block));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.queryBinaryValues(':WAV:DATA?', 'B', 'buffer');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeInstanceOf(Buffer);
        expect(result.value).toEqual(data);
      }
    });

    it('returns Err when write fails', async () => {
      vi.mocked(mockTransport.write).mockResolvedValue(Err(new Error('Write failed')));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.queryBinaryValues(':WAV:DATA?', 'B');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Write failed');
      }
    });

    it('returns Err when read fails', async () => {
      vi.mocked(mockTransport.write).mockResolvedValue(Ok(undefined));
      vi.mocked(mockTransport.readRaw).mockResolvedValue(Err(new Error('Read timeout')));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.queryBinaryValues(':WAV:DATA?', 'B');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Read timeout');
      }
    });

    it('returns Err for invalid IEEE 488.2 block header', async () => {
      const invalidBlock = Buffer.from('invalid data');

      vi.mocked(mockTransport.write).mockResolvedValue(Ok(undefined));
      vi.mocked(mockTransport.readRaw).mockResolvedValue(Ok(invalidBlock));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.queryBinaryValues(':WAV:DATA?', 'B');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('Invalid');
      }
    });

    it('handles data that is not evenly divisible by element size', async () => {
      const header = Buffer.from('#15'); // 5 bytes, not divisible by 2 for 16-bit
      const data = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05]);
      const block = Buffer.concat([header, data]);

      vi.mocked(mockTransport.write).mockResolvedValue(Ok(undefined));
      vi.mocked(mockTransport.readRaw).mockResolvedValue(Ok(block));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.queryBinaryValues(':WAV:DATA?', 'H');

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Should only return complete elements (2 x 16-bit values from 4 bytes)
        expect(result.value.length).toBe(2);
      }
    });
  });

  describe('writeBinaryValues', () => {
    it('writes unsigned 8-bit values with IEEE 488.2 header', async () => {
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.writeBinaryValues(':DATA:DAC', [0, 127, 255], 'B');

      expect(result.ok).toBe(true);
      expect(mockTransport.writeRaw).toHaveBeenCalled();

      const writtenData = vi.mocked(mockTransport.writeRaw).mock.calls[0][0];
      // Should have command + header + data
      expect(writtenData.toString().startsWith(':DATA:DAC #')).toBe(true);
    });

    it('writes signed 8-bit values', async () => {
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.writeBinaryValues(':DATA:DAC', [0, 127, -128, -1], 'b');

      expect(result.ok).toBe(true);
    });

    it('writes big-endian 16-bit unsigned values', async () => {
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.writeBinaryValues(':DATA:DAC', [256, 512], 'H');

      expect(result.ok).toBe(true);
    });

    it('writes little-endian 16-bit unsigned values', async () => {
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.writeBinaryValues(':DATA:DAC', [256, 512], 'H<');

      expect(result.ok).toBe(true);
    });

    it('writes 32-bit float values', async () => {
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.writeBinaryValues(':DATA:DAC', [1.5, -2.5], 'f');

      expect(result.ok).toBe(true);
    });

    it('writes 64-bit double values', async () => {
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.writeBinaryValues(':DATA:DAC', [1.23456789, -9.87654321], 'd');

      expect(result.ok).toBe(true);
    });

    it('writes Buffer directly', async () => {
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);
      const data = Buffer.from([0x01, 0x02, 0x03]);

      const result = await resource.writeBinaryValues(':DATA:DAC', data);

      expect(result.ok).toBe(true);
    });

    it('defaults to unsigned 8-bit when no datatype specified', async () => {
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.writeBinaryValues(':DATA:DAC', [100, 200, 255]);

      expect(result.ok).toBe(true);
    });

    it('returns Err when writeRaw fails', async () => {
      vi.mocked(mockTransport.writeRaw).mockResolvedValue(Err(new Error('Write failed')));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.writeBinaryValues(':DATA:DAC', [1, 2, 3]);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Write failed');
      }
    });
  });

  describe('queryBinary', () => {
    it('returns raw binary data with IEEE 488.2 header stripped', async () => {
      const header = Buffer.from('#15');
      const data = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05]);
      const block = Buffer.concat([header, data]);

      vi.mocked(mockTransport.write).mockResolvedValue(Ok(undefined));
      vi.mocked(mockTransport.readRaw).mockResolvedValue(Ok(block));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.queryBinary(':WAV:DATA?');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(data);
      }
    });

    it('returns Err when write fails', async () => {
      vi.mocked(mockTransport.write).mockResolvedValue(Err(new Error('Write failed')));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.queryBinary(':WAV:DATA?');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Write failed');
      }
    });

    it('returns Err when read fails', async () => {
      vi.mocked(mockTransport.write).mockResolvedValue(Ok(undefined));
      vi.mocked(mockTransport.readRaw).mockResolvedValue(Err(new Error('Read timeout')));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.queryBinary(':WAV:DATA?');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Read timeout');
      }
    });
  });

  describe('readBinary', () => {
    it('reads raw binary data with IEEE 488.2 header stripped', async () => {
      const header = Buffer.from('#15');
      const data = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05]);
      const block = Buffer.concat([header, data]);

      vi.mocked(mockTransport.readRaw).mockResolvedValue(Ok(block));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.readBinary();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(data);
      }
    });

    it('returns Err when read fails', async () => {
      vi.mocked(mockTransport.readRaw).mockResolvedValue(Err(new Error('Read timeout')));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.readBinary();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Read timeout');
      }
    });

    it('returns Err for invalid IEEE 488.2 block header', async () => {
      const invalidBlock = Buffer.from('invalid data');

      vi.mocked(mockTransport.readRaw).mockResolvedValue(Ok(invalidBlock));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.readBinary();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('Invalid');
      }
    });
  });

  describe('queryBinary error handling', () => {
    it('returns Err for invalid IEEE 488.2 block header', async () => {
      const invalidBlock = Buffer.from('invalid data');

      vi.mocked(mockTransport.write).mockResolvedValue(Ok(undefined));
      vi.mocked(mockTransport.readRaw).mockResolvedValue(Ok(invalidBlock));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.queryBinary(':WAV:DATA?');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('Invalid');
      }
    });
  });

  describe('indefinite length blocks', () => {
    it('handles arbitrary block format (#0<data>\\n)', async () => {
      const header = Buffer.from('#0');
      const data = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05]);
      const terminator = Buffer.from('\n');
      const block = Buffer.concat([header, data, terminator]);

      vi.mocked(mockTransport.write).mockResolvedValue(Ok(undefined));
      vi.mocked(mockTransport.readRaw).mockResolvedValue(Ok(block));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.queryBinary(':WAV:DATA?');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(data);
      }
    });

    it('handles indefinite block without terminator (uses all remaining data)', async () => {
      const header = Buffer.from('#0');
      const data = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05]);
      // No terminator - should use all remaining data
      const block = Buffer.concat([header, data]);

      vi.mocked(mockTransport.write).mockResolvedValue(Ok(undefined));
      vi.mocked(mockTransport.readRaw).mockResolvedValue(Ok(block));
      const resource = createMessageBasedResource(mockTransport, mockResourceInfo);

      const result = await resource.queryBinary(':WAV:DATA?');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(data);
      }
    });
  });
});
