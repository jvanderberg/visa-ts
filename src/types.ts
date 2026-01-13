/**
 * Core types for visa-ts
 *
 * @packageDocumentation
 */

/**
 * Interface type identifier for VISA resources
 */
export type InterfaceType = 'USB' | 'ASRL' | 'TCPIP' | 'GPIB';

/**
 * Base resource information returned by discovery
 */
export interface ResourceInfo {
  /** Full VISA resource string */
  resourceString: string;
  /** Interface type */
  interfaceType: InterfaceType;
  /** Manufacturer name from *IDN? if available */
  manufacturer?: string;
  /** Model identifier */
  model?: string;
  /** Device serial number */
  serialNumber?: string;
}

/**
 * USB resource information with USB-specific fields
 */
export interface USBResourceInfo extends ResourceInfo {
  interfaceType: 'USB';
  /** USB Vendor ID (16-bit) */
  vendorId: number;
  /** USB Product ID (16-bit) */
  productId: number;
  /** USB device class */
  usbClass: number;
}

/**
 * Serial (ASRL) resource information
 */
export interface SerialResourceInfo extends ResourceInfo {
  interfaceType: 'ASRL';
  /** Serial port path (e.g., /dev/ttyUSB0, COM3) */
  portPath: string;
  /** Baud rate if known */
  baudRate?: number;
}

/**
 * TCP/IP resource information
 */
export interface TCPIPResourceInfo extends ResourceInfo {
  interfaceType: 'TCPIP';
  /** Host address or hostname */
  host: string;
  /** TCP port number */
  port: number;
}

/**
 * USB-TMC transport options
 */
export interface USBTMCOptions {
  /** Enable quirk mode for non-compliant devices */
  quirks?: 'rigol' | 'none';
}

/**
 * Auto-baud detection options
 */
export interface AutoBaudOptions {
  /** Enable auto-baud detection (default: false) */
  enabled: boolean;
  /** Baud rates to try (default: [115200, 9600, 57600, 38400, 19200]) */
  baudRates?: number[];
  /** Command to send for probing (default: '*IDN?') */
  probeCommand?: string;
  /** Timeout for each probe attempt in ms (default: 500) */
  probeTimeout?: number;
}

/**
 * Serial transport options
 */
export interface SerialOptions {
  /** Baud rate (default: 9600). Ignored if autoBaud.enabled is true. */
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
  /** Auto-detect baud rate by probing the device */
  autoBaud?: AutoBaudOptions;
}

/**
 * TCP/IP transport options
 */
export interface TCPIPOptions {
  /** Connection timeout in ms (default: 5000) */
  connectTimeout?: number;
  /** Enable TCP keepalive (default: true) */
  keepAlive?: boolean;
  /** Keepalive interval in ms (default: 10000) */
  keepAliveInterval?: number;
}

/**
 * Union of transport-specific options
 */
export type TransportOptions = USBTMCOptions | SerialOptions | TCPIPOptions;

/**
 * Options for opening a resource connection
 */
export interface OpenOptions {
  /** I/O timeout in milliseconds (default: 2000) */
  timeout?: number;
  /** Read termination character (default: '\n') */
  readTermination?: string;
  /** Write termination character (default: '\n') */
  writeTermination?: string;
  /** Open in exclusive mode (default: false) */
  exclusive?: boolean;
  /** Transport-specific options */
  transport?: TransportOptions;
}

/**
 * Options for query operations
 */
export interface QueryOptions {
  /** Delay in ms between write and read (some instruments need this) */
  delay?: number;
}

/**
 * Options for ASCII value parsing
 */
export interface AsciiValuesOptions {
  /** Value separator (default: ',' - also handles whitespace) */
  separator?: string | RegExp;
  /** Custom converter function (default: parseFloat) */
  converter?: (s: string) => number;
}

/**
 * Binary data type specifiers following IEEE 488.2 conventions.
 *
 * Base types (big-endian by default):
 *   'b' - signed 8-bit integer
 *   'B' - unsigned 8-bit integer
 *   'h' - signed 16-bit integer
 *   'H' - unsigned 16-bit integer
 *   'i' - signed 32-bit integer
 *   'I' - unsigned 32-bit integer
 *   'f' - 32-bit IEEE 754 float
 *   'd' - 64-bit IEEE 754 double
 *
 * Append '<' for little-endian variants (e.g., 'h<', 'f<', 'd<').
 */
export type BinaryDatatype =
  | 'b'
  | 'B' // int8, uint8
  | 'h'
  | 'H' // int16, uint16 (big-endian)
  | 'h<'
  | 'H<' // int16, uint16 (little-endian)
  | 'i'
  | 'I' // int32, uint32 (big-endian)
  | 'i<'
  | 'I<' // int32, uint32 (little-endian)
  | 'f' // float32 (big-endian)
  | 'f<' // float32 (little-endian)
  | 'd' // float64 (big-endian)
  | 'd<'; // float64 (little-endian)

/**
 * Parsed VISA resource string components
 */
export interface ParsedResourceString {
  /** Interface type */
  interfaceType: InterfaceType;
  /** Board/interface number (default: 0) */
  boardNumber: number;
  /** Resource class (INSTR, SOCKET, etc.) */
  resourceClass: string;
  /** Original resource string */
  resourceString: string;
}

/**
 * Parsed USB resource string
 */
export interface ParsedUSBResource extends ParsedResourceString {
  interfaceType: 'USB';
  /** USB Vendor ID */
  vendorId: number;
  /** USB Product ID */
  productId: number;
  /** Device serial number (optional) */
  serialNumber?: string;
}

/**
 * Parsed Serial (ASRL) resource string
 */
export interface ParsedSerialResource extends ParsedResourceString {
  interfaceType: 'ASRL';
  /** Serial port path */
  portPath: string;
}

/**
 * Parsed TCP/IP resource string (SOCKET type)
 */
export interface ParsedTCPIPSocketResource extends ParsedResourceString {
  interfaceType: 'TCPIP';
  resourceClass: 'SOCKET';
  /** Host address or hostname */
  host: string;
  /** TCP port number */
  port: number;
}

/**
 * Parsed TCP/IP resource string (INSTR type - VXI-11)
 */
export interface ParsedTCPIPInstrResource extends ParsedResourceString {
  interfaceType: 'TCPIP';
  resourceClass: 'INSTR';
  /** Host address or hostname */
  host: string;
  /** LAN device name (default: inst0) */
  lanDeviceName: string;
}

/**
 * Union of all parsed resource types
 */
export type ParsedResource =
  | ParsedUSBResource
  | ParsedSerialResource
  | ParsedTCPIPSocketResource
  | ParsedTCPIPInstrResource;
