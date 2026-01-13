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
import type { SimulationTransportConfig } from '../simulation/types.js';

/**
 * Simulation transport interface extending base Transport
 */
export interface SimulationTransport extends Transport {
  /** The simulated device configuration */
  readonly deviceInfo: {
    manufacturer: string;
    model: string;
    serial: string;
  };
}

const DEFAULT_TIMEOUT = 2000;
const DEFAULT_TERMINATION = '\n';

/**
 * Create a simulation transport for testing.
 *
 * @param config - Simulation transport configuration
 * @returns SimulationTransport instance
 *
 * @example
 * const transport = createSimulationTransport({
 *   device: mySimulatedDevice,
 *   latencyMs: 10,
 * });
 * await transport.open();
 * const result = await transport.query('*IDN?');
 */
export function createSimulationTransport(config: SimulationTransportConfig): SimulationTransport {
  // State
  let state: TransportState = 'closed';
  let timeout = config.timeout ?? DEFAULT_TIMEOUT;
  let readTermination = config.readTermination ?? DEFAULT_TERMINATION;
  let writeTermination = config.writeTermination ?? DEFAULT_TERMINATION;

  // Latency configuration
  const latencyMs = config.latencyMs ?? 0;

  // Command handler
  const handler = createCommandHandler(config.device);

  // Pending response buffer
  let pendingResponse: string | null = null;

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
      return Ok(undefined);
    },

    async write(data: string): Promise<Result<void, Error>> {
      const check = requireOpen();
      if (!check.ok) return check;

      // Process command and store response
      const command = data + writeTermination;
      pendingResponse = processCommand(command);

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
        if (pendingResponse === null) {
          return Err(new Error('Read timeout - no pending response'));
        }

        const responseWithTerm = pendingResponse + readTermination;
        const buffer = Buffer.from(responseWithTerm);

        if (size !== undefined && buffer.length > size) {
          // Return only requested size, keep rest in pending
          const returnBuffer = buffer.slice(0, size);
          pendingResponse = buffer.slice(size).toString();
          return Ok(returnBuffer);
        }

        pendingResponse = null;
        return Ok(buffer);
      });
    },

    async readBytes(count: number): Promise<Result<Buffer, Error>> {
      const check = requireOpen();
      if (!check.ok) return check;

      return withLatency(() => {
        if (pendingResponse === null) {
          return Err(new Error('Read timeout - no pending response'));
        }

        const responseWithTerm = pendingResponse + readTermination;
        const buffer = Buffer.from(responseWithTerm);

        if (buffer.length < count) {
          return Err(new Error(`Read timeout - need ${count} bytes, have ${buffer.length}`));
        }

        // Return exact count
        const returnBuffer = buffer.slice(0, count);

        // Keep remainder in pending if any
        if (buffer.length > count) {
          pendingResponse = buffer.slice(count).toString();
        } else {
          pendingResponse = null;
        }

        return Ok(returnBuffer);
      });
    },

    async clear(): Promise<Result<void, Error>> {
      const check = requireOpen();
      if (!check.ok) return check;

      pendingResponse = null;
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
      // Bit 4 (16) = MAV (Message Available) if there's a pending response
      const mav = pendingResponse !== null ? 16 : 0;
      return Ok(mav);
    },
  };

  return transport;
}
