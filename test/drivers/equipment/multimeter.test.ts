/**
 * Tests for Multimeter interface and related types.
 *
 * @packageDocumentation
 */

import { describe, it, expect, vi } from 'vitest';
import type {
  Multimeter,
  MultimeterDisplay,
  DmmFunction,
  DmmStatistics,
  AcBandwidth,
} from '../../../src/drivers/equipment/multimeter.js';
import { Ok } from '../../../src/result.js';

describe('Multimeter types', () => {
  describe('DmmFunction', () => {
    it('includes voltage functions', () => {
      const funcs: DmmFunction[] = ['VDC', 'VAC', 'VDC_AC'];
      expect(funcs).toContain('VDC');
      expect(funcs).toContain('VAC');
    });

    it('includes current functions', () => {
      const funcs: DmmFunction[] = ['ADC', 'AAC', 'ADC_AC'];
      expect(funcs).toContain('ADC');
      expect(funcs).toContain('AAC');
    });

    it('includes resistance functions', () => {
      const funcs: DmmFunction[] = ['RESISTANCE_2W', 'RESISTANCE_4W'];
      expect(funcs.length).toBe(2);
    });

    it('includes frequency/period functions', () => {
      const funcs: DmmFunction[] = ['FREQUENCY', 'PERIOD'];
      expect(funcs.length).toBe(2);
    });

    it('includes test functions', () => {
      const funcs: DmmFunction[] = ['CONTINUITY', 'DIODE'];
      expect(funcs).toContain('CONTINUITY');
      expect(funcs).toContain('DIODE');
    });
  });

  describe('AcBandwidth', () => {
    it('includes bandwidth settings', () => {
      const bws: AcBandwidth[] = ['SLOW', 'MEDIUM', 'FAST'];
      expect(bws.length).toBe(3);
    });
  });

  describe('DmmStatistics', () => {
    it('contains measurement statistics', () => {
      const stats: DmmStatistics = {
        min: 1.0,
        max: 5.0,
        average: 3.0,
        stdDev: 0.5,
        count: 100,
      };

      expect(stats.min).toBe(1.0);
      expect(stats.max).toBe(5.0);
      expect(stats.average).toBe(3.0);
      expect(stats.stdDev).toBe(0.5);
      expect(stats.count).toBe(100);
    });
  });

  describe('MultimeterDisplay interface', () => {
    it('defines display properties and methods', () => {
      const mockDisplay = createMockDisplay();

      expect(mockDisplay.displayNumber).toBe(1);
      expect(mockDisplay.getFunction).toBeInstanceOf(Function);
      expect(mockDisplay.setFunction).toBeInstanceOf(Function);
      expect(mockDisplay.getRange).toBeInstanceOf(Function);
      expect(mockDisplay.setRange).toBeInstanceOf(Function);
      expect(mockDisplay.measure).toBeInstanceOf(Function);
    });

    it('defines resolution settings', () => {
      const mockDisplay = createMockDisplay();

      expect(mockDisplay.getNplc).toBeInstanceOf(Function);
      expect(mockDisplay.setNplc).toBeInstanceOf(Function);
      expect(mockDisplay.getAperture).toBeInstanceOf(Function);
      expect(mockDisplay.setAperture).toBeInstanceOf(Function);
    });

    it('defines null/relative offset', () => {
      const mockDisplay = createMockDisplay();

      expect(mockDisplay.getNullEnabled).toBeInstanceOf(Function);
      expect(mockDisplay.setNullEnabled).toBeInstanceOf(Function);
      expect(mockDisplay.getNullValue).toBeInstanceOf(Function);
      expect(mockDisplay.setNullValue).toBeInstanceOf(Function);
    });
  });

  describe('Multimeter interface', () => {
    it('extends BaseInstrument', () => {
      const mockDmm = createMockMultimeter();

      // From BaseInstrument
      expect(mockDmm.resourceString).toBeDefined();
      expect(mockDmm.manufacturer).toBeDefined();
      expect(mockDmm.reset).toBeInstanceOf(Function);
    });

    it('defines display access', () => {
      const mockDmm = createMockMultimeter();

      expect(mockDmm.displayCount).toBe(1);
      expect(mockDmm.display).toBeInstanceOf(Function);
    });

    it('defines convenience methods for primary display', () => {
      const mockDmm = createMockMultimeter();

      expect(mockDmm.getFunction).toBeInstanceOf(Function);
      expect(mockDmm.setFunction).toBeInstanceOf(Function);
      expect(mockDmm.getRange).toBeInstanceOf(Function);
      expect(mockDmm.setRange).toBeInstanceOf(Function);
      expect(mockDmm.measure).toBeInstanceOf(Function);
      expect(mockDmm.fetch).toBeInstanceOf(Function);
    });

    it('defines statistics methods', () => {
      const mockDmm = createMockMultimeter();

      expect(mockDmm.getStatistics).toBeInstanceOf(Function);
      expect(mockDmm.clearStatistics).toBeInstanceOf(Function);
    });

    it('defines trigger methods', () => {
      const mockDmm = createMockMultimeter();

      expect(mockDmm.getTriggerSource).toBeInstanceOf(Function);
      expect(mockDmm.setTriggerSource).toBeInstanceOf(Function);
      expect(mockDmm.initiate).toBeInstanceOf(Function);
      expect(mockDmm.abort).toBeInstanceOf(Function);
    });
  });
});

