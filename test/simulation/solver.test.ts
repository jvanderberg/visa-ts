/**
 * Tests for circuit solver.
 *
 * The solver resolves a PSU-Wire-Load circuit to determine:
 * - Actual current flowing
 * - Voltage at load (after wire drop)
 * - PSU operating mode (CV or CC)
 *
 * @packageDocumentation
 */

import { describe, it, expect } from 'vitest';
import { solveCircuit } from '../../src/simulation/solver.js';
import type { PsuState, LoadState } from '../../src/simulation/circuit-types.js';

describe('Circuit Solver', () => {
  // Helper to create default PSU state
  function makePsuState(overrides: Partial<PsuState> = {}): PsuState {
    return {
      mode: 'CV',
      voltageSetpoint: 12.0,
      currentLimit: 5.0,
      outputVoltage: 12.0,
      outputCurrent: 0,
      outputEnabled: true,
      ...overrides,
    };
  }

  // Helper to create default Load state (CC mode)
  function makeLoadState(overrides: Partial<LoadState> = {}): LoadState {
    return {
      mode: 'CC',
      currentSetpoint: 1.0,
      voltageSetpoint: 0,
      resistanceSetpoint: 1000,
      powerSetpoint: 0,
      inputVoltage: 0,
      inputCurrent: 0,
      inputEnabled: true,
      ...overrides,
    };
  }

  describe('basic operation', () => {
    it('returns zero current and full voltage when Load is off', () => {
      const psu = makePsuState();
      const load = makeLoadState({ mode: 'OFF', inputEnabled: false });
      const wireResistance = 0.1;

      const result = solveCircuit({ psu, load, wireResistance });

      expect(result.solved).toBe(true);
      expect(result.current).toBe(0);
      expect(result.psuVoltage).toBe(12.0);
      expect(result.loadVoltage).toBe(12.0); // No current = no drop
      expect(result.wireDrop).toBe(0);
      expect(result.psuMode).toBe('CV');
    });

    it('returns zero current and voltage when PSU is off', () => {
      const psu = makePsuState({ mode: 'OFF', outputEnabled: false });
      const load = makeLoadState({ mode: 'CC', currentSetpoint: 2.0 });
      const wireResistance = 0.1;

      const result = solveCircuit({ psu, load, wireResistance });

      expect(result.solved).toBe(true);
      expect(result.current).toBe(0);
      expect(result.psuVoltage).toBe(0);
      expect(result.loadVoltage).toBe(0);
      expect(result.psuMode).toBe('OFF');
    });
  });

  describe('CV mode operation (Load below PSU current limit)', () => {
    it('supplies Load demand current at full voltage', () => {
      const psu = makePsuState({ voltageSetpoint: 12.0, currentLimit: 5.0 });
      const load = makeLoadState({ mode: 'CC', currentSetpoint: 2.0 });
      const wireResistance = 0.1;

      const result = solveCircuit({ psu, load, wireResistance });

      expect(result.solved).toBe(true);
      expect(result.psuMode).toBe('CV');
      expect(result.current).toBe(2.0);
      expect(result.psuVoltage).toBe(12.0);
      // Wire drop = 2.0A * 0.1Ω = 0.2V
      expect(result.wireDrop).toBeCloseTo(0.2, 6);
      expect(result.loadVoltage).toBeCloseTo(11.8, 6);
    });

    it('calculates correct wire voltage drop', () => {
      const psu = makePsuState({ voltageSetpoint: 24.0, currentLimit: 10.0 });
      const load = makeLoadState({ mode: 'CC', currentSetpoint: 5.0 });
      const wireResistance = 0.5; // 500mΩ wire

      const result = solveCircuit({ psu, load, wireResistance });

      // Wire drop = 5A * 0.5Ω = 2.5V
      expect(result.wireDrop).toBeCloseTo(2.5, 6);
      expect(result.loadVoltage).toBeCloseTo(21.5, 6);
    });
  });

  describe('CC mode operation (Load exceeds PSU current limit)', () => {
    it('limits current to PSU limit', () => {
      const psu = makePsuState({ voltageSetpoint: 12.0, currentLimit: 2.0 });
      const load = makeLoadState({ mode: 'CC', currentSetpoint: 5.0 });
      const wireResistance = 0.1;

      const result = solveCircuit({ psu, load, wireResistance });

      expect(result.solved).toBe(true);
      expect(result.psuMode).toBe('CC');
      expect(result.current).toBe(2.0); // Limited to PSU limit
    });

    it('transitions to CC mode when Load demands more than limit', () => {
      const psu = makePsuState({ voltageSetpoint: 12.0, currentLimit: 1.5 });
      const load = makeLoadState({ mode: 'CC', currentSetpoint: 3.0 });
      const wireResistance = 0.1;

      const result = solveCircuit({ psu, load, wireResistance });

      expect(result.psuMode).toBe('CC');
      expect(result.current).toBe(1.5);
    });
  });

  describe('boundary conditions', () => {
    it('handles Load demand exactly at PSU limit', () => {
      const psu = makePsuState({ voltageSetpoint: 12.0, currentLimit: 3.0 });
      const load = makeLoadState({ mode: 'CC', currentSetpoint: 3.0 });
      const wireResistance = 0.1;

      const result = solveCircuit({ psu, load, wireResistance });

      expect(result.current).toBeCloseTo(3.0, 6);
      // At exactly the limit, should be CV (not limiting yet)
      expect(result.psuMode).toBe('CV');
    });

    it('handles PSU with zero current limit', () => {
      const psu = makePsuState({ voltageSetpoint: 12.0, currentLimit: 0 });
      const load = makeLoadState({ mode: 'CC', currentSetpoint: 2.0 });
      const wireResistance = 0.1;

      const result = solveCircuit({ psu, load, wireResistance });

      expect(result.current).toBe(0);
      expect(result.psuMode).toBe('CC'); // Limiting at zero
      expect(result.loadVoltage).toBe(12.0); // No current = no drop
    });

    it('handles zero wire resistance', () => {
      const psu = makePsuState({ voltageSetpoint: 12.0, currentLimit: 5.0 });
      const load = makeLoadState({ mode: 'CC', currentSetpoint: 3.0 });
      const wireResistance = 0; // Perfect wire

      const result = solveCircuit({ psu, load, wireResistance });

      expect(result.wireDrop).toBe(0);
      expect(result.loadVoltage).toBe(12.0); // No drop
      expect(result.current).toBe(3.0);
    });

    it('handles very high wire resistance (voltage drop exceeds PSU voltage)', () => {
      const psu = makePsuState({ voltageSetpoint: 5.0, currentLimit: 10.0 });
      const load = makeLoadState({ mode: 'CC', currentSetpoint: 2.0 });
      const wireResistance = 10.0; // 10Ω wire

      // Without limiting: wire drop = 2A * 10Ω = 20V > 5V PSU
      // A CC load demands constant current regardless of voltage
      // The solver delivers the requested current, but load voltage clamps to 0
      const result = solveCircuit({ psu, load, wireResistance });

      // Load voltage clamped to 0 (can't go negative)
      expect(result.loadVoltage).toBe(0);
      // CC mode still delivers demanded current
      expect(result.current).toBe(2.0);
      // Solver warns about the problematic condition
      expect(result.warning).toBeDefined();
    });
  });

  describe('Load in CR mode (constant resistance)', () => {
    it('calculates current using Ohms law iteratively', () => {
      const psu = makePsuState({ voltageSetpoint: 12.0, currentLimit: 5.0 });
      const load = makeLoadState({
        mode: 'CR',
        resistanceSetpoint: 10, // 10Ω load
      });
      const wireResistance = 0.1;

      // Total resistance = 10Ω + 0.1Ω = 10.1Ω
      // Expected current = 12V / 10.1Ω ≈ 1.188A
      // Wire drop = 1.188 * 0.1 = 0.1188V
      // Load voltage ≈ 11.88V

      const result = solveCircuit({ psu, load, wireResistance });

      expect(result.solved).toBe(true);
      expect(result.current).toBeCloseTo(12 / 10.1, 3);
      expect(result.loadVoltage).toBeCloseTo(12 - (12 / 10.1) * 0.1, 3);
    });

    it('handles CR mode with current limiting', () => {
      const psu = makePsuState({ voltageSetpoint: 12.0, currentLimit: 0.5 });
      const load = makeLoadState({
        mode: 'CR',
        resistanceSetpoint: 1.0, // 1Ω would draw 12A without limit
      });
      const wireResistance = 0.1;

      const result = solveCircuit({ psu, load, wireResistance });

      expect(result.psuMode).toBe('CC');
      expect(result.current).toBe(0.5); // Limited
    });
  });

  describe('Load in CP mode (constant power)', () => {
    it('calculates current for constant power', () => {
      const psu = makePsuState({ voltageSetpoint: 12.0, currentLimit: 5.0 });
      const load = makeLoadState({
        mode: 'CP',
        powerSetpoint: 24, // 24W at 12V = 2A
      });
      const wireResistance = 0.1;

      const result = solveCircuit({ psu, load, wireResistance });

      expect(result.solved).toBe(true);
      // I = P/V, but V depends on I (wire drop), so iterative
      // Approximately: I ≈ 24W / 11.8V ≈ 2.03A
      expect(result.current).toBeCloseTo(2.0, 1);
    });

    it('handles CP mode with current limiting', () => {
      const psu = makePsuState({ voltageSetpoint: 12.0, currentLimit: 1.0 });
      const load = makeLoadState({
        mode: 'CP',
        powerSetpoint: 60, // Would need 5A at 12V
      });
      const wireResistance = 0.1;

      const result = solveCircuit({ psu, load, wireResistance });

      expect(result.psuMode).toBe('CC');
      expect(result.current).toBe(1.0); // Limited
    });
  });

  describe('Load in CV mode (voltage clamp)', () => {
    it('returns current limited by PSU when clamping', () => {
      const psu = makePsuState({ voltageSetpoint: 12.0, currentLimit: 3.0 });
      const load = makeLoadState({
        mode: 'CV',
        voltageSetpoint: 5.0, // Clamp to 5V
      });
      const wireResistance = 0.1;

      const result = solveCircuit({ psu, load, wireResistance });

      // CV load demands infinite current when supply > setpoint
      // But PSU limits to 3A
      expect(result.psuMode).toBe('CC');
      expect(result.current).toBe(3.0);
    });

    it('returns zero current when supply voltage below CV setpoint', () => {
      const psu = makePsuState({ voltageSetpoint: 3.0, currentLimit: 5.0 });
      const load = makeLoadState({
        mode: 'CV',
        voltageSetpoint: 10.0, // Want to clamp to 10V but only 3V available
      });
      const wireResistance = 0.1;

      const result = solveCircuit({ psu, load, wireResistance });

      expect(result.current).toBe(0);
      expect(result.loadVoltage).toBe(3.0);
    });
  });

  describe('edge cases', () => {
    it('reports CC mode when demand exceeds limit beyond tolerance', () => {
      const psu = makePsuState({ voltageSetpoint: 12.0, currentLimit: 2.0 });
      // Demand is 2.0 + 1e-7, which exceeds limit + tolerance (1e-9)
      const load = makeLoadState({ mode: 'CC', currentSetpoint: 2.0000001 });
      const wireResistance = 0.1;

      const result = solveCircuit({ psu, load, wireResistance });

      // Demand clearly exceeds limit, so CC mode
      expect(result.psuMode).toBe('CC');
      expect(result.current).toBeCloseTo(2.0, 6);
    });

    it('reports CV mode when demand is within tolerance of limit', () => {
      const psu = makePsuState({ voltageSetpoint: 12.0, currentLimit: 2.0 });
      // Demand exactly at limit - within tolerance, not "exceeding"
      const load = makeLoadState({ mode: 'CC', currentSetpoint: 2.0 });
      const wireResistance = 0.1;

      const result = solveCircuit({ psu, load, wireResistance });

      // Demand equals limit (not exceeding), so CV mode
      expect(result.psuMode).toBe('CV');
      expect(result.current).toBe(2.0);
    });

    it('handles zero Load current demand', () => {
      const psu = makePsuState({ voltageSetpoint: 12.0, currentLimit: 5.0 });
      const load = makeLoadState({ mode: 'CC', currentSetpoint: 0 });
      const wireResistance = 0.1;

      const result = solveCircuit({ psu, load, wireResistance });

      expect(result.current).toBe(0);
      expect(result.wireDrop).toBe(0);
      expect(result.loadVoltage).toBe(12.0);
    });

    it('handles very small current values', () => {
      const psu = makePsuState({ voltageSetpoint: 5.0, currentLimit: 1.0 });
      const load = makeLoadState({ mode: 'CC', currentSetpoint: 0.001 }); // 1mA
      const wireResistance = 0.1;

      const result = solveCircuit({ psu, load, wireResistance });

      expect(result.current).toBeCloseTo(0.001, 6);
      expect(result.wireDrop).toBeCloseTo(0.0001, 6);
    });
  });
});
