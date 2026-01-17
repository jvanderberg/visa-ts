import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rigolDS1054Z } from '../../../src/drivers/implementations/rigol/ds1054z.js';
import type { MessageBasedResource } from '../../../src/resources/message-based-resource.js';
import { Ok, Err } from '../../../src/result.js';

describe('Rigol DS1054Z Driver', () => {
  let mockResource: MessageBasedResource;

  beforeEach(() => {
    mockResource = {
      resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
      resourceInfo: {
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
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
      expect(rigolDS1054Z.spec.type).toBe('oscilloscope');
      expect(rigolDS1054Z.spec.manufacturer).toBe('Rigol');
      expect(rigolDS1054Z.spec.models).toContain('DS1054Z');
    });

    it('has 4 channels configured', () => {
      expect(rigolDS1054Z.spec.channels?.count).toBe(4);
    });
  });

  describe('connect', () => {
    it('queries device identity', async () => {
      vi.mocked(mockResource.query).mockResolvedValue(
        Ok('RIGOL TECHNOLOGIES,DS1054Z,DS1ZA123456789,00.04.04')
      );

      const result = await rigolDS1054Z.connect(mockResource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.manufacturer).toBe('RIGOL TECHNOLOGIES');
        expect(result.value.model).toBe('DS1054Z');
      }
    });

    it('returns Err on connection failure', async () => {
      vi.mocked(mockResource.query).mockResolvedValue(Err(new Error('Timeout')));

      const result = await rigolDS1054Z.connect(mockResource);

      expect(result.ok).toBe(false);
    });
  });

  describe('timebase properties', () => {
    beforeEach(() => {
      vi.mocked(mockResource.query).mockImplementation(async (cmd) => {
        if (cmd === '*IDN?') return Ok('RIGOL,DS1054Z,DS1ZA123,00.04.04');
        if (cmd === ':TIMebase:MAIN:SCALe?') return Ok('1.000000e-03');
        if (cmd === ':TIMebase:MAIN:OFFSet?') return Ok('0.000000e+00');
        return Err(new Error(`Unknown command: ${cmd}`));
      });
    });

    it('gets timebase scale', async () => {
      const result = await rigolDS1054Z.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const tb = await result.value.getTimebase();
        expect(tb.ok).toBe(true);
        if (tb.ok) {
          expect(tb.value).toBeCloseTo(0.001, 6);
        }
      }
    });

    it('sets timebase scale', async () => {
      const result = await rigolDS1054Z.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        await result.value.setTimebase(0.0001);
        expect(mockResource.write).toHaveBeenCalledWith(':TIMebase:MAIN:SCALe 0.0001');
      }
    });

    it('gets timebase offset', async () => {
      const result = await rigolDS1054Z.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const offset = await result.value.getTimebaseOffset();
        expect(offset.ok).toBe(true);
        if (offset.ok) {
          expect(offset.value).toBe(0);
        }
      }
    });
  });

  describe('trigger properties', () => {
    beforeEach(() => {
      vi.mocked(mockResource.query).mockImplementation(async (cmd) => {
        if (cmd === '*IDN?') return Ok('RIGOL,DS1054Z,DS1ZA123,00.04.04');
        if (cmd === ':TRIGger:EDGe:LEVel?') return Ok('1.5');
        if (cmd === ':TRIGger:EDGe:SLOPe?') return Ok('POSitive');
        if (cmd === ':TRIGger:SWEep?') return Ok('AUTO');
        return Err(new Error(`Unknown command: ${cmd}`));
      });
    });

    it('gets trigger level', async () => {
      const result = await rigolDS1054Z.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const level = await result.value.getTriggerLevel();
        expect(level.ok).toBe(true);
        if (level.ok) {
          expect(level.value).toBe(1.5);
        }
      }
    });

    it('sets trigger level', async () => {
      const result = await rigolDS1054Z.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        await result.value.setTriggerLevel(2.0);
        expect(mockResource.write).toHaveBeenCalledWith(':TRIGger:EDGe:LEVel 2');
      }
    });
  });

  describe('acquisition commands', () => {
    beforeEach(() => {
      vi.mocked(mockResource.query).mockResolvedValue(Ok('RIGOL,DS1054Z,DS1ZA123,00.04.04'));
    });

    it('sends run command', async () => {
      const result = await rigolDS1054Z.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        await result.value.run();
        expect(mockResource.write).toHaveBeenCalledWith(':RUN');
      }
    });

    it('sends stop command', async () => {
      const result = await rigolDS1054Z.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        await result.value.stop();
        expect(mockResource.write).toHaveBeenCalledWith(':STOP');
      }
    });

    it('sends single trigger command', async () => {
      const result = await rigolDS1054Z.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        await result.value.single();
        expect(mockResource.write).toHaveBeenCalledWith(':SINGle');
      }
    });

    it('sends auto scale command', async () => {
      const result = await rigolDS1054Z.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        await result.value.autoScale();
        expect(mockResource.write).toHaveBeenCalledWith(':AUToscale');
      }
    });
  });

  describe('channel access', () => {
    beforeEach(() => {
      vi.mocked(mockResource.query).mockImplementation(async (cmd) => {
        if (cmd === '*IDN?') return Ok('RIGOL,DS1054Z,DS1ZA123,00.04.04');
        if (cmd === ':CHANnel1:DISPlay?') return Ok('1');
        if (cmd === ':CHANnel1:SCALe?') return Ok('1.0');
        if (cmd === ':CHANnel1:OFFSet?') return Ok('0');
        if (cmd === ':CHANnel2:DISPlay?') return Ok('0');
        return Err(new Error(`Unknown command: ${cmd}`));
      });
    });

    it('has 4 channels', async () => {
      const result = await rigolDS1054Z.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.channelCount).toBe(4);
      }
    });

    it('accesses channel 1', async () => {
      const result = await rigolDS1054Z.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch1 = result.value.channel(1);
        expect(ch1.channelNumber).toBe(1);
      }
    });

    it('gets channel enabled state', async () => {
      const result = await rigolDS1054Z.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch1 = result.value.channel(1);
        const enabled = await ch1.getEnabled();
        expect(enabled.ok).toBe(true);
        if (enabled.ok) {
          expect(enabled.value).toBe(true);
        }
      }
    });

    it('sets channel enabled state', async () => {
      const result = await rigolDS1054Z.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch1 = result.value.channel(1);
        await ch1.setEnabled(false);
        expect(mockResource.write).toHaveBeenCalledWith(':CHANnel1:DISPlay OFF');
      }
    });

    it('gets channel scale', async () => {
      const result = await rigolDS1054Z.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch1 = result.value.channel(1);
        const scale = await ch1.getScale();
        expect(scale.ok).toBe(true);
        if (scale.ok) {
          expect(scale.value).toBe(1.0);
        }
      }
    });

    it('sets channel scale', async () => {
      const result = await rigolDS1054Z.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch1 = result.value.channel(1);
        await ch1.setScale(0.5);
        expect(mockResource.write).toHaveBeenCalledWith(':CHANnel1:SCALe 0.5');
      }
    });

    // Note: Invalid channel numbers (e.g., channel(5)) are caught at compile time
    // via the literal type: channel(n: 1 | 2 | 3 | 4)
  });

  describe('channel measurements', () => {
    beforeEach(() => {
      vi.mocked(mockResource.query).mockImplementation(async (cmd) => {
        if (cmd === '*IDN?') return Ok('RIGOL,DS1054Z,DS1ZA123,00.04.04');
        // Base measurements
        if (cmd === ':MEASure:ITEM? FREQuency,CHANnel1') return Ok('1.000000e+03');
        if (cmd === ':MEASure:ITEM? PERiod,CHANnel1') return Ok('1.000000e-03');
        if (cmd === ':MEASure:ITEM? VPP,CHANnel1') return Ok('3.300000e+00');
        if (cmd === ':MEASure:ITEM? VMAX,CHANnel1') return Ok('1.650000e+00');
        if (cmd === ':MEASure:ITEM? VMIN,CHANnel1') return Ok('-1.650000e+00');
        if (cmd === ':MEASure:ITEM? VAVerage,CHANnel1') return Ok('0.000000e+00');
        if (cmd === ':MEASure:ITEM? VRMS,CHANnel1') return Ok('1.166726e+00');
        // DS1054Z-specific measurements
        if (cmd === ':MEASure:ITEM? VTOP,CHANnel1') return Ok('1.600000e+00');
        if (cmd === ':MEASure:ITEM? VBASe,CHANnel1') return Ok('-1.600000e+00');
        if (cmd === ':MEASure:ITEM? VAMPlitude,CHANnel1') return Ok('3.200000e+00');
        if (cmd === ':MEASure:ITEM? OVERshoot,CHANnel1') return Ok('5.000000e+00');
        if (cmd === ':MEASure:ITEM? PREShoot,CHANnel1') return Ok('3.000000e+00');
        if (cmd === ':MEASure:ITEM? RTIMe,CHANnel1') return Ok('1.000000e-07');
        if (cmd === ':MEASure:ITEM? FTIMe,CHANnel1') return Ok('1.200000e-07');
        if (cmd === ':MEASure:ITEM? PWIDth,CHANnel1') return Ok('5.000000e-04');
        if (cmd === ':MEASure:ITEM? NWIDth,CHANnel1') return Ok('5.000000e-04');
        if (cmd === ':MEASure:ITEM? PDUTy,CHANnel1') return Ok('5.000000e+01');
        if (cmd === ':MEASure:ITEM? NDUTy,CHANnel1') return Ok('5.000000e+01');
        if (cmd === ':MEASure:COUNter:VALue? CHANnel1') return Ok('1234');
        return Err(new Error(`Unknown command: ${cmd}`));
      });
    });

    it('measures frequency', async () => {
      const result = await rigolDS1054Z.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch1 = result.value.channel(1);
        const freq = await ch1.getMeasuredFrequency();
        expect(freq.ok).toBe(true);
        if (freq.ok) {
          expect(freq.value).toBe(1000);
        }
        expect(mockResource.query).toHaveBeenCalledWith(':MEASure:ITEM? FREQuency,CHANnel1');
      }
    });

    it('measures period', async () => {
      const result = await rigolDS1054Z.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch1 = result.value.channel(1);
        const period = await ch1.getMeasuredPeriod();
        expect(period.ok).toBe(true);
        if (period.ok) {
          expect(period.value).toBeCloseTo(0.001, 6);
        }
      }
    });

    it('measures Vpp', async () => {
      const result = await rigolDS1054Z.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch1 = result.value.channel(1);
        const vpp = await ch1.getMeasuredVpp();
        expect(vpp.ok).toBe(true);
        if (vpp.ok) {
          expect(vpp.value).toBeCloseTo(3.3, 2);
        }
      }
    });

    it('measures Vmax', async () => {
      const result = await rigolDS1054Z.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch1 = result.value.channel(1);
        const vmax = await ch1.getMeasuredVmax();
        expect(vmax.ok).toBe(true);
        if (vmax.ok) {
          expect(vmax.value).toBeCloseTo(1.65, 2);
        }
      }
    });

    it('measures Vmin', async () => {
      const result = await rigolDS1054Z.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch1 = result.value.channel(1);
        const vmin = await ch1.getMeasuredVmin();
        expect(vmin.ok).toBe(true);
        if (vmin.ok) {
          expect(vmin.value).toBeCloseTo(-1.65, 2);
        }
      }
    });

    it('measures Vrms', async () => {
      const result = await rigolDS1054Z.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch1 = result.value.channel(1);
        const vrms = await ch1.getMeasuredVrms();
        expect(vrms.ok).toBe(true);
        if (vrms.ok) {
          expect(vrms.value).toBeCloseTo(1.167, 2);
        }
      }
    });

    it('measures rise time', async () => {
      const result = await rigolDS1054Z.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch1 = result.value.channel(1);
        const rise = await ch1.getMeasuredRiseTime();
        expect(rise.ok).toBe(true);
        if (rise.ok) {
          expect(rise.value).toBeCloseTo(100e-9, 10);
        }
      }
    });

    it('measures fall time', async () => {
      const result = await rigolDS1054Z.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch1 = result.value.channel(1);
        const fall = await ch1.getMeasuredFallTime();
        expect(fall.ok).toBe(true);
        if (fall.ok) {
          expect(fall.value).toBeCloseTo(120e-9, 10);
        }
      }
    });

    it('measures positive duty cycle', async () => {
      const result = await rigolDS1054Z.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch1 = result.value.channel(1);
        const duty = await ch1.getMeasuredPositiveDuty();
        expect(duty.ok).toBe(true);
        if (duty.ok) {
          expect(duty.value).toBe(50);
        }
      }
    });

    it('measures counter', async () => {
      const result = await rigolDS1054Z.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch1 = result.value.channel(1);
        const count = await ch1.getMeasuredCounter();
        expect(count.ok).toBe(true);
        if (count.ok) {
          expect(count.value).toBe(1234);
        }
      }
    });
  });
});
