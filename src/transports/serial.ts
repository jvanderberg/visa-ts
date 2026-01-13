/**
 * Serial port transport for VISA instruments
 *
 * @packageDocumentation
 */

import type { Transport, TransportState, TransportConfig } from './transport.js';
import type { Result } from '../result.js';
import { Ok, Err } from '../result.js';
import { SerialPort } from 'serialport';

// Node.js error type for error code handling
interface ErrnoException extends Error {
  code?: string;
}

/**
 * Configuration options for Serial transport
 */
export interface SerialTransportConfig extends TransportConfig {
  /** Serial port path (e.g., /dev/ttyUSB0, COM3) */
  path: string;
  /** Baud rate (default: 9600) */
  baudRate?: number;
  /** Data bits (default: 8) */
  dataBits?: 5 | 6 | 7 | 8;
  /** Stop bits (default: 1) */
  stopBits?: 1 | 1.5 | 2;
  /** Parity (default: 'none') */
  parity?: 'none' | 'even' | 'odd' | 'mark' | 'space';
  /** Flow control (default: 'none') */
  flowControl?: 'none' | 'hardware' | 'software';
  /** Delay between commands in ms (default: 0) */
  commandDelay?: number;
  /** Maximum read buffer size in bytes (default: 1048576 = 1MB) */
  maxBufferSize?: number;
}

/**
 * Serial transport with additional maxBufferSize property
 */
export interface SerialTransport extends Transport {
  /** Maximum read buffer size in bytes */
  readonly maxBufferSize: number;
}

const DEFAULT_TIMEOUT = 2000;
const DEFAULT_BAUD_RATE = 9600;
const DEFAULT_DATA_BITS = 8;
const DEFAULT_STOP_BITS = 1;
const DEFAULT_PARITY = 'none' as const;
const DEFAULT_CHUNK_SIZE = 65536;
const DEFAULT_MAX_BUFFER_SIZE = 1048576; // 1MB

/**
 * Creates a Serial transport for communicating with instruments over RS-232/USB-serial.
 *
 * @param config - Transport configuration
 * @returns Transport instance
 */
