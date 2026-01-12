/**
 * VISA resource string parser and builder
 *
 * @packageDocumentation
 */

import type {
  ParsedResource,
  ParsedUSBResource,
  ParsedSerialResource,
  ParsedTCPIPSocketResource,
  ParsedTCPIPInstrResource,
} from './types.js';
import type { Result } from './result.js';
import { Ok, Err } from './result.js';

/**
 * Parse a VISA resource string into its components.
 *
 * @param resourceString - VISA resource string to parse
 * @returns Parsed resource object or error
 *
 * @example
 * ```typescript
 * const result = parseResourceString('USB0::0x1AB1::0x04CE::DS1ZA123::INSTR');
 * if (result.ok) {
 *   console.log(result.value.vendorId); // 0x1AB1
 * }
 * ```
 */
export function parseResourceString(resourceString: string): Result<ParsedResource, Error> {
  const trimmed = resourceString.trim();

  if (trimmed === '') {
    return Err(new Error('Resource string cannot be empty'));
  }

  // Determine interface type
  const upperStr = trimmed.toUpperCase();

  if (upperStr.startsWith('USB')) {
    return parseUSBResource(trimmed);
  } else if (upperStr.startsWith('ASRL')) {
    return parseSerialResource(trimmed);
  } else if (upperStr.startsWith('TCPIP')) {
    return parseTCPIPResource(trimmed);
  } else if (upperStr.startsWith('GPIB')) {
    return Err(new Error('Unsupported interface type: GPIB'));
  }

  return Err(new Error('Invalid resource string: unrecognized format'));
}

/**
 * Parse USB resource string.
 * Format: USB[board]::vendorId::productId::[serialNumber]::INSTR
 */
function parseUSBResource(resourceString: string): Result<ParsedUSBResource, Error> {
  // Match USB resource pattern
  // USB[0-9]*::vendorId::productId::[serialNumber]::INSTR
  const usbRegex = /^USB(\d*)::([^:]+)::([^:]+)(?:::([^:]+))?::(\w+)$/i;
  const match = resourceString.match(usbRegex);

  if (!match) {
    return Err(new Error('Invalid USB resource string format'));
  }

  const boardStr = match[1] ?? '';
  const vendorStr = match[2];
  const productStr = match[3];
  const serialOrClass = match[4]; // Optional serial number
  const classStr = match[5];

  // Validate required fields
  if (!vendorStr || !productStr || !classStr) {
    return Err(new Error('Invalid USB resource string format'));
  }

  // Determine if the 4th field is serial number or resource class
  let serialNumber: string | undefined;
  const resourceClass = classStr.toUpperCase();

  if (serialOrClass) {
    serialNumber = serialOrClass;
  }

  // Parse vendor ID
  const vendorId = parseNumericId(vendorStr);
  if (vendorId === null) {
    return Err(new Error('Invalid USB resource string: invalid vendor ID'));
  }

  // Parse product ID
  const productId = parseNumericId(productStr);
  if (productId === null) {
    return Err(new Error('Invalid USB resource string: invalid product ID'));
  }

  return Ok({
    interfaceType: 'USB',
    boardNumber: boardStr ? parseInt(boardStr, 10) : 0,
    vendorId,
    productId,
    serialNumber,
    resourceClass,
    resourceString,
  });
}

/**
 * Parse a numeric ID that can be in hex (0x prefix) or decimal format.
 * USB IDs must be in the valid range (0-65535).
 */
function parseNumericId(str: string): number | null {
  if (!str || str.trim() === '') {
    return null;
  }

  const trimmed = str.trim().toLowerCase();

  let num: number;

  if (trimmed.startsWith('0x')) {
    num = parseInt(trimmed.slice(2), 16);
  } else {
    num = parseInt(trimmed, 10);
  }

  // USB IDs must be unsigned 16-bit integers (0-65535)
  if (Number.isNaN(num) || num < 0 || num > 0xffff) {
    return null;
  }

  return num;
}

