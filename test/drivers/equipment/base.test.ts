/**
 * Tests for BaseInstrument interface and related types.
 *
 * @packageDocumentation
 */

import { describe, it, expect, vi } from 'vitest';
import type {
  BaseInstrument,
  InstrumentIdentity,
  InstrumentError,
} from '../../../src/drivers/equipment/base.js';
import { parseIdentity, parseError } from '../../../src/drivers/equipment/base.js';
import { Ok } from '../../../src/result.js';

describe('BaseInstrument types', () => {
  describe('InstrumentIdentity', () => {
    it('defines identity fields from *IDN? response', () => {
      const identity: InstrumentIdentity = {
        manufacturer: 'Rigol',
        model: 'DS1054Z',
        serialNumber: 'DS1ZA123456789',
        firmwareVersion: '00.04.04',
      };

      expect(identity.manufacturer).toBe('Rigol');
      expect(identity.model).toBe('DS1054Z');
      expect(identity.serialNumber).toBe('DS1ZA123456789');
      expect(identity.firmwareVersion).toBe('00.04.04');
    });
  });

  describe('InstrumentError', () => {
    it('defines SCPI error structure', () => {
      const error: InstrumentError = {
        code: -100,
        message: 'Command error',
      };

      expect(error.code).toBe(-100);
      expect(error.message).toBe('Command error');
    });

    it('represents no error with null', () => {
      const noError: InstrumentError | null = null;
      expect(noError).toBeNull();
    });
  });

  describe('BaseInstrument interface', () => {
    it('defines required identity properties', () => {
      // This is a type-only test to ensure the interface is correct
      const mockInstrument: BaseInstrument = {
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
        manufacturer: 'Rigol',
        model: 'DS1054Z',
        serialNumber: 'DS1ZA123456789',
        firmwareVersion: '00.04.04',
        resource: {} as BaseInstrument['resource'],
        capabilities: [],
        hasCapability: () => false,
        reset: vi.fn().mockResolvedValue(Ok(undefined)),
        clear: vi.fn().mockResolvedValue(Ok(undefined)),
        selfTest: vi.fn().mockResolvedValue(Ok(true)),
        getError: vi.fn().mockResolvedValue(Ok(null)),
        close: vi.fn().mockResolvedValue(Ok(undefined)),
      };

      expect(mockInstrument.resourceString).toBe('USB0::0x1AB1::0x04CE::DS1ZA123::INSTR');
      expect(mockInstrument.manufacturer).toBe('Rigol');
      expect(mockInstrument.model).toBe('DS1054Z');
      expect(mockInstrument.serialNumber).toBe('DS1ZA123456789');
      expect(mockInstrument.firmwareVersion).toBe('00.04.04');
    });

    it('defines reset method', async () => {
      const reset = vi.fn().mockResolvedValue(Ok(undefined));

      const mockInstrument = createMockBaseInstrument({ reset });
      const result = await mockInstrument.reset();

      expect(result.ok).toBe(true);
      expect(reset).toHaveBeenCalledTimes(1);
    });

    it('defines clear method', async () => {
      const clear = vi.fn().mockResolvedValue(Ok(undefined));

      const mockInstrument = createMockBaseInstrument({ clear });
      const result = await mockInstrument.clear();

      expect(result.ok).toBe(true);
      expect(clear).toHaveBeenCalledTimes(1);
    });

    it('defines selfTest method', async () => {
      const selfTest = vi.fn().mockResolvedValue(Ok(true));

      const mockInstrument = createMockBaseInstrument({ selfTest });
      const result = await mockInstrument.selfTest();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(true);
      }
    });

    it('defines getError method that returns error or null', async () => {
      const getError = vi.fn().mockResolvedValue(Ok({ code: -100, message: 'Command error' }));

      const mockInstrument = createMockBaseInstrument({ getError });
      const result = await mockInstrument.getError();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual({ code: -100, message: 'Command error' });
      }
    });

    it('getError returns null when no error', async () => {
      const getError = vi.fn().mockResolvedValue(Ok(null));

      const mockInstrument = createMockBaseInstrument({ getError });
      const result = await mockInstrument.getError();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeNull();
      }
    });

    it('defines close method', async () => {
      const close = vi.fn().mockResolvedValue(Ok(undefined));

      const mockInstrument = createMockBaseInstrument({ close });
      const result = await mockInstrument.close();

      expect(result.ok).toBe(true);
      expect(close).toHaveBeenCalledTimes(1);
    });

    it('exposes capabilities array', () => {
      const mockInstrument = createMockBaseInstrument({
        capabilities: ['fft', 'protocol-decode'],
      });

      expect(mockInstrument.capabilities).toEqual(['fft', 'protocol-decode']);
    });

    it('hasCapability returns true for supported capabilities', () => {
      const mockInstrument = createMockBaseInstrument({
        capabilities: ['fft', 'protocol-decode'],
        hasCapability: (cap: string) => ['fft', 'protocol-decode'].includes(cap),
      });

      expect(mockInstrument.hasCapability('fft')).toBe(true);
      expect(mockInstrument.hasCapability('nonexistent')).toBe(false);
    });
  });
});

