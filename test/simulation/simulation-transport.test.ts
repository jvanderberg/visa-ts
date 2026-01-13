import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSimulationTransport } from '../../src/transports/simulation.js';
import type { SimulatedDevice } from '../../src/simulation/types.js';

describe('createSimulationTransport', () => {
  const testDevice: SimulatedDevice = {
    device: { manufacturer: 'Test', model: 'T1', serial: '001' },
    dialogues: [
      { q: '*IDN?', r: 'Test,T1,001,1.0' },
      { q: '*RST', r: null },
      { q: ':MEAS:VOLT?', r: () => '12.345' },
    ],
    properties: {
      voltage: {
        default: 12.0,
        getter: { q: ':VOLT?', r: (v) => v.toFixed(3) },
        setter: { q: /^:VOLT\s+(.+)$/, parse: (m) => parseFloat(m[1]) },
      },
    },
  };

  describe('initial state', () => {
    it('starts in closed state', () => {
      const transport = createSimulationTransport({ device: testDevice });

      expect(transport.state).toBe('closed');
      expect(transport.isOpen).toBe(false);
    });

    it('has default timeout of 2000ms', () => {
      const transport = createSimulationTransport({ device: testDevice });

      expect(transport.timeout).toBe(2000);
    });

    it('uses configured timeout', () => {
      const transport = createSimulationTransport({ device: testDevice, timeout: 5000 });

      expect(transport.timeout).toBe(5000);
    });

    it('has default termination characters', () => {
      const transport = createSimulationTransport({ device: testDevice });

      expect(transport.readTermination).toBe('\n');
      expect(transport.writeTermination).toBe('\n');
    });

    it('uses configured termination characters', () => {
      const transport = createSimulationTransport({
        device: testDevice,
        readTermination: '\r\n',
        writeTermination: '\r',
      });

      expect(transport.readTermination).toBe('\r\n');
      expect(transport.writeTermination).toBe('\r');
    });
  });

  describe('open', () => {
    it('opens successfully', async () => {
      const transport = createSimulationTransport({ device: testDevice });

      const result = await transport.open();

      expect(result.ok).toBe(true);
      expect(transport.state).toBe('open');
      expect(transport.isOpen).toBe(true);
    });

    it('returns Err when already open', async () => {
      const transport = createSimulationTransport({ device: testDevice });
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
      const transport = createSimulationTransport({ device: testDevice });
      await transport.open();

      const result = await transport.close();

      expect(result.ok).toBe(true);
      expect(transport.state).toBe('closed');
      expect(transport.isOpen).toBe(false);
    });

    it('returns Ok when already closed', async () => {
      const transport = createSimulationTransport({ device: testDevice });

      const result = await transport.close();

      expect(result.ok).toBe(true);
    });
  });

  describe('write', () => {
    it('writes successfully when open', async () => {
      const transport = createSimulationTransport({ device: testDevice });
      await transport.open();

      const result = await transport.write('*RST');

      expect(result.ok).toBe(true);
    });

    it('returns Err when not open', async () => {
      const transport = createSimulationTransport({ device: testDevice });

      const result = await transport.write('*RST');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not open');
      }
    });
  });

  describe('read', () => {
    it('returns pending response after write', async () => {
      const transport = createSimulationTransport({ device: testDevice });
      await transport.open();

      await transport.write('*IDN?');
      const result = await transport.read();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('Test,T1,001,1.0');
      }
    });

    it('returns Err when no pending response', async () => {
      const transport = createSimulationTransport({ device: testDevice });
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
      const transport = createSimulationTransport({ device: testDevice });

      const result = await transport.read();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not open');
      }
    });
  });

  describe('query', () => {
    it('writes and reads in one call', async () => {
      const transport = createSimulationTransport({ device: testDevice });
      await transport.open();

      const result = await transport.query('*IDN?');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('Test,T1,001,1.0');
      }
    });

    it('handles dynamic responses', async () => {
      const transport = createSimulationTransport({ device: testDevice });
      await transport.open();

      const result = await transport.query(':MEAS:VOLT?');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('12.345');
      }
    });

    it('handles property getters', async () => {
      const transport = createSimulationTransport({ device: testDevice });
      await transport.open();

      const result = await transport.query(':VOLT?');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('12.000');
      }
    });

    it('handles property setters', async () => {
      const transport = createSimulationTransport({ device: testDevice });
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
      const transport = createSimulationTransport({ device: testDevice });
      await transport.open();

      const result = await transport.query(':UNKNOWN?');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('timeout');
      }
    });

    it('returns Err when not open', async () => {
      const transport = createSimulationTransport({ device: testDevice });

      const result = await transport.query('*IDN?');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not open');
      }
    });

    it('supports query delay', async () => {
      const transport = createSimulationTransport({ device: testDevice });
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
        device: testDevice,
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
      const transport = createSimulationTransport({ device: testDevice });
      await transport.open();

      const data = Buffer.from('*RST\n');
      const result = await transport.writeRaw(data);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(5);
      }
    });

    it('returns Err when not open', async () => {
      const transport = createSimulationTransport({ device: testDevice });

      const result = await transport.writeRaw(Buffer.from('test'));

      expect(result.ok).toBe(false);
    });
  });

  describe('readRaw', () => {
    it('reads raw bytes from pending response', async () => {
      const transport = createSimulationTransport({ device: testDevice });
      await transport.open();

      await transport.write('*IDN?');
      const result = await transport.readRaw();

      expect(result.ok).toBe(true);
      if (result.ok) {
        const str = result.value.toString();
        expect(str).toContain('Test,T1,001,1.0');
      }
    });
  });

  describe('readBytes', () => {
    it('reads exact number of bytes', async () => {
      const transport = createSimulationTransport({ device: testDevice });
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
      const transport = createSimulationTransport({ device: testDevice });
      await transport.open();

      await transport.write('*IDN?');
      const result = await transport.readBytes(1000);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('timeout');
      }
    });
  });

  describe('clear', () => {
    it('clears pending response', async () => {
      const transport = createSimulationTransport({ device: testDevice });
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
      const transport = createSimulationTransport({ device: testDevice });
      await transport.open();

      const result = await transport.trigger();

      expect(result.ok).toBe(true);
    });

    it('returns Err when not open', async () => {
      const transport = createSimulationTransport({ device: testDevice });

      const result = await transport.trigger();

      expect(result.ok).toBe(false);
    });
  });

  describe('readStb', () => {
    it('returns simulated status byte', async () => {
      const transport = createSimulationTransport({ device: testDevice });
      await transport.open();

      const result = await transport.readStb();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(typeof result.value).toBe('number');
      }
    });

    it('returns Err when not open', async () => {
      const transport = createSimulationTransport({ device: testDevice });

      const result = await transport.readStb();

      expect(result.ok).toBe(false);
    });
  });

  describe('termination handling', () => {
    it('strips write termination before processing', async () => {
      const transport = createSimulationTransport({ device: testDevice });
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
      const transport = createSimulationTransport({ device: testDevice });
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
