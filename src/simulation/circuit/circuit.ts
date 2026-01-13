/**
 * Circuit simulation factory for visa-ts.
 *
 * Creates circuits that connect simulated devices with realistic physics.
 *
 * @packageDocumentation
 */

import { Ok, Err, type Result } from '../../result.js';
import type { Transport, TransportState } from '../../transports/transport.js';
import {
  createSimulationTransport,
  type SimulationTransport,
} from '../../transports/simulation.js';
import type { SimulatedDevice } from '../types.js';
import { solveCircuit } from './solver.js';
import type { CircuitState, CircuitMeasurements, LoadMode } from './types.js';

/** Default wire resistance in ohms */
const DEFAULT_WIRE_RESISTANCE = 0.01;

/**
 * A port on a device for circuit connections.
 */
export interface DevicePort {
  /** Device ID */
  deviceId: string;
  /** Port name (e.g., 'output', 'input') */
  name: string;
}

/**
 * Connection options.
 */
export interface ConnectionOptions {
  /** Wire resistance in ohms (default: 0.01) */
  resistance?: number;
}

/**
 * A connection between two device ports.
 */
export interface CircuitConnection {
  /** Source port */
  from: DevicePort;
  /** Destination port */
  to: DevicePort;
  /** Wire resistance in ohms */
  resistance: number;
}

/**
 * A device added to the circuit.
 */
export interface CircuitDevice {
  /** Device ID */
  id: string;
  /** The transport for communicating with the device */
  transport: Transport;
  /** Output port for PSU-type devices */
  output: DevicePort;
  /** Input port for Load-type devices */
  input: DevicePort;
}

/**
 * Circuit container for connecting simulated devices.
 */
export interface Circuit {
  /** Map of device ID to device */
  devices: Record<string, CircuitDevice>;
  /** List of connections */
  connections: CircuitConnection[];

  /**
   * Add a device to the circuit.
   *
   * @param id - Unique identifier for the device
   * @param device - Simulated device definition
   * @returns Result with CircuitDevice on success, Error if ID already exists
   */
  addDevice(id: string, device: SimulatedDevice): Result<CircuitDevice, Error>;

  /**
   * Connect two device ports.
   *
   * @param from - Source port (typically PSU output)
   * @param to - Destination port (typically Load input)
   * @param options - Connection options including wire resistance
   */
  connect(from: DevicePort, to: DevicePort, options?: ConnectionOptions): void;
}

/**
 * Create a circuit-aware transport wrapper.
 *
 * This transport delegates to a base simulation transport but intercepts
 * writes to trigger circuit resolution.
 */
function createCircuitTransport(
  baseTransport: SimulationTransport,
  deviceType: 'psu' | 'load',
  circuitResolver: () => void,
  getMeasurements: () => CircuitMeasurements | null
): Transport {
  return {
    get state(): TransportState {
      return baseTransport.state;
    },

    get isOpen(): boolean {
      return baseTransport.isOpen;
    },

    get timeout(): number {
      return baseTransport.timeout;
    },

    set timeout(value: number) {
      baseTransport.timeout = value;
    },

    get readTermination(): string {
      return baseTransport.readTermination;
    },

    set readTermination(value: string) {
      baseTransport.readTermination = value;
    },

    get writeTermination(): string {
      return baseTransport.writeTermination;
    },

    set writeTermination(value: string) {
      baseTransport.writeTermination = value;
    },

    async open(): Promise<Result<void, Error>> {
      return baseTransport.open();
    },

    async close(): Promise<Result<void, Error>> {
      return baseTransport.close();
    },

    async write(data: string): Promise<Result<void, Error>> {
      const result = await baseTransport.write(data);
      if (result.ok) {
        // Trigger circuit resolution after any write
        circuitResolver();
      }
      return result;
    },

    async read(): Promise<Result<string, Error>> {
      return baseTransport.read();
    },

    async query(command: string, delay?: number): Promise<Result<string, Error>> {
      // Check if this is a measurement query
      const upperCmd = command.toUpperCase();
      const measurements = getMeasurements();

      if (measurements && upperCmd.includes('MEAS:')) {
        if (upperCmd.includes('MEAS:VOLT')) {
          if (deviceType === 'psu') {
            return Ok(measurements.psuVoltage.toFixed(3));
          } else {
            return Ok(measurements.loadVoltage.toFixed(3));
          }
        }
        if (upperCmd.includes('MEAS:CURR')) {
          if (deviceType === 'psu') {
            return Ok(measurements.psuCurrent.toFixed(3));
          } else {
            return Ok(measurements.loadCurrent.toFixed(3));
          }
        }
        if (upperCmd.includes('MEAS:POW')) {
          // Calculate power = V * I
          if (deviceType === 'load') {
            const power = measurements.loadVoltage * measurements.loadCurrent;
            return Ok(power.toFixed(3));
          }
        }
      }

      // Delegate to base transport for non-measurement queries
      return baseTransport.query(command, delay);
    },

    async writeRaw(data: Buffer): Promise<Result<number, Error>> {
      const result = await baseTransport.writeRaw(data);
      if (result.ok) {
        circuitResolver();
      }
      return result;
    },

    async readRaw(size?: number): Promise<Result<Buffer, Error>> {
      return baseTransport.readRaw(size);
    },

    async readBytes(count: number): Promise<Result<Buffer, Error>> {
      return baseTransport.readBytes(count);
    },

    async clear(): Promise<Result<void, Error>> {
      return baseTransport.clear();
    },

    async trigger(): Promise<Result<void, Error>> {
      return baseTransport.trigger();
    },

    async readStb(): Promise<Result<number, Error>> {
      return baseTransport.readStb();
    },
  };
}

