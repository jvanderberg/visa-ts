import { describe, it, expect } from 'vitest';
import { createCommandHandler } from '../../src/simulation/command-handler.js';
import type { SimulatedDevice, Property } from '../../src/simulation/types.js';

// Helper to create a property with get/set
function createProperty<T>(
  initial: T,
  config?: {
    getter?: { pattern: string | RegExp; format: (v: T) => string };
    setter?: { pattern: string | RegExp; parse: (m: RegExpMatchArray) => T };
    validate?: (v: T) => boolean;
  }
): Property {
  let value = initial;
  return {
    get: () => value as number | string | boolean,
    set: (v) => {
      value = v as T;
    },
    getter: config?.getter
      ? {
          pattern: config.getter.pattern,
          format: (v) => config.getter!.format(v as T),
        }
      : undefined,
    setter: config?.setter
      ? {
          pattern: config.setter.pattern,
          parse: (m) => config.setter!.parse(m) as number | string | boolean,
        }
      : undefined,
    validate: config?.validate ? (v) => config.validate!(v as T) : undefined,
  };
}

describe('createCommandHandler', () => {
  describe('dialogue matching', () => {
    it('matches exact string dialogue', () => {
      const device: SimulatedDevice = {
        device: { manufacturer: 'Test', model: 'T1', serial: '001' },
        dialogues: [{ pattern: '*IDN?', response: 'Test,T1,001,1.0' }],
      };

      const handler = createCommandHandler(device);
      const result = handler.handleCommand('*IDN?');

      expect(result.matched).toBe(true);
      expect(result.response).toBe('Test,T1,001,1.0');
    });

    it('matches case-sensitive string dialogue', () => {
      const device: SimulatedDevice = {
        device: { manufacturer: 'Test', model: 'T1', serial: '001' },
        dialogues: [{ pattern: '*idn?', response: 'lower' }],
      };

      const handler = createCommandHandler(device);

      expect(handler.handleCommand('*idn?').matched).toBe(true);
      expect(handler.handleCommand('*IDN?').matched).toBe(false);
    });

    it('matches RegExp dialogue pattern', () => {
      const device: SimulatedDevice = {
        device: { manufacturer: 'Test', model: 'T1', serial: '001' },
        dialogues: [{ pattern: /^\*IDN\?$/i, response: 'Test,T1,001,1.0' }],
      };

      const handler = createCommandHandler(device);

      expect(handler.handleCommand('*IDN?').matched).toBe(true);
      expect(handler.handleCommand('*idn?').matched).toBe(true); // case insensitive
    });

    it('returns null response for write-only commands', () => {
      const device: SimulatedDevice = {
        device: { manufacturer: 'Test', model: 'T1', serial: '001' },
        dialogues: [{ pattern: '*RST', response: null }],
      };

      const handler = createCommandHandler(device);
      const result = handler.handleCommand('*RST');

      expect(result.matched).toBe(true);
      expect(result.response).toBeNull();
    });

    it('calls dynamic response function', () => {
      const device: SimulatedDevice = {
        device: { manufacturer: 'Test', model: 'T1', serial: '001' },
        dialogues: [{ pattern: ':MEAS:FREQ?', response: () => '1000.5' }],
      };

      const handler = createCommandHandler(device);
      const result = handler.handleCommand(':MEAS:FREQ?');

      expect(result.matched).toBe(true);
      expect(result.response).toBe('1000.5');
    });

    it('passes match array to dynamic response function', () => {
      const device: SimulatedDevice = {
        device: { manufacturer: 'Test', model: 'T1', serial: '001' },
        dialogues: [
          {
            pattern: /^:CHAN(\d):DISP\?$/,
            response: (match) => `Channel ${match[1]} display`,
          },
        ],
      };

      const handler = createCommandHandler(device);
      const result = handler.handleCommand(':CHAN2:DISP?');

      expect(result.matched).toBe(true);
      expect(result.response).toBe('Channel 2 display');
    });

    it('returns unmatched for unknown command', () => {
      const device: SimulatedDevice = {
        device: { manufacturer: 'Test', model: 'T1', serial: '001' },
        dialogues: [{ pattern: '*IDN?', response: 'Test' }],
      };

      const handler = createCommandHandler(device);
      const result = handler.handleCommand(':UNKNOWN?');

      expect(result.matched).toBe(false);
      expect(result.response).toBeNull();
    });
  });

  describe('property getters', () => {
    it('matches property getter and returns formatted value', () => {
      const device: SimulatedDevice = {
        device: { manufacturer: 'Test', model: 'T1', serial: '001' },
        properties: {
          voltage: createProperty(12.0, {
            getter: { pattern: ':VOLT?', format: (v) => v.toFixed(3) },
          }),
        },
      };

      const handler = createCommandHandler(device);
      const result = handler.handleCommand(':VOLT?');

      expect(result.matched).toBe(true);
      expect(result.response).toBe('12.000');
    });

    it('matches property getter with RegExp pattern', () => {
      const device: SimulatedDevice = {
        device: { manufacturer: 'Test', model: 'T1', serial: '001' },
        properties: {
          voltage: createProperty(12.0, {
            getter: { pattern: /^:VOLT(?:AGE)?\?$/i, format: (v) => String(v) },
          }),
        },
      };

      const handler = createCommandHandler(device);

      expect(handler.handleCommand(':VOLT?').matched).toBe(true);
      expect(handler.handleCommand(':VOLTAGE?').matched).toBe(true);
      expect(handler.handleCommand(':voltage?').matched).toBe(true);
    });
  });

  describe('property setters', () => {
    it('matches property setter and updates value', () => {
      const device: SimulatedDevice = {
        device: { manufacturer: 'Test', model: 'T1', serial: '001' },
        properties: {
          voltage: createProperty(12.0, {
            setter: { pattern: /^:VOLT\s+(.+)$/, parse: (m) => parseFloat(m[1] ?? '0') },
            getter: { pattern: ':VOLT?', format: (v) => String(v) },
          }),
        },
      };

      const handler = createCommandHandler(device);

      // Set new value
      const setResult = handler.handleCommand(':VOLT 24.5');
      expect(setResult.matched).toBe(true);
      expect(setResult.response).toBeNull();

      // Verify new value
      const getResult = handler.handleCommand(':VOLT?');
      expect(getResult.response).toBe('24.5');
    });

    it('validates value on setter', () => {
      const device: SimulatedDevice = {
        device: { manufacturer: 'Test', model: 'T1', serial: '001' },
        properties: {
          voltage: createProperty(12.0, {
            setter: { pattern: /^:VOLT\s+(.+)$/, parse: (m) => parseFloat(m[1] ?? '0') },
            validate: (v) => v >= 0 && v <= 30,
          }),
        },
      };

      const handler = createCommandHandler(device);

      // Valid value
      expect(handler.handleCommand(':VOLT 25').matched).toBe(true);
      expect(handler.handleCommand(':VOLT 25').error).toBeUndefined();

      // Invalid value
      const invalidResult = handler.handleCommand(':VOLT 50');
      expect(invalidResult.matched).toBe(true);
      expect(invalidResult.error).toBeDefined();
    });
  });

  describe('command priority', () => {
    it('dialogues have priority over properties', () => {
      const device: SimulatedDevice = {
        device: { manufacturer: 'Test', model: 'T1', serial: '001' },
        dialogues: [{ pattern: '*IDN?', response: 'Custom response' }],
        properties: {
          idn: createProperty('Property response', {
            getter: { pattern: '*IDN?', format: (v) => v },
          }),
        },
      };

      const handler = createCommandHandler(device);
      const result = handler.handleCommand('*IDN?');

      expect(result.response).toBe('Custom response');
    });
  });

  describe('reset', () => {
    it('resets all properties to defaults', () => {
      const device: SimulatedDevice = {
        device: { manufacturer: 'Test', model: 'T1', serial: '001' },
        properties: {
          voltage: createProperty(12.0, {
            setter: { pattern: /^:VOLT\s+(.+)$/, parse: (m) => parseFloat(m[1] ?? '0') },
            getter: { pattern: ':VOLT?', format: (v) => String(v) },
          }),
          enabled: createProperty(false, {
            setter: { pattern: /^:OUTP\s+(ON|OFF)$/i, parse: (m) => m[1]?.toUpperCase() === 'ON' },
            getter: { pattern: ':OUTP?', format: (v) => (v ? '1' : '0') },
          }),
        },
      };

      const handler = createCommandHandler(device);

      // Modify values
      handler.handleCommand(':VOLT 24.5');
      handler.handleCommand(':OUTP ON');

      // Verify modified
      expect(handler.handleCommand(':VOLT?').response).toBe('24.5');
      expect(handler.handleCommand(':OUTP?').response).toBe('1');

      // Reset
      handler.reset();

      // Verify reset
      expect(handler.handleCommand(':VOLT?').response).toBe('12');
      expect(handler.handleCommand(':OUTP?').response).toBe('0');
    });
  });

  describe('auto-generated responses', () => {
    it('auto-generates *IDN? when not in dialogues', () => {
      const device: SimulatedDevice = {
        device: { manufacturer: 'ACME', model: 'X100', serial: 'SN123' },
      };

      const handler = createCommandHandler(device);
      const result = handler.handleCommand('*IDN?');

      expect(result.matched).toBe(true);
      expect(result.response).toBe('ACME,X100,SN123,1.0.0');
    });

    it('does not auto-generate *IDN? when in dialogues', () => {
      const device: SimulatedDevice = {
        device: { manufacturer: 'ACME', model: 'X100', serial: 'SN123' },
        dialogues: [{ pattern: '*IDN?', response: 'Custom IDN' }],
      };

      const handler = createCommandHandler(device);
      const result = handler.handleCommand('*IDN?');

      expect(result.response).toBe('Custom IDN');
    });

    it('handles *RST and resets state when not in dialogues', () => {
      const device: SimulatedDevice = {
        device: { manufacturer: 'Test', model: 'T1', serial: '001' },
        properties: {
          voltage: createProperty(12.0, {
            setter: { pattern: /^:VOLT\s+(.+)$/, parse: (m) => parseFloat(m[1] ?? '0') },
            getter: { pattern: ':VOLT?', format: (v) => String(v) },
          }),
        },
      };

      const handler = createCommandHandler(device);

      // Modify state
      handler.handleCommand(':VOLT 99');
      expect(handler.handleCommand(':VOLT?').response).toBe('99');

      // *RST should reset
      const result = handler.handleCommand('*RST');
      expect(result.matched).toBe(true);
      expect(result.response).toBeNull();

      // Verify reset
      expect(handler.handleCommand(':VOLT?').response).toBe('12');
    });
  });

  describe('getDeviceInfo', () => {
    it('returns device identification', () => {
      const device: SimulatedDevice = {
        device: { manufacturer: 'ACME', model: 'X100', serial: 'SN123' },
      };

      const handler = createCommandHandler(device);
      const info = handler.getDeviceInfo();

      expect(info.manufacturer).toBe('ACME');
      expect(info.model).toBe('X100');
      expect(info.serial).toBe('SN123');
    });
  });
});
