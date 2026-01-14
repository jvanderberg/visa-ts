/**
 * Tests for Load physics model.
 *
 * @packageDocumentation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createSimulationTransport } from '../../../src/transports/simulation.js';
import { simulatedLoad } from '../../../src/simulation/devices/load.js';
import {
  extractLoadState,
  calculateLoadCurrentDemand,
} from '../../../src/simulation/devices/load-physics.js';
import type { LoadState } from '../../../src/simulation/circuit-types.js';

describe('Load Physics Model', () => {
  let transport: ReturnType<typeof createSimulationTransport>;

  beforeEach(async () => {
    transport = createSimulationTransport({ device: simulatedLoad });
    await transport.open();
  });

  describe('extractLoadState', () => {
    it('extracts default state with OFF mode', async () => {
      const state = await extractLoadState(transport);

      expect(state.mode).toBe('OFF');
      expect(state.currentSetpoint).toBe(0);
      expect(state.voltageSetpoint).toBe(0);
      expect(state.resistanceSetpoint).toBe(1000); // Default from load.ts
      expect(state.powerSetpoint).toBe(0);
      expect(state.inputEnabled).toBe(false);
    });

    it('extracts CC mode configuration', async () => {
      await transport.write('MODE CC');
      await transport.write('CURR 2.5');
      await transport.write('INP ON');

      const state = await extractLoadState(transport);

      expect(state.mode).toBe('CC');
      expect(state.currentSetpoint).toBe(2.5);
      expect(state.inputEnabled).toBe(true);
    });

    it('extracts CV mode configuration', async () => {
      await transport.write('MODE CV');
      await transport.write('VOLT 5.0');
      await transport.write('INP ON');

      const state = await extractLoadState(transport);

      expect(state.mode).toBe('CV');
      expect(state.voltageSetpoint).toBe(5.0);
      expect(state.inputEnabled).toBe(true);
    });

    it('extracts CR mode configuration', async () => {
      await transport.write('MODE CR');
      await transport.write('RES 100');
      await transport.write('INP ON');

      const state = await extractLoadState(transport);

      expect(state.mode).toBe('CR');
      expect(state.resistanceSetpoint).toBe(100);
      expect(state.inputEnabled).toBe(true);
    });

    it('extracts CP mode configuration', async () => {
      await transport.write('MODE CP');
      await transport.write('POW 50');
      await transport.write('INP ON');

      const state = await extractLoadState(transport);

      expect(state.mode).toBe('CP');
      expect(state.powerSetpoint).toBe(50);
      expect(state.inputEnabled).toBe(true);
    });

    it('returns OFF when input is disabled regardless of mode setting', async () => {
      await transport.write('MODE CC');
      await transport.write('CURR 5.0');
      await transport.write('INP OFF');

      const state = await extractLoadState(transport);

      expect(state.mode).toBe('OFF');
      expect(state.inputEnabled).toBe(false);
      // Setpoints are preserved
      expect(state.currentSetpoint).toBe(5.0);
    });
  });

  describe('calculateLoadCurrentDemand', () => {
    describe('OFF mode', () => {
      it('returns zero current demand', () => {
        const state: LoadState = {
          mode: 'OFF',
          currentSetpoint: 5.0,
          voltageSetpoint: 0,
          resistanceSetpoint: 1000,
          powerSetpoint: 0,
          inputVoltage: 0,
          inputCurrent: 0,
          inputEnabled: false,
        };

        const demand = calculateLoadCurrentDemand(state, 12.0);

        expect(demand).toBe(0);
      });
    });

    describe('CC mode (Constant Current)', () => {
      it('returns current setpoint when supply voltage is available', () => {
        const state: LoadState = {
          mode: 'CC',
          currentSetpoint: 2.5,
          voltageSetpoint: 0,
          resistanceSetpoint: 1000,
          powerSetpoint: 0,
          inputVoltage: 0,
          inputCurrent: 0,
          inputEnabled: true,
        };

        const demand = calculateLoadCurrentDemand(state, 12.0);

        expect(demand).toBe(2.5);
      });

      it('returns current setpoint regardless of supply voltage', () => {
        const state: LoadState = {
          mode: 'CC',
          currentSetpoint: 3.0,
          voltageSetpoint: 0,
          resistanceSetpoint: 1000,
          powerSetpoint: 0,
          inputVoltage: 0,
          inputCurrent: 0,
          inputEnabled: true,
        };

        // CC mode doesn't depend on supply voltage - it demands fixed current
        expect(calculateLoadCurrentDemand(state, 5.0)).toBe(3.0);
        expect(calculateLoadCurrentDemand(state, 24.0)).toBe(3.0);
      });

      it('returns zero demand when supply voltage is zero', () => {
        const state: LoadState = {
          mode: 'CC',
          currentSetpoint: 2.0,
          voltageSetpoint: 0,
          resistanceSetpoint: 1000,
          powerSetpoint: 0,
          inputVoltage: 0,
          inputCurrent: 0,
          inputEnabled: true,
        };

        // Can't draw current from zero voltage supply
        const demand = calculateLoadCurrentDemand(state, 0);

        expect(demand).toBe(0);
      });
    });

    describe('CR mode (Constant Resistance)', () => {
      it('calculates current using Ohms law: I = V/R', () => {
        const state: LoadState = {
          mode: 'CR',
          currentSetpoint: 0,
          voltageSetpoint: 0,
          resistanceSetpoint: 10, // 10 ohms
          powerSetpoint: 0,
          inputVoltage: 0,
          inputCurrent: 0,
          inputEnabled: true,
        };

        // I = V/R = 12V / 10Ω = 1.2A
        const demand = calculateLoadCurrentDemand(state, 12.0);

        expect(demand).toBeCloseTo(1.2, 6);
      });

      it('returns zero current at zero voltage', () => {
        const state: LoadState = {
          mode: 'CR',
          currentSetpoint: 0,
          voltageSetpoint: 0,
          resistanceSetpoint: 100,
          powerSetpoint: 0,
          inputVoltage: 0,
          inputCurrent: 0,
          inputEnabled: true,
        };

        const demand = calculateLoadCurrentDemand(state, 0);

        expect(demand).toBe(0);
      });

      it('handles very small resistance (high current)', () => {
        const state: LoadState = {
          mode: 'CR',
          currentSetpoint: 0,
          voltageSetpoint: 0,
          resistanceSetpoint: 0.1, // 0.1 ohms
          powerSetpoint: 0,
          inputVoltage: 0,
          inputCurrent: 0,
          inputEnabled: true,
        };

        // I = V/R = 12V / 0.1Ω = 120A
        const demand = calculateLoadCurrentDemand(state, 12.0);

        expect(demand).toBeCloseTo(120, 6);
      });
    });

    describe('CV mode (Constant Voltage)', () => {
      it('returns very high current demand when supply exceeds setpoint', () => {
        const state: LoadState = {
          mode: 'CV',
          currentSetpoint: 0,
          voltageSetpoint: 5.0, // Clamp to 5V
          resistanceSetpoint: 1000,
          powerSetpoint: 0,
          inputVoltage: 0,
          inputCurrent: 0,
          inputEnabled: true,
        };

        // CV mode tries to clamp voltage - demands as much current as needed
        // When supply > setpoint, demand is effectively infinite (limited by supply)
        const demand = calculateLoadCurrentDemand(state, 12.0);

        // Returns Infinity to indicate "as much as available"
        expect(demand).toBe(Infinity);
      });

      it('returns zero demand when supply is below setpoint', () => {
        const state: LoadState = {
          mode: 'CV',
          currentSetpoint: 0,
          voltageSetpoint: 12.0,
          resistanceSetpoint: 1000,
          powerSetpoint: 0,
          inputVoltage: 0,
          inputCurrent: 0,
          inputEnabled: true,
        };

        // Can't clamp to 12V when only 5V available
        const demand = calculateLoadCurrentDemand(state, 5.0);

        expect(demand).toBe(0);
      });
    });

    describe('CP mode (Constant Power)', () => {
      it('calculates current using power formula: I = P/V', () => {
        const state: LoadState = {
          mode: 'CP',
          currentSetpoint: 0,
          voltageSetpoint: 0,
          resistanceSetpoint: 1000,
          powerSetpoint: 24, // 24 watts
          inputVoltage: 0,
          inputCurrent: 0,
          inputEnabled: true,
        };

        // I = P/V = 24W / 12V = 2A
        const demand = calculateLoadCurrentDemand(state, 12.0);

        expect(demand).toBeCloseTo(2.0, 6);
      });

      it('returns zero current at zero voltage to avoid division by zero', () => {
        const state: LoadState = {
          mode: 'CP',
          currentSetpoint: 0,
          voltageSetpoint: 0,
          resistanceSetpoint: 1000,
          powerSetpoint: 50,
          inputVoltage: 0,
          inputCurrent: 0,
          inputEnabled: true,
        };

        const demand = calculateLoadCurrentDemand(state, 0);

        expect(demand).toBe(0);
      });

      it('returns high current at low voltage', () => {
        const state: LoadState = {
          mode: 'CP',
          currentSetpoint: 0,
          voltageSetpoint: 0,
          resistanceSetpoint: 1000,
          powerSetpoint: 10, // 10 watts
          inputVoltage: 0,
          inputCurrent: 0,
          inputEnabled: true,
        };

        // I = P/V = 10W / 2V = 5A
        const demand = calculateLoadCurrentDemand(state, 2.0);

        expect(demand).toBeCloseTo(5.0, 6);
      });
    });

    describe('edge cases', () => {
      it('handles negative supply voltage by treating as zero', () => {
        const state: LoadState = {
          mode: 'CC',
          currentSetpoint: 2.0,
          voltageSetpoint: 0,
          resistanceSetpoint: 1000,
          powerSetpoint: 0,
          inputVoltage: 0,
          inputCurrent: 0,
          inputEnabled: true,
        };

        const demand = calculateLoadCurrentDemand(state, -5.0);

        expect(demand).toBe(0);
      });

      it('handles zero resistance in CR mode gracefully', () => {
        const state: LoadState = {
          mode: 'CR',
          currentSetpoint: 0,
          voltageSetpoint: 0,
          resistanceSetpoint: 0, // Would cause division by zero
          powerSetpoint: 0,
          inputVoltage: 0,
          inputCurrent: 0,
          inputEnabled: true,
        };

        // Should return Infinity (short circuit behavior)
        const demand = calculateLoadCurrentDemand(state, 12.0);

        expect(demand).toBe(Infinity);
      });
    });
  });
});
