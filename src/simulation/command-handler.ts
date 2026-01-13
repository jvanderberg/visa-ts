/**
 * Command handler for simulation backend.
 *
 * Handles pattern matching, dialogue lookup, and property get/set.
 *
 * @packageDocumentation
 */

import { createDeviceState, type DeviceState } from './device-state.js';
import type { SimulatedDevice, Dialogue, Property, DeviceInfo, CommandResult } from './types.js';

/**
 * Interface for command handler
 */
export interface CommandHandler {
  /**
   * Handle a command and return the result.
   *
   * @param command - Command string to handle
   * @returns CommandResult with match status and response
   */
  handleCommand(command: string): CommandResult;

  /**
   * Reset all properties to default values.
   */
  reset(): void;

  /**
   * Get device identification information.
   *
   * @returns DeviceInfo
   */
  getDeviceInfo(): DeviceInfo;

  /**
   * Directly update device state properties.
   *
   * Used by circuit simulation to set measured values.
   *
   * @param values - Map of property names to values
   */
  updateState(values: Record<string, unknown>): void;
}

/**
 * Try to match a command against a string or RegExp pattern.
 *
 * @param command - Command to match
 * @param pattern - String or RegExp pattern
 * @returns Match array if matched, null otherwise
 */
function matchPattern(command: string, pattern: string | RegExp): RegExpMatchArray | null {
  if (typeof pattern === 'string') {
    // Exact string match
    if (command === pattern) {
      // Create a match array for consistency
      const match = [command] as RegExpMatchArray;
      match.index = 0;
      match.input = command;
      return match;
    }
    return null;
  } else {
    // RegExp match
    return command.match(pattern);
  }
}

/**
 * Try to match a dialogue and get response.
 *
 * @param command - Command to match
 * @param dialogue - Dialogue definition
 * @returns CommandResult if matched, null otherwise
 */
function tryDialogue(command: string, dialogue: Dialogue): CommandResult | null {
  const match = matchPattern(command, dialogue.pattern);
  if (!match) {
    return null;
  }

  // Determine response
  let response: string | null;
  if (dialogue.response === null) {
    response = null;
  } else if (typeof dialogue.response === 'function') {
    response = dialogue.response(match);
  } else {
    response = dialogue.response;
  }

  return { matched: true, response };
}

/**
 * Try to match a property getter.
 *
 * @param command - Command to match
 * @param name - Property name
 * @param prop - Property definition
 * @param state - Device state
 * @returns CommandResult if matched, null otherwise
 */
function tryPropertyGetter(
  command: string,
  name: string,
  prop: Property,
  state: DeviceState
): CommandResult | null {
  if (!prop.getter) {
    return null;
  }

  const match = matchPattern(command, prop.getter.pattern);
  if (!match) {
    return null;
  }

  const value = state.get(name);
  const response = prop.getter.format(value as never);

  return { matched: true, response };
}

/**
 * Try to match a property setter.
 *
 * @param command - Command to match
 * @param name - Property name
 * @param prop - Property definition
 * @param state - Device state
 * @returns CommandResult if matched, null otherwise
 */
function tryPropertySetter(
  command: string,
  name: string,
  prop: Property,
  state: DeviceState
): CommandResult | null {
  if (!prop.setter) {
    return null;
  }

  const match = matchPattern(command, prop.setter.pattern);
  if (!match) {
    return null;
  }

  // Parse value from match
  const value = prop.setter.parse(match);

  // Set with validation
  const result = state.set(name, value);
  if (!result.ok) {
    return { matched: true, response: null, error: result.error.message };
  }

  return { matched: true, response: null };
}

/**
 * Create a command handler for a simulated device.
 *
 * @param device - Simulated device definition
 * @returns CommandHandler instance
 */
export function createCommandHandler(device: SimulatedDevice): CommandHandler {
  // Create device state from properties
  const state = createDeviceState(device.properties ?? {});

  // Get dialogues
  const dialogues = device.dialogues ?? [];

  // Check if any dialogue handles *IDN? (case-insensitive check for detection)
  // If a dialogue exists that looks like IDN, don't auto-generate
  const hasIdnDialogue = dialogues.some((d) => {
    if (typeof d.pattern === 'string') {
      return d.pattern.toUpperCase() === '*IDN?';
    }
    // For RegExp, test both cases
    return d.pattern.test('*IDN?') || d.pattern.test('*idn?');
  });

  // Check if any dialogue handles *RST (case-insensitive check for detection)
  const hasRstDialogue = dialogues.some((d) => {
    if (typeof d.pattern === 'string') {
      return d.pattern.toUpperCase() === '*RST';
    }
    return d.pattern.test('*RST') || d.pattern.test('*rst');
  });

  return {
    handleCommand(command: string): CommandResult {
      // Check if this looks like a *RST command (case-insensitive)
      const isResetCommand = command.toUpperCase() === '*RST';

      // 1. Check dialogues first
      for (const dialogue of dialogues) {
        const result = tryDialogue(command, dialogue);
        if (result) {
          // Always reset state on *RST, even if handled by dialogue
          if (isResetCommand) {
            state.reset();
          }
          return result;
        }
      }

      // 2. Auto-handle *IDN? if not in dialogues
      if (!hasIdnDialogue && command === '*IDN?') {
        const { manufacturer, model, serial } = device.device;
        const response = `${manufacturer},${model},${serial},1.0.0`;
        return { matched: true, response };
      }

      // 3. Auto-handle *RST if not in dialogues
      if (!hasRstDialogue && command === '*RST') {
        state.reset();
        return { matched: true, response: null };
      }

      // 4. Check property getters
      for (const [name, prop] of Object.entries(device.properties ?? {})) {
        const result = tryPropertyGetter(command, name, prop, state);
        if (result) {
          return result;
        }
      }

      // 5. Check property setters
      for (const [name, prop] of Object.entries(device.properties ?? {})) {
        const result = tryPropertySetter(command, name, prop, state);
        if (result) {
          return result;
        }
      }

      // No match found
      return { matched: false, response: null };
    },

    reset(): void {
      state.reset();
    },

    getDeviceInfo(): DeviceInfo {
      return { ...device.device };
    },

    updateState(values: Record<string, unknown>): void {
      for (const [name, value] of Object.entries(values)) {
        // Directly set state without validation (for circuit simulation use)
        if (state.hasProperty(name)) {
          state.set(name, value);
        }
      }
    },
  };
}
