/**
 * Driver type definitions for the driver abstraction layer.
 *
 * @packageDocumentation
 */

import type { Result } from '../result.js';
import type { MessageBasedResource } from '../resources/message-based-resource.js';

// ─────────────────────────────────────────────────────────────────
// Type Helpers for Extracting Properties from Interfaces
// ─────────────────────────────────────────────────────────────────

/**
 * Extract property name from getter method name.
 * e.g., 'getVoltage' -> 'voltage'
 */
type ExtractPropertyName<K> = K extends `get${infer Name}` ? Uncapitalize<Name> : never;

/**
 * Extract the return type from a getter method.
 * e.g., getVoltage(): Promise<Result<number, Error>> -> number
 */
type ExtractPropertyType<T, K extends keyof T> = T[K] extends () => Promise<Result<infer R, Error>>
  ? R
  : never;

/**
 * Extract all properties from an interface based on getter methods.
 * Maps getX() methods to property name 'x' with its return type.
 */
type ExtractProperties<T> = {
  [K in keyof T as ExtractPropertyName<K & string>]: ExtractPropertyType<T, K>;
};

/**
 * Check if interface has a setter for a property.
 * e.g., HasSetter<MyInterface, 'voltage'> checks for setVoltage method.
 * @internal Reserved for future use
 */
export type HasSetter<T, PropName extends string> = `set${Capitalize<PropName>}` extends keyof T
  ? true
  : false;

// ─────────────────────────────────────────────────────────────────
// Property Definitions
// ─────────────────────────────────────────────────────────────────

/**
 * A supported property with SCPI commands.
 */
export interface SupportedPropertyDef<T> {
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
 * Marker for an unsupported property.
 * The getter/setter will return Err('Not supported by this device').
 */
export interface UnsupportedPropertyDef {
  /** Mark this property as not supported */
  notSupported: true;

  /** Optional description of why it's not supported */
  description?: string;
}

/**
 * Definition for a readable/writable property on an instrument.
 * Can be either a supported property with SCPI commands, or marked as unsupported.
 *
 * @typeParam T - The type of the property value
 *
 * @example Supported property:
 * ```typescript
 * const voltageProp: PropertyDef<number> = {
 *   get: ':VOLT?',
 *   set: ':VOLT {value}',
 *   parse: parseFloat,
 * };
 * ```
 *
 * @example Unsupported property:
 * ```typescript
 * const bandwidthLimit: PropertyDef<string> = {
 *   notSupported: true,
 *   description: 'This model does not support bandwidth limiting',
 * };
 * ```
 */
export type PropertyDef<T> = SupportedPropertyDef<T> | UnsupportedPropertyDef;

/**
 * Check if a property definition is supported (has SCPI commands).
 */
export function isSupported<T>(prop: PropertyDef<T>): prop is SupportedPropertyDef<T> {
  return !('notSupported' in prop);
}

/**
 * Map of property names to their definitions (loosely typed for internal use).
 */
export type PropertyMap = Record<string, PropertyDef<unknown>>;

/**
 * Strictly typed property map that requires all properties from interface T.
 * Each property extracted from getter methods must be defined.
 */
export type StrictPropertyMap<T> = {
  [K in keyof ExtractProperties<T>]: PropertyDef<ExtractProperties<T>[K]>;
};

// ─────────────────────────────────────────────────────────────────
// Command Definitions
// ─────────────────────────────────────────────────────────────────

/**
 * A supported command with SCPI string.
 */
export interface SupportedCommandDef {
  /** SCPI command to send (e.g., '*RST', ':RUN') */
  command: string;

  /** Human-readable description */
  description?: string;

  /** Delay in milliseconds after sending command */
  delay?: number;
}

/**
 * Marker for an unsupported command.
 */
export interface UnsupportedCommandDef {
  /** Mark this command as not supported */
  notSupported: true;

  /** Optional description of why it's not supported */
  description?: string;
}

/**
 * Definition for a fire-and-forget command.
 *
 * @example Supported command:
 * ```typescript
 * const resetCmd: CommandDef = {
 *   command: '*RST',
 *   description: 'Reset to factory defaults',
 *   delay: 500,
 * };
 * ```
 *
 * @example Unsupported command:
 * ```typescript
 * const autoScale: CommandDef = {
 *   notSupported: true,
 * };
 * ```
 */
export type CommandDef = SupportedCommandDef | UnsupportedCommandDef;

/**
 * Check if a command definition is supported.
 */
export function isCommandSupported(cmd: CommandDef): cmd is SupportedCommandDef {
  return !('notSupported' in cmd);
}

/**
 * Map of command names to their definitions.
 */
export type CommandMap = Record<string, CommandDef>;

// ─────────────────────────────────────────────────────────────────
// Channel Specification
// ─────────────────────────────────────────────────────────────────

/**
 * Channel specification for multi-channel instruments (loosely typed).
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
 * Strictly typed channel specification.
 * Requires all properties from channel interface TChannel.
 */
export interface StrictChannelSpec<TChannel> {
  /** Number of channels this instrument has */
  count: number;

  /** Starting index for channel numbering (default: 1) */
  indexStart?: number;

  /** Properties available on each channel - must match TChannel interface */
  properties: StrictPropertyMap<TChannel>;

  /** Commands available on each channel */
  commands?: CommandMap;
}

// ─────────────────────────────────────────────────────────────────
// Driver Configuration
// ─────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────
// Driver Specification
// ─────────────────────────────────────────────────────────────────

/**
 * Full driver specification (loosely typed).
 * Use StrictDriverSpec for compile-time property enforcement.
 *
 * @typeParam T - The interface type this driver produces
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
 * Strictly typed driver specification.
 * Enforces at compile-time that all properties from T are defined.
 *
 * @typeParam T - The instrument interface type
 * @typeParam TChannel - The channel interface type (optional)
 *
 * @example
 * ```typescript
 * interface MyScope {
 *   getTimebase(): Promise<Result<number, Error>>;
 *   setTimebase(v: number): Promise<Result<void, Error>>;
 * }
 *
 * interface MyScopeChannel {
 *   getScale(): Promise<Result<number, Error>>;
 *   setScale(v: number): Promise<Result<void, Error>>;
 * }
 *
 * // TypeScript enforces 'timebase' property is defined
 * const spec: StrictDriverSpec<MyScope, MyScopeChannel> = {
 *   properties: {
 *     timebase: { get: ':TIM:SCAL?', set: ':TIM:SCAL {value}' },
 *   },
 *   channels: {
 *     count: 4,
 *     properties: {
 *       scale: { get: ':CHAN{ch}:SCAL?', set: ':CHAN{ch}:SCAL {value}' },
 *     },
 *   },
 * };
 * ```
 */
export interface StrictDriverSpec<T, TChannel = never> {
  /** Equipment category (e.g., 'oscilloscope', 'power-supply') */
  type?: string;

  /** Manufacturer name */
  manufacturer?: string;

  /** Supported model numbers */
  models?: string[];

  /** Global properties - must define all properties from T */
  properties: StrictPropertyMap<T>;

  /** Global commands (not per-channel) */
  commands?: CommandMap;

  /** Channel configuration - must define all properties from TChannel */
  channels?: [TChannel] extends [never] ? never : StrictChannelSpec<TChannel>;

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
