/**
 * Tests for ElectronicLoad interface and related types.
 *
 * @packageDocumentation
 */

import { describe, it, expect, vi } from 'vitest';
import type {
  ElectronicLoad,
  ElectronicLoadChannel,
  LoadMode,
  ListStep,
} from '../../../src/drivers/equipment/electronic-load.js';
import { LoadMode as LM } from '../../../src/drivers/equipment/electronic-load.js';
import { Ok } from '../../../src/result.js';

describe('ElectronicLoad types', () => {
  describe('LoadMode', () => {
    it('includes standard operating modes', () => {
      expect(LM.ConstantCurrent).toBe('CC');
      expect(LM.ConstantVoltage).toBe('CV');
      expect(LM.ConstantResistance).toBe('CR');
      expect(LM.ConstantPower).toBe('CP');
    });

    it('can be used as a type', () => {
      const mode: LoadMode = 'CC';
      expect(mode).toBe('CC');
    });
  });

  describe('ListStep', () => {
    it('defines list step properties', () => {
      const step: ListStep = {
        value: 1.5,
        duration: 0.5,
        slew: 0.1,
      };
      expect(step.value).toBe(1.5);
      expect(step.duration).toBe(0.5);
      expect(step.slew).toBe(0.1);
    });

    it('allows slew to be optional', () => {
      const step: ListStep = {
        value: 2.0,
        duration: 1.0,
      };
      expect(step.slew).toBeUndefined();
    });
  });

  describe('ElectronicLoadChannel interface', () => {
    it('defines basic channel properties and methods', () => {
      const mockChannel = createMockChannel();

      expect(mockChannel.channelNumber).toBe(1);
      expect(mockChannel.getMode).toBeInstanceOf(Function);
      expect(mockChannel.setMode).toBeInstanceOf(Function);
    });

    it('defines setpoint methods', () => {
      const mockChannel = createMockChannel();

      expect(mockChannel.getCurrent).toBeInstanceOf(Function);
      expect(mockChannel.setCurrent).toBeInstanceOf(Function);
      expect(mockChannel.getVoltage).toBeInstanceOf(Function);
      expect(mockChannel.setVoltage).toBeInstanceOf(Function);
      expect(mockChannel.getResistance).toBeInstanceOf(Function);
      expect(mockChannel.setResistance).toBeInstanceOf(Function);
      expect(mockChannel.getPower).toBeInstanceOf(Function);
      expect(mockChannel.setPower).toBeInstanceOf(Function);
    });

    it('defines input control methods', () => {
      const mockChannel = createMockChannel();

      expect(mockChannel.getInputEnabled).toBeInstanceOf(Function);
      expect(mockChannel.setInputEnabled).toBeInstanceOf(Function);
    });

    it('defines measurement methods', () => {
      const mockChannel = createMockChannel();

      expect(mockChannel.getMeasuredVoltage).toBeInstanceOf(Function);
      expect(mockChannel.getMeasuredCurrent).toBeInstanceOf(Function);
      expect(mockChannel.getMeasuredPower).toBeInstanceOf(Function);
      expect(mockChannel.getMeasuredResistance).toBeInstanceOf(Function);
    });

    it('defines range methods', () => {
      const mockChannel = createMockChannel();

      expect(mockChannel.getCurrentRange).toBeInstanceOf(Function);
      expect(mockChannel.setCurrentRange).toBeInstanceOf(Function);
      expect(mockChannel.getVoltageRange).toBeInstanceOf(Function);
      expect(mockChannel.setVoltageRange).toBeInstanceOf(Function);
    });

    it('defines slew rate methods', () => {
      const mockChannel = createMockChannel();

      expect(mockChannel.getSlewRate).toBeInstanceOf(Function);
      expect(mockChannel.setSlewRate).toBeInstanceOf(Function);
    });

    it('defines OVP protection methods', () => {
      const mockChannel = createMockChannel();

      expect(mockChannel.getOvpLevel).toBeInstanceOf(Function);
      expect(mockChannel.setOvpLevel).toBeInstanceOf(Function);
      expect(mockChannel.getOvpEnabled).toBeInstanceOf(Function);
      expect(mockChannel.setOvpEnabled).toBeInstanceOf(Function);
      expect(mockChannel.getOvpTripped).toBeInstanceOf(Function);
      expect(mockChannel.clearOvp).toBeInstanceOf(Function);
    });

    it('defines OCP protection methods', () => {
      const mockChannel = createMockChannel();

      expect(mockChannel.getOcpLevel).toBeInstanceOf(Function);
      expect(mockChannel.setOcpLevel).toBeInstanceOf(Function);
      expect(mockChannel.getOcpEnabled).toBeInstanceOf(Function);
      expect(mockChannel.setOcpEnabled).toBeInstanceOf(Function);
      expect(mockChannel.getOcpTripped).toBeInstanceOf(Function);
      expect(mockChannel.clearOcp).toBeInstanceOf(Function);
    });

    it('defines Von/Voff threshold methods', () => {
      const mockChannel = createMockChannel();

      expect(mockChannel.getVonThreshold).toBeInstanceOf(Function);
      expect(mockChannel.setVonThreshold).toBeInstanceOf(Function);
      expect(mockChannel.getVoffThreshold).toBeInstanceOf(Function);
      expect(mockChannel.setVoffThreshold).toBeInstanceOf(Function);
    });
  });

  describe('ElectronicLoad interface', () => {
    it('extends BaseInstrument', () => {
      const mockLoad = createMockLoad();

      expect(mockLoad.resourceString).toBeDefined();
      expect(mockLoad.manufacturer).toBeDefined();
      expect(mockLoad.reset).toBeInstanceOf(Function);
    });

    it('defines channel access', () => {
      const mockLoad = createMockLoad();

      expect(mockLoad.channelCount).toBe(1);
      expect(mockLoad.channel).toBeInstanceOf(Function);
    });

    it('defines list mode methods', () => {
      const mockLoad = createMockLoad();

      expect(mockLoad.uploadList).toBeInstanceOf(Function);
      expect(mockLoad.startList).toBeInstanceOf(Function);
      expect(mockLoad.stopList).toBeInstanceOf(Function);
    });

    it('defines global input control methods', () => {
      const mockLoad = createMockLoad();

      expect(mockLoad.enableAllInputs).toBeInstanceOf(Function);
      expect(mockLoad.disableAllInputs).toBeInstanceOf(Function);
    });

    it('defines state save/recall methods', () => {
      const mockLoad = createMockLoad();

      expect(mockLoad.saveState).toBeInstanceOf(Function);
      expect(mockLoad.recallState).toBeInstanceOf(Function);
    });

    it('defines global protection clear method', () => {
      const mockLoad = createMockLoad();

      expect(mockLoad.clearAllProtection).toBeInstanceOf(Function);
    });
  });

  describe('channel operations', () => {
    it('supports setting mode and current', async () => {
      const mockChannel = createMockChannel();

      await mockChannel.setMode('CC');
      await mockChannel.setCurrent(2.5);

      expect(mockChannel.setMode).toHaveBeenCalledWith('CC');
      expect(mockChannel.setCurrent).toHaveBeenCalledWith(2.5);
    });

    it('supports measuring voltage and current', async () => {
      const mockChannel = createMockChannel();

      const vResult = await mockChannel.getMeasuredVoltage();
      const iResult = await mockChannel.getMeasuredCurrent();

      expect(vResult.ok).toBe(true);
      expect(iResult.ok).toBe(true);
      if (vResult.ok) expect(vResult.value).toBe(12.5);
      if (iResult.ok) expect(iResult.value).toBe(2.5);
    });

    it('supports configuring protection', async () => {
      const mockChannel = createMockChannel();

      await mockChannel.setOvpLevel(150);
      await mockChannel.setOvpEnabled(true);
      await mockChannel.setOcpLevel(10);
      await mockChannel.setOcpEnabled(true);

      expect(mockChannel.setOvpLevel).toHaveBeenCalledWith(150);
      expect(mockChannel.setOvpEnabled).toHaveBeenCalledWith(true);
      expect(mockChannel.setOcpLevel).toHaveBeenCalledWith(10);
      expect(mockChannel.setOcpEnabled).toHaveBeenCalledWith(true);
    });

    it('supports configuring slew rate', async () => {
      const mockChannel = createMockChannel();

      await mockChannel.setSlewRate(1000000); // 1 A/s

      expect(mockChannel.setSlewRate).toHaveBeenCalledWith(1000000);
    });

    it('supports Von/Voff thresholds', async () => {
      const mockChannel = createMockChannel();

      await mockChannel.setVonThreshold(3.0);
      await mockChannel.setVoffThreshold(2.5);

      expect(mockChannel.setVonThreshold).toHaveBeenCalledWith(3.0);
      expect(mockChannel.setVoffThreshold).toHaveBeenCalledWith(2.5);
    });
  });

  describe('list mode operations', () => {
    it('supports uploading and running list sequences', async () => {
      const mockLoad = createMockLoad();
      const steps: ListStep[] = [
        { value: 1.0, duration: 1.0 },
        { value: 2.0, duration: 0.5 },
        { value: 0.5, duration: 2.0 },
      ];

      await mockLoad.uploadList('CC', steps, 10);
      await mockLoad.startList();

      expect(mockLoad.uploadList).toHaveBeenCalledWith('CC', steps, 10);
      expect(mockLoad.startList).toHaveBeenCalled();
    });

    it('supports stopping list execution', async () => {
      const mockLoad = createMockLoad();

      await mockLoad.stopList();

      expect(mockLoad.stopList).toHaveBeenCalled();
    });
  });

  describe('global operations', () => {
    it('supports enabling/disabling all inputs', async () => {
      const mockLoad = createMockLoad();

      await mockLoad.enableAllInputs();
      await mockLoad.disableAllInputs();

      expect(mockLoad.enableAllInputs).toHaveBeenCalled();
      expect(mockLoad.disableAllInputs).toHaveBeenCalled();
    });

    it('supports state save/recall', async () => {
      const mockLoad = createMockLoad();

      await mockLoad.saveState(1);
      await mockLoad.recallState(1);

      expect(mockLoad.saveState).toHaveBeenCalledWith(1);
      expect(mockLoad.recallState).toHaveBeenCalledWith(1);
    });

    it('supports clearing all protection', async () => {
      const mockLoad = createMockLoad();

      await mockLoad.clearAllProtection();

      expect(mockLoad.clearAllProtection).toHaveBeenCalled();
    });
  });
});

