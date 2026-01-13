/**
 * Tests for simulated digital multimeter device
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createSimulationTransport } from '../../../src/transports/simulation.js';
import { simulatedDmm } from '../../../src/simulation/devices/dmm.js';

describe('simulatedDmm', () => {
  let transport: ReturnType<typeof createSimulationTransport>;

  beforeEach(async () => {
    transport = createSimulationTransport({ device: simulatedDmm });
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
      expect(result.value).toContain('SIM-DMM');
    });
  });

  describe('measurement function', () => {
    it('queries current measurement function', async () => {
      const result = await transport.query('FUNC?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('VOLT:DC');
    });

    it('sets DC voltage function', async () => {
      let result = await transport.write('FUNC VOLT:DC');
      expect(result.ok).toBe(true);

      result = await transport.query('FUNC?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('VOLT:DC');
    });

    it('sets AC voltage function', async () => {
      let result = await transport.write('FUNC VOLT:AC');
      expect(result.ok).toBe(true);

      result = await transport.query('FUNC?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('VOLT:AC');
    });

    it('sets DC current function', async () => {
      let result = await transport.write('FUNC CURR:DC');
      expect(result.ok).toBe(true);

      result = await transport.query('FUNC?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('CURR:DC');
    });

    it('sets resistance function', async () => {
      let result = await transport.write('FUNC RES');
      expect(result.ok).toBe(true);

      result = await transport.query('FUNC?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('RES');
    });

    it('sets frequency function', async () => {
      let result = await transport.write('FUNC FREQ');
      expect(result.ok).toBe(true);

      result = await transport.query('FUNC?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('FREQ');
    });

    it('sets continuity function', async () => {
      let result = await transport.write('FUNC CONT');
      expect(result.ok).toBe(true);

      result = await transport.query('FUNC?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('CONT');
    });
  });

  describe('range control', () => {
    it('queries voltage range', async () => {
      const result = await transport.query('VOLT:DC:RANG?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('AUTO');
    });

    it('sets voltage range to AUTO', async () => {
      let result = await transport.write('VOLT:DC:RANG AUTO');
      expect(result.ok).toBe(true);

      result = await transport.query('VOLT:DC:RANG?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('AUTO');
    });

    it('sets voltage range to numeric value', async () => {
      let result = await transport.write('VOLT:DC:RANG 10');
      expect(result.ok).toBe(true);

      result = await transport.query('VOLT:DC:RANG?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('10');
    });
  });

  describe('resolution/NPLC control', () => {
    it('queries NPLC', async () => {
      const result = await transport.query('VOLT:DC:NPLC?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('1.000');
    });

    it('sets NPLC', async () => {
      let result = await transport.write('VOLT:DC:NPLC 10');
      expect(result.ok).toBe(true);

      result = await transport.query('VOLT:DC:NPLC?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('10.000');
    });
  });

  describe('measurements', () => {
    it('reads voltage measurement', async () => {
      const result = await transport.query('MEAS:VOLT:DC?');
      expect(result.ok).toBe(true);
      expect(parseFloat(result.value!)).toBeGreaterThanOrEqual(0);
    });

    it('reads resistance measurement', async () => {
      const result = await transport.query('MEAS:RES?');
      expect(result.ok).toBe(true);
      expect(parseFloat(result.value!)).toBeGreaterThanOrEqual(0);
    });

    it('returns last reading with READ?', async () => {
      const result = await transport.query('READ?');
      expect(result.ok).toBe(true);
      expect(parseFloat(result.value!)).not.toBeNaN();
    });

    it('fetches last reading', async () => {
      const result = await transport.query('FETC?');
      expect(result.ok).toBe(true);
      expect(parseFloat(result.value!)).not.toBeNaN();
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

    it('responds to *CLS', async () => {
      const result = await transport.write('*CLS');
      expect(result.ok).toBe(true);
    });
  });

  describe('trigger control', () => {
    it('queries trigger source', async () => {
      const result = await transport.query('TRIG:SOUR?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('IMM');
    });

    it('sets trigger source', async () => {
      let result = await transport.write('TRIG:SOUR BUS');
      expect(result.ok).toBe(true);

      result = await transport.query('TRIG:SOUR?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('BUS');
    });
  });
});
