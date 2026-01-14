import { describe, it, expect } from 'vitest';
import { createCommandHandler } from '../../src/simulation/command-handler.js';
import type { SimulatedDevice } from '../../src/simulation/types.js';

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
        dialogues: [{ pattern: '*IDN?', response: 'Test,T1,001,1.0' }],
      };

      const handler = createCommandHandler(device);
      const result = handler.handleCommand(':UNKNOWN?');

      expect(result.matched).toBe(false);
      expect(result.response).toBeNull();
    });

    it('returns unmatched for empty command', () => {
      const device: SimulatedDevice = {
        device: { manufacturer: 'Test', model: 'T1', serial: '001' },
        dialogues: [{ pattern: '*IDN?', response: 'Test,T1,001,1.0' }],
      };

      const handler = createCommandHandler(device);
      const result = handler.handleCommand('');

      expect(result.matched).toBe(false);
      expect(result.response).toBeNull();
    });
  });

  describe('property getters', () => {
    it('matches property getter and returns formatted value', () => {
      const device: SimulatedDevice = {
        device: { manufacturer: 'Test', model: 'T1', serial: '001' },
        properties: {
          voltage: {
            default: 12.0,
            getter: {
              pattern: ':VOLT?',
              format: (v) => v.toFixed(3),
            },
          },
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
          voltage: {
            default: 12.0,
            getter: {
              pattern: /^:VOLT(?:AGE)?\?$/i,
              format: (v) => String(v),
            },
          },
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
          voltage: {
            default: 12.0,
            setter: {
              pattern: /^:VOLT\s+(.+)$/,
              parse: (m) => parseFloat(m[1]),
            },
            getter: {
              pattern: ':VOLT?',
              format: (v) => String(v),
            },
          },
        },
      };

      const handler = createCommandHandler(device);

      // Set new value
      const setResult = handler.handleCommand(':VOLT 24.5');
      expect(setResult.matched).toBe(true);
      expect(setResult.response).toBeNull(); // setter returns null

      // Verify new value
      const getResult = handler.handleCommand(':VOLT?');
      expect(getResult.response).toBe('24.5');
    });

    it('validates value on setter', () => {
      const device: SimulatedDevice = {
        device: { manufacturer: 'Test', model: 'T1', serial: '001' },
        properties: {
          voltage: {
            default: 12.0,
            setter: {
              pattern: /^:VOLT\s+(.+)$/,
              parse: (m) => parseFloat(m[1]),
            },
            validate: (v) => v >= 0 && v <= 30,
          },
        },
      };

      const handler = createCommandHandler(device);

      // Valid value
      const validResult = handler.handleCommand(':VOLT 20.0');
      expect(validResult.matched).toBe(true);
      expect(validResult.error).toBeUndefined();

      // Invalid value
      const invalidResult = handler.handleCommand(':VOLT 50.0');
      expect(invalidResult.matched).toBe(true);
      expect(invalidResult.error).toBeDefined();
      expect(invalidResult.error).toContain('validation');
    });
  });

  describe('dialogue priority over properties', () => {
    it('checks dialogues before properties', () => {
      const device: SimulatedDevice = {
        device: { manufacturer: 'Test', model: 'T1', serial: '001' },
        dialogues: [{ pattern: '*IDN?', response: 'Custom response' }],
        properties: {
          idn: {
            default: 'Property response',
            getter: { pattern: '*IDN?', format: (v) => v },
          },
        },
      };

      const handler = createCommandHandler(device);
      const result = handler.handleCommand('*IDN?');

      // Dialogue should win
      expect(result.response).toBe('Custom response');
    });
  });

  describe('reset', () => {
    it('resets all properties to defaults', () => {
      const device: SimulatedDevice = {
        device: { manufacturer: 'Test', model: 'T1', serial: '001' },
        properties: {
          voltage: {
            default: 12.0,
            setter: { pattern: /^:VOLT\s+(.+)$/, parse: (m) => parseFloat(m[1]) },
            getter: { pattern: ':VOLT?', format: (v) => String(v) },
          },
          enabled: {
            default: false,
            setter: { pattern: /^:OUTP\s+(ON|OFF)$/i, parse: (m) => m[1].toUpperCase() === 'ON' },
            getter: { pattern: ':OUTP?', format: (v) => (v ? '1' : '0') },
          },
        },
      };

      const handler = createCommandHandler(device);

      // Modify values
      handler.handleCommand(':VOLT 24.0');
      handler.handleCommand(':OUTP ON');

      // Verify changed
      expect(handler.handleCommand(':VOLT?').response).toBe('24');
      expect(handler.handleCommand(':OUTP?').response).toBe('1');

      // Reset
      handler.reset();

      // Verify reset
      expect(handler.handleCommand(':VOLT?').response).toBe('12');
      expect(handler.handleCommand(':OUTP?').response).toBe('0');
    });
  });

  describe('getDeviceInfo', () => {
    it('returns device identification', () => {
      const device: SimulatedDevice = {
        device: { manufacturer: 'Test Corp', model: 'Model X', serial: 'SN123' },
      };

      const handler = createCommandHandler(device);

      expect(handler.getDeviceInfo()).toEqual({
        manufacturer: 'Test Corp',
        model: 'Model X',
        serial: 'SN123',
      });
    });
  });

  describe('automatic *IDN? handling', () => {
    it('generates *IDN? response from device info when not in dialogues', () => {
      const device: SimulatedDevice = {
        device: { manufacturer: 'RIGOL', model: 'DS1054Z', serial: 'DS1ZA001' },
        // No *IDN? in dialogues
      };

      const handler = createCommandHandler(device);
      const result = handler.handleCommand('*IDN?');

      expect(result.matched).toBe(true);
      expect(result.response).toContain('RIGOL');
      expect(result.response).toContain('DS1054Z');
      expect(result.response).toContain('DS1ZA001');
    });

    it('uses explicit *IDN? dialogue over auto-generated', () => {
      const device: SimulatedDevice = {
        device: { manufacturer: 'RIGOL', model: 'DS1054Z', serial: 'DS1ZA001' },
        dialogues: [{ pattern: '*IDN?', response: 'Custom IDN Response' }],
      };

      const handler = createCommandHandler(device);
      const result = handler.handleCommand('*IDN?');

      expect(result.response).toBe('Custom IDN Response');
    });
  });

  describe('automatic *RST handling', () => {
    it('handles *RST and resets state when not in dialogues', () => {
      const device: SimulatedDevice = {
        device: { manufacturer: 'Test', model: 'T1', serial: '001' },
        properties: {
          voltage: {
            default: 12.0,
            setter: { pattern: /^:VOLT\s+(.+)$/, parse: (m) => parseFloat(m[1]) },
            getter: { pattern: ':VOLT?', format: (v) => String(v) },
          },
        },
      };

      const handler = createCommandHandler(device);

      // Change value
      handler.handleCommand(':VOLT 24.0');
      expect(handler.handleCommand(':VOLT?').response).toBe('24');

      // *RST should reset state
      const rstResult = handler.handleCommand('*RST');
      expect(rstResult.matched).toBe(true);
      expect(rstResult.response).toBeNull();

      // Verify reset
      expect(handler.handleCommand(':VOLT?').response).toBe('12');
    });

    it('resets state when *RST is handled by dialogue', () => {
      const device: SimulatedDevice = {
        device: { manufacturer: 'Test', model: 'T1', serial: '001' },
        dialogues: [{ pattern: '*RST', response: null }],
        properties: {
          voltage: {
            default: 12.0,
            setter: { pattern: /^:VOLT\s+(.+)$/, parse: (m) => parseFloat(m[1]) },
            getter: { pattern: ':VOLT?', format: (v) => String(v) },
          },
        },
      };

      const handler = createCommandHandler(device);

      // Change value
      handler.handleCommand(':VOLT 99.0');
      expect(handler.handleCommand(':VOLT?').response).toBe('99');

      // *RST through dialogue should still reset state
      const rstResult = handler.handleCommand('*RST');
      expect(rstResult.matched).toBe(true);
      expect(rstResult.response).toBeNull();

      // Verify reset
      expect(handler.handleCommand(':VOLT?').response).toBe('12');
    });
  });
});
