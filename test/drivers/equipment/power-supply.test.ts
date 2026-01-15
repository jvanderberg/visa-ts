/**
 * Tests for PowerSupply interface and related types.
 *
 * @packageDocumentation
 */

import { describe, it, expect, vi } from 'vitest';
import type {
  PowerSupply,
  PowerSupplyChannel,
  RegulationMode,
  TrackingMode,
  PowerSupplyCapability,
} from '../../../src/drivers/equipment/power-supply.js';
import { Ok } from '../../../src/result.js';

describe('PowerSupply types', () => {
  describe('RegulationMode', () => {
    it('includes standard regulation modes', () => {
      const modes: RegulationMode[] = ['CV', 'CC', 'UR'];
      expect(modes).toContain('CV');
      expect(modes).toContain('CC');
      expect(modes).toContain('UR');
    });
  });

  describe('TrackingMode', () => {
    it('includes standard tracking modes', () => {
      const modes: TrackingMode[] = ['INDEPENDENT', 'SERIES', 'PARALLEL'];
      expect(modes.length).toBe(3);
    });
  });

  describe('PowerSupplyCapability', () => {
    it('includes common capabilities', () => {
      const caps: PowerSupplyCapability[] = [
        'tracking',
        'series-parallel',
        'sequencing',
        'ovp',
        'ocp',
        'remote-sense',
      ];
      expect(caps).toContain('ovp');
      expect(caps).toContain('ocp');
    });
  });

  describe('PowerSupplyChannel interface', () => {
    it('defines channel properties and methods', () => {
      const mockChannel: PowerSupplyChannel = {
        channelNumber: 1,
        getOutputEnabled: vi.fn().mockResolvedValue(Ok(true)),
        setOutputEnabled: vi.fn().mockResolvedValue(Ok(undefined)),
        getVoltage: vi.fn().mockResolvedValue(Ok(5.0)),
        setVoltage: vi.fn().mockResolvedValue(Ok(undefined)),
        getCurrent: vi.fn().mockResolvedValue(Ok(1.0)),
        setCurrent: vi.fn().mockResolvedValue(Ok(undefined)),
        measureVoltage: vi.fn().mockResolvedValue(Ok(5.0)),
        measureCurrent: vi.fn().mockResolvedValue(Ok(0.5)),
        measurePower: vi.fn().mockResolvedValue(Ok(2.5)),
        getMode: vi.fn().mockResolvedValue(Ok('CV' as RegulationMode)),
      };

      expect(mockChannel.channelNumber).toBe(1);
      expect(mockChannel.getVoltage).toBeInstanceOf(Function);
      expect(mockChannel.setVoltage).toBeInstanceOf(Function);
    });

    it('defines protection methods', () => {
      const mockChannel = createMockChannel();

      expect(mockChannel.getOvpEnabled).toBeInstanceOf(Function);
      expect(mockChannel.setOvpEnabled).toBeInstanceOf(Function);
      expect(mockChannel.getOvpLevel).toBeInstanceOf(Function);
      expect(mockChannel.setOvpLevel).toBeInstanceOf(Function);
      expect(mockChannel.getOcpEnabled).toBeInstanceOf(Function);
      expect(mockChannel.setOcpEnabled).toBeInstanceOf(Function);
      expect(mockChannel.clearProtection).toBeInstanceOf(Function);
    });
  });

  describe('PowerSupply interface', () => {
    it('extends BaseInstrument', () => {
      const mockPsu = createMockPowerSupply();

      // From BaseInstrument
      expect(mockPsu.resourceString).toBeDefined();
      expect(mockPsu.manufacturer).toBeDefined();
      expect(mockPsu.reset).toBeInstanceOf(Function);
    });

    it('defines channel access', () => {
      const mockPsu = createMockPowerSupply();

      expect(mockPsu.channelCount).toBe(3);
      expect(mockPsu.channel).toBeInstanceOf(Function);
    });

    it('defines global output control', () => {
      const mockPsu = createMockPowerSupply();

      expect(mockPsu.getAllOutputEnabled).toBeInstanceOf(Function);
      expect(mockPsu.setAllOutputEnabled).toBeInstanceOf(Function);
    });

    it('defines convenience methods for single-channel access', () => {
      const mockPsu = createMockPowerSupply();

      // These delegate to channel(1)
      expect(mockPsu.getVoltage).toBeInstanceOf(Function);
      expect(mockPsu.setVoltage).toBeInstanceOf(Function);
      expect(mockPsu.getCurrent).toBeInstanceOf(Function);
      expect(mockPsu.setCurrent).toBeInstanceOf(Function);
      expect(mockPsu.getOutputEnabled).toBeInstanceOf(Function);
      expect(mockPsu.setOutputEnabled).toBeInstanceOf(Function);
      expect(mockPsu.measureVoltage).toBeInstanceOf(Function);
      expect(mockPsu.measureCurrent).toBeInstanceOf(Function);
      expect(mockPsu.measurePower).toBeInstanceOf(Function);
    });
  });

  describe('multi-channel usage', () => {
    it('supports independent channel configuration', async () => {
      const mockPsu = createMockPowerSupply();

      // Each channel can be configured independently
      await mockPsu.channel(1).setVoltage(3.3);
      await mockPsu.channel(2).setVoltage(5.0);
      await mockPsu.channel(3).setVoltage(12.0);

      expect(mockPsu.channel).toHaveBeenCalledWith(1);
      expect(mockPsu.channel).toHaveBeenCalledWith(2);
      expect(mockPsu.channel).toHaveBeenCalledWith(3);
    });
  });
});

