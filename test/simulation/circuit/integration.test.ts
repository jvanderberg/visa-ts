/**
 * Integration tests for circuit simulation.
 *
 * Tests the circuit solver with PSU and Load behaviors.
 *
 * @packageDocumentation
 */

import { describe, it, expect } from 'vitest';
import { createSimulatedPsu } from '../../../src/simulation/devices/psu.js';
import { createSimulatedLoad } from '../../../src/simulation/devices/load.js';
import { createSimulationTransport } from '../../../src/transports/simulation.js';

describe('Circuit simulation with stateful devices', () => {
  describe('PSU + Load integration via transport', () => {
    it('updates measured values after state changes', async () => {
      const psu = createSimulatedPsu();
      const load = createSimulatedLoad();

      const psuTransport = createSimulationTransport({ device: psu, busDevices: [load] });
      const loadTransport = createSimulationTransport({ device: load, busDevices: [psu] });

      await psuTransport.open();
      await loadTransport.open();

      // Configure PSU: 12V, 5A limit, output ON
      await psuTransport.write('VOLT 12');
      await psuTransport.write('CURR 5');
      await psuTransport.write('OUTP ON');

      // Configure Load: CR mode, 6Ω, input ON
      await loadTransport.write('MODE CR');
      await loadTransport.write('RES 6');
      await loadTransport.write('INP ON');

      // Check measured values (I = V/R = 12/6 = 2A)
      const psuVolt = await psuTransport.query('MEAS:VOLT?');
      const psuCurr = await psuTransport.query('MEAS:CURR?');

      expect(psuVolt.ok && psuVolt.value).toBe('12.000');
      expect(psuCurr.ok && psuCurr.value).toBe('2.000');
    });

    it('shows voltage sag when current-limited', async () => {
      const psu = createSimulatedPsu();
      const load = createSimulatedLoad();

      const psuTransport = createSimulationTransport({ device: psu, busDevices: [load] });
      const loadTransport = createSimulationTransport({ device: load, busDevices: [psu] });

      await psuTransport.open();
      await loadTransport.open();

      // Configure PSU: 12V, 2A limit (will current limit)
      await psuTransport.write('VOLT 12');
      await psuTransport.write('CURR 2');
      await psuTransport.write('OUTP ON');

      // Configure Load: CR mode, 4Ω (wants 3A = 12V/4Ω)
      await loadTransport.write('MODE CR');
      await loadTransport.write('RES 4');
      await loadTransport.write('INP ON');

      // Check measured values - voltage sags to V = I_limit × R = 2A × 4Ω = 8V
      const psuVolt = await psuTransport.query('MEAS:VOLT?');
      const psuCurr = await psuTransport.query('MEAS:CURR?');

      expect(psuVolt.ok && psuVolt.value).toBe('8.000');
      expect(psuCurr.ok && psuCurr.value).toBe('2.000');
    });
  });

  describe('getBehavior integration', () => {
    it('PSU getBehavior returns correct voltage-source', () => {
      const psu = createSimulatedPsu();

      // Set state via properties
      psu.properties!.voltage.set!(12);
      psu.properties!.current.set!(5);
      psu.properties!.output.set!(true);

      const behavior = psu.getBehavior!();

      expect(behavior.enabled).toBe(true);
      expect(behavior.behavior).toEqual({
        type: 'voltage-source',
        voltage: 12,
        currentLimit: 5,
      });
    });

    it('Load getBehavior returns correct behavior for each mode', () => {
      const load = createSimulatedLoad();
      load.properties!.input.set!(true);

      // CC mode
      load.properties!.mode.set!('CC');
      load.properties!.current.set!(3);
      let behavior = load.getBehavior!();
      expect(behavior.behavior.type).toBe('current-sink');

      // CR mode
      load.properties!.mode.set!('CR');
      load.properties!.resistance.set!(10);
      behavior = load.getBehavior!();
      expect(behavior.behavior.type).toBe('resistance');

      // CP mode
      load.properties!.mode.set!('CP');
      load.properties!.power.set!(50);
      behavior = load.getBehavior!();
      expect(behavior.behavior.type).toBe('power-sink');

      // CV mode
      load.properties!.mode.set!('CV');
      behavior = load.getBehavior!();
      expect(behavior.behavior.type).toBe('open');
    });

    it('disabled devices return open behavior', () => {
      const psu = createSimulatedPsu();
      psu.properties!.output.set!(false);

      const behavior = psu.getBehavior!();
      expect(behavior.enabled).toBe(false);
      expect(behavior.behavior.type).toBe('open');
    });
  });
});