/**
 * Create a mock ElectronicLoadChannel for testing.
 */
function createMockChannel(num = 1): ElectronicLoadChannel {
  return {
    channelNumber: num,

    // Mode
    getMode: vi.fn().mockResolvedValue(Ok('CC' as LoadMode)),
    setMode: vi.fn().mockResolvedValue(Ok(undefined)),

    // Setpoints
    getCurrent: vi.fn().mockResolvedValue(Ok(2.5)),
    setCurrent: vi.fn().mockResolvedValue(Ok(undefined)),
    getVoltage: vi.fn().mockResolvedValue(Ok(12.0)),
    setVoltage: vi.fn().mockResolvedValue(Ok(undefined)),
    getResistance: vi.fn().mockResolvedValue(Ok(10.0)),
    setResistance: vi.fn().mockResolvedValue(Ok(undefined)),
    getPower: vi.fn().mockResolvedValue(Ok(25.0)),
    setPower: vi.fn().mockResolvedValue(Ok(undefined)),

    // Input control
    getInputEnabled: vi.fn().mockResolvedValue(Ok(false)),
    setInputEnabled: vi.fn().mockResolvedValue(Ok(undefined)),

    // Measurements
    getMeasuredVoltage: vi.fn().mockResolvedValue(Ok(12.5)),
    getMeasuredCurrent: vi.fn().mockResolvedValue(Ok(2.5)),
    getMeasuredPower: vi.fn().mockResolvedValue(Ok(31.25)),
    getMeasuredResistance: vi.fn().mockResolvedValue(Ok(5.0)),

    // Ranges
    getCurrentRange: vi.fn().mockResolvedValue(Ok(40)),
    setCurrentRange: vi.fn().mockResolvedValue(Ok(undefined)),
    getVoltageRange: vi.fn().mockResolvedValue(Ok(150)),
    setVoltageRange: vi.fn().mockResolvedValue(Ok(undefined)),

    // Slew rate
    getSlewRate: vi.fn().mockResolvedValue(Ok(1000000)),
    setSlewRate: vi.fn().mockResolvedValue(Ok(undefined)),

    // OVP
    getOvpLevel: vi.fn().mockResolvedValue(Ok(150)),
    setOvpLevel: vi.fn().mockResolvedValue(Ok(undefined)),
    getOvpEnabled: vi.fn().mockResolvedValue(Ok(false)),
    setOvpEnabled: vi.fn().mockResolvedValue(Ok(undefined)),
    getOvpTripped: vi.fn().mockResolvedValue(Ok(false)),
    clearOvp: vi.fn().mockResolvedValue(Ok(undefined)),

    // OCP
    getOcpLevel: vi.fn().mockResolvedValue(Ok(40)),
    setOcpLevel: vi.fn().mockResolvedValue(Ok(undefined)),
    getOcpEnabled: vi.fn().mockResolvedValue(Ok(false)),
    setOcpEnabled: vi.fn().mockResolvedValue(Ok(undefined)),
    getOcpTripped: vi.fn().mockResolvedValue(Ok(false)),
    clearOcp: vi.fn().mockResolvedValue(Ok(undefined)),

    // Von/Voff
    getVonThreshold: vi.fn().mockResolvedValue(Ok(0)),
    setVonThreshold: vi.fn().mockResolvedValue(Ok(undefined)),
    getVoffThreshold: vi.fn().mockResolvedValue(Ok(0)),
    setVoffThreshold: vi.fn().mockResolvedValue(Ok(undefined)),
  };
}

