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
 * Base instrument property names to exclude from extraction.
 * These are auto-provided by defineDriver.
 */
type BaseInstrumentPropertyNames =
  | 'manufacturer'
  | 'model'
  | 'serialNumber'
  | 'firmwareVersion'
  | 'resourceString'
  | 'error';

/**
 * Base instrument command names to exclude from extraction.
 * These are auto-provided by defineDriver.
 */
type BaseInstrumentCommandNames = 'reset' | 'clear' | 'selfTest' | 'close';

/**
 * Base channel property name to exclude - channelNumber is auto-provided.
 */
type BaseChannelPropertyNames = 'channelNumber';

/**
 * Extract property name from getter method name, excluding base properties.
 * e.g., 'getVoltage' -> 'voltage', 'getError' -> never (excluded)
 */
type ExtractPropertyName<K> = K extends `get${infer Name}`
  ? Uncapitalize<Name> extends BaseInstrumentPropertyNames
    ? never
    : Uncapitalize<Name>
  : never;

/**
 * Extract property name for channels, excluding base channel properties.
 */
type ExtractChannelPropertyName<K> = K extends `get${infer Name}`
  ? Uncapitalize<Name> extends BaseChannelPropertyNames
    ? never
    : Uncapitalize<Name>
  : never;

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
 * Excludes base instrument properties that are auto-provided.
 */
type ExtractProperties<T> = {
  [K in keyof T as ExtractPropertyName<K & string>]: ExtractPropertyType<T, K>;
};

/**
 * Extract channel properties, excluding base channel properties.
 */
type ExtractChannelProperties<T> = {
  [K in keyof T as ExtractChannelPropertyName<K & string>]: ExtractPropertyType<T, K>;
};

/**
 * Typed property map that requires all properties from interface T.
 * Each property extracted from getter methods must be defined.
 */
type TypedPropertyMap<T> = {
  [K in keyof ExtractProperties<T>]: PropertyDef<ExtractProperties<T>[K]>;
};

/**
 * Typed property map for channels.
 */
type TypedChannelPropertyMap<T> = {
  [K in keyof ExtractChannelProperties<T>]: PropertyDef<ExtractChannelProperties<T>[K]>;
};

/**
 * Check if a method is a command (not a getter/setter, returns Promise<Result<void, Error>>, no params).
 * Excludes base instrument commands that are auto-provided.
 */
type IsCommand<K, M> = K extends `get${string}` | `set${string}`
  ? never
  : K extends BaseInstrumentCommandNames
    ? never
    : M extends () => Promise<Result<void, Error>>
      ? K
      : never;

/**
 * Extract command names from an interface.
 * Commands are methods that return Promise<Result<void, Error>> with no parameters,
 * excluding getters, setters, and base instrument commands.
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
  properties: TypedChannelPropertyMap<TChannel>;
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
 * Driver settings for instrument-specific behavior.
 */
export interface DriverSettings {
  /** Delay in milliseconds after each command (for slow instruments) */
  postCommandDelay?: number;

  /** Delay in milliseconds after each query (for slow instruments) */
  postQueryDelay?: number;

  /** Send *RST when connecting */
  resetOnConnect?: boolean;

  /** Delay in milliseconds after reset command */
  resetDelay?: number;

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

  /** Driver settings (timing, etc.) */
  readonly settings: DriverSettings;

  /** Send a query and get the response */
  query(command: string): Promise<Result<string, Error>>;

  /** Send a command (no response expected) */
  write(command: string): Promise<Result<void, Error>>;

  /** Delay for specified milliseconds */
  delay(ms: number): Promise<void>;
}

/**
 * Hooks for customizing driver behavior.
 *
 * Note: For command/response transformations, use middleware instead:
 * - `commandTransformMiddleware()` - transform commands before sending
 * - `responseTransformMiddleware()` - transform responses after receiving
 */
export interface DriverHooks {
  /** Called after connecting to the instrument */
  onConnect?(ctx: DriverContext): Promise<Result<void, Error>>;

  /** Called before disconnecting from the instrument */
  onDisconnect?(ctx: DriverContext): Promise<Result<void, Error>>;
}

/**
 * Base instrument method names to exclude from method extraction.
 * These are auto-provided by defineDriver.
 */
type BaseInstrumentMethodNames = 'close' | 'channel' | 'channelCount';

/**
 * All base instrument members to exclude from method extraction.
 */
type AllBaseMembers =
  | BaseInstrumentPropertyNames
  | BaseInstrumentCommandNames
  | BaseInstrumentMethodNames
  | 'resource'
  | 'features';

/**
 * Check if a member is a function type.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IsFunction<M> = M extends (...args: any[]) => any ? true : false;

/**
 * Check if a method is a "custom method" - not a getter, setter, command, or base member.
 * Custom methods are functions with parameters or non-void return types.
 */
type IsCustomMethod<K, M> =
  IsFunction<M> extends false
    ? never // Exclude non-functions (properties)
    : K extends `get${string}` | `set${string}`
      ? never // Exclude getters/setters
      : K extends AllBaseMembers
        ? never // Exclude all base members
        : M extends () => Promise<Result<void, Error>>
          ? never // Exclude no-arg void commands
          : K; // Include everything else

/**
 * Extract custom method names from an interface.
 * These are methods that need implementations in the `methods` spec.
 */
