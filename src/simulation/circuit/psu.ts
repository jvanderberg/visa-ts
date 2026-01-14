/**
 * Simulated PSU with physics behavior for circuit simulation.
 *
 * **Design Notes:**
 * - This module uses direct value manipulation rather than Result<T, Error> returns.
 *   The Result pattern in CLAUDE.md applies to I/O operations. Circuit simulation
 *   is in-memory computation where errors are better handled via validation.
 * - Settlement uses synchronous publish (not setTimeout) for deterministic behavior.
 *   The `settling` flag in the bus prevents reentrant issues.
 *
 * @packageDocumentation
 */

import type { Bus, BusParticipant, BusState, Unsubscribe } from './types.js';
import type { CommandResult } from '../types.js';

/**
 * Simulated PSU interface with physics and bus connectivity.
 */
export interface SimulatedPsu extends BusParticipant {
  /** Voltage setpoint in volts */
  readonly voltage: number;
  /** Current limit in amps */
  readonly currentLimit: number;
  /** Output state (on/off) */
  readonly output: boolean;
  /** Measured voltage from bus (or fallback to setpoint) */
  readonly measuredVoltage: number;
  /** Measured current from bus */
  readonly measuredCurrent: number;

  /** Set voltage setpoint */
  setVoltage(v: number): void;
  /** Set current limit */
  setCurrentLimit(i: number): void;
  /** Set output state */
  setOutput(on: boolean): void;

  /** Connect to a bus */
  connectTo(bus: Bus): void;
  /** Disconnect from current bus */
  disconnect(): void;

  /** Handle SCPI command */
  handleCommand(command: string): CommandResult;

  /** Device identification */
  readonly deviceInfo: {
    manufacturer: string;
    model: string;
    serial: string;
  };
}

/**
 * Create a simulated PSU with physics behavior.
 *
 * The PSU acts as a voltage source with current limiting.
 * When connected to a bus:
 * - Output ON: Sets voltage to setpoint, passes through current up to limit
 * - Output OFF: Returns zero voltage and current
 *
 * @returns A new SimulatedPsu instance
 *
 * @example
 * ```typescript
 * const psu = createPsu();
 * const bus = createBus();
 *
 * psu.connectTo(bus);
 * psu.setVoltage(12);
 * psu.setCurrentLimit(2);
 * psu.setOutput(true);
 *
 * console.log(bus.state); // { voltage: 12, current: 0 }
 * ```
 */
