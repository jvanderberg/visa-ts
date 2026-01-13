/**
 * Simulation backend types for visa-ts
 *
 * Provides TypeScript-native device simulation without hardware,
 * inspired by PyVISA-sim but using typed interfaces.
 *
 * @packageDocumentation
 */

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
  /** Query pattern - string for exact match, RegExp for pattern match */
  q: string | RegExp;
  /**
   * Response to return:
   * - string: literal response
   * - function: dynamic response generation (receives RegExp match array)
   * - null: no response (for commands like *RST)
   */
  r: string | ((match: RegExpMatchArray) => string) | null;
}

/**
 * A stateful property definition.
 *
 * Properties allow simulated devices to maintain state between commands.
 *
 * @template T - Type of the property value
 */
export interface Property<T = number | string | boolean> {
  /** Initial/default value of the property */
  default: T;

  /**
   * Getter configuration - how to query this property
   */
  getter?: {
    /** Query pattern that retrieves this property */
    q: string | RegExp;
    /** Format function to convert value to response string */
    r: (value: T) => string;
  };

  /**
   * Setter configuration - how to set this property
   */
  setter?: {
    /** Command pattern that sets this property */
    q: string | RegExp;
    /** Parse function to extract value from command match */
    parse: (match: RegExpMatchArray) => T;
  };

  /**
   * Optional validation function.
   * Return false to reject invalid values (command will return error).
   */
  validate?: (value: T) => boolean;
}

/**
 * A complete simulated device definition.
 *
 * Defines the identity, dialogues, and stateful properties of a simulated instrument.
 */
export interface SimulatedDevice {
  /** Device identification */
  device: DeviceInfo;

  /** End-of-message configuration (optional) */
  eom?: EndOfMessage;

  /** Static command-response dialogues */
  dialogues?: Dialogue[];

  /** Stateful device properties */
  properties?: Record<string, Property>;
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
