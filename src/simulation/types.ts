/**
 * Simulation backend types for visa-ts
 *
 * Provides TypeScript-native device simulation without hardware,
 * inspired by PyVISA-sim but using typed interfaces.
 *
 * @packageDocumentation
 */

import type { DeviceBehavior } from './circuit/solver.js';

/**
 * Device property value types
 */
export type PropertyValue = number | string | boolean;

/**
 * Device state - runtime values of all device properties
 */
export type DeviceState = Record<string, PropertyValue>;

/**
 * Electrical state on a circuit bus.
 *
 * Represents the voltage and current at a single electrical node.
 * Used for physics simulation where devices interact.
 */
export interface BusState {
  /** Voltage in volts */
  voltage: number;
  /** Current in amps */
  current: number;
  /** True when PSU is actively current-limiting (in CC mode) */
  currentLimited?: boolean;
}

/**
 * Device identification information
 */
export interface DeviceInfo {
  /** Manufacturer name (e.g., 'RIGOL TECHNOLOGIES') */
  manufacturer: string;
  /** Model number (e.g., 'DS1054Z') */
  model: string;
  /** Serial number (e.g., 'DS1ZA000000001') */
  serial: string;
}

/**
 * End-of-message configuration for simulated devices
 */
export interface EndOfMessage {
  /** Character(s) appended to query commands (default: '\n') */
  query?: string;
  /** Character(s) appended to responses (default: '\n') */
  response?: string;
}

/**
 * A command-response dialogue entry.
 *
 * Dialogues define simple command-response pairs without state.
 */
export interface Dialogue {
  /** Command pattern - string for exact match, RegExp for pattern match */
  pattern: string | RegExp;
  /**
   * Response to return:
   * - string: literal response
   * - function: dynamic response generation (receives RegExp match array)
   * - null: no response (for commands like *RST)
   */
  response: string | ((match: RegExpMatchArray) => string) | null;
}

/**
 * A device property with get/set accessors.
 */
export interface Property {
  get(): PropertyValue;
  set?(value: PropertyValue): void;
  getter?: {
    pattern: string | RegExp;
    format: (value: PropertyValue) => string;
  };
  setter?: {
    pattern: string | RegExp;
    parse: (match: RegExpMatchArray) => PropertyValue;
  };
  validate?(value: PropertyValue): boolean;
}

/**
 * A simulated device instance.
 */
export interface SimulatedDevice {
  device: DeviceInfo;
  eom?: EndOfMessage;
  dialogues?: Dialogue[];
  properties?: Record<string, Property>;
  /** Get electrical behavior based on internal state */
  getBehavior?(): { enabled: boolean; behavior: DeviceBehavior };
  /** Update measured values from circuit simulation */
  setMeasured?(voltage: number, current: number): void;
}

/**
 * Configuration options for simulation transport
 */
export interface SimulationTransportConfig {
  /** The simulated device definition */
  device: SimulatedDevice;

  /** Simulated latency in milliseconds (default: 0) */
  latencyMs?: number;

  /** I/O timeout in milliseconds (default: 2000) */
  timeout?: number;

  /** Read termination character (default: '\n') */
  readTermination?: string;

  /** Write termination character (default: '\n') */
  writeTermination?: string;

  /** Partner device for circuit simulation (e.g., load for PSU) */
  partner?: SimulatedDevice;
}

/**
 * Configuration for a simulated resource manager
 */
export interface SimulatedResourceManagerConfig {
  /** Map of resource strings to device definitions */
  devices: Record<string, SimulatedDevice>;
}

/**
 * Result of command handling
 */
export interface CommandResult {
  /** Whether a matching command was found */
  matched: boolean;
  /** Response to return (null for write-only commands) */
  response: string | null;
  /** Error message if command was invalid */
  error?: string;
}
