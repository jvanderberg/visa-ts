/**
 * MessageBasedResource interface - High-level API for SCPI instrument communication.
 *
 * @packageDocumentation
 */

import type { ResourceInfo, QueryOptions, AsciiValuesOptions, BinaryDatatype } from '../types.js';
import type { Result } from '../result.js';

/**
 * Represents an open connection to a message-based instrument (most SCPI devices).
 */
export interface MessageBasedResource {
  /** The VISA resource string for this connection */
  readonly resourceString: string;

  /** Information about this resource */
  readonly resourceInfo: ResourceInfo;

  /** I/O timeout in milliseconds */
  timeout: number;

  /** Character(s) appended to each write */
  writeTermination: string;

  /** Character(s) that terminate a read */
  readTermination: string;

  /** Size of read buffer in bytes (default: 65536) */
  chunkSize: number;

  /** Check if the connection is open */
  readonly isOpen: boolean;

  // ─────────────────────────────────────────────────────────────────
  // Basic I/O
  // ─────────────────────────────────────────────────────────────────

  /**
   * Write a command and read the response.
   * @param command - Command string (termination added automatically)
   * @param options - Query options including optional delay between write and read
   * @returns Response string with termination stripped
   *
   * @example
   * const idn = await instr.query('*IDN?');
   * if (idn.ok) console.log(idn.value);
   *
   * // With delay (some instruments need time between write and read)
   * const value = await instr.query(':MEAS:VOLT?', { delay: 100 });
   */
  query(command: string, options?: QueryOptions): Promise<Result<string, Error>>;

  /**
   * Write a command to the instrument (no response expected).
   * @param command - Command string (termination added automatically)
   * @returns Result indicating success or failure
   *
   * @example
   * await instr.write('*RST');
   */
  write(command: string): Promise<Result<void, Error>>;

  /**
   * Read response from instrument.
   * @returns Response string with termination stripped
   */
  read(): Promise<Result<string, Error>>;

  // ─────────────────────────────────────────────────────────────────
  // Binary I/O
  // ─────────────────────────────────────────────────────────────────

  /**
   * Query and parse binary response as typed array.
   * Handles IEEE 488.2 definite and indefinite length block formats.
   * Automatically reads multiple chunks if data exceeds chunkSize.
   *
   * @param command - Command string
   * @param datatype - Data type specifier (default: 'B' for unsigned 8-bit)
   * @param container - Return type: 'array' for number[] (default)
   * @returns Array of parsed numeric values
   *
   * Datatype specifiers (IEEE 488.2):
   * - 'b' / 'B' - signed/unsigned 8-bit integer
   * - 'h' / 'H' - signed/unsigned 16-bit integer (big-endian)
   * - 'h<' / 'H<' - signed/unsigned 16-bit integer (little-endian)
   * - 'i' / 'I' - signed/unsigned 32-bit integer (big-endian)
   * - 'i<' / 'I<' - signed/unsigned 32-bit integer (little-endian)
   * - 'f' / 'f<' - 32-bit float (big/little-endian)
   * - 'd' / 'd<' - 64-bit double (big/little-endian)
   *
   * @example
   * // Read waveform as unsigned bytes
   * const data = await instr.queryBinaryValues(':WAV:DATA?', 'B');
   *
   * // Read as little-endian 16-bit integers
   * const data = await instr.queryBinaryValues(':WAV:DATA?', 'h<');
   */
  queryBinaryValues(
    command: string,
    datatype?: BinaryDatatype,
    container?: 'array'
  ): Promise<Result<number[], Error>>;

  /**
   * Query and return raw binary response as Buffer.
   * Handles IEEE 488.2 definite and indefinite length block formats.
   * Automatically reads multiple chunks if data exceeds chunkSize.
   *
   * @param command - Command string
   * @param datatype - Data type specifier (used for validation, not parsing)
   * @param container - Must be 'buffer' to get raw Buffer
   * @returns Raw binary data as Buffer
   */
  queryBinaryValues(
    command: string,
    datatype: BinaryDatatype,
    container: 'buffer'
  ): Promise<Result<Buffer, Error>>;

