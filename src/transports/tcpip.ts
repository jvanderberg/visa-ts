/**
 * TCP/IP Socket transport for LXI instruments
 *
 * @packageDocumentation
 */

import * as net from 'net';
import type { Transport, TransportState, TransportConfig } from './transport.js';
import type { Result } from '../result.js';
import { Ok, Err } from '../result.js';
import { createBufferedReader } from '../util/buffered-reader.js';

// Node.js error type for error code handling
interface ErrnoException extends Error {
  code?: string;
}

/**
 * Configuration options for TCP/IP transport
 */
export interface TcpipTransportConfig extends TransportConfig {
  /** Host address or hostname */
  host: string;
  /** TCP port number */
  port: number;
  /** Connection timeout in ms (default: 5000) */
  connectTimeout?: number;
  /** Enable TCP keepalive (default: true) */
  keepAlive?: boolean;
  /** Keepalive interval in ms (default: 10000) */
  keepAliveInterval?: number;
  /** Maximum read buffer size in bytes (default: 1048576 = 1MB) */
  maxBufferSize?: number;
}

/**
 * TCP/IP transport with additional maxBufferSize property
 */
export interface TcpipTransport extends Transport {
  /** Maximum read buffer size in bytes */
  readonly maxBufferSize: number;
}

const DEFAULT_TIMEOUT = 2000;
const DEFAULT_CONNECT_TIMEOUT = 5000;
const DEFAULT_KEEPALIVE_INTERVAL = 10000;
const DEFAULT_CHUNK_SIZE = 65536;
const DEFAULT_MAX_BUFFER_SIZE = 1048576; // 1MB

/**
 * Creates a TCP/IP socket transport for communicating with LXI instruments.
 *
 * @param config - Transport configuration
 * @returns Transport instance
 */