export function createSerialTransport(config: SerialTransportConfig): SerialTransport {
  let state: TransportState = 'closed';
  let port: SerialPort | null = null;
  let readBuffer = Buffer.alloc(0);
  let pendingRead: {
    resolve: (result: Result<Buffer, Error>) => void;
    type: 'termination' | 'raw' | 'bytes';
    bytesNeeded?: number;
    termination?: string;
    timeoutId?: ReturnType<typeof setTimeout>;
  } | null = null;

  let timeout = config.timeout ?? DEFAULT_TIMEOUT;
  let readTermination = config.readTermination ?? '\n';
  let writeTermination = config.writeTermination ?? '\n';

  const commandDelay = config.commandDelay ?? 0;
  const baudRate = config.baudRate ?? DEFAULT_BAUD_RATE;
  const dataBits = config.dataBits ?? DEFAULT_DATA_BITS;
  const stopBits = config.stopBits ?? DEFAULT_STOP_BITS;
  const parity = config.parity ?? DEFAULT_PARITY;
  const flowControl = config.flowControl ?? 'none';
  const maxBufferSize = config.maxBufferSize ?? DEFAULT_MAX_BUFFER_SIZE;

  function handleData(data: Buffer): void {
    // Check for buffer overflow before adding data
    if (readBuffer.length + data.length > maxBufferSize) {
      // Trigger buffer overflow error
      if (pendingRead) {
        if (pendingRead.timeoutId) {
          clearTimeout(pendingRead.timeoutId);
        }
        const pending = pendingRead;
        pendingRead = null;
        readBuffer = Buffer.alloc(0); // Clear buffer
        pending.resolve(Err(new Error(`Read buffer overflow: exceeded ${maxBufferSize} bytes`)));
      }
      return;
    }

    readBuffer = Buffer.concat([readBuffer, data]);

    if (pendingRead) {
      checkPendingRead();
    }
  }

  function checkPendingRead(): void {
    if (!pendingRead) return;

    if (pendingRead.type === 'termination') {
      const termBytes = Buffer.from(pendingRead.termination ?? readTermination);
      const termIndex = readBuffer.indexOf(termBytes);

      if (termIndex !== -1) {
        const result = readBuffer.subarray(0, termIndex);
        readBuffer = readBuffer.subarray(termIndex + termBytes.length);

        if (pendingRead.timeoutId) {
          clearTimeout(pendingRead.timeoutId);
        }

        const resolve = pendingRead.resolve;
        pendingRead = null;
        resolve(Ok(result));
      }
    } else if (pendingRead.type === 'raw') {
      if (readBuffer.length > 0) {
        const result = readBuffer;
        readBuffer = Buffer.alloc(0);

        if (pendingRead.timeoutId) {
          clearTimeout(pendingRead.timeoutId);
        }

        const resolve = pendingRead.resolve;
        pendingRead = null;
        resolve(Ok(result));
      }
    } else if (pendingRead.type === 'bytes') {
      const bytesNeeded = pendingRead.bytesNeeded ?? 0;

      if (readBuffer.length >= bytesNeeded) {
        const result = readBuffer.subarray(0, bytesNeeded);
        readBuffer = readBuffer.subarray(bytesNeeded);

        if (pendingRead.timeoutId) {
          clearTimeout(pendingRead.timeoutId);
        }

        const resolve = pendingRead.resolve;
        pendingRead = null;
        resolve(Ok(result));
      }
    }
  }

  function handleClose(): void {
    state = 'closed';
    port = null;

    if (pendingRead) {
      if (pendingRead.timeoutId) {
        clearTimeout(pendingRead.timeoutId);
      }

      const resolve = pendingRead.resolve;
      pendingRead = null;
      resolve(Err(new Error('Port closed unexpectedly')));
    }
  }

  function handleError(error: Error): void {
    state = 'error';

    if (pendingRead) {
      if (pendingRead.timeoutId) {
        clearTimeout(pendingRead.timeoutId);
      }

      const resolve = pendingRead.resolve;
      pendingRead = null;
      resolve(Err(error));
    }
  }

  async function delay(ms: number): Promise<void> {
    if (ms > 0) {
      return new Promise((r) => setTimeout(r, ms));
    }
  }

  const transport: SerialTransport = {
    get state() {
      return state;
    },

    get isOpen() {
      return state === 'open';
    },

    get timeout() {
      return timeout;
    },

    set timeout(value: number) {
      timeout = value;
    },

    get readTermination() {
      return readTermination;
    },

    set readTermination(value: string) {
      readTermination = value;
    },

    get writeTermination() {
      return writeTermination;
    },

    set writeTermination(value: string) {
      writeTermination = value;
    },

    get maxBufferSize() {
      return maxBufferSize;
    },

    async open(): Promise<Result<void, Error>> {
      if (state === 'open') {
        return Err(new Error('Transport is already open'));
      }

      // Input validation
      if (baudRate <= 0) {
        return Err(new Error(`Invalid baudRate: ${baudRate}. Must be positive`));
      }
      if (timeout <= 0) {
        return Err(new Error(`Invalid timeout: ${timeout}. Must be positive`));
      }
      if (commandDelay < 0) {
        return Err(new Error(`Invalid commandDelay: ${commandDelay}. Must be non-negative`));
      }

      state = 'opening';
      readBuffer = Buffer.alloc(0);

      return new Promise((resolve) => {
        try {
          port = new SerialPort({
            path: config.path,
            baudRate,
            dataBits,
            stopBits,
            parity,
            autoOpen: false,
            rtscts: flowControl === 'hardware',
            xon: flowControl === 'software',
            xoff: flowControl === 'software',
          });

          port.on('data', handleData);
          port.on('close', handleClose);
          port.on('error', handleError);

          port.open((err) => {
            if (err) {
              state = 'error';
              let message = err.message;

              if ((err as ErrnoException).code === 'ENOENT') {
                message = `Port not found: ${config.path}`;
              } else if ((err as ErrnoException).code === 'EBUSY') {
                message = `Port is busy: ${config.path}`;
              }

              resolve(Err(new Error(message)));
            } else {
              state = 'open';
              resolve(Ok(undefined));
            }
          });
        } catch (err) {
          state = 'error';
          resolve(Err(err instanceof Error ? err : new Error(String(err))));
        }
      });
    },

    async close(): Promise<Result<void, Error>> {
      if (state === 'closed' || !port) {
        state = 'closed';
        return Ok(undefined);
      }

      state = 'closing';

      return new Promise((resolve) => {
        port!.close((err) => {
          if (err) {
            state = 'error';
            resolve(Err(err));
          } else {
            state = 'closed';
            port = null;
            resolve(Ok(undefined));
          }
        });
      });
    },

    async write(data: string): Promise<Result<void, Error>> {
      if (state !== 'open' || !port) {
        return Err(new Error('Transport is not open'));
      }

      // Apply command delay
      await delay(commandDelay);

      return new Promise((resolve) => {
        port!.write(data + writeTermination, (err) => {
          if (err) {
            resolve(Err(err));
          } else {
            resolve(Ok(undefined));
          }
        });
      });
    },

    async read(): Promise<Result<string, Error>> {
      if (state !== 'open' || !port) {
        return Err(new Error('Transport is not open'));
      }

      if (pendingRead) {
        return Err(new Error('Read already in progress'));
      }

      // Check if termination is already in buffer
      const termBytes = Buffer.from(readTermination);
      const termIndex = readBuffer.indexOf(termBytes);

      if (termIndex !== -1) {
        const result = readBuffer.subarray(0, termIndex);
        readBuffer = readBuffer.subarray(termIndex + termBytes.length);
        return Ok(result.toString());
      }

      return new Promise((resolve) => {
        const timeoutId = setTimeout(() => {
          if (pendingRead) {
            pendingRead = null;
            resolve(Err(new Error(`Read timeout after ${timeout}ms`)));
          }
        }, timeout);

        pendingRead = {
          resolve: (result) => {
            if (result.ok) {
              resolve(Ok(result.value.toString()));
            } else {
              resolve(result);
            }
          },
          type: 'termination',
          termination: readTermination,
          timeoutId,
        };
      });
    },

    async query(command: string, queryDelay?: number): Promise<Result<string, Error>> {
      if (state !== 'open' || !port) {
        return Err(new Error('Transport is not open'));
      }

      const writeResult = await transport.write(command);
      if (!writeResult.ok) {
        return writeResult;
      }

      if (queryDelay && queryDelay > 0) {
        await delay(queryDelay);
      }

      return transport.read();
    },

    async writeRaw(data: Buffer): Promise<Result<number, Error>> {
      if (state !== 'open' || !port) {
        return Err(new Error('Transport is not open'));
      }

      return new Promise((resolve) => {
        port!.write(data, (err) => {
          if (err) {
            resolve(Err(err));
          } else {
            resolve(Ok(data.length));
          }
        });
      });
    },

    async readRaw(size?: number): Promise<Result<Buffer, Error>> {
      if (state !== 'open' || !port) {
        return Err(new Error('Transport is not open'));
      }

      if (pendingRead) {
        return Err(new Error('Read already in progress'));
      }

      // If we already have data in buffer, return it
      if (readBuffer.length > 0) {
        const maxSize = size ?? DEFAULT_CHUNK_SIZE;
        const bytesToReturn = Math.min(readBuffer.length, maxSize);
        const result = readBuffer.subarray(0, bytesToReturn);
        readBuffer = readBuffer.subarray(bytesToReturn);
        return Ok(result);
      }

      return new Promise((resolve) => {
        const timeoutId = setTimeout(() => {
          if (pendingRead) {
            pendingRead = null;
            resolve(Err(new Error(`Read timeout after ${timeout}ms`)));
          }
        }, timeout);

        pendingRead = {
          resolve,
          type: 'raw',
          timeoutId,
        };
      });
    },

    async readBytes(count: number): Promise<Result<Buffer, Error>> {
      if (state !== 'open' || !port) {
        return Err(new Error('Transport is not open'));
      }

      if (pendingRead) {
        return Err(new Error('Read already in progress'));
      }

      // If we already have enough data in buffer, return it
      if (readBuffer.length >= count) {
        const result = readBuffer.subarray(0, count);
        readBuffer = readBuffer.subarray(count);
        return Ok(result);
      }

      return new Promise((resolve) => {
        const timeoutId = setTimeout(() => {
          if (pendingRead) {
            pendingRead = null;
            resolve(
              Err(
                new Error(
                  `Read timeout after ${timeout}ms: expected ${count} bytes, got ${readBuffer.length}`
                )
              )
            );
          }
        }, timeout);

        pendingRead = {
          resolve,
          type: 'bytes',
          bytesNeeded: count,
          timeoutId,
        };
      });
    },

    async clear(): Promise<Result<void, Error>> {
      if (state !== 'open' || !port) {
        return Err(new Error('Transport is not open'));
      }

      readBuffer = Buffer.alloc(0);

      return new Promise((resolve) => {
        port!.flush((err) => {
          if (err) {
            resolve(Err(err));
          } else {
            resolve(Ok(undefined));
          }
        });
      });
    },

    async trigger(): Promise<Result<void, Error>> {
      if (state !== 'open' || !port) {
        return Err(new Error('Transport is not open'));
      }

      return transport.write('*TRG');
    },

    async readStb(): Promise<Result<number, Error>> {
      if (state !== 'open' || !port) {
        return Err(new Error('Transport is not open'));
      }

      const result = await transport.query('*STB?');

      if (!result.ok) {
        return result;
      }

      const stb = parseInt(result.value.trim(), 10);

      if (Number.isNaN(stb)) {
        return Err(new Error(`Invalid status byte response: ${result.value}`));
      }

      return Ok(stb);
    },
  };

  return transport;
}
