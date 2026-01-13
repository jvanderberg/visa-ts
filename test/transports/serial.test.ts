import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

interface ErrnoException extends Error {
  code?: string;
}

// Mock types for serialport
interface MockSerialPort {
  on: ReturnType<typeof vi.fn>;
  once: ReturnType<typeof vi.fn>;
  open: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  write: ReturnType<typeof vi.fn>;
  drain: ReturnType<typeof vi.fn>;
  flush: ReturnType<typeof vi.fn>;
  isOpen: boolean;
  path: string;
}

let mockPort: MockSerialPort;
let eventHandlers: Record<string, (...args: unknown[]) => void>;

vi.mock('serialport', () => ({
  SerialPort: vi.fn(() => mockPort),
}));

import { createSerialTransport, type SerialTransportConfig } from '../../src/transports/serial.js';
import { SerialPort } from 'serialport';

describe('Serial Transport', () => {
  beforeEach(() => {
    eventHandlers = {};
    mockPort = {
      on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
        eventHandlers[event] = handler;
        return mockPort;
      }),
      once: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
        eventHandlers[event] = handler;
        return mockPort;
      }),
      open: vi.fn((callback?: (err?: Error | null) => void) => {
        mockPort.isOpen = true;
        if (callback) callback(null);
      }),
      close: vi.fn((callback?: (err?: Error | null) => void) => {
        mockPort.isOpen = false;
        if (callback) callback(null);
      }),
      write: vi.fn((data: string | Buffer, callback?: (err?: Error | null) => void) => {
        if (callback) callback(null);
        return true;
      }),
      drain: vi.fn((callback?: (err?: Error | null) => void) => {
        if (callback) callback(null);
      }),
      flush: vi.fn((callback?: (err?: Error | null) => void) => {
        if (callback) callback(null);
      }),
      isOpen: false,
      path: '/dev/ttyUSB0',
    };

    vi.mocked(SerialPort).mockImplementation(() => mockPort as unknown as SerialPort);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Helper to create config
  function createConfig(overrides: Partial<SerialTransportConfig> = {}): SerialTransportConfig {
    return {
      path: '/dev/ttyUSB0',
      ...overrides,
    };
  }

  describe('createSerialTransport', () => {
    it('creates a transport with default configuration', () => {
      const config = createConfig();
      const transport = createSerialTransport(config);

      expect(transport).toBeDefined();
      expect(transport.state).toBe('closed');
      expect(transport.isOpen).toBe(false);
      expect(transport.timeout).toBe(2000);
      expect(transport.readTermination).toBe('\n');
      expect(transport.writeTermination).toBe('\n');
    });

    it('creates a transport with custom configuration', () => {
      const config = createConfig({
        baudRate: 115200,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        timeout: 5000,
        readTermination: '\r\n',
        writeTermination: '\r\n',
        commandDelay: 50,
      });
      const transport = createSerialTransport(config);

      expect(transport.timeout).toBe(5000);
      expect(transport.readTermination).toBe('\r\n');
      expect(transport.writeTermination).toBe('\r\n');
    });
  });

  describe('open', () => {
    it('opens a serial port successfully', async () => {
      const config = createConfig({ baudRate: 9600 });
      const transport = createSerialTransport(config);

      const result = await transport.open();

      expect(result.ok).toBe(true);
      expect(transport.state).toBe('open');
      expect(transport.isOpen).toBe(true);
      expect(SerialPort).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/dev/ttyUSB0',
          baudRate: 9600,
          autoOpen: false,
        })
      );
    });

    it('opens with custom serial options', async () => {
      const config = createConfig({
        baudRate: 115200,
        dataBits: 8,
        stopBits: 2,
        parity: 'even',
      });
      const transport = createSerialTransport(config);

      await transport.open();

      expect(SerialPort).toHaveBeenCalledWith(
        expect.objectContaining({
          baudRate: 115200,
          dataBits: 8,
          stopBits: 2,
          parity: 'even',
        })
      );
    });

    it('applies hardware flow control when specified', async () => {
      const config = createConfig({ flowControl: 'hardware' });
      const transport = createSerialTransport(config);

      await transport.open();

      expect(SerialPort).toHaveBeenCalledWith(
        expect.objectContaining({
          rtscts: true,
        })
      );
    });

    it('applies software flow control when specified', async () => {
      const config = createConfig({ flowControl: 'software' });
      const transport = createSerialTransport(config);

      await transport.open();

      expect(SerialPort).toHaveBeenCalledWith(
        expect.objectContaining({
          xon: true,
          xoff: true,
        })
      );
    });

    it('does not apply flow control by default', async () => {
      const config = createConfig();
      const transport = createSerialTransport(config);

      await transport.open();

      expect(SerialPort).toHaveBeenCalledWith(
        expect.objectContaining({
          rtscts: false,
          xon: false,
          xoff: false,
        })
      );
    });

    it('returns Err when port is not found', async () => {
      mockPort.open.mockImplementationOnce((callback?: (err?: Error | null) => void) => {
        const error = new Error('Port not found: /dev/ttyUSB99');
        (error as ErrnoException).code = 'ENOENT';
        if (callback) callback(error);
      });

      const config = createConfig({ path: '/dev/ttyUSB99' });
      const transport = createSerialTransport(config);

      const result = await transport.open();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not found');
      }
      expect(transport.state).toBe('error');
    });

    it('returns Err when port is busy', async () => {
      mockPort.open.mockImplementationOnce((callback?: (err?: Error | null) => void) => {
        const error = new Error('Resource busy');
        (error as ErrnoException).code = 'EBUSY';
        if (callback) callback(error);
      });

      const config = createConfig();
      const transport = createSerialTransport(config);

      const result = await transport.open();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('busy');
      }
    });

    it('returns Err when already open', async () => {
      const config = createConfig();
      const transport = createSerialTransport(config);

      await transport.open();
      const result = await transport.open();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('already open');
      }
    });
  });

  describe('close', () => {
    it('closes an open port successfully', async () => {
      const config = createConfig();
      const transport = createSerialTransport(config);

      await transport.open();
      const result = await transport.close();

      expect(result.ok).toBe(true);
      expect(transport.state).toBe('closed');
      expect(transport.isOpen).toBe(false);
      expect(mockPort.close).toHaveBeenCalled();
    });

    it('returns Ok when closing an already closed transport', async () => {
      const config = createConfig();
      const transport = createSerialTransport(config);

      const result = await transport.close();

      expect(result.ok).toBe(true);
    });

    it('returns Err when close fails', async () => {
      mockPort.close.mockImplementationOnce((callback?: (err?: Error | null) => void) => {
        if (callback) callback(new Error('Failed to close port'));
      });

      const config = createConfig();
      const transport = createSerialTransport(config);

      await transport.open();
      const result = await transport.close();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('Failed to close');
      }
    });
  });

  describe('write', () => {
    it('writes data with termination character', async () => {
      const config = createConfig();
      const transport = createSerialTransport(config);

      await transport.open();
      const result = await transport.write('*IDN?');

      expect(result.ok).toBe(true);
      expect(mockPort.write).toHaveBeenCalledWith('*IDN?\n', expect.any(Function));
    });

    it('writes data with custom termination character', async () => {
      const config = createConfig({ writeTermination: '\r\n' });
      const transport = createSerialTransport(config);

      await transport.open();
      const result = await transport.write('*RST');

      expect(result.ok).toBe(true);
      expect(mockPort.write).toHaveBeenCalledWith('*RST\r\n', expect.any(Function));
    });

    it('returns Err when not connected', async () => {
      const config = createConfig();
      const transport = createSerialTransport(config);

      const result = await transport.write('*IDN?');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not open');
      }
    });

    it('returns Err when write fails', async () => {
      const config = createConfig();
      const transport = createSerialTransport(config);

      await transport.open();

      mockPort.write.mockImplementationOnce(
        (_data: string, callback?: (err?: Error | null) => void) => {
          if (callback) callback(new Error('Write error'));
          return false;
        }
      );

      const result = await transport.write('*IDN?');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('Write error');
      }
    });

    it('applies command delay when configured', async () => {
      const config = createConfig({ commandDelay: 50 });
      const transport = createSerialTransport(config);

      await transport.open();

      const startTime = Date.now();
      await transport.write('*RST');
      const elapsed = Date.now() - startTime;

      expect(elapsed).toBeGreaterThanOrEqual(45);
    });
  });

  describe('read', () => {
    it('reads data until termination character', async () => {
      const config = createConfig();
      const transport = createSerialTransport(config);

      await transport.open();

      const readPromise = transport.read();
      eventHandlers['data']?.(Buffer.from('RIGOL TECHNOLOGIES,DS1054Z\n'));

      const result = await readPromise;

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('RIGOL TECHNOLOGIES,DS1054Z');
      }
    });

    it('handles data arriving in chunks', async () => {
      const config = createConfig();
      const transport = createSerialTransport(config);

      await transport.open();

      const readPromise = transport.read();

      eventHandlers['data']?.(Buffer.from('RIGOL '));
      eventHandlers['data']?.(Buffer.from('TECH'));
      eventHandlers['data']?.(Buffer.from('NOLOGIES\n'));

      const result = await readPromise;

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('RIGOL TECHNOLOGIES');
      }
    });

    it('returns Err when read times out', async () => {
      const config = createConfig({ timeout: 100 });
      const transport = createSerialTransport(config);

      await transport.open();

      const result = await transport.read();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('timeout');
      }
    });

    it('returns Err when not connected', async () => {
      const config = createConfig();
      const transport = createSerialTransport(config);

      const result = await transport.read();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not open');
      }
    });

    it('handles custom read termination', async () => {
      const config = createConfig({ readTermination: '\r\n' });
      const transport = createSerialTransport(config);

      await transport.open();

      const readPromise = transport.read();
      eventHandlers['data']?.(Buffer.from('response\r\n'));

      const result = await readPromise;

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('response');
      }
    });
  });

  describe('query', () => {
    it('writes command and reads response', async () => {
      const config = createConfig();
      const transport = createSerialTransport(config);

      await transport.open();

      const queryPromise = transport.query('*IDN?');
      eventHandlers['data']?.(Buffer.from('RIGOL TECHNOLOGIES,DS1054Z\n'));

      const result = await queryPromise;

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('RIGOL TECHNOLOGIES,DS1054Z');
      }
      expect(mockPort.write).toHaveBeenCalledWith('*IDN?\n', expect.any(Function));
    });

    it('applies delay between write and read when specified', async () => {
      const config = createConfig();
      const transport = createSerialTransport(config);

      await transport.open();

      const startTime = Date.now();
      const queryPromise = transport.query(':MEAS:VOLT?', 50);

      setTimeout(() => {
        eventHandlers['data']?.(Buffer.from('1.234\n'));
      }, 10);

      const result = await queryPromise;
      const elapsed = Date.now() - startTime;

      expect(result.ok).toBe(true);
      expect(elapsed).toBeGreaterThanOrEqual(45);
    });

    it('returns Err when not connected', async () => {
      const config = createConfig();
      const transport = createSerialTransport(config);

      const result = await transport.query('*IDN?');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not open');
      }
    });
  });

  describe('writeRaw', () => {
    it('writes raw bytes without termination', async () => {
      const config = createConfig();
      const transport = createSerialTransport(config);

      await transport.open();

      const data = Buffer.from([0x01, 0x02, 0x03]);
      const result = await transport.writeRaw(data);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(3);
      }
      expect(mockPort.write).toHaveBeenCalledWith(data, expect.any(Function));
    });

    it('returns Err when not connected', async () => {
      const config = createConfig();
      const transport = createSerialTransport(config);

      const result = await transport.writeRaw(Buffer.from([0x01]));

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not open');
      }
    });
  });

  describe('readRaw', () => {
    it('reads raw bytes without termination handling', async () => {
      const config = createConfig();
      const transport = createSerialTransport(config);

      await transport.open();

      const readPromise = transport.readRaw(10);
      eventHandlers['data']?.(Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05]));

      const result = await readPromise;

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05]));
      }
    });

    it('returns Err when not connected', async () => {
      const config = createConfig();
      const transport = createSerialTransport(config);

      const result = await transport.readRaw();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not open');
      }
    });
  });

  describe('readBytes', () => {
    it('reads exact number of bytes', async () => {
      const config = createConfig();
      const transport = createSerialTransport(config);

      await transport.open();

      const readPromise = transport.readBytes(5);

      eventHandlers['data']?.(Buffer.from([0x01, 0x02]));
      eventHandlers['data']?.(Buffer.from([0x03, 0x04, 0x05, 0x06, 0x07]));

      const result = await readPromise;

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05]));
        expect(result.value.length).toBe(5);
      }
    });

    it('returns Err when read times out before getting all bytes', async () => {
      const config = createConfig({ timeout: 100 });
      const transport = createSerialTransport(config);

      await transport.open();

      const readPromise = transport.readBytes(5);
      eventHandlers['data']?.(Buffer.from([0x01, 0x02]));

      const result = await readPromise;

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('timeout');
      }
    });

    it('returns Err when not connected', async () => {
      const config = createConfig();
      const transport = createSerialTransport(config);

      const result = await transport.readBytes(5);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not open');
      }
    });
  });

  describe('clear', () => {
    it('clears buffers when connected', async () => {
      const config = createConfig();
      const transport = createSerialTransport(config);

      await transport.open();

      const result = await transport.clear();

      expect(result.ok).toBe(true);
      expect(mockPort.flush).toHaveBeenCalled();
    });

    it('returns Err when not connected', async () => {
      const config = createConfig();
      const transport = createSerialTransport(config);

      const result = await transport.clear();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not open');
      }
    });
  });

  describe('trigger', () => {
    it('sends trigger command when connected', async () => {
      const config = createConfig();
      const transport = createSerialTransport(config);

      await transport.open();

      const result = await transport.trigger();

      expect(result.ok).toBe(true);
      expect(mockPort.write).toHaveBeenCalledWith('*TRG\n', expect.any(Function));
    });

    it('returns Err when not connected', async () => {
      const config = createConfig();
      const transport = createSerialTransport(config);

      const result = await transport.trigger();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not open');
      }
    });
  });

  describe('readStb', () => {
    it('reads status byte when connected', async () => {
      const config = createConfig();
      const transport = createSerialTransport(config);

      await transport.open();

      const stbPromise = transport.readStb();
      eventHandlers['data']?.(Buffer.from('16\n'));

      const result = await stbPromise;

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(16);
      }
      expect(mockPort.write).toHaveBeenCalledWith('*STB?\n', expect.any(Function));
    });

    it('returns Err when not connected', async () => {
      const config = createConfig();
      const transport = createSerialTransport(config);

      const result = await transport.readStb();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not open');
      }
    });

    it('returns Err when response is not a valid number', async () => {
      const config = createConfig();
      const transport = createSerialTransport(config);

      await transport.open();

      const stbPromise = transport.readStb();
      eventHandlers['data']?.(Buffer.from('invalid\n'));

      const result = await stbPromise;

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('invalid');
      }
    });
  });

  describe('connection error handling', () => {
    it('handles port close during operation', async () => {
      const config = createConfig();
      const transport = createSerialTransport(config);

      await transport.open();

      const readPromise = transport.read();

      // Simulate port closing unexpectedly
      mockPort.isOpen = false;
      eventHandlers['close']?.();

      const result = await readPromise;

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('closed');
      }
      expect(transport.isOpen).toBe(false);
    });

    it('handles port error during operation', async () => {
      const config = createConfig();
      const transport = createSerialTransport(config);

      await transport.open();

      const readPromise = transport.read();
      eventHandlers['error']?.(new Error('Port disconnected'));

      const result = await readPromise;

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('disconnected');
      }
    });
  });

  describe('timeout modification', () => {
    it('allows modifying timeout after creation', async () => {
      const config = createConfig({ timeout: 1000 });
      const transport = createSerialTransport(config);

      expect(transport.timeout).toBe(1000);

      transport.timeout = 5000;

      expect(transport.timeout).toBe(5000);
    });
  });

  describe('termination modification', () => {
    it('allows modifying read termination after creation', async () => {
      const config = createConfig();
      const transport = createSerialTransport(config);

      expect(transport.readTermination).toBe('\n');

      transport.readTermination = '\r\n';

      expect(transport.readTermination).toBe('\r\n');
    });

    it('allows modifying write termination after creation', async () => {
      const config = createConfig();
      const transport = createSerialTransport(config);

      expect(transport.writeTermination).toBe('\n');

      transport.writeTermination = '\r\n';

      expect(transport.writeTermination).toBe('\r\n');
    });
  });

  describe('input validation', () => {
    it('returns Err on open when baudRate is not positive', async () => {
      const config = createConfig({ baudRate: 0 });
      const transport = createSerialTransport(config);

      const result = await transport.open();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('baudRate');
      }
    });

    it('returns Err on open when timeout is not positive', async () => {
      const config = createConfig({ timeout: -1 });
      const transport = createSerialTransport(config);

      const result = await transport.open();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('timeout');
      }
    });

    it('returns Err on open when commandDelay is negative', async () => {
      const config = createConfig({ commandDelay: -1 });
      const transport = createSerialTransport(config);

      const result = await transport.open();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('commandDelay');
      }
    });
  });

  describe('max buffer size protection', () => {
    it('returns Err when buffer exceeds maxBufferSize during read', async () => {
      const config = createConfig({ maxBufferSize: 100 });
      const transport = createSerialTransport(config);

      await transport.open();

      const readPromise = transport.read();

      // Send data that exceeds buffer limit without termination
      const largeData = Buffer.alloc(150, 'X');
      eventHandlers['data']?.(largeData);

      const result = await readPromise;

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('buffer');
        expect(result.error.message.toLowerCase()).toContain('overflow');
      }
    });

    it('uses default maxBufferSize of 1MB when not specified', () => {
      const config = createConfig();
      const transport = createSerialTransport(config);

      expect(transport.maxBufferSize).toBe(1048576);
    });

    it('exposes maxBufferSize via getter', () => {
      const config = createConfig({ maxBufferSize: 500000 });
      const transport = createSerialTransport(config);

      expect(transport.maxBufferSize).toBe(500000);
    });

    it('allows data up to maxBufferSize', async () => {
      const config = createConfig({ maxBufferSize: 100 });
      const transport = createSerialTransport(config);

      await transport.open();

      const readPromise = transport.read();

      // Send data within limit with termination
      const data = Buffer.from('X'.repeat(50) + '\n');
      eventHandlers['data']?.(data);

      const result = await readPromise;

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBe(50);
      }
    });
  });
});