  /**
   * Write binary values to instrument with IEEE 488.2 definite length block header.
   *
   * @param command - Command prefix (e.g., ':DATA:DAC')
   * @param values - Array of values to write, or raw Buffer
   * @param datatype - Data type specifier (default: 'B'). Ignored when values is a Buffer.
   * @returns Result indicating success or failure
   *
   * @example
   * await instr.writeBinaryValues(':DATA:DAC', [0, 127, 255], 'B');
   */
  writeBinaryValues(
    command: string,
    values: number[] | Buffer,
    datatype?: BinaryDatatype
  ): Promise<Result<void, Error>>;

  /**
   * Query raw binary data without parsing.
   * Returns data with IEEE 488.2 header stripped.
   * Automatically reads multiple chunks if data exceeds chunkSize.
   *
   * @param command - Command string
   * @returns Raw buffer with header stripped
   */
  queryBinary(command: string): Promise<Result<Buffer, Error>>;

  /**
   * Read raw binary data without parsing.
   * Returns data with IEEE 488.2 header stripped.
   * Automatically reads multiple chunks if data exceeds chunkSize.
   *
   * @returns Raw buffer with header stripped
   */
  readBinary(): Promise<Result<Buffer, Error>>;

  // ─────────────────────────────────────────────────────────────────
  // ASCII Values (comma/whitespace separated numbers)
  // ─────────────────────────────────────────────────────────────────

  /**
   * Query and parse ASCII numeric values.
   *
   * @param command - Command string
   * @param options - Parse options (separator, converter)
   * @returns Array of parsed numbers. NaN values are filtered out.
   *
   * @example
   * // Response: "1.23,4.56,7.89"
   * const values = await instr.queryAsciiValues(':DATA?');
   * // values.value = [1.23, 4.56, 7.89]
   *
   * // Custom separator
   * const values = await instr.queryAsciiValues(':DATA?', { separator: ';' });
   */
  queryAsciiValues(command: string, options?: AsciiValuesOptions): Promise<Result<number[], Error>>;

  /**
   * Read and parse ASCII numeric values.
   *
   * @param options - Parse options (separator, converter)
   * @returns Array of parsed numbers. NaN values are filtered out.
   */
  readAsciiValues(options?: AsciiValuesOptions): Promise<Result<number[], Error>>;

  /**
   * Write ASCII values to instrument.
   *
   * @param command - Command prefix
   * @param values - Array of numbers to write
   * @param options - Format options. Note: RegExp separators fall back to comma for writing.
   * @returns Result indicating success or failure
   *
   * @example
   * await instr.writeAsciiValues(':DATA', [1.0, 2.0, 3.0]);
   * // Sends: ":DATA 1,2,3\n"
   */
  writeAsciiValues(
    command: string,
    values: number[],
    options?: AsciiValuesOptions
  ): Promise<Result<void, Error>>;

  // ─────────────────────────────────────────────────────────────────
  // Raw I/O (bytes without termination handling)
  // ─────────────────────────────────────────────────────────────────

  /**
   * Write raw bytes to instrument (no termination added).
   *
   * @param data - Bytes to write
   * @returns Number of bytes written
   */
  writeRaw(data: Buffer): Promise<Result<number, Error>>;

  /**
   * Read raw bytes from instrument (no termination handling).
   *
   * @param size - Max bytes to read (default: chunkSize)
   * @returns Raw bytes read
   */
  readRaw(size?: number): Promise<Result<Buffer, Error>>;

  /**
   * Read exact number of bytes from instrument.
   *
   * @param count - Exact number of bytes to read
   * @returns Buffer of exactly count bytes
   */
  readBytes(count: number): Promise<Result<Buffer, Error>>;

  // ─────────────────────────────────────────────────────────────────
  // Control
  // ─────────────────────────────────────────────────────────────────

  /**
   * Clear the instrument's input/output buffers.
   * @returns Result indicating success or failure
   */
  clear(): Promise<Result<void, Error>>;

  /**
   * Send a device trigger (typically sends *TRG command).
   * @returns Result indicating success or failure
   */
  trigger(): Promise<Result<void, Error>>;

  /**
   * Read the Status Byte Register (sends *STB? query).
   * @returns Status byte value (0-255)
   */
  readStb(): Promise<Result<number, Error>>;

  /**
   * Close this resource connection.
   * @returns Result indicating success or failure
   */
  close(): Promise<Result<void, Error>>;
}
