/**
 * PSU physics model for circuit simulation.
 *
 * Extracts state from PSU transport and calculates response to load demand.
 *
 * @packageDocumentation
 */

import type { SimulationTransport } from '../transports/simulation.js';
import type { PsuState, PsuMode } from './circuit-types.js';

/**
 * Parse a numeric response from a query result.
 * Returns 0 if the value is not a valid number.
 */
function parseNumericResponse(value: string): number {
  const num = parseFloat(value);
  return Number.isNaN(num) ? 0 : num;
}

/**
 * Parse a boolean response (ON/OFF/1/0).
 */
function parseBooleanResponse(value: string): boolean {
  const upper = value.toUpperCase().trim();
  return upper === 'ON' || upper === '1' || upper === 'TRUE';
}

/**
 * Extract current PSU state from transport.
 *
 * Reads voltage setpoint, current limit, and output state from the device.
 * Mode is determined based on output state - CV when enabled, OFF when disabled.
 *
 * @param transport - SimulationTransport connected to a PSU device
 * @returns Current PSU state
 */
export async function extractPsuState(transport: SimulationTransport): Promise<PsuState> {
  // Query all relevant values
  const voltResult = await transport.query('VOLT?');
  const currResult = await transport.query('CURR?');
  const outpResult = await transport.query('OUTP?');
  const measVoltResult = await transport.query('MEAS:VOLT?');
  const measCurrResult = await transport.query('MEAS:CURR?');

  // Parse values, defaulting to 0 on error
  const voltageSetpoint = voltResult.ok ? parseNumericResponse(voltResult.value) : 0;
  const currentLimit = currResult.ok ? parseNumericResponse(currResult.value) : 0;
  const outputEnabled = outpResult.ok ? parseBooleanResponse(outpResult.value) : false;
  const outputVoltage = measVoltResult.ok ? parseNumericResponse(measVoltResult.value) : 0;
  const outputCurrent = measCurrResult.ok ? parseNumericResponse(measCurrResult.value) : 0;

  // Determine mode based on output state
  // When output is disabled, mode is OFF
  // When output is enabled, default mode is CV (voltage regulation)
  const mode: PsuMode = outputEnabled ? 'CV' : 'OFF';

  return {
    mode,
    voltageSetpoint,
    currentLimit,
    outputVoltage,
    outputCurrent,
    outputEnabled,
  };
}

/**
 * Resolve PSU state given a load current demand.
 *
 * Calculates the actual output voltage and current based on PSU settings
 * and load demand. Determines whether PSU operates in CV or CC mode.
 *
 * @param psuState - Current PSU state (setpoints and enabled status)
 * @param loadDemandCurrent - Current the load is trying to draw (A)
 * @returns Resolved PSU state with actual voltage/current and mode
 */
export function resolvePsuWithLoad(psuState: PsuState, loadDemandCurrent: number): PsuState {
  // If output is disabled, return OFF state with zero output
  if (!psuState.outputEnabled) {
    return {
      ...psuState,
      mode: 'OFF',
      outputVoltage: 0,
      outputCurrent: 0,
    };
  }

  // Clamp load demand to non-negative
  const actualDemand = Math.max(0, loadDemandCurrent);

  // Determine if we can supply the demanded current
  const canSupplyDemand = actualDemand <= psuState.currentLimit;

  if (canSupplyDemand) {
    // CV mode: voltage maintained at setpoint, current follows demand
    return {
      ...psuState,
      mode: 'CV',
      outputVoltage: psuState.voltageSetpoint,
      outputCurrent: actualDemand,
    };
  } else {
    // CC mode: current limited, voltage drops (to be determined by load)
    return {
      ...psuState,
      mode: 'CC',
      outputVoltage: psuState.voltageSetpoint, // Actual voltage depends on load
      outputCurrent: psuState.currentLimit,
    };
  }
}
