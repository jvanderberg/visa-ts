/**
 * Tests for PSU physics model.
 *
 * @packageDocumentation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createSimulationTransport } from '../../../src/transports/simulation.js';
import { simulatedPsu } from '../../../src/simulation/devices/psu.js';
import {
  extractPsuState,
  resolvePsuWithLoad,
} from '../../../src/simulation/devices/psu-physics.js';
import type { PsuState } from '../../../src/simulation/circuit-types.js';

describe('PSU Physics Model', () => {
  let transport: ReturnType<typeof createSimulationTransport>;

  beforeEach(async () => {
    transport = createSimulationTransport({ device: simulatedPsu });
    await transport.open();
  });

  describe('extractPsuState', () => {
    it('extracts default state with all zeros and OFF mode', async () => {
      const state = await extractPsuState(transport);

      expect(state.mode).toBe('OFF');
      expect(state.voltageSetpoint).toBe(0);
      expect(state.currentLimit).toBe(0);
      expect(state.outputVoltage).toBe(0);
      expect(state.outputCurrent).toBe(0);
      expect(state.outputEnabled).toBe(false);
    });

    it('extracts configured voltage and current setpoints', async () => {
      await transport.write('VOLT 12.5');
      await transport.write('CURR 2.0');

      const state = await extractPsuState(transport);

      expect(state.voltageSetpoint).toBe(12.5);
      expect(state.currentLimit).toBe(2.0);
    });

    it('detects output enabled state', async () => {
      await transport.write('VOLT 5.0');
      await transport.write('CURR 1.0');
      await transport.write('OUTP ON');

      const state = await extractPsuState(transport);

      expect(state.outputEnabled).toBe(true);
      expect(state.mode).toBe('CV'); // Default mode when enabled is CV
    });

    it('returns OFF mode when output is disabled even with setpoints', async () => {
      await transport.write('VOLT 12.0');
      await transport.write('CURR 3.0');
      await transport.write('OUTP OFF');

      const state = await extractPsuState(transport);

      expect(state.mode).toBe('OFF');
      expect(state.outputEnabled).toBe(false);
    });
  });

  describe('resolvePsuWithLoad', () => {
    describe('with output OFF', () => {
      it('returns zero voltage and current regardless of load demand', () => {
        const psuState: PsuState = {
          mode: 'OFF',
          voltageSetpoint: 12.0,
          currentLimit: 3.0,
          outputVoltage: 0,
          outputCurrent: 0,
          outputEnabled: false,
        };

        const resolved = resolvePsuWithLoad(psuState, 2.0);

        expect(resolved.mode).toBe('OFF');
        expect(resolved.outputVoltage).toBe(0);
        expect(resolved.outputCurrent).toBe(0);
      });
    });

    describe('in CV mode (voltage maintained)', () => {
      it('supplies load demand current when below limit', () => {
        const psuState: PsuState = {
          mode: 'CV',
          voltageSetpoint: 12.0,
          currentLimit: 5.0,
          outputVoltage: 12.0,
          outputCurrent: 0,
          outputEnabled: true,
        };

        const resolved = resolvePsuWithLoad(psuState, 2.0);

        expect(resolved.mode).toBe('CV');
        expect(resolved.outputVoltage).toBe(12.0);
        expect(resolved.outputCurrent).toBe(2.0);
      });

      it('maintains CV mode when load demand equals current limit', () => {
        const psuState: PsuState = {
          mode: 'CV',
          voltageSetpoint: 10.0,
          currentLimit: 3.0,
          outputVoltage: 10.0,
          outputCurrent: 0,
          outputEnabled: true,
        };

        const resolved = resolvePsuWithLoad(psuState, 3.0);

        // At exactly the limit, still CV mode (just barely)
        expect(resolved.mode).toBe('CV');
        expect(resolved.outputVoltage).toBe(10.0);
        expect(resolved.outputCurrent).toBe(3.0);
      });
    });

    describe('in CC mode (current limiting)', () => {
      it('transitions to CC mode when load demands more than limit', () => {
        const psuState: PsuState = {
          mode: 'CV',
          voltageSetpoint: 12.0,
          currentLimit: 2.0,
          outputVoltage: 12.0,
          outputCurrent: 0,
          outputEnabled: true,
        };

        const resolved = resolvePsuWithLoad(psuState, 5.0);

        expect(resolved.mode).toBe('CC');
        expect(resolved.outputCurrent).toBe(2.0); // Limited to current limit
        // Voltage is indeterminate in CC mode - depends on load
      });

      it('limits current to the setpoint', () => {
        const psuState: PsuState = {
          mode: 'CV',
          voltageSetpoint: 24.0,
          currentLimit: 1.5,
          outputVoltage: 24.0,
          outputCurrent: 0,
          outputEnabled: true,
        };

        const resolved = resolvePsuWithLoad(psuState, 10.0);

        expect(resolved.mode).toBe('CC');
        expect(resolved.outputCurrent).toBe(1.5);
      });
    });

    describe('edge cases', () => {
      it('handles zero load demand', () => {
        const psuState: PsuState = {
          mode: 'CV',
          voltageSetpoint: 5.0,
          currentLimit: 2.0,
          outputVoltage: 5.0,
          outputCurrent: 0,
          outputEnabled: true,
        };

        const resolved = resolvePsuWithLoad(psuState, 0);

        expect(resolved.mode).toBe('CV');
        expect(resolved.outputVoltage).toBe(5.0);
        expect(resolved.outputCurrent).toBe(0);
      });

      it('handles negative load demand by treating as zero', () => {
        const psuState: PsuState = {
          mode: 'CV',
          voltageSetpoint: 5.0,
          currentLimit: 2.0,
          outputVoltage: 5.0,
          outputCurrent: 0,
          outputEnabled: true,
        };

        const resolved = resolvePsuWithLoad(psuState, -1.0);

        expect(resolved.outputCurrent).toBe(0);
      });

      it('handles zero current limit (unable to supply current)', () => {
        const psuState: PsuState = {
          mode: 'CV',
          voltageSetpoint: 12.0,
          currentLimit: 0,
          outputVoltage: 12.0,
          outputCurrent: 0,
          outputEnabled: true,
        };

        const resolved = resolvePsuWithLoad(psuState, 2.0);

        expect(resolved.mode).toBe('CC');
        expect(resolved.outputCurrent).toBe(0);
      });
    });
  });
});