/**
 * Parse Serial (ASRL) resource string.
 * Format: ASRL<port>::INSTR
 */
function parseSerialResource(resourceString: string): Result<ParsedSerialResource, Error> {
  // Match ASRL resource pattern
  // ASRL followed by port path or number, then ::INSTR
  const asrlRegex = /^ASRL(.+)::(\w+)$/i;
  const match = resourceString.match(asrlRegex);

  if (!match) {
    return Err(new Error('Invalid ASRL resource string: missing port or resource class'));
  }

  const portPart = match[1];
  const resourceClass = match[2];

  if (!portPart || portPart.trim() === '' || !resourceClass) {
    return Err(new Error('Invalid ASRL resource string: missing port'));
  }

  // Handle different port formats
  let portPath: string;

  if (portPart.startsWith('/')) {
    // Unix path: /dev/ttyUSB0, /dev/tty.usbserial-xxx
    portPath = portPart;
  } else if (/^COM\d+$/i.test(portPart)) {
    // Windows COM port: COM3, COM12
    portPath = portPart.toUpperCase();
  } else if (/^\d+$/.test(portPart)) {
    // Numeric shorthand: 3 -> COM3
    portPath = `COM${portPart}`;
  } else {
    // Other format, use as-is
    portPath = portPart;
  }

  return Ok({
    interfaceType: 'ASRL',
    boardNumber: 0,
    portPath,
    resourceClass: resourceClass.toUpperCase(),
    resourceString,
  });
}

/**
 * Parse TCP/IP resource string.
 * Format: TCPIP[board]::host::port::SOCKET
 *      or TCPIP[board]::host[::lanDeviceName]::INSTR
 */
function parseTCPIPResource(
  resourceString: string
): Result<ParsedTCPIPSocketResource | ParsedTCPIPInstrResource, Error> {
  // First try SOCKET format: TCPIP[board]::host::port::SOCKET
  const socketRegex = /^TCPIP(\d*)::([^:]+)::(\d+)::SOCKET$/i;
  const socketMatch = resourceString.match(socketRegex);

  if (socketMatch) {
    const boardStr = socketMatch[1] ?? '';
    const host = socketMatch[2];
    const portStr = socketMatch[3];

    if (!host || !portStr) {
      return Err(new Error('Invalid TCP/IP resource string format'));
    }

    const port = parseInt(portStr, 10);

    if (port < 0 || port > 65535) {
      return Err(new Error('Invalid TCP/IP resource string: port out of range (0-65535)'));
    }

    return Ok({
      interfaceType: 'TCPIP',
      boardNumber: boardStr ? parseInt(boardStr, 10) : 0,
      host,
      port,
      resourceClass: 'SOCKET',
      resourceString,
    });
  }

  // Try INSTR format with LAN device: TCPIP[board]::host::lanDevice::INSTR
  const instrWithDeviceRegex = /^TCPIP(\d*)::([^:]+)::([^:]+)::INSTR$/i;
  const instrWithDeviceMatch = resourceString.match(instrWithDeviceRegex);

  if (instrWithDeviceMatch) {
    const boardStr = instrWithDeviceMatch[1] ?? '';
    const host = instrWithDeviceMatch[2];
    const lanDeviceName = instrWithDeviceMatch[3];

    if (!host || !lanDeviceName) {
      return Err(new Error('Invalid TCP/IP resource string format'));
    }

    // Check if the middle field looks like a port number (which would be invalid for INSTR)
    if (/^\d+$/.test(lanDeviceName)) {
      return Err(
        new Error('Invalid TCP/IP resource string: use SOCKET for port-based connections')
      );
    }

    return Ok({
      interfaceType: 'TCPIP',
      boardNumber: boardStr ? parseInt(boardStr, 10) : 0,
      host,
      lanDeviceName,
      resourceClass: 'INSTR',
      resourceString,
    });
  }

  // Try INSTR format without LAN device: TCPIP[board]::host::INSTR
  const instrRegex = /^TCPIP(\d*)::([^:]+)::INSTR$/i;
  const instrMatch = resourceString.match(instrRegex);

  if (instrMatch) {
    const boardStr = instrMatch[1] ?? '';
    const host = instrMatch[2];

    if (!host) {
      return Err(new Error('Invalid TCP/IP resource string format'));
    }

    return Ok({
      interfaceType: 'TCPIP',
      boardNumber: boardStr ? parseInt(boardStr, 10) : 0,
      host,
      lanDeviceName: 'inst0', // Default LAN device name
      resourceClass: 'INSTR',
      resourceString,
    });
  }

  return Err(new Error('Invalid TCP/IP resource string format'));
}

