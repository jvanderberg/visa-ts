/**
 * MessageBasedResource - High-level interface for communicating with SCPI instruments
 *
 * @packageDocumentation
 */

import type { Transport } from '../transports/transport.js';
import type { ResourceInfo, QueryOptions, AsciiValuesOptions, BinaryDatatype } from '../types.js';
import type { Result } from '../result.js';
import { Ok, Err } from '../result.js';

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

/**
 * Default read buffer size in bytes.
 * 64KB is a reasonable balance between efficiency (fewer reads for waveform data)
 * and memory usage. This matches common instrument buffer sizes and is a power
 * of 2 for efficient allocation.
 */
const DEFAULT_CHUNK_SIZE = 65536;

/**
 * Binary datatype element sizes in bytes
 */
const ELEMENT_SIZES: Record<BinaryDatatype, number> = {
  b: 1,
  B: 1,
  h: 2,
  H: 2,
  'h<': 2,
  'H<': 2,
  i: 4,
  I: 4,
  'i<': 4,
  'I<': 4,
  f: 4,
  'f<': 4,
  d: 8,
  'd<': 8,
};

/**
 * Parses an IEEE 488.2 definite length block header.
 * Format: #<numDigits><byteCount>
 * Example: #9000001200 means 1200 bytes follow
 *
 * @param buffer - Buffer starting with the header
 * @returns Object with headerLength and dataLength, or null if invalid
 */
function parseBlockHeader(buffer: Buffer): { headerLength: number; dataLength: number } | null {
  if (buffer.length < 2 || buffer[0] !== 0x23) {
    // 0x23 is '#'
    return null;
  }

  const byte1 = buffer[1];
  if (byte1 === undefined) {
    return null;
  }
  const numDigitsChar = String.fromCharCode(byte1);

  // Handle indefinite length block (#0)
  if (numDigitsChar === '0') {
    // Indefinite length - data ends with newline
    const newlineIndex = buffer.indexOf(0x0a, 2); // 0x0a is '\n'
    if (newlineIndex === -1) {
      // No terminator found, assume rest is data
      return { headerLength: 2, dataLength: buffer.length - 2 };
    }
    return { headerLength: 2, dataLength: newlineIndex - 2 };
  }

  const numDigits = parseInt(numDigitsChar, 10);
  if (isNaN(numDigits) || numDigits < 1 || numDigits > 9) {
    return null;
  }

  const headerLength = 2 + numDigits;
  if (buffer.length < headerLength) {
    return null;
  }

  const lengthStr = buffer.subarray(2, headerLength).toString('ascii');
  const dataLength = parseInt(lengthStr, 10);
  if (isNaN(dataLength)) {
    return null;
  }

  return { headerLength, dataLength };
}

/**
 * Creates an IEEE 488.2 definite length block header.
 * Format: #<numDigits><byteCount>
 *
 * @param dataLength - Length of the data in bytes
 * @returns Header string
 */
function createBlockHeader(dataLength: number): string {
  const lengthStr = dataLength.toString();
  return `#${lengthStr.length}${lengthStr}`;
}

/**
 * Reads a complete IEEE 488.2 binary block from the transport.
 * Handles both definite length (#N...) and indefinite length (#0) blocks.
 * Automatically reads multiple chunks if data exceeds initial read size.
 *
 * @param transport - Transport to read from
 * @param initialChunkSize - Size of initial read (default: 65536)
 * @returns Buffer containing the binary data (header stripped)
 */
async function readBinaryBlock(
  transport: Transport,
  initialChunkSize: number
): Promise<Result<Buffer, Error>> {
  // Read initial chunk to get the header
  const initialResult = await transport.readRaw(initialChunkSize);
  if (!initialResult.ok) {
    return initialResult;
  }

  const initialBuffer = initialResult.value;

  // Parse the IEEE 488.2 block header
  const headerInfo = parseBlockHeader(initialBuffer);
  if (!headerInfo) {
    return Err(new Error('Invalid IEEE 488.2 block header'));
  }

  const { headerLength, dataLength } = headerInfo;
  const totalExpected = headerLength + dataLength;

  // Check if we already have all the data
  if (initialBuffer.length >= totalExpected) {
    // All data received in initial read
    return Ok(initialBuffer.subarray(headerLength, totalExpected));
  }

  // Need to read more data - calculate how much
  const remainingBytes = totalExpected - initialBuffer.length;

  // Read the remaining bytes
  const remainingResult = await transport.readBytes(remainingBytes);
  if (!remainingResult.ok) {
    return remainingResult;
  }

  // Concatenate initial data (after header) with remaining data
  const initialData = initialBuffer.subarray(headerLength);
  const fullData = Buffer.concat([initialData, remainingResult.value]);

  return Ok(fullData);
}

