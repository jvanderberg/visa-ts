/**
 * Load physics model for circuit simulation.
 *
 * Extracts state from Load transport and calculates current demand based on mode.
 *
 * @packageDocumentation
 */

import type { SimulationTransport } from '../transports/simulation.js';
import type { LoadState, LoadMode } from './circuit-types.js';

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
 * Parse a mode response.
 */
function parseModeResponse(value: string): LoadMode {
  const upper = value.toUpperCase().trim();
  switch (upper) {
    case 'CC':
      return 'CC';
    case 'CV':
      return 'CV';
    case 'CR':
      return 'CR';
    case 'CP':
      return 'CP';
    default:
      return 'OFF';
  }
}

/**
 * Extract current Load state from transport.
 *
 * Reads mode, setpoints, and input state from the device.
 * Mode is determined by device setting when enabled, OFF when disabled.
 *
 * @param transport - SimulationTransport connected to a Load device
 * @returns Current Load state
 */
export async function extractLoadState(transport: SimulationTransport): Promise<LoadState> {
  // Query all relevant values
  const modeResult = await transport.query('MODE?');
  const currResult = await transport.query('CURR?');
  const voltResult = await transport.query('VOLT?');
  const resResult = await transport.query('RES?');
  const powResult = await transport.query('POW?');
  const inpResult = await transport.query('INP?');
  const measVoltResult = await transport.query('MEAS:VOLT?');
  const measCurrResult = await transport.query('MEAS:CURR?');

  // Parse values, defaulting appropriately on error
  const deviceMode = modeResult.ok ? parseModeResponse(modeResult.value) : 'CC';
  const currentSetpoint = currResult.ok ? parseNumericResponse(currResult.value) : 0;
  const voltageSetpoint = voltResult.ok ? parseNumericResponse(voltResult.value) : 0;
  const resistanceSetpoint = resResult.ok ? parseNumericResponse(resResult.value) : 1000;
  const powerSetpoint = powResult.ok ? parseNumericResponse(powResult.value) : 0;
  const inputEnabled = inpResult.ok ? parseBooleanResponse(inpResult.value) : false;
  const inputVoltage = measVoltResult.ok ? parseNumericResponse(measVoltResult.value) : 0;
  const inputCurrent = measCurrResult.ok ? parseNumericResponse(measCurrResult.value) : 0;

  // Mode is OFF when input is disabled, otherwise use device mode
  const mode: LoadMode = inputEnabled ? deviceMode : 'OFF';

  return {
    mode,
    currentSetpoint,
    voltageSetpoint,
    resistanceSetpoint,
    powerSetpoint,
    inputVoltage,
    inputCurrent,
    inputEnabled,
  };
}

/**
 * Calculate the current demand of a Load given supply voltage.
 *
 * The current demand depends on the Load's operating mode:
 * - CC: Fixed current (currentSetpoint)
 * - CV: Infinite when supply > setpoint (clamps voltage)
 * - CR: I = V/R (Ohm's law)
 * - CP: I = P/V (constant power)
 * - OFF: Zero current
 *
 * @param loadState - Current Load state
 * @param supplyVoltage - Voltage available from supply (V)
 * @returns Current demand in amps
 */
export function calculateLoadCurrentDemand(loadState: LoadState, supplyVoltage: number): number {
  // No current from negative or zero voltage in most modes
  const effectiveVoltage = Math.max(0, supplyVoltage);

  // OFF mode: no current draw
  if (loadState.mode === 'OFF' || !loadState.inputEnabled) {
    return 0;
  }

  // Zero voltage means no current can flow (except in pathological cases)
  if (effectiveVoltage === 0) {
    return 0;
  }

  switch (loadState.mode) {
    case 'CC':
      // Constant current: demand the setpoint
      return loadState.currentSetpoint;

    case 'CV':
      // Constant voltage: clamp to voltage setpoint
      // If supply > setpoint, demand infinite current to pull voltage down
      // If supply <= setpoint, can't clamp, demand zero
      if (effectiveVoltage > loadState.voltageSetpoint) {
        return Infinity;
      }
      return 0;

    case 'CR':
      // Constant resistance: I = V/R (Ohm's law)
      if (loadState.resistanceSetpoint === 0) {
        // Short circuit
        return Infinity;
      }
      return effectiveVoltage / loadState.resistanceSetpoint;

    case 'CP':
      // Constant power: I = P/V
      // This is already safe because effectiveVoltage > 0 at this point
      return loadState.powerSetpoint / effectiveVoltage;

    default:
      return 0;
  }
}
