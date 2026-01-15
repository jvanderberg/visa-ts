import { describe, it, expect, vi } from 'vitest';
import type {
  BaseInstrument,
  Oscilloscope,
  OscilloscopeChannel,
  PowerSupply,
  PowerSupplyChannel,
  Multimeter,
  MultimeterDisplay,
} from '../../src/drivers/equipment/index.js';
import { Ok } from '../../src/result.js';

describe('Equipment Types', () => {
  describe('BaseInstrument', () => {
    it('defines required properties and methods', () => {
      const mockInstrument: BaseInstrument = {
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
        manufacturer: 'RIGOL',
        model: 'DS1054Z',
        serialNumber: 'DS1ZA123456789',
        firmwareVersion: '00.04.04',
        resource: {} as BaseInstrument['resource'],
        capabilities: ['fft', 'math-channels'],
        reset: vi.fn().mockResolvedValue(Ok(undefined)),
        clear: vi.fn().mockResolvedValue(Ok(undefined)),
        selfTest: vi.fn().mockResolvedValue(Ok(true)),
        getError: vi.fn().mockResolvedValue(Ok(null)),
        close: vi.fn().mockResolvedValue(Ok(undefined)),
        hasCapability: vi.fn((cap) => mockInstrument.capabilities.includes(cap)),
      };

      expect(mockInstrument.manufacturer).toBe('RIGOL');
      expect(mockInstrument.model).toBe('DS1054Z');
      expect(mockInstrument.hasCapability('fft')).toBe(true);
      expect(mockInstrument.hasCapability('unknown')).toBe(false);
    });
  });

  describe('Oscilloscope', () => {
    it('defines oscilloscope-specific properties and methods', () => {
      const mockChannel: OscilloscopeChannel = {
        channelNumber: 1,
        getEnabled: vi.fn().mockResolvedValue(Ok(true)),
        setEnabled: vi.fn().mockResolvedValue(Ok(undefined)),
        getScale: vi.fn().mockResolvedValue(Ok(1.0)),
        setScale: vi.fn().mockResolvedValue(Ok(undefined)),
        getOffset: vi.fn().mockResolvedValue(Ok(0)),
        setOffset: vi.fn().mockResolvedValue(Ok(undefined)),
        getCoupling: vi.fn().mockResolvedValue(Ok('DC')),
        setCoupling: vi.fn().mockResolvedValue(Ok(undefined)),
        getBandwidthLimit: vi.fn().mockResolvedValue(Ok('OFF')),
        setBandwidthLimit: vi.fn().mockResolvedValue(Ok(undefined)),
        getProbeAttenuation: vi.fn().mockResolvedValue(Ok(10)),
        setProbeAttenuation: vi.fn().mockResolvedValue(Ok(undefined)),
        getInverted: vi.fn().mockResolvedValue(Ok(false)),
        setInverted: vi.fn().mockResolvedValue(Ok(undefined)),
        getLabel: vi.fn().mockResolvedValue(Ok('CH1')),
        setLabel: vi.fn().mockResolvedValue(Ok(undefined)),
      };

      const mockScope: Oscilloscope = {
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
        manufacturer: 'RIGOL',
        model: 'DS1054Z',
        serialNumber: 'DS1ZA123456789',
        firmwareVersion: '00.04.04',
        resource: {} as Oscilloscope['resource'],
        capabilities: ['fft'],
        channelCount: 4,
        digitalChannelCount: 0,
        reset: vi.fn().mockResolvedValue(Ok(undefined)),
        clear: vi.fn().mockResolvedValue(Ok(undefined)),
        selfTest: vi.fn().mockResolvedValue(Ok(true)),
        getError: vi.fn().mockResolvedValue(Ok(null)),
        close: vi.fn().mockResolvedValue(Ok(undefined)),
        hasCapability: vi.fn().mockReturnValue(true),
        channel: vi.fn().mockReturnValue(mockChannel),
        getTimebase: vi.fn().mockResolvedValue(Ok(1e-3)),
        setTimebase: vi.fn().mockResolvedValue(Ok(undefined)),
        getTimebaseOffset: vi.fn().mockResolvedValue(Ok(0)),
        setTimebaseOffset: vi.fn().mockResolvedValue(Ok(undefined)),
        getTimebaseMode: vi.fn().mockResolvedValue(Ok('MAIN')),
        setTimebaseMode: vi.fn().mockResolvedValue(Ok(undefined)),
        getSampleRate: vi.fn().mockResolvedValue(Ok(1e9)),
        getRecordLength: vi.fn().mockResolvedValue(Ok(12000)),
        setRecordLength: vi.fn().mockResolvedValue(Ok(undefined)),
        getTriggerSource: vi.fn().mockResolvedValue(Ok('CH1')),
        setTriggerSource: vi.fn().mockResolvedValue(Ok(undefined)),
        getTriggerLevel: vi.fn().mockResolvedValue(Ok(0)),
        setTriggerLevel: vi.fn().mockResolvedValue(Ok(undefined)),
        getTriggerSlope: vi.fn().mockResolvedValue(Ok('RISING')),
        setTriggerSlope: vi.fn().mockResolvedValue(Ok(undefined)),
        getTriggerMode: vi.fn().mockResolvedValue(Ok('AUTO')),
        setTriggerMode: vi.fn().mockResolvedValue(Ok(undefined)),
        forceTrigger: vi.fn().mockResolvedValue(Ok(undefined)),
        run: vi.fn().mockResolvedValue(Ok(undefined)),
        stop: vi.fn().mockResolvedValue(Ok(undefined)),
        single: vi.fn().mockResolvedValue(Ok(undefined)),
        autoScale: vi.fn().mockResolvedValue(Ok(undefined)),
        getAcquisitionMode: vi.fn().mockResolvedValue(Ok('NORMAL')),
        setAcquisitionMode: vi.fn().mockResolvedValue(Ok(undefined)),
        isRunning: vi.fn().mockResolvedValue(Ok(true)),
        getWaveform: vi.fn().mockResolvedValue(
          Ok({
            points: new Float64Array([0, 1, 2, 3]),
            xIncrement: 1e-9,
            xOrigin: 0,
            yIncrement: 0.01,
            yOrigin: 0,
            xUnit: 's' as const,
            yUnit: 'V' as const,
          })
        ),
        getWaveformRaw: vi.fn().mockResolvedValue(Ok(Buffer.from([0, 1, 2, 3]))),
        measure: vi.fn().mockResolvedValue(Ok(1000)),
        measureAll: vi.fn().mockResolvedValue(Ok({ frequency: 1000, vpp: 2.5 })),
        getScreenshot: vi.fn().mockResolvedValue(Ok(Buffer.from([]))),
      };

      expect(mockScope.channelCount).toBe(4);
      expect(mockScope.digitalChannelCount).toBe(0);
      expect(mockScope.channel(1)).toBe(mockChannel);
    });
  });

  describe('PowerSupply', () => {
    it('defines power supply-specific properties and methods', () => {
      const mockChannel: PowerSupplyChannel = {
        channelNumber: 1,
        getOutputEnabled: vi.fn().mockResolvedValue(Ok(true)),
        setOutputEnabled: vi.fn().mockResolvedValue(Ok(undefined)),
        getVoltage: vi.fn().mockResolvedValue(Ok(5.0)),
        setVoltage: vi.fn().mockResolvedValue(Ok(undefined)),
        getCurrent: vi.fn().mockResolvedValue(Ok(1.0)),
        setCurrent: vi.fn().mockResolvedValue(Ok(undefined)),
        measureVoltage: vi.fn().mockResolvedValue(Ok(4.98)),
        measureCurrent: vi.fn().mockResolvedValue(Ok(0.5)),
        measurePower: vi.fn().mockResolvedValue(Ok(2.49)),
        getMode: vi.fn().mockResolvedValue(Ok('CV')),
      };

      const mockPsu: PowerSupply = {
        resourceString: 'USB0::0x1AB1::0x0E11::DP8A123::INSTR',
        manufacturer: 'RIGOL',
        model: 'DP832',
        serialNumber: 'DP8A123456789',
        firmwareVersion: '00.01.16',
        resource: {} as PowerSupply['resource'],
        capabilities: ['ovp', 'ocp'],
        channelCount: 3,
        reset: vi.fn().mockResolvedValue(Ok(undefined)),
        clear: vi.fn().mockResolvedValue(Ok(undefined)),
        selfTest: vi.fn().mockResolvedValue(Ok(true)),
        getError: vi.fn().mockResolvedValue(Ok(null)),
        close: vi.fn().mockResolvedValue(Ok(undefined)),
        hasCapability: vi.fn().mockReturnValue(true),
        channel: vi.fn().mockReturnValue(mockChannel),
        getAllOutputEnabled: vi.fn().mockResolvedValue(Ok(false)),
        setAllOutputEnabled: vi.fn().mockResolvedValue(Ok(undefined)),
        getVoltage: vi.fn().mockResolvedValue(Ok(5.0)),
        setVoltage: vi.fn().mockResolvedValue(Ok(undefined)),
        getCurrent: vi.fn().mockResolvedValue(Ok(1.0)),
        setCurrent: vi.fn().mockResolvedValue(Ok(undefined)),
        getOutputEnabled: vi.fn().mockResolvedValue(Ok(true)),
        setOutputEnabled: vi.fn().mockResolvedValue(Ok(undefined)),
        measureVoltage: vi.fn().mockResolvedValue(Ok(4.98)),
        measureCurrent: vi.fn().mockResolvedValue(Ok(0.5)),
        measurePower: vi.fn().mockResolvedValue(Ok(2.49)),
      };

      expect(mockPsu.channelCount).toBe(3);
      expect(mockPsu.channel(1)).toBe(mockChannel);
    });
  });

  describe('Multimeter', () => {
    it('defines multimeter-specific properties and methods', () => {
      const mockDisplay: MultimeterDisplay = {
        displayNumber: 1,
        getFunction: vi.fn().mockResolvedValue(Ok('VDC')),
        setFunction: vi.fn().mockResolvedValue(Ok(undefined)),
        getRange: vi.fn().mockResolvedValue(Ok('AUTO')),
        setRange: vi.fn().mockResolvedValue(Ok(undefined)),
        getAutoRangeEnabled: vi.fn().mockResolvedValue(Ok(true)),
        setAutoRangeEnabled: vi.fn().mockResolvedValue(Ok(undefined)),
        measure: vi.fn().mockResolvedValue(Ok(5.0123)),
        fetch: vi.fn().mockResolvedValue(Ok(5.0123)),
        read: vi.fn().mockResolvedValue(Ok(5.0123)),
        getNplc: vi.fn().mockResolvedValue(Ok(10)),
        setNplc: vi.fn().mockResolvedValue(Ok(undefined)),
      };

      const mockDmm: Multimeter = {
        resourceString: 'USB0::0x2A8D::0x0101::MY12345::INSTR',
        manufacturer: 'Keysight Technologies',
        model: '34465A',
        serialNumber: 'MY12345678',
        firmwareVersion: 'A.02.14-02.40-02.14-00.49-02-01',
        resource: {} as Multimeter['resource'],
        capabilities: ['dual-display', 'data-logging'],
        displayCount: 1,
        reset: vi.fn().mockResolvedValue(Ok(undefined)),
        clear: vi.fn().mockResolvedValue(Ok(undefined)),
        selfTest: vi.fn().mockResolvedValue(Ok(true)),
        getError: vi.fn().mockResolvedValue(Ok(null)),
        close: vi.fn().mockResolvedValue(Ok(undefined)),
        hasCapability: vi.fn().mockReturnValue(true),
        display: vi.fn().mockReturnValue(mockDisplay),
        getFunction: vi.fn().mockResolvedValue(Ok('VDC')),
        setFunction: vi.fn().mockResolvedValue(Ok(undefined)),
        getRange: vi.fn().mockResolvedValue(Ok('AUTO')),
        setRange: vi.fn().mockResolvedValue(Ok(undefined)),
        measure: vi.fn().mockResolvedValue(Ok(5.0123)),
        fetch: vi.fn().mockResolvedValue(Ok(5.0123)),
        getTriggerSource: vi.fn().mockResolvedValue(Ok('IMMEDIATE')),
        setTriggerSource: vi.fn().mockResolvedValue(Ok(undefined)),
        getTriggerDelay: vi.fn().mockResolvedValue(Ok('AUTO')),
        setTriggerDelay: vi.fn().mockResolvedValue(Ok(undefined)),
        initiate: vi.fn().mockResolvedValue(Ok(undefined)),
        abort: vi.fn().mockResolvedValue(Ok(undefined)),
        getStatistics: vi.fn().mockResolvedValue(
          Ok({
            min: 4.9,
            max: 5.1,
            average: 5.0,
            stdDev: 0.05,
            count: 100,
          })
        ),
        clearStatistics: vi.fn().mockResolvedValue(Ok(undefined)),
      };

      expect(mockDmm.displayCount).toBe(1);
      expect(mockDmm.display(1)).toBe(mockDisplay);
    });
  });
});
