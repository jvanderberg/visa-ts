/**
 * Driver type definitions for the driver abstraction layer.
 *
 * @packageDocumentation
 */

import type { Result } from '../result.js';
import type { MessageBasedResource } from '../resources/message-based-resource.js';

/**
 * Definition for a readable/writable property on an instrument.
 *
 * Properties map to SCPI query/command pairs. The `{value}` placeholder
 * in the set command is replaced with the formatted value. The `{ch}` placeholder
 * is replaced with the channel number for channel-specific properties.
 *
 * @typeParam T - The type of the property value
 *
 * @example
 * ```typescript
 * const voltageProp: PropertyDef<number> = {
 *   get: ':VOLT?',
 *   set: ':VOLT {value}',
 *   parse: parseScpiNumber,
 *   unit: 'V',
 * };
 * ```
 */
export interface PropertyDef<T> {
  /** SCPI query command (e.g., ':TIMebase:SCALe?') */
  get: string;

  /** SCPI set command with {value} placeholder (e.g., ':TIMebase:SCALe {value}') */
  set?: string;

  /** Parse SCPI response string to typed value */
  parse?: (response: string) => T;

  /** Format typed value to SCPI parameter string */
  format?: (value: T) => string;

  /** Validate value before sending. Return true if valid, or error message string */
  validate?: (value: T) => boolean | string;

  /** Mark property as read-only (no setter generated) */
  readonly?: boolean;

  /** Human-readable description */
  description?: string;

  /** Unit of measurement (e.g., 'V', 'A', 'Hz', 's') */
  unit?: string;
}

/**
 * Map of property names to their definitions.
 */
export type PropertyMap = Record<string, PropertyDef<unknown>>;

/**
 * Definition for a fire-and-forget command.
 *
 * Commands are operations that don't return a value, like *RST or RUN.
 *
 * @example
 * ```typescript
 * const resetCmd: CommandDef = {
 *   command: '*RST',
 *   description: 'Reset to factory defaults',
 *   delay: 500,
 * };
 * ```
 */
export interface CommandDef {
  /** SCPI command to send (e.g., '*RST', ':RUN') */
  command: string;

  /** Human-readable description */
  description?: string;

  /** Delay in milliseconds after sending command */
  delay?: number;
}

/**
 * Map of command names to their definitions.
 */
export type CommandMap = Record<string, CommandDef>;

/**
 * Channel specification for multi-channel instruments.
 *
 * Channels use the `{ch}` placeholder in property/command strings.
 *
 * @example
 * ```typescript
 * const channelSpec: ChannelSpec = {
 *   count: 3,
 *   indexStart: 1,  // SCPI typically uses 1-based indexing
 *   properties: {
 *     voltage: {
 *       get: ':SOUR{ch}:VOLT?',
 *       set: ':SOUR{ch}:VOLT {value}',
 *     },
 *   },
 * };
 * ```
 */
export interface ChannelSpec {
  /** Number of channels this instrument has */
  count: number;

  /** Starting index for channel numbering (default: 1) */
  indexStart?: number;

  /** Properties available on each channel */
  properties: PropertyMap;

  /** Commands available on each channel */
  commands?: CommandMap;
}

/**
 * Configuration for handling manufacturer-specific quirks.
 */
export interface QuirkConfig {
  /** Delay in milliseconds after each command (for slow instruments) */
  postCommandDelay?: number;

  /** Delay in milliseconds after each query (for slow instruments) */
  postQueryDelay?: number;

  /** Send *RST when connecting */
  resetOnConnect?: boolean;

  /** Send *CLS when connecting */
  clearOnConnect?: boolean;

  /** Custom termination character for this instrument */
  termination?: string;
}

/**
 * Context provided to driver hooks and custom methods.
 * Provides access to the underlying resource for custom operations.
 */
export interface DriverContext {
  /** The underlying message-based resource */
  readonly resource: MessageBasedResource;

  /** Send a query and get the response */
  query(command: string): Promise<Result<string, Error>>;

  /** Send a command (no response expected) */
  write(command: string): Promise<Result<void, Error>>;

  /** Delay for specified milliseconds */
  delay(ms: number): Promise<void>;
}

/**
 * Hooks for customizing driver behavior.
 */
export interface DriverHooks {
  /** Called after connecting to the instrument */
  onConnect?(ctx: DriverContext): Promise<Result<void, Error>>;

  /** Called before disconnecting from the instrument */
  onDisconnect?(ctx: DriverContext): Promise<Result<void, Error>>;

  /** Transform a command before sending */
  transformCommand?(cmd: string, value: unknown): string;

  /** Transform a response after receiving */
  transformResponse?(cmd: string, response: string): string;
}

/**
 * Map of custom method implementations.
 */
export type MethodMap<T> = {
  [K in keyof T]?: T[K] extends (...args: infer A) => infer R
    ? (ctx: DriverContext, ...args: A) => R
    : never;
};

/**
 * Full driver specification.
 *
 * @typeParam T - The interface type this driver produces
 *
 * @example
 * ```typescript
 * interface MyOscilloscope extends Oscilloscope {
 *   getCustomSetting(): Promise<Result<string, Error>>;
 * }
 *
 * const spec: DriverSpec<MyOscilloscope> = {
 *   type: 'oscilloscope',
 *   manufacturer: 'Rigol',
 *   models: ['DS1054Z'],
 *   properties: {
 *     timebase: {
 *       get: ':TIM:SCAL?',
 *       set: ':TIM:SCAL {value}',
 *     },
 *   },
 *   commands: {
 *     run: { command: ':RUN' },
 *     stop: { command: ':STOP' },
 *   },
 * };
 * ```
 */
export interface DriverSpec<T> {
  /** Equipment category (e.g., 'oscilloscope', 'power-supply') */
  type?: string;

  /** Manufacturer name */
  manufacturer?: string;

  /** Supported model numbers */
  models?: string[];

  /** Global properties (not per-channel) */
  properties: PropertyMap;

  /** Global commands (not per-channel) */
  commands?: CommandMap;

  /** Channel configuration for multi-channel instruments */
  channels?: ChannelSpec;

  /** Lifecycle hooks */
  hooks?: DriverHooks;

  /** Custom method implementations */
  methods?: MethodMap<T>;

  /** Hardware quirks configuration */
  quirks?: QuirkConfig;

  /** Declared capabilities */
  capabilities?: string[];
}

/**
 * A connected driver instance that can be used to control an instrument.
 *
 * @typeParam T - The instrument interface type
 */
export interface Driver<T> {
  /** Connect to an instrument and return a typed driver instance */
  connect(resource: MessageBasedResource): Promise<Result<T, Error>>;
}
