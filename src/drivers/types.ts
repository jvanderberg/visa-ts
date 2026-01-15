/**
 * Driver type definitions for the driver abstraction layer.
 *
 * @packageDocumentation
 */

import type { Result } from '../result.js';
import type { MessageBasedResource } from '../resources/message-based-resource.js';

// ─────────────────────────────────────────────────────────────────
// Type Helpers for Extracting Properties and Commands from Interfaces
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
 * Typed property map that requires all properties from interface T.
 * Each property extracted from getter methods must be defined.
 */
type TypedPropertyMap<T> = {
  [K in keyof ExtractProperties<T>]: PropertyDef<ExtractProperties<T>[K]>;
};

/**
 * Check if a method is a command (not a getter/setter, returns Promise<Result<void, Error>>, no params).
 */
type IsCommand<K, M> = K extends `get${string}` | `set${string}`
  ? never
  : M extends () => Promise<Result<void, Error>>
    ? K
    : never;

/**
 * Extract command names from an interface.
 * Commands are methods that return Promise<Result<void, Error>> with no parameters,
 * excluding getters and setters.
 */
type ExtractCommandNames<T> = {
  [K in keyof T as IsCommand<K & string, T[K]>]: true;
};

/**
 * Typed command map that requires all commands from interface T.
 */
type TypedCommandMap<T> = {
  [K in keyof ExtractCommandNames<T>]: CommandDef;
};

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

// ─────────────────────────────────────────────────────────────────
// Channel Specification
// ─────────────────────────────────────────────────────────────────

/**
 * Base channel specification fields.
 */
interface ChannelSpecBase<TChannel> {
  /** Number of channels this instrument has */
  count: number;

  /** Starting index for channel numbering (default: 1) */
  indexStart?: number;

  /** Properties available on each channel - must match TChannel interface */
  properties: TypedPropertyMap<TChannel>;
}

/**
 * Conditional commands for channel - required if interface has commands.
 */
type ChannelCommands<TChannel> = [keyof ExtractCommandNames<TChannel>] extends [never]
  ? { commands?: never }
  : { commands: TypedCommandMap<TChannel> };

/**
 * Channel specification for multi-channel instruments.
 * TypeScript enforces all properties and commands from TChannel interface are defined.
 *
 * @typeParam TChannel - The channel interface type
 */
export type ChannelSpec<TChannel> = ChannelSpecBase<TChannel> & ChannelCommands<TChannel>;

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
 * Base driver specification fields.
 */
interface DriverSpecBase<T, TChannel> {
  /** Equipment category (e.g., 'oscilloscope', 'power-supply') */
  type?: string;

  /** Manufacturer name */
  manufacturer?: string;

  /** Supported model numbers */
  models?: string[];

  /** Global properties - must define all properties from T */
  properties: TypedPropertyMap<T>;

  /** Channel configuration - must define all properties from TChannel */
  channels?: [TChannel] extends [never] ? never : ChannelSpec<TChannel>;

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
 * Conditional commands for driver - required if interface has commands.
 */
type DriverCommands<T> = [keyof ExtractCommandNames<T>] extends [never]
  ? { commands?: never }
  : { commands: TypedCommandMap<T> };

/**
 * Full driver specification with compile-time property and command enforcement.
 * TypeScript enforces all properties and commands from T (and TChannel) are defined.
 *
 * @typeParam T - The instrument interface type
 * @typeParam TChannel - The channel interface type (optional)
 *
 * @example
 * ```typescript
 * interface MyScope {
 *   getTimebase(): Promise<Result<number, Error>>;
 *   setTimebase(v: number): Promise<Result<void, Error>>;
 *   autoScale(): Promise<Result<void, Error>>;
 * }
 *
 * interface MyScopeChannel {
 *   getScale(): Promise<Result<number, Error>>;
 *   setScale(v: number): Promise<Result<void, Error>>;
 * }
 *
 * // TypeScript enforces 'timebase' property and 'autoScale' command are defined
 * const spec: DriverSpec<MyScope, MyScopeChannel> = {
 *   properties: {
 *     timebase: { get: ':TIM:SCAL?', set: ':TIM:SCAL {value}' },
 *   },
 *   commands: {
 *     autoScale: { command: ':AUT' },
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
export type DriverSpec<T, TChannel = never> = DriverSpecBase<T, TChannel> & DriverCommands<T>;

/**
 * A connected driver instance that can be used to control an instrument.
 *
 * @typeParam T - The instrument interface type
 */
export interface Driver<T> {
  /** Connect to an instrument and return a typed driver instance */
  connect(resource: MessageBasedResource): Promise<Result<T, Error>>;
}
