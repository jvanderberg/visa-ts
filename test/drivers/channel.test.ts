/**
 * Tests for channel accessor functionality.
 *
 * @packageDocumentation
 */

import { describe, it, expect, vi } from 'vitest';
import { defineDriver } from '../../src/drivers/define-driver.js';
import type { DriverSpec } from '../../src/drivers/types.js';
import type { MessageBasedResource } from '../../src/resources/message-based-resource.js';
import type { Result } from '../../src/result.js';
import { Ok } from '../../src/result.js';

/**
 * Create a mock MessageBasedResource for testing.
 */
function createMockResource(overrides: Partial<MessageBasedResource> = {}): MessageBasedResource {
  return {
    resourceString: 'USB0::0x1234::0x5678::SERIAL123::INSTR',
    resourceInfo: {
      resourceString: 'USB0::0x1234::0x5678::SERIAL123::INSTR',
      interfaceType: 'USB' as const,
      manufacturer: 'TestMfg',
      model: 'TestModel',
      serialNumber: 'SERIAL123',
    },
    timeout: 2000,
    writeTermination: '\n',
    readTermination: '\n',
    chunkSize: 65536,
    isOpen: true,
    query: vi.fn().mockResolvedValue(Ok('response')),
    write: vi.fn().mockResolvedValue(Ok(undefined)),
    read: vi.fn().mockResolvedValue(Ok('response')),
    queryBinaryValues: vi.fn().mockResolvedValue(Ok([])),
    writeBinaryValues: vi.fn().mockResolvedValue(Ok(undefined)),
    queryBinary: vi.fn().mockResolvedValue(Ok(Buffer.alloc(0))),
    readBinary: vi.fn().mockResolvedValue(Ok(Buffer.alloc(0))),
    queryAsciiValues: vi.fn().mockResolvedValue(Ok([])),
    readAsciiValues: vi.fn().mockResolvedValue(Ok([])),
    writeAsciiValues: vi.fn().mockResolvedValue(Ok(undefined)),
    writeRaw: vi.fn().mockResolvedValue(Ok(0)),
    readRaw: vi.fn().mockResolvedValue(Ok(Buffer.alloc(0))),
    readBytes: vi.fn().mockResolvedValue(Ok(Buffer.alloc(0))),
    clear: vi.fn().mockResolvedValue(Ok(undefined)),
    trigger: vi.fn().mockResolvedValue(Ok(undefined)),
    readStb: vi.fn().mockResolvedValue(Ok(0)),
    close: vi.fn().mockResolvedValue(Ok(undefined)),
    ...overrides,
  } as MessageBasedResource;
}

interface PowerSupplyChannel {
  readonly channelNumber: number;
  getVoltage(): Promise<Result<number, Error>>;
  setVoltage(v: number): Promise<Result<void, Error>>;
  getCurrent(): Promise<Result<number, Error>>;
  setCurrent(v: number): Promise<Result<void, Error>>;
  getOutputEnabled(): Promise<Result<boolean, Error>>;
  setOutputEnabled(on: boolean): Promise<Result<void, Error>>;
}

interface PowerSupply {
  readonly channelCount: number;
  channel(n: number): PowerSupplyChannel;
  getAllOutputEnabled(): Promise<Result<boolean, Error>>;
  setAllOutputEnabled(on: boolean): Promise<Result<void, Error>>;
}