/**
 * Create a mock MultimeterDisplay for testing.
 */
function createMockDisplay(num = 1): MultimeterDisplay {
  return {
    displayNumber: num,
    getFunction: vi.fn().mockResolvedValue(Ok('VDC' as DmmFunction)),
    setFunction: vi.fn().mockResolvedValue(Ok(undefined)),
    getRange: vi.fn().mockResolvedValue(Ok(10)),
    setRange: vi.fn().mockResolvedValue(Ok(undefined)),
    getAutoRangeEnabled: vi.fn().mockResolvedValue(Ok(true)),
    setAutoRangeEnabled: vi.fn().mockResolvedValue(Ok(undefined)),
    measure: vi.fn().mockResolvedValue(Ok(5.0)),
    fetch: vi.fn().mockResolvedValue(Ok(5.0)),
    read: vi.fn().mockResolvedValue(Ok(5.0)),
    getNplc: vi.fn().mockResolvedValue(Ok(1)),
    setNplc: vi.fn().mockResolvedValue(Ok(undefined)),
    getAperture: vi.fn().mockResolvedValue(Ok(0.02)),
    setAperture: vi.fn().mockResolvedValue(Ok(undefined)),
    getAcBandwidth: vi.fn().mockResolvedValue(Ok('MEDIUM' as AcBandwidth)),
    setAcBandwidth: vi.fn().mockResolvedValue(Ok(undefined)),
    getNullEnabled: vi.fn().mockResolvedValue(Ok(false)),
    setNullEnabled: vi.fn().mockResolvedValue(Ok(undefined)),
    getNullValue: vi.fn().mockResolvedValue(Ok(0)),
    setNullValue: vi.fn().mockResolvedValue(Ok(undefined)),
    acquireNull: vi.fn().mockResolvedValue(Ok(undefined)),
  };
}

/**
 * Create a mock Multimeter for testing.
 */
function createMockMultimeter(): Multimeter {
  const mockDisplay = createMockDisplay();

  return {
    // BaseInstrument
    resourceString: 'USB0::0x2A8D::0x1301::MY54500001::INSTR',
    manufacturer: 'Keysight',
    model: '34465A',
    serialNumber: 'MY54500001',
    firmwareVersion: 'A.02.14',
    resource: {} as Multimeter['resource'],
    capabilities: ['data-logging'],
    hasCapability: (cap: string) => ['data-logging'].includes(cap),
    reset: vi.fn().mockResolvedValue(Ok(undefined)),
    clear: vi.fn().mockResolvedValue(Ok(undefined)),
    selfTest: vi.fn().mockResolvedValue(Ok(true)),
    getError: vi.fn().mockResolvedValue(Ok(null)),
    close: vi.fn().mockResolvedValue(Ok(undefined)),

    // Multimeter-specific
    displayCount: 1,
    display: vi.fn().mockReturnValue(mockDisplay),

    // Convenience methods (primary display)
    getFunction: vi.fn().mockResolvedValue(Ok('VDC' as DmmFunction)),
    setFunction: vi.fn().mockResolvedValue(Ok(undefined)),
    getRange: vi.fn().mockResolvedValue(Ok(10)),
    setRange: vi.fn().mockResolvedValue(Ok(undefined)),
    measure: vi.fn().mockResolvedValue(Ok(5.0)),
    fetch: vi.fn().mockResolvedValue(Ok(5.0)),

    // Triggering
    getTriggerSource: vi.fn().mockResolvedValue(Ok('IMMEDIATE')),
    setTriggerSource: vi.fn().mockResolvedValue(Ok(undefined)),
    getTriggerDelay: vi.fn().mockResolvedValue(Ok(0)),
    setTriggerDelay: vi.fn().mockResolvedValue(Ok(undefined)),
    initiate: vi.fn().mockResolvedValue(Ok(undefined)),
    abort: vi.fn().mockResolvedValue(Ok(undefined)),

    // Statistics
    getStatistics: vi.fn().mockResolvedValue(
      Ok({
        min: 0,
        max: 0,
        average: 0,
        stdDev: 0,
        count: 0,
      } as DmmStatistics)
    ),
    clearStatistics: vi.fn().mockResolvedValue(Ok(undefined)),
  };
}
