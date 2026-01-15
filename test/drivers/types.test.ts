/**
 * Tests for driver type definitions.
 *
 * @packageDocumentation
 */

import { describe, it, expect } from 'vitest';
import type {
  PropertyDef,
  UnsupportedPropertyDef,
  CommandDef,
  UnsupportedCommandDef,
  ChannelSpec,
  DriverSpec,
  StrictDriverSpec,
  StrictPropertyMap,
  StrictChannelSpec,
  QuirkConfig,
} from '../../src/drivers/types.js';
import { isSupported, isCommandSupported } from '../../src/drivers/types.js';
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

    it('defines an unsupported property', () => {
      const prop: PropertyDef<number> = {
        notSupported: true,
        description: 'Not available on this model',
      };
      expect('notSupported' in prop).toBe(true);
      expect((prop as UnsupportedPropertyDef).notSupported).toBe(true);
      expect(prop.description).toBe('Not available on this model');
    });

    it('defines an unsupported property without description', () => {
      const prop: PropertyDef<string> = {
        notSupported: true,
      };
      expect('notSupported' in prop).toBe(true);
      expect(prop.description).toBeUndefined();
    });
  });

  describe('isSupported type guard', () => {
    it('returns true for supported property with get command', () => {
      const prop: PropertyDef<number> = {
        get: ':VOLT?',
      };
      expect(isSupported(prop)).toBe(true);
    });

    it('returns true for supported property with get and set', () => {
      const prop: PropertyDef<number> = {
        get: ':VOLT?',
        set: ':VOLT {value}',
        parse: parseFloat,
      };
      expect(isSupported(prop)).toBe(true);
    });

    it('returns false for unsupported property', () => {
      const prop: PropertyDef<number> = {
        notSupported: true,
      };
      expect(isSupported(prop)).toBe(false);
    });

    it('narrows type to SupportedPropertyDef when true', () => {
      const prop: PropertyDef<number> = {
        get: ':VOLT?',
        set: ':VOLT {value}',
      };

      if (isSupported(prop)) {
        // TypeScript should allow access to .get and .set here
        expect(prop.get).toBe(':VOLT?');
        expect(prop.set).toBe(':VOLT {value}');
      }
    });

    it('narrows type to UnsupportedPropertyDef when false', () => {
      const prop: PropertyDef<number> = {
        notSupported: true,
        description: 'Not available',
      };

      if (!isSupported(prop)) {
        // TypeScript should allow access to .notSupported here
        expect(prop.notSupported).toBe(true);
        expect(prop.description).toBe('Not available');
      }
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

    it('defines an unsupported command', () => {
      const cmd: CommandDef = {
        notSupported: true,
        description: 'Auto-scale not available on this model',
      };
      expect('notSupported' in cmd).toBe(true);
      expect((cmd as UnsupportedCommandDef).notSupported).toBe(true);
    });

    it('defines an unsupported command without description', () => {
      const cmd: CommandDef = {
        notSupported: true,
      };
      expect('notSupported' in cmd).toBe(true);
      expect(cmd.description).toBeUndefined();
    });
  });

  describe('isCommandSupported type guard', () => {
    it('returns true for supported command', () => {
      const cmd: CommandDef = {
        command: '*RST',
      };
      expect(isCommandSupported(cmd)).toBe(true);
    });

    it('returns true for supported command with delay', () => {
      const cmd: CommandDef = {
        command: ':RUN',
        delay: 100,
      };
      expect(isCommandSupported(cmd)).toBe(true);
    });

    it('returns false for unsupported command', () => {
      const cmd: CommandDef = {
        notSupported: true,
      };
      expect(isCommandSupported(cmd)).toBe(false);
    });

    it('narrows type to SupportedCommandDef when true', () => {
      const cmd: CommandDef = {
        command: '*RST',
        description: 'Reset device',
        delay: 100,
      };

      if (isCommandSupported(cmd)) {
        // TypeScript should allow access to .command and .delay here
        expect(cmd.command).toBe('*RST');
        expect(cmd.delay).toBe(100);
      }
    });

    it('narrows type to UnsupportedCommandDef when false', () => {
      const cmd: CommandDef = {
        notSupported: true,
        description: 'Not available',
      };

      if (!isCommandSupported(cmd)) {
        // TypeScript should allow access to .notSupported here
        expect(cmd.notSupported).toBe(true);
        expect(cmd.description).toBe('Not available');
      }
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

  describe('StrictDriverSpec', () => {
    it('enforces all properties from interface are defined', () => {
      // Define an interface with getter methods
      interface TestInstrument {
        getVoltage(): Promise<Result<number, Error>>;
        setVoltage(v: number): Promise<Result<void, Error>>;
        getCurrent(): Promise<Result<number, Error>>;
      }

      // StrictDriverSpec requires 'voltage' and 'current' properties
      const spec: StrictDriverSpec<TestInstrument> = {
        properties: {
          voltage: {
            get: ':VOLT?',
            set: ':VOLT {value}',
          },
          current: {
            get: ':CURR?',
          },
        },
      };

      expect(spec.properties.voltage.get).toBe(':VOLT?');
      expect(spec.properties.current.get).toBe(':CURR?');
    });

    it('allows unsupported marker for required properties', () => {
      interface TestInstrument {
        getVoltage(): Promise<Result<number, Error>>;
        getBandwidth(): Promise<Result<string, Error>>;
      }

      // All properties must be defined, but can be marked unsupported
      const spec: StrictDriverSpec<TestInstrument> = {
        properties: {
          voltage: {
            get: ':VOLT?',
          },
          bandwidth: {
            notSupported: true,
            description: 'Bandwidth control not available',
          },
        },
      };

      expect(isSupported(spec.properties.voltage)).toBe(true);
      expect(isSupported(spec.properties.bandwidth)).toBe(false);
    });

    it('enforces channel properties from channel interface', () => {
      interface TestInstrument {
        getTimebase(): Promise<Result<number, Error>>;
        readonly channelCount: number;
      }

      interface TestChannel {
        getScale(): Promise<Result<number, Error>>;
        setScale(v: number): Promise<Result<void, Error>>;
        getOffset(): Promise<Result<number, Error>>;
      }

      // StrictDriverSpec with channel type requires channel properties
      const spec: StrictDriverSpec<TestInstrument, TestChannel> = {
        properties: {
          timebase: {
            get: ':TIM:SCAL?',
          },
        },
        channels: {
          count: 4,
          properties: {
            scale: {
              get: ':CHAN{ch}:SCAL?',
              set: ':CHAN{ch}:SCAL {value}',
            },
            offset: {
              get: ':CHAN{ch}:OFFS?',
            },
          },
        },
      };

      expect(spec.channels!.count).toBe(4);
      expect(spec.channels!.properties.scale.get).toBe(':CHAN{ch}:SCAL?');
      expect(spec.channels!.properties.offset.get).toBe(':CHAN{ch}:OFFS?');
    });

    it('allows unsupported channel properties', () => {
      interface TestInstrument {
        readonly channelCount: number;
      }

      interface TestChannel {
        getScale(): Promise<Result<number, Error>>;
        getProbeAttenuation(): Promise<Result<number, Error>>;
      }

      const spec: StrictDriverSpec<TestInstrument, TestChannel> = {
        properties: {},
        channels: {
          count: 2,
          properties: {
            scale: {
              get: ':CHAN{ch}:SCAL?',
            },
            probeAttenuation: {
              notSupported: true,
              description: 'Probe detection not supported',
            },
          },
        },
      };

      expect(isSupported(spec.channels!.properties.scale)).toBe(true);
      expect(isSupported(spec.channels!.properties.probeAttenuation)).toBe(false);
    });

    it('supports full driver spec with metadata and hooks', () => {
      interface PowerSupply {
        getVoltage(): Promise<Result<number, Error>>;
        setVoltage(v: number): Promise<Result<void, Error>>;
        reset(): Promise<Result<void, Error>>;
      }

      const spec: StrictDriverSpec<PowerSupply> = {
        type: 'power-supply',
        manufacturer: 'Rigol',
        models: ['DP832'],
        properties: {
          voltage: {
            get: ':VOLT?',
            set: ':VOLT {value}',
            parse: parseFloat,
            validate: (v) => v >= 0 && v <= 32,
            unit: 'V',
          },
        },
        commands: {
          reset: {
            command: '*RST',
            delay: 100,
          },
        },
        quirks: {
          postCommandDelay: 10,
        },
        capabilities: ['ovp', 'ocp'],
      };

      expect(spec.manufacturer).toBe('Rigol');
      expect(spec.properties.voltage.unit).toBe('V');
      expect(spec.commands!.reset.command).toBe('*RST');
    });
  });

  describe('StrictPropertyMap', () => {
    it('extracts property names from getter methods', () => {
      interface TestInterface {
        getVoltage(): Promise<Result<number, Error>>;
        getCurrent(): Promise<Result<number, Error>>;
        setVoltage(v: number): Promise<Result<void, Error>>;
      }

      // StrictPropertyMap<TestInterface> requires 'voltage' and 'current'
      const props: StrictPropertyMap<TestInterface> = {
        voltage: { get: ':VOLT?' },
        current: { get: ':CURR?' },
      };

      expect(props.voltage.get).toBe(':VOLT?');
      expect(props.current.get).toBe(':CURR?');
    });
  });

  describe('StrictChannelSpec', () => {
    it('requires all channel interface properties', () => {
      interface ChannelInterface {
        getScale(): Promise<Result<number, Error>>;
        getOffset(): Promise<Result<number, Error>>;
        getCoupling(): Promise<Result<string, Error>>;
      }

      const channelSpec: StrictChannelSpec<ChannelInterface> = {
        count: 4,
        indexStart: 1,
        properties: {
          scale: { get: ':CHAN{ch}:SCAL?' },
          offset: { get: ':CHAN{ch}:OFFS?' },
          coupling: { get: ':CHAN{ch}:COUP?' },
        },
      };

      expect(channelSpec.count).toBe(4);
      expect(Object.keys(channelSpec.properties)).toHaveLength(3);
    });
  });
});
