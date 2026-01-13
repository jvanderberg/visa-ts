/**
 * Circuit simulation types for visa-ts.
 *
 * Defines the state and measurement types for realistic multi-instrument
 * circuit simulation.
 *
 * @packageDocumentation
 */

/**
 * A connection point in the circuit with a voltage level.
 */
export interface CircuitNode {
  /** Unique identifier for the node */
  id: string;
  /** Voltage at this node (in volts) */
  voltage: number;
}

/**
 * A wire connection between two nodes.
 */
export interface Connection {
  /** Source node ID */
  from: string;
  /** Destination node ID */
  to: string;
  /** Wire resistance in ohms (default: 0.01 if undefined) */
  resistance?: number;
}

/**
 * PSU operating mode.
 */
export type PsuMode = 'CV' | 'CC' | 'OFF' | 'OVP_TRIP' | 'OCP_TRIP';

/**
 * Load operating mode.
 */
export type LoadMode = 'CC' | 'CV' | 'CR' | 'CP';

/**
 * PSU operating state.
 */
export interface PsuState {
  /** Voltage setpoint in volts */
  voltageSetpoint: number;
  /** Current limit in amps */
  currentLimit: number;
  /** Whether output is enabled */
  outputEnabled: boolean;
  /** Over-voltage protection level (optional) */
  ovpLevel?: number;
  /** Over-current protection level (optional) */
  ocpLevel?: number;
}

/**
 * Load operating state.
 *
 * The active setpoint depends on the mode:
 * - CC: uses currentSetpoint
 * - CV: uses voltageSetpoint
 * - CR: uses resistanceSetpoint
 * - CP: uses powerSetpoint
 */
export interface LoadState {
  /** Operating mode */
  mode: LoadMode;
  /** Whether input is enabled */
  inputEnabled: boolean;
  /** Current setpoint for CC mode (amps) */
  currentSetpoint?: number;
  /** Voltage setpoint for CV mode (volts) */
  voltageSetpoint?: number;
  /** Resistance setpoint for CR mode (ohms) */
  resistanceSetpoint?: number;
  /** Power setpoint for CP mode (watts) */
  powerSetpoint?: number;
}

/**
 * Combined circuit state for solver input.
 */
export interface CircuitState {
  /** PSU operating state */
  psu: PsuState;
  /** Load operating state */
  load: LoadState;
  /** Wire resistance in ohms (default: 0.01) */
  wireResistance?: number;
}

/**
 * Circuit solver output - calculated measurements.
 */
export interface CircuitMeasurements {
  /** PSU output voltage (volts) */
  psuVoltage: number;
  /** PSU output current (amps) */
  psuCurrent: number;
  /** PSU operating mode (CV, CC, OFF, etc.) */
  psuMode: PsuMode;
  /** Load input voltage (volts) */
  loadVoltage: number;
  /** Load input current (amps) */
  loadCurrent: number;
}
