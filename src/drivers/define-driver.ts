/**
 * Factory function to create typed instrument drivers from specifications.
 *
 * @packageDocumentation
 */

import { Ok, Err, type Result } from '../result.js';
import type { MessageBasedResource } from '../resources/message-based-resource.js';
import {
  isSupported,
  isCommandSupported,
  type DriverSpec,
  type DriverContext,
  type PropertyDef,
  type CommandDef,
  type QuirkConfig,
  type DriverHooks,
  type ChannelSpec,
} from './types.js';
import { delay, toGetterName, toSetterName, createChannelAccessor } from './channel.js';

/**
 * Extended driver interface with spec access.
 */
export interface DefinedDriver<T, TChannel = never> {
  /** The driver specification */
  readonly spec: DriverSpec<T, TChannel>;

  /** Connect to an instrument and return a typed instance */
  connect(resource: MessageBasedResource): Promise<Result<T, Error>>;
}

/**
 * Create a driver context for hooks and custom methods.
 */
function createDriverContext(resource: MessageBasedResource): DriverContext {
  return {
    resource,
    query: (command: string) => resource.query(command),
    write: (command: string) => resource.write(command),
    delay,
  };
}

/**
 * Create a getter function for a property.
 */
function createGetter<T>(
  resource: MessageBasedResource,
  prop: PropertyDef<T>,
  quirks: QuirkConfig | undefined,
  hooks: DriverHooks | undefined
): () => Promise<Result<T, Error>> {
  // Handle unsupported properties
  if (!isSupported(prop)) {
    const msg = prop.description ?? 'Not supported by this device';
    return async () => Err(new Error(msg));
  }

  return async () => {
    let cmd = prop.get;

    // Apply transform hook if present
    if (hooks?.transformCommand) {
      cmd = hooks.transformCommand(cmd, undefined);
    }

    const result = await resource.query(cmd);
    if (!result.ok) return result;

    // Apply post-query delay if configured
    if (quirks?.postQueryDelay) {
      await delay(quirks.postQueryDelay);
    }

    let response = result.value;

    // Apply response transform hook if present
    if (hooks?.transformResponse) {
      response = hooks.transformResponse(cmd, response);
    }

    // Parse the response
    if (prop.parse) {
      try {
        return Ok(prop.parse(response) as T);
      } catch {
        return Err(new Error(`Failed to parse response: ${response}`));
      }
    }

    return Ok(response as T);
  };
}

/**
 * Create a setter function for a property.
 */
function createSetter<T>(
  resource: MessageBasedResource,
  prop: PropertyDef<T>,
  quirks: QuirkConfig | undefined,
  hooks: DriverHooks | undefined
): (value: T) => Promise<Result<void, Error>> {
  // Handle unsupported properties
  if (!isSupported(prop)) {
    const msg = prop.description ?? 'Not supported by this device';
    return async () => Err(new Error(msg));
  }

  // Guard: property must have a set command
  if (!prop.set) {
    return async () => Err(new Error('Property is read-only'));
  }

  const setCmd = prop.set;

  return async (value: T) => {
    // Validate if validator is present
    if (prop.validate) {
      const validationResult = prop.validate(value);
      if (validationResult !== true) {
        const message =
          typeof validationResult === 'string' ? validationResult : 'Validation failed';
        return Err(new Error(message));
      }
    }

    // Format the value
    let formattedValue: string;
    if (prop.format) {
      formattedValue = prop.format(value);
    } else {
      formattedValue = String(value);
    }

    // Build the command
    let cmd = setCmd.replace('{value}', formattedValue);

    // Apply transform hook if present
    if (hooks?.transformCommand) {
      cmd = hooks.transformCommand(cmd, value);
    }

    const result = await resource.write(cmd);
    if (!result.ok) return result;

    // Apply post-command delay if configured
    if (quirks?.postCommandDelay) {
      await delay(quirks.postCommandDelay);
    }

    return Ok(undefined);
  };
}

/**
 * Create a command function.
 */
