# visa-ts API Design Document

This document defines the public API for visa-ts. It serves as the specification for implementation and a basis for evaluating the design.

## Table of Contents

1. [Core Types](#core-types)
2. [ResourceManager](#resourcemanager)
3. [MessageBasedResource](#messagebasedresource)
4. [Resource Strings](#resource-strings)
5. [Transport Configuration](#transport-configuration)
6. [SCPI Utilities](#scpi-utilities)
7. [Usage Examples](#usage-examples)
8. [Error Handling](#error-handling)
9. [Advanced Patterns](#advanced-patterns)

---

## Core Types

### Result Type

All I/O operations return `Result<T, E>` for explicit error handling without exceptions.

```typescript
// Result type - success or failure
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

// Constructor functions
function Ok<T>(value: T): Result<T, never>;
function Err<E>(error: E): Result<never, E>;

// Type guards
function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T };
function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E };

// Unwrap helpers
function unwrap<T>(result: Result<T, Error>): T;  // throws if Err
function unwrapOr<T>(result: Result<T, Error>, defaultValue: T): T;
function unwrapOrElse<T>(result: Result<T, Error>, fn: (error: Error) => T): T;

// Mapping
function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E>;
function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F>;
```

### Resource Information

```typescript
interface ResourceInfo {
  resourceString: string;      // Full VISA resource string
  interfaceType: InterfaceType;
  manufacturer?: string;       // From *IDN? if available
  model?: string;
  serialNumber?: string;
}

type InterfaceType = 'USB' | 'ASRL' | 'TCPIP' | 'GPIB';

interface USBResourceInfo extends ResourceInfo {
  interfaceType: 'USB';
  vendorId: number;
  productId: number;
  serialNumber?: string;
  usbClass: number;
}

interface SerialResourceInfo extends ResourceInfo {
  interfaceType: 'ASRL';
  portPath: string;
  baudRate?: number;
}

interface TCPIPResourceInfo extends ResourceInfo {
  interfaceType: 'TCPIP';
  host: string;
  port: number;
}
```

### Open Options

```typescript
interface OpenOptions {
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

type TransportOptions = USBTMCOptions | SerialOptions | TCPIPOptions;

interface USBTMCOptions {
  /** Enable quirk mode for non-compliant devices */
  quirks?: 'rigol' | 'none';
}

interface SerialOptions {
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
}

interface TCPIPOptions {
  /** Connection timeout in ms (default: 5000) */
  connectTimeout?: number;

  /** Enable TCP keepalive (default: true) */
  keepAlive?: boolean;

  /** Keepalive interval in ms (default: 10000) */
  keepAliveInterval?: number;
}
```

---

## ResourceManager

The main entry point for discovering and opening instrument connections.

```typescript
class ResourceManager {
  /**
   * Create a new ResourceManager.
   * @param visaLibrary - Optional backend selector ('@usb', '@serial', '@sim')
   */
  constructor(visaLibrary?: string);

  /**
   * List available resources matching a pattern.
   * @param query - VISA resource pattern (default: '?*::INSTR')
   * @returns Array of resource strings
   *
   * @example
   * // List all USB instruments
   * await rm.listResources('USB?*::INSTR')
   *
   * // List all resources
   * await rm.listResources()
   */
  listResources(query?: string): Promise<string[]>;

  /**
   * Get detailed information about available resources.
   * @param query - VISA resource pattern
   * @returns Array of ResourceInfo objects
   */
  listResourcesInfo(query?: string): Promise<ResourceInfo[]>;

  /**
   * Open a connection to an instrument.
   * @param resourceString - VISA resource string
   * @param options - Connection options
   * @returns MessageBasedResource for communication
   *
   * @example
   * const instr = await rm.openResource('USB0::0x1AB1::0x04CE::DS1ZA123456789::INSTR');
   */
  openResource(
    resourceString: string,
    options?: OpenOptions
  ): Promise<Result<MessageBasedResource, Error>>;

  /**
   * Close all open resources and release the resource manager.
   */
  close(): Promise<void>;

  /**
   * Get list of currently open resources.
   */
  readonly openResources: MessageBasedResource[];
}
```

---

## MessageBasedResource

Represents an open connection to a message-based instrument (most SCPI devices).

```typescript
class MessageBasedResource {
  /** The VISA resource string for this connection */
  readonly resourceString: string;

  /** Information about this resource */
  readonly resourceInfo: ResourceInfo;

  // ─────────────────────────────────────────────────────────────────
  // Attributes (PyVISA-compatible)
  // ─────────────────────────────────────────────────────────────────

  /** I/O timeout in milliseconds */
  timeout: number;

  /** Character(s) appended to each write */
  writeTermination: string;

  /** Character(s) that terminate a read */
  readTermination: string;

  /** Size of read buffer in bytes (default: 65536) */
  chunkSize: number;

  // ─────────────────────────────────────────────────────────────────
  // Basic I/O
  // ─────────────────────────────────────────────────────────────────

  /**
   * Write a command and read the response.
   * @param command - Command string (termination added automatically)
   * @returns Response string (termination stripped)
   *
   * @example
   * const idn = await instr.query('*IDN?');
   * if (idn.ok) console.log(idn.value);
   */
  query(command: string): Promise<Result<string, Error>>;

  /**
   * Write a command (no response expected).
   * @param command - Command string
   *
   * @example
   * await instr.write('*RST');
   */
  write(command: string): Promise<Result<void, Error>>;

  /**
   * Read response from instrument.
   * @returns Response string
   */
  read(): Promise<Result<string, Error>>;

  // ─────────────────────────────────────────────────────────────────
  // Binary I/O
  // ─────────────────────────────────────────────────────────────────

  /**
   * Query and parse binary response as typed array.
   * @param command - Command string
   * @param datatype - Data type specifier
   * @param container - Return type ('array' for number[], 'buffer' for Buffer)
   *
   * Datatype specifiers (IEEE 488.2):
   *   'b' - signed 8-bit integer
   *   'B' - unsigned 8-bit integer
   *   'h' - signed 16-bit integer (big-endian)
   *   'H' - unsigned 16-bit integer (big-endian)
   *   'i' - signed 32-bit integer (big-endian)
   *   'I' - unsigned 32-bit integer (big-endian)
   *   'f' - 32-bit float (big-endian)
   *   'd' - 64-bit double (big-endian)
   *
   * Append '<' for little-endian: 'h<', 'f<', etc.
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

  queryBinaryValues(
    command: string,
    datatype: BinaryDatatype,
    container: 'buffer'
  ): Promise<Result<Buffer, Error>>;

  /**
   * Write binary values to instrument.
   * @param command - Command prefix
   * @param values - Array of values to write
   * @param datatype - Data type specifier
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
   * @param command - Command string
   * @returns Raw buffer with IEEE 488.2 header stripped
   */
  queryBinary(command: string): Promise<Result<Buffer, Error>>;

  /**
   * Read raw binary data.
   */
  readBinary(): Promise<Result<Buffer, Error>>;

  // ─────────────────────────────────────────────────────────────────
  // Control
  // ─────────────────────────────────────────────────────────────────

  /**
   * Clear the instrument's input/output buffers.
   */
  clear(): Promise<Result<void, Error>>;

  /**
   * Send a device trigger.
   */
  trigger(): Promise<Result<void, Error>>;

  /**
   * Read the Status Byte Register.
   */
  readStb(): Promise<Result<number, Error>>;

  /**
   * Close this resource connection.
   */
  close(): Promise<Result<void, Error>>;

  /**
   * Check if the connection is open.
   */
  readonly isOpen: boolean;
}

type BinaryDatatype =
  | 'b' | 'B'           // int8, uint8
  | 'h' | 'H'           // int16, uint16 (big-endian)
  | 'h<' | 'H<'         // int16, uint16 (little-endian)
  | 'i' | 'I'           // int32, uint32 (big-endian)
  | 'i<' | 'I<'         // int32, uint32 (little-endian)
  | 'f' | 'f<'          // float32
  | 'd' | 'd<';         // float64
```

---

## Resource Strings

VISA resource strings follow standard formats for addressing instruments.

### USB-TMC

```
USB[board]::manufacturerID::modelCode::[serialNumber]::INSTR

Examples:
  USB0::0x1AB1::0x04CE::DS1ZA123456789::INSTR   # Rigol oscilloscope
  USB0::0x1AB1::0x0E11::DL3A123456789::INSTR    # Rigol electronic load
  USB::0x1AB1::0x04CE::INSTR                     # Any Rigol scope (no serial)
```

### Serial (ASRL)

```
ASRL<port>::INSTR

Examples:
  ASRL/dev/ttyUSB0::INSTR          # Linux USB-serial
  ASRL/dev/tty.usbserial::INSTR    # macOS USB-serial
  ASRLCOM3::INSTR                   # Windows COM port
  ASRL3::INSTR                      # Windows COM3 (shorthand)
```

### TCP/IP Socket

```
TCPIP[board]::host::port::SOCKET

Examples:
  TCPIP0::192.168.1.100::5025::SOCKET    # IP address, SCPI port
  TCPIP::scope.local::5025::SOCKET       # Hostname
  TCPIP::10.0.0.50::5555::SOCKET         # Custom port
```

### TCP/IP VXI-11 (Future)

```
TCPIP[board]::host[::LAN device name]::INSTR

Examples:
  TCPIP0::192.168.1.100::INSTR           # Default LAN device
  TCPIP0::192.168.1.100::inst0::INSTR    # Specific LAN device
```

### Pattern Matching

The `listResources()` method supports patterns:

| Pattern | Meaning |
|---------|---------|
| `?` | Match any single character |
| `*` | Match zero or more characters |
| `[abc]` | Match any character in set |
| `[!abc]` | Match any character not in set |

```typescript
// All USB instruments
await rm.listResources('USB?*::INSTR');

// All Rigol USB devices
await rm.listResources('USB?*::0x1AB1::?*::INSTR');

// All serial ports
await rm.listResources('ASRL?*::INSTR');

// Everything
await rm.listResources('?*::INSTR');
```

---

## Transport Configuration

### USB-TMC Transport

```typescript
// Standard USB-TMC device
const instr = await rm.openResource('USB0::0x1AB1::0x04CE::DS1ZA123456789::INSTR');

// With Rigol quirk mode (for DS1000Z series binary transfers)
const instr = await rm.openResource('USB0::0x1AB1::0x04CE::DS1ZA123456789::INSTR', {
  transport: { quirks: 'rigol' }
});
```

### Serial Transport

```typescript
// Basic serial connection (auto-detect settings from resource manager)
const instr = await rm.openResource('ASRL/dev/ttyUSB0::INSTR');

// With explicit serial settings
const instr = await rm.openResource('ASRL/dev/ttyUSB0::INSTR', {
  timeout: 5000,
  transport: {
    baudRate: 115200,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    commandDelay: 50,  // ms delay between commands
  }
});
```

### TCP/IP Transport

```typescript
// Basic TCP connection
const instr = await rm.openResource('TCPIP0::192.168.1.100::5025::SOCKET');

// With connection options
const instr = await rm.openResource('TCPIP0::192.168.1.100::5025::SOCKET', {
  timeout: 10000,
  transport: {
    connectTimeout: 5000,
    keepAlive: true,
    keepAliveInterval: 30000,
  }
});
```

---

## SCPI Utilities

Optional helpers for parsing SCPI responses.

```typescript
import { ScpiParser } from 'visa-ts';

// Parse numeric response
ScpiParser.parseNumber('1.234E+03');        // 1234
ScpiParser.parseNumber('9.9E37');           // Infinity (overflow)
ScpiParser.parseNumber('****');             // NaN (invalid)

// Parse boolean response
ScpiParser.parseBool('1');                  // true
ScpiParser.parseBool('ON');                 // true
ScpiParser.parseBool('0');                  // false
ScpiParser.parseBool('OFF');                // false

// Parse enumerated response
const modes = { 'VOLT': 'voltage', 'CURR': 'current', 'RES': 'resistance' };
ScpiParser.parseEnum('VOLT', modes);        // 'voltage'

// Parse IEEE 488.2 definite length block header
// Format: #<numDigits><byteCount><data>
// Example: #9000001200<1200 bytes of data>
ScpiParser.parseDefiniteLengthBlock(buffer);  // { header: 12, length: 1200 }

// Parse arbitrary block (indefinite length)
// Format: #0<data>\n
ScpiParser.parseArbitraryBlock(buffer);
```

---

## Usage Examples

### Example 1: Query Instrument Identity (USB)

```typescript
import { ResourceManager, unwrap } from 'visa-ts';

async function main() {
  const rm = new ResourceManager();

  // Find USB instruments
  const resources = await rm.listResources('USB?*::INSTR');
  console.log('Found:', resources);

  if (resources.length === 0) {
    console.log('No instruments found');
    return;
  }

  // Open first instrument
  const result = await rm.openResource(resources[0]);
  if (!result.ok) {
    console.error('Failed to open:', result.error);
    return;
  }

  const instr = result.value;
  instr.timeout = 5000;

  // Query identity
  const idn = await instr.query('*IDN?');
  if (idn.ok) {
    console.log('Identity:', idn.value);
  }

  // Close
  await instr.close();
  await rm.close();
}
```

### Example 2: Power Supply Control (Serial)

```typescript
import { ResourceManager } from 'visa-ts';

async function main() {
  const rm = new ResourceManager();

  const result = await rm.openResource('ASRL/dev/ttyUSB0::INSTR', {
    timeout: 3000,
    transport: {
      baudRate: 115200,
      commandDelay: 50,
    }
  });

  if (!result.ok) throw result.error;
  const psu = result.value;

  // Set voltage and current limits
  await psu.write(':SOUR:VOLT 12.0');
  await psu.write(':SOUR:CURR 1.5');

  // Enable output
  await psu.write(':OUTP ON');

  // Read actual values
  const voltage = await psu.query(':MEAS:VOLT?');
  const current = await psu.query(':MEAS:CURR?');

  console.log(`Output: ${voltage.ok ? voltage.value : '?'}V, ${current.ok ? current.value : '?'}A`);

  // Disable output
  await psu.write(':OUTP OFF');

  await psu.close();
  await rm.close();
}
```

### Example 3: Oscilloscope Waveform Capture (USB with Binary)

```typescript
import { ResourceManager, ScpiParser } from 'visa-ts';

async function main() {
  const rm = new ResourceManager();

  const result = await rm.openResource(
    'USB0::0x1AB1::0x04CE::DS1ZA123456789::INSTR',
    { transport: { quirks: 'rigol' } }
  );

  if (!result.ok) throw result.error;
  const scope = result.value;
  scope.timeout = 10000;

  // Configure acquisition
  await scope.write(':WAV:SOUR CHAN1');
  await scope.write(':WAV:MODE RAW');
  await scope.write(':WAV:FORM BYTE');

  // Get waveform preamble
  const preamble = await scope.query(':WAV:PRE?');
  console.log('Preamble:', preamble.value);

  // Get waveform data as unsigned bytes
  const waveform = await scope.queryBinaryValues(':WAV:DATA?', 'B');

  if (waveform.ok) {
    console.log(`Captured ${waveform.value.length} samples`);
    console.log('First 10:', waveform.value.slice(0, 10));
  }

  await scope.close();
  await rm.close();
}
```

### Example 4: Network Instrument (TCP/IP LXI)

```typescript
import { ResourceManager } from 'visa-ts';

async function main() {
  const rm = new ResourceManager();

  // Connect to instrument at known IP
  const result = await rm.openResource('TCPIP0::192.168.1.100::5025::SOCKET', {
    timeout: 5000,
    transport: {
      connectTimeout: 3000,
      keepAlive: true,
    }
  });

  if (!result.ok) {
    console.error('Connection failed:', result.error);
    return;
  }

  const instr = result.value;

  // Standard SCPI commands work the same way
  const idn = await instr.query('*IDN?');
  console.log('Connected to:', idn.ok ? idn.value : 'unknown');

  // Perform measurement
  const measurement = await instr.query(':MEAS:VOLT:DC?');
  console.log('Voltage:', measurement.ok ? measurement.value : 'error');

  await instr.close();
  await rm.close();
}
```

### Example 5: Multiple Instruments

```typescript
import { ResourceManager } from 'visa-ts';

async function main() {
  const rm = new ResourceManager();

  // Open multiple instruments
  const [psuResult, loadResult] = await Promise.all([
    rm.openResource('USB0::0x1AB1::0x0E11::DL3A123456789::INSTR'),
    rm.openResource('ASRL/dev/ttyUSB0::INSTR', {
      transport: { baudRate: 115200 }
    }),
  ]);

  if (!psuResult.ok || !loadResult.ok) {
    console.error('Failed to open instruments');
    await rm.close();
    return;
  }

  const psu = psuResult.value;
  const load = loadResult.value;

  // Configure both
  await psu.write(':SOUR:VOLT 24.0');
  await psu.write(':OUTP ON');

  await load.write(':SOUR:CURR 0.5');
  await load.write(':INP ON');

  // Measure
  const psuVoltage = await psu.query(':MEAS:VOLT?');
  const loadCurrent = await load.query(':MEAS:CURR?');

  console.log(`PSU: ${psuVoltage.value}V, Load: ${loadCurrent.value}A`);

  // Cleanup - rm.close() closes all open resources
  await rm.close();
}
```

---

## Error Handling

### Using Result Type

```typescript
// Pattern 1: Check ok property
const result = await instr.query('*IDN?');
if (result.ok) {
  console.log(result.value);
} else {
  console.error('Query failed:', result.error.message);
}

// Pattern 2: Use unwrap (throws on error)
import { unwrap } from 'visa-ts';
const idn = unwrap(await instr.query('*IDN?'));

// Pattern 3: Use unwrapOr for default values
import { unwrapOr } from 'visa-ts';
const voltage = unwrapOr(await instr.query(':MEAS:VOLT?'), '0.0');

// Pattern 4: Chain operations with map
import { map } from 'visa-ts';
const numericVoltage = map(
  await instr.query(':MEAS:VOLT?'),
  (s) => parseFloat(s)
);
```

### Common Error Types

```typescript
// Connection errors
interface ConnectionError extends Error {
  code: 'CONNECTION_FAILED' | 'CONNECTION_TIMEOUT' | 'DEVICE_NOT_FOUND';
}

// I/O errors
interface IOError extends Error {
  code: 'TIMEOUT' | 'DEVICE_DISCONNECTED' | 'TRANSFER_ERROR';
}

// Resource errors
interface ResourceError extends Error {
  code: 'INVALID_RESOURCE_STRING' | 'RESOURCE_BUSY' | 'RESOURCE_NOT_FOUND';
}
```

---

## Advanced Patterns

### Custom Timeout Per Operation

```typescript
// Set default timeout
instr.timeout = 2000;

// Override for slow operations by temporarily changing it
const originalTimeout = instr.timeout;
instr.timeout = 30000;
const slowResult = await instr.query(':CALC:DATA?');
instr.timeout = originalTimeout;
```

### Retry Logic

```typescript
async function queryWithRetry(
  instr: MessageBasedResource,
  command: string,
  maxRetries = 3
): Promise<Result<string, Error>> {
  for (let i = 0; i < maxRetries; i++) {
    const result = await instr.query(command);
    if (result.ok) return result;

    // Clear and retry on failure
    await instr.clear();
    await new Promise(r => setTimeout(r, 100));
  }
  return Err(new Error(`Query failed after ${maxRetries} retries`));
}
```

### Instrument Wrapper Class

```typescript
import { ResourceManager, MessageBasedResource, unwrap } from 'visa-ts';

class Multimeter {
  constructor(private instr: MessageBasedResource) {}

  static async connect(resourceString: string): Promise<Multimeter> {
    const rm = new ResourceManager();
    const instr = unwrap(await rm.openResource(resourceString));
    return new Multimeter(instr);
  }

  async measureVoltage(range: 'AUTO' | number = 'AUTO'): Promise<number> {
    if (range !== 'AUTO') {
      await this.instr.write(`:SENS:VOLT:DC:RANG ${range}`);
    }
    const result = unwrap(await this.instr.query(':MEAS:VOLT:DC?'));
    return parseFloat(result);
  }

  async measureCurrent(range: 'AUTO' | number = 'AUTO'): Promise<number> {
    const result = unwrap(await this.instr.query(':MEAS:CURR:DC?'));
    return parseFloat(result);
  }

  async close(): Promise<void> {
    await this.instr.close();
  }
}

// Usage
const dmm = await Multimeter.connect('USB0::0x1234::0x5678::SN123::INSTR');
console.log('Voltage:', await dmm.measureVoltage());
await dmm.close();
```

---

## Exports Summary

```typescript
// Main entry point
export { ResourceManager } from './resource-manager';
export { MessageBasedResource } from './resources/message-based';

// Result type and helpers
export { Result, Ok, Err, isOk, isErr, unwrap, unwrapOr, unwrapOrElse, map, mapErr } from './result';

// Types
export type {
  ResourceInfo,
  USBResourceInfo,
  SerialResourceInfo,
  TCPIPResourceInfo,
  OpenOptions,
  TransportOptions,
  USBTMCOptions,
  SerialOptions,
  TCPIPOptions,
  BinaryDatatype,
  InterfaceType,
} from './types';

// Utilities
export { ScpiParser } from './util/scpi-parser';

// Resource string parsing (for advanced use)
export { parseResourceString, buildResourceString } from './resource-string';
```
