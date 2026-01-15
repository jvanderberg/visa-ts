/**
 * Command handler for simulated devices.
 *
 * @packageDocumentation
 */

import type { SimulatedDevice, Property, Dialogue, DeviceInfo, CommandResult } from './types.js';

export interface CommandHandler {
  handleCommand(command: string): CommandResult;
  reset(): void;
  getDeviceInfo(): DeviceInfo;
}

function matchPattern(command: string, pattern: string | RegExp): RegExpMatchArray | null {
  if (typeof pattern === 'string') {
    if (command === pattern) {
      const match = [command] as RegExpMatchArray;
      match.index = 0;
      match.input = command;
      return match;
    }
    return null;
  }
  return command.match(pattern);
}

function tryDialogue(command: string, dialogue: Dialogue): CommandResult | null {
  const match = matchPattern(command, dialogue.pattern);
  if (!match) return null;

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

function tryGetter(command: string, prop: Property): CommandResult | null {
  if (!prop.getter) return null;
  const match = matchPattern(command, prop.getter.pattern);
  if (!match) return null;

  const value = prop.get();
  const response = prop.getter.format(value as never);
  return { matched: true, response };
}

function trySetter(command: string, prop: Property): CommandResult | null {
  if (!prop.setter || !prop.set) return null;
  const match = matchPattern(command, prop.setter.pattern);
  if (!match) return null;

  const value = prop.setter.parse(match);

  if (prop.validate && !prop.validate(value as never)) {
    return { matched: true, response: null, error: 'Invalid value' };
  }

  prop.set(value as never);
  return { matched: true, response: null };
}

export function createCommandHandler(device: SimulatedDevice): CommandHandler {
  const dialogues = device.dialogues ?? [];
  const properties = device.properties ?? {};

  const hasIdnDialogue = dialogues.some((d) => {
    if (typeof d.pattern === 'string') return d.pattern.toUpperCase() === '*IDN?';
    return d.pattern.test('*IDN?') || d.pattern.test('*idn?');
  });

  const hasRstDialogue = dialogues.some((d) => {
    if (typeof d.pattern === 'string') return d.pattern.toUpperCase() === '*RST';
    return d.pattern.test('*RST') || d.pattern.test('*rst');
  });

  // Store initial values for reset
  const initialValues: Record<string, unknown> = {};
  for (const [name, prop] of Object.entries(properties)) {
    initialValues[name] = prop.get();
  }

  return {
    handleCommand(command: string): CommandResult {
      // Dialogues
      for (const dialogue of dialogues) {
        const result = tryDialogue(command, dialogue);
        if (result) return result;
      }

      // Auto *IDN?
      if (!hasIdnDialogue && command === '*IDN?') {
        const { manufacturer, model, serial } = device.device;
        return { matched: true, response: `${manufacturer},${model},${serial},1.0.0` };
      }

      // Auto *RST
      if (!hasRstDialogue && command === '*RST') {
        this.reset();
        return { matched: true, response: null };
      }

      // Property getters
      for (const prop of Object.values(properties)) {
        const result = tryGetter(command, prop);
        if (result) return result;
      }

      // Property setters
      for (const prop of Object.values(properties)) {
        const result = trySetter(command, prop);
        if (result) return result;
      }

      return { matched: false, response: null };
    },

    reset(): void {
      for (const [name, prop] of Object.entries(properties)) {
        if (prop.set) {
          prop.set(initialValues[name] as never);
        }
      }
    },

    getDeviceInfo(): DeviceInfo {
      return { ...device.device };
    },
  };
}
