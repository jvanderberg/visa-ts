/**
 * Simulated Electronic Load with physics behavior for circuit simulation.
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
 * Operating mode for the electronic load.
 */
export type LoadMode = 'CC' | 'CV' | 'CR' | 'CP';

/**
 * Simulated Load interface with physics and bus connectivity.
 */
export interface SimulatedLoad extends BusParticipant {
  /** Operating mode (CC, CV, CR, CP) */
  readonly mode: LoadMode;
  /** Current setpoint in amps (CC mode) */
  readonly current: number;
  /** Voltage setpoint in volts (CV mode) */
  readonly voltage: number;
  /** Resistance setpoint in ohms (CR mode) */
  readonly resistance: number;
  /** Power setpoint in watts (CP mode) */
  readonly power: number;
  /** Input state (on/off) */
  readonly input: boolean;
  /** Measured voltage from bus */
  readonly measuredVoltage: number;
  /** Measured current from bus */
  readonly measuredCurrent: number;
  /** Measured power from bus (V * I) */
  readonly measuredPower: number;

  /** Set operating mode */
  setMode(mode: LoadMode): void;
  /** Set current setpoint (CC mode) */
  setCurrent(i: number): void;
  /** Set voltage setpoint (CV mode) */
  setVoltage(v: number): void;
  /** Set resistance setpoint (CR mode) */
  setResistance(r: number): void;
  /** Set power setpoint (CP mode) */
  setPower(p: number): void;
  /** Set input state */
  setInput(on: boolean): void;

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
 * Create a simulated electronic load with physics behavior.
 *
 * The Load acts as a current sink with multiple operating modes:
 * - CC: Constant Current - draws a fixed current
 * - CV: Constant Voltage - maintains a fixed voltage (pass-through)
 * - CR: Constant Resistance - draws I = V/R (Ohm's law)
 * - CP: Constant Power - draws I = P/V
 *
 * @returns A new SimulatedLoad instance
 *
 * @example
 * ```typescript
 * const load = createLoad();
 * const bus = createBus();
 *
 * load.connectTo(bus);
 * load.setMode('CC');
 * load.setCurrent(2);
 * load.setInput(true);
 * ```
 */
export function createLoad(): SimulatedLoad {
  let mode: LoadMode = 'CC';
  let currentSetpoint = 0;
  let voltageSetpoint = 0;
  let resistanceSetpoint = 1000;
  let powerSetpoint = 0;
  let input = false;
  // TODO: Implement slew rate limiting in physics (future enhancement)
  let slewRate = 1;

  // Validation constants
  const MAX_CURRENT = 30;
  const MAX_VOLTAGE = 150;
  const MIN_RESISTANCE = 0.1;
  const MAX_RESISTANCE = 10000;
  const MAX_POWER = 300;

  let connectedBus: Bus | undefined;
  let unsubscribe: Unsubscribe | undefined;

  const deviceInfo = {
    manufacturer: 'VISA-TS',
    model: 'SIM-LOAD',
    serial: 'LOAD001',
  };

  /**
   * Compute Load physics response to bus state.
   */
  function physics(bus: BusState): BusState {
    if (!input) {
      return { voltage: bus.voltage, current: 0 };
    }

    switch (mode) {
      case 'CC':
        // Constant current mode - draw fixed current
        return { voltage: bus.voltage, current: currentSetpoint };

      case 'CR':
        // Constant resistance mode - I = V/R
        if (resistanceSetpoint === 0) {
          return { voltage: bus.voltage, current: 0 };
        }
        return { voltage: bus.voltage, current: bus.voltage / resistanceSetpoint };

      case 'CP':
        // Constant power mode - I = P/V
        if (bus.voltage === 0) {
          return { voltage: bus.voltage, current: 0 };
        }
        return { voltage: bus.voltage, current: powerSetpoint / bus.voltage };

      case 'CV':
        // Constant voltage mode - pass through
        return { voltage: bus.voltage, current: bus.current };

      default:
        return bus;
    }
  }

  /**
   * Publish physics to bus if connected and input is on.
   */
  function publishToBus(): void {
    if (connectedBus && input) {
      const newState = physics(connectedBus.state);
      connectedBus.publish(newState);
    }
  }

  /**
   * Get measured voltage (from bus if connected, else 0).
   */
  function getMeasuredVoltage(): number {
    if (connectedBus) {
      return connectedBus.state.voltage;
    }
    return 0;
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
   * Get measured power (V * I from bus).
   */
  function getMeasuredPower(): number {
    if (connectedBus) {
      const state = connectedBus.state;
      return state.voltage * state.current;
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
      mode = 'CC';
      currentSetpoint = 0;
      voltageSetpoint = 0;
      resistanceSetpoint = 1000;
      powerSetpoint = 0;
      input = false;
      slewRate = 1;
      publishToBus();
      return { matched: true, response: null };
    }

    // MODE <CC|CV|CR|CP> - Set operating mode
    const modeMatch = cmd.match(/^MODE\s+(CC|CV|CR|CP)$/i);
    if (modeMatch) {
      mode = (modeMatch[1] ?? 'CC').toUpperCase() as LoadMode;
      publishToBus();
      return { matched: true, response: null };
    }

    // MODE? - Query mode
    if (cmd === 'MODE?') {
      return { matched: true, response: mode };
    }

    // CURR <value> - Set current (CC mode)
    const currMatch = cmd.match(/^CURR\s+([\d.]+)$/);
    if (currMatch) {
      const i = parseFloat(currMatch[1] ?? '0');
      if (i >= 0 && i <= 30) {
        currentSetpoint = i;
        publishToBus();
        return { matched: true, response: null };
      }
      return { matched: true, response: null, error: 'Value out of range' };
    }

    // CURR? - Query current
    if (cmd === 'CURR?') {
      return { matched: true, response: currentSetpoint.toFixed(3) };
    }

    // VOLT <value> - Set voltage (CV mode)
    const voltMatch = cmd.match(/^VOLT\s+([\d.]+)$/);
    if (voltMatch) {
      const v = parseFloat(voltMatch[1] ?? '0');
      if (v >= 0 && v <= 150) {
        voltageSetpoint = v;
        publishToBus();
        return { matched: true, response: null };
      }
      return { matched: true, response: null, error: 'Value out of range' };
    }

    // VOLT? - Query voltage
    if (cmd === 'VOLT?') {
      return { matched: true, response: voltageSetpoint.toFixed(3) };
    }

    // RES <value> - Set resistance (CR mode)
    const resMatch = cmd.match(/^RES\s+([\d.]+)$/);
    if (resMatch) {
      const r = parseFloat(resMatch[1] ?? '0');
      if (r >= 0.1 && r <= 10000) {
        resistanceSetpoint = r;
        publishToBus();
        return { matched: true, response: null };
      }
      return { matched: true, response: null, error: 'Value out of range' };
    }

    // RES? - Query resistance
    if (cmd === 'RES?') {
      return { matched: true, response: resistanceSetpoint.toFixed(3) };
    }

    // POW <value> - Set power (CP mode)
    const powMatch = cmd.match(/^POW\s+([\d.]+)$/);
    if (powMatch) {
      const p = parseFloat(powMatch[1] ?? '0');
      if (p >= 0 && p <= 300) {
        powerSetpoint = p;
        publishToBus();
        return { matched: true, response: null };
      }
      return { matched: true, response: null, error: 'Value out of range' };
    }

    // POW? - Query power
    if (cmd === 'POW?') {
      return { matched: true, response: powerSetpoint.toFixed(3) };
    }

    // INP ON|OFF|1|0 - Set input state
    const inpMatch = cmd.match(/^INP\s+(ON|OFF|1|0)$/i);
    if (inpMatch) {
      const val = (inpMatch[1] ?? '').toUpperCase();
      input = val === 'ON' || val === '1';
      publishToBus();
      return { matched: true, response: null };
    }

    // INP? - Query input state
    if (cmd === 'INP?') {
      return { matched: true, response: input ? 'ON' : 'OFF' };
    }

    // MEAS:VOLT? - Measure voltage
    if (cmd === 'MEAS:VOLT?') {
      return { matched: true, response: getMeasuredVoltage().toFixed(3) };
    }

    // MEAS:CURR? - Measure current
    if (cmd === 'MEAS:CURR?') {
      return { matched: true, response: getMeasuredCurrent().toFixed(3) };
    }

    // MEAS:POW? - Measure power
    if (cmd === 'MEAS:POW?') {
      return { matched: true, response: getMeasuredPower().toFixed(3) };
    }

    // CURR:SLEW <value> - Set slew rate
    const slewMatch = cmd.match(/^CURR:SLEW\s+([\d.]+)$/);
    if (slewMatch) {
      slewRate = parseFloat(slewMatch[1] ?? '0');
      return { matched: true, response: null };
    }

    // CURR:SLEW? - Query slew rate
    if (cmd === 'CURR:SLEW?') {
      return { matched: true, response: slewRate.toFixed(3) };
    }

    return { matched: false, response: null };
  }

  return {
    get mode() {
      return mode;
    },
    get current() {
      return currentSetpoint;
    },
    get voltage() {
      return voltageSetpoint;
    },
    get resistance() {
      return resistanceSetpoint;
    },
    get power() {
      return powerSetpoint;
    },
    get input() {
      return input;
    },
    get measuredVoltage() {
      return getMeasuredVoltage();
    },
    get measuredCurrent() {
      return getMeasuredCurrent();
    },
    get measuredPower() {
      return getMeasuredPower();
    },
    get deviceInfo() {
      return deviceInfo;
    },

    setMode(m: LoadMode) {
      mode = m;
      publishToBus();
    },

    setCurrent(i: number) {
      // Clamp to valid range (0-30A)
      currentSetpoint = Math.max(0, Math.min(MAX_CURRENT, i));
      publishToBus();
    },

    setVoltage(v: number) {
      // Clamp to valid range (0-150V)
      voltageSetpoint = Math.max(0, Math.min(MAX_VOLTAGE, v));
      publishToBus();
    },

    setResistance(r: number) {
      // Clamp to valid range (0.1-10000Ω)
      resistanceSetpoint = Math.max(MIN_RESISTANCE, Math.min(MAX_RESISTANCE, r));
      publishToBus();
    },

    setPower(p: number) {
      // Clamp to valid range (0-300W)
      powerSetpoint = Math.max(0, Math.min(MAX_POWER, p));
      publishToBus();
    },

    setInput(on: boolean) {
      input = on;
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
        // Only react if input is on - passive when off
        if (!input) {
          return;
        }
        // React to bus state changes by publishing our physics
        const myState = physics(state);
        if (myState.voltage !== state.voltage || myState.current !== state.current) {
          bus.publish(myState);
        }
      });

      // Publish initial state if input is on
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
