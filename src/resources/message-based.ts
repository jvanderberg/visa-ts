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

  // Basic I/O
  query(command: string, options?: QueryOptions): Promise<Result<string, Error>>;
  write(command: string): Promise<Result<void, Error>>;
  read(): Promise<Result<string, Error>>;

  // Binary I/O
  queryBinaryValues(
    command: string,
    datatype?: BinaryDatatype,
    container?: 'array'
  ): Promise<Result<number[], Error>>;
  queryBinaryValues(
    command: string,
    datatype: BinaryDatatype,
    container: 'buffer'
  ): Promise<Result<Buffer, Error>>;
  writeBinaryValues(
    command: string,
    values: number[] | Buffer,
    datatype?: BinaryDatatype
  ): Promise<Result<void, Error>>;
  queryBinary(command: string): Promise<Result<Buffer, Error>>;
  readBinary(): Promise<Result<Buffer, Error>>;

  // ASCII Values
  queryAsciiValues(command: string, options?: AsciiValuesOptions): Promise<Result<number[], Error>>;
  readAsciiValues(options?: AsciiValuesOptions): Promise<Result<number[], Error>>;
  writeAsciiValues(
    command: string,
    values: number[],
    options?: AsciiValuesOptions
  ): Promise<Result<void, Error>>;

  // Raw I/O
  writeRaw(data: Buffer): Promise<Result<number, Error>>;
  readRaw(size?: number): Promise<Result<Buffer, Error>>;
  readBytes(count: number): Promise<Result<Buffer, Error>>;

  // Control
  clear(): Promise<Result<void, Error>>;
  trigger(): Promise<Result<void, Error>>;
  readStb(): Promise<Result<number, Error>>;
  close(): Promise<Result<void, Error>>;
}

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
  let chunkSize = 65536;

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

      // Read the response (binary data with IEEE 488.2 header)
      const readResult = await transport.readRaw(chunkSize);
      if (!readResult.ok) {
        return readResult;
      }

      const bufferData = readResult.value;

      // Parse the IEEE 488.2 block header
      const headerInfo = parseBlockHeader(bufferData);
      if (!headerInfo) {
        return Err(new Error('Invalid IEEE 488.2 block header'));
      }

      // Extract the data portion
      const data = bufferData.subarray(
        headerInfo.headerLength,
        headerInfo.headerLength + headerInfo.dataLength
      );

      if (container === 'buffer') {
        return Ok(data);
      }

      return Ok(binaryToArray(data, datatype));
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

      // Read the response
      const readResult = await transport.readRaw(chunkSize);
      if (!readResult.ok) {
        return readResult;
      }

      const buffer = readResult.value;

      // Parse the IEEE 488.2 block header
      const headerInfo = parseBlockHeader(buffer);
      if (!headerInfo) {
        return Err(new Error('Invalid IEEE 488.2 block header'));
      }

      // Extract the data portion
      return Ok(
        buffer.subarray(headerInfo.headerLength, headerInfo.headerLength + headerInfo.dataLength)
      );
    },

    async readBinary(): Promise<Result<Buffer, Error>> {
      // Read the response
      const readResult = await transport.readRaw(chunkSize);
      if (!readResult.ok) {
        return readResult;
      }

      const buffer = readResult.value;

      // Parse the IEEE 488.2 block header
      const headerInfo = parseBlockHeader(buffer);
      if (!headerInfo) {
        return Err(new Error('Invalid IEEE 488.2 block header'));
      }

      // Extract the data portion
      return Ok(
        buffer.subarray(headerInfo.headerLength, headerInfo.headerLength + headerInfo.dataLength)
      );
    },
  };

  return resource;
}