export function createPsu(): SimulatedPsu {
  let voltage = 0;
  let currentLimit = 0;
  let output = false;
  // TODO: Implement OVP/OCP protection in physics (future enhancement)
  let ovp = 33;
  let ocp = 5.5;

  // Validation constants
  const MAX_VOLTAGE = 30;
  const MAX_CURRENT = 5;

  let connectedBus: Bus | undefined;
  let unsubscribe: Unsubscribe | undefined;

  const deviceInfo = {
    manufacturer: 'VISA-TS',
    model: 'SIM-PSU',
    serial: 'PSU001',
  };

  /**
   * Compute PSU physics response to bus state.
   */
  function physics(bus: BusState): BusState {
    if (!output) {
      return { voltage: 0, current: 0 };
    }

    // PSU is a voltage source with current limiting
    if (bus.current > currentLimit) {
      return { voltage, current: currentLimit };
    }

    return { voltage, current: bus.current };
  }

  /**
   * Publish physics to bus if connected and output is on.
   */
  function publishToBus(): void {
    if (connectedBus && output) {
      const newState = physics(connectedBus.state);
      connectedBus.publish(newState);
    }
  }

  /**
   * Get measured voltage (from bus if connected, else fallback).
   */
  function getMeasuredVoltage(): number {
    if (connectedBus) {
      return connectedBus.state.voltage;
    }
    return output ? voltage : 0;
  }

  /**
   * Get measured current (from bus if connected, else 0).
   */
  function getMeasuredCurrent(): number {
    if (connectedBus) {
      return connectedBus.state.current;
    }
    return 0;
  }

  /**
   * Handle SCPI command.
   */
  function handleCommand(command: string): CommandResult {
    const cmd = command.trim();

    // *IDN? - Identity query
    if (cmd === '*IDN?') {
      return {
        matched: true,
        response: `${deviceInfo.manufacturer},${deviceInfo.model},${deviceInfo.serial},1.0`,
      };
    }

    // *RST - Reset
    if (cmd === '*RST') {
      voltage = 0;
      currentLimit = 0;
      output = false;
      ovp = 33;
      ocp = 5.5;
      publishToBus();
      return { matched: true, response: null };
    }

    // VOLT <value> - Set voltage
    const voltMatch = cmd.match(/^VOLT\s+([\d.]+)$/);
    if (voltMatch) {
      const v = parseFloat(voltMatch[1] ?? '0');
      if (v >= 0 && v <= 30) {
        voltage = v;
        publishToBus();
        return { matched: true, response: null };
      }
      return { matched: true, response: null, error: 'Value out of range' };
    }

    // VOLT? - Query voltage
    if (cmd === 'VOLT?') {
      return { matched: true, response: voltage.toFixed(3) };
    }

    // CURR <value> - Set current limit
    const currMatch = cmd.match(/^CURR\s+([\d.]+)$/);
    if (currMatch) {
      const i = parseFloat(currMatch[1] ?? '0');
      if (i >= 0 && i <= 5) {
        currentLimit = i;
        publishToBus();
        return { matched: true, response: null };
      }
      return { matched: true, response: null, error: 'Value out of range' };
    }

    // CURR? - Query current limit
    if (cmd === 'CURR?') {
      return { matched: true, response: currentLimit.toFixed(3) };
    }

    // OUTP ON|OFF|1|0 - Set output state
    const outpMatch = cmd.match(/^OUTP\s+(ON|OFF|1|0)$/i);
    if (outpMatch) {
      const val = (outpMatch[1] ?? '').toUpperCase();
      output = val === 'ON' || val === '1';
      publishToBus();
      return { matched: true, response: null };
    }

    // OUTP? - Query output state
    if (cmd === 'OUTP?') {
      return { matched: true, response: output ? 'ON' : 'OFF' };
    }

    // MEAS:VOLT? - Measure voltage
    if (cmd === 'MEAS:VOLT?') {
      return { matched: true, response: getMeasuredVoltage().toFixed(3) };
    }

    // MEAS:CURR? - Measure current
    if (cmd === 'MEAS:CURR?') {
      return { matched: true, response: getMeasuredCurrent().toFixed(3) };
    }

    // VOLT:PROT <value> - Set OVP
    const ovpMatch = cmd.match(/^VOLT:PROT\s+([\d.]+)$/);
    if (ovpMatch) {
      ovp = parseFloat(ovpMatch[1] ?? '0');
      return { matched: true, response: null };
    }

    // VOLT:PROT? - Query OVP
    if (cmd === 'VOLT:PROT?') {
      return { matched: true, response: ovp.toFixed(3) };
    }

    // CURR:PROT <value> - Set OCP
    const ocpMatch = cmd.match(/^CURR:PROT\s+([\d.]+)$/);
    if (ocpMatch) {
      ocp = parseFloat(ocpMatch[1] ?? '0');
      return { matched: true, response: null };
    }

    // CURR:PROT? - Query OCP
    if (cmd === 'CURR:PROT?') {
      return { matched: true, response: ocp.toFixed(3) };
    }

    return { matched: false, response: null };
  }

  return {
    get voltage() {
      return voltage;
    },
    get currentLimit() {
      return currentLimit;
    },
    get output() {
      return output;
    },
    get measuredVoltage() {
      return getMeasuredVoltage();
    },
    get measuredCurrent() {
      return getMeasuredCurrent();
    },
    get deviceInfo() {
      return deviceInfo;
    },

    setVoltage(v: number) {
      // Clamp to valid range (0-30V)
      voltage = Math.max(0, Math.min(MAX_VOLTAGE, v));
      publishToBus();
    },

    setCurrentLimit(i: number) {
      // Clamp to valid range (0-5A)
      currentLimit = Math.max(0, Math.min(MAX_CURRENT, i));
      publishToBus();
    },

    setOutput(on: boolean) {
      output = on;
      publishToBus();
    },

    connectTo(bus: Bus) {
      // Disconnect from previous bus if any
      if (unsubscribe) {
        unsubscribe();
      }

      connectedBus = bus;

      // Subscribe to bus changes
      unsubscribe = bus.subscribe((state) => {
        // Only react if output is on - passive when off
        if (!output) {
          return;
        }
        // React to bus state changes by publishing our physics
        const myState = physics(state);
        if (myState.voltage !== state.voltage || myState.current !== state.current) {
          bus.publish(myState);
        }
      });

      // Publish initial state
      publishToBus();
    },

    disconnect() {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = undefined;
      }
      connectedBus = undefined;
    },

    physics,
    handleCommand,
  };
}
