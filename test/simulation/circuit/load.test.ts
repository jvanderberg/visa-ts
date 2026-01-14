/**
 * Tests for the simulated Load with physics behavior.
 *
 * @packageDocumentation
 */

import { describe, it, expect } from 'vitest';
import { createLoad } from '../../../src/simulation/circuit/load.js';
import { createBus } from '../../../src/simulation/circuit/bus.js';
import { createPsu } from '../../../src/simulation/circuit/psu.js';

describe('createLoad', () => {
  describe('physics behavior - CC mode', () => {
    it('returns zero current when input is off', () => {
      const load = createLoad();
      load.setMode('CC');
      load.setCurrent(5);
      load.setInput(false);

      const result = load.physics({ voltage: 12, current: 0 });
      expect(result.current).toBe(0);
      expect(result.voltage).toBe(12);
    });

    it('draws constant current when input is on', () => {
      const load = createLoad();
      load.setMode('CC');
      load.setCurrent(2);
      load.setInput(true);

      const result = load.physics({ voltage: 12, current: 0 });
      expect(result.current).toBe(2);
      expect(result.voltage).toBe(12);
    });

    it('passes through voltage from bus', () => {
      const load = createLoad();
      load.setMode('CC');
      load.setCurrent(2);
      load.setInput(true);

      const result = load.physics({ voltage: 24, current: 0 });
      expect(result.voltage).toBe(24);
    });
  });

  describe('physics behavior - CR mode', () => {
    it('draws current based on Ohms law (I = V/R)', () => {
      const load = createLoad();
      load.setMode('CR');
      load.setResistance(10);
      load.setInput(true);

      const result = load.physics({ voltage: 20, current: 0 });
      expect(result.current).toBe(2); // 20V / 10Ω = 2A
    });

    it('handles different resistance values', () => {
      const load = createLoad();
      load.setMode('CR');
      load.setResistance(100);
      load.setInput(true);

      const result = load.physics({ voltage: 50, current: 0 });
      expect(result.current).toBeCloseTo(0.5); // 50V / 100Ω = 0.5A
    });

    it('returns zero current when input is off', () => {
      const load = createLoad();
      load.setMode('CR');
      load.setResistance(10);
      load.setInput(false);

      const result = load.physics({ voltage: 20, current: 0 });
      expect(result.current).toBe(0);
    });
  });

  describe('physics behavior - CP mode', () => {
    it('draws current based on constant power (I = P/V)', () => {
      const load = createLoad();
      load.setMode('CP');
      load.setPower(24);
      load.setInput(true);

      const result = load.physics({ voltage: 12, current: 0 });
      expect(result.current).toBe(2); // 24W / 12V = 2A
    });

    it('handles different power values', () => {
      const load = createLoad();
      load.setMode('CP');
      load.setPower(100);
      load.setInput(true);

      const result = load.physics({ voltage: 50, current: 0 });
      expect(result.current).toBe(2); // 100W / 50V = 2A
    });

    it('returns zero current when voltage is zero', () => {
      const load = createLoad();
      load.setMode('CP');
      load.setPower(24);
      load.setInput(true);

      const result = load.physics({ voltage: 0, current: 0 });
      expect(result.current).toBe(0);
    });

    it('returns zero current when input is off', () => {
      const load = createLoad();
      load.setMode('CP');
      load.setPower(24);
      load.setInput(false);

      const result = load.physics({ voltage: 12, current: 0 });
      expect(result.current).toBe(0);
    });
  });

  describe('physics behavior - CV mode', () => {
    it('maintains constant voltage mode', () => {
      const load = createLoad();
      load.setMode('CV');
      load.setVoltage(10);
      load.setInput(true);

      const result = load.physics({ voltage: 12, current: 1 });
      // In CV mode, load passes through the current and voltage from bus
      // (CV mode behavior depends on implementation - commonly passes through)
      expect(result.voltage).toBe(12);
    });
  });

  describe('setters', () => {
    it('setMode updates the operating mode', () => {
      const load = createLoad();
      load.setMode('CR');
      expect(load.mode).toBe('CR');
    });

    it('setCurrent updates the current setpoint', () => {
      const load = createLoad();
      load.setCurrent(5);
      expect(load.current).toBe(5);
    });

    it('setResistance updates the resistance setpoint', () => {
      const load = createLoad();
      load.setResistance(100);
      expect(load.resistance).toBe(100);
    });

    it('setPower updates the power setpoint', () => {
      const load = createLoad();
      load.setPower(50);
      expect(load.power).toBe(50);
    });

    it('setVoltage updates the voltage setpoint', () => {
      const load = createLoad();
      load.setVoltage(10);
      expect(load.voltage).toBe(10);
    });

    it('setInput updates the input state', () => {
      const load = createLoad();
      load.setInput(true);
      expect(load.input).toBe(true);
    });
  });

  describe('getters', () => {
    it('mode returns the operating mode', () => {
      const load = createLoad();
      expect(load.mode).toBe('CC'); // default
    });

    it('current returns the current setpoint', () => {
      const load = createLoad();
      load.setCurrent(3);
      expect(load.current).toBe(3);
    });

    it('resistance returns the resistance setpoint', () => {
      const load = createLoad();
      load.setResistance(500);
      expect(load.resistance).toBe(500);
    });

    it('power returns the power setpoint', () => {
      const load = createLoad();
      load.setPower(75);
      expect(load.power).toBe(75);
    });

    it('input returns the input state', () => {
      const load = createLoad();
      expect(load.input).toBe(false); // default
      load.setInput(true);
      expect(load.input).toBe(true);
    });
  });

  describe('measurements without bus', () => {
    it('measuredVoltage returns 0 when no bus connected', () => {
      const load = createLoad();
      load.setInput(true);
      expect(load.measuredVoltage).toBe(0);
    });

    it('measuredCurrent returns 0 when no bus connected', () => {
      const load = createLoad();
      load.setInput(true);
      expect(load.measuredCurrent).toBe(0);
    });

    it('measuredPower returns 0 when no bus connected', () => {
      const load = createLoad();
      load.setInput(true);
      expect(load.measuredPower).toBe(0);
    });
  });

  describe('bus connection', () => {
    it('connectTo subscribes to bus', () => {
      const load = createLoad();
      const bus = createBus();
      load.connectTo(bus);

      load.setMode('CC');
      load.setCurrent(2);
      load.setInput(true);

      // Simulate PSU providing voltage
      bus.publish({ voltage: 12, current: 0 });

      // Load should have published its current demand
      expect(bus.state.current).toBe(2);
    });

    it('measuredVoltage reads from bus when connected', () => {
      const load = createLoad();
      const bus = createBus();
      load.connectTo(bus);

      bus.publish({ voltage: 15, current: 1 });
      expect(load.measuredVoltage).toBe(15);
    });

    it('measuredCurrent reads from bus when connected', () => {
      const load = createLoad();
      const bus = createBus();
      load.connectTo(bus);

      bus.publish({ voltage: 12, current: 3.5 });
      expect(load.measuredCurrent).toBe(3.5);
    });

    it('measuredPower calculates from bus V*I', () => {
      const load = createLoad();
      const bus = createBus();
      load.connectTo(bus);

      bus.publish({ voltage: 12, current: 2 });
      expect(load.measuredPower).toBe(24); // 12V * 2A = 24W
    });

    it('disconnect removes subscription', () => {
      const load = createLoad();
      const bus = createBus();
      load.connectTo(bus);
      load.setMode('CC');
      load.setCurrent(2);
      load.setInput(true);

      bus.publish({ voltage: 12, current: 0 });
      expect(bus.state.current).toBe(2);

      load.disconnect();

      // Load should no longer affect bus
      bus.publish({ voltage: 24, current: 0 });
      expect(bus.state.current).toBe(0);
    });
  });

  describe('bus integration with PSU', () => {
    it('PSU and Load settle in CC mode', () => {
      const psu = createPsu();
      const load = createLoad();
      const bus = createBus();

      psu.connectTo(bus);
      load.connectTo(bus);

      psu.setVoltage(12);
      psu.setCurrentLimit(5);

      load.setMode('CC');
      load.setCurrent(2);

      // Turn on load first (draws 0 current because no voltage)
      load.setInput(true);

      // Turn on PSU (provides voltage, load draws current)
      psu.setOutput(true);

      expect(bus.state).toEqual({ voltage: 12, current: 2 });
      expect(psu.measuredCurrent).toBe(2);
      expect(load.measuredCurrent).toBe(2);
    });

    it('PSU and Load settle in CR mode', () => {
      const psu = createPsu();
      const load = createLoad();
      const bus = createBus();

      psu.connectTo(bus);
      load.connectTo(bus);

      psu.setVoltage(20);
      psu.setCurrentLimit(5);

      load.setMode('CR');
      load.setResistance(10); // I = 20V / 10Ω = 2A

      load.setInput(true);
      psu.setOutput(true);

      expect(bus.state.voltage).toBe(20);
      expect(bus.state.current).toBeCloseTo(2);
    });

    it('PSU and Load settle in CP mode', () => {
      const psu = createPsu();
      const load = createLoad();
      const bus = createBus();

      psu.connectTo(bus);
      load.connectTo(bus);

      psu.setVoltage(12);
      psu.setCurrentLimit(5);

      load.setMode('CP');
      load.setPower(24); // I = 24W / 12V = 2A

      load.setInput(true);
      psu.setOutput(true);

      expect(bus.state.voltage).toBe(12);
      expect(bus.state.current).toBeCloseTo(2);
    });

    it('PSU current limits Load in CC mode', () => {
      const psu = createPsu();
      const bus = createBus();

      psu.connectTo(bus);

      psu.setVoltage(12);
      psu.setCurrentLimit(2); // PSU can only provide 2A

      // Simulate load wanting 5A in CC mode
      // Load only makes initial demand, then accepts whatever is available
      let loadInitialized = false;
      bus.subscribe((state) => {
        if (state.voltage > 0 && !loadInitialized) {
          loadInitialized = true;
          bus.publish({ voltage: state.voltage, current: 5 }); // Request 5A
        }
      });

      psu.setOutput(true);

      // Current should be limited by PSU to 2A
      expect(bus.state.current).toBe(2);
    });
  });

  describe('initial state', () => {
    it('starts with input off', () => {
      const load = createLoad();
      expect(load.input).toBe(false);
    });

    it('starts in CC mode', () => {
      const load = createLoad();
      expect(load.mode).toBe('CC');
    });

    it('starts with zero current', () => {
      const load = createLoad();
      expect(load.current).toBe(0);
    });

    it('starts with default resistance', () => {
      const load = createLoad();
      expect(load.resistance).toBe(1000);
    });
  });

  describe('SCPI command handling', () => {
    it('handleCommand processes MODE command', () => {
      const load = createLoad();
      const result = load.handleCommand('MODE CR');
      expect(result.matched).toBe(true);
      expect(load.mode).toBe('CR');
    });

    it('handleCommand processes MODE? query', () => {
      const load = createLoad();
      load.setMode('CP');
      const result = load.handleCommand('MODE?');
      expect(result.matched).toBe(true);
      expect(result.response).toBe('CP');
    });

    it('handleCommand processes CURR command', () => {
      const load = createLoad();
      const result = load.handleCommand('CURR 5');
      expect(result.matched).toBe(true);
      expect(load.current).toBe(5);
    });

    it('handleCommand processes CURR? query', () => {
      const load = createLoad();
      load.setCurrent(3.5);
      const result = load.handleCommand('CURR?');
      expect(result.matched).toBe(true);
      expect(result.response).toBe('3.500');
    });

    it('handleCommand processes RES command', () => {
      const load = createLoad();
      const result = load.handleCommand('RES 100');
      expect(result.matched).toBe(true);
      expect(load.resistance).toBe(100);
    });

    it('handleCommand processes RES? query', () => {
      const load = createLoad();
      load.setResistance(500);
      const result = load.handleCommand('RES?');
      expect(result.matched).toBe(true);
      expect(result.response).toBe('500.000');
    });

    it('handleCommand processes POW command', () => {
      const load = createLoad();
      const result = load.handleCommand('POW 50');
      expect(result.matched).toBe(true);
      expect(load.power).toBe(50);
    });

    it('handleCommand processes POW? query', () => {
      const load = createLoad();
      load.setPower(75);
      const result = load.handleCommand('POW?');
      expect(result.matched).toBe(true);
      expect(result.response).toBe('75.000');
    });

    it('handleCommand processes INP ON command', () => {
      const load = createLoad();
      const result = load.handleCommand('INP ON');
      expect(result.matched).toBe(true);
      expect(load.input).toBe(true);
    });

    it('handleCommand processes INP? query', () => {
      const load = createLoad();
      load.setInput(true);
      const result = load.handleCommand('INP?');
      expect(result.matched).toBe(true);
      expect(result.response).toBe('ON');
    });

    it('handleCommand processes MEAS:VOLT? query', () => {
      const load = createLoad();
      const bus = createBus();
      load.connectTo(bus);
      bus.publish({ voltage: 15, current: 1 });

      const result = load.handleCommand('MEAS:VOLT?');
      expect(result.matched).toBe(true);
      expect(result.response).toBe('15.000');
    });

    it('handleCommand processes MEAS:CURR? query', () => {
      const load = createLoad();
      const bus = createBus();
      load.connectTo(bus);
      bus.publish({ voltage: 12, current: 2.5 });

      const result = load.handleCommand('MEAS:CURR?');
      expect(result.matched).toBe(true);
      expect(result.response).toBe('2.500');
    });

    it('handleCommand processes MEAS:POW? query', () => {
      const load = createLoad();
      const bus = createBus();
      load.connectTo(bus);
      bus.publish({ voltage: 12, current: 2 });

      const result = load.handleCommand('MEAS:POW?');
      expect(result.matched).toBe(true);
      expect(result.response).toBe('24.000');
    });

    it('handleCommand processes *IDN? query', () => {
      const load = createLoad();
      const result = load.handleCommand('*IDN?');
      expect(result.matched).toBe(true);
      expect(result.response).toContain('SIM-LOAD');
    });

    it('handleCommand processes *RST command', () => {
      const load = createLoad();
      load.setMode('CR');
      load.setCurrent(5);
      load.setInput(true);

      const result = load.handleCommand('*RST');
      expect(result.matched).toBe(true);
      expect(load.mode).toBe('CC');
      expect(load.current).toBe(0);
      expect(load.input).toBe(false);
    });

    it('handleCommand returns unmatched for unknown commands', () => {
      const load = createLoad();
      const result = load.handleCommand('UNKNOWN:COMMAND');
      expect(result.matched).toBe(false);
    });
  });
});