/**
 * Build a VISA resource string from parsed components.
 *
 * @param resource - Parsed resource object
 * @returns VISA resource string
 *
 * @example
 * ```typescript
 * const resourceStr = buildResourceString({
 *   interfaceType: 'USB',
 *   boardNumber: 0,
 *   vendorId: 0x1AB1,
 *   productId: 0x04CE,
 *   serialNumber: 'DS1ZA123',
 *   resourceClass: 'INSTR',
 *   resourceString: ''
 * });
 * // 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR'
 * ```
 */
export function buildResourceString(resource: ParsedResource): string {
  switch (resource.interfaceType) {
    case 'USB':
      return buildUSBResourceString(resource);
    case 'ASRL':
      return buildSerialResourceString(resource);
    case 'TCPIP':
      if (resource.resourceClass === 'SOCKET') {
        return buildTCPIPSocketResourceString(resource as ParsedTCPIPSocketResource);
      } else {
        return buildTCPIPInstrResourceString(resource as ParsedTCPIPInstrResource);
      }
  }
}

function buildUSBResourceString(resource: ParsedUSBResource): string {
  const vendorHex = `0x${resource.vendorId.toString(16).toUpperCase().padStart(4, '0')}`;
  const productHex = `0x${resource.productId.toString(16).toUpperCase().padStart(4, '0')}`;

  const parts = [`USB${resource.boardNumber}`, vendorHex, productHex];

  if (resource.serialNumber) {
    parts.push(resource.serialNumber);
  }

  parts.push(resource.resourceClass);

  return parts.join('::');
}

function buildSerialResourceString(resource: ParsedSerialResource): string {
  return `ASRL${resource.portPath}::${resource.resourceClass}`;
}

function buildTCPIPSocketResourceString(resource: ParsedTCPIPSocketResource): string {
  return `TCPIP${resource.boardNumber}::${resource.host}::${resource.port}::${resource.resourceClass}`;
}

function buildTCPIPInstrResourceString(resource: ParsedTCPIPInstrResource): string {
  return `TCPIP${resource.boardNumber}::${resource.host}::${resource.lanDeviceName}::${resource.resourceClass}`;
}

/**
 * Check if a resource string matches a VISA pattern.
 *
 * Supports VISA pattern matching:
 * - `?` matches any single character
 * - `*` matches zero or more characters
 *
 * @param resourceString - Resource string to test
 * @param pattern - VISA pattern to match against
 * @returns true if the resource matches the pattern
 *
 * @example
 * ```typescript
 * matchResourcePattern('USB0::0x1AB1::0x04CE::DS1ZA123::INSTR', 'USB?*::INSTR');
 * // true
 * ```
 */
export function matchResourcePattern(resourceString: string, pattern: string): boolean {
  // Convert VISA pattern to regex
  // ? -> matches single character
  // * -> matches zero or more characters
  const regexPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape regex special chars except ? and *
    .replace(/\?/g, '.') // ? -> . (single char)
    .replace(/\*/g, '.*'); // * -> .* (any chars)

  const regex = new RegExp(`^${regexPattern}$`, 'i');
  return regex.test(resourceString);
}