type ExtractMethodNames<T> = {
  [K in keyof T as IsCustomMethod<K & string, T[K]>]: T[K];
};

/**
 * Required method map - all custom methods from T must be implemented.
 * Each method receives DriverContext as first argument.
 */
export type TypedMethodMap<T> = {
  [K in keyof ExtractMethodNames<T>]: ExtractMethodNames<T>[K] extends (...args: infer A) => infer R
    ? (ctx: DriverContext, ...args: A) => R
    : never;
};

/**
 * Optional method map for backwards compatibility.
 * @deprecated Use TypedMethodMap for type-safe method enforcement.
 */
export type MethodMap<T> = {
  [K in keyof T]?: T[K] extends (...args: infer A) => infer R
    ? (ctx: DriverContext, ...args: A) => R
    : never;
};

// ─────────────────────────────────────────────────────────────────
// Identity Configuration
// ─────────────────────────────────────────────────────────────────

/**
 * Standard *IDN? identity query (default behavior).
 */
export interface StandardIdentity {
  /** Use standard *IDN? query (default) */
  standard: true;
}

/**
 * Custom identity query for devices with non-standard identity commands.
 */
export interface CustomIdentity {
  /** Custom query command to send */
  query: string;

  /** Parse the response into identity fields */
  parse: (response: string) => {
    manufacturer: string;
    model: string;
    serialNumber?: string;
    firmwareVersion?: string;
  };
}

/**
 * Static identity for devices that don't support identity queries (e.g., no *IDN?).
 */
export interface StaticIdentity {
  /** Skip identity query, use these static values */
  static: true;

  /** Manufacturer name */
  manufacturer: string;

  /** Model number */
  model: string;

  /** Serial number (optional) */
  serialNumber?: string;

  /** Firmware version (optional) */
  firmwareVersion?: string;

  /**
   * Optional probe command to verify device is responding.
   * If provided, the device must respond successfully for connect() to succeed.
   */
  probeCommand?: string;
}

/**
 * Identity configuration for a driver.
 * Controls how the driver identifies the instrument on connect.
 */
export type IdentityConfig = StandardIdentity | CustomIdentity | StaticIdentity;

/**
 * Check if identity config uses static values (no query).
 */
export function isStaticIdentity(config: IdentityConfig): config is StaticIdentity {
  return 'static' in config && config.static === true;
}

/**
 * Check if identity config uses a custom query.
 */
export function isCustomIdentity(config: IdentityConfig): config is CustomIdentity {
  return 'query' in config && typeof config.query === 'string';
}

// ─────────────────────────────────────────────────────────────────
// Driver Specification
// ─────────────────────────────────────────────────────────────────

/**
 * Base driver specification fields.
 */
interface DriverSpecBase<T, TChannel, TFeatures extends readonly string[] = readonly string[]> {
  /** Equipment category (e.g., 'oscilloscope', 'power-supply') */
  type?: string;

  /** Manufacturer name */
  manufacturer?: string;

  /** Supported model numbers */
  models?: string[];

  /**
   * Features supported by this driver.
   * Use `as const` to preserve literal types for compile-time checking.
   *
   * @example
   * ```typescript
   * features: ['ovp', 'ocp'] as const,
   * ```
   */
  features?: TFeatures;

  /**
   * Identity configuration. Controls how the driver identifies the instrument.
   * - undefined or { standard: true }: Use *IDN? query (default)
   * - { query, parse }: Use custom query command
   * - { static: true, ... }: Use static values (for devices without identity query)
   */
  identity?: IdentityConfig;

  /** Global properties - must define all properties from T */
  properties: TypedPropertyMap<T>;

  /** Channel configuration - must define all properties from TChannel */
  channels?: [TChannel] extends [never] ? never : ChannelSpec<TChannel>;

  /** Lifecycle hooks */
  hooks?: DriverHooks;

  /** Driver settings */
  settings?: DriverSettings;
}

/**
 * Conditional commands for driver - required if interface has commands.
 */
type DriverCommands<T> = [keyof ExtractCommandNames<T>] extends [never]
  ? { commands?: never }
  : { commands: TypedCommandMap<T> };

/**
 * Conditional methods for driver - required if interface has custom methods.
 */
type DriverMethods<T> = [keyof ExtractMethodNames<T>] extends [never]
  ? { methods?: never }
  : { methods: TypedMethodMap<T> };

/**
 * Full driver specification with compile-time property and command enforcement.
 * TypeScript enforces all properties and commands from T (and TChannel) are defined.
 *
 * @typeParam T - The instrument interface type
 * @typeParam TChannel - The channel interface type (optional)
 * @typeParam TFeatures - The features tuple type (optional, use `as const` to preserve literals)
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
 *   features: ['decode'] as const,  // Optional features
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
export type DriverSpec<
  T,
  TChannel = never,
  TFeatures extends readonly string[] = readonly string[],
> = DriverSpecBase<T, TChannel, TFeatures> & DriverCommands<T> & DriverMethods<T>;

/**
 * A connected driver instance that can be used to control an instrument.
 *
 * @typeParam T - The instrument interface type
 */
export interface Driver<T> {
  /** Connect to an instrument and return a typed driver instance */
  connect(resource: MessageBasedResource): Promise<Result<T, Error>>;
}
