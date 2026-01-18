/**
 * Tests for Siglent SDL1000X Series Electronic Load Driver.
 *
 * @packageDocumentation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { siglentSDL1000X } from '../../../src/drivers/implementations/siglent/sdl1000x.js';
import type { MessageBasedResource } from '../../../src/resources/message-based-resource.js';
import { Ok, Err } from '../../../src/result.js';

describe('Siglent SDL1000X Series Driver', () => {
  let mockResource: MessageBasedResource;
  let queryResponses: Map<string, string>;

  beforeEach(() => {
    queryResponses = new Map([
      ['*IDN?', 'Siglent Technologies,SDL1030X,SDL1XXXXXXXXX,1.1.1.5'],
      [':SOUR:FUNC?', 'CURR'],
      [':SOUR:CURR?', '2.5'],
      [':SOUR:VOLT?', '12.0'],
      [':SOUR:RES?', '10.0'],
      [':SOUR:POW?', '25.0'],
      [':INP?', 'OFF'],
      [':MEAS:VOLT?', '12.5'],
      [':MEAS:CURR?', '2.5'],
      [':MEAS:POW?', '31.25'],
      [':MEAS:RES?', '5.0'],
      [':SOUR:CURR:RANG?', '30'],
      [':SOUR:VOLT:RANG?', '150'],
      [':SOUR:CURR:SLEW?', '0.5'], // 0.5 A/µs
      [':SOUR:VOLT:PROT?', '155'],
      [':SOUR:VOLT:PROT:STAT?', 'OFF'],
      [':STAT:QUES:COND?', '0'],
      [':SOUR:CURR:PROT?', '35'],
      [':SOUR:CURR:PROT:STAT?', 'OFF'],
      [':SOUR:VOLT:ON?', '0'],
      [':SOUR:VOLT:OFF?', '0'],
      [':SOUR:SHOR?', 'OFF'],
      [':SOUR:LED:VD?', '3.0'],
      [':SOUR:LED:RD?', '1.5'],
      [':SOUR:POW:PROT?', '300'],
      [':SOUR:POW:PROT:STAT?', 'OFF'],
    ]);

    mockResource = {
      resourceString: 'TCPIP0::192.168.1.100::5025::SOCKET',
      resourceInfo: {
        resourceString: 'TCPIP0::192.168.1.100::5025::SOCKET',
        interfaceType: 'TCPIP',
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
    it('has features array with cp, short, led, opp', async () => {
      const result = await siglentSDL1000X.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.features).toEqual(['cp', 'short', 'led', 'opp']);
      }
    });

    it('identifies as Siglent SDL1030X', async () => {
      const result = await siglentSDL1000X.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.manufacturer).toBe('Siglent Technologies');
        expect(result.value.model).toBe('SDL1030X');
      }
    });
  });

  describe('channel properties', () => {
    it('gets and sets mode', async () => {
      const result = await siglentSDL1000X.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch = result.value.channel(1);

        const modeResult = await ch.getMode();
        expect(modeResult.ok).toBe(true);
        if (modeResult.ok) {
          expect(modeResult.value).toBe('CC');
        }

        await ch.setMode('CV');
        expect(mockResource.write).toHaveBeenCalledWith(':SOUR:FUNC VOLT');
      }
    });

    it('gets and sets current', async () => {
      const result = await siglentSDL1000X.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch = result.value.channel(1);

        const currResult = await ch.getCurrent();
        expect(currResult.ok).toBe(true);
        if (currResult.ok) {
          expect(currResult.value).toBe(2.5);
        }

        await ch.setCurrent(3.0);
        expect(mockResource.write).toHaveBeenCalledWith(':SOUR:CURR 3');
      }
    });

    it('gets measurements', async () => {
      const result = await siglentSDL1000X.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch = result.value.channel(1);

        const vResult = await ch.getMeasuredVoltage();
        expect(vResult.ok).toBe(true);
        if (vResult.ok) expect(vResult.value).toBe(12.5);

        const iResult = await ch.getMeasuredCurrent();
        expect(iResult.ok).toBe(true);
        if (iResult.ok) expect(iResult.value).toBe(2.5);

        const pResult = await ch.getMeasuredPower();
        expect(pResult.ok).toBe(true);
        if (pResult.ok) expect(pResult.value).toBe(31.25);
      }
    });

    it('converts slew rate from A/µs to A/s', async () => {
      const result = await siglentSDL1000X.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch = result.value.channel(1);

        // Query returns 0.5 A/µs, should convert to 500000 A/s
        const slewResult = await ch.getSlewRate();
        expect(slewResult.ok).toBe(true);
        if (slewResult.ok) {
          expect(slewResult.value).toBe(500000);
        }

        // Setting 1000000 A/s should send 1 A/µs
        await ch.setSlewRate(1000000);
        expect(mockResource.write).toHaveBeenCalledWith(':SOUR:CURR:SLEW 1');
      }
    });
  });

  describe('protection features', () => {
    it('gets and sets OVP level and enable', async () => {
      const result = await siglentSDL1000X.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch = result.value.channel(1);

        const ovpResult = await ch.getOvpLevel();
        expect(ovpResult.ok).toBe(true);
        if (ovpResult.ok) expect(ovpResult.value).toBe(155);

        await ch.setOvpEnabled(true);
        expect(mockResource.write).toHaveBeenCalledWith(':SOUR:VOLT:PROT:STAT ON');
      }
    });

    it('gets and sets OCP level and enable', async () => {
      const result = await siglentSDL1000X.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch = result.value.channel(1);

        const ocpResult = await ch.getOcpLevel();
        expect(ocpResult.ok).toBe(true);
        if (ocpResult.ok) expect(ocpResult.value).toBe(35);

        await ch.setOcpEnabled(true);
        expect(mockResource.write).toHaveBeenCalledWith(':SOUR:CURR:PROT:STAT ON');
      }
    });
  });

  describe('short circuit feature', () => {
    it('gets and sets short enabled state', async () => {
      const result = await siglentSDL1000X.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch = result.value.channel(1);

        const shortResult = await ch.getShortEnabled();
        expect(shortResult.ok).toBe(true);
        if (shortResult.ok) expect(shortResult.value).toBe(false);

        await ch.setShortEnabled(true);
        expect(mockResource.write).toHaveBeenCalledWith(':SOUR:SHOR ON');
      }
    });
  });

  describe('LED test feature', () => {
    it('gets and sets LED Vf', async () => {
      const result = await siglentSDL1000X.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch = result.value.channel(1);

        const vfResult = await ch.getLedVf();
        expect(vfResult.ok).toBe(true);
        if (vfResult.ok) expect(vfResult.value).toBe(3.0);

        await ch.setLedVf(3.3);
        expect(mockResource.write).toHaveBeenCalledWith(':SOUR:LED:VD 3.3');
      }
    });

    it('gets and sets LED Rd', async () => {
      const result = await siglentSDL1000X.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch = result.value.channel(1);

        const rdResult = await ch.getLedRd();
        expect(rdResult.ok).toBe(true);
        if (rdResult.ok) expect(rdResult.value).toBe(1.5);

        await ch.setLedRd(2.0);
        expect(mockResource.write).toHaveBeenCalledWith(':SOUR:LED:RD 2');
      }
    });
  });

  describe('OPP feature', () => {
    it('gets and sets OPP level', async () => {
      const result = await siglentSDL1000X.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const oppResult = await result.value.getOppLevel();
        expect(oppResult.ok).toBe(true);
        if (oppResult.ok) expect(oppResult.value).toBe(300);

        await result.value.setOppLevel(250);
        expect(mockResource.write).toHaveBeenCalledWith(':SOUR:POW:PROT 250');
      }
    });

    it('gets and sets OPP enabled', async () => {
      const result = await siglentSDL1000X.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const enabledResult = await result.value.getOppEnabled();
        expect(enabledResult.ok).toBe(true);
        if (enabledResult.ok) expect(enabledResult.value).toBe(false);

        await result.value.setOppEnabled(true);
        expect(mockResource.write).toHaveBeenCalledWith(':SOUR:POW:PROT:STAT ON');
      }
    });
  });

  describe('Von/Voff thresholds', () => {
    it('gets and sets Von threshold', async () => {
      const result = await siglentSDL1000X.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch = result.value.channel(1);

        await ch.setVonThreshold(4.5);
        expect(mockResource.write).toHaveBeenCalledWith(':SOUR:VOLT:ON 4.5');
      }
    });

    it('gets and sets Voff threshold', async () => {
      const result = await siglentSDL1000X.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch = result.value.channel(1);

        await ch.setVoffThreshold(4.0);
        expect(mockResource.write).toHaveBeenCalledWith(':SOUR:VOLT:OFF 4');
      }
    });
  });

  describe('list mode', () => {
    it('uploads list sequence', async () => {
      const result = await siglentSDL1000X.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const uploadResult = await result.value.uploadList(
          'CC',
          [
            { value: 1.0, duration: 1.0 },
            { value: 2.0, duration: 0.5 },
          ],
          5
        );

        expect(uploadResult.ok).toBe(true);
        expect(mockResource.write).toHaveBeenCalledWith(':SOUR:LIST:MODE CURR');
        expect(mockResource.write).toHaveBeenCalledWith(':SOUR:LIST:STEP 2');
        expect(mockResource.write).toHaveBeenCalledWith(':SOUR:LIST:COUN 5');
        expect(mockResource.write).toHaveBeenCalledWith(':SOUR:LIST:CURR 1,1');
        expect(mockResource.write).toHaveBeenCalledWith(':SOUR:LIST:WID 1,1');
        expect(mockResource.write).toHaveBeenCalledWith(':SOUR:LIST:CURR 2,2');
        expect(mockResource.write).toHaveBeenCalledWith(':SOUR:LIST:WID 2,0.5');
      }
    });

    it('starts list execution', async () => {
      const result = await siglentSDL1000X.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        await result.value.startList();
        expect(mockResource.write).toHaveBeenCalledWith(':SOUR:LIST ON');
        expect(mockResource.write).toHaveBeenCalledWith(':INP ON');
      }
    });

    it('stops list execution', async () => {
      const result = await siglentSDL1000X.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        await result.value.stopList();
        expect(mockResource.write).toHaveBeenCalledWith(':SOUR:LIST OFF');
      }
    });
  });

  describe('global commands', () => {
    it('enables all inputs', async () => {
      const result = await siglentSDL1000X.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        await result.value.enableAllInputs();
        expect(mockResource.write).toHaveBeenCalledWith(':INP ON');
      }
    });

    it('disables all inputs', async () => {
      const result = await siglentSDL1000X.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        await result.value.disableAllInputs();
        expect(mockResource.write).toHaveBeenCalledWith(':INP OFF');
      }
    });

    it('saves state', async () => {
      const result = await siglentSDL1000X.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        await result.value.saveState(3);
        expect(mockResource.write).toHaveBeenCalledWith('*SAV 3');
      }
    });

    it('recalls state', async () => {
      const result = await siglentSDL1000X.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        await result.value.recallState(3);
        expect(mockResource.write).toHaveBeenCalledWith('*RCL 3');
      }
    });
  });
});
