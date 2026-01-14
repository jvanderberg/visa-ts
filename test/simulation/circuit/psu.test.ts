/**
 * Tests for the simulated PSU with physics behavior.
 *
 * @packageDocumentation
 */

import { describe, it, expect } from 'vitest';
import { createPsu } from '../../../src/simulation/circuit/psu.js';
import { createBus } from '../../../src/simulation/circuit/bus.js';

describe('createPsu', () => {
  describe('physics behavior', () => {
    it('returns zero voltage and current when output is off', () => {
      const psu = createPsu();
      const result = psu.physics({ voltage: 0, current: 0 });
      expect(result).toEqual({ voltage: 0, current: 0 });
    });

    it('sets voltage to setpoint when output is on', () => {
      const psu = createPsu();
      psu.setVoltage(12);
      psu.setCurrentLimit(5);
      psu.setOutput(true);

      const result = psu.physics({ voltage: 0, current: 0 });
      expect(result.voltage).toBe(12);
    });

    it('passes through bus current when within limit', () => {
      const psu = createPsu();
      psu.setVoltage(12);
      psu.setCurrentLimit(5);
      psu.setOutput(true);

      const result = psu.physics({ voltage: 12, current: 2 });
      expect(result.current).toBe(2);
    });

    it('limits current to current limit when bus current exceeds limit', () => {
      const psu = createPsu();
      psu.setVoltage(12);
      psu.setCurrentLimit(2);
      psu.setOutput(true);

      const result = psu.physics({ voltage: 12, current: 5 });
      expect(result.current).toBe(2);
    });

    it('maintains voltage even when current limiting', () => {
      const psu = createPsu();
      psu.setVoltage(12);
      psu.setCurrentLimit(2);
      psu.setOutput(true);

      const result = psu.physics({ voltage: 12, current: 5 });
      expect(result.voltage).toBe(12);
    });

    it('returns zero current when output is off regardless of bus state', () => {
      const psu = createPsu();
      psu.setVoltage(12);
      psu.setCurrentLimit(5);
      psu.setOutput(false);

      const result = psu.physics({ voltage: 5, current: 2 });
      expect(result.current).toBe(0);
    });
  });

  describe('setters', () => {
    it('setVoltage updates the voltage setpoint', () => {
      const psu = createPsu();
      psu.setVoltage(15);
      expect(psu.voltage).toBe(15);
    });

    it('setCurrentLimit updates the current limit', () => {
      const psu = createPsu();
      psu.setCurrentLimit(3);
      expect(psu.currentLimit).toBe(3);
    });

    it('setOutput updates the output state', () => {
      const psu = createPsu();
      psu.setOutput(true);
      expect(psu.output).toBe(true);
    });
  });

  describe('getters', () => {
    it('voltage returns the setpoint', () => {
      const psu = createPsu();
      psu.setVoltage(12);
      expect(psu.voltage).toBe(12);
    });

    it('currentLimit returns the current limit', () => {
      const psu = createPsu();
      psu.setCurrentLimit(2);
      expect(psu.currentLimit).toBe(2);
    });

    it('output returns the output state', () => {
      const psu = createPsu();
      expect(psu.output).toBe(false);
      psu.setOutput(true);
      expect(psu.output).toBe(true);
    });
  });

  describe('measurements without bus', () => {
    it('measuredVoltage returns setpoint when output is on', () => {
      const psu = createPsu();
      psu.setVoltage(12);
      psu.setOutput(true);
      expect(psu.measuredVoltage).toBe(12);
    });

    it('measuredVoltage returns 0 when output is off', () => {
      const psu = createPsu();
      psu.setVoltage(12);
      psu.setOutput(false);
      expect(psu.measuredVoltage).toBe(0);
    });

    it('measuredCurrent returns 0 when no bus connected', () => {
      const psu = createPsu();
      psu.setVoltage(12);
      psu.setOutput(true);
      expect(psu.measuredCurrent).toBe(0);
    });
  });

  describe('bus connection', () => {
    it('connectTo subscribes to bus', () => {
      const psu = createPsu();
      const bus = createBus();
      psu.connectTo(bus);

      psu.setVoltage(12);
      psu.setOutput(true);

      // PSU should have published to bus
      expect(bus.state.voltage).toBe(12);
    });

    it('measuredVoltage reads from bus when connected', () => {
      const psu = createPsu();
      const bus = createBus();
      psu.connectTo(bus);

      // Simulate external voltage on bus
      bus.publish({ voltage: 11.5, current: 1 });

      expect(psu.measuredVoltage).toBe(11.5);
    });

    it('measuredCurrent reads from bus when connected', () => {
      const psu = createPsu();
      const bus = createBus();
      psu.connectTo(bus);

      // Simulate external current on bus
      bus.publish({ voltage: 12, current: 2.5 });

      expect(psu.measuredCurrent).toBe(2.5);
    });

    it('setters publish to bus when connected', () => {
      const psu = createPsu();
      const bus = createBus();
      psu.connectTo(bus);

      psu.setVoltage(12);
      psu.setCurrentLimit(5);
      psu.setOutput(true);

      expect(bus.state.voltage).toBe(12);
    });

    it('disconnect removes subscription', () => {
      const psu = createPsu();
      const bus = createBus();
      psu.connectTo(bus);

      psu.setVoltage(12);
      psu.setOutput(true);
      expect(bus.state.voltage).toBe(12);

      psu.disconnect();

      // PSU setters should no longer affect bus
      bus.publish({ voltage: 5, current: 0.5 });
      psu.setVoltage(24);

      // Bus should still have the last published state
      expect(bus.state.voltage).toBe(5);
    });

    it('measuredVoltage falls back to setpoint after disconnect', () => {
      const psu = createPsu();
      const bus = createBus();
      psu.connectTo(bus);

      psu.setVoltage(12);
      psu.setOutput(true);
      psu.disconnect();

      // Should return setpoint since disconnected
      expect(psu.measuredVoltage).toBe(12);
    });
  });

  describe('bus integration', () => {
    it('PSU and Load settle correctly in CC mode', () => {
      const psu = createPsu();
      const bus = createBus();

      // Connect PSU and set up parameters (output off)
      psu.connectTo(bus);
      psu.setVoltage(12);
      psu.setCurrentLimit(5);

      // Add load subscriber before PSU turns on (more realistic)
      // Simulate load wanting 2A
      bus.subscribe((state) => {
        if (state.voltage > 0 && state.current === 0) {
          bus.publish({ voltage: state.voltage, current: 2 });
        }
      });

      // PSU turns on, triggering settlement with load
      psu.setOutput(true);

      expect(bus.state).toEqual({ voltage: 12, current: 2 });
      expect(psu.measuredVoltage).toBe(12);
      expect(psu.measuredCurrent).toBe(2);
    });

    it('PSU current limits when load demands too much', () => {
      const psu = createPsu();
      const bus = createBus();

      // Connect PSU and set up parameters (output off)
      psu.connectTo(bus);
      psu.setVoltage(12);
      psu.setCurrentLimit(2);

      // Simulate load wanting 5A in CC mode
      // In CC mode, load accepts voltage from source and sets current demand
      // Load only publishes once (initial demand), then accepts whatever settles
      let loadInitialized = false;
      bus.subscribe((state) => {
        if (state.voltage > 0 && !loadInitialized) {
          loadInitialized = true;
          bus.publish({ voltage: state.voltage, current: 5 });
        }
      });

      // PSU turns on, triggering settlement with load
      psu.setOutput(true);

      // Current should be limited to 2A (PSU limits)
      expect(bus.state.current).toBe(2);
      expect(psu.measuredCurrent).toBe(2);
    });
  });

  describe('initial state', () => {
    it('starts with output off', () => {
      const psu = createPsu();
      expect(psu.output).toBe(false);
    });

    it('starts with zero voltage', () => {
      const psu = createPsu();
      expect(psu.voltage).toBe(0);
    });

    it('starts with default current limit', () => {
      const psu = createPsu();
      // Default current limit should match the device spec
      expect(psu.currentLimit).toBe(0);
    });
  });

  describe('SCPI command handling', () => {
    it('handleCommand processes VOLT command', () => {
      const psu = createPsu();
      const result = psu.handleCommand('VOLT 15');
      expect(result.matched).toBe(true);
      expect(psu.voltage).toBe(15);
    });

    it('handleCommand processes VOLT? query', () => {
      const psu = createPsu();
      psu.setVoltage(12);
      const result = psu.handleCommand('VOLT?');
      expect(result.matched).toBe(true);
      expect(result.response).toBe('12.000');
    });

    it('handleCommand processes CURR command', () => {
      const psu = createPsu();
      const result = psu.handleCommand('CURR 3');
      expect(result.matched).toBe(true);
      expect(psu.currentLimit).toBe(3);
    });

    it('handleCommand processes CURR? query', () => {
      const psu = createPsu();
      psu.setCurrentLimit(2.5);
      const result = psu.handleCommand('CURR?');
      expect(result.matched).toBe(true);
      expect(result.response).toBe('2.500');
    });

    it('handleCommand processes OUTP ON command', () => {
      const psu = createPsu();
      const result = psu.handleCommand('OUTP ON');
      expect(result.matched).toBe(true);
      expect(psu.output).toBe(true);
    });

    it('handleCommand processes OUTP? query', () => {
      const psu = createPsu();
      psu.setOutput(true);
      const result = psu.handleCommand('OUTP?');
      expect(result.matched).toBe(true);
      expect(result.response).toBe('ON');
    });

    it('handleCommand processes MEAS:VOLT? query', () => {
      const psu = createPsu();
      psu.setVoltage(12);
      psu.setOutput(true);
      const result = psu.handleCommand('MEAS:VOLT?');
      expect(result.matched).toBe(true);
      expect(result.response).toBe('12.000');
    });

    it('handleCommand processes MEAS:CURR? query', () => {
      const psu = createPsu();
      const bus = createBus();
      psu.connectTo(bus);
      bus.publish({ voltage: 12, current: 1.5 });

      const result = psu.handleCommand('MEAS:CURR?');
      expect(result.matched).toBe(true);
      expect(result.response).toBe('1.500');
    });

    it('handleCommand processes *IDN? query', () => {
      const psu = createPsu();
      const result = psu.handleCommand('*IDN?');
      expect(result.matched).toBe(true);
      expect(result.response).toContain('SIM-PSU');
    });

    it('handleCommand processes *RST command', () => {
      const psu = createPsu();
      psu.setVoltage(12);
      psu.setOutput(true);
      const result = psu.handleCommand('*RST');
      expect(result.matched).toBe(true);
      expect(psu.voltage).toBe(0);
      expect(psu.output).toBe(false);
    });

    it('handleCommand returns unmatched for unknown commands', () => {
      const psu = createPsu();
      const result = psu.handleCommand('UNKNOWN:COMMAND');
      expect(result.matched).toBe(false);
    });
  });
});
