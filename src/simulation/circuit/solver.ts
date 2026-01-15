/**
 * Generic circuit equilibrium solver.
 *
 * Devices describe their electrical characteristics (source or load behavior),
 * and the solver computes equilibrium for any combination of devices.
 *
 * @packageDocumentation
 */

import type { BusState } from '../types.js';

/**
 * Device electrical behavior type.
 *
 * - 'voltage-source': Maintains voltage, can limit current (e.g., PSU)
 * - 'current-sink': Draws fixed current, voltage determined by source (e.g., CC load)
 * - 'resistance': Fixed resistance, I = V/R (e.g., CR load, resistor)
 * - 'power-sink': Draws fixed power, I = P/V (e.g., CP load)
 * - 'open': No current flow (e.g., disconnected, CV load passthrough)
 */
export type DeviceBehavior =
  | { type: 'voltage-source'; voltage: number; currentLimit: number }
  | { type: 'current-sink'; current: number; minResistance?: number }
  | { type: 'resistance'; resistance: number }
  | { type: 'power-sink'; power: number }
  | { type: 'open' };

/**
 * Device that can participate in circuit simulation.
 */
export interface CircuitDevice {
  /** Whether the device is active/enabled */
  enabled: boolean;
  /** The device's electrical behavior when enabled */
  behavior: DeviceBehavior;
}

/**
 * Default minimum resistance for current sinks (when voltage collapses)
 */
const DEFAULT_MIN_RESISTANCE = 0.001;

/**
 * Solve for circuit equilibrium given a source and load device.
 *
 * The solver finds the operating point where source and load V-I
 * characteristics intersect.
 *
 * @param source - The source device (typically voltage-source behavior)
 * @param load - The load device (current-sink, resistance, power-sink, or open)
 * @returns Equilibrium bus state
 */
export function solveCircuit(source: CircuitDevice, load: CircuitDevice): BusState {
  // Source off → no power
  if (!source.enabled) {
    return { voltage: 0, current: 0 };
  }

  // Load off → source voltage, no current
  if (!load.enabled) {
    const sourceV = getSourceVoltage(source.behavior);
    return { voltage: sourceV, current: 0 };
  }

  // Both enabled - find equilibrium based on behaviors
  return findEquilibrium(source.behavior, load.behavior);
}

/**
 * Get the open-circuit voltage of a source behavior.
 */
function getSourceVoltage(behavior: DeviceBehavior): number {
  if (behavior.type === 'voltage-source') {
    return behavior.voltage;
  }
  return 0;
}

/**
 * Get the current limit of a source behavior.
 */
function getSourceCurrentLimit(behavior: DeviceBehavior): number {
  if (behavior.type === 'voltage-source') {
    return behavior.currentLimit;
  }
  return Infinity;
}

/**
 * Find equilibrium between source and load behaviors.
 */
function findEquilibrium(source: DeviceBehavior, load: DeviceBehavior): BusState {
  const sourceVoltage = getSourceVoltage(source);
  const sourceCurrentLimit = getSourceCurrentLimit(source);

  // Handle each load type
  switch (load.type) {
    case 'open':
      return { voltage: sourceVoltage, current: 0 };

    case 'resistance':
      return solveResistiveLoad(sourceVoltage, sourceCurrentLimit, load.resistance);

    case 'current-sink':
      return solveCurrentSinkLoad(
        sourceVoltage,
        sourceCurrentLimit,
        load.current,
        load.minResistance ?? DEFAULT_MIN_RESISTANCE
      );

    case 'power-sink':
      return solvePowerSinkLoad(sourceVoltage, sourceCurrentLimit, load.power);

    case 'voltage-source':
      // Two voltage sources - not a typical case, return source values
      return { voltage: sourceVoltage, current: 0 };

    default:
      return { voltage: sourceVoltage, current: 0 };
  }
}

/**
 * Solve for resistive load: I = V/R
 *
 * If current exceeds source limit, voltage sags: V = I_limit × R
 */
function solveResistiveLoad(
  sourceVoltage: number,
  sourceCurrentLimit: number,
  resistance: number
): BusState {
  if (resistance <= 0) {
    return { voltage: 0, current: 0 };
  }

  const currentAtSourceVoltage = sourceVoltage / resistance;

  if (currentAtSourceVoltage <= sourceCurrentLimit) {
    // Within limit - CV mode
    return { voltage: sourceVoltage, current: currentAtSourceVoltage };
  }

  // Current limited - voltage sags per Ohm's law
  const voltage = sourceCurrentLimit * resistance;
  return { voltage, current: sourceCurrentLimit };
}

/**
 * Solve for current sink load (constant current).
 *
 * If demand exceeds source limit, voltage collapses (load at min resistance).
 */
function solveCurrentSinkLoad(
  sourceVoltage: number,
  sourceCurrentLimit: number,
  demandedCurrent: number,
  minResistance: number
): BusState {
  if (demandedCurrent <= sourceCurrentLimit) {
    // Within limit - source maintains voltage
    return { voltage: sourceVoltage, current: demandedCurrent };
  }

  // Current limited - load goes to min resistance, voltage collapses
  const voltage = sourceCurrentLimit * minResistance;
  return { voltage, current: sourceCurrentLimit };
}

/**
 * Solve for power sink load (constant power): I = P/V
 *
 * If current exceeds source limit, power is reduced.
 */
function solvePowerSinkLoad(
  sourceVoltage: number,
  sourceCurrentLimit: number,
  demandedPower: number
): BusState {
  if (demandedPower <= 0 || sourceVoltage <= 0) {
    return { voltage: sourceVoltage, current: 0 };
  }

  const currentAtSourceVoltage = demandedPower / sourceVoltage;

  if (currentAtSourceVoltage <= sourceCurrentLimit) {
    // Within limit - source maintains voltage
    return { voltage: sourceVoltage, current: currentAtSourceVoltage };
  }

  // Current limited - power reduced, voltage maintained
  return { voltage: sourceVoltage, current: sourceCurrentLimit };
}