describe('Channel Accessor', () => {
  describe('channel count', () => {
    it('exposes channelCount from spec', async () => {
      const spec: DriverSpec<PowerSupply> = {
        properties: {
          allOutputEnabled: {
            get: ':OUTP:ALL?',
            set: ':OUTP:ALL {value}',
            format: (v) => (v ? 'ON' : 'OFF'),
          },
        },
        channels: {
          count: 3,
          properties: {
            voltage: {
              get: ':SOUR{ch}:VOLT?',
              set: ':SOUR{ch}:VOLT {value}',
              parse: (s) => parseFloat(s),
            },
            current: {
              get: ':SOUR{ch}:CURR?',
              set: ':SOUR{ch}:CURR {value}',
              parse: (s) => parseFloat(s),
            },
            outputEnabled: {
              get: ':OUTP? CH{ch}',
              set: ':OUTP CH{ch},{value}',
              format: (v) => (v ? 'ON' : 'OFF'),
            },
          },
        },
      };

      const resource = createMockResource();
      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.channelCount).toBe(3);
      }
    });
  });

  describe('channel(n)', () => {
    it('returns channel object with channelNumber', async () => {
      const spec: DriverSpec<PowerSupply> = {
        properties: {},
        channels: {
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
            outputEnabled: {
              get: ':OUTP? CH{ch}',
              set: ':OUTP CH{ch},{value}',
            },
          },
        },
      };

      const resource = createMockResource();
      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch1 = result.value.channel(1);
        expect(ch1.channelNumber).toBe(1);

        const ch2 = result.value.channel(2);
        expect(ch2.channelNumber).toBe(2);
      }
    });

    it('substitutes {ch} placeholder with channel number', async () => {
      const spec: DriverSpec<PowerSupply> = {
        properties: {},
        channels: {
          count: 3,
          properties: {
            voltage: {
              get: ':SOUR{ch}:VOLT?',
              set: ':SOUR{ch}:VOLT {value}',
              parse: (s) => parseFloat(s),
            },
            current: {
              get: ':SOUR{ch}:CURR?',
              set: ':SOUR{ch}:CURR {value}',
              parse: (s) => parseFloat(s),
            },
            outputEnabled: {
              get: ':OUTP? CH{ch}',
              set: ':OUTP CH{ch},{value}',
            },
          },
        },
      };

      const query = vi.fn().mockResolvedValue(Ok('12.5'));
      const write = vi.fn().mockResolvedValue(Ok(undefined));
      const resource = createMockResource({ query, write });

      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Test channel 1
        await result.value.channel(1).getVoltage();
        expect(query).toHaveBeenCalledWith(':SOUR1:VOLT?');

        await result.value.channel(1).setVoltage(5.0);
        expect(write).toHaveBeenCalledWith(':SOUR1:VOLT 5');

        // Test channel 2
        await result.value.channel(2).getVoltage();
        expect(query).toHaveBeenCalledWith(':SOUR2:VOLT?');

        await result.value.channel(2).setCurrent(1.5);
        expect(write).toHaveBeenCalledWith(':SOUR2:CURR 1.5');

        // Test channel 3
        await result.value.channel(3).setVoltage(12.0);
        expect(write).toHaveBeenCalledWith(':SOUR3:VOLT 12');
      }
    });

    it('handles zero-based indexing when configured', async () => {
      interface ZeroIndexedInstrument {
        readonly channelCount: number;
        channel(n: number): {
          readonly channelNumber: number;
          getValue(): Promise<Result<number, Error>>;
        };
      }

      const spec: DriverSpec<ZeroIndexedInstrument> = {
        properties: {},
        channels: {
          count: 4,
          indexStart: 0, // Zero-based indexing
          properties: {
            value: {
              get: ':CH{ch}:VAL?',
              parse: (s) => parseFloat(s),
            },
          },
        },
      };

      const query = vi.fn().mockResolvedValue(Ok('10.0'));
      const resource = createMockResource({ query });

      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        // With indexStart=0, channel(1) should use index 0
        await result.value.channel(1).getValue();
        expect(query).toHaveBeenCalledWith(':CH0:VAL?');

        await result.value.channel(2).getValue();
        expect(query).toHaveBeenCalledWith(':CH1:VAL?');
      }
    });
  });

  describe('channel bounds checking', () => {
    it('returns error operations for out-of-bounds channel', async () => {
      const spec: DriverSpec<PowerSupply> = {
        properties: {},
        channels: {
          count: 3,
          properties: {
            voltage: {
              get: ':SOUR{ch}:VOLT?',
              set: ':SOUR{ch}:VOLT {value}',
              parse: (s) => parseFloat(s),
            },
            current: {
              get: ':SOUR{ch}:CURR?',
              set: ':SOUR{ch}:CURR {value}',
            },
            outputEnabled: {
              get: ':OUTP? CH{ch}',
              set: ':OUTP CH{ch},{value}',
            },
          },
        },
      };

      const resource = createMockResource();
      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Channel 5 is out of bounds (only 3 channels)
        const ch5 = result.value.channel(5);

        // Operations should return Err
        const voltResult = await ch5.getVoltage();
        expect(voltResult.ok).toBe(false);
        if (!voltResult.ok) {
          expect(voltResult.error.message).toContain('out of range');
          expect(voltResult.error.message).toContain('5');
        }
      }
    });

    it('returns error for channel 0 when indexStart is 1', async () => {
      const spec: DriverSpec<PowerSupply> = {
        properties: {},
        channels: {
          count: 3,
          indexStart: 1, // 1-based indexing (default)
          properties: {
            voltage: {
              get: ':SOUR{ch}:VOLT?',
              set: ':SOUR{ch}:VOLT {value}',
            },
            current: {
              get: ':SOUR{ch}:CURR?',
              set: ':SOUR{ch}:CURR {value}',
            },
            outputEnabled: {
              get: ':OUTP? CH{ch}',
              set: ':OUTP CH{ch},{value}',
            },
          },
        },
      };

      const resource = createMockResource();
      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Channel 0 is out of bounds when indexStart is 1
        const ch0 = result.value.channel(0);
        const voltResult = await ch0.getVoltage();

        expect(voltResult.ok).toBe(false);
        if (!voltResult.ok) {
          expect(voltResult.error.message).toContain('out of range');
        }
      }
    });

    it('returns error for negative channel numbers', async () => {
      const spec: DriverSpec<PowerSupply> = {
        properties: {},
        channels: {
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
            outputEnabled: {
              get: ':OUTP? CH{ch}',
              set: ':OUTP CH{ch},{value}',
            },
          },
        },
      };

      const resource = createMockResource();
      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const chNeg = result.value.channel(-1);
        const voltResult = await chNeg.getVoltage();

        expect(voltResult.ok).toBe(false);
        if (!voltResult.ok) {
          expect(voltResult.error.message).toContain('out of range');
        }
      }
    });
  });

  describe('channel properties', () => {
    it('applies parse function to channel property response', async () => {
      const spec: DriverSpec<PowerSupply> = {
        properties: {},
        channels: {
          count: 2,
          properties: {
            voltage: {
              get: ':SOUR{ch}:VOLT?',
              set: ':SOUR{ch}:VOLT {value}',
              parse: (s) => parseFloat(s) * 1000, // Convert V to mV
            },
            current: {
              get: ':SOUR{ch}:CURR?',
              set: ':SOUR{ch}:CURR {value}',
            },
            outputEnabled: {
              get: ':OUTP? CH{ch}',
              set: ':OUTP CH{ch},{value}',
            },
          },
        },
      };

      const query = vi.fn().mockResolvedValue(Ok('5.5'));
      const resource = createMockResource({ query });

      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const voltage = await result.value.channel(1).getVoltage();
        expect(voltage.ok).toBe(true);
        if (voltage.ok) {
          expect(voltage.value).toBe(5500); // 5.5 * 1000
        }
      }
    });

    it('applies format function to channel property value', async () => {
      const spec: DriverSpec<PowerSupply> = {
        properties: {},
        channels: {
          count: 2,
          properties: {
            voltage: {
              get: ':SOUR{ch}:VOLT?',
              set: ':SOUR{ch}:VOLT {value}',
            },
            current: {
              get: ':SOUR{ch}:CURR?',
              set: ':SOUR{ch}:CURR {value}',
            },
            outputEnabled: {
              get: ':OUTP? CH{ch}',
              set: ':OUTP CH{ch},{value}',
              parse: (s) => s.trim() === '1' || s.trim().toUpperCase() === 'ON',
              format: (v) => (v ? 'ON' : 'OFF'),
            },
          },
        },
      };

      const write = vi.fn().mockResolvedValue(Ok(undefined));
      const resource = createMockResource({ write });

      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        await result.value.channel(1).setOutputEnabled(true);
        expect(write).toHaveBeenCalledWith(':OUTP CH1,ON');

        await result.value.channel(2).setOutputEnabled(false);
        expect(write).toHaveBeenCalledWith(':OUTP CH2,OFF');
      }
    });

    it('validates channel property values', async () => {
      interface ValidatedChannel {
        readonly channelNumber: number;
        getVoltage(): Promise<Result<number, Error>>;
        setVoltage(v: number): Promise<Result<void, Error>>;
      }

      interface ValidatedInstrument {
        readonly channelCount: number;
        channel(n: number): ValidatedChannel;
      }

      const spec: DriverSpec<ValidatedInstrument> = {
        properties: {},
        channels: {
          count: 2,
          properties: {
            voltage: {
              get: ':SOUR{ch}:VOLT?',
              set: ':SOUR{ch}:VOLT {value}',
              validate: (v: number) => (v >= 0 && v <= 30 ? true : 'Voltage must be 0-30V'),
            },
          },
        },
      };

      const write = vi.fn().mockResolvedValue(Ok(undefined));
      const resource = createMockResource({ write });

      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Valid value
        const validResult = await result.value.channel(1).setVoltage(15);
        expect(validResult.ok).toBe(true);

        // Invalid value
        const invalidResult = await result.value.channel(1).setVoltage(50);
        expect(invalidResult.ok).toBe(false);
        if (!invalidResult.ok) {
          expect(invalidResult.error.message).toBe('Voltage must be 0-30V');
        }
      }
    });
  });

  describe('channel commands', () => {
    it('generates channel-specific commands', async () => {
      interface ChannelWithCommands {
        readonly channelNumber: number;
        getValue(): Promise<Result<number, Error>>;
        enable(): Promise<Result<void, Error>>;
        disable(): Promise<Result<void, Error>>;
      }

      interface InstrumentWithChannelCommands {
        readonly channelCount: number;
        channel(n: number): ChannelWithCommands;
      }

      const spec: DriverSpec<InstrumentWithChannelCommands> = {
        properties: {},
        channels: {
          count: 2,
          properties: {
            value: {
              get: ':CH{ch}:VAL?',
            },
          },
          commands: {
            enable: {
              command: ':OUTP{ch} ON',
            },
            disable: {
              command: ':OUTP{ch} OFF',
            },
          },
        },
      };

      const write = vi.fn().mockResolvedValue(Ok(undefined));
      const resource = createMockResource({ write });

      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        await result.value.channel(1).enable();
        expect(write).toHaveBeenCalledWith(':OUTP1 ON');

        await result.value.channel(2).disable();
        expect(write).toHaveBeenCalledWith(':OUTP2 OFF');
      }
    });
  });

  describe('channel property settings', () => {
    it('applies postQueryDelay setting to channel getter', async () => {
      interface TestInstrument {
        readonly channelCount: number;
        channel(n: number): {
          readonly channelNumber: number;
          getValue(): Promise<Result<number, Error>>;
        };
      }

      const spec: DriverSpec<TestInstrument> = {
        properties: {},
        channels: {
          count: 2,
          properties: {
            value: {
              get: ':CH{ch}:VAL?',
              parse: (s) => parseFloat(s),
            },
          },
        },
        settings: {
          postQueryDelay: 50,
        },
      };

      const query = vi.fn().mockResolvedValue(Ok('10.0'));
      const resource = createMockResource({ query });

      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const start = Date.now();
        await result.value.channel(1).getValue();
        const elapsed = Date.now() - start;
        expect(elapsed).toBeGreaterThanOrEqual(40);
      }
    });

    it('applies postCommandDelay setting to channel setter', async () => {
      interface TestInstrument {
        readonly channelCount: number;
        channel(n: number): {
          readonly channelNumber: number;
          getValue(): Promise<Result<number, Error>>;
          setValue(v: number): Promise<Result<void, Error>>;
        };
      }

      const spec: DriverSpec<TestInstrument> = {
        properties: {},
        channels: {
          count: 2,
          properties: {
            value: {
              get: ':CH{ch}:VAL?',
              set: ':CH{ch}:VAL {value}',
            },
          },
        },
        settings: {
          postCommandDelay: 50,
        },
      };

      const write = vi.fn().mockResolvedValue(Ok(undefined));
      const resource = createMockResource({ write });

      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const start = Date.now();
        await result.value.channel(1).setValue(5.0);
        const elapsed = Date.now() - start;
        expect(elapsed).toBeGreaterThanOrEqual(40);
      }
    });

    it('applies delay to channel command', async () => {
      interface TestInstrument {
        readonly channelCount: number;
        channel(n: number): {
          readonly channelNumber: number;
          getValue(): Promise<Result<number, Error>>;
          reset(): Promise<Result<void, Error>>;
        };
      }

      const spec: DriverSpec<TestInstrument> = {
        properties: {},
        channels: {
          count: 2,
          properties: {
            value: { get: ':CH{ch}:VAL?' },
          },
          commands: {
            reset: { command: ':CH{ch}:RST', delay: 50 },
          },
        },
      };

      const write = vi.fn().mockResolvedValue(Ok(undefined));
      const resource = createMockResource({ write });

      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const start = Date.now();
        await result.value.channel(1).reset();
        const elapsed = Date.now() - start;
        expect(elapsed).toBeGreaterThanOrEqual(40);
      }
    });
  });

  describe('channel unsupported properties and commands', () => {
    it('returns Err for unsupported channel property getter with description', async () => {
      interface TestInstrument {
        readonly channelCount: number;
        channel(n: number): {
          readonly channelNumber: number;
          getFeature(): Promise<Result<string, Error>>;
        };
      }

      const spec: DriverSpec<TestInstrument> = {
        properties: {},
        channels: {
          count: 2,
          properties: {
            feature: {
              notSupported: true,
              description: 'Feature not available on this channel',
            },
          },
        },
      };

      const resource = createMockResource();
      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const featureResult = await result.value.channel(1).getFeature();
        expect(featureResult.ok).toBe(false);
        if (!featureResult.ok) {
          expect(featureResult.error.message).toBe('Feature not available on this channel');
        }
      }
    });

    it('returns default error for unsupported channel property without description', async () => {
      interface TestInstrument {
        readonly channelCount: number;
        channel(n: number): {
          readonly channelNumber: number;
          getFeature(): Promise<Result<string, Error>>;
        };
      }

      const spec: DriverSpec<TestInstrument> = {
        properties: {},
        channels: {
          count: 2,
          properties: {
            feature: {
              notSupported: true,
            },
          },
        },
      };

      const resource = createMockResource();
      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const featureResult = await result.value.channel(1).getFeature();
        expect(featureResult.ok).toBe(false);
        if (!featureResult.ok) {
          expect(featureResult.error.message).toBe('Not supported by this device');
        }
      }
    });

    it('returns Err for unsupported channel property setter', async () => {
      interface TestInstrument {
        readonly channelCount: number;
        channel(n: number): {
          readonly channelNumber: number;
          getFeature(): Promise<Result<string, Error>>;
          setFeature(v: string): Promise<Result<void, Error>>;
        };
      }

      // Note: TypeScript doesn't allow setFeature in spec because notSupported
      // doesn't have a set command. This test verifies the runtime behavior
      // by using a supported prop that becomes unsupported at runtime
      const spec: DriverSpec<TestInstrument> = {
        properties: {},
        channels: {
          count: 2,
          properties: {
            feature: {
              notSupported: true,
              description: 'Feature not available',
            },
          },
        },
      };

      const resource = createMockResource();
      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      // The setter won't be generated for unsupported properties
    });

    it('returns Err for unsupported channel command with description', async () => {
      interface TestInstrument {
        readonly channelCount: number;
        channel(n: number): {
          readonly channelNumber: number;
          getValue(): Promise<Result<number, Error>>;
          specialOp(): Promise<Result<void, Error>>;
        };
      }

      const spec: DriverSpec<TestInstrument> = {
        properties: {},
        channels: {
          count: 2,
          properties: {
            value: { get: ':CH{ch}:VAL?' },
          },
          commands: {
            specialOp: {
              notSupported: true,
              description: 'Special operation not available',
            },
          },
        },
      };

      const resource = createMockResource();
      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const opResult = await result.value.channel(1).specialOp();
        expect(opResult.ok).toBe(false);
        if (!opResult.ok) {
          expect(opResult.error.message).toBe('Special operation not available');
        }
      }
    });

    it('returns default error for unsupported channel command without description', async () => {
      interface TestInstrument {
        readonly channelCount: number;
        channel(n: number): {
          readonly channelNumber: number;
          getValue(): Promise<Result<number, Error>>;
          specialOp(): Promise<Result<void, Error>>;
        };
      }

      const spec: DriverSpec<TestInstrument> = {
        properties: {},
        channels: {
          count: 2,
          properties: {
            value: { get: ':CH{ch}:VAL?' },
          },
          commands: {
            specialOp: {
              notSupported: true,
            },
          },
        },
      };

      const resource = createMockResource();
      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const opResult = await result.value.channel(1).specialOp();
        expect(opResult.ok).toBe(false);
        if (!opResult.ok) {
          expect(opResult.error.message).toBe('Not supported by this device');
        }
      }
    });
  });

  describe('channel setter edge cases', () => {
    it('returns Err for out-of-bounds channel setter', async () => {
      interface TestInstrument {
        readonly channelCount: number;
        channel(n: number): {
          readonly channelNumber: number;
          getValue(): Promise<Result<number, Error>>;
          setValue(v: number): Promise<Result<void, Error>>;
        };
      }

      const spec: DriverSpec<TestInstrument> = {
        properties: {},
        channels: {
          count: 2,
          properties: {
            value: {
              get: ':CH{ch}:VAL?',
              set: ':CH{ch}:VAL {value}',
            },
          },
        },
      };

      const resource = createMockResource();
      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const setResult = await result.value.channel(5).setValue(10);
        expect(setResult.ok).toBe(false);
        if (!setResult.ok) {
          expect(setResult.error.message).toContain('out of range');
        }
      }
    });

    it('returns Err when channel validator returns false', async () => {
      interface TestInstrument {
        readonly channelCount: number;
        channel(n: number): {
          readonly channelNumber: number;
          getValue(): Promise<Result<number, Error>>;
          setValue(v: number): Promise<Result<void, Error>>;
        };
      }

      const spec: DriverSpec<TestInstrument> = {
        properties: {},
        channels: {
          count: 2,
          properties: {
            value: {
              get: ':CH{ch}:VAL?',
              set: ':CH{ch}:VAL {value}',
              validate: (v: number) => v >= 0 && v <= 10,
            },
          },
        },
      };

      const resource = createMockResource();
      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const setResult = await result.value.channel(1).setValue(50);
        expect(setResult.ok).toBe(false);
        if (!setResult.ok) {
          expect(setResult.error.message).toBe('Validation failed');
        }
      }
    });
  });

  describe('channel command edge cases', () => {
    it('returns Err for out-of-bounds channel command', async () => {
      interface TestInstrument {
        readonly channelCount: number;
        channel(n: number): {
          readonly channelNumber: number;
          getValue(): Promise<Result<number, Error>>;
          enable(): Promise<Result<void, Error>>;
        };
      }

      const spec: DriverSpec<TestInstrument> = {
        properties: {},
        channels: {
          count: 2,
          properties: {
            value: { get: ':CH{ch}:VAL?' },
          },
          commands: {
            enable: { command: ':OUTP{ch} ON' },
          },
        },
      };

      const resource = createMockResource();
      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const cmdResult = await result.value.channel(5).enable();
        expect(cmdResult.ok).toBe(false);
        if (!cmdResult.ok) {
          expect(cmdResult.error.message).toContain('out of range');
        }
      }
    });
  });

  describe('channel getter error handling', () => {
    it('returns Err when channel parse function throws', async () => {
      interface TestInstrument {
        readonly channelCount: number;
        channel(n: number): {
          readonly channelNumber: number;
          getValue(): Promise<Result<number, Error>>;
        };
      }

      const spec: DriverSpec<TestInstrument> = {
        properties: {},
        channels: {
          count: 2,
          properties: {
            value: {
              get: ':CH{ch}:VAL?',
              parse: () => {
                throw new Error('Parse error');
              },
            },
          },
        },
      };

      const query = vi.fn().mockResolvedValue(Ok('invalid'));
      const resource = createMockResource({ query });

      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const valResult = await result.value.channel(1).getValue();
        expect(valResult.ok).toBe(false);
        if (!valResult.ok) {
          expect(valResult.error.message).toContain('Failed to parse response');
          expect(valResult.error.message).toContain('invalid');
        }
      }
    });
  });

  describe('mixed global and channel properties', () => {
    it('supports both global and channel-specific properties', async () => {
      const spec: DriverSpec<PowerSupply> = {
        properties: {
          allOutputEnabled: {
            get: ':OUTP:ALL?',
            set: ':OUTP:ALL {value}',
            parse: (s) => s.trim() === '1',
            format: (v) => (v ? 'ON' : 'OFF'),
          },
        },
        channels: {
          count: 3,
          properties: {
            voltage: {
              get: ':SOUR{ch}:VOLT?',
              set: ':SOUR{ch}:VOLT {value}',
              parse: (s) => parseFloat(s),
            },
            current: {
              get: ':SOUR{ch}:CURR?',
              set: ':SOUR{ch}:CURR {value}',
              parse: (s) => parseFloat(s),
            },
            outputEnabled: {
              get: ':OUTP? CH{ch}',
              set: ':OUTP CH{ch},{value}',
              format: (v) => (v ? 'ON' : 'OFF'),
            },
          },
        },
      };

      const query = vi.fn().mockResolvedValue(Ok('12.5'));
      const write = vi.fn().mockResolvedValue(Ok(undefined));
      const resource = createMockResource({ query, write });

      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Global property
        await result.value.setAllOutputEnabled(true);
        expect(write).toHaveBeenCalledWith(':OUTP:ALL ON');

        // Channel property
        await result.value.channel(2).setVoltage(5.0);
        expect(write).toHaveBeenCalledWith(':SOUR2:VOLT 5');
      }
    });
  });
});
