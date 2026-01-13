/**
 * Tests for circuit solver.
 *
 * Tests circuit resolution from simplest to most complex scenarios.
 *
 * @packageDocumentation
 */

import { describe, it, expect } from 'vitest';
import { solveCircuit } from '../../../src/simulation/circuit/solver.js';
import type { CircuitState } from '../../../src/simulation/circuit/types.js';

/** Voltage precision tolerance (1mV) */
const V_EPSILON = 0.001;
/** Current precision tolerance (1mA) */
const I_EPSILON = 0.001;

/** Helper to assert voltage within tolerance */
function expectVoltage(actual: number, expected: number): void {
  expect(Math.abs(actual - expected)).toBeLessThan(V_EPSILON);
}

/** Helper to assert current within tolerance */
function expectCurrent(actual: number, expected: number): void {
  expect(Math.abs(actual - expected)).toBeLessThan(I_EPSILON);
}

describe('solveCircuit', () => {
  describe('open circuit (load input OFF)', () => {
    it('returns PSU voltage at load terminals with zero current', () => {
      const state: CircuitState = {
        psu: {
          voltageSetpoint: 12.0,
          currentLimit: 2.0,
          outputEnabled: true,
        },
        load: {
          mode: 'CC',
          inputEnabled: false,
          currentSetpoint: 1.0,
        },
        wireResistance: 0.05,
      };

      const result = solveCircuit(state);

      expectVoltage(result.psuVoltage, 12.0);
      expectCurrent(result.psuCurrent, 0);
      expectVoltage(result.loadVoltage, 12.0); // No current = no voltage drop
      expectCurrent(result.loadCurrent, 0);
      expect(result.psuMode).toBe('CV');
    });

    it('returns zero everything when PSU output is OFF', () => {
      const state: CircuitState = {
        psu: {
          voltageSetpoint: 12.0,
          currentLimit: 2.0,
          outputEnabled: false,
        },
        load: {
          mode: 'CC',
          inputEnabled: true,
          currentSetpoint: 1.0,
        },
      };

      const result = solveCircuit(state);

      expectVoltage(result.psuVoltage, 0);
      expectCurrent(result.psuCurrent, 0);
      expectVoltage(result.loadVoltage, 0);
      expectCurrent(result.loadCurrent, 0);
      expect(result.psuMode).toBe('OFF');
    });
  });

  describe('CR load (constant resistance)', () => {
    it('calculates current from Ohm law: I = V / R', () => {
      const state: CircuitState = {
        psu: {
          voltageSetpoint: 12.0,
          currentLimit: 10.0, // High limit, won't hit
          outputEnabled: true,
        },
        load: {
          mode: 'CR',
          inputEnabled: true,
          resistanceSetpoint: 10.0, // 10 ohms
        },
        wireResistance: 0, // No wire resistance for simplicity
      };

      const result = solveCircuit(state);

      // I = 12V / 10Ω = 1.2A
      expectVoltage(result.psuVoltage, 12.0);
      expectCurrent(result.psuCurrent, 1.2);
      expectVoltage(result.loadVoltage, 12.0);
      expectCurrent(result.loadCurrent, 1.2);
      expect(result.psuMode).toBe('CV');
    });

    it('includes wire resistance in calculation', () => {
      const state: CircuitState = {
        psu: {
          voltageSetpoint: 12.0,
          currentLimit: 10.0,
          outputEnabled: true,
        },
        load: {
          mode: 'CR',
          inputEnabled: true,
          resistanceSetpoint: 10.0, // 10 ohms
        },
        wireResistance: 0.1, // 100mΩ wire
      };

      const result = solveCircuit(state);

      // Total R = 10 + 0.1 = 10.1Ω
      // I = 12V / 10.1Ω ≈ 1.188A
      // V_load = 12 - (1.188 * 0.1) ≈ 11.88V
      const expectedCurrent = 12.0 / 10.1;
      expectCurrent(result.psuCurrent, expectedCurrent);
      expectVoltage(result.loadVoltage, 12.0 - expectedCurrent * 0.1);
    });

    it('uses default wire resistance of 0.01 ohms when undefined', () => {
      const state: CircuitState = {
        psu: {
          voltageSetpoint: 12.0,
          currentLimit: 10.0,
          outputEnabled: true,
        },
        load: {
          mode: 'CR',
          inputEnabled: true,
          resistanceSetpoint: 10.0,
        },
        // wireResistance not specified
      };

      const result = solveCircuit(state);

      // Total R = 10 + 0.01 = 10.01Ω
      const expectedCurrent = 12.0 / 10.01;
      expectCurrent(result.psuCurrent, expectedCurrent);
    });
  });

  describe('PSU CV mode (constant voltage)', () => {
    it('maintains voltage setpoint when current is within limit', () => {
      const state: CircuitState = {
        psu: {
          voltageSetpoint: 15.0,
          currentLimit: 5.0,
          outputEnabled: true,
        },
        load: {
          mode: 'CC',
          inputEnabled: true,
          currentSetpoint: 2.0, // Within limit
        },
        wireResistance: 0,
      };

      const result = solveCircuit(state);

      expectVoltage(result.psuVoltage, 15.0);
      expectCurrent(result.psuCurrent, 2.0);
      expect(result.psuMode).toBe('CV');
    });
  });

  describe('PSU CC mode (constant current limiting)', () => {
    it('limits current when load demands more than PSU can supply', () => {
      const state: CircuitState = {
        psu: {
          voltageSetpoint: 12.0,
          currentLimit: 2.0, // Low limit
          outputEnabled: true,
        },
        load: {
          mode: 'CC',
          inputEnabled: true,
          currentSetpoint: 5.0, // Wants more than PSU can supply
        },
        wireResistance: 0,
      };

      const result = solveCircuit(state);

      // PSU limits current to 2A
      expectVoltage(result.psuVoltage, 12.0);
      expectCurrent(result.psuCurrent, 2.0);
      expectCurrent(result.loadCurrent, 2.0);
      expect(result.psuMode).toBe('CC');
    });
  });

  describe('CC load (constant current)', () => {
    it('draws specified current when voltage is available', () => {
      const state: CircuitState = {
        psu: {
          voltageSetpoint: 24.0,
          currentLimit: 10.0,
          outputEnabled: true,
        },
        load: {
          mode: 'CC',
          inputEnabled: true,
          currentSetpoint: 3.0,
        },
        wireResistance: 0.05,
      };

      const result = solveCircuit(state);

      expectCurrent(result.loadCurrent, 3.0);
      expectCurrent(result.psuCurrent, 3.0);
      // V_load = 24 - (3 * 0.05) = 23.85V
      expectVoltage(result.loadVoltage, 23.85);
    });

    it('draws zero current when currentSetpoint is undefined', () => {
      const state: CircuitState = {
        psu: {
          voltageSetpoint: 12.0,
          currentLimit: 5.0,
          outputEnabled: true,
        },
        load: {
          mode: 'CC',
          inputEnabled: true,
          // currentSetpoint not defined
        },
      };

      const result = solveCircuit(state);

      expectCurrent(result.loadCurrent, 0);
    });
  });

  describe('CV load (constant voltage clamping)', () => {
    it('clamps load voltage to setpoint when PSU can supply it', () => {
      const state: CircuitState = {
        psu: {
          voltageSetpoint: 15.0,
          currentLimit: 10.0,
          outputEnabled: true,
        },
        load: {
          mode: 'CV',
          inputEnabled: true,
          voltageSetpoint: 10.0, // Clamp below PSU voltage
        },
        wireResistance: 0.5, // Need wire resistance for CV mode to work
      };

      const result = solveCircuit(state);

      // Load wants 10V, draws current to create voltage drop
      // I = (15V - 10V) / 0.5Ω = 10A (at PSU limit)
      // V_load = 15 - 10 * 0.5 = 10V
      expectVoltage(result.loadVoltage, 10.0);
      expectCurrent(result.loadCurrent, 10.0);
    });

    it('cannot clamp above PSU voltage', () => {
      const state: CircuitState = {
        psu: {
          voltageSetpoint: 12.0,
          currentLimit: 5.0,
          outputEnabled: true,
        },
        load: {
          mode: 'CV',
          inputEnabled: true,
          voltageSetpoint: 20.0, // Above PSU voltage
        },
        wireResistance: 0,
      };

      const result = solveCircuit(state);

      // Load can't clamp above PSU voltage - gets PSU voltage instead
      expectVoltage(result.loadVoltage, 12.0);
      expectCurrent(result.loadCurrent, 0);
    });
  });

  describe('CP load (constant power)', () => {
    it('draws current to achieve power setpoint: I = P / V', () => {
      const state: CircuitState = {
        psu: {
          voltageSetpoint: 12.0,
          currentLimit: 10.0,
          outputEnabled: true,
        },
        load: {
          mode: 'CP',
          inputEnabled: true,
          powerSetpoint: 24.0, // 24W
        },
        wireResistance: 0,
      };

      const result = solveCircuit(state);

      // I = P / V = 24W / 12V = 2A
      expectCurrent(result.loadCurrent, 2.0);
      expectVoltage(result.loadVoltage, 12.0);
    });

    it('accounts for wire resistance in power calculation', () => {
      const state: CircuitState = {
        psu: {
          voltageSetpoint: 12.0,
          currentLimit: 10.0,
          outputEnabled: true,
        },
        load: {
          mode: 'CP',
          inputEnabled: true,
          powerSetpoint: 20.0, // 20W at load
        },
        wireResistance: 0.5, // 500mΩ wire
      };

      const result = solveCircuit(state);

      // This requires iterative solving:
      // P_load = V_load * I = 20W
      // V_load = V_psu - I * R_wire
      // So: (V_psu - I * R_wire) * I = P
      // 12I - 0.5I² = 20
      // 0.5I² - 12I + 20 = 0
      // I = (12 ± sqrt(144 - 40)) / 1 = (12 ± 10.2) / 1
      // I ≈ 1.8A (taking smaller root for stability)
      // V_load = 12 - 1.8 * 0.5 = 11.1V
      // Check: 11.1 * 1.8 = 19.98W ≈ 20W
      expect(result.loadCurrent).toBeGreaterThan(1.5);
      expect(result.loadCurrent).toBeLessThan(2.5);
      expectVoltage(result.loadVoltage, 12.0 - result.loadCurrent * 0.5);
    });
  });

  describe('short circuit behavior', () => {
    it('hits PSU current limit with very low resistance load', () => {
      const state: CircuitState = {
        psu: {
          voltageSetpoint: 12.0,
          currentLimit: 5.0,
          outputEnabled: true,
        },
        load: {
          mode: 'CR',
          inputEnabled: true,
          resistanceSetpoint: 0.1, // Very low resistance
        },
        wireResistance: 0,
      };

      const result = solveCircuit(state);

      // Without limit: I = 12V / 0.1Ω = 120A
      // With PSU limit: I = 5A
      expectCurrent(result.psuCurrent, 5.0);
      expect(result.psuMode).toBe('CC');
    });
  });

  describe('interaction scenarios', () => {
    it('PSU CC and Load CR interaction - PSU limit takes priority', () => {
      const state: CircuitState = {
        psu: {
          voltageSetpoint: 12.0,
          currentLimit: 1.0, // Low limit
          outputEnabled: true,
        },
        load: {
          mode: 'CR',
          inputEnabled: true,
          resistanceSetpoint: 6.0, // Would want 2A at 12V
        },
        wireResistance: 0,
      };

      const result = solveCircuit(state);

      // Load wants I = 12/6 = 2A, but PSU limits to 1A
      expectCurrent(result.psuCurrent, 1.0);
      expectCurrent(result.loadCurrent, 1.0);
      // At 1A through 6Ω, V_load = 1 * 6 = 6V
      expectVoltage(result.loadVoltage, 6.0);
      expect(result.psuMode).toBe('CC');
    });

    it('CP load demanding more power than PSU can deliver saturates at max', () => {
      const state: CircuitState = {
        psu: {
          voltageSetpoint: 12.0,
          currentLimit: 2.0, // Max power = 12V * 2A = 24W
          outputEnabled: true,
        },
        load: {
          mode: 'CP',
          inputEnabled: true,
          powerSetpoint: 100.0, // Wants 100W, PSU can only do 24W
        },
        wireResistance: 0,
      };

      const result = solveCircuit(state);

      // PSU saturates at CC mode
      expectCurrent(result.psuCurrent, 2.0);
      expect(result.psuMode).toBe('CC');
    });
  });

  describe('edge cases', () => {
    it('handles zero voltage setpoint', () => {
      const state: CircuitState = {
        psu: {
          voltageSetpoint: 0,
          currentLimit: 5.0,
          outputEnabled: true,
        },
        load: {
          mode: 'CC',
          inputEnabled: true,
          currentSetpoint: 1.0,
        },
      };

      const result = solveCircuit(state);

      expectVoltage(result.psuVoltage, 0);
      expectCurrent(result.psuCurrent, 0);
    });

    it('handles very high resistance (approaches open circuit)', () => {
      const state: CircuitState = {
        psu: {
          voltageSetpoint: 12.0,
          currentLimit: 5.0,
          outputEnabled: true,
        },
        load: {
          mode: 'CR',
          inputEnabled: true,
          resistanceSetpoint: 1000000, // 1MΩ
        },
        wireResistance: 0,
      };

      const result = solveCircuit(state);

      // I = 12V / 1MΩ = 12µA ≈ 0
      expect(result.psuCurrent).toBeLessThan(0.001);
      expectVoltage(result.loadVoltage, 12.0);
    });

    it('protects against division by zero in CP mode at zero voltage', () => {
      const state: CircuitState = {
        psu: {
          voltageSetpoint: 0,
          currentLimit: 5.0,
          outputEnabled: true,
        },
        load: {
          mode: 'CP',
          inputEnabled: true,
          powerSetpoint: 10.0,
        },
      };

      const result = solveCircuit(state);

      // Should not crash - return zero current
      expectCurrent(result.loadCurrent, 0);
    });
  });
});
