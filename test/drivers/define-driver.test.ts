/**
 * Tests for the defineDriver factory function.
 *
 * @packageDocumentation
 */

import { describe, it, expect, vi } from 'vitest';
import { defineDriver } from '../../src/drivers/define-driver.js';
import type { DriverSpec } from '../../src/drivers/types.js';
import type { MessageBasedResource } from '../../src/resources/message-based-resource.js';
import type { Result } from '../../src/result.js';
import { Ok, Err } from '../../src/result.js';

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

describe('defineDriver', () => {
  describe('basic driver creation', () => {
    it('creates a driver from a minimal spec', () => {
      interface SimpleInstrument {
        getValue(): Promise<Result<number, Error>>;
      }

      const spec: DriverSpec<SimpleInstrument> = {
        properties: {
          value: {
            get: ':VAL?',
            parse: (s) => parseFloat(s),
          },
        },
      };

      const driver = defineDriver(spec);
      expect(driver).toBeDefined();
      expect(driver.connect).toBeInstanceOf(Function);
    });

    it('returns driver with spec metadata accessible', () => {
      interface TestInstrument {
        getValue(): Promise<Result<number, Error>>;
      }

      const spec: DriverSpec<TestInstrument> = {
        type: 'test-instrument',
        manufacturer: 'TestCorp',
        models: ['Model1', 'Model2'],
        properties: {
          value: { get: ':VAL?' },
        },
      };

      const driver = defineDriver(spec);
      expect(driver.spec).toBe(spec);
      expect(driver.spec.type).toBe('test-instrument');
      expect(driver.spec.manufacturer).toBe('TestCorp');
    });
  });

  describe('connect()', () => {
    it('connects to a resource and returns instrument instance', async () => {
      interface TestInstrument {
        getValue(): Promise<Result<number, Error>>;
        setValue(v: number): Promise<Result<void, Error>>;
        readonly resource: MessageBasedResource;
      }

      const spec: DriverSpec<TestInstrument> = {
        properties: {
          value: {
            get: ':VAL?',
            set: ':VAL {value}',
            parse: (s) => parseFloat(s),
          },
        },
      };

      const resource = createMockResource({
        query: vi.fn().mockResolvedValue(Ok('123.45')),
      });

      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeDefined();
        expect(result.value.resource).toBe(resource);
        expect(result.value.getValue).toBeInstanceOf(Function);
        expect(result.value.setValue).toBeInstanceOf(Function);
      }
    });

    it('returns Err when resource is not open', async () => {
      interface TestInstrument {
        getValue(): Promise<Result<number, Error>>;
      }

      const spec: DriverSpec<TestInstrument> = {
        properties: {
          value: { get: ':VAL?' },
        },
      };

      const resource = createMockResource({ isOpen: false });

      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not open');
      }
    });

    it('calls onConnect hook when connecting', async () => {
      interface TestInstrument {
        getValue(): Promise<Result<number, Error>>;
      }

      const onConnect = vi.fn().mockResolvedValue(Ok(undefined));

      const spec: DriverSpec<TestInstrument> = {
        properties: {
          value: { get: ':VAL?' },
        },
        hooks: {
          onConnect,
        },
      };

      const resource = createMockResource();

      const driver = defineDriver(spec);
      await driver.connect(resource);

      expect(onConnect).toHaveBeenCalledTimes(1);
    });

    it('returns Err when onConnect hook fails', async () => {
      interface TestInstrument {
        getValue(): Promise<Result<number, Error>>;
      }

      const onConnect = vi.fn().mockResolvedValue(Err(new Error('Connection setup failed')));

      const spec: DriverSpec<TestInstrument> = {
        properties: {
          value: { get: ':VAL?' },
        },
        hooks: {
          onConnect,
        },
      };

      const resource = createMockResource();

      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Connection setup failed');
      }
    });

    it('sends *RST when resetOnConnect quirk is enabled', async () => {
      interface TestInstrument {
        getValue(): Promise<Result<number, Error>>;
      }

      const spec: DriverSpec<TestInstrument> = {
        properties: {
          value: { get: ':VAL?' },
        },
        quirks: {
          resetOnConnect: true,
        },
      };

      const write = vi.fn().mockResolvedValue(Ok(undefined));
      const resource = createMockResource({ write });

      const driver = defineDriver(spec);
      await driver.connect(resource);

      expect(write).toHaveBeenCalledWith('*RST');
    });

    it('sends *CLS when clearOnConnect quirk is enabled', async () => {
      interface TestInstrument {
        getValue(): Promise<Result<number, Error>>;
      }

      const spec: DriverSpec<TestInstrument> = {
        properties: {
          value: { get: ':VAL?' },
        },
        quirks: {
          clearOnConnect: true,
        },
      };

      const write = vi.fn().mockResolvedValue(Ok(undefined));
      const resource = createMockResource({ write });

      const driver = defineDriver(spec);
      await driver.connect(resource);

      expect(write).toHaveBeenCalledWith('*CLS');
    });
  });

  describe('property access', () => {
    it('generates getter for property with get command', async () => {
      interface TestInstrument {
        getVoltage(): Promise<Result<number, Error>>;
      }

      const spec: DriverSpec<TestInstrument> = {
        properties: {
          voltage: {
            get: ':VOLT?',
            parse: (s) => parseFloat(s),
          },
        },
      };

      const query = vi.fn().mockResolvedValue(Ok('12.5'));
      const resource = createMockResource({ query });

      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const volts = await result.value.getVoltage();
        expect(volts.ok).toBe(true);
        if (volts.ok) {
          expect(volts.value).toBe(12.5);
        }
        expect(query).toHaveBeenCalledWith(':VOLT?');
      }
    });

    it('generates setter for property with set command', async () => {
      interface TestInstrument {
        setVoltage(v: number): Promise<Result<void, Error>>;
      }

      const spec: DriverSpec<TestInstrument> = {
        properties: {
          voltage: {
            get: ':VOLT?',
            set: ':VOLT {value}',
          },
        },
      };

      const write = vi.fn().mockResolvedValue(Ok(undefined));
      const resource = createMockResource({ write });

      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const setResult = await result.value.setVoltage(5.5);
        expect(setResult.ok).toBe(true);
        expect(write).toHaveBeenCalledWith(':VOLT 5.5');
      }
    });

    it('uses format function when setting property', async () => {
      interface TestInstrument {
        setOutput(on: boolean): Promise<Result<void, Error>>;
      }

      const spec: DriverSpec<TestInstrument> = {
        properties: {
          output: {
            get: ':OUTP?',
            set: ':OUTP {value}',
            format: (v: boolean) => (v ? 'ON' : 'OFF'),
          },
        },
      };

      const write = vi.fn().mockResolvedValue(Ok(undefined));
      const resource = createMockResource({ write });

      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        await result.value.setOutput(true);
        expect(write).toHaveBeenCalledWith(':OUTP ON');

        await result.value.setOutput(false);
        expect(write).toHaveBeenCalledWith(':OUTP OFF');
      }
    });

    it('validates value before setting', async () => {
      interface TestInstrument {
        setVoltage(v: number): Promise<Result<void, Error>>;
      }

      const spec: DriverSpec<TestInstrument> = {
        properties: {
          voltage: {
            get: ':VOLT?',
            set: ':VOLT {value}',
            validate: (v: number) => (v >= 0 && v <= 30 ? true : 'Voltage must be 0-30V'),
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
        const validResult = await result.value.setVoltage(15);
        expect(validResult.ok).toBe(true);

        // Invalid value
        const invalidResult = await result.value.setVoltage(50);
        expect(invalidResult.ok).toBe(false);
        if (!invalidResult.ok) {
          expect(invalidResult.error.message).toBe('Voltage must be 0-30V');
        }
        // Write should not be called for invalid value
        expect(write).toHaveBeenCalledTimes(1);
      }
    });

    it('returns Err when query fails', async () => {
      interface TestInstrument {
        getVoltage(): Promise<Result<number, Error>>;
      }

      const spec: DriverSpec<TestInstrument> = {
        properties: {
          voltage: {
            get: ':VOLT?',
            parse: (s) => parseFloat(s),
          },
        },
      };

      const query = vi.fn().mockResolvedValue(Err(new Error('Timeout')));
      const resource = createMockResource({ query });

      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const volts = await result.value.getVoltage();
        expect(volts.ok).toBe(false);
        if (!volts.ok) {
          expect(volts.error.message).toBe('Timeout');
        }
      }
    });

    it('returns Err when write fails', async () => {
      interface TestInstrument {
        setVoltage(v: number): Promise<Result<void, Error>>;
      }

      const spec: DriverSpec<TestInstrument> = {
        properties: {
          voltage: {
            get: ':VOLT?',
            set: ':VOLT {value}',
          },
        },
      };

      const write = vi.fn().mockResolvedValue(Err(new Error('Write failed')));
      const resource = createMockResource({ write });

      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const setResult = await result.value.setVoltage(5.0);
        expect(setResult.ok).toBe(false);
        if (!setResult.ok) {
          expect(setResult.error.message).toBe('Write failed');
        }
      }
    });

    it('returns Err when parse function throws', async () => {
      interface TestInstrument {
        getValue(): Promise<Result<number, Error>>;
      }

      const spec: DriverSpec<TestInstrument> = {
        properties: {
          value: {
            get: ':VAL?',
            parse: () => {
              throw new Error('Parse error');
            },
          },
        },
      };

      const query = vi.fn().mockResolvedValue(Ok('invalid-data'));
      const resource = createMockResource({ query });

      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const valueResult = await result.value.getValue();
        expect(valueResult.ok).toBe(false);
        if (!valueResult.ok) {
          expect(valueResult.error.message).toContain('Failed to parse response');
          expect(valueResult.error.message).toContain('invalid-data');
        }
      }
    });
  });

  describe('commands', () => {
    it('generates method for command', async () => {
      interface TestInstrument {
        reset(): Promise<Result<void, Error>>;
      }

      const spec: DriverSpec<TestInstrument> = {
        properties: {},
        commands: {
          reset: {
            command: '*RST',
          },
        },
      };

      const write = vi.fn().mockResolvedValue(Ok(undefined));
      const resource = createMockResource({ write });

      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const resetResult = await result.value.reset();
        expect(resetResult.ok).toBe(true);
        expect(write).toHaveBeenCalledWith('*RST');
      }
    });

    it('applies post-command delay', async () => {
      interface TestInstrument {
        preset(): Promise<Result<void, Error>>;
      }

      const spec: DriverSpec<TestInstrument> = {
        properties: {},
        commands: {
          preset: {
            command: ':SYST:PRES',
            delay: 100,
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
        await result.value.preset();
        const elapsed = Date.now() - start;

        // Allow some tolerance for timing
        expect(elapsed).toBeGreaterThanOrEqual(90);
      }
    });
  });

  describe('capabilities', () => {
    it('exposes capabilities array on instrument', async () => {
      interface TestInstrument {
        readonly capabilities: readonly string[];
        hasCapability(cap: string): boolean;
      }

      const spec: DriverSpec<TestInstrument> = {
        properties: {},
        capabilities: ['fft', 'protocol-decode', 'math'],
      };

      const resource = createMockResource();

      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.capabilities).toEqual(['fft', 'protocol-decode', 'math']);
      }
    });

    it('hasCapability returns true for supported capabilities', async () => {
      interface TestInstrument {
        readonly capabilities: readonly string[];
        hasCapability(cap: string): boolean;
      }

      const spec: DriverSpec<TestInstrument> = {
        properties: {},
        capabilities: ['fft', 'protocol-decode'],
      };

      const resource = createMockResource();

      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.hasCapability('fft')).toBe(true);
        expect(result.value.hasCapability('protocol-decode')).toBe(true);
        expect(result.value.hasCapability('nonexistent')).toBe(false);
      }
    });
  });

  describe('close()', () => {
    it('calls onDisconnect hook when closing', async () => {
      interface TestInstrument {
        close(): Promise<Result<void, Error>>;
      }

      const onDisconnect = vi.fn().mockResolvedValue(Ok(undefined));

      const spec: DriverSpec<TestInstrument> = {
        properties: {},
        hooks: {
          onDisconnect,
        },
      };

      const resource = createMockResource();

      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        await result.value.close();
        expect(onDisconnect).toHaveBeenCalledTimes(1);
      }
    });

    it('closes the underlying resource', async () => {
      interface TestInstrument {
        close(): Promise<Result<void, Error>>;
      }

      const spec: DriverSpec<TestInstrument> = {
        properties: {},
      };

      const close = vi.fn().mockResolvedValue(Ok(undefined));
      const resource = createMockResource({ close });

      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        await result.value.close();
        expect(close).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('raw resource access', () => {
    it('exposes underlying resource for escape hatch', async () => {
      interface TestInstrument {
        readonly resource: MessageBasedResource;
      }

      const spec: DriverSpec<TestInstrument> = {
        properties: {},
      };

      const resource = createMockResource();

      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.resource).toBe(resource);
      }
    });
  });

  describe('quirks', () => {
    it('applies postCommandDelay after writes', async () => {
      interface TestInstrument {
        setVoltage(v: number): Promise<Result<void, Error>>;
      }

      const spec: DriverSpec<TestInstrument> = {
        properties: {
          voltage: {
            get: ':VOLT?',
            set: ':VOLT {value}',
          },
        },
        quirks: {
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
        await result.value.setVoltage(5.0);
        const elapsed = Date.now() - start;

        expect(elapsed).toBeGreaterThanOrEqual(40);
      }
    });

    it('applies postQueryDelay after queries', async () => {
      interface TestInstrument {
        getVoltage(): Promise<Result<number, Error>>;
      }

      const spec: DriverSpec<TestInstrument> = {
        properties: {
          voltage: {
            get: ':VOLT?',
            parse: (s) => parseFloat(s),
          },
        },
        quirks: {
          postQueryDelay: 50,
        },
      };

      const query = vi.fn().mockResolvedValue(Ok('12.5'));
      const resource = createMockResource({ query });

      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const start = Date.now();
        await result.value.getVoltage();
        const elapsed = Date.now() - start;

        expect(elapsed).toBeGreaterThanOrEqual(40);
      }
    });
  });

  describe('transform hooks', () => {
    it('transforms command before sending', async () => {
      interface TestInstrument {
        setVoltage(v: number): Promise<Result<void, Error>>;
      }

      const spec: DriverSpec<TestInstrument> = {
        properties: {
          voltage: {
            get: ':VOLT?',
            set: ':VOLT {value}',
          },
        },
        hooks: {
          transformCommand: (cmd) => cmd.toLowerCase(),
        },
      };

      const write = vi.fn().mockResolvedValue(Ok(undefined));
      const resource = createMockResource({ write });

      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        await result.value.setVoltage(5.0);
        expect(write).toHaveBeenCalledWith(':volt 5');
      }
    });

    it('transforms response after receiving', async () => {
      interface TestInstrument {
        getVoltage(): Promise<Result<number, Error>>;
      }

      const spec: DriverSpec<TestInstrument> = {
        properties: {
          voltage: {
            get: ':VOLT?',
            parse: (s) => parseFloat(s),
          },
        },
        hooks: {
          transformResponse: (_, response) => response.replace('V', ''),
        },
      };

      const query = vi.fn().mockResolvedValue(Ok('12.5V'));
      const resource = createMockResource({ query });

      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const volts = await result.value.getVoltage();
        expect(volts.ok).toBe(true);
        if (volts.ok) {
          expect(volts.value).toBe(12.5);
        }
      }
    });
  });

  describe('unsupported properties', () => {
    it('returns Err for unsupported property getter', async () => {
      interface TestInstrument {
        getBandwidthLimit(): Promise<Result<string, Error>>;
      }

      const spec: DriverSpec<TestInstrument> = {
        properties: {
          bandwidthLimit: {
            notSupported: true,
            description: 'Bandwidth limiting not available on this model',
          },
        },
      };

      const resource = createMockResource();

      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const bwResult = await result.value.getBandwidthLimit();
        expect(bwResult.ok).toBe(false);
        if (!bwResult.ok) {
          expect(bwResult.error.message).toBe('Bandwidth limiting not available on this model');
        }
      }
    });

    it('returns default error message when description not provided', async () => {
      interface TestInstrument {
        getFeature(): Promise<Result<string, Error>>;
      }

      const spec: DriverSpec<TestInstrument> = {
        properties: {
          feature: {
            notSupported: true,
          },
        },
      };

      const resource = createMockResource();

      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const featureResult = await result.value.getFeature();
        expect(featureResult.ok).toBe(false);
        if (!featureResult.ok) {
          expect(featureResult.error.message).toBe('Not supported by this device');
        }
      }
    });
  });

  describe('custom methods', () => {
    it('includes custom method implementations', async () => {
      interface TestInstrument {
        customOperation(): Promise<Result<string, Error>>;
      }

      const spec: DriverSpec<TestInstrument> = {
        properties: {},
        methods: {
          customOperation: async (ctx) => {
            const result = await ctx.query(':CUSTOM:CMD?');
            if (!result.ok) return result;
            return Ok(`Custom: ${result.value}`);
          },
        },
      };

      const query = vi.fn().mockResolvedValue(Ok('response'));
      const resource = createMockResource({ query });

      const driver = defineDriver(spec);
      const result = await driver.connect(resource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const customResult = await result.value.customOperation();
        expect(customResult.ok).toBe(true);
        if (customResult.ok) {
          expect(customResult.value).toBe('Custom: response');
        }
      }
    });
  });
});