export function createTcpipTransport(config: TcpipTransportConfig): TcpipTransport {
  let state: TransportState = 'closed';
  let socket: net.Socket | null = null;

  let timeout = config.timeout ?? DEFAULT_TIMEOUT;
  let readTermination = config.readTermination ?? '\n';
  let writeTermination = config.writeTermination ?? '\n';

  const connectTimeout = config.connectTimeout ?? DEFAULT_CONNECT_TIMEOUT;
  const keepAlive = config.keepAlive ?? true;
  const keepAliveInterval = config.keepAliveInterval ?? DEFAULT_KEEPALIVE_INTERVAL;
  const maxBufferSize = config.maxBufferSize ?? DEFAULT_MAX_BUFFER_SIZE;

  const reader = createBufferedReader({
    maxBufferSize,
    getReadTermination: () => readTermination,
  });

  function handleClose(): void {
    state = 'closed';
    socket = null;
    reader.handleClose('Connection closed unexpectedly');
  }

  function handleError(error: Error): void {
    state = 'error';
    reader.handleError(error);
  }

  const transport: TcpipTransport = {
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
      if (config.port < 1 || config.port > 65535) {
        return Err(new Error(`Invalid port: ${config.port}. Must be between 1 and 65535`));
      }
      if (timeout <= 0) {
        return Err(new Error(`Invalid timeout: ${timeout}. Must be positive`));
      }
      if (connectTimeout <= 0) {
        return Err(new Error(`Invalid connectTimeout: ${connectTimeout}. Must be positive`));
      }

      state = 'opening';
      reader.clearBuffer();

      return new Promise((resolve) => {
        socket = net.createConnection({
          host: config.host,
          port: config.port,
        });

        const connectTimeoutId = setTimeout(() => {
          if (socket) {
            socket.destroy();
          }
          state = 'error';
          resolve(Err(new Error(`Connection timeout after ${connectTimeout}ms`)));
        }, connectTimeout);

        socket.once('connect', () => {
          clearTimeout(connectTimeoutId);
          state = 'open';

          if (socket && keepAlive) {
            socket.setKeepAlive(true, keepAliveInterval);
          }

          socket!.on('data', (data: Buffer) => reader.handleData(data));
          socket!.on('close', handleClose);
          socket!.on('error', handleError);

          resolve(Ok(undefined));
        });

        socket.once('timeout', () => {
          clearTimeout(connectTimeoutId);
          if (socket) {
            socket.destroy();
          }
          state = 'error';
          resolve(Err(new Error(`Connection timeout after ${connectTimeout}ms`)));
        });

        socket.once('error', (error: ErrnoException) => {
          clearTimeout(connectTimeoutId);
          state = 'error';

          let message = error.message;
          if (error.code === 'ECONNREFUSED') {
            message = `Connection refused to ${config.host}:${config.port}`;
          } else if (error.code === 'EHOSTUNREACH') {
            message = `Host unreachable: ${config.host}`;
          }

          resolve(Err(new Error(message)));
        });
      });
    },

    async close(): Promise<Result<void, Error>> {
      if (state === 'closed' || !socket) {
        state = 'closed';
        return Ok(undefined);
      }

      state = 'closing';

      return new Promise((resolve) => {
        socket!.end(() => {
          state = 'closed';
          socket = null;
          resolve(Ok(undefined));
        });
      });
    },

    async write(data: string): Promise<Result<void, Error>> {
      if (state !== 'open' || !socket) {
        return Err(new Error('Transport is not open'));
      }

      return new Promise((resolve) => {
        socket!.write(data + writeTermination, (err) => {
          if (err) {
            resolve(Err(err));
          } else {
            resolve(Ok(undefined));
          }
        });
      });
    },

    async read(): Promise<Result<string, Error>> {
      if (state !== 'open' || !socket) {
        return Err(new Error('Transport is not open'));
      }

      if (reader.getPendingRead()) {
        return Err(new Error('Read already in progress'));
      }

      // Check if termination is already in buffer
      const termBytes = Buffer.from(readTermination);
      const buffer = reader.getBuffer();
      const termIndex = buffer.indexOf(termBytes);

      if (termIndex !== -1) {
        const result = buffer.subarray(0, termIndex);
        reader.setBuffer(buffer.subarray(termIndex + termBytes.length));
        return Ok(result.toString());
      }

      return new Promise((resolve) => {
        const timeoutId = setTimeout(() => {
          if (reader.getPendingRead()) {
            reader.setPendingRead(null);
            resolve(Err(new Error(`Read timeout after ${timeout}ms`)));
          }
        }, timeout);

        reader.setPendingRead({
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
        });
      });
    },

    async query(command: string, delay?: number): Promise<Result<string, Error>> {
      if (state !== 'open' || !socket) {
        return Err(new Error('Transport is not open'));
      }

      const writeResult = await transport.write(command);
      if (!writeResult.ok) {
        return writeResult;
      }

      if (delay && delay > 0) {
        await new Promise((r) => setTimeout(r, delay));
      }

      return transport.read();
    },

    async writeRaw(data: Buffer): Promise<Result<number, Error>> {
      if (state !== 'open' || !socket) {
        return Err(new Error('Transport is not open'));
      }

      return new Promise((resolve) => {
        socket!.write(data, (err) => {
          if (err) {
            resolve(Err(err));
          } else {
            resolve(Ok(data.length));
          }
        });
      });
    },

    async readRaw(size?: number): Promise<Result<Buffer, Error>> {
      if (state !== 'open' || !socket) {
        return Err(new Error('Transport is not open'));
      }

      if (reader.getPendingRead()) {
        return Err(new Error('Read already in progress'));
      }

      // If we already have data in buffer, return it
      const buffer = reader.getBuffer();
      if (buffer.length > 0) {
        const maxSize = size ?? DEFAULT_CHUNK_SIZE;
        const bytesToReturn = Math.min(buffer.length, maxSize);
        const result = buffer.subarray(0, bytesToReturn);
        reader.setBuffer(buffer.subarray(bytesToReturn));
        return Ok(result);
      }

      return new Promise((resolve) => {
        const timeoutId = setTimeout(() => {
          if (reader.getPendingRead()) {
            reader.setPendingRead(null);
            resolve(Err(new Error(`Read timeout after ${timeout}ms`)));
          }
        }, timeout);

        reader.setPendingRead({
          resolve,
          type: 'raw',
          timeoutId,
        });
      });
    },

    async readBytes(count: number): Promise<Result<Buffer, Error>> {
      if (state !== 'open' || !socket) {
        return Err(new Error('Transport is not open'));
      }

      if (reader.getPendingRead()) {
        return Err(new Error('Read already in progress'));
      }

      // If we already have enough data in buffer, return it
      const buffer = reader.getBuffer();
      if (buffer.length >= count) {
        const result = buffer.subarray(0, count);
        reader.setBuffer(buffer.subarray(count));
        return Ok(result);
      }

      return new Promise((resolve) => {
        const timeoutId = setTimeout(() => {
          if (reader.getPendingRead()) {
            reader.setPendingRead(null);
            resolve(
              Err(
                new Error(
                  `Read timeout after ${timeout}ms: expected ${count} bytes, got ${reader.getBuffer().length}`
                )
              )
            );
          }
        }, timeout);

        reader.setPendingRead({
          resolve,
          type: 'bytes',
          bytesNeeded: count,
          timeoutId,
        });
      });
    },

    async clear(): Promise<Result<void, Error>> {
      if (state !== 'open' || !socket) {
        return Err(new Error('Transport is not open'));
      }

      reader.clearBuffer();
      return Ok(undefined);
    },

    async trigger(): Promise<Result<void, Error>> {
      if (state !== 'open' || !socket) {
        return Err(new Error('Transport is not open'));
      }

      return transport.write('*TRG');
    },

    async readStb(): Promise<Result<number, Error>> {
      if (state !== 'open' || !socket) {
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
