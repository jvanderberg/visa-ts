import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSimulationTransport } from '../../src/transports/simulation.js';
import type { SimulatedDevice } from '../../src/simulation/types.js';

function createTestDevice(): SimulatedDevice {
  let voltage = 12.0;
  const initialVoltage = 12.0;
  return {
    device: { manufacturer: 'Test', model: 'T1', serial: '001' },
    dialogues: [
      { pattern: '*IDN?', response: 'Test,T1,001,1.0' },
      { pattern: ':MEAS:VOLT?', response: () => '12.345' },
    ],
    properties: {
      voltage: {
        get: () => voltage,
        set: (v) => {
          voltage = v as number;
        },
        getter: { pattern: ':VOLT?', format: (v) => (v as number).toFixed(3) },
        setter: { pattern: /^:VOLT\s+(.+)$/, parse: (m) => parseFloat(m[1] ?? initialVoltage) },
      },
    },
  };
}

describe('createSimulationTransport', () => {
  describe('initial state', () => {
    it('starts in closed state', () => {
      const transport = createSimulationTransport({ device: createTestDevice() });

      expect(transport.state).toBe('closed');
      expect(transport.isOpen).toBe(false);
    });

    it('has default timeout of 2000ms', () => {
      const transport = createSimulationTransport({ device: createTestDevice() });

      expect(transport.timeout).toBe(2000);
    });

    it('uses configured timeout', () => {
      const transport = createSimulationTransport({ device: createTestDevice(), timeout: 5000 });

      expect(transport.timeout).toBe(5000);
    });

    it('has default termination characters', () => {
      const transport = createSimulationTransport({ device: createTestDevice() });

      expect(transport.readTermination).toBe('\n');
      expect(transport.writeTermination).toBe('\n');
    });

    it('uses configured termination characters', () => {
      const transport = createSimulationTransport({
        device: createTestDevice(),
        readTermination: '\r\n',
        writeTermination: '\r',
      });

      expect(transport.readTermination).toBe('\r\n');
      expect(transport.writeTermination).toBe('\r');
    });
  });

  describe('open', () => {
    it('opens successfully', async () => {
      const transport = createSimulationTransport({ device: createTestDevice() });

      const result = await transport.open();

      expect(result.ok).toBe(true);
      expect(transport.state).toBe('open');
      expect(transport.isOpen).toBe(true);
    });

    it('returns Err when already open', async () => {
      const transport = createSimulationTransport({ device: createTestDevice() });
      await transport.open();

      const result = await transport.open();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('already');
      }
    });
  });

  describe('close', () => {
    it('closes successfully', async () => {
      const transport = createSimulationTransport({ device: createTestDevice() });
      await transport.open();

      const result = await transport.close();

      expect(result.ok).toBe(true);
      expect(transport.state).toBe('closed');
      expect(transport.isOpen).toBe(false);
    });

    it('returns Ok when already closed', async () => {
      const transport = createSimulationTransport({ device: createTestDevice() });

      const result = await transport.close();

      expect(result.ok).toBe(true);
    });
  });

  describe('write', () => {
    it('writes successfully when open', async () => {
      const transport = createSimulationTransport({ device: createTestDevice() });
      await transport.open();

      const result = await transport.write('*RST');

      expect(result.ok).toBe(true);
    });

    it('returns Err when not open', async () => {
      const transport = createSimulationTransport({ device: createTestDevice() });

      const result = await transport.write('*RST');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not open');
      }
    });
  });

  describe('read', () => {
    it('returns pending response after write', async () => {
      const transport = createSimulationTransport({ device: createTestDevice() });
      await transport.open();

      await transport.write('*IDN?');
      const result = await transport.read();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('Test,T1,001,1.0');
      }
    });

    it('overwrites pending response on second write', async () => {
      const transport = createSimulationTransport({ device: createTestDevice() });
      await transport.open();

      // First write with response
      await transport.write('*IDN?');

      // Second write overwrites the pending response
      await transport.write(':MEAS:VOLT?');

      // Should get second response
      const result = await transport.read();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('12.345');
      }
    });

    it('returns Err when no pending response', async () => {
      const transport = createSimulationTransport({ device: createTestDevice() });
      await transport.open();

      // Write a command that has no response
      await transport.write('*RST');
      const result = await transport.read();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('timeout');
      }
    });

    it('returns Err when not open', async () => {
      const transport = createSimulationTransport({ device: createTestDevice() });

      const result = await transport.read();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not open');
      }
    });
  });

  describe('query', () => {
    it('writes and reads in one call', async () => {
      const transport = createSimulationTransport({ device: createTestDevice() });
      await transport.open();

      const result = await transport.query('*IDN?');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('Test,T1,001,1.0');
      }
    });

    it('handles dynamic responses', async () => {
      const transport = createSimulationTransport({ device: createTestDevice() });
      await transport.open();

      const result = await transport.query(':MEAS:VOLT?');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('12.345');
      }
    });

    it('handles property getters', async () => {
      const transport = createSimulationTransport({ device: createTestDevice() });
      await transport.open();

      const result = await transport.query(':VOLT?');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('12.000');
      }
    });

    it('handles property setters', async () => {
      const transport = createSimulationTransport({ device: createTestDevice() });
      await transport.open();

      // Set value
      const setResult = await transport.write(':VOLT 24.5');
      expect(setResult.ok).toBe(true);

      // Read new value
      const getResult = await transport.query(':VOLT?');
      expect(getResult.ok).toBe(true);
      if (getResult.ok) {
        expect(getResult.value).toBe('24.500');
      }
    });

    it('returns Err for unknown command', async () => {
      const transport = createSimulationTransport({ device: createTestDevice() });
      await transport.open();

      const result = await transport.query(':UNKNOWN?');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not matched');
      }
    });

    it('returns Err for empty command', async () => {
      const transport = createSimulationTransport({ device: createTestDevice() });
      await transport.open();

      const result = await transport.query('');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not matched');
      }
    });

    it('returns Err when not open', async () => {
      const transport = createSimulationTransport({ device: createTestDevice() });

      const result = await transport.query('*IDN?');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not open');
      }
    });

    it('supports query delay', async () => {
      const transport = createSimulationTransport({ device: createTestDevice() });
      await transport.open();

      const start = Date.now();
      await transport.query('*IDN?', 50);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(45); // Allow some timing variance
    });
  });

  describe('latency simulation', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('adds configured latency to responses', async () => {
      const transport = createSimulationTransport({
        device: createTestDevice(),
        latencyMs: 100,
      });
      await transport.open();

      const queryPromise = transport.query('*IDN?');

      // Advance time
      await vi.advanceTimersByTimeAsync(100);

      const result = await queryPromise;
      expect(result.ok).toBe(true);
    });
  });

  describe('writeRaw', () => {
    it('writes raw bytes and returns count', async () => {
      const transport = createSimulationTransport({ device: createTestDevice() });
      await transport.open();

      const data = Buffer.from('*RST\n');
      const result = await transport.writeRaw(data);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(5);
      }
    });

    it('returns Err when not open', async () => {
      const transport = createSimulationTransport({ device: createTestDevice() });

      const result = await transport.writeRaw(Buffer.from('test'));

      expect(result.ok).toBe(false);
    });
  });

  describe('readRaw', () => {
    it('reads raw bytes from pending response', async () => {
      const transport = createSimulationTransport({ device: createTestDevice() });
      await transport.open();

      await transport.write('*IDN?');
      const result = await transport.readRaw();

      expect(result.ok).toBe(true);
      if (result.ok) {
        const str = result.value.toString();
        expect(str).toContain('Test,T1,001,1.0');
      }
    });

    it('reads partial bytes with size limit', async () => {
      const transport = createSimulationTransport({ device: createTestDevice() });
      await transport.open();

      await transport.write('*IDN?');

      // Read only first 5 bytes
      const result1 = await transport.readRaw(5);
      expect(result1.ok).toBe(true);
      if (result1.ok) {
        expect(result1.value.length).toBe(5);
        expect(result1.value.toString()).toBe('Test,');
      }

      // Remainder should still be available
      const result2 = await transport.readRaw();
      expect(result2.ok).toBe(true);
      if (result2.ok) {
        expect(result2.value.toString()).toBe('T1,001,1.0\n');
      }
    });

    it('returns Err when no pending response', async () => {
      const transport = createSimulationTransport({ device: createTestDevice() });
      await transport.open();

      const result = await transport.readRaw();

      expect(result.ok).toBe(false);
    });
  });

  describe('readBytes', () => {
    it('reads exact number of bytes', async () => {
      const transport = createSimulationTransport({ device: createTestDevice() });
      await transport.open();

      await transport.write('*IDN?');
      const result = await transport.readBytes(4);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBe(4);
        expect(result.value.toString()).toBe('Test');
      }
    });

    it('returns Err when not enough bytes', async () => {
      const transport = createSimulationTransport({ device: createTestDevice() });
      await transport.open();

      await transport.write('*IDN?');
      const result = await transport.readBytes(1000);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('timeout');
      }
    });

    it('returns Err when no pending response', async () => {
      const transport = createSimulationTransport({ device: createTestDevice() });
      await transport.open();

      // No write, so no pending response
      const result = await transport.readBytes(4);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('timeout');
      }
    });

    it('keeps remainder in pending when reading partial data', async () => {
      const transport = createSimulationTransport({ device: createTestDevice() });
      await transport.open();

      // Response is "Test,T1,001,1.0\n" = 16 bytes
      await transport.write('*IDN?');

      // Read first 5 bytes
      const result1 = await transport.readBytes(5);
      expect(result1.ok).toBe(true);
      if (result1.ok) {
        expect(result1.value.toString()).toBe('Test,');
      }

      // Remaining bytes should still be available
      const result2 = await transport.readBytes(5);
      expect(result2.ok).toBe(true);
      if (result2.ok) {
        expect(result2.value.toString()).toBe('T1,00');
      }
    });

    it('clears pending when reading exactly all bytes', async () => {
      const transport = createSimulationTransport({ device: createTestDevice() });
      await transport.open();

      // Response is "Test,T1,001,1.0" + "\n" = 16 bytes
      await transport.write('*IDN?');

      // Read exactly all bytes
      const result = await transport.readBytes(16);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBe(16);
      }

      // Nothing left to read
      const result2 = await transport.readBytes(1);
      expect(result2.ok).toBe(false);
    });
  });

  describe('clear', () => {
    it('clears pending response', async () => {
      const transport = createSimulationTransport({ device: createTestDevice() });
      await transport.open();

      await transport.write('*IDN?');
      const clearResult = await transport.clear();
      expect(clearResult.ok).toBe(true);

      // Read should now timeout
      const readResult = await transport.read();
      expect(readResult.ok).toBe(false);
    });
  });

  describe('trigger', () => {
    it('returns Ok', async () => {
      const transport = createSimulationTransport({ device: createTestDevice() });
      await transport.open();

      const result = await transport.trigger();

      expect(result.ok).toBe(true);
    });

    it('returns Err when not open', async () => {
      const transport = createSimulationTransport({ device: createTestDevice() });

      const result = await transport.trigger();

      expect(result.ok).toBe(false);
    });
  });

  describe('readStb', () => {
    it('returns simulated status byte', async () => {
      const transport = createSimulationTransport({ device: createTestDevice() });
      await transport.open();

      const result = await transport.readStb();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(typeof result.value).toBe('number');
      }
    });

    it('returns Err when not open', async () => {
      const transport = createSimulationTransport({ device: createTestDevice() });

      const result = await transport.readStb();

      expect(result.ok).toBe(false);
    });
  });

  describe('termination handling', () => {
    it('strips write termination before processing', async () => {
      const transport = createSimulationTransport({ device: createTestDevice() });
      await transport.open();

      // write() adds termination, which should be stripped before matching
      const result = await transport.query('*IDN?');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('Test,T1,001,1.0');
      }
    });
  });

  describe('state after *RST', () => {
    it('resets device state on *RST', async () => {
      const transport = createSimulationTransport({ device: createTestDevice() });
      await transport.open();

      // Modify state
      await transport.write(':VOLT 99.0');
      const beforeRst = await transport.query(':VOLT?');
      expect(beforeRst.ok && beforeRst.value).toBe('99.000');

      // Reset
      await transport.write('*RST');

      // Verify reset
      const afterRst = await transport.query(':VOLT?');
      expect(afterRst.ok && afterRst.value).toBe('12.000');
    });
  });
});
