/**
 * IEEE 488.2 binary block utilities for parsing and creating definite/indefinite length blocks.
 *
 * @packageDocumentation
 */

import type { BinaryDatatype } from '../types.js';

/**
 * Binary datatype element sizes in bytes
 */
export const ELEMENT_SIZES: Record<BinaryDatatype, number> = {
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
 * Result of parsing an IEEE 488.2 block header.
 */
export interface BlockHeaderInfo {
  /** Length of the header in bytes */
  headerLength: number;
  /** Length of the data in bytes */
  dataLength: number;
}

/**
 * Parses an IEEE 488.2 definite or indefinite length block header.
 *
 * Definite format: #<numDigits><byteCount>
 * Example: #9000001200 means 1200 bytes follow
 *
 * Indefinite format: #0<data>\n
 * Data ends with newline character
 *
 * @param buffer - Buffer starting with the header
 * @returns Object with headerLength and dataLength, or null if invalid
 */
export function parseBlockHeader(buffer: Buffer): BlockHeaderInfo | null {
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
export function createBlockHeader(dataLength: number): string {
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
export function binaryToArray(buffer: Buffer, datatype: BinaryDatatype): number[] {
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
export function arrayToBinary(values: number[], datatype: BinaryDatatype): Buffer {
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
