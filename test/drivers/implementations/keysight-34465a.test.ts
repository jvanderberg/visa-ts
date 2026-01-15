import { describe, it, expect, vi, beforeEach } from 'vitest';
import { keysight34465A } from '../../../src/drivers/implementations/keysight/34465a.js';
import type { MessageBasedResource } from '../../../src/resources/message-based-resource.js';
import { Ok, Err } from '../../../src/result.js';

describe('Keysight 34465A Driver', () => {
  let mockResource: MessageBasedResource;

  beforeEach(() => {
    mockResource = {
      resourceString: 'USB0::0x2A8D::0x0101::MY12345::INSTR',
      resourceInfo: {
        resourceString: 'USB0::0x2A8D::0x0101::MY12345::INSTR',
        interfaceType: 'USB',
      },
      timeout: 2000,
      writeTermination: '\n',
      readTermination: '\n',
      chunkSize: 65536,
      isOpen: true,
      query: vi.fn(),
      write: vi.fn(),
      read: vi.fn(),
      queryBinaryValues: vi.fn(),
      writeBinaryValues: vi.fn(),
      queryBinary: vi.fn(),
      readBinary: vi.fn(),
      queryAsciiValues: vi.fn(),
      readAsciiValues: vi.fn(),
      writeAsciiValues: vi.fn(),
      writeRaw: vi.fn(),
      readRaw: vi.fn(),
      readBytes: vi.fn(),
      clear: vi.fn(),
      trigger: vi.fn(),
      readStb: vi.fn(),
      close: vi.fn(),
    } as unknown as MessageBasedResource;

    vi.mocked(mockResource.write).mockResolvedValue(Ok(undefined));
    vi.mocked(mockResource.close).mockResolvedValue(Ok(undefined));
  });

  describe('driver specification', () => {
    it('has correct metadata', () => {
      expect(keysight34465A.spec.type).toBe('multimeter');
      expect(keysight34465A.spec.manufacturer).toBe('Keysight');
      expect(keysight34465A.spec.models).toContain('34465A');
    });

    it('declares capabilities', () => {
      expect(keysight34465A.spec.capabilities).toContain('data-logging');
      expect(keysight34465A.spec.capabilities).toContain('histogram');
    });
  });

  describe('connect', () => {
    it('queries device identity', async () => {
      vi.mocked(mockResource.query).mockResolvedValue(
        Ok('Keysight Technologies,34465A,MY12345678,A.02.14-02.40-02.14-00.49-02-01')
      );

      const result = await keysight34465A.connect(mockResource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.manufacturer).toBe('Keysight Technologies');
        expect(result.value.model).toBe('34465A');
      }
    });

    it('returns Err on connection failure', async () => {
      vi.mocked(mockResource.query).mockResolvedValue(Err(new Error('Timeout')));

      const result = await keysight34465A.connect(mockResource);

      expect(result.ok).toBe(false);
    });
  });

  describe('function selection', () => {
    beforeEach(() => {
      vi.mocked(mockResource.query).mockImplementation(async (cmd) => {
        if (cmd === '*IDN?') return Ok('Keysight,34465A,MY12345678,A.02.14');
        if (cmd === ':SENSe:FUNCtion?') return Ok('"VOLTage:DC"');
        return Err(new Error(`Unknown command: ${cmd}`));
      });
    });

    it('gets measurement function', async () => {
      const result = await keysight34465A.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const func = await result.value.getFunction();
        expect(func.ok).toBe(true);
        if (func.ok) {
          expect(func.value).toBe('VDC');
        }
      }
    });

    it('sets measurement function to VDC', async () => {
      const result = await keysight34465A.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        await result.value.setFunction('VDC');
        expect(mockResource.write).toHaveBeenCalledWith(':SENSe:FUNCtion "VOLTage:DC"');
      }
    });

    it('sets measurement function to VAC', async () => {
      const result = await keysight34465A.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        await result.value.setFunction('VAC');
        expect(mockResource.write).toHaveBeenCalledWith(':SENSe:FUNCtion "VOLTage:AC"');
      }
    });

    it('sets measurement function to resistance', async () => {
      const result = await keysight34465A.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        await result.value.setFunction('RESISTANCE_2W');
        expect(mockResource.write).toHaveBeenCalledWith(':SENSe:FUNCtion "RESistance"');
      }
    });
  });

  describe('range and resolution', () => {
    beforeEach(() => {
      vi.mocked(mockResource.query).mockImplementation(async (cmd) => {
        if (cmd === '*IDN?') return Ok('Keysight,34465A,MY12345678,A.02.14');
        if (cmd === ':SENSe:VOLTage:DC:RANGe?') return Ok('10');
        if (cmd === ':SENSe:VOLTage:DC:RANGe:AUTO?') return Ok('1');
        if (cmd === ':SENSe:VOLTage:DC:NPLC?') return Ok('10');
        return Err(new Error(`Unknown command: ${cmd}`));
      });
    });

    it('gets voltage range', async () => {
      const result = await keysight34465A.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const range = await result.value.getRange();
        expect(range.ok).toBe(true);
        if (range.ok) {
          expect(range.value).toBe(10);
        }
      }
    });

    it('sets voltage range', async () => {
      const result = await keysight34465A.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        await result.value.setRange(100);
        expect(mockResource.write).toHaveBeenCalledWith(':SENSe:VOLTage:DC:RANGe 100');
      }
    });

    it('sets auto range', async () => {
      const result = await keysight34465A.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        await result.value.setAutoRange(true);
        expect(mockResource.write).toHaveBeenCalledWith(':SENSe:VOLTage:DC:RANGe:AUTO ON');
      }
    });

    it('gets NPLC', async () => {
      const result = await keysight34465A.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const nplc = await result.value.getNplc();
        expect(nplc.ok).toBe(true);
        if (nplc.ok) {
          expect(nplc.value).toBe(10);
        }
      }
    });

    it('sets NPLC', async () => {
      const result = await keysight34465A.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        await result.value.setNplc(1);
        expect(mockResource.write).toHaveBeenCalledWith(':SENSe:VOLTage:DC:NPLC 1');
      }
    });
  });

  describe('measurement', () => {
    beforeEach(() => {
      vi.mocked(mockResource.query).mockImplementation(async (cmd) => {
        if (cmd === '*IDN?') return Ok('Keysight,34465A,MY12345678,A.02.14');
        if (cmd === ':MEASure:VOLTage:DC?') return Ok('+5.01234567E+00');
        if (cmd === ':READ?') return Ok('+5.01234567E+00');
        if (cmd === ':FETCh?') return Ok('+5.01234567E+00');
        return Err(new Error(`Unknown command: ${cmd}`));
      });
    });

    it('takes a measurement', async () => {
      const result = await keysight34465A.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const measurement = await result.value.measure();
        expect(measurement.ok).toBe(true);
        if (measurement.ok) {
          expect(measurement.value).toBeCloseTo(5.01234567, 6);
        }
      }
    });

    it('reads current value', async () => {
      const result = await keysight34465A.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const reading = await result.value.read();
        expect(reading.ok).toBe(true);
        if (reading.ok) {
          expect(reading.value).toBeCloseTo(5.01234567, 6);
        }
      }
    });

    it('fetches last measurement', async () => {
      const result = await keysight34465A.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const fetch = await result.value.fetch();
        expect(fetch.ok).toBe(true);
        if (fetch.ok) {
          expect(fetch.value).toBeCloseTo(5.01234567, 6);
        }
      }
    });
  });

  describe('triggering', () => {
    beforeEach(() => {
      vi.mocked(mockResource.query).mockImplementation(async (cmd) => {
        if (cmd === '*IDN?') return Ok('Keysight,34465A,MY12345678,A.02.14');
        if (cmd === ':TRIGger:SOURce?') return Ok('IMMediate');
        if (cmd === ':TRIGger:DELay?') return Ok('0.001');
        return Err(new Error(`Unknown command: ${cmd}`));
      });
    });

    it('gets trigger source', async () => {
      const result = await keysight34465A.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const source = await result.value.getTriggerSource();
        expect(source.ok).toBe(true);
        if (source.ok) {
          expect(source.value).toBe('IMMEDIATE');
        }
      }
    });

    it('sets trigger source', async () => {
      const result = await keysight34465A.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        await result.value.setTriggerSource('BUS');
        expect(mockResource.write).toHaveBeenCalledWith(':TRIGger:SOURce BUS');
      }
    });

    it('sends initiate command', async () => {
      const result = await keysight34465A.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        await result.value.initiate();
        expect(mockResource.write).toHaveBeenCalledWith(':INITiate');
      }
    });

    it('sends abort command', async () => {
      const result = await keysight34465A.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        await result.value.abort();
        expect(mockResource.write).toHaveBeenCalledWith(':ABORt');
      }
    });
  });

  describe('capabilities', () => {
    beforeEach(() => {
      vi.mocked(mockResource.query).mockResolvedValue(Ok('Keysight,34465A,MY12345678,A.02.14'));
    });

    it('reports data-logging capability', async () => {
      const result = await keysight34465A.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.hasCapability('data-logging')).toBe(true);
      }
    });

    it('reports histogram capability', async () => {
      const result = await keysight34465A.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.hasCapability('histogram')).toBe(true);
      }
    });

    it('does not report dual-display capability', async () => {
      const result = await keysight34465A.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.hasCapability('dual-display')).toBe(false);
      }
    });
  });
});
