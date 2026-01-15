/**
 * Channel accessor factory functions for instrument drivers.
 *
 * @packageDocumentation
 */

import { Ok, Err, type Result } from '../result.js';
import type { MessageBasedResource } from '../resources/message-based-resource.js';
import {
  isSupported,
  isCommandSupported,
  type QuirkConfig,
  type DriverHooks,
  type PropertyDef,
  type CommandDef,
  type ChannelSpec,
} from './types.js';

/**
 * Helper to create a delay promise.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Convert property name to getter method name.
 * e.g., "voltage" -> "getVoltage"
 */
export function toGetterName(propName: string): string {
  return `get${propName.charAt(0).toUpperCase()}${propName.slice(1)}`;
}

/**
 * Convert property name to setter method name.
 * e.g., "voltage" -> "setVoltage"
 */
export function toSetterName(propName: string): string {
  return `set${propName.charAt(0).toUpperCase()}${propName.slice(1)}`;
}

/**
 * Validate that a channel number is within bounds.
 */
export function validateChannelNumber(
  channelNum: number,
  channelCount: number
): Result<void, Error> {
  if (channelNum < 1 || channelNum > channelCount) {
    return Err(new Error(`Channel ${channelNum} out of range (1-${channelCount})`));
  }
  return Ok(undefined);
}

/**
 * Create a channel-specific getter function.
 */
export function createChannelGetter<T>(
  resource: MessageBasedResource,
  prop: PropertyDef<T>,
  channelNum: number,
  scpiIndex: number,
  quirks: QuirkConfig | undefined,
  hooks: DriverHooks | undefined,
  channelCount: number
): () => Promise<Result<T, Error>> {
  // Handle unsupported properties
  if (!isSupported(prop)) {
    const msg = prop.description ?? 'Not supported by this device';
    return async () => Err(new Error(msg));
  }

  return async () => {
    // Bounds check
    const boundsResult = validateChannelNumber(channelNum, channelCount);
    if (!boundsResult.ok) return boundsResult;

    // Substitute {ch} placeholder with channel index
    let cmd = prop.get.replace(/\{ch\}/g, String(scpiIndex));

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
 * Create a channel-specific setter function.
 */
export function createChannelSetter<T>(
  resource: MessageBasedResource,
  prop: PropertyDef<T>,
  channelNum: number,
  scpiIndex: number,
  quirks: QuirkConfig | undefined,
  hooks: DriverHooks | undefined,
  channelCount: number
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
    // Bounds check
    const boundsResult = validateChannelNumber(channelNum, channelCount);
    if (!boundsResult.ok) return boundsResult;

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

    // Substitute {ch} placeholder with channel index, then {value} with formatted value
    let cmd = setCmd.replace(/\{ch\}/g, String(scpiIndex)).replace('{value}', formattedValue);

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
 * Create a channel-specific command function.
 */
export function createChannelCommand(
  resource: MessageBasedResource,
  cmdDef: CommandDef,
  channelNum: number,
  scpiIndex: number,
  hooks: DriverHooks | undefined,
  channelCount: number
): () => Promise<Result<void, Error>> {
  // Handle unsupported commands
  if (!isCommandSupported(cmdDef)) {
    const msg = cmdDef.description ?? 'Not supported by this device';
    return async () => Err(new Error(msg));
  }

  return async () => {
    // Bounds check
    const boundsResult = validateChannelNumber(channelNum, channelCount);
    if (!boundsResult.ok) return boundsResult;

    // Substitute {ch} placeholder with channel index
    let cmd = cmdDef.command.replace(/\{ch\}/g, String(scpiIndex));

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
 * Create a channel accessor for a specific channel number.
 *
 * The channel accessor provides getter/setter methods for all properties
 * and command methods defined in the ChannelSpec.
 */
export function createChannelAccessor<TChannel>(
  resource: MessageBasedResource,
  channelSpec: ChannelSpec<TChannel>,
  channelNum: number,
  quirks: QuirkConfig | undefined,
  hooks: DriverHooks | undefined
): Record<string, unknown> {
  // Calculate SCPI index from channel number:
  // - channelNum is always 1-based from user's perspective
  // - indexStart is the SCPI index for channel 1 (default: 1)
  // - Channel 1 with indexStart=1 -> SCPI index 1
  // - Channel 1 with indexStart=0 -> SCPI index 0
  const indexStart = channelSpec.indexStart ?? 1;
  const scpiIndex = channelNum - 1 + indexStart;

  const channelInstance: Record<string, unknown> = {
    channelNumber: channelNum,
  };

  // Generate getters and setters for channel properties
  for (const [propName, value] of Object.entries(channelSpec.properties)) {
    const propDef = value as PropertyDef<unknown>;
    // Generate getter
    const getterName = toGetterName(propName);
    channelInstance[getterName] = createChannelGetter(
      resource,
      propDef,
      channelNum,
      scpiIndex,
      quirks,
      hooks,
      channelSpec.count
    );

    // Generate setter if set command is defined and not readonly
    if (isSupported(propDef) && propDef.set && !propDef.readonly) {
      const setterName = toSetterName(propName);
      channelInstance[setterName] = createChannelSetter(
        resource,
        propDef,
        channelNum,
        scpiIndex,
        quirks,
        hooks,
        channelSpec.count
      );
    }
  }

  // Generate channel command methods
  if (channelSpec.commands) {
    for (const [cmdName, cmdDef] of Object.entries(channelSpec.commands)) {
      channelInstance[cmdName] = createChannelCommand(
        resource,
        cmdDef,
        channelNum,
        scpiIndex,
        hooks,
        channelSpec.count
      );
    }
  }

  return channelInstance;
}