function createCommand(
  resource: MessageBasedResource,
  cmdDef: CommandDef,
  hooks: DriverHooks | undefined
): () => Promise<Result<void, Error>> {
  // Handle unsupported commands
  if (!isCommandSupported(cmdDef)) {
    const msg = cmdDef.description ?? 'Not supported by this device';
    return async () => Err(new Error(msg));
  }

  return async () => {
    let cmd = cmdDef.command;

    // Apply transform hook if present
    if (hooks?.transformCommand) {
      cmd = hooks.transformCommand(cmd, undefined);
    }

    const result = await resource.write(cmd);
    if (!result.ok) return result;

    // Apply post-command delay if configured in command def
    if (cmdDef.delay) {
      await delay(cmdDef.delay);
    }

    return Ok(undefined);
  };
}

/**
 * Define a typed driver from a specification.
 *
 * @typeParam T - The interface type this driver produces
 * @typeParam TChannel - The channel interface type (optional)
 * @param spec - The driver specification
 * @returns A driver that can connect to instruments
 *
 * @example
 * ```typescript
 * interface MyPowerSupply {
 *   getVoltage(): Promise<Result<number, Error>>;
 *   setVoltage(v: number): Promise<Result<void, Error>>;
 * }
 *
 * const myDriver = defineDriver<MyPowerSupply>({
 *   properties: {
 *     voltage: {
 *       get: ':VOLT?',
 *       set: ':VOLT {value}',
 *       parse: parseScpiNumber,
 *     },
 *   },
 * });
 *
 * const psu = await myDriver.connect(resource);
 * ```
 */
export function defineDriver<T, TChannel = never>(
  spec: DriverSpec<T, TChannel>
): DefinedDriver<T, TChannel> {
  return {
    spec,

    async connect(resource: MessageBasedResource): Promise<Result<T, Error>> {
      // Check if resource is open
      if (!resource.isOpen) {
        return Err(new Error('Resource is not open'));
      }

      // Apply quirks on connect
      if (spec.quirks?.resetOnConnect) {
        const result = await resource.write('*RST');
        if (!result.ok) return result;
      }

      if (spec.quirks?.clearOnConnect) {
        const result = await resource.write('*CLS');
        if (!result.ok) return result;
      }

      // Create driver context
      const ctx = createDriverContext(resource);

      // Call onConnect hook if present
      if (spec.hooks?.onConnect) {
        const result = await spec.hooks.onConnect(ctx);
        if (!result.ok) return result;
      }

      // Build the instrument instance
      const capabilities = spec.capabilities ?? [];

      const instance: Record<string, unknown> = {
        // Expose raw resource for escape hatch
        resource,

        // Capability system
        capabilities,
        hasCapability: (cap: string) => capabilities.includes(cap),

        // Close method
        close: async () => {
          // Call onDisconnect hook if present
          if (spec.hooks?.onDisconnect) {
            const hookResult = await spec.hooks.onDisconnect(ctx);
            if (!hookResult.ok) return hookResult;
          }
          return resource.close();
        },
      };

      // Generate getters and setters for properties
      for (const [propName, value] of Object.entries(spec.properties)) {
        const propDef = value as PropertyDef<unknown>;
        // Generate getter
        const getterName = toGetterName(propName);
        instance[getterName] = createGetter(resource, propDef, spec.quirks, spec.hooks);

        // Generate setter if set command is defined and not readonly
        if (isSupported(propDef) && propDef.set && !propDef.readonly) {
          const setterName = toSetterName(propName);
          instance[setterName] = createSetter(resource, propDef, spec.quirks, spec.hooks);
        }
      }

      // Generate command methods
      if (spec.commands) {
        for (const [cmdName, cmdDef] of Object.entries(spec.commands)) {
          instance[cmdName] = createCommand(resource, cmdDef, spec.hooks);
        }
      }

      // Add custom method implementations
      if (spec.methods) {
        for (const [methodName, methodImpl] of Object.entries(spec.methods)) {
          if (methodImpl && typeof methodImpl === 'function') {
            const impl = methodImpl as (ctx: DriverContext, ...args: unknown[]) => unknown;
            instance[methodName] = (...args: unknown[]) => impl(ctx, ...args);
          }
        }
      }

      // Add channel support if channels are defined
      const channels = spec.channels as ChannelSpec<TChannel> | undefined;
      if (channels) {
        instance.channelCount = channels.count;

        // Create channel accessor function
        instance.channel = (n: number) => {
          return createChannelAccessor(resource, channels, n, spec.quirks, spec.hooks);
        };
      }

      return Ok(instance as T);
    },
  };
}
