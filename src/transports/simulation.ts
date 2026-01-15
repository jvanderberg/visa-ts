/**
 * Simulation transport for visa-ts.
 *
 * Provides a TypeScript-native simulation backend for testing without hardware.
 *
 * @packageDocumentation
 */

import { Ok, Err, type Result } from '../result.js';
import type { Transport, TransportState } from './transport.js';
import { createCommandHandler } from '../simulation/command-handler.js';
import { solveCircuit, type CircuitDevice } from '../simulation/circuit/solver.js';
import type { SimulatedDevice } from '../simulation/types.js';

export interface SimulationTransport extends Transport {
  readonly deviceInfo: {
    manufacturer: string;
    model: string;
    serial: string;
  };
}

export interface SimulationTransportConfig {
  device: SimulatedDevice;
  latencyMs?: number;
  timeout?: number;
  readTermination?: string;
  writeTermination?: string;
  /** Other devices on the same bus for circuit simulation */
  busDevices?: SimulatedDevice[];
}

const DEFAULT_TIMEOUT = 2000;
const DEFAULT_TERMINATION = '\n';

export function createSimulationTransport(config: SimulationTransportConfig): SimulationTransport {
  let state: TransportState = 'closed';
  let timeout = config.timeout ?? DEFAULT_TIMEOUT;
  let readTermination = config.readTermination ?? DEFAULT_TERMINATION;
  let writeTermination = config.writeTermination ?? DEFAULT_TERMINATION;

  const latencyMs = config.latencyMs ?? 0;
  const device = config.device;
  const busDevices = config.busDevices ?? [];
  const handler = createCommandHandler(device);

  // Update circuit simulation after state changes
  function updateCircuit(): void {
    if (!device.getBehavior) return;

    // Collect all behaviors from devices on the bus
    const allDevices = [device, ...busDevices];
    const behaviors = allDevices.filter((d) => d.getBehavior).map((d) => d.getBehavior!());

    // Find source (voltage-source) and load (anything else)
    let source: CircuitDevice = { enabled: false, behavior: { type: 'open' } };
    let load: CircuitDevice = { enabled: false, behavior: { type: 'open' } };

    for (const b of behaviors) {
      if (b.behavior.type === 'voltage-source') {
        source = { enabled: b.enabled, behavior: b.behavior };
      } else if (b.behavior.type !== 'open') {
        load = { enabled: b.enabled, behavior: b.behavior };
      }
    }

    const result = solveCircuit(source, load);

    // Update all devices on the bus
    for (const d of allDevices) {
      d.setMeasured?.(result.voltage, result.current);
    }
  }

  let pendingResponse: string | null = null;
  let pendingBuffer: Buffer | null = null;

  // Helper to add latency
  async function withLatency<T>(fn: () => T): Promise<T> {
    if (latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, latencyMs));
    }
    return fn();
  }

  // Helper to check if open
  function requireOpen(): Result<void, Error> {
    if (state !== 'open') {
      return Err(new Error('Transport is not open'));
    }
    return Ok(undefined);
  }

  // Process a command and get response
  function processCommand(command: string): string | null {
    // Strip termination if present
    const trimmedCommand = command.endsWith(writeTermination)
      ? command.slice(0, -writeTermination.length)
      : command;

    const result = handler.handleCommand(trimmedCommand);

    if (!result.matched) {
      return null;
    }

    return result.response;
  }

  const transport: SimulationTransport = {
    get state(): TransportState {
      return state;
    },

    get isOpen(): boolean {
      return state === 'open';
    },

    get timeout(): number {
      return timeout;
    },

    set timeout(value: number) {
      timeout = value;
    },

    get readTermination(): string {
      return readTermination;
    },

    set readTermination(value: string) {
      readTermination = value;
    },

    get writeTermination(): string {
      return writeTermination;
    },

    set writeTermination(value: string) {
      writeTermination = value;
    },

    get deviceInfo() {
      return handler.getDeviceInfo();
    },

    async open(): Promise<Result<void, Error>> {
      if (state === 'open') {
        return Err(new Error('Transport is already open'));
      }

      state = 'open';
      return Ok(undefined);
    },

    async close(): Promise<Result<void, Error>> {
      state = 'closed';
      pendingResponse = null;
      pendingBuffer = null;
      return Ok(undefined);
    },

    async write(data: string): Promise<Result<void, Error>> {
      const check = requireOpen();
      if (!check.ok) return check;

      const command = data + writeTermination;
      pendingResponse = processCommand(command);
      updateCircuit();

      return Ok(undefined);
    },

    async read(): Promise<Result<string, Error>> {
      const check = requireOpen();
      if (!check.ok) return check;

      return withLatency(() => {
        if (pendingResponse === null) {
          return Err(new Error('Read timeout - no pending response'));
        }

        const response = pendingResponse;
        pendingResponse = null;
        return Ok(response);
      });
    },

    async query(command: string, delay?: number): Promise<Result<string, Error>> {
      const check = requireOpen();
      if (!check.ok) return check;

      // Process command directly (without write termination doubling)
      const response = processCommand(command + writeTermination);

      // Add optional delay
      if (delay && delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      return withLatency(() => {
        if (response === null) {
          return Err(new Error('Read timeout - command not matched'));
        }
        return Ok(response);
      });
    },

    async writeRaw(data: Buffer): Promise<Result<number, Error>> {
      const check = requireOpen();
      if (!check.ok) return check;

      // Process as string command
      const command = data.toString();
      pendingResponse = processCommand(command);

      return Ok(data.length);
    },

    async readRaw(size?: number): Promise<Result<Buffer, Error>> {
      const check = requireOpen();
      if (!check.ok) return check;

      return withLatency(() => {
        // Check for partial buffer first (from previous partial read)
        let buffer: Buffer;
        if (pendingBuffer !== null) {
          buffer = pendingBuffer;
          pendingBuffer = null;
        } else if (pendingResponse !== null) {
          buffer = Buffer.from(pendingResponse + readTermination);
          pendingResponse = null;
        } else {
          return Err(new Error('Read timeout - no pending response'));
        }

        if (size !== undefined && buffer.length > size) {
          // Return only requested size, keep rest in pending buffer
          const returnBuffer = buffer.slice(0, size);
          pendingBuffer = buffer.slice(size);
          return Ok(returnBuffer);
        }

        return Ok(buffer);
      });
    },

    async readBytes(count: number): Promise<Result<Buffer, Error>> {
      const check = requireOpen();
      if (!check.ok) return check;

      return withLatency(() => {
        // Check for partial buffer first (from previous partial read)
        let buffer: Buffer;
        if (pendingBuffer !== null) {
          buffer = pendingBuffer;
          pendingBuffer = null;
        } else if (pendingResponse !== null) {
          buffer = Buffer.from(pendingResponse + readTermination);
          pendingResponse = null;
        } else {
          return Err(new Error('Read timeout - no pending response'));
        }

        if (buffer.length < count) {
          return Err(new Error(`Read timeout - need ${count} bytes, have ${buffer.length}`));
        }

        // Return exact count
        const returnBuffer = buffer.slice(0, count);

        // Keep remainder in pending buffer if any
        if (buffer.length > count) {
          pendingBuffer = buffer.slice(count);
        }

        return Ok(returnBuffer);
      });
    },

    async clear(): Promise<Result<void, Error>> {
      const check = requireOpen();
      if (!check.ok) return check;

      pendingResponse = null;
      pendingBuffer = null;
      return Ok(undefined);
    },

    async trigger(): Promise<Result<void, Error>> {
      const check = requireOpen();
      if (!check.ok) return check;

      // Simulation: trigger does nothing special
      return Ok(undefined);
    },

    async readStb(): Promise<Result<number, Error>> {
      const check = requireOpen();
      if (!check.ok) return check;

      // Simulation: return a basic status byte
      // Bit 4 (16) = MAV (Message Available) if there's pending data
      const mav = pendingResponse !== null || pendingBuffer !== null ? 16 : 0;
      return Ok(mav);
    },
  };

  return transport;
}