/**
 * Converts binary data to an array of numbers based on the datatype.
 *
 * @param buffer - Buffer containing the binary data
 * @param datatype - Data type specifier
 * @returns Array of numbers
 */
function binaryToArray(buffer: Buffer, datatype: BinaryDatatype): number[] {
  const elementSize = ELEMENT_SIZES[datatype];
  const numElements = Math.floor(buffer.length / elementSize);
  const values: number[] = [];

  for (let i = 0; i < numElements; i++) {
    const offset = i * elementSize;

    switch (datatype) {
      case 'b':
        values.push(buffer.readInt8(offset));
        break;
      case 'B':
        values.push(buffer.readUInt8(offset));
        break;
      case 'h':
        values.push(buffer.readInt16BE(offset));
        break;
      case 'H':
        values.push(buffer.readUInt16BE(offset));
        break;
      case 'h<':
        values.push(buffer.readInt16LE(offset));
        break;
      case 'H<':
        values.push(buffer.readUInt16LE(offset));
        break;
      case 'i':
        values.push(buffer.readInt32BE(offset));
        break;
      case 'I':
        values.push(buffer.readUInt32BE(offset));
        break;
      case 'i<':
        values.push(buffer.readInt32LE(offset));
        break;
      case 'I<':
        values.push(buffer.readUInt32LE(offset));
        break;
      case 'f':
        values.push(buffer.readFloatBE(offset));
        break;
      case 'f<':
        values.push(buffer.readFloatLE(offset));
        break;
      case 'd':
        values.push(buffer.readDoubleBE(offset));
        break;
      case 'd<':
        values.push(buffer.readDoubleLE(offset));
        break;
    }
  }

  return values;
}

/**
 * Converts an array of numbers to binary data based on the datatype.
 *
 * @param values - Array of numbers
 * @param datatype - Data type specifier
 * @returns Buffer containing the binary data
 */
function arrayToBinary(values: number[], datatype: BinaryDatatype): Buffer {
  const elementSize = ELEMENT_SIZES[datatype];
  const buffer = Buffer.alloc(values.length * elementSize);

  for (let i = 0; i < values.length; i++) {
    const offset = i * elementSize;
    const value = values[i] as number;

    switch (datatype) {
      case 'b':
        buffer.writeInt8(value, offset);
        break;
      case 'B':
        buffer.writeUInt8(value, offset);
        break;
      case 'h':
        buffer.writeInt16BE(value, offset);
        break;
      case 'H':
        buffer.writeUInt16BE(value, offset);
        break;
      case 'h<':
        buffer.writeInt16LE(value, offset);
        break;
      case 'H<':
        buffer.writeUInt16LE(value, offset);
        break;
      case 'i':
        buffer.writeInt32BE(value, offset);
        break;
      case 'I':
        buffer.writeUInt32BE(value, offset);
        break;
      case 'i<':
        buffer.writeInt32LE(value, offset);
        break;
      case 'I<':
        buffer.writeUInt32LE(value, offset);
        break;
      case 'f':
        buffer.writeFloatBE(value, offset);
        break;
      case 'f<':
        buffer.writeFloatLE(value, offset);
        break;
      case 'd':
        buffer.writeDoubleBE(value, offset);
        break;
      case 'd<':
        buffer.writeDoubleLE(value, offset);
        break;
    }
  }

  return buffer;
}

/**
 * Parses ASCII values from a string response.
 *
 * @param response - String containing values
 * @param options - Parse options
 * @returns Array of numbers
 */
function parseAsciiValues(response: string, options?: AsciiValuesOptions): number[] {
  if (response.trim() === '') {
    return [];
  }

  const separator = options?.separator ?? /[\s,]+/;
  const converter = options?.converter ?? parseFloat;

  const parts =
    typeof separator === 'string' ? response.split(separator) : response.split(separator);

  return parts.map((s) => converter(s.trim())).filter((n) => !isNaN(n));
}

/**
 * Creates a MessageBasedResource wrapping a transport.
 *
 * @param transport - The underlying transport for I/O operations
 * @param resourceInfo - Information about the resource
 * @returns MessageBasedResource interface
 */
