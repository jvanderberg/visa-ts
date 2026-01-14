/**
 * Tests for simulated Electronic Load device.
 *
 * @packageDocumentation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createSimulationTransport } from '../../../src/transports/simulation.js';
import { simulatedLoad } from '../../../src/simulation/devices/load.js';

describe('Simulated Electronic Load Device', () => {
  let transport: ReturnType<typeof createSimulationTransport>;

  beforeEach(async () => {
    transport = createSimulationTransport({ device: simulatedLoad });
    await transport.open();
  });

  describe('device identification', () => {
    it('returns correct *IDN? response', async () => {
      const result = await transport.query('*IDN?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('VISA-TS,SIM-LOAD,LOAD001,1.0.0');
    });

    it('exposes device info through transport', () => {
      expect(transport.deviceInfo.manufacturer).toBe('VISA-TS');
      expect(transport.deviceInfo.model).toBe('SIM-LOAD');
      expect(transport.deviceInfo.serial).toBe('LOAD001');
    });
  });

  describe('mode control', () => {
    it('returns default mode of CC (constant current)', async () => {
      const result = await transport.query('MODE?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('CC');
    });

    it('sets mode to CV (constant voltage)', async () => {
      await transport.write('MODE CV');
      const result = await transport.query('MODE?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('CV');
    });

    it('sets mode to CR (constant resistance)', async () => {
      await transport.write('MODE CR');
      const result = await transport.query('MODE?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('CR');
    });

    it('sets mode to CP (constant power)', async () => {
      await transport.write('MODE CP');
      const result = await transport.query('MODE?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('CP');
    });
  });

  describe('input control', () => {
    it('returns default input state OFF', async () => {
      const result = await transport.query('INP?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('OFF');
    });

    it('turns input ON', async () => {
      await transport.write('INP ON');
      const result = await transport.query('INP?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('ON');
    });

    it('turns input OFF', async () => {
      await transport.write('INP ON');
      await transport.write('INP OFF');
      const result = await transport.query('INP?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('OFF');
    });

    it('accepts 1 and 0 for input state', async () => {
      await transport.write('INP 1');
      let result = await transport.query('INP?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('ON');

      await transport.write('INP 0');
      result = await transport.query('INP?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('OFF');
    });
  });

  describe('CC mode - current setting', () => {
    it('returns default current of 0A', async () => {
      const result = await transport.query('CURR?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('0.000');
    });

    it('sets current level', async () => {
      await transport.write('CURR 2.5');
      const result = await transport.query('CURR?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('2.500');
    });

    it('rejects current above maximum (30A)', async () => {
      await transport.write('CURR 35');
      const result = await transport.query('CURR?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('0.000');
    });

    it('rejects negative current', async () => {
      await transport.write('CURR -5');
      const result = await transport.query('CURR?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('0.000');
    });
  });

  describe('CV mode - voltage setting', () => {
    it('returns default voltage of 0V', async () => {
      const result = await transport.query('VOLT?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('0.000');
    });

    it('sets voltage level', async () => {
      await transport.write('VOLT 12.5');
      const result = await transport.query('VOLT?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('12.500');
    });

    it('rejects voltage above maximum (150V)', async () => {
      await transport.write('VOLT 200');
      const result = await transport.query('VOLT?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('0.000');
    });
  });

  describe('CR mode - resistance setting', () => {
    it('returns default resistance of 1000 ohms', async () => {
      const result = await transport.query('RES?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('1000.000');
    });

    it('sets resistance level', async () => {
      await transport.write('RES 100');
      const result = await transport.query('RES?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('100.000');
    });

    it('rejects resistance below minimum (0.1 ohm)', async () => {
      await transport.write('RES 0.05');
      const result = await transport.query('RES?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('1000.000');
    });

    it('rejects resistance above maximum (10000 ohms)', async () => {
      await transport.write('RES 20000');
      const result = await transport.query('RES?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('1000.000');
    });
  });

  describe('CP mode - power setting', () => {
    it('returns default power of 0W', async () => {
      const result = await transport.query('POW?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('0.000');
    });

    it('sets power level', async () => {
      await transport.write('POW 50');
      const result = await transport.query('POW?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('50.000');
    });

    it('rejects power above maximum (300W)', async () => {
      await transport.write('POW 400');
      const result = await transport.query('POW?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('0.000');
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

    it('returns default measured power of 0W', async () => {
      const result = await transport.query('MEAS:POW?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('0.000');
    });
  });

  describe('reset behavior', () => {
    it('resets all properties to defaults on *RST', async () => {
      await transport.write('CURR 5');
      await transport.write('VOLT 24');
      await transport.write('RES 500');
      await transport.write('POW 100');
      await transport.write('MODE CV');
      await transport.write('INP ON');

      await transport.write('*RST');

      const currResult = await transport.query('CURR?');
      expect(currResult.value).toBe('0.000');

      const voltResult = await transport.query('VOLT?');
      expect(voltResult.value).toBe('0.000');

      const resResult = await transport.query('RES?');
      expect(resResult.value).toBe('1000.000');

      const powResult = await transport.query('POW?');
      expect(powResult.value).toBe('0.000');

      const modeResult = await transport.query('MODE?');
      expect(modeResult.value).toBe('CC');

      const inpResult = await transport.query('INP?');
      expect(inpResult.value).toBe('OFF');
    });
  });

  describe('slew rate control', () => {
    it('returns default current slew rate', async () => {
      const result = await transport.query('CURR:SLEW?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('1.000');
    });

    it('sets current slew rate', async () => {
      await transport.write('CURR:SLEW 0.5');
      const result = await transport.query('CURR:SLEW?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('0.500');
    });
  });
});
