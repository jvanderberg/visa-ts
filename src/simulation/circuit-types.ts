/**
 * Circuit simulation types for visa-ts
 *
 * Provides types for modeling electrical circuits with coupled device behavior.
 * Enables realistic simulation where PSU output current reflects Load demand,
 * and wire resistance affects actual voltage at the load.
 *
 * @packageDocumentation
 */

import type { SimulationTransport } from '../transports/simulation.js';

/**
 * Operating mode of a power supply in a circuit
 *
 * - CV: Constant Voltage - output at voltage setpoint, current variable
 * - CC: Current limiting - output current at limit, voltage drops
 * - OFF: Output disabled
 */
export type PsuMode = 'CV' | 'CC' | 'OFF';

/**
 * Operating mode of an electronic load in a circuit
 *
 * - CC: Constant Current - draws fixed current
 * - CV: Constant Voltage - clamps voltage (like a zener)
 * - CR: Constant Resistance - I = V/R (Ohm's law)
 * - CP: Constant Power - I = P/V
 * - OFF: Input disabled
 */
export type LoadMode = 'CC' | 'CV' | 'CR' | 'CP' | 'OFF';

/**
 * State of a PSU in the circuit simulation
 */
export interface PsuState {
  /** Current operating mode */
  mode: PsuMode;
  /** Voltage setpoint (V) */
  voltageSetpoint: number;
  /** Current limit setpoint (A) */
  currentLimit: number;
  /** Actual output voltage (V) - may differ from setpoint in CC mode */
  outputVoltage: number;
  /** Actual output current (A) - determined by load */
  outputCurrent: number;
  /** Output enabled flag */
  outputEnabled: boolean;
}

/**
 * State of a Load in the circuit simulation
 */
export interface LoadState {
  /** Current operating mode */
  mode: LoadMode;
  /** Current setpoint for CC mode (A) */
  currentSetpoint: number;
  /** Voltage setpoint for CV mode (V) */
  voltageSetpoint: number;
  /** Resistance setpoint for CR mode (Ω) */
  resistanceSetpoint: number;
  /** Power setpoint for CP mode (W) */
  powerSetpoint: number;
  /** Actual input voltage (V) - from supply minus wire drop */
  inputVoltage: number;
  /** Actual input current (A) - what's being drawn */
  inputCurrent: number;
  /** Input enabled flag */
  inputEnabled: boolean;
}

/**
 * A node in the circuit representing a connection point
 */
export interface CircuitNode {
  /** Node identifier */
  id: string;
  /** Voltage at this node (V) */
  voltage: number;
  /** Net current into this node (A) - positive = into node */
  current: number;
}

/**
 * A connection (wire) between two nodes
 */
export interface Connection {
  /** Source node ID */
  fromNode: string;
  /** Destination node ID */
  toNode: string;
  /** Wire resistance (Ω) - default: 0.01 */
  resistance: number;
}

/**
 * Configuration for adding a device to a circuit
 */
export interface CircuitDeviceConfig {
  /** Device identifier (must be unique within circuit) */
  id: string;
  /** Device type */
  type: 'psu' | 'load';
}

/**
 * A device connected to a circuit
 */
export interface CircuitDevice {
  /** Device identifier */
  id: string;
  /** Device type */
  type: 'psu' | 'load';
  /** Transport for SCPI communication */
  transport: SimulationTransport;
  /** Output node (for PSU) or input node (for Load) */
  port: CircuitNode;
}

/**
 * Options for creating a circuit connection
 */
export interface ConnectOptions {
  /** Wire resistance in ohms (default: 0.01) */
  resistance?: number;
}

/**
 * Result of circuit resolution
 */
export interface CircuitSolution {
  /** Whether the circuit was successfully resolved */
  solved: boolean;
  /** PSU operating mode after resolution */
  psuMode: PsuMode;
  /** Actual current flowing in the circuit (A) */
  current: number;
  /** Voltage at PSU output (V) */
  psuVoltage: number;
  /** Voltage at Load input (V) - after wire drop */
  loadVoltage: number;
  /** Voltage drop across wire (V) */
  wireDrop: number;
  /** Warning message if any */
  warning?: string;
}