export function createMessageBasedResource(
  transport: Transport,
  resourceInfo: ResourceInfo
): MessageBasedResource {
  let chunkSize = DEFAULT_CHUNK_SIZE;

  const resource: MessageBasedResource = {
    get resourceString() {
      return resourceInfo.resourceString;
    },

    get resourceInfo() {
      return resourceInfo;
    },

    get timeout() {
      return transport.timeout;
    },

    set timeout(value: number) {
      transport.timeout = value;
    },

    get writeTermination() {
      return transport.writeTermination;
    },

    set writeTermination(value: string) {
      transport.writeTermination = value;
    },

    get readTermination() {
      return transport.readTermination;
    },

    set readTermination(value: string) {
      transport.readTermination = value;
    },

    get chunkSize() {
      return chunkSize;
    },

    set chunkSize(value: number) {
      chunkSize = value;
    },

    get isOpen() {
      return transport.isOpen;
    },

    // Basic I/O
    async query(command: string, options?: QueryOptions): Promise<Result<string, Error>> {
      return transport.query(command, options?.delay);
    },

    async write(command: string): Promise<Result<void, Error>> {
      return transport.write(command);
    },

    async read(): Promise<Result<string, Error>> {
      return transport.read();
    },

    // Raw I/O
    async writeRaw(data: Buffer): Promise<Result<number, Error>> {
      return transport.writeRaw(data);
    },

    async readRaw(size?: number): Promise<Result<Buffer, Error>> {
      return transport.readRaw(size ?? chunkSize);
    },

    async readBytes(count: number): Promise<Result<Buffer, Error>> {
      return transport.readBytes(count);
    },

    // Control
    async clear(): Promise<Result<void, Error>> {
      return transport.clear();
    },

    async trigger(): Promise<Result<void, Error>> {
      return transport.trigger();
    },

    async readStb(): Promise<Result<number, Error>> {
      return transport.readStb();
    },

    async close(): Promise<Result<void, Error>> {
      return transport.close();
    },

    // ASCII Values
    async queryAsciiValues(
      command: string,
      options?: AsciiValuesOptions
    ): Promise<Result<number[], Error>> {
      const result = await transport.query(command);
      if (!result.ok) {
        return result;
      }
      return Ok(parseAsciiValues(result.value, options));
    },

    async readAsciiValues(options?: AsciiValuesOptions): Promise<Result<number[], Error>> {
      const result = await transport.read();
      if (!result.ok) {
        return result;
      }
      return Ok(parseAsciiValues(result.value, options));
    },

    async writeAsciiValues(
      command: string,
      values: number[],
      options?: AsciiValuesOptions
    ): Promise<Result<void, Error>> {
      const separator = typeof options?.separator === 'string' ? options.separator : ',';
      const valueStr = values.join(separator);
      return transport.write(`${command} ${valueStr}`);
    },

    // Binary I/O - Implementation handles both overloads
    queryBinaryValues: (async (
      command: string,
      datatype: BinaryDatatype = 'B',
      container: 'array' | 'buffer' = 'array'
    ): Promise<Result<number[] | Buffer, Error>> => {
      // Write the command
      const writeResult = await transport.write(command);
      if (!writeResult.ok) {
        return writeResult;
      }

      // Read complete binary block (handles multi-read for large data)
      const dataResult = await readBinaryBlock(transport, chunkSize);
      if (!dataResult.ok) {
        return dataResult;
      }

      if (container === 'buffer') {
        return Ok(dataResult.value);
      }

      return Ok(binaryToArray(dataResult.value, datatype));
    }) as MessageBasedResource['queryBinaryValues'],

    async writeBinaryValues(
      command: string,
      values: number[] | Buffer,
      datatype: BinaryDatatype = 'B'
    ): Promise<Result<void, Error>> {
      // Convert values to binary if needed
      const data = Buffer.isBuffer(values) ? values : arrayToBinary(values, datatype);

      // Create the IEEE 488.2 header
      const header = createBlockHeader(data.length);

      // Combine command, header, and data
      const fullData = Buffer.concat([Buffer.from(command + ' ' + header), data]);

      const result = await transport.writeRaw(fullData);
      if (!result.ok) {
        return result;
      }

      return Ok(undefined);
    },

    async queryBinary(command: string): Promise<Result<Buffer, Error>> {
      // Write the command
      const writeResult = await transport.write(command);
      if (!writeResult.ok) {
        return writeResult;
      }

      // Read complete binary block (handles multi-read for large data)
      return readBinaryBlock(transport, chunkSize);
    },

    async readBinary(): Promise<Result<Buffer, Error>> {
      // Read complete binary block (handles multi-read for large data)
      return readBinaryBlock(transport, chunkSize);
    },
  };

  return resource;
}
