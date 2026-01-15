/**
 * USB-TMC protocol constants and utilities
 *
 * Contains protocol-level constants and header parsing/creation functions
 * for USB Test & Measurement Class devices.
 *
 * @packageDocumentation
 */

// USB-TMC Message Types
export const DEV_DEP_MSG_OUT = 1;
export const DEV_DEP_MSG_IN = 2;
export const TRIGGER = 128;

// USB-TMC Control Requests
export const INITIATE_CLEAR = 5;
export const CHECK_CLEAR_STATUS = 6;
export const GET_CAPABILITIES = 7;
export const READ_STATUS_BYTE = 128;

// USB-TMC Status values
export const STATUS_SUCCESS = 0x01;

// USB request types
export const USB_REQUEST_TYPE_IN = 0xa1;

// Header size
export const USB_TMC_HEADER_SIZE = 12;

/**
 * Parsed USB-TMC bulk-in header
 */
export interface UsbtmcBulkInHeader {
  msgType: number;
  tag: number;
  transferSize: number;
  isEom: boolean;
}

/**
 * Creates a USB-TMC bulk-out header.
 *
 * @param msgType - Message type (DEV_DEP_MSG_OUT, DEV_DEP_MSG_IN, or TRIGGER)
 * @param tag - Message tag (1-255)
 * @param transferSize - Transfer size in bytes
 * @param isEom - End of message flag
 * @returns 12-byte header buffer
 */
export function createBulkOutHeader(
  msgType: number,
  tag: number,
  transferSize: number,
  isEom: boolean
): Buffer {
  const header = Buffer.alloc(USB_TMC_HEADER_SIZE);

  header[0] = msgType;
  header[1] = tag;
  header[2] = ~tag & 0xff;
  header[3] = 0; // Reserved

  // Transfer size (32-bit little-endian)
  header[4] = transferSize & 0xff;
  header[5] = (transferSize >> 8) & 0xff;
  header[6] = (transferSize >> 16) & 0xff;
  header[7] = (transferSize >> 24) & 0xff;

  // bmTransferAttributes
  header[8] = isEom ? 0x01 : 0x00;

  // Reserved
  header[9] = 0;
  header[10] = 0;
  header[11] = 0;

  return header;
}

/**
 * Parses a USB-TMC bulk-in header.
 *
 * @param data - Buffer containing at least 12 bytes
 * @returns Parsed header fields
 */
export function parseBulkInHeader(data: Buffer): UsbtmcBulkInHeader {
  return {
    msgType: data.readUInt8(0),
    tag: data.readUInt8(1),
    transferSize: data.readUInt32LE(4),
    isEom: (data.readUInt8(8) & 0x01) !== 0,
  };
}

/**
 * Creates a tag generator for USB-TMC messages.
 *
 * Tags cycle from 1 to 255 as per USB-TMC specification.
 *
 * @returns Function that returns the next tag value
 */
export function createTagGenerator(): () => number {
  let bTag = 1;
  return () => {
    const tag = bTag;
    bTag = (bTag % 255) + 1;
    return tag;
  };
}