/**
 * Create a mock PowerSupplyChannel for testing.
 */
function createMockChannel(num = 1): PowerSupplyChannel {
  return {
    channelNumber: num,
    getOutputEnabled: vi.fn().mockResolvedValue(Ok(false)),
    setOutputEnabled: vi.fn().mockResolvedValue(Ok(undefined)),
    getVoltage: vi.fn().mockResolvedValue(Ok(0)),
    setVoltage: vi.fn().mockResolvedValue(Ok(undefined)),
    getVoltageLimit: vi.fn().mockResolvedValue(Ok(30)),
    setVoltageLimit: vi.fn().mockResolvedValue(Ok(undefined)),
    getCurrent: vi.fn().mockResolvedValue(Ok(0)),
    setCurrent: vi.fn().mockResolvedValue(Ok(undefined)),
    getCurrentLimit: vi.fn().mockResolvedValue(Ok(3)),
    setCurrentLimit: vi.fn().mockResolvedValue(Ok(undefined)),
    measureVoltage: vi.fn().mockResolvedValue(Ok(0)),
    measureCurrent: vi.fn().mockResolvedValue(Ok(0)),
    measurePower: vi.fn().mockResolvedValue(Ok(0)),
    getMode: vi.fn().mockResolvedValue(Ok('CV' as RegulationMode)),
    getOvpEnabled: vi.fn().mockResolvedValue(Ok(false)),
    setOvpEnabled: vi.fn().mockResolvedValue(Ok(undefined)),
    getOvpLevel: vi.fn().mockResolvedValue(Ok(33)),
    setOvpLevel: vi.fn().mockResolvedValue(Ok(undefined)),
    getOcpEnabled: vi.fn().mockResolvedValue(Ok(false)),
    setOcpEnabled: vi.fn().mockResolvedValue(Ok(undefined)),
    getOcpLevel: vi.fn().mockResolvedValue(Ok(3.3)),
    setOcpLevel: vi.fn().mockResolvedValue(Ok(undefined)),
    clearProtection: vi.fn().mockResolvedValue(Ok(undefined)),
  };
}

/**
 * Create a mock PowerSupply for testing.
 */
function createMockPowerSupply(): PowerSupply {
  const mockChannel = createMockChannel();

  return {
    // BaseInstrument
    resourceString: 'USB0::0x1AB1::0x0E11::DP8C123456789::INSTR',
    manufacturer: 'Rigol',
    model: 'DP832',
    serialNumber: 'DP8C123456789',
    firmwareVersion: '00.01.14',
    resource: {} as PowerSupply['resource'],
    capabilities: ['ovp', 'ocp', 'tracking'],
    hasCapability: (cap: string) => ['ovp', 'ocp', 'tracking'].includes(cap),
    reset: vi.fn().mockResolvedValue(Ok(undefined)),
    clear: vi.fn().mockResolvedValue(Ok(undefined)),
    selfTest: vi.fn().mockResolvedValue(Ok(true)),
    getError: vi.fn().mockResolvedValue(Ok(null)),
    close: vi.fn().mockResolvedValue(Ok(undefined)),

    // PowerSupply-specific
    channelCount: 3,
    channel: vi.fn().mockReturnValue(mockChannel),

    // Global controls
    getAllOutputEnabled: vi.fn().mockResolvedValue(Ok(false)),
    setAllOutputEnabled: vi.fn().mockResolvedValue(Ok(undefined)),

    // Convenience methods (delegate to channel 1)
    getVoltage: vi.fn().mockResolvedValue(Ok(0)),
    setVoltage: vi.fn().mockResolvedValue(Ok(undefined)),
    getCurrent: vi.fn().mockResolvedValue(Ok(0)),
    setCurrent: vi.fn().mockResolvedValue(Ok(undefined)),
    getOutputEnabled: vi.fn().mockResolvedValue(Ok(false)),
    setOutputEnabled: vi.fn().mockResolvedValue(Ok(undefined)),
    measureVoltage: vi.fn().mockResolvedValue(Ok(0)),
    measureCurrent: vi.fn().mockResolvedValue(Ok(0)),
    measurePower: vi.fn().mockResolvedValue(Ok(0)),
  };
}
