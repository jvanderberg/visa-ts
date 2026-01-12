import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTcpipTransport, type TcpipTransportConfig } from '../../src/transports/tcpip.js';
import * as net from 'net';

interface ErrnoException extends Error {
  code?: string;
}

// Mock the net module
vi.mock('net', () => ({
  createConnection: vi.fn(),
}));

describe('TCP/IP Transport', () => {
  let mockSocket: {
    on: ReturnType<typeof vi.fn>;
    once: ReturnType<typeof vi.fn>;
    write: ReturnType<typeof vi.fn>;
    end: ReturnType<typeof vi.fn>;
    destroy: ReturnType<typeof vi.fn>;
    setTimeout: ReturnType<typeof vi.fn>;
    setKeepAlive: ReturnType<typeof vi.fn>;
    destroyed: boolean;
  };
  let eventHandlers: Record<string, (...args: unknown[]) => void>;

  beforeEach(() => {
    eventHandlers = {};
    mockSocket = {
      on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
        eventHandlers[event] = handler;
        return mockSocket;
      }),
      once: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
        eventHandlers[event] = handler;
        return mockSocket;
      }),
      write: vi.fn((data: string | Buffer, callback?: (err?: Error) => void) => {
        if (callback) callback();
        return true;
      }),
      end: vi.fn((callback?: () => void) => {
        if (callback) callback();
      }),
      destroy: vi.fn(),
      setTimeout: vi.fn(),
      setKeepAlive: vi.fn(),
      destroyed: false,
    };

    vi.mocked(net.createConnection).mockReturnValue(mockSocket as unknown as net.Socket);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createTcpipTransport', () => {
    it('creates a transport with default configuration', () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
      };

      const transport = createTcpipTransport(config);

      expect(transport).toBeDefined();
      expect(transport.state).toBe('closed');
      expect(transport.isOpen).toBe(false);
      expect(transport.timeout).toBe(2000);
      expect(transport.readTermination).toBe('\n');
      expect(transport.writeTermination).toBe('\n');
    });

    it('creates a transport with custom configuration', () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
        timeout: 5000,
        readTermination: '\r\n',
        writeTermination: '\r\n',
        connectTimeout: 10000,
        keepAlive: false,
      };

      const transport = createTcpipTransport(config);

      expect(transport.timeout).toBe(5000);
      expect(transport.readTermination).toBe('\r\n');
      expect(transport.writeTermination).toBe('\r\n');
    });
  });

  describe('open', () => {
    it('opens a connection successfully', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
      };
      const transport = createTcpipTransport(config);

      const openPromise = transport.open();

      // Simulate connection event
      eventHandlers['connect']?.();

      const result = await openPromise;

      expect(result.ok).toBe(true);
      expect(transport.state).toBe('open');
      expect(transport.isOpen).toBe(true);
      expect(net.createConnection).toHaveBeenCalledWith({
        host: '192.168.1.100',
        port: 5025,
      });
    });

    it('returns Err when connection times out', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
        connectTimeout: 100,
      };
      const transport = createTcpipTransport(config);

      const openPromise = transport.open();

      // Simulate timeout event
      eventHandlers['timeout']?.();

      const result = await openPromise;

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('timeout');
      }
      expect(transport.state).toBe('error');
    });

    it('returns Err when connection is refused', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
      };
      const transport = createTcpipTransport(config);

      const openPromise = transport.open();

      // Simulate error event
      const error = new Error('Connection refused');
      (error as ErrnoException).code = 'ECONNREFUSED';
      eventHandlers['error']?.(error);

      const result = await openPromise;

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('refused');
      }
    });

    it('returns Err when host is unreachable', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
      };
      const transport = createTcpipTransport(config);

      const openPromise = transport.open();

      const error = new Error('Host unreachable');
      (error as ErrnoException).code = 'EHOSTUNREACH';
      eventHandlers['error']?.(error);

      const result = await openPromise;

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('unreachable');
      }
    });

    it('enables keepalive when configured', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
        keepAlive: true,
        keepAliveInterval: 5000,
      };
      const transport = createTcpipTransport(config);

      const openPromise = transport.open();
      eventHandlers['connect']?.();
      await openPromise;

      expect(mockSocket.setKeepAlive).toHaveBeenCalledWith(true, 5000);
    });

    it('returns Err when already open', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
      };
      const transport = createTcpipTransport(config);

      // Open first time
      const openPromise1 = transport.open();
      eventHandlers['connect']?.();
      await openPromise1;

      // Try to open again
      const result = await transport.open();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('already open');
      }
    });
  });

  describe('close', () => {
    it('closes an open connection successfully', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
      };
      const transport = createTcpipTransport(config);

      // Open first
      const openPromise = transport.open();
      eventHandlers['connect']?.();
      await openPromise;

      const result = await transport.close();

      expect(result.ok).toBe(true);
      expect(transport.state).toBe('closed');
      expect(transport.isOpen).toBe(false);
      expect(mockSocket.end).toHaveBeenCalled();
    });

    it('returns Ok when closing an already closed transport', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
      };
      const transport = createTcpipTransport(config);

      const result = await transport.close();

      expect(result.ok).toBe(true);
    });
  });

  describe('write', () => {
    it('writes data with termination character', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
      };
      const transport = createTcpipTransport(config);

      // Open connection
      const openPromise = transport.open();
      eventHandlers['connect']?.();
      await openPromise;

      const result = await transport.write('*IDN?');

      expect(result.ok).toBe(true);
      expect(mockSocket.write).toHaveBeenCalledWith('*IDN?\n', expect.any(Function));
    });

    it('writes data with custom termination character', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
        writeTermination: '\r\n',
      };
      const transport = createTcpipTransport(config);

      const openPromise = transport.open();
      eventHandlers['connect']?.();
      await openPromise;

      const result = await transport.write('*RST');

      expect(result.ok).toBe(true);
      expect(mockSocket.write).toHaveBeenCalledWith('*RST\r\n', expect.any(Function));
    });

    it('returns Err when not connected', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
      };
      const transport = createTcpipTransport(config);

      const result = await transport.write('*IDN?');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not open');
      }
    });

    it('returns Err when write fails', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
      };
      const transport = createTcpipTransport(config);

      const openPromise = transport.open();
      eventHandlers['connect']?.();
      await openPromise;

      // Make write fail
      mockSocket.write.mockImplementationOnce((_data: string, callback?: (err?: Error) => void) => {
        if (callback) callback(new Error('Write error'));
        return false;
      });

      const result = await transport.write('*IDN?');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('Write error');
      }
    });
  });

  describe('read', () => {
    it('reads data until termination character', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
      };
      const transport = createTcpipTransport(config);

      const openPromise = transport.open();
      eventHandlers['connect']?.();
      await openPromise;

      const readPromise = transport.read();

      // Simulate receiving data
      eventHandlers['data']?.(Buffer.from('RIGOL TECHNOLOGIES,DS1054Z\n'));

      const result = await readPromise;

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('RIGOL TECHNOLOGIES,DS1054Z');
      }
    });

    it('handles data arriving in chunks', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
      };
      const transport = createTcpipTransport(config);

      const openPromise = transport.open();
      eventHandlers['connect']?.();
      await openPromise;

      const readPromise = transport.read();

      // Simulate data arriving in chunks
      eventHandlers['data']?.(Buffer.from('RIGOL TECH'));
      eventHandlers['data']?.(Buffer.from('NOLOGIES,DS'));
      eventHandlers['data']?.(Buffer.from('1054Z\n'));

      const result = await readPromise;

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('RIGOL TECHNOLOGIES,DS1054Z');
      }
    });

    it('returns Err when read times out', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
        timeout: 100,
      };
      const transport = createTcpipTransport(config);

      const openPromise = transport.open();
      eventHandlers['connect']?.();
      await openPromise;

      // Don't send any data - will timeout
      const result = await transport.read();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('timeout');
      }
    });

    it('returns Err when not connected', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
      };
      const transport = createTcpipTransport(config);

      const result = await transport.read();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not open');
      }
    });

    it('handles custom read termination', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
        readTermination: '\r\n',
      };
      const transport = createTcpipTransport(config);

      const openPromise = transport.open();
      eventHandlers['connect']?.();
      await openPromise;

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
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
      };
      const transport = createTcpipTransport(config);

      const openPromise = transport.open();
      eventHandlers['connect']?.();
      await openPromise;

      const queryPromise = transport.query('*IDN?');

      // Simulate response
      eventHandlers['data']?.(Buffer.from('RIGOL TECHNOLOGIES,DS1054Z\n'));

      const result = await queryPromise;

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('RIGOL TECHNOLOGIES,DS1054Z');
      }
      expect(mockSocket.write).toHaveBeenCalledWith('*IDN?\n', expect.any(Function));
    });

    it('applies delay between write and read when specified', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
      };
      const transport = createTcpipTransport(config);

      const openPromise = transport.open();
      eventHandlers['connect']?.();
      await openPromise;

      const startTime = Date.now();
      const queryPromise = transport.query(':MEAS:VOLT?', 50);

      // Simulate response after delay
      setTimeout(() => {
        eventHandlers['data']?.(Buffer.from('1.234\n'));
      }, 10);

      const result = await queryPromise;
      const elapsed = Date.now() - startTime;

      expect(result.ok).toBe(true);
      expect(elapsed).toBeGreaterThanOrEqual(45); // Allow some timing variance
    });

    it('returns Err when not connected', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
      };
      const transport = createTcpipTransport(config);

      const result = await transport.query('*IDN?');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not open');
      }
    });
  });

  describe('writeRaw', () => {
    it('writes raw bytes without termination', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
      };
      const transport = createTcpipTransport(config);

      const openPromise = transport.open();
      eventHandlers['connect']?.();
      await openPromise;

      const data = Buffer.from([0x01, 0x02, 0x03]);
      const result = await transport.writeRaw(data);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(3);
      }
      expect(mockSocket.write).toHaveBeenCalledWith(data, expect.any(Function));
    });

    it('returns Err when not connected', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
      };
      const transport = createTcpipTransport(config);

      const result = await transport.writeRaw(Buffer.from([0x01]));

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not open');
      }
    });
  });

  describe('readRaw', () => {
    it('reads raw bytes without termination handling', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
      };
      const transport = createTcpipTransport(config);

      const openPromise = transport.open();
      eventHandlers['connect']?.();
      await openPromise;

      const readPromise = transport.readRaw(10);
      eventHandlers['data']?.(Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05]));

      const result = await readPromise;

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05]));
      }
    });

    it('returns Err when not connected', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
      };
      const transport = createTcpipTransport(config);

      const result = await transport.readRaw();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not open');
      }
    });
  });

  describe('readBytes', () => {
    it('reads exact number of bytes', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
      };
      const transport = createTcpipTransport(config);

      const openPromise = transport.open();
      eventHandlers['connect']?.();
      await openPromise;

      const readPromise = transport.readBytes(5);

      // Send more than requested
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
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
        timeout: 100,
      };
      const transport = createTcpipTransport(config);

      const openPromise = transport.open();
      eventHandlers['connect']?.();
      await openPromise;

      // Only send 2 bytes when 5 are requested
      const readPromise = transport.readBytes(5);
      eventHandlers['data']?.(Buffer.from([0x01, 0x02]));

      const result = await readPromise;

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('timeout');
      }
    });

    it('returns Err when not connected', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
      };
      const transport = createTcpipTransport(config);

      const result = await transport.readBytes(5);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not open');
      }
    });
  });

  describe('clear', () => {
    it('clears buffers when connected', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
      };
      const transport = createTcpipTransport(config);

      const openPromise = transport.open();
      eventHandlers['connect']?.();
      await openPromise;

      const result = await transport.clear();

      expect(result.ok).toBe(true);
    });

    it('returns Err when not connected', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
      };
      const transport = createTcpipTransport(config);

      const result = await transport.clear();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not open');
      }
    });
  });

  describe('trigger', () => {
    it('sends trigger command when connected', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
      };
      const transport = createTcpipTransport(config);

      const openPromise = transport.open();
      eventHandlers['connect']?.();
      await openPromise;

      const result = await transport.trigger();

      expect(result.ok).toBe(true);
      // Trigger typically sends *TRG for SCPI instruments
      expect(mockSocket.write).toHaveBeenCalledWith('*TRG\n', expect.any(Function));
    });

    it('returns Err when not connected', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
      };
      const transport = createTcpipTransport(config);

      const result = await transport.trigger();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not open');
      }
    });
  });

  describe('readStb', () => {
    it('reads status byte when connected', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
      };
      const transport = createTcpipTransport(config);

      const openPromise = transport.open();
      eventHandlers['connect']?.();
      await openPromise;

      const stbPromise = transport.readStb();

      // Simulate STB response
      eventHandlers['data']?.(Buffer.from('16\n'));

      const result = await stbPromise;

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(16);
      }
      // readStb typically queries *STB?
      expect(mockSocket.write).toHaveBeenCalledWith('*STB?\n', expect.any(Function));
    });

    it('returns Err when not connected', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
      };
      const transport = createTcpipTransport(config);

      const result = await transport.readStb();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not open');
      }
    });

    it('returns Err when response is not a valid number', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
      };
      const transport = createTcpipTransport(config);

      const openPromise = transport.open();
      eventHandlers['connect']?.();
      await openPromise;

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
    it('handles socket close during operation', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
      };
      const transport = createTcpipTransport(config);

      const openPromise = transport.open();
      eventHandlers['connect']?.();
      await openPromise;

      const readPromise = transport.read();

      // Simulate socket closing unexpectedly
      mockSocket.destroyed = true;
      eventHandlers['close']?.();

      const result = await readPromise;

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('closed');
      }
      expect(transport.isOpen).toBe(false);
    });

    it('handles socket error during operation', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
      };
      const transport = createTcpipTransport(config);

      const openPromise = transport.open();
      eventHandlers['connect']?.();
      await openPromise;

      const readPromise = transport.read();

      // Simulate error during read
      eventHandlers['error']?.(new Error('Network error'));

      const result = await readPromise;

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('Network error');
      }
    });
  });

  describe('timeout modification', () => {
    it('allows modifying timeout after creation', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
        timeout: 1000,
      };
      const transport = createTcpipTransport(config);

      expect(transport.timeout).toBe(1000);

      transport.timeout = 5000;

      expect(transport.timeout).toBe(5000);
    });
  });

  describe('termination modification', () => {
    it('allows modifying read termination after creation', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
      };
      const transport = createTcpipTransport(config);

      expect(transport.readTermination).toBe('\n');

      transport.readTermination = '\r\n';

      expect(transport.readTermination).toBe('\r\n');
    });

    it('allows modifying write termination after creation', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
      };
      const transport = createTcpipTransport(config);

      expect(transport.writeTermination).toBe('\n');

      transport.writeTermination = '\r\n';

      expect(transport.writeTermination).toBe('\r\n');
    });
  });

  describe('input validation', () => {
    it('returns Err on open when port is less than 1', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 0,
      };
      const transport = createTcpipTransport(config);

      const result = await transport.open();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('port');
      }
    });

    it('returns Err on open when port is greater than 65535', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 65536,
      };
      const transport = createTcpipTransport(config);

      const result = await transport.open();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('port');
      }
    });

    it('returns Err on open when timeout is not positive', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
        timeout: 0,
      };
      const transport = createTcpipTransport(config);

      const result = await transport.open();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('timeout');
      }
    });

    it('returns Err on open when connectTimeout is not positive', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
        connectTimeout: -1,
      };
      const transport = createTcpipTransport(config);

      const result = await transport.open();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('connectTimeout');
      }
    });
  });

  describe('max buffer size protection', () => {
    it('returns Err when buffer exceeds maxBufferSize during read', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
        maxBufferSize: 100,
      };
      const transport = createTcpipTransport(config);

      const openPromise = transport.open();
      eventHandlers['connect']?.();
      await openPromise;

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
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
      };
      const transport = createTcpipTransport(config);

      expect(transport.maxBufferSize).toBe(1048576);
    });

    it('exposes maxBufferSize via getter', () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
        maxBufferSize: 500000,
      };
      const transport = createTcpipTransport(config);

      expect(transport.maxBufferSize).toBe(500000);
    });

    it('allows data up to maxBufferSize', async () => {
      const config: TcpipTransportConfig = {
        host: '192.168.1.100',
        port: 5025,
        maxBufferSize: 100,
      };
      const transport = createTcpipTransport(config);

      const openPromise = transport.open();
      eventHandlers['connect']?.();
      await openPromise;

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
