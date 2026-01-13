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
let mockPortFactory: ReturnType<typeof vi.fn>;

vi.mock('serialport', () => ({
  SerialPort: vi.fn(() => mockPort),
}));

import { probeSerialPort } from '../../src/util/serial-probe.js';
import { SerialPort } from 'serialport';

describe('probeSerialPort', () => {
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

    mockPortFactory = vi.mocked(SerialPort);
    mockPortFactory.mockImplementation(() => mockPort as unknown as SerialPort);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('successful detection', () => {
    it('returns Ok with detected baud rate when probe succeeds at first baud rate', async () => {
      const probePromise = probeSerialPort('/dev/ttyUSB0');

      // Simulate response at default first baud rate (115200)
      await vi.waitFor(() => {
        expect(mockPort.write).toHaveBeenCalled();
      });
      eventHandlers['data']?.(Buffer.from('RIGOL TECHNOLOGIES,DS1054Z\n'));

      const result = await probePromise;

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.baudRate).toBe(115200);
        expect(result.value.response).toBe('RIGOL TECHNOLOGIES,DS1054Z');
      }
    });

    it('returns Ok with detected baud rate when first baud rate fails but second succeeds', async () => {
      // Track which baud rate we're on
      let currentBaudRate = 0;

      mockPortFactory.mockImplementation((config: { baudRate: number }) => {
        currentBaudRate = config.baudRate;
        return mockPort as unknown as SerialPort;
      });

      const probePromise = probeSerialPort('/dev/ttyUSB0', {
        baudRates: [115200, 9600],
        probeTimeout: 50,
      });

      // First attempt (115200) - let it timeout by not responding
      await vi.waitFor(() => {
        expect(mockPort.write).toHaveBeenCalled();
      });

      // Wait for timeout and retry
      await new Promise((r) => setTimeout(r, 100));

      // Second attempt (9600) - respond successfully
      if (currentBaudRate === 9600) {
        eventHandlers['data']?.(Buffer.from('Matrix PSU\n'));
      }

      const result = await probePromise;

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.baudRate).toBe(9600);
        expect(result.value.response).toBe('Matrix PSU');
      }
    });

    it('uses custom probe command when specified', async () => {
      const probePromise = probeSerialPort('/dev/ttyUSB0', {
        probeCommand: ':SYST:VER?',
      });

      await vi.waitFor(() => {
        expect(mockPort.write).toHaveBeenCalledWith(':SYST:VER?\n', expect.any(Function));
      });

      eventHandlers['data']?.(Buffer.from('1.0.0\n'));

      const result = await probePromise;

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.response).toBe('1.0.0');
      }
    });

    it('uses custom baud rates list when specified', async () => {
      const probePromise = probeSerialPort('/dev/ttyUSB0', {
        baudRates: [38400, 19200],
      });

      await vi.waitFor(() => {
        expect(SerialPort).toHaveBeenCalledWith(
          expect.objectContaining({
            baudRate: 38400,
          })
        );
      });

      eventHandlers['data']?.(Buffer.from('Device\n'));

      const result = await probePromise;

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.baudRate).toBe(38400);
      }
    });
  });

  describe('error handling', () => {
    it('returns Err when no baud rate works', async () => {
      const result = await probeSerialPort('/dev/ttyUSB0', {
        baudRates: [115200, 9600],
        probeTimeout: 50,
      });

      // No responses sent - all attempts timeout

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('No working baud rate found');
      }
    });

    it('returns Err when port is not found', async () => {
      mockPort.open.mockImplementation((callback?: (err?: Error | null) => void) => {
        const error = new Error('Port not found');
        (error as ErrnoException).code = 'ENOENT';
        if (callback) callback(error);
      });

      const result = await probeSerialPort('/dev/ttyUSB99');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not found');
      }
    });

    it('returns Err when port is busy', async () => {
      mockPort.open.mockImplementation((callback?: (err?: Error | null) => void) => {
        const error = new Error('Resource busy');
        (error as ErrnoException).code = 'EBUSY';
        if (callback) callback(error);
      });

      const result = await probeSerialPort('/dev/ttyUSB0');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('busy');
      }
    });

    it('closes transport after each failed attempt', async () => {
      const result = await probeSerialPort('/dev/ttyUSB0', {
        baudRates: [115200, 9600],
        probeTimeout: 50,
      });

      // Each attempt should close the port
      expect(mockPort.close).toHaveBeenCalled();
      expect(result.ok).toBe(false);
    });

    it('closes transport after successful detection', async () => {
      const probePromise = probeSerialPort('/dev/ttyUSB0');

      await vi.waitFor(() => {
        expect(mockPort.write).toHaveBeenCalled();
      });
      eventHandlers['data']?.(Buffer.from('Device\n'));

      const result = await probePromise;

      expect(result.ok).toBe(true);
      expect(mockPort.close).toHaveBeenCalled();
    });
  });

  describe('serial options passthrough', () => {
    it('passes data bits configuration to transport', async () => {
      const probePromise = probeSerialPort('/dev/ttyUSB0', {
        dataBits: 7,
      });

      await vi.waitFor(() => {
        expect(SerialPort).toHaveBeenCalledWith(
          expect.objectContaining({
            dataBits: 7,
          })
        );
      });

      eventHandlers['data']?.(Buffer.from('Device\n'));
      await probePromise;
    });

    it('passes parity configuration to transport', async () => {
      const probePromise = probeSerialPort('/dev/ttyUSB0', {
        parity: 'even',
      });

      await vi.waitFor(() => {
        expect(SerialPort).toHaveBeenCalledWith(
          expect.objectContaining({
            parity: 'even',
          })
        );
      });

      eventHandlers['data']?.(Buffer.from('Device\n'));
      await probePromise;
    });

    it('passes stop bits configuration to transport', async () => {
      const probePromise = probeSerialPort('/dev/ttyUSB0', {
        stopBits: 2,
      });

      await vi.waitFor(() => {
        expect(SerialPort).toHaveBeenCalledWith(
          expect.objectContaining({
            stopBits: 2,
          })
        );
      });

      eventHandlers['data']?.(Buffer.from('Device\n'));
      await probePromise;
    });
  });

  describe('default values', () => {
    it('uses default baud rates when not specified', async () => {
      const probePromise = probeSerialPort('/dev/ttyUSB0', {
        probeTimeout: 10,
      });

      // Should try 115200 first (default)
      await vi.waitFor(() => {
        expect(SerialPort).toHaveBeenCalledWith(
          expect.objectContaining({
            baudRate: 115200,
          })
        );
      });

      // Let it fail and check all defaults are tried
      await probePromise;

      // Default order: [115200, 9600, 57600, 38400, 19200]
      const baudRatesCalled = mockPortFactory.mock.calls.map(
        (call) => (call[0] as { baudRate: number }).baudRate
      );
      expect(baudRatesCalled).toContain(115200);
    });

    it('uses *IDN? as default probe command', async () => {
      const probePromise = probeSerialPort('/dev/ttyUSB0');

      await vi.waitFor(() => {
        expect(mockPort.write).toHaveBeenCalledWith('*IDN?\n', expect.any(Function));
      });

      eventHandlers['data']?.(Buffer.from('Device\n'));
      await probePromise;
    });
  });
});
