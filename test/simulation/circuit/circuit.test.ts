/**
 * Tests for createCircuit factory function.
 *
 * @packageDocumentation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createCircuit,
  type Circuit,
  type CircuitDevice,
} from '../../../src/simulation/circuit/circuit.js';
import { simulatedPsu } from '../../../src/simulation/devices/psu.js';
import { simulatedLoad } from '../../../src/simulation/devices/load.js';

/** Voltage precision tolerance (1mV) */
const V_EPSILON = 0.001;
/** Current precision tolerance (1mA) */
const I_EPSILON = 0.001;

function expectVoltage(actual: number, expected: number): void {
  expect(Math.abs(actual - expected)).toBeLessThan(V_EPSILON);
}

function expectCurrent(actual: number, expected: number): void {
  expect(Math.abs(actual - expected)).toBeLessThan(I_EPSILON);
}

/** Helper to unwrap Result and fail test if error */
function unwrapDevice(result: ReturnType<Circuit['addDevice']>): CircuitDevice {
  if (!result.ok) {
    throw new Error(`Failed to add device: ${result.error.message}`);
  }
  return result.value;
}

describe('createCircuit', () => {
  let circuit: Circuit;

  beforeEach(() => {
    circuit = createCircuit();
  });

  describe('basic functionality', () => {
    it('creates an empty circuit', () => {
      expect(circuit).toBeDefined();
      expect(circuit.devices).toEqual({});
    });

    it('adds a PSU device', () => {
      const result = circuit.addDevice('psu', simulatedPsu);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('psu');
        expect(result.value.transport).toBeDefined();
        expect(circuit.devices['psu']).toBe(result.value);
      }
    });

    it('adds a Load device', () => {
      const result = circuit.addDevice('load', simulatedLoad);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('load');
        expect(result.value.transport).toBeDefined();
      }
    });

    it('returns Err when adding device with duplicate ID', () => {
      circuit.addDevice('psu', simulatedPsu);
      const result = circuit.addDevice('psu', simulatedPsu);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Device with ID "psu" already exists');
      }
    });
  });

  describe('connection management', () => {
    it('connects PSU output to Load input', () => {
      const psu = unwrapDevice(circuit.addDevice('psu', simulatedPsu));
      const load = unwrapDevice(circuit.addDevice('load', simulatedLoad));

      // Connect should not throw
      circuit.connect(psu.output, load.input, { resistance: 0.05 });

      expect(circuit.connections.length).toBe(1);
      expect(circuit.connections[0].resistance).toBe(0.05);
    });

    it('uses default resistance when not specified', () => {
      const psu = unwrapDevice(circuit.addDevice('psu', simulatedPsu));
      const load = unwrapDevice(circuit.addDevice('load', simulatedLoad));

      circuit.connect(psu.output, load.input);

      expect(circuit.connections[0].resistance).toBe(0.01);
    });
  });

  describe('transport functionality', () => {
    let psu: CircuitDevice;
    let load: CircuitDevice;

    beforeEach(async () => {
      psu = unwrapDevice(circuit.addDevice('psu', simulatedPsu));
      load = unwrapDevice(circuit.addDevice('load', simulatedLoad));
      circuit.connect(psu.output, load.input, { resistance: 0.05 });

      await psu.transport.open();
      await load.transport.open();
    });

    it('allows querying device identity through transport', async () => {
      const result = await psu.transport.query('*IDN?');
      expect(result.ok).toBe(true);
      expect(result.value).toContain('SIM-PSU');
    });

    it('allows setting PSU voltage through transport', async () => {
      await psu.transport.write('VOLT 12');

      const result = await psu.transport.query('VOLT?');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('12.000');
    });
  });

  describe('circuit measurements', () => {
    let psu: CircuitDevice;
    let load: CircuitDevice;

    beforeEach(async () => {
      psu = unwrapDevice(circuit.addDevice('psu', simulatedPsu));
      load = unwrapDevice(circuit.addDevice('load', simulatedLoad));
      circuit.connect(psu.output, load.input, { resistance: 0.05 });

      await psu.transport.open();
      await load.transport.open();
    });

    it('reflects open circuit when load input is OFF', async () => {
      await psu.transport.write('VOLT 12');
      await psu.transport.write('CURR 5');
      await psu.transport.write('OUTP ON');
      // Load input is OFF by default

      const psuVoltage = await psu.transport.query('MEAS:VOLT?');
      const psuCurrent = await psu.transport.query('MEAS:CURR?');
      const loadVoltage = await load.transport.query('MEAS:VOLT?');

      expect(psuVoltage.ok).toBe(true);
      expect(psuCurrent.ok).toBe(true);
      expect(loadVoltage.ok).toBe(true);

      // Open circuit: PSU outputs voltage but no current
      expectVoltage(parseFloat(psuVoltage.value ?? '0'), 12.0);
      expectCurrent(parseFloat(psuCurrent.value ?? '1'), 0);
      expectVoltage(parseFloat(loadVoltage.value ?? '0'), 12.0);
    });

    it('reflects CC load current draw', async () => {
      await psu.transport.write('VOLT 12');
      await psu.transport.write('CURR 5');
      await psu.transport.write('OUTP ON');

      await load.transport.write('MODE CC');
      await load.transport.write('CURR 1.5');
      await load.transport.write('INP ON');

      const psuCurrent = await psu.transport.query('MEAS:CURR?');
      const loadCurrent = await load.transport.query('MEAS:CURR?');
      const loadVoltage = await load.transport.query('MEAS:VOLT?');

      expect(psuCurrent.ok).toBe(true);
      expect(loadCurrent.ok).toBe(true);

      // Load draws 1.5A
      expectCurrent(parseFloat(psuCurrent.value ?? '0'), 1.5);
      expectCurrent(parseFloat(loadCurrent.value ?? '0'), 1.5);
      // V_load = 12 - (1.5 * 0.05) = 11.925V
      expectVoltage(parseFloat(loadVoltage.value ?? '0'), 11.925);
    });

    it('reflects PSU current limiting', async () => {
      await psu.transport.write('VOLT 12');
      await psu.transport.write('CURR 2');
      await psu.transport.write('OUTP ON');

      await load.transport.write('MODE CC');
      await load.transport.write('CURR 5'); // Wants more than PSU can provide
      await load.transport.write('INP ON');

      const psuCurrent = await psu.transport.query('MEAS:CURR?');
      const loadCurrent = await load.transport.query('MEAS:CURR?');

      // PSU limits current to 2A
      expectCurrent(parseFloat(psuCurrent.value ?? '0'), 2.0);
      expectCurrent(parseFloat(loadCurrent.value ?? '0'), 2.0);
    });

    it('reflects CR load behavior (Ohm law)', async () => {
      await psu.transport.write('VOLT 12');
      await psu.transport.write('CURR 10');
      await psu.transport.write('OUTP ON');

      await load.transport.write('MODE CR');
      await load.transport.write('RES 10'); // 10 ohms
      await load.transport.write('INP ON');

      const psuCurrent = await psu.transport.query('MEAS:CURR?');
      const loadVoltage = await load.transport.query('MEAS:VOLT?');

      // Total R = 10 + 0.05 = 10.05Ω
      // I = 12V / 10.05Ω ≈ 1.194A
      const expectedCurrent = 12.0 / 10.05;
      expectCurrent(parseFloat(psuCurrent.value ?? '0'), expectedCurrent);
      // V_load = 12 - I * 0.05
      expectVoltage(parseFloat(loadVoltage.value ?? '0'), 12.0 - expectedCurrent * 0.05);
    });

    it('reflects CP load behavior (constant power)', async () => {
      await psu.transport.write('VOLT 12');
      await psu.transport.write('CURR 10');
      await psu.transport.write('OUTP ON');

      await load.transport.write('MODE CP');
      await load.transport.write('POW 24'); // 24 watts
      await load.transport.write('INP ON');

      const psuCurrent = await psu.transport.query('MEAS:CURR?');
      const loadPower = await load.transport.query('MEAS:POW?');

      // I = P / V = 24 / 12 = 2A (with no wire resistance effect)
      // With wire resistance, it's slightly different but close to 2A
      const current = parseFloat(psuCurrent.value ?? '0');
      expect(current).toBeGreaterThan(1.9);
      expect(current).toBeLessThan(2.1);

      // Power should be close to 24W
      const power = parseFloat(loadPower.value ?? '0');
      expect(power).toBeGreaterThan(23);
      expect(power).toBeLessThan(25);
    });

    it('reflects zero output when PSU is OFF', async () => {
      await psu.transport.write('VOLT 12');
      await psu.transport.write('CURR 5');
      // PSU output is OFF by default

      await load.transport.write('MODE CC');
      await load.transport.write('CURR 1.5');
      await load.transport.write('INP ON');

      const psuVoltage = await psu.transport.query('MEAS:VOLT?');
      const psuCurrent = await psu.transport.query('MEAS:CURR?');

      expectVoltage(parseFloat(psuVoltage.value ?? '1'), 0);
      expectCurrent(parseFloat(psuCurrent.value ?? '1'), 0);
    });
  });

  describe('circuit resolution on setpoint change', () => {
    let psu: CircuitDevice;
    let load: CircuitDevice;

    beforeEach(async () => {
      psu = unwrapDevice(circuit.addDevice('psu', simulatedPsu));
      load = unwrapDevice(circuit.addDevice('load', simulatedLoad));
      circuit.connect(psu.output, load.input, { resistance: 0.05 });

      await psu.transport.open();
      await load.transport.open();

      // Set up initial state
      await psu.transport.write('VOLT 12');
      await psu.transport.write('CURR 5');
      await psu.transport.write('OUTP ON');
      await load.transport.write('MODE CC');
      await load.transport.write('CURR 1');
      await load.transport.write('INP ON');
    });

    it('updates measurements when PSU voltage changes', async () => {
      // Initial current is 1A
      let current = await psu.transport.query('MEAS:CURR?');
      expectCurrent(parseFloat(current.value ?? '0'), 1.0);

      // Change voltage - measurements should stay the same (CC mode)
      await psu.transport.write('VOLT 24');

      current = await psu.transport.query('MEAS:CURR?');
      expectCurrent(parseFloat(current.value ?? '0'), 1.0);
    });

    it('updates measurements when load current changes', async () => {
      let current = await psu.transport.query('MEAS:CURR?');
      expectCurrent(parseFloat(current.value ?? '0'), 1.0);

      // Increase load current
      await load.transport.write('CURR 2.5');

      current = await psu.transport.query('MEAS:CURR?');
      expectCurrent(parseFloat(current.value ?? '0'), 2.5);
    });

    it('updates measurements when output is toggled', async () => {
      let current = await psu.transport.query('MEAS:CURR?');
      expectCurrent(parseFloat(current.value ?? '0'), 1.0);

      // Turn off PSU
      await psu.transport.write('OUTP OFF');

      current = await psu.transport.query('MEAS:CURR?');
      expectCurrent(parseFloat(current.value ?? '1'), 0);

      // Turn back on
      await psu.transport.write('OUTP ON');

      current = await psu.transport.query('MEAS:CURR?');
      expectCurrent(parseFloat(current.value ?? '0'), 1.0);
    });
  });

  describe('transport wrapper methods', () => {
    let psu: CircuitDevice;
    let load: CircuitDevice;

    beforeEach(async () => {
      psu = unwrapDevice(circuit.addDevice('psu', simulatedPsu));
      load = unwrapDevice(circuit.addDevice('load', simulatedLoad));
      circuit.connect(psu.output, load.input, { resistance: 0.05 });

      await psu.transport.open();
      await load.transport.open();
    });

    it('supports clear operation', async () => {
      const result = await psu.transport.clear();
      expect(result.ok).toBe(true);
    });

    it('supports trigger operation', async () => {
      const result = await psu.transport.trigger();
      expect(result.ok).toBe(true);
    });

    it('supports readStb operation', async () => {
      const result = await psu.transport.readStb();
      expect(result.ok).toBe(true);
      expect(typeof result.value).toBe('number');
    });

    it('supports writeRaw and triggers circuit resolution', async () => {
      // Set up circuit
      await psu.transport.write('VOLT 12');
      await psu.transport.write('CURR 5');
      await psu.transport.write('OUTP ON');
      await load.transport.write('MODE CC');
      await load.transport.write('CURR 1');
      await load.transport.write('INP ON');

      // Use writeRaw to change voltage
      const result = await psu.transport.writeRaw(Buffer.from('VOLT 24\n'));
      expect(result.ok).toBe(true);

      // Verify circuit was recalculated
      const voltage = await psu.transport.query('VOLT?');
      expect(voltage.ok).toBe(true);
      expect(voltage.value).toBe('24.000');
    });

    it('supports readRaw operation', async () => {
      // Write a query command first
      await psu.transport.write('*IDN?');

      const result = await psu.transport.readRaw();
      expect(result.ok).toBe(true);
      expect(result.value).toBeInstanceOf(Buffer);
    });

    it('supports readBytes operation', async () => {
      // Write a query command first
      await psu.transport.write('*IDN?');

      const result = await psu.transport.readBytes(5);
      expect(result.ok).toBe(true);
      expect(result.value).toBeInstanceOf(Buffer);
      expect(result.value?.length).toBe(5);
    });

    it('supports read operation', async () => {
      // Write a query command first
      await psu.transport.write('*IDN?');

      const result = await psu.transport.read();
      expect(result.ok).toBe(true);
      expect(typeof result.value).toBe('string');
    });

    it('exposes transport state property', () => {
      expect(psu.transport.state).toBe('open');
    });

    it('exposes isOpen property', () => {
      expect(psu.transport.isOpen).toBe(true);
    });

    it('allows setting and getting timeout', () => {
      psu.transport.timeout = 5000;
      expect(psu.transport.timeout).toBe(5000);
    });

    it('allows setting and getting readTermination', () => {
      psu.transport.readTermination = '\r\n';
      expect(psu.transport.readTermination).toBe('\r\n');
    });

    it('allows setting and getting writeTermination', () => {
      psu.transport.writeTermination = '\r\n';
      expect(psu.transport.writeTermination).toBe('\r\n');
    });

    it('supports close operation', async () => {
      const result = await psu.transport.close();
      expect(result.ok).toBe(true);
      expect(psu.transport.isOpen).toBe(false);
    });
  });
});