/**
 * Create a mock ElectronicLoad for testing.
 */
function createMockLoad(): ElectronicLoad {
  const mockChannel = createMockChannel();

  return {
    // BaseInstrument
    resourceString: 'USB0::0x1AB1::0x0E11::DL3A123456789::INSTR',
    manufacturer: 'Rigol',
    model: 'DL3021',
    serialNumber: 'DL3A123456789',
    firmwareVersion: '00.01.00',
    resource: {} as ElectronicLoad['resource'],
    reset: vi.fn().mockResolvedValue(Ok(undefined)),
    clear: vi.fn().mockResolvedValue(Ok(undefined)),
    selfTest: vi.fn().mockResolvedValue(Ok(true)),
    getError: vi.fn().mockResolvedValue(Ok(null)),
    close: vi.fn().mockResolvedValue(Ok(undefined)),

    // ElectronicLoad-specific
    channelCount: 1,
    channel: vi.fn().mockReturnValue(mockChannel),

    // List mode
    uploadList: vi.fn().mockResolvedValue(Ok(true)),
    startList: vi.fn().mockResolvedValue(Ok(true)),
    stopList: vi.fn().mockResolvedValue(Ok(true)),

    // Global input control
    enableAllInputs: vi.fn().mockResolvedValue(Ok(undefined)),
    disableAllInputs: vi.fn().mockResolvedValue(Ok(undefined)),

    // State save/recall
    saveState: vi.fn().mockResolvedValue(Ok(undefined)),
    recallState: vi.fn().mockResolvedValue(Ok(undefined)),

    // Protection clear
    clearAllProtection: vi.fn().mockResolvedValue(Ok(undefined)),
  };
}
