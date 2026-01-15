import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rigolDP832 } from '../../../src/drivers/implementations/rigol/dp832.js';
import type { MessageBasedResource } from '../../../src/resources/message-based-resource.js';
import { Ok, Err } from '../../../src/result.js';

describe('Rigol DP832 Driver', () => {
  let mockResource: MessageBasedResource;

  beforeEach(() => {
    mockResource = {
      resourceString: 'USB0::0x1AB1::0x0E11::DP8A123::INSTR',
      resourceInfo: {
        resourceString: 'USB0::0x1AB1::0x0E11::DP8A123::INSTR',
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
      expect(rigolDP832.spec.type).toBe('power-supply');
      expect(rigolDP832.spec.manufacturer).toBe('Rigol');
      expect(rigolDP832.spec.models).toContain('DP832');
    });

    it('has 3 channels configured', () => {
      expect(rigolDP832.spec.channels?.count).toBe(3);
    });

    it('declares capabilities', () => {
      expect(rigolDP832.spec.capabilities).toContain('ovp');
      expect(rigolDP832.spec.capabilities).toContain('ocp');
    });
  });

  describe('connect', () => {
    it('queries device identity', async () => {
      vi.mocked(mockResource.query).mockResolvedValue(
        Ok('RIGOL TECHNOLOGIES,DP832,DP8A123456789,00.01.16')
      );

      const result = await rigolDP832.connect(mockResource);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.manufacturer).toBe('RIGOL TECHNOLOGIES');
        expect(result.value.model).toBe('DP832');
      }
    });

    it('returns Err on connection failure', async () => {
      vi.mocked(mockResource.query).mockResolvedValue(Err(new Error('Timeout')));

      const result = await rigolDP832.connect(mockResource);

      expect(result.ok).toBe(false);
    });
  });

  describe('global output control', () => {
    beforeEach(() => {
      vi.mocked(mockResource.query).mockImplementation(async (cmd) => {
        if (cmd === '*IDN?') return Ok('RIGOL,DP832,DP8A123,00.01.16');
        if (cmd === ':OUTPut:OCP:VALue? CH1') return Ok('3.2');
        return Err(new Error(`Unknown command: ${cmd}`));
      });
    });

    it('sends all output enable command', async () => {
      const result = await rigolDP832.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        await result.value.setAllOutputEnabled(true);
        expect(mockResource.write).toHaveBeenCalledWith(':OUTPut:ALL ON');
      }
    });

    it('sends all output disable command', async () => {
      const result = await rigolDP832.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        await result.value.setAllOutputEnabled(false);
        expect(mockResource.write).toHaveBeenCalledWith(':OUTPut:ALL OFF');
      }
    });
  });

  describe('channel access', () => {
    beforeEach(() => {
      vi.mocked(mockResource.query).mockImplementation(async (cmd) => {
        if (cmd === '*IDN?') return Ok('RIGOL,DP832,DP8A123,00.01.16');
        if (cmd === ':SOURce1:VOLTage?') return Ok('5.000');
        if (cmd === ':SOURce1:CURRent?') return Ok('1.000');
        if (cmd === ':MEASure:VOLTage? CH1') return Ok('4.987');
        if (cmd === ':MEASure:CURRent? CH1') return Ok('0.523');
        if (cmd === ':MEASure:POWer? CH1') return Ok('2.608');
        if (cmd === ':OUTPut:STATe? CH1') return Ok('ON');
        if (cmd === ':OUTPut:MODE? CH1') return Ok('CV');
        return Err(new Error(`Unknown command: ${cmd}`));
      });
    });

    it('has 3 channels', async () => {
      const result = await rigolDP832.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.channelCount).toBe(3);
      }
    });

    it('accesses channel 1', async () => {
      const result = await rigolDP832.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch1Result = result.value.channel(1);
        expect(ch1Result.ok).toBe(true);
        if (ch1Result.ok) {
          expect((ch1Result.value as { channelNumber: number }).channelNumber).toBe(1);
        }
      }
    });

    it('gets channel voltage setpoint', async () => {
      const result = await rigolDP832.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch1Result = result.value.channel(1);
        expect(ch1Result.ok).toBe(true);
        if (ch1Result.ok) {
          const ch1 = ch1Result.value as {
            getVoltage: () => Promise<{ ok: boolean; value?: number }>;
          };
          const voltage = await ch1.getVoltage();
          expect(voltage.ok).toBe(true);
          if (voltage.ok) {
            expect(voltage.value).toBe(5.0);
          }
        }
      }
    });

    it('sets channel voltage setpoint', async () => {
      const result = await rigolDP832.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch1Result = result.value.channel(1);
        expect(ch1Result.ok).toBe(true);
        if (ch1Result.ok) {
          const ch1 = ch1Result.value as { setVoltage: (v: number) => Promise<{ ok: boolean }> };
          await ch1.setVoltage(3.3);
          expect(mockResource.write).toHaveBeenCalledWith(':SOURce1:VOLTage 3.3');
        }
      }
    });

    it('gets channel current limit', async () => {
      const result = await rigolDP832.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch1Result = result.value.channel(1);
        expect(ch1Result.ok).toBe(true);
        if (ch1Result.ok) {
          const ch1 = ch1Result.value as {
            getCurrent: () => Promise<{ ok: boolean; value?: number }>;
          };
          const current = await ch1.getCurrent();
          expect(current.ok).toBe(true);
          if (current.ok) {
            expect(current.value).toBe(1.0);
          }
        }
      }
    });

    it('sets channel current limit', async () => {
      const result = await rigolDP832.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch1Result = result.value.channel(1);
        expect(ch1Result.ok).toBe(true);
        if (ch1Result.ok) {
          const ch1 = ch1Result.value as { setCurrent: (v: number) => Promise<{ ok: boolean }> };
          await ch1.setCurrent(0.5);
          expect(mockResource.write).toHaveBeenCalledWith(':SOURce1:CURRent 0.5');
        }
      }
    });

    it('measures channel voltage', async () => {
      const result = await rigolDP832.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch1Result = result.value.channel(1);
        expect(ch1Result.ok).toBe(true);
        if (ch1Result.ok) {
          const ch1 = ch1Result.value as {
            getMeasuredVoltage: () => Promise<{ ok: boolean; value?: number }>;
          };
          const voltage = await ch1.getMeasuredVoltage();
          expect(voltage.ok).toBe(true);
          if (voltage.ok) {
            expect(voltage.value).toBeCloseTo(4.987, 3);
          }
        }
      }
    });

    it('measures channel current', async () => {
      const result = await rigolDP832.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch1Result = result.value.channel(1);
        expect(ch1Result.ok).toBe(true);
        if (ch1Result.ok) {
          const ch1 = ch1Result.value as {
            getMeasuredCurrent: () => Promise<{ ok: boolean; value?: number }>;
          };
          const current = await ch1.getMeasuredCurrent();
          expect(current.ok).toBe(true);
          if (current.ok) {
            expect(current.value).toBeCloseTo(0.523, 3);
          }
        }
      }
    });

    it('measures channel power', async () => {
      const result = await rigolDP832.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch1Result = result.value.channel(1);
        expect(ch1Result.ok).toBe(true);
        if (ch1Result.ok) {
          const ch1 = ch1Result.value as {
            getMeasuredPower: () => Promise<{ ok: boolean; value?: number }>;
          };
          const power = await ch1.getMeasuredPower();
          expect(power.ok).toBe(true);
          if (power.ok) {
            expect(power.value).toBeCloseTo(2.608, 3);
          }
        }
      }
    });

    it('gets channel output enabled state', async () => {
      const result = await rigolDP832.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch1Result = result.value.channel(1);
        expect(ch1Result.ok).toBe(true);
        if (ch1Result.ok) {
          const ch1 = ch1Result.value as {
            getOutputEnabled: () => Promise<{ ok: boolean; value?: boolean }>;
          };
          const enabled = await ch1.getOutputEnabled();
          expect(enabled.ok).toBe(true);
          if (enabled.ok) {
            expect(enabled.value).toBe(true);
          }
        }
      }
    });

    it('sets channel output enabled', async () => {
      const result = await rigolDP832.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch1Result = result.value.channel(1);
        expect(ch1Result.ok).toBe(true);
        if (ch1Result.ok) {
          const ch1 = ch1Result.value as {
            setOutputEnabled: (v: boolean) => Promise<{ ok: boolean }>;
          };
          await ch1.setOutputEnabled(true);
          expect(mockResource.write).toHaveBeenCalledWith(':OUTPut:STATe CH1,ON');
        }
      }
    });

    it('gets channel regulation mode', async () => {
      const result = await rigolDP832.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch1Result = result.value.channel(1);
        expect(ch1Result.ok).toBe(true);
        if (ch1Result.ok) {
          const ch1 = ch1Result.value as {
            getMode: () => Promise<{ ok: boolean; value?: string }>;
          };
          const mode = await ch1.getMode();
          expect(mode.ok).toBe(true);
          if (mode.ok) {
            expect(mode.value).toBe('CV');
          }
        }
      }
    });

    it('returns Err for invalid channel', async () => {
      const result = await rigolDP832.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const chResult = result.value.channel(4);
        expect(chResult.ok).toBe(false);
        if (!chResult.ok) {
          expect(chResult.error.message).toContain('Channel 4 out of range');
        }
      }
    });
  });

  describe('multi-channel configuration', () => {
    beforeEach(() => {
      vi.mocked(mockResource.query).mockImplementation(async (cmd) => {
        if (cmd === '*IDN?') return Ok('RIGOL,DP832,DP8A123,00.01.16');
        if (cmd === ':SOURce2:VOLTage?') return Ok('12.000');
        if (cmd === ':SOURce3:VOLTage?') return Ok('3.300');
        return Err(new Error(`Unknown command: ${cmd}`));
      });
    });

    it('configures different channels', async () => {
      const result = await rigolDP832.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ch2Result = result.value.channel(2);
        const ch3Result = result.value.channel(3);

        expect(ch2Result.ok).toBe(true);
        expect(ch3Result.ok).toBe(true);

        if (ch2Result.ok && ch3Result.ok) {
          const ch2 = ch2Result.value as {
            getVoltage: () => Promise<{ ok: boolean; value?: number }>;
          };
          const ch3 = ch3Result.value as {
            getVoltage: () => Promise<{ ok: boolean; value?: number }>;
          };

          const v2 = await ch2.getVoltage();
          const v3 = await ch3.getVoltage();

          expect(v2.ok).toBe(true);
          expect(v3.ok).toBe(true);
          if (v2.ok && v3.ok) {
            expect(v2.value).toBe(12.0);
            expect(v3.value).toBe(3.3);
          }
        }
      }
    });
  });

  describe('capabilities', () => {
    beforeEach(() => {
      vi.mocked(mockResource.query).mockResolvedValue(Ok('RIGOL,DP832,DP8A123,00.01.16'));
    });

    it('reports ovp capability', async () => {
      const result = await rigolDP832.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.hasCapability('ovp')).toBe(true);
      }
    });

    it('reports ocp capability', async () => {
      const result = await rigolDP832.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.hasCapability('ocp')).toBe(true);
      }
    });

    it('does not report tracking capability', async () => {
      const result = await rigolDP832.connect(mockResource);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.hasCapability('tracking')).toBe(false);
      }
    });
  });
});
