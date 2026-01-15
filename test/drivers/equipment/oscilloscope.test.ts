/**
 * Tests for Oscilloscope interface and related types.
 *
 * @packageDocumentation
 */

import { describe, it, expect, vi } from 'vitest';
import type {
  Oscilloscope,
  OscilloscopeChannel,
  TimebaseMode,
  TriggerSource,
  TriggerSlope,
  TriggerMode,
  AcquisitionMode,
  Coupling,
  BandwidthLimit,
  MeasurementType,
  WaveformData,
  OscilloscopeCapability,
} from '../../../src/drivers/equipment/oscilloscope.js';
import { Ok } from '../../../src/result.js';

describe('Oscilloscope types', () => {
  describe('TimebaseMode', () => {
    it('includes standard modes', () => {
      const modes: TimebaseMode[] = ['MAIN', 'WINDOW', 'XY', 'ROLL'];
      expect(modes).toContain('MAIN');
      expect(modes).toContain('ROLL');
    });
  });

  describe('TriggerSource', () => {
    it('includes channel and external sources', () => {
      const sources: TriggerSource[] = ['CH1', 'CH2', 'CH3', 'CH4', 'EXT', 'LINE'];
      expect(sources).toContain('CH1');
      expect(sources).toContain('EXT');
      expect(sources).toContain('LINE');
    });
  });

  describe('TriggerSlope', () => {
    it('includes standard slopes', () => {
      const slopes: TriggerSlope[] = ['RISING', 'FALLING', 'EITHER'];
      expect(slopes.length).toBe(3);
    });
  });

  describe('TriggerMode', () => {
    it('includes standard modes', () => {
      const modes: TriggerMode[] = ['AUTO', 'NORMAL', 'SINGLE'];
      expect(modes.length).toBe(3);
    });
  });

  describe('AcquisitionMode', () => {
    it('includes standard acquisition modes', () => {
      const modes: AcquisitionMode[] = ['NORMAL', 'AVERAGE', 'PEAK', 'HIGHRES'];
      expect(modes.length).toBe(4);
    });
  });

  describe('Coupling', () => {
    it('includes standard coupling modes', () => {
      const couplings: Coupling[] = ['AC', 'DC', 'GND'];
      expect(couplings.length).toBe(3);
    });
  });

  describe('BandwidthLimit', () => {
    it('includes OFF and limit values', () => {
      const limits: BandwidthLimit[] = ['OFF', '20MHZ'];
      expect(limits).toContain('OFF');
      expect(limits).toContain('20MHZ');
    });
  });

  describe('MeasurementType', () => {
    it('includes voltage measurements', () => {
      const types: MeasurementType[] = ['VMAX', 'VMIN', 'VPP', 'VAVG', 'VRMS'];
      expect(types).toContain('VPP');
      expect(types).toContain('VRMS');
    });

    it('includes timing measurements', () => {
      const types: MeasurementType[] = ['FREQUENCY', 'PERIOD', 'RISE', 'FALL'];
      expect(types).toContain('FREQUENCY');
      expect(types).toContain('RISE');
    });
  });

  describe('WaveformData', () => {
    it('contains waveform points and metadata', () => {
      const waveform: WaveformData = {
        points: new Float64Array([0, 1, 2, 3]),
        xIncrement: 1e-9,
        xOrigin: 0,
        yIncrement: 0.01,
        yOrigin: 0,
        xUnit: 's',
        yUnit: 'V',
      };

      expect(waveform.points.length).toBe(4);
      expect(waveform.xIncrement).toBe(1e-9);
      expect(waveform.xUnit).toBe('s');
      expect(waveform.yUnit).toBe('V');
    });
  });

  describe('OscilloscopeCapability', () => {
    it('includes common capabilities', () => {
      const caps: OscilloscopeCapability[] = [
        'digital-channels',
        'math-channels',
        'fft',
        'protocol-decode',
      ];
      expect(caps).toContain('fft');
      expect(caps).toContain('protocol-decode');
    });
  });

  describe('OscilloscopeChannel interface', () => {
    it('defines channel properties and methods', () => {
      const mockChannel: OscilloscopeChannel = {
        channelNumber: 1,
        getEnabled: vi.fn().mockResolvedValue(Ok(true)),
        setEnabled: vi.fn().mockResolvedValue(Ok(undefined)),
        getScale: vi.fn().mockResolvedValue(Ok(1.0)),
        setScale: vi.fn().mockResolvedValue(Ok(undefined)),
        getOffset: vi.fn().mockResolvedValue(Ok(0)),
        setOffset: vi.fn().mockResolvedValue(Ok(undefined)),
        getCoupling: vi.fn().mockResolvedValue(Ok('DC' as Coupling)),
        setCoupling: vi.fn().mockResolvedValue(Ok(undefined)),
        getBandwidthLimit: vi.fn().mockResolvedValue(Ok('OFF' as BandwidthLimit)),
        setBandwidthLimit: vi.fn().mockResolvedValue(Ok(undefined)),
        getProbeAttenuation: vi.fn().mockResolvedValue(Ok(10)),
        setProbeAttenuation: vi.fn().mockResolvedValue(Ok(undefined)),
        getInverted: vi.fn().mockResolvedValue(Ok(false)),
        setInverted: vi.fn().mockResolvedValue(Ok(undefined)),
        getLabel: vi.fn().mockResolvedValue(Ok('CH1')),
        setLabel: vi.fn().mockResolvedValue(Ok(undefined)),
      };

      expect(mockChannel.channelNumber).toBe(1);
      expect(mockChannel.getEnabled).toBeInstanceOf(Function);
      expect(mockChannel.setScale).toBeInstanceOf(Function);
    });
  });

  describe('Oscilloscope interface', () => {
    it('extends BaseInstrument', () => {
      const mockScope = createMockOscilloscope();

      // From BaseInstrument
      expect(mockScope.resourceString).toBeDefined();
      expect(mockScope.manufacturer).toBeDefined();
      expect(mockScope.reset).toBeInstanceOf(Function);
    });

    it('defines channel access', () => {
      const mockScope = createMockOscilloscope();

      expect(mockScope.channelCount).toBe(4);
      expect(mockScope.channel).toBeInstanceOf(Function);
    });

    it('defines timebase properties', async () => {
      const mockScope = createMockOscilloscope();

      const tb = await mockScope.getTimebase();
      expect(tb.ok).toBe(true);

      expect(mockScope.setTimebase).toBeInstanceOf(Function);
      expect(mockScope.getTimebaseOffset).toBeInstanceOf(Function);
      expect(mockScope.setTimebaseOffset).toBeInstanceOf(Function);
    });

    it('defines trigger properties', () => {
      const mockScope = createMockOscilloscope();

      expect(mockScope.getTriggerSource).toBeInstanceOf(Function);
      expect(mockScope.setTriggerSource).toBeInstanceOf(Function);
      expect(mockScope.getTriggerLevel).toBeInstanceOf(Function);
      expect(mockScope.setTriggerLevel).toBeInstanceOf(Function);
      expect(mockScope.getTriggerSlope).toBeInstanceOf(Function);
      expect(mockScope.setTriggerSlope).toBeInstanceOf(Function);
    });

    it('defines acquisition control', () => {
      const mockScope = createMockOscilloscope();

      expect(mockScope.run).toBeInstanceOf(Function);
      expect(mockScope.stop).toBeInstanceOf(Function);
      expect(mockScope.single).toBeInstanceOf(Function);
      expect(mockScope.autoScale).toBeInstanceOf(Function);
    });

    it('defines measurement methods', () => {
      const mockScope = createMockOscilloscope();

      expect(mockScope.measure).toBeInstanceOf(Function);
      expect(mockScope.getWaveform).toBeInstanceOf(Function);
      expect(mockScope.getScreenshot).toBeInstanceOf(Function);
    });
  });
});

