/**
 * Tests for simulated DMM (Digital Multimeter) device.
 *
 * @packageDocumentation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createSimulationTransport } from '../../../src/transports/simulation.js';
import { createSimulatedDmm } from '../../../src/simulation/devices/dmm.js';

describe('Simulated DMM Device', () => {
  let transport: ReturnType<typeof createSimulationTransport>;
  let dmm: ReturnType<typeof createSimulatedDmm>;

  beforeEach(async () => {
    dmm = createSimulatedDmm();
    transport = createSimulationTransport({ device: dmm });
    await transport.open();
  });

  describe('device identification', () => {
    it('returns correct *IDN? response', async () => {
      const result = await transport.query('*IDN?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('VISA-TS,SIM-DMM,DMM001,1.0.0');
    });

    it('exposes device info through transport', () => {
      expect(transport.deviceInfo.manufacturer).toBe('VISA-TS');
      expect(transport.deviceInfo.model).toBe('SIM-DMM');
      expect(transport.deviceInfo.serial).toBe('DMM001');
    });
  });

  describe('function selection', () => {
    it('defaults to VOLT:DC', async () => {
      const result = await transport.query('FUNC?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('VOLT:DC');
    });

    it('sets function with FUNC command', async () => {
      await transport.write('FUNC CURR:DC');
      const result = await transport.query('FUNC?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('CURR:DC');
    });

    it('accepts all measurement functions', async () => {
      const functions = ['VOLT:DC', 'VOLT:AC', 'CURR:DC', 'CURR:AC', 'RES', 'CONT'];

      for (const func of functions) {
        await transport.write(`FUNC ${func}`);
        const result = await transport.query('FUNC?');
        expect(result.ok).toBe(true);
        expect(result.value).toBe(func);
      }
    });

    it('is case insensitive', async () => {
      await transport.write('FUNC curr:dc');
      const result = await transport.query('FUNC?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('CURR:DC');
    });
  });

  describe('range selection', () => {
    it('defaults to AUTO', async () => {
      const result = await transport.query('RANG?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('AUTO');
    });

    it('sets range with RANG command', async () => {
      await transport.write('RANG 10');
      const result = await transport.query('RANG?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('10');
    });
  });

  describe('voltage measurement', () => {
    beforeEach(() => {
      // Simulate bus voltage of 12V, 2A
      dmm.setMeasured!(12, 2);
    });

    it('returns DC voltage with MEAS:VOLT:DC?', async () => {
      const result = await transport.query('MEAS:VOLT:DC?');
      expect(result.ok).toBe(true);
      expect(parseFloat(result.value!)).toBeCloseTo(12, 5);
    });

    it('returns AC voltage with MEAS:VOLT:AC?', async () => {
      const result = await transport.query('MEAS:VOLT:AC?');
      expect(result.ok).toBe(true);
      // AC reading is RMS approximation (0.707 of DC for simulation)
      expect(parseFloat(result.value!)).toBeCloseTo(12 * 0.707, 3);
    });

    it('returns voltage with READ? using default VOLT:DC mode', async () => {
      // Don't call FUNC - use default mode
      const result = await transport.query('READ?');
      expect(result.ok).toBe(true);
      expect(parseFloat(result.value!)).toBeCloseTo(12, 5);
    });

    it('returns voltage with READ? after FUNC VOLT:DC', async () => {
      // First verify FUNC setter works (returns no response)
      const funcResult = await transport.write('FUNC VOLT:DC');
      expect(funcResult.ok).toBe(true);

      // Then check if there's a pending response (there shouldn't be)
      const result = await transport.query('READ?');
      expect(result.ok).toBe(true);
      expect(parseFloat(result.value!)).toBeCloseTo(12, 5);
    });
  });

  describe('current measurement', () => {
    beforeEach(() => {
      dmm.setMeasured!(12, 2.5);
    });

    it('returns DC current with MEAS:CURR:DC?', async () => {
      const result = await transport.query('MEAS:CURR:DC?');
      expect(result.ok).toBe(true);
      expect(parseFloat(result.value!)).toBeCloseTo(2.5, 5);
    });

    it('returns AC current with MEAS:CURR:AC?', async () => {
      const result = await transport.query('MEAS:CURR:AC?');
      expect(result.ok).toBe(true);
      expect(parseFloat(result.value!)).toBeCloseTo(2.5 * 0.707, 3);
    });

    it('returns current with READ? when in CURR:DC mode', async () => {
      await transport.write('FUNC CURR:DC');
      const result = await transport.query('READ?');
      expect(result.ok).toBe(true);
      expect(parseFloat(result.value!)).toBeCloseTo(2.5, 5);
    });
  });

  describe('resistance measurement', () => {
    it('calculates resistance from V/I', async () => {
      dmm.setMeasured!(10, 2); // 10V / 2A = 5Ω
      const result = await transport.query('MEAS:RES?');
      expect(result.ok).toBe(true);
      expect(parseFloat(result.value!)).toBeCloseTo(5, 5);
    });

    it('returns high value for zero current (open circuit)', async () => {
      dmm.setMeasured!(10, 0);
      const result = await transport.query('MEAS:RES?');
      expect(result.ok).toBe(true);
      expect(parseFloat(result.value!)).toBeGreaterThan(1e30);
    });

    it('returns resistance with READ? when in RES mode', async () => {
      dmm.setMeasured!(12, 4); // 12V / 4A = 3Ω
      await transport.write('FUNC RES');
      const result = await transport.query('READ?');
      expect(result.ok).toBe(true);
      expect(parseFloat(result.value!)).toBeCloseTo(3, 5);
    });
  });

  describe('continuity test', () => {
    it('returns resistance in CONT mode', async () => {
      dmm.setMeasured!(0.5, 0.1); // 0.5V / 0.1A = 5Ω
      await transport.write('FUNC CONT');
      const result = await transport.query('READ?');
      expect(result.ok).toBe(true);
      expect(parseFloat(result.value!)).toBeCloseTo(5, 5);
    });
  });

  describe('configure commands', () => {
    it('accepts CONF:VOLT:DC', async () => {
      const result = await transport.write('CONF:VOLT:DC');
      expect(result.ok).toBe(true);
    });

    it('accepts CONF:CURR:DC', async () => {
      const result = await transport.write('CONF:CURR:DC');
      expect(result.ok).toBe(true);
    });

    it('accepts CONF:RES', async () => {
      const result = await transport.write('CONF:RES');
      expect(result.ok).toBe(true);
    });
  });

  describe('circuit behavior', () => {
    it('does not define getBehavior (observer only)', () => {
      expect(dmm.getBehavior).toBeUndefined();
    });

    it('has setMeasured for receiving circuit values', () => {
      expect(dmm.setMeasured).toBeDefined();
    });
  });

  describe('reset behavior', () => {
    it('resets to defaults on *RST', async () => {
      await transport.write('FUNC CURR:DC');
      await transport.write('RANG 10');

      await transport.write('*RST');

      const funcResult = await transport.query('FUNC?');
      expect(funcResult.value).toBe('VOLT:DC');

      const rangResult = await transport.query('RANG?');
      expect(rangResult.value).toBe('AUTO');
    });
  });
});
