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

  describe('measurements', () => {
    beforeEach(() => {
      vi.mocked(mockResource.query).mockImplementation(async (cmd) => {
        if (cmd === '*IDN?') return Ok('Keysight,34465A,MY12345678,A.02.14');
        if (cmd === ':MEASure:VOLTage:DC?') return Ok('+5.01234567E+00');
        if (cmd === ':MEASure:VOLTage:AC?') return Ok('+3.54321000E+00');
        if (cmd === ':MEASure:CURRent:DC?') return Ok('+1.23456789E-03');
        if (cmd === ':MEASure:CURRent:AC?') return Ok('+2.50000000E-03');
        if (cmd === ':MEASure:RESistance?') return Ok('+1.00000000E+03');
        if (cmd === ':MEASure:FRESistance?') return Ok('+9.99500000E+02');
        if (cmd === ':MEASure:FREQuency?') return Ok('+1.00000000E+03');
        if (cmd === ':MEASure:CAPacitance?') return Ok('+1.00000000E-06');
        if (cmd === ':MEASure:CONTinuity?') return Ok('+5.00000000E+00');
        if (cmd === ':MEASure:DIODe?') return Ok('+6.50000000E-01');
        if (cmd === ':READ?') return Ok('+5.01234567E+00');
        if (cmd === ':FETCh?') return Ok('+5.01234567E+00');
        return Err(new Error(`Unknown command: ${cmd}`));
      });
    });

    it('measures DC voltage', async () => {
      const result = await keysight34465A.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const voltage = await result.value.getMeasuredVoltageDC();
        expect(voltage.ok).toBe(true);
        if (voltage.ok) {
          expect(voltage.value).toBeCloseTo(5.01234567, 6);
        }
        expect(mockResource.query).toHaveBeenCalledWith(':MEASure:VOLTage:DC?');
      }
    });

    it('measures AC voltage', async () => {
      const result = await keysight34465A.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const voltage = await result.value.getMeasuredVoltageAC();
        expect(voltage.ok).toBe(true);
        if (voltage.ok) {
          expect(voltage.value).toBeCloseTo(3.54321, 5);
        }
        expect(mockResource.query).toHaveBeenCalledWith(':MEASure:VOLTage:AC?');
      }
    });

    it('measures DC current', async () => {
      const result = await keysight34465A.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const current = await result.value.getMeasuredCurrentDC();
        expect(current.ok).toBe(true);
        if (current.ok) {
          expect(current.value).toBeCloseTo(0.00123456789, 9);
        }
        expect(mockResource.query).toHaveBeenCalledWith(':MEASure:CURRent:DC?');
      }
    });

    it('measures AC current', async () => {
      const result = await keysight34465A.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const current = await result.value.getMeasuredCurrentAC();
        expect(current.ok).toBe(true);
        if (current.ok) {
          expect(current.value).toBeCloseTo(0.0025, 4);
        }
        expect(mockResource.query).toHaveBeenCalledWith(':MEASure:CURRent:AC?');
      }
    });

    it('measures 2-wire resistance', async () => {
      const result = await keysight34465A.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const resistance = await result.value.getMeasuredResistance();
        expect(resistance.ok).toBe(true);
        if (resistance.ok) {
          expect(resistance.value).toBe(1000);
        }
        expect(mockResource.query).toHaveBeenCalledWith(':MEASure:RESistance?');
      }
    });

    it('measures 4-wire resistance', async () => {
      const result = await keysight34465A.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const resistance = await result.value.getMeasuredResistance4W();
        expect(resistance.ok).toBe(true);
        if (resistance.ok) {
          expect(resistance.value).toBeCloseTo(999.5, 1);
        }
        expect(mockResource.query).toHaveBeenCalledWith(':MEASure:FRESistance?');
      }
    });

    it('measures frequency', async () => {
      const result = await keysight34465A.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const freq = await result.value.getMeasuredFrequency();
        expect(freq.ok).toBe(true);
        if (freq.ok) {
          expect(freq.value).toBe(1000);
        }
        expect(mockResource.query).toHaveBeenCalledWith(':MEASure:FREQuency?');
      }
    });

    it('measures capacitance', async () => {
      const result = await keysight34465A.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const cap = await result.value.getMeasuredCapacitance();
        expect(cap.ok).toBe(true);
        if (cap.ok) {
          expect(cap.value).toBe(1e-6);
        }
        expect(mockResource.query).toHaveBeenCalledWith(':MEASure:CAPacitance?');
      }
    });

    it('tests continuity', async () => {
      const result = await keysight34465A.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const cont = await result.value.getMeasuredContinuity();
        expect(cont.ok).toBe(true);
        if (cont.ok) {
          expect(cont.value).toBe(5);
        }
        expect(mockResource.query).toHaveBeenCalledWith(':MEASure:CONTinuity?');
      }
    });

    it('tests diode', async () => {
      const result = await keysight34465A.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const diode = await result.value.getMeasuredDiode();
        expect(diode.ok).toBe(true);
        if (diode.ok) {
          expect(diode.value).toBeCloseTo(0.65, 2);
        }
        expect(mockResource.query).toHaveBeenCalledWith(':MEASure:DIODe?');
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

  describe('auto range and NPLC', () => {
    beforeEach(() => {
      vi.mocked(mockResource.query).mockImplementation(async (cmd) => {
        if (cmd === '*IDN?') return Ok('Keysight,34465A,MY12345678,A.02.14');
        if (cmd === ':SENSe:VOLTage:DC:RANGe:AUTO?') return Ok('1');
        if (cmd === ':SENSe:VOLTage:DC:NPLC?') return Ok('10');
        return Err(new Error(`Unknown command: ${cmd}`));
      });
    });

    it('gets auto range', async () => {
      const result = await keysight34465A.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const autoRange = await result.value.getAutoRange();
        expect(autoRange.ok).toBe(true);
        if (autoRange.ok) {
          expect(autoRange.value).toBe(true);
        }
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
});
