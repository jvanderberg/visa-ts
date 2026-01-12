/**
 * Transport interface for visa-ts
 *
 * All transport implementations (USB-TMC, Serial, TCP/IP) implement this interface.
 *
 * @packageDocumentation
 */

import type { Result } from '../result.js';

/**
 * Connection state of a transport
 */
export type TransportState = 'closed' | 'opening' | 'open' | 'closing' | 'error';

/**
 * Base configuration options for all transports
 */
export interface TransportConfig {
  /** I/O timeout in milliseconds (default: 2000) */
  timeout?: number;
  /** Read termination character (default: '\n') */
  readTermination?: string;
  /** Write termination character (default: '\n') */
  writeTermination?: string;
}

/**
 * Transport interface that all transport implementations must implement.
 *
 * Transports handle the low-level communication with instruments over
 * different physical interfaces (USB-TMC, Serial, TCP/IP).
 */
export interface Transport {
  /**
   * Current state of the transport connection
   */
  readonly state: TransportState;

  /**
   * Whether the transport is currently open and ready for I/O
   */
  readonly isOpen: boolean;

  /**
   * I/O timeout in milliseconds
   */
  timeout: number;

  /**
   * Character(s) appended to each write operation
   */
  writeTermination: string;

  /**
   * Character(s) that indicate end of read
   */
  readTermination: string;

  /**
   * Open the transport connection.
   *
   * @returns Result indicating success or failure
   */
  open(): Promise<Result<void, Error>>;

  /**
   * Close the transport connection.
   *
   * @returns Result indicating success or failure
   */
  close(): Promise<Result<void, Error>>;

  /**
   * Write data to the instrument.
   *
   * The write termination character is automatically appended.
   *
   * @param data - String data to write
   * @returns Result indicating success or failure
   */
  write(data: string): Promise<Result<void, Error>>;

  /**
   * Read data from the instrument.
   *
   * Reads until the read termination character is received or timeout.
   *
   * @returns Result containing the read string (termination stripped) or error
   */
  read(): Promise<Result<string, Error>>;

  /**
   * Write a command and read the response.
   *
   * @param command - Command to send
   * @param delay - Optional delay in ms between write and read
   * @returns Result containing the response string or error
   */
  query(command: string, delay?: number): Promise<Result<string, Error>>;

  /**
   * Write raw bytes without adding termination.
   *
   * @param data - Buffer to write
   * @returns Result containing bytes written or error
   */
  writeRaw(data: Buffer): Promise<Result<number, Error>>;

  /**
   * Read raw bytes without termination handling.
   *
   * @param size - Maximum bytes to read
   * @returns Result containing the read buffer or error
   */
  readRaw(size?: number): Promise<Result<Buffer, Error>>;

  /**
   * Read exact number of bytes from the instrument.
   *
   * @param count - Exact number of bytes to read
   * @returns Result containing the read buffer or error
   */
  readBytes(count: number): Promise<Result<Buffer, Error>>;

  /**
   * Clear the instrument's input/output buffers.
   *
   * @returns Result indicating success or failure
   */
  clear(): Promise<Result<void, Error>>;

  /**
   * Send a device trigger.
   *
   * @returns Result indicating success or failure
   */
  trigger(): Promise<Result<void, Error>>;

  /**
   * Read the Status Byte Register (IEEE 488.2).
   *
   * @returns Result containing the status byte or error
   */
  readStb(): Promise<Result<number, Error>>;
}

/**
 * Factory function signature for creating transports
 */
export type TransportFactory<C extends TransportConfig> = (config: C) => Transport;
