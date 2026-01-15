/**
 * Tests for driver type definitions.
 *
 * @packageDocumentation
 */

import { describe, it, expect } from 'vitest';
import type {
  PropertyDef,
  CommandDef,
  ChannelSpec,
  DriverSpec,
  QuirkConfig,
} from '../../src/drivers/types.js';
import type { Result } from '../../src/result.js';

describe('Driver Types', () => {
  describe('PropertyDef', () => {
    it('defines a readable property with get command', () => {
      const prop: PropertyDef<number> = {
        get: ':TIM:SCAL?',
      };
      expect(prop.get).toBe(':TIM:SCAL?');
      expect(prop.set).toBeUndefined();
    });

    it('defines a read-write property with get and set commands', () => {
      const prop: PropertyDef<number> = {
        get: ':TIM:SCAL?',
        set: ':TIM:SCAL {value}',
      };
      expect(prop.get).toBe(':TIM:SCAL?');
      expect(prop.set).toBe(':TIM:SCAL {value}');
    });

    it('defines a property with parse function', () => {
      const parseNumber = (s: string): number => parseFloat(s);
      const prop: PropertyDef<number> = {
        get: ':TIM:SCAL?',
        parse: parseNumber,
      };
      expect(prop.parse).toBeDefined();
      expect(prop.parse!('1.5')).toBe(1.5);
    });

    it('defines a property with format function', () => {
      const prop: PropertyDef<boolean> = {
        get: ':OUTP?',
        set: ':OUTP {value}',
        format: (v) => (v ? 'ON' : 'OFF'),
      };
      expect(prop.format).toBeDefined();
      expect(prop.format!(true)).toBe('ON');
      expect(prop.format!(false)).toBe('OFF');
    });

    it('defines a property with validation', () => {
      const prop: PropertyDef<number> = {
        get: ':VOLT?',
        set: ':VOLT {value}',
        validate: (v) => (v >= 0 && v <= 30 ? true : 'Voltage must be 0-30V'),
      };
      expect(prop.validate).toBeDefined();
      expect(prop.validate!(15)).toBe(true);
      expect(prop.validate!(50)).toBe('Voltage must be 0-30V');
    });

    it('defines a readonly property', () => {
      const prop: PropertyDef<string> = {
        get: ':SYST:VERS?',
        readonly: true,
      };
      expect(prop.readonly).toBe(true);
    });

    it('defines a property with metadata', () => {
      const prop: PropertyDef<number> = {
        get: ':VOLT?',
        set: ':VOLT {value}',
        description: 'Output voltage setpoint',
        unit: 'V',
      };
      expect(prop.description).toBe('Output voltage setpoint');
      expect(prop.unit).toBe('V');
    });
  });

  describe('CommandDef', () => {
    it('defines a simple command', () => {
      const cmd: CommandDef = {
        command: '*RST',
      };
      expect(cmd.command).toBe('*RST');
    });

    it('defines a command with description', () => {
      const cmd: CommandDef = {
        command: '*RST',
        description: 'Reset instrument to default state',
      };
      expect(cmd.description).toBe('Reset instrument to default state');
    });

    it('defines a command with post-command delay', () => {
      const cmd: CommandDef = {
        command: ':SYST:PRES',
        delay: 500,
      };
      expect(cmd.delay).toBe(500);
    });
  });

  describe('ChannelSpec', () => {
    it('defines channel count and addressing', () => {
      const spec: ChannelSpec = {
        count: 4,
        properties: {},
      };
      expect(spec.count).toBe(4);
      expect(spec.indexStart).toBeUndefined(); // defaults to 1
    });

    it('defines zero-based channel indexing', () => {
      const spec: ChannelSpec = {
        count: 4,
        indexStart: 0,
        properties: {},
      };
      expect(spec.indexStart).toBe(0);
    });

    it('defines channel properties with {ch} placeholder', () => {
      const spec: ChannelSpec = {
        count: 3,
        properties: {
          voltage: {
            get: ':SOUR{ch}:VOLT?',
            set: ':SOUR{ch}:VOLT {value}',
          },
          current: {
            get: ':SOUR{ch}:CURR?',
            set: ':SOUR{ch}:CURR {value}',
          },
        },
      };
      expect(spec.properties.voltage.get).toBe(':SOUR{ch}:VOLT?');
      expect(spec.properties.current.set).toBe(':SOUR{ch}:CURR {value}');
    });

    it('defines channel commands', () => {
      const spec: ChannelSpec = {
        count: 2,
        properties: {},
        commands: {
          enable: {
            command: ':OUTP{ch} ON',
          },
          disable: {
            command: ':OUTP{ch} OFF',
          },
        },
      };
      expect(spec.commands).toBeDefined();
      expect(spec.commands!.enable.command).toBe(':OUTP{ch} ON');
    });
  });

  describe('QuirkConfig', () => {
    it('defines quirk configuration', () => {
      const quirks: QuirkConfig = {
        postCommandDelay: 50,
        postQueryDelay: 100,
        resetOnConnect: true,
        clearOnConnect: true,
      };
      expect(quirks.postCommandDelay).toBe(50);
      expect(quirks.postQueryDelay).toBe(100);
      expect(quirks.resetOnConnect).toBe(true);
      expect(quirks.clearOnConnect).toBe(true);
    });
  });

  describe('DriverSpec', () => {
    it('defines minimal driver spec', () => {
      interface SimpleInstrument {
        getValue(): Promise<Result<number, Error>>;
      }

      const spec: DriverSpec<SimpleInstrument> = {
        properties: {
          value: {
            get: ':VAL?',
          },
        },
      };
      expect(spec.properties.value.get).toBe(':VAL?');
    });

    it('defines driver spec with metadata', () => {
      interface TestInstrument {
        getVoltage(): Promise<Result<number, Error>>;
      }

      const spec: DriverSpec<TestInstrument> = {
        type: 'power-supply',
        manufacturer: 'Rigol',
        models: ['DP832', 'DP832A'],
        properties: {
          voltage: {
            get: ':VOLT?',
            set: ':VOLT {value}',
          },
        },
      };
      expect(spec.type).toBe('power-supply');
      expect(spec.manufacturer).toBe('Rigol');
      expect(spec.models).toEqual(['DP832', 'DP832A']);
    });

    it('defines driver spec with commands', () => {
      interface TestInstrument {
        reset(): Promise<Result<void, Error>>;
      }

      const spec: DriverSpec<TestInstrument> = {
        properties: {},
        commands: {
          reset: {
            command: '*RST',
            delay: 100,
          },
        },
      };
      expect(spec.commands).toBeDefined();
      expect(spec.commands!.reset.command).toBe('*RST');
    });

    it('defines driver spec with channels', () => {
      interface PowerSupply {
        readonly channelCount: number;
      }

      const spec: DriverSpec<PowerSupply> = {
        properties: {},
        channels: {
          count: 3,
          properties: {
            voltage: {
              get: ':SOUR{ch}:VOLT?',
              set: ':SOUR{ch}:VOLT {value}',
            },
          },
        },
      };
      expect(spec.channels).toBeDefined();
      expect(spec.channels!.count).toBe(3);
    });

    it('defines driver spec with capabilities', () => {
      interface Oscilloscope {
        hasCapability(cap: string): boolean;
      }

      const spec: DriverSpec<Oscilloscope> = {
        properties: {},
        capabilities: ['fft', 'protocol-decode', 'math-channels'],
      };
      expect(spec.capabilities).toEqual(['fft', 'protocol-decode', 'math-channels']);
    });

    it('defines driver spec with quirks', () => {
      interface TestInstrument {
        getValue(): Promise<Result<number, Error>>;
      }

      const spec: DriverSpec<TestInstrument> = {
        properties: {
          value: { get: ':VAL?' },
        },
        quirks: {
          postCommandDelay: 50,
          resetOnConnect: true,
        },
      };
      expect(spec.quirks).toBeDefined();
      expect(spec.quirks!.postCommandDelay).toBe(50);
    });
  });
});
