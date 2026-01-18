/**
 * Tests for BK Precision 8600 Electronic Load Driver.
 *
 * @packageDocumentation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { bkPrecision8600 } from '../../../src/drivers/implementations/bk-precision/bk8600.js';
import type { MessageBasedResource } from '../../../src/resources/message-based-resource.js';
import { Ok, Err } from '../../../src/result.js';

describe('BK Precision 8600 Driver', () => {
  let mockResource: MessageBasedResource;
  let queryResponses: Map<string, string>;

  beforeEach(() => {
    queryResponses = new Map([
      ['*IDN?', 'BK Precision,8600,000000000,1.00'],
      ['MODE?', 'CURR'],
      ['CURR?', '2.5'],
      ['VOLT?', '12.0'],
      ['RES?', '10.0'],
      ['POW?', '25.0'],
      ['INP?', 'OFF'],
      ['MEAS:VOLT?', '12.5'],
      ['MEAS:CURR?', '2.5'],
      ['MEAS:POW?', '31.25'],
      ['MEAS:RES?', '5.0'],
      ['CURR:RANG?', '30'],
      ['VOLT:RANG?', '120'],
      ['CURR:SLEW?', '0.5'],
      ['VOLT:PROT:LEV?', '130'],
      ['VOLT:PROT:STAT?', 'OFF'],
      ['VOLT:PROT:TRIP?', '0'],
      ['CURR:PROT:LEV?', '35'],
      ['CURR:PROT:STAT?', 'OFF'],
      ['CURR:PROT:TRIP?', '0'],
      ['VOLT:ON?', '0'],
      ['VOLT:OFF?', '0'],
      ['INP:SHOR?', 'OFF'],
      ['LED:VF?', '3.2'],
      ['LED:RD?', '0.5'],
    ]);

    mockResource = {
      resourceString: 'GPIB0::5::INSTR',
      resourceInfo: {
        resourceString: 'GPIB0::5::INSTR',
        interfaceType: 'GPIB',
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
    vi.mocked(mockResource.query).mockImplementation(async (cmd: string) => {
      const response = queryResponses.get(cmd.trim());
      if (response !== undefined) {
        return Ok(response);
      }
      return Err(new Error(`Unknown command: ${cmd}`));
    });
  });

  describe('driver metadata', () => {
    it('has features array with cp, short, led', async () => {
      const result = await bkPrecision8600.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.features).toEqual(['cp', 'short', 'led']);
      }
    });

    it('identifies as BK Precision 8600', async () => {
      const result = await bkPrecision8600.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.manufacturer).toBe('BK Precision');
        expect(result.value.model).toBe('8600');
      }
    });
  });

  describe('channel properties', () => {
    it('gets and sets mode without colon prefix', async () => {
      const result = await bkPrecision8600.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch = result.value.channel(1);

        const modeResult = await ch.getMode();
        expect(modeResult.ok).toBe(true);
        if (modeResult.ok) {
          expect(modeResult.value).toBe('CC');
        }

        await ch.setMode('CV');
        expect(mockResource.write).toHaveBeenCalledWith('MODE VOLT');
      }
    });

    it('gets and sets current without colon prefix', async () => {
      const result = await bkPrecision8600.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch = result.value.channel(1);

        const currResult = await ch.getCurrent();
        expect(currResult.ok).toBe(true);
        if (currResult.ok) {
          expect(currResult.value).toBe(2.5);
        }

        await ch.setCurrent(3.0);
        expect(mockResource.write).toHaveBeenCalledWith('CURR 3');
      }
    });

    it('gets measurements', async () => {
      const result = await bkPrecision8600.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch = result.value.channel(1);

        const vResult = await ch.getMeasuredVoltage();
        expect(vResult.ok).toBe(true);
        if (vResult.ok) expect(vResult.value).toBe(12.5);

        const iResult = await ch.getMeasuredCurrent();
        expect(iResult.ok).toBe(true);
        if (iResult.ok) expect(iResult.value).toBe(2.5);
      }
    });

    it('converts slew rate from A/µs to A/s', async () => {
      const result = await bkPrecision8600.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch = result.value.channel(1);

        const slewResult = await ch.getSlewRate();
        expect(slewResult.ok).toBe(true);
        if (slewResult.ok) {
          expect(slewResult.value).toBe(500000);
        }

        await ch.setSlewRate(1000000);
        expect(mockResource.write).toHaveBeenCalledWith('CURR:SLEW 1');
      }
    });
  });

  describe('protection features', () => {
    it('gets and sets OVP level without colon prefix', async () => {
      const result = await bkPrecision8600.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch = result.value.channel(1);

        const ovpResult = await ch.getOvpLevel();
        expect(ovpResult.ok).toBe(true);
        if (ovpResult.ok) expect(ovpResult.value).toBe(130);

        await ch.setOvpEnabled(true);
        expect(mockResource.write).toHaveBeenCalledWith('VOLT:PROT:STAT ON');
      }
    });
  });

  describe('short circuit feature', () => {
    it('gets and sets short enabled state', async () => {
      const result = await bkPrecision8600.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch = result.value.channel(1);

        const shortResult = await ch.getShortEnabled();
        expect(shortResult.ok).toBe(true);
        if (shortResult.ok) expect(shortResult.value).toBe(false);

        await ch.setShortEnabled(true);
        expect(mockResource.write).toHaveBeenCalledWith('INP:SHOR ON');
      }
    });
  });

  describe('LED test feature', () => {
    it('gets and sets LED Vf', async () => {
      const result = await bkPrecision8600.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch = result.value.channel(1);

        const vfResult = await ch.getLedVf();
        expect(vfResult.ok).toBe(true);
        if (vfResult.ok) expect(vfResult.value).toBe(3.2);

        await ch.setLedVf(3.3);
        expect(mockResource.write).toHaveBeenCalledWith('LED:VF 3.3');
      }
    });

    it('gets and sets LED Rd', async () => {
      const result = await bkPrecision8600.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch = result.value.channel(1);

        const rdResult = await ch.getLedRd();
        expect(rdResult.ok).toBe(true);
        if (rdResult.ok) expect(rdResult.value).toBe(0.5);

        await ch.setLedRd(1.0);
        expect(mockResource.write).toHaveBeenCalledWith('LED:RD 1');
      }
    });
  });

  describe('list mode with array format', () => {
    it('uploads list sequence with array syntax', async () => {
      const result = await bkPrecision8600.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const uploadResult = await result.value.uploadList(
          'CC',
          [
            { value: 0.5, duration: 1.0 },
            { value: 1.0, duration: 1.0 },
            { value: 2.0, duration: 1.0 },
            { value: 0.0, duration: 0.5 },
          ],
          5
        );

        expect(uploadResult.ok).toBe(true);
        expect(mockResource.write).toHaveBeenCalledWith('LIST:MODE CURR');
        expect(mockResource.write).toHaveBeenCalledWith('LIST:STEP 4');
        expect(mockResource.write).toHaveBeenCalledWith('LIST:COUN 5');
        expect(mockResource.write).toHaveBeenCalledWith('LIST:CURR 0.5,1,2,0');
        expect(mockResource.write).toHaveBeenCalledWith('LIST:DWEL 1,1,1,0.5');
      }
    });

    it('starts list execution', async () => {
      const result = await bkPrecision8600.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        await result.value.startList();
        expect(mockResource.write).toHaveBeenCalledWith('LIST ON');
        expect(mockResource.write).toHaveBeenCalledWith('INP ON');
      }
    });

    it('stops list execution', async () => {
      const result = await bkPrecision8600.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        await result.value.stopList();
        expect(mockResource.write).toHaveBeenCalledWith('LIST OFF');
      }
    });
  });

  describe('global commands', () => {
    it('enables all inputs without colon prefix', async () => {
      const result = await bkPrecision8600.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        await result.value.enableAllInputs();
        expect(mockResource.write).toHaveBeenCalledWith('INP ON');
      }
    });

    it('saves state', async () => {
      const result = await bkPrecision8600.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        await result.value.saveState(5);
        expect(mockResource.write).toHaveBeenCalledWith('*SAV 5');
      }
    });

    it('recalls state', async () => {
      const result = await bkPrecision8600.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        await result.value.recallState(5);
        expect(mockResource.write).toHaveBeenCalledWith('*RCL 5');
      }
    });
  });
});
