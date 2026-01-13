/**
 * Tests for simulated PSU (Power Supply Unit) device.
 *
 * @packageDocumentation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createSimulationTransport } from '../../../src/transports/simulation.js';
import { simulatedPsu } from '../../../src/simulation/devices/psu.js';

describe('Simulated PSU Device', () => {
  let transport: ReturnType<typeof createSimulationTransport>;

  beforeEach(async () => {
    transport = createSimulationTransport({ device: simulatedPsu });
    await transport.open();
  });

  describe('device identification', () => {
    it('returns correct *IDN? response', async () => {
      const result = await transport.query('*IDN?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('VISA-TS,SIM-PSU,PSU001,1.0.0');
    });

    it('exposes device info through transport', () => {
      expect(transport.deviceInfo.manufacturer).toBe('VISA-TS');
      expect(transport.deviceInfo.model).toBe('SIM-PSU');
      expect(transport.deviceInfo.serial).toBe('PSU001');
    });
  });

  describe('voltage control', () => {
    it('returns default voltage of 0V', async () => {
      const result = await transport.query('VOLT?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('0.000');
    });

    it('sets voltage with VOLT command', async () => {
      await transport.write('VOLT 12.5');

      const result = await transport.query('VOLT?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('12.500');
    });

    it('rejects voltage above maximum (30V)', async () => {
      await transport.write('VOLT 35');
      // Voltage should remain at default since validation failed
      const result = await transport.query('VOLT?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('0.000');
    });

    it('rejects negative voltage', async () => {
      await transport.write('VOLT -5');
      const result = await transport.query('VOLT?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('0.000');
    });
  });

  describe('current limit control', () => {
    it('returns default current limit of 0A', async () => {
      const result = await transport.query('CURR?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('0.000');
    });

    it('sets current limit with CURR command', async () => {
      await transport.write('CURR 3.5');
      const result = await transport.query('CURR?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('3.500');
    });

    it('rejects current above maximum (20A)', async () => {
      await transport.write('CURR 25');
      const result = await transport.query('CURR?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('0.000');
    });

    it('rejects negative current', async () => {
      await transport.write('CURR -1');
      const result = await transport.query('CURR?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('0.000');
    });
  });

  describe('output control', () => {
    it('returns default output state OFF', async () => {
      const result = await transport.query('OUTP?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('OFF');
    });

    it('turns output ON', async () => {
      await transport.write('OUTP ON');
      const result = await transport.query('OUTP?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('ON');
    });

    it('turns output OFF', async () => {
      await transport.write('OUTP ON');
      await transport.write('OUTP OFF');
      const result = await transport.query('OUTP?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('OFF');
    });

    it('accepts 1 and 0 for output state', async () => {
      await transport.write('OUTP 1');
      let result = await transport.query('OUTP?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('ON');

      await transport.write('OUTP 0');
      result = await transport.query('OUTP?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('OFF');
    });
  });

  describe('measurement queries', () => {
    it('returns default measured voltage of 0V', async () => {
      const result = await transport.query('MEAS:VOLT?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('0.000');
    });

    it('returns default measured current of 0A', async () => {
      const result = await transport.query('MEAS:CURR?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('0.000');
    });
  });

  describe('reset behavior', () => {
    it('resets all properties to defaults on *RST', async () => {
      await transport.write('VOLT 15');
      await transport.write('CURR 3');
      await transport.write('OUTP ON');

      await transport.write('*RST');

      const voltResult = await transport.query('VOLT?');
      expect(voltResult.value).toBe('0.000');

      const currResult = await transport.query('CURR?');
      expect(currResult.value).toBe('0.000');

      const outpResult = await transport.query('OUTP?');
      expect(outpResult.value).toBe('OFF');
    });
  });

  describe('OVP (Over-Voltage Protection)', () => {
    it('returns default OVP of 33V', async () => {
      const result = await transport.query('VOLT:PROT?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('33.000');
    });

    it('sets OVP level', async () => {
      await transport.write('VOLT:PROT 25');
      const result = await transport.query('VOLT:PROT?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('25.000');
    });
  });

  describe('OCP (Over-Current Protection)', () => {
    it('returns default OCP of 22A', async () => {
      const result = await transport.query('CURR:PROT?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('22.000');
    });

    it('sets OCP level', async () => {
      await transport.write('CURR:PROT 4');
      const result = await transport.query('CURR:PROT?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('4.000');
    });
  });
});
