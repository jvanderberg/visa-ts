/**
 * Tests for circuit simulation.
 *
 * The circuit connects PSU and Load devices through a wire,
 * enabling realistic simulation where measurements reflect
 * actual circuit physics.
 *
 * @packageDocumentation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createCircuit } from '../../src/simulation/circuit.js';
import { createSimulationTransport } from '../../src/transports/simulation.js';
import { simulatedPsu } from '../../src/simulation/devices/psu.js';
import { simulatedLoad } from '../../src/simulation/devices/load.js';
import type { SimulationTransport } from '../../src/transports/simulation.js';

describe('Circuit Simulation', () => {
  let psuTransport: SimulationTransport;
  let loadTransport: SimulationTransport;

  beforeEach(async () => {
    psuTransport = createSimulationTransport({ device: simulatedPsu });
    loadTransport = createSimulationTransport({ device: simulatedLoad });
    await psuTransport.open();
    await loadTransport.open();
  });

  describe('createCircuit', () => {
    it('creates an empty circuit', () => {
      const circuit = createCircuit();

      expect(circuit).toBeDefined();
      expect(circuit.devices.size).toBe(0);
    });
  });

  describe('addDevice', () => {
    it('adds a PSU device to the circuit', () => {
      const circuit = createCircuit();

      const result = circuit.addDevice('psu', psuTransport, { type: 'psu' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('psu');
        expect(result.value.type).toBe('psu');
      }
      expect(circuit.devices.size).toBe(1);
    });

    it('adds a Load device to the circuit', () => {
      const circuit = createCircuit();

      const result = circuit.addDevice('load', loadTransport, { type: 'load' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('load');
        expect(result.value.type).toBe('load');
      }
    });

    it('returns device with transport reference', () => {
      const circuit = createCircuit();

      const result = circuit.addDevice('psu', psuTransport, { type: 'psu' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.transport).toBe(psuTransport);
      }
    });

    it('returns Err for duplicate device IDs', () => {
      const circuit = createCircuit();
      circuit.addDevice('psu', psuTransport, { type: 'psu' });

      const result = circuit.addDevice('psu', loadTransport, { type: 'load' });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('already exists');
      }
    });
  });

  describe('connect', () => {
    it('connects PSU to Load', () => {
      const circuit = createCircuit();
      const psuResult = circuit.addDevice('psu', psuTransport, { type: 'psu' });
      const loadResult = circuit.addDevice('load', loadTransport, { type: 'load' });

      expect(psuResult.ok && loadResult.ok).toBe(true);
      if (psuResult.ok && loadResult.ok) {
        const result = circuit.connect(psuResult.value, loadResult.value, { resistance: 0.1 });
        expect(result.ok).toBe(true);
      }
    });

    it('sets wire resistance', () => {
      const circuit = createCircuit();
      const psuResult = circuit.addDevice('psu', psuTransport, { type: 'psu' });
      const loadResult = circuit.addDevice('load', loadTransport, { type: 'load' });

      if (psuResult.ok && loadResult.ok) {
        circuit.connect(psuResult.value, loadResult.value, { resistance: 0.5 });
      }

      expect(circuit.wireResistance).toBe(0.5);
    });

    it('uses default resistance when not specified', () => {
      const circuit = createCircuit();
      const psuResult = circuit.addDevice('psu', psuTransport, { type: 'psu' });
      const loadResult = circuit.addDevice('load', loadTransport, { type: 'load' });

      if (psuResult.ok && loadResult.ok) {
        circuit.connect(psuResult.value, loadResult.value);
      }

      expect(circuit.wireResistance).toBe(0.01); // Default 10mΩ
    });

    it('allows adding multiple Load devices', () => {
      const circuit = createCircuit();
      const result1 = circuit.addDevice('load1', loadTransport, { type: 'load' });
      const load2Transport = createSimulationTransport({ device: simulatedLoad });
      const result2 = circuit.addDevice('load2', load2Transport, { type: 'load' });

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      expect(circuit.devices.size).toBe(2);
    });
  });

  // Helper to add devices and get unwrapped values
  function setupCircuit(circuit: ReturnType<typeof createCircuit>, wireResistance = 0.1) {
    const psuResult = circuit.addDevice('psu', psuTransport, { type: 'psu' });
    const loadResult = circuit.addDevice('load', loadTransport, { type: 'load' });
    if (!psuResult.ok || !loadResult.ok) {
      throw new Error('Failed to add devices in test setup');
    }
    circuit.connect(psuResult.value, loadResult.value, { resistance: wireResistance });
    return { psu: psuResult.value, load: loadResult.value };
  }

  describe('resolve', () => {
    it('resolves circuit with both outputs off', async () => {
      const circuit = createCircuit();
      setupCircuit(circuit);

      const result = await circuit.resolve();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.current).toBe(0);
      }
    });

    it('updates PSU measured current after resolution', async () => {
      const circuit = createCircuit();
      setupCircuit(circuit);

      // Configure PSU
      await psuTransport.write('VOLT 12');
      await psuTransport.write('CURR 5');
      await psuTransport.write('OUTP ON');

      // Configure Load to draw 2A
      await loadTransport.write('MODE CC');
      await loadTransport.write('CURR 2');
      await loadTransport.write('INP ON');

      // Before resolve, PSU measured current is default (0)
      const beforeResult = await psuTransport.query('MEAS:CURR?');
      expect(beforeResult.value).toBe('0.000');

      // Resolve circuit
      await circuit.resolve();

      // After resolve, PSU measured current reflects load demand
      const afterResult = await psuTransport.query('MEAS:CURR?');
      expect(afterResult.value).toBe('2.000');
    });

    it('updates Load measured voltage with wire drop', async () => {
      const circuit = createCircuit();
      setupCircuit(circuit, 0.1); // 100mΩ wire

      // Configure PSU: 12V, 5A limit
      await psuTransport.write('VOLT 12');
      await psuTransport.write('CURR 5');
      await psuTransport.write('OUTP ON');

      // Configure Load: CC mode, 2A
      await loadTransport.write('MODE CC');
      await loadTransport.write('CURR 2');
      await loadTransport.write('INP ON');

      // Resolve circuit
      await circuit.resolve();

      // Load voltage = PSU voltage - wire drop = 12V - (2A * 0.1Ω) = 11.8V
      const loadVoltResult = await loadTransport.query('MEAS:VOLT?');
      expect(parseFloat(loadVoltResult.value ?? '0')).toBeCloseTo(11.8, 2);
    });

    it('updates PSU measured voltage to match setpoint', async () => {
      const circuit = createCircuit();
      setupCircuit(circuit);

      // Configure PSU: 12V
      await psuTransport.write('VOLT 12');
      await psuTransport.write('CURR 5');
      await psuTransport.write('OUTP ON');

      // Configure Load
      await loadTransport.write('MODE CC');
      await loadTransport.write('CURR 1');
      await loadTransport.write('INP ON');

      // Resolve
      await circuit.resolve();

      // PSU measured voltage should be 12V (CV mode maintains setpoint)
      const psuVoltResult = await psuTransport.query('MEAS:VOLT?');
      expect(parseFloat(psuVoltResult.value ?? '0')).toBeCloseTo(12.0, 2);
    });
  });

  describe('PSU current limiting (CC mode)', () => {
    it('limits current when load demands more than PSU limit', async () => {
      const circuit = createCircuit();
      setupCircuit(circuit);

      // Configure PSU: 12V, 2A limit
      await psuTransport.write('VOLT 12');
      await psuTransport.write('CURR 2');
      await psuTransport.write('OUTP ON');

      // Configure Load to try to draw 5A
      await loadTransport.write('MODE CC');
      await loadTransport.write('CURR 5');
      await loadTransport.write('INP ON');

      // Resolve
      const result = await circuit.resolve();

      expect(result.ok).toBe(true);
      expect(result.value.psuMode).toBe('CC'); // Current limiting

      // PSU current should be limited to 2A
      const psuCurrResult = await psuTransport.query('MEAS:CURR?');
      expect(parseFloat(psuCurrResult.value ?? '0')).toBeCloseTo(2.0, 2);

      // Load current also shows 2A (what it's actually getting)
      const loadCurrResult = await loadTransport.query('MEAS:CURR?');
      expect(parseFloat(loadCurrResult.value ?? '0')).toBeCloseTo(2.0, 2);
    });
  });

  describe('CR mode (constant resistance)', () => {
    it('calculates current using Ohms law', async () => {
      const circuit = createCircuit();
      setupCircuit(circuit, 0.1); // 100mΩ wire

      // Configure PSU: 12V, 5A limit
      await psuTransport.write('VOLT 12');
      await psuTransport.write('CURR 5');
      await psuTransport.write('OUTP ON');

      // Configure Load: CR mode, 10Ω resistance
      await loadTransport.write('MODE CR');
      await loadTransport.write('RES 10');
      await loadTransport.write('INP ON');

      // Resolve
      const result = await circuit.resolve();

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Total R = 10Ω + 0.1Ω = 10.1Ω
        // I = 12V / 10.1Ω ≈ 1.188A
        expect(result.value.current).toBeCloseTo(12 / 10.1, 2);
      }
    });
  });

  describe('edge cases', () => {
    it('handles circuit with no connection', async () => {
      const circuit = createCircuit();
      circuit.addDevice('psu', psuTransport, { type: 'psu' });
      circuit.addDevice('load', loadTransport, { type: 'load' });
      // No connect() call

      const result = await circuit.resolve();

      // Without connection, resolve still works but reports no current
      expect(result.ok).toBe(true);
      expect(result.value.current).toBe(0);
    });

    it('handles circuit with only PSU (no load)', async () => {
      const circuit = createCircuit();
      circuit.addDevice('psu', psuTransport, { type: 'psu' });

      await psuTransport.write('VOLT 12');
      await psuTransport.write('OUTP ON');

      const result = await circuit.resolve();

      expect(result.ok).toBe(true);
      expect(result.value.current).toBe(0); // No load = no current
    });
  });
});