/**
 * Create a mock Oscilloscope for testing.
 */
function createMockOscilloscope(): Oscilloscope {
  const mockChannel: OscilloscopeChannel = {
    channelNumber: 1,
    getEnabled: vi.fn().mockResolvedValue(Ok(true)),
    setEnabled: vi.fn().mockResolvedValue(Ok(undefined)),
    getScale: vi.fn().mockResolvedValue(Ok(1.0)),
    setScale: vi.fn().mockResolvedValue(Ok(undefined)),
    getOffset: vi.fn().mockResolvedValue(Ok(0)),
    setOffset: vi.fn().mockResolvedValue(Ok(undefined)),
    getCoupling: vi.fn().mockResolvedValue(Ok('DC' as Coupling)),
    setCoupling: vi.fn().mockResolvedValue(Ok(undefined)),
    getBandwidthLimit: vi.fn().mockResolvedValue(Ok('OFF' as BandwidthLimit)),
    setBandwidthLimit: vi.fn().mockResolvedValue(Ok(undefined)),
    getProbeAttenuation: vi.fn().mockResolvedValue(Ok(10)),
    setProbeAttenuation: vi.fn().mockResolvedValue(Ok(undefined)),
    getInverted: vi.fn().mockResolvedValue(Ok(false)),
    setInverted: vi.fn().mockResolvedValue(Ok(undefined)),
    getLabel: vi.fn().mockResolvedValue(Ok('CH1')),
    setLabel: vi.fn().mockResolvedValue(Ok(undefined)),
  };

  return {
    // BaseInstrument
    resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
    manufacturer: 'Rigol',
    model: 'DS1054Z',
    serialNumber: 'DS1ZA123456789',
    firmwareVersion: '00.04.04',
    resource: {} as Oscilloscope['resource'],
    capabilities: ['fft', 'math-channels'],
    hasCapability: (cap: string) => ['fft', 'math-channels'].includes(cap),
    reset: vi.fn().mockResolvedValue(Ok(undefined)),
    clear: vi.fn().mockResolvedValue(Ok(undefined)),
    selfTest: vi.fn().mockResolvedValue(Ok(true)),
    getError: vi.fn().mockResolvedValue(Ok(null)),
    close: vi.fn().mockResolvedValue(Ok(undefined)),

    // Oscilloscope-specific
    channelCount: 4,
    channel: vi.fn().mockReturnValue(mockChannel),

    // Timebase
    getTimebase: vi.fn().mockResolvedValue(Ok(1e-3)),
    setTimebase: vi.fn().mockResolvedValue(Ok(undefined)),
    getTimebaseOffset: vi.fn().mockResolvedValue(Ok(0)),
    setTimebaseOffset: vi.fn().mockResolvedValue(Ok(undefined)),
    getTimebaseMode: vi.fn().mockResolvedValue(Ok('MAIN' as TimebaseMode)),
    setTimebaseMode: vi.fn().mockResolvedValue(Ok(undefined)),
    getSampleRate: vi.fn().mockResolvedValue(Ok(1e9)),
    getRecordLength: vi.fn().mockResolvedValue(Ok(12000000)),
    setRecordLength: vi.fn().mockResolvedValue(Ok(undefined)),

    // Trigger
    getTriggerSource: vi.fn().mockResolvedValue(Ok('CH1' as TriggerSource)),
    setTriggerSource: vi.fn().mockResolvedValue(Ok(undefined)),
    getTriggerLevel: vi.fn().mockResolvedValue(Ok(0)),
    setTriggerLevel: vi.fn().mockResolvedValue(Ok(undefined)),
    getTriggerSlope: vi.fn().mockResolvedValue(Ok('RISING' as TriggerSlope)),
    setTriggerSlope: vi.fn().mockResolvedValue(Ok(undefined)),
    getTriggerMode: vi.fn().mockResolvedValue(Ok('AUTO' as TriggerMode)),
    setTriggerMode: vi.fn().mockResolvedValue(Ok(undefined)),
    getTriggerHoldoff: vi.fn().mockResolvedValue(Ok(100e-9)),
    setTriggerHoldoff: vi.fn().mockResolvedValue(Ok(undefined)),
    forceTrigger: vi.fn().mockResolvedValue(Ok(undefined)),

    // Acquisition
    run: vi.fn().mockResolvedValue(Ok(undefined)),
    stop: vi.fn().mockResolvedValue(Ok(undefined)),
    single: vi.fn().mockResolvedValue(Ok(undefined)),
    autoScale: vi.fn().mockResolvedValue(Ok(undefined)),
    getAcquisitionMode: vi.fn().mockResolvedValue(Ok('NORMAL' as AcquisitionMode)),
    setAcquisitionMode: vi.fn().mockResolvedValue(Ok(undefined)),
    getAcquisitionCount: vi.fn().mockResolvedValue(Ok(1)),
    setAcquisitionCount: vi.fn().mockResolvedValue(Ok(undefined)),
    isRunning: vi.fn().mockResolvedValue(Ok(true)),

    // Data
    getWaveform: vi.fn().mockResolvedValue(
      Ok({
        points: new Float64Array([]),
        xIncrement: 1e-9,
        xOrigin: 0,
        yIncrement: 0.01,
        yOrigin: 0,
        xUnit: 's',
        yUnit: 'V',
      } as WaveformData)
    ),
    getWaveformRaw: vi.fn().mockResolvedValue(Ok(Buffer.alloc(0))),

    // Measurements
    measure: vi.fn().mockResolvedValue(Ok(0)),

    // Display
    getScreenshot: vi.fn().mockResolvedValue(Ok(Buffer.alloc(0))),
  };
}
