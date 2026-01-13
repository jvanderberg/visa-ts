/**
 * Tests for circuit simulation types.
 *
 * @packageDocumentation
 */

import { describe, it, expect } from 'vitest';
import type {
  CircuitNode,
  Connection,
  PsuState,
  LoadState,
  CircuitState,
  CircuitMeasurements,
} from '../../../src/simulation/circuit/types.js';

describe('Circuit Types', () => {
  describe('CircuitNode', () => {
    it('represents a connection point with voltage', () => {
      const node: CircuitNode = {
        id: 'psu-output',
        voltage: 12.0,
      };

      expect(node.id).toBe('psu-output');
      expect(node.voltage).toBe(12.0);
    });
  });

  describe('Connection', () => {
    it('represents a wire with resistance', () => {
      const connection: Connection = {
        from: 'psu-output',
        to: 'load-input',
        resistance: 0.05, // 50mΩ
      };

      expect(connection.from).toBe('psu-output');
      expect(connection.to).toBe('load-input');
      expect(connection.resistance).toBe(0.05);
    });

    it('has optional default resistance of 0.01 ohms', () => {
      const connection: Connection = {
        from: 'psu-output',
        to: 'load-input',
      };

      // Default resistance should be accessible (undefined means use default)
      expect(connection.resistance).toBeUndefined();
    });
  });

  describe('PsuState', () => {
    it('holds PSU operating parameters', () => {
      const psu: PsuState = {
        voltageSetpoint: 12.0,
        currentLimit: 2.0,
        outputEnabled: true,
        ovpLevel: 33.0,
        ocpLevel: 5.5,
      };

      expect(psu.voltageSetpoint).toBe(12.0);
      expect(psu.currentLimit).toBe(2.0);
      expect(psu.outputEnabled).toBe(true);
      expect(psu.ovpLevel).toBe(33.0);
      expect(psu.ocpLevel).toBe(5.5);
    });
  });

  describe('LoadState', () => {
    it('holds Load operating parameters for CC mode', () => {
      const load: LoadState = {
        mode: 'CC',
        currentSetpoint: 1.5,
        inputEnabled: true,
      };

      expect(load.mode).toBe('CC');
      expect(load.currentSetpoint).toBe(1.5);
      expect(load.inputEnabled).toBe(true);
    });

    it('holds Load operating parameters for CV mode', () => {
      const load: LoadState = {
        mode: 'CV',
        voltageSetpoint: 10.0,
        inputEnabled: true,
      };

      expect(load.mode).toBe('CV');
      expect(load.voltageSetpoint).toBe(10.0);
    });

    it('holds Load operating parameters for CR mode', () => {
      const load: LoadState = {
        mode: 'CR',
        resistanceSetpoint: 100.0,
        inputEnabled: true,
      };

      expect(load.mode).toBe('CR');
      expect(load.resistanceSetpoint).toBe(100.0);
    });

    it('holds Load operating parameters for CP mode', () => {
      const load: LoadState = {
        mode: 'CP',
        powerSetpoint: 50.0,
        inputEnabled: true,
      };

      expect(load.mode).toBe('CP');
      expect(load.powerSetpoint).toBe(50.0);
    });
  });

  describe('CircuitState', () => {
    it('combines PSU and Load state with connection', () => {
      const circuit: CircuitState = {
        psu: {
          voltageSetpoint: 12.0,
          currentLimit: 2.0,
          outputEnabled: true,
        },
        load: {
          mode: 'CC',
          currentSetpoint: 1.5,
          inputEnabled: true,
        },
        wireResistance: 0.05,
      };

      expect(circuit.psu.voltageSetpoint).toBe(12.0);
      expect(circuit.load.mode).toBe('CC');
      expect(circuit.wireResistance).toBe(0.05);
    });
  });

  describe('CircuitMeasurements', () => {
    it('holds calculated measurement values', () => {
      const measurements: CircuitMeasurements = {
        psuVoltage: 12.0,
        psuCurrent: 1.5,
        psuMode: 'CV',
        loadVoltage: 11.925, // 12V - (1.5A * 0.05Ω)
        loadCurrent: 1.5,
      };

      expect(measurements.psuVoltage).toBe(12.0);
      expect(measurements.psuCurrent).toBe(1.5);
      expect(measurements.psuMode).toBe('CV');
      expect(measurements.loadVoltage).toBe(11.925);
      expect(measurements.loadCurrent).toBe(1.5);
    });
  });
});
