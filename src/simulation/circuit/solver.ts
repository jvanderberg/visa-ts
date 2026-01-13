/**
 * Circuit solver for visa-ts simulation.
 *
 * Resolves circuit state to calculate measurements based on PSU and Load physics.
 *
 * @packageDocumentation
 */

import type { CircuitState, CircuitMeasurements, PsuMode } from './types.js';

/** Default wire resistance in ohms */
const DEFAULT_WIRE_RESISTANCE = 0.01;

/** Minimum voltage for power calculations to avoid division by zero */
const MIN_VOLTAGE_FOR_POWER = 0.001;

/** Convergence threshold for iterative solver */
const CONVERGENCE_THRESHOLD = 0.0001;

/** Maximum current for CV mode with near-zero wire resistance */
const MAX_CURRENT_FOR_CV_LIMIT = 1e6;

/**
 * Solve circuit for CR (constant resistance) mode with wire resistance.
 *
 * For CR mode: I = V_psu / (R_load + R_wire)
 */
function solveCRMode(state: CircuitState, wireResistance: number): number {
  const loadResistance = state.load.resistanceSetpoint ?? 1;
  if (loadResistance <= 0) return 0;

  const totalResistance = loadResistance + wireResistance;
  return state.psu.voltageSetpoint / totalResistance;
}

/**
 * Solve circuit for CP (constant power) mode with wire resistance.
 *
 * Equation: (V_psu - I * R_wire) * I = P
 * Rearranged: R_wire * I² - V_psu * I + P = 0
 * Solution: I = (V_psu - sqrt(V_psu² - 4 * R_wire * P)) / (2 * R_wire)
 */
function solveCPMode(state: CircuitState, wireResistance: number): number {
  const power = state.load.powerSetpoint ?? 0;
  const vPsu = state.psu.voltageSetpoint;

  if (power <= 0 || vPsu < MIN_VOLTAGE_FOR_POWER) {
    return 0;
  }

  if (wireResistance < CONVERGENCE_THRESHOLD) {
    // No wire resistance: I = P / V
    return power / vPsu;
  }

  // Quadratic solution
  const discriminant = vPsu * vPsu - 4 * wireResistance * power;

  if (discriminant < 0) {
    // No real solution - load wants more power than possible
    // Return max current (will be limited by PSU)
    return vPsu / wireResistance;
  }

  // Take the smaller root for stability
  const sqrtDiscriminant = Math.sqrt(discriminant);
  return (vPsu - sqrtDiscriminant) / (2 * wireResistance);
}

/**
 * Solve circuit for CV (constant voltage clamp) mode.
 *
 * The load draws whatever current is needed to clamp voltage at setpoint.
 * Current = (V_psu - V_target) / R_wire
 */
function solveCVLoadMode(state: CircuitState, wireResistance: number): number {
  const targetVoltage = state.load.voltageSetpoint ?? 0;
  const vPsu = state.psu.voltageSetpoint;

  if (targetVoltage >= vPsu) {
    // Can't clamp above PSU voltage
    return 0;
  }

  // Current needed to drop voltage from V_psu to V_target
  // V_drop = I * R_wire
  // V_target = V_psu - I * R_wire
  // I = (V_psu - V_target) / R_wire
  if (wireResistance < CONVERGENCE_THRESHOLD) {
    // No wire resistance means infinite current would be needed
    // This is an edge case - return very high current (will be limited)
    return MAX_CURRENT_FOR_CV_LIMIT;
  }

  return (vPsu - targetVoltage) / wireResistance;
}

/**
 * Solve circuit to find equilibrium.
 *
 * @param state - Current circuit state
 * @returns Calculated measurements
 */
export function solveCircuit(state: CircuitState): CircuitMeasurements {
  const { psu, load } = state;
  const wireResistance = state.wireResistance ?? DEFAULT_WIRE_RESISTANCE;

  // Handle PSU off state
  if (!psu.outputEnabled) {
    return {
      psuVoltage: 0,
      psuCurrent: 0,
      psuMode: 'OFF',
      loadVoltage: 0,
      loadCurrent: 0,
    };
  }

  // Handle zero voltage setpoint
  if (psu.voltageSetpoint <= 0) {
    return {
      psuVoltage: 0,
      psuCurrent: 0,
      psuMode: 'CV',
      loadVoltage: 0,
      loadCurrent: 0,
    };
  }

  // Handle load off state (open circuit)
  if (!load.inputEnabled) {
    return {
      psuVoltage: psu.voltageSetpoint,
      psuCurrent: 0,
      psuMode: 'CV',
      loadVoltage: psu.voltageSetpoint,
      loadCurrent: 0,
    };
  }

  // Calculate load current demand based on mode
  let current: number;

  switch (load.mode) {
    case 'CC':
      current = load.currentSetpoint ?? 0;
      break;

    case 'CR':
      current = solveCRMode(state, wireResistance);
      break;

    case 'CP':
      current = solveCPMode(state, wireResistance);
      break;

    case 'CV':
      current = solveCVLoadMode(state, wireResistance);
      break;

    default:
      current = 0;
  }

  // Apply PSU current limit
  let psuMode: PsuMode = 'CV';
  if (current > psu.currentLimit) {
    current = psu.currentLimit;
    psuMode = 'CC';
  }

  // Ensure current is non-negative
  current = Math.max(0, current);

  // Calculate voltages
  const psuVoltage = psu.voltageSetpoint;
  let loadVoltage = psuVoltage - current * wireResistance;

  // Special handling for CV load mode when PSU is in CC mode
  if (load.mode === 'CV' && psuMode === 'CC') {
    // Load voltage is whatever results from the limited current
    loadVoltage = psuVoltage - current * wireResistance;
  }

  // Special handling for CR mode when PSU is in CC mode
  if (load.mode === 'CR' && psuMode === 'CC') {
    // Voltage across load = I * R_load
    const loadResistance = load.resistanceSetpoint ?? 1;
    loadVoltage = current * loadResistance;
  }

  // Ensure load voltage doesn't go negative
  loadVoltage = Math.max(0, loadVoltage);

  return {
    psuVoltage,
    psuCurrent: current,
    psuMode,
    loadVoltage,
    loadCurrent: current,
  };
}
