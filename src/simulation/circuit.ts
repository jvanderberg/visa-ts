/**
 * Circuit simulation for visa-ts.
 *
 * Connects PSU and Load devices through wires, enabling realistic
 * simulation where measurements reflect actual circuit physics.
 *
 * @packageDocumentation
 */

import { Ok, Err, type Result } from '../result.js';
import type { SimulationTransport } from '../transports/simulation.js';
import type { CircuitSolution, ConnectOptions } from './circuit-types.js';
import { extractPsuState } from './devices/psu-physics.js';
import { extractLoadState } from './devices/load-physics.js';
import { solveCircuit } from './solver.js';

/**
 * Device configuration when adding to circuit
 */
export interface CircuitDeviceConfig {
  /** Device type: 'psu' or 'load' */
  type: 'psu' | 'load';
}

/**
 * A device connected to the circuit
 */
export interface CircuitDevice {
  /** Unique device identifier */
  id: string;
  /** Device type */
  type: 'psu' | 'load';
  /** Transport for SCPI communication */
  transport: SimulationTransport;
}

/**
 * Circuit interface for managing device connections
 */
export interface Circuit {
  /** Map of device ID to device */
  readonly devices: Map<string, CircuitDevice>;

  /** Wire resistance in ohms */
  readonly wireResistance: number;

  /**
   * Add a device to the circuit.
   *
   * @param id - Unique device identifier
   * @param transport - SimulationTransport for the device
   * @param config - Device configuration
   * @returns Result containing the added device or error if ID already exists
   */
  addDevice(
    id: string,
    transport: SimulationTransport,
    config: CircuitDeviceConfig
  ): Result<CircuitDevice, Error>;

  /**
   * Connect two devices with a wire.
   *
   * @param from - Source device (typically PSU)
   * @param to - Destination device (typically Load)
   * @param options - Connection options (resistance)
   * @returns Result indicating success or failure
   */
  connect(from: CircuitDevice, to: CircuitDevice, options?: ConnectOptions): Result<void, Error>;

  /**
   * Resolve the circuit to determine actual operating point.
   *
   * Updates measured values in all devices based on circuit physics.
   *
   * @returns Circuit solution with current, voltages, and PSU mode
   */
  resolve(): Promise<Result<CircuitSolution, Error>>;
}

/**
 * Default wire resistance in ohms (10mΩ)
 */
const DEFAULT_WIRE_RESISTANCE = 0.01;

/**
 * Create a new circuit for connecting simulated devices.
 *
 * @returns Circuit instance
 *
 * @example
 * ```typescript
 * const circuit = createCircuit();
 *
 * const psu = circuit.addDevice('psu', psuTransport, { type: 'psu' });
 * const load = circuit.addDevice('load', loadTransport, { type: 'load' });
 *
 * circuit.connect(psu, load, { resistance: 0.05 });
 *
 * await psuTransport.write('VOLT 12');
 * await psuTransport.write('OUTP ON');
 * await loadTransport.write('MODE CC');
 * await loadTransport.write('CURR 2');
 * await loadTransport.write('INP ON');
 *
 * await circuit.resolve();
 *
 * const current = await psuTransport.query('MEAS:CURR?');
 * // current.value === '2.000'
 * ```
 */
export function createCircuit(): Circuit {
  const devices = new Map<string, CircuitDevice>();
  let wireResistance = DEFAULT_WIRE_RESISTANCE;
  let psuDevice: CircuitDevice | null = null;
  let loadDevice: CircuitDevice | null = null;
  let isConnected = false;

  return {
    get devices(): Map<string, CircuitDevice> {
      return devices;
    },

    get wireResistance(): number {
      return wireResistance;
    },

    addDevice(
      id: string,
      transport: SimulationTransport,
      config: CircuitDeviceConfig
    ): Result<CircuitDevice, Error> {
      if (devices.has(id)) {
        return Err(new Error(`Device ID "${id}" already exists`));
      }

      const device: CircuitDevice = {
        id,
        type: config.type,
        transport,
      };

      devices.set(id, device);

      // Track PSU and Load for connection
      if (config.type === 'psu') {
        psuDevice = device;
      } else if (config.type === 'load') {
        loadDevice = device;
      }

      return Ok(device);
    },

    connect(from: CircuitDevice, to: CircuitDevice, options?: ConnectOptions): Result<void, Error> {
      wireResistance = options?.resistance ?? DEFAULT_WIRE_RESISTANCE;
      isConnected = true;

      // Update PSU/Load references if needed
      if (from.type === 'psu') {
        psuDevice = from;
      }
      if (to.type === 'load') {
        loadDevice = to;
      }

      return Ok(undefined);
    },

    async resolve(): Promise<Result<CircuitSolution, Error>> {
      // If no devices or no connection, return default solution
      if (!isConnected || !psuDevice || !loadDevice) {
        // Even without connection, extract any PSU state for default behavior
        if (psuDevice) {
          const psuState = await extractPsuState(psuDevice.transport);
          return Ok({
            solved: true,
            psuMode: psuState.outputEnabled ? 'CV' : 'OFF',
            current: 0,
            psuVoltage: psuState.outputEnabled ? psuState.voltageSetpoint : 0,
            loadVoltage: psuState.outputEnabled ? psuState.voltageSetpoint : 0,
            wireDrop: 0,
          });
        }
        return Ok({
          solved: true,
          psuMode: 'OFF',
          current: 0,
          psuVoltage: 0,
          loadVoltage: 0,
          wireDrop: 0,
        });
      }

      // Extract current state from devices
      const psuState = await extractPsuState(psuDevice.transport);
      const loadState = await extractLoadState(loadDevice.transport);

      // Solve the circuit
      const solution = solveCircuit({
        psu: psuState,
        load: loadState,
        wireResistance,
      });

      // Update measured values in devices
      updateDeviceMeasurements(psuDevice.transport, loadDevice.transport, solution);

      return Ok(solution);
    },
  };
}

/**
 * Update measured values in device transports after circuit resolution.
 */
function updateDeviceMeasurements(
  psuTransport: SimulationTransport,
  loadTransport: SimulationTransport,
  solution: CircuitSolution
): void {
  // Update PSU measured values
  psuTransport.updateMeasuredValues({
    measuredVoltage: solution.psuVoltage,
    measuredCurrent: solution.current,
  });

  // Update Load measured values
  loadTransport.updateMeasuredValues({
    measuredVoltage: solution.loadVoltage,
    measuredCurrent: solution.current,
  });
}