/**
 * Detect device type based on model name.
 */
function detectDeviceType(device: SimulatedDevice): 'psu' | 'load' {
  const model = device.device.model.toUpperCase();
  if (model.includes('PSU') || model.includes('SUPPLY') || model.includes('SOURCE')) {
    return 'psu';
  }
  return 'load';
}

/**
 * Create a circuit for connecting simulated devices.
 *
 * @returns Circuit instance
 *
 * @example
 * const circuit = createCircuit();
 * const psu = circuit.addDevice('psu', simulatedPsu);
 * const load = circuit.addDevice('load', simulatedLoad);
 * circuit.connect(psu.output, load.input, { resistance: 0.05 });
 *
 * await psu.transport.write('VOLT 12');
 * await psu.transport.write('OUTP ON');
 * await load.transport.write('CURR 1.5');
 * await load.transport.write('INP ON');
 *
 * const current = await psu.transport.query('MEAS:CURR?');
 * // Returns "1.500" - PSU supplies what load draws
 */
export function createCircuit(): Circuit {
  const devices: Record<string, CircuitDevice> = {};
  const connections: CircuitConnection[] = [];
  const baseTransports: Record<string, SimulationTransport> = {};
  const deviceTypes: Record<string, 'psu' | 'load'> = {};

  // Current calculated measurements
  let currentMeasurements: CircuitMeasurements | null = null;

  /**
   * Extract current state from all devices and resolve circuit.
   */
  function resolveCircuit(): void {
    // Find PSU and Load devices
    let psuId: string | null = null;
    let loadId: string | null = null;

    for (const [id, type] of Object.entries(deviceTypes)) {
      if (type === 'psu') psuId = id;
      if (type === 'load') loadId = id;
    }

    if (!psuId || !loadId) {
      // Not enough devices to solve
      currentMeasurements = null;
      return;
    }

    // Get wire resistance from connection (if any)
    const wireResistance = connections[0]?.resistance ?? DEFAULT_WIRE_RESISTANCE;

    // Extract PSU state
    const psuTransport = baseTransports[psuId];
    const loadTransport = baseTransports[loadId];

    if (!psuTransport || !loadTransport) {
      currentMeasurements = null;
      return;
    }

    // Get state from transports using getState() method
    const psuValues = psuTransport.getState();
    const loadValues = loadTransport.getState();

    const circuitState: CircuitState = {
      psu: {
        voltageSetpoint: (psuValues['voltage'] as number) ?? 0,
        currentLimit: (psuValues['current'] as number) ?? 0,
        outputEnabled: (psuValues['output'] as boolean) ?? false,
      },
      load: {
        mode: ((loadValues['mode'] as string) ?? 'CC') as LoadMode,
        inputEnabled: (loadValues['input'] as boolean) ?? false,
        currentSetpoint: (loadValues['current'] as number) ?? 0,
        voltageSetpoint: (loadValues['voltage'] as number) ?? 0,
        resistanceSetpoint: (loadValues['resistance'] as number) ?? 1000,
        powerSetpoint: (loadValues['power'] as number) ?? 0,
      },
      wireResistance,
    };

    currentMeasurements = solveCircuit(circuitState);
  }

  return {
    devices,
    connections,

    addDevice(id: string, device: SimulatedDevice): Result<CircuitDevice, Error> {
      if (devices[id]) {
        return Err(new Error(`Device with ID "${id}" already exists`));
      }

      const deviceType = detectDeviceType(device);
      deviceTypes[id] = deviceType;

      // Create base simulation transport
      const baseTransport = createSimulationTransport({ device });
      baseTransports[id] = baseTransport;

      // Create circuit-aware wrapper
      const wrappedTransport = createCircuitTransport(
        baseTransport,
        deviceType,
        resolveCircuit,
        () => currentMeasurements
      );

      const circuitDevice: CircuitDevice = {
        id,
        transport: wrappedTransport,
        output: { deviceId: id, name: 'output' },
        input: { deviceId: id, name: 'input' },
      };

      devices[id] = circuitDevice;
      return Ok(circuitDevice);
    },

    connect(from: DevicePort, to: DevicePort, options?: ConnectionOptions): void {
      connections.push({
        from,
        to,
        resistance: options?.resistance ?? DEFAULT_WIRE_RESISTANCE,
      });
    },
  };
}
