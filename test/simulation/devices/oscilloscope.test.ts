/**
 * Tests for simulated oscilloscope device
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createSimulationTransport } from '../../../src/transports/simulation.js';
import { simulatedOscilloscope } from '../../../src/simulation/devices/oscilloscope.js';

describe('simulatedOscilloscope', () => {
  let transport: ReturnType<typeof createSimulationTransport>;

  beforeEach(async () => {
    transport = createSimulationTransport({ device: simulatedOscilloscope });
    await transport.open();
  });

  afterEach(async () => {
    await transport.close();
  });

  describe('device identification', () => {
    it('returns device identity string', async () => {
      const result = await transport.query('*IDN?');
      expect(result.ok).toBe(true);
      expect(result.value).toContain('VISA-TS');
      expect(result.value).toContain('SIM-OSC');
    });
  });

  describe('channel control', () => {
    it('queries channel display state', async () => {
      const result = await transport.query('CHAN1:DISP?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('ON');
    });

    it('sets channel display on/off', async () => {
      let result = await transport.write('CHAN1:DISP OFF');
      expect(result.ok).toBe(true);

      result = await transport.query('CHAN1:DISP?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('OFF');
    });

    it('queries vertical scale', async () => {
      const result = await transport.query('CHAN1:SCAL?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('1.000');
    });

    it('sets vertical scale', async () => {
      let result = await transport.write('CHAN1:SCAL 2.5');
      expect(result.ok).toBe(true);

      result = await transport.query('CHAN1:SCAL?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('2.500');
    });

    it('queries vertical offset', async () => {
      const result = await transport.query('CHAN1:OFFS?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('0.000');
    });

    it('sets vertical offset', async () => {
      let result = await transport.write('CHAN1:OFFS -1.5');
      expect(result.ok).toBe(true);

      result = await transport.query('CHAN1:OFFS?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('-1.500');
    });

    it('queries coupling mode', async () => {
      const result = await transport.query('CHAN1:COUP?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('DC');
    });

    it('sets coupling mode', async () => {
      let result = await transport.write('CHAN1:COUP AC');
      expect(result.ok).toBe(true);

      result = await transport.query('CHAN1:COUP?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('AC');
    });
  });

  describe('timebase control', () => {
    it('queries timebase scale', async () => {
      const result = await transport.query('TIM:SCAL?');
      expect(result.ok).toBe(true);
      expect(result.value).toMatch(/^\d+\.\d+/);
    });

    it('sets timebase scale', async () => {
      let result = await transport.write('TIM:SCAL 0.001');
      expect(result.ok).toBe(true);

      result = await transport.query('TIM:SCAL?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('0.001000');
    });

    it('queries timebase offset', async () => {
      const result = await transport.query('TIM:OFFS?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('0.000000');
    });
  });

  describe('trigger control', () => {
    it('queries trigger source', async () => {
      const result = await transport.query('TRIG:SOUR?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('CHAN1');
    });

    it('sets trigger source', async () => {
      let result = await transport.write('TRIG:SOUR CHAN2');
      expect(result.ok).toBe(true);

      result = await transport.query('TRIG:SOUR?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('CHAN2');
    });

    it('queries trigger level', async () => {
      const result = await transport.query('TRIG:LEV?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('0.000');
    });

    it('sets trigger level', async () => {
      let result = await transport.write('TRIG:LEV 1.25');
      expect(result.ok).toBe(true);

      result = await transport.query('TRIG:LEV?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('1.250');
    });

    it('queries trigger mode', async () => {
      const result = await transport.query('TRIG:MODE?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('EDGE');
    });

    it('sets trigger mode', async () => {
      let result = await transport.write('TRIG:MODE PULS');
      expect(result.ok).toBe(true);

      result = await transport.query('TRIG:MODE?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('PULS');
    });
  });

  describe('acquisition control', () => {
    it('supports single acquisition command', async () => {
      const result = await transport.write('SING');
      expect(result.ok).toBe(true);
    });

    it('supports run command', async () => {
      const result = await transport.write('RUN');
      expect(result.ok).toBe(true);
    });

    it('supports stop command', async () => {
      const result = await transport.write('STOP');
      expect(result.ok).toBe(true);
    });

    it('queries trigger status', async () => {
      const result = await transport.query('TRIG:STAT?');
      expect(result.ok).toBe(true);
      expect(['STOP', 'WAIT', 'RUN', 'AUTO']).toContain(result.value);
    });
  });

  describe('common SCPI commands', () => {
    it('responds to *RST', async () => {
      const result = await transport.write('*RST');
      expect(result.ok).toBe(true);
    });

    it('responds to *OPC?', async () => {
      const result = await transport.query('*OPC?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('1');
    });
  });
});
