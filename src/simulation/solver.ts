/**
 * Circuit solver for PSU-Wire-Load simulation.
 *
 * Resolves a simple circuit to determine actual current flow,
 * voltage at load, and PSU operating mode.
 *
 * @packageDocumentation
 */

import type { PsuState, LoadState, PsuMode, CircuitSolution } from './circuit-types.js';
import { calculateLoadCurrentDemand } from './devices/load-physics.js';

/**
 * Parameters for circuit solver
 */
export interface CircuitParameters {
  /** PSU state (setpoints and enabled status) */
  psu: PsuState;
  /** Load state (mode, setpoints, enabled status) */
  load: LoadState;
  /** Wire resistance in ohms */
  wireResistance: number;
}

/**
 * Maximum number of iterations for convergence
 */
const MAX_ITERATIONS = 100;

/**
 * Convergence tolerance for current (amps)
 */
const CURRENT_TOLERANCE = 1e-9;

/**
 * Tolerance for mode comparison (to handle floating point)
 */
const MODE_TOLERANCE = 1e-9;

/**
 * Solve the circuit to determine actual operating point.
 *
 * The solver handles:
 * - CC mode: Load demands fixed current
 * - CR mode: Load current = V/R (iterative)
 * - CP mode: Load current = P/V (iterative)
 * - CV mode: Load demands infinite current (limited by PSU)
 *
 * @param params - Circuit parameters (PSU, Load, wire resistance)
 * @returns Circuit solution with actual values
 */
export function solveCircuit(params: CircuitParameters): CircuitSolution {
  const { psu, load, wireResistance } = params;

  // Handle PSU off case
  if (!psu.outputEnabled || psu.mode === 'OFF') {
    return {
      solved: true,
      psuMode: 'OFF',
      current: 0,
      psuVoltage: 0,
      loadVoltage: 0,
      wireDrop: 0,
    };
  }

  // Handle Load off case
  if (!load.inputEnabled || load.mode === 'OFF') {
    return {
      solved: true,
      psuMode: 'CV',
      current: 0,
      psuVoltage: psu.voltageSetpoint,
      loadVoltage: psu.voltageSetpoint,
      wireDrop: 0,
    };
  }

  const psuVoltage = psu.voltageSetpoint;
  const psuCurrentLimit = psu.currentLimit;

  // For CC mode, direct calculation (no iteration needed)
  if (load.mode === 'CC') {
    return solveWithFixedCurrentDemand(
      psuVoltage,
      psuCurrentLimit,
      load.currentSetpoint,
      wireResistance
    );
  }

  // For CV mode with infinite demand, PSU current-limits immediately
  if (load.mode === 'CV') {
    if (psuVoltage > load.voltageSetpoint) {
      // Load wants to clamp below PSU voltage, demands infinite current
      const current = psuCurrentLimit;
      const wireDrop = current * wireResistance;
      const loadVoltage = Math.max(0, psuVoltage - wireDrop);
      return {
        solved: true,
        psuMode: 'CC',
        current,
        psuVoltage,
        loadVoltage,
        wireDrop,
      };
    } else {
      // Can't clamp to higher voltage, no current
      return {
        solved: true,
        psuMode: 'CV',
        current: 0,
        psuVoltage,
        loadVoltage: psuVoltage,
        wireDrop: 0,
      };
    }
  }

  // For CR and CP modes, iterative solution needed
  return solveIteratively(psuVoltage, psuCurrentLimit, load, wireResistance);
}

/**
 * Solve circuit with fixed current demand (CC mode).
 */
function solveWithFixedCurrentDemand(
  psuVoltage: number,
  psuCurrentLimit: number,
  currentDemand: number,
  wireResistance: number
): CircuitSolution {
  // Actual current is minimum of demand and limit
  const actualCurrent = Math.min(currentDemand, psuCurrentLimit);
  const wireDrop = actualCurrent * wireResistance;
  const loadVoltage = Math.max(0, psuVoltage - wireDrop);

  // Check if wire drop would exceed PSU voltage
  const theoreticalDrop = currentDemand * wireResistance;
  let warning: string | undefined;
  if (theoreticalDrop >= psuVoltage && currentDemand > 0) {
    warning = `Wire drop (${theoreticalDrop.toFixed(3)}V) exceeds PSU voltage (${psuVoltage}V)`;
  }

  // Determine PSU mode - CC if limiting, CV otherwise
  const isLimiting = currentDemand > psuCurrentLimit + MODE_TOLERANCE;
  const psuMode: PsuMode = isLimiting ? 'CC' : 'CV';

  // Special case: zero current limit means always limiting
  if (psuCurrentLimit === 0 && currentDemand > 0) {
    return {
      solved: true,
      psuMode: 'CC',
      current: 0,
      psuVoltage,
      loadVoltage: psuVoltage,
      wireDrop: 0,
      warning,
    };
  }

  return {
    solved: true,
    psuMode,
    current: actualCurrent,
    psuVoltage,
    loadVoltage,
    wireDrop,
    warning,
  };
}

/**
 * Solve circuit iteratively for CR and CP modes.
 *
 * These modes have current that depends on voltage, creating a system
 * that requires iteration to solve.
 */
function solveIteratively(
  psuVoltage: number,
  psuCurrentLimit: number,
  load: LoadState,
  wireResistance: number
): CircuitSolution {
  // Initial guess: assume load voltage = PSU voltage
  let loadVoltage = psuVoltage;
  let current = 0;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    // Calculate current demand at current load voltage
    let currentDemand = calculateLoadCurrentDemand(load, loadVoltage);

    // Limit to PSU current limit
    if (currentDemand === Infinity) {
      currentDemand = psuCurrentLimit;
    }
    const actualCurrent = Math.min(currentDemand, psuCurrentLimit);

    // Calculate new load voltage based on current
    const wireDrop = actualCurrent * wireResistance;
    const newLoadVoltage = Math.max(0, psuVoltage - wireDrop);

    // Check for convergence
    if (Math.abs(actualCurrent - current) < CURRENT_TOLERANCE) {
      const isLimiting = currentDemand > psuCurrentLimit + MODE_TOLERANCE;
      const psuMode: PsuMode = isLimiting ? 'CC' : 'CV';

      return {
        solved: true,
        psuMode,
        current: actualCurrent,
        psuVoltage,
        loadVoltage: newLoadVoltage,
        wireDrop,
      };
    }

    // Update for next iteration
    current = actualCurrent;
    loadVoltage = newLoadVoltage;
  }

  // Did not converge - return best estimate with warning
  const wireDrop = current * wireResistance;
  return {
    solved: false,
    psuMode: current >= psuCurrentLimit - MODE_TOLERANCE ? 'CC' : 'CV',
    current,
    psuVoltage,
    loadVoltage: Math.max(0, psuVoltage - wireDrop),
    wireDrop,
    warning: 'Circuit solver did not converge',
  };
}