/**
 * Helper to create a mock BaseInstrument for testing.
 */
function createMockBaseInstrument(overrides: Partial<BaseInstrument> = {}): BaseInstrument {
  return {
    resourceString: 'USB0::0x1234::0x5678::SERIAL123::INSTR',
    manufacturer: 'TestMfg',
    model: 'TestModel',
    serialNumber: 'SERIAL123',
    firmwareVersion: '1.0.0',
    resource: {} as BaseInstrument['resource'],
    capabilities: [],
    hasCapability: () => false,
    reset: vi.fn().mockResolvedValue(Ok(undefined)),
    clear: vi.fn().mockResolvedValue(Ok(undefined)),
    selfTest: vi.fn().mockResolvedValue(Ok(true)),
    getError: vi.fn().mockResolvedValue(Ok(null)),
    close: vi.fn().mockResolvedValue(Ok(undefined)),
    ...overrides,
  };
}

describe('parseIdentity', () => {
  it('parses standard *IDN? response', () => {
    const identity = parseIdentity('RIGOL TECHNOLOGIES,DS1054Z,DS1ZA123456789,00.04.04');

    expect(identity.manufacturer).toBe('RIGOL TECHNOLOGIES');
    expect(identity.model).toBe('DS1054Z');
    expect(identity.serialNumber).toBe('DS1ZA123456789');
    expect(identity.firmwareVersion).toBe('00.04.04');
  });

  it('handles Keysight format', () => {
    const identity = parseIdentity(
      'Keysight Technologies,34465A,MY54500001,A.02.14-02.40-02.14-00.49-02-01'
    );

    expect(identity.manufacturer).toBe('Keysight Technologies');
    expect(identity.model).toBe('34465A');
    expect(identity.serialNumber).toBe('MY54500001');
    expect(identity.firmwareVersion).toBe('A.02.14-02.40-02.14-00.49-02-01');
  });

  it('handles extra whitespace', () => {
    const identity = parseIdentity('  Rigol  ,  DS1054Z  ,  SERIAL  ,  1.0.0  ');

    expect(identity.manufacturer).toBe('Rigol');
    expect(identity.model).toBe('DS1054Z');
    expect(identity.serialNumber).toBe('SERIAL');
    expect(identity.firmwareVersion).toBe('1.0.0');
  });

  it('handles missing fields with defaults', () => {
    const identity = parseIdentity('Manufacturer');

    expect(identity.manufacturer).toBe('Manufacturer');
    expect(identity.model).toBe('Unknown');
    expect(identity.serialNumber).toBe('Unknown');
    expect(identity.firmwareVersion).toBe('Unknown');
  });

  it('handles empty string', () => {
    const identity = parseIdentity('');

    expect(identity.manufacturer).toBe('Unknown');
    expect(identity.model).toBe('Unknown');
    expect(identity.serialNumber).toBe('Unknown');
    expect(identity.firmwareVersion).toBe('Unknown');
  });
});

describe('parseError', () => {
  it('parses standard SCPI error format with double quotes', () => {
    const error = parseError('-100,"Command error"');

    expect(error).not.toBeNull();
    expect(error?.code).toBe(-100);
    expect(error?.message).toBe('Command error');
  });

  it('parses error with single quotes', () => {
    const error = parseError("-200,'Execution error'");

    expect(error).not.toBeNull();
    expect(error?.code).toBe(-200);
    expect(error?.message).toBe('Execution error');
  });

  it('parses error without quotes', () => {
    const error = parseError('-300,Device-specific error');

    expect(error).not.toBeNull();
    expect(error?.code).toBe(-300);
    expect(error?.message).toBe('Device-specific error');
  });

  it('returns null for no error (code 0)', () => {
    const error = parseError('0,"No error"');

    expect(error).toBeNull();
  });

  it('handles positive error codes', () => {
    const error = parseError('100,"Custom warning"');

    expect(error).not.toBeNull();
    expect(error?.code).toBe(100);
    expect(error?.message).toBe('Custom warning');
  });

  it('handles whitespace', () => {
    const error = parseError('  -100  ,  "Error message"  ');

    expect(error).not.toBeNull();
    expect(error?.code).toBe(-100);
    expect(error?.message).toBe('Error message');
  });

  it('returns error object for unparseable response', () => {
    const error = parseError('invalid format without comma');

    expect(error).not.toBeNull();
    expect(error?.code).toBe(-1);
    expect(error?.message).toContain('Failed to parse');
  });
});
