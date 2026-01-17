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
10. [Session Management](#session-management-optional)
11. [Circuit Simulation](#circuit-simulation)
12. [Driver Abstraction Layer](#driver-abstraction-layer)

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

// Unwrap helpers (never throw)
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

  /** Auto-detect baud rate by probing the device */
  autoBaud?: AutoBaudOptions;
}

interface AutoBaudOptions {
  /** Enable auto-baud detection (default: false) */
  enabled: boolean;

  /** Baud rates to try in order (default: [115200, 9600, 57600, 38400, 19200]) */
  baudRates?: number[];

  /** Command to send for probing (default: '*IDN?') */
  probeCommand?: string;

  /** Timeout for each probe attempt in ms (default: 500) */
  probeTimeout?: number;
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
interface ResourceManager {
  /**
   * List available resources matching a pattern.
   *
   * Searches across ALL available transports (USB, Serial, TCP/IP) and returns
   * resources matching the pattern.
   *
   * @param query - VISA resource pattern (default: '?*::INSTR')
   * @returns Array of resource strings
   *
   * @example
   * // List ALL instruments across all transports
   * await rm.listResources()
   * // ['USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
   * //  'ASRL/dev/ttyUSB0::INSTR',
   * //  'ASRL/dev/ttyUSB1::INSTR']
   *
   * // List only USB instruments
   * await rm.listResources('USB?*::INSTR')
   *
   * // List only serial ports
   * await rm.listResources('ASRL?*::INSTR')
   *
   * // TCP/IP requires known address - no auto-discovery
   * // Use openResource() directly with the IP
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

/**
 * Create a new ResourceManager.
 *
 * A single ResourceManager handles ALL transport types. The resource string
 * determines which transport is used when opening a connection.
 *
 * @example
 * const rm = createResourceManager();
 * const resources = await rm.listResources();
 */
function createResourceManager(): ResourceManager;
```

---

## MessageBasedResource

Represents an open connection to a message-based instrument (most SCPI devices).

```typescript
interface MessageBasedResource {
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
   * @param options - Query options
   * @returns Response string (termination stripped)
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
  // ASCII Values (comma/whitespace separated numbers)
  // ─────────────────────────────────────────────────────────────────

  /**
   * Query and parse ASCII numeric values.
   * @param command - Command string
   * @param options - Parse options
   * @returns Array of numbers
   *
   * @example
   * // Response: "1.23,4.56,7.89"
   * const values = await instr.queryAsciiValues(':DATA?');
   * // values.value = [1.23, 4.56, 7.89]
   *
   * // Custom separator
   * const values = await instr.queryAsciiValues(':DATA?', { separator: ';' });
   */
  queryAsciiValues(
    command: string,
    options?: AsciiValuesOptions
  ): Promise<Result<number[], Error>>;

  /**
   * Read and parse ASCII numeric values.
   */
  readAsciiValues(options?: AsciiValuesOptions): Promise<Result<number[], Error>>;

  /**
   * Write ASCII values to instrument.
   * @param command - Command prefix
   * @param values - Array of numbers to write
   * @param options - Format options
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
   * @param data - Bytes to write
   * @returns Number of bytes written
   */
  writeRaw(data: Buffer): Promise<Result<number, Error>>;

  /**
   * Read raw bytes from instrument (no termination handling).
   * @param size - Max bytes to read (default: chunkSize)
   */
  readRaw(size?: number): Promise<Result<Buffer, Error>>;

  /**
   * Read exact number of bytes from instrument.
   * @param count - Exact number of bytes to read
   */
  readBytes(count: number): Promise<Result<Buffer, Error>>;

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

// Note: MessageBasedResource instances are created internally by
// ResourceManager.openResource() - there is no public factory function.

interface QueryOptions {
  /** Delay in ms between write and read (some instruments need this) */
  delay?: number;
}

interface AsciiValuesOptions {
  /** Value separator (default: ',' - also handles whitespace) */
  separator?: string | RegExp;

  /** Custom converter function (default: parseFloat) */
  converter?: (s: string) => number;
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

// With auto-baud detection (tries common baud rates until one works)
const instr = await rm.openResource('ASRL/dev/ttyUSB0::INSTR', {
  transport: {
    autoBaud: {
      enabled: true,
      // Optional: custom baud rates to try (default: [115200, 9600, 57600, 38400, 19200])
      baudRates: [115200, 9600],
      // Optional: custom probe command (default: '*IDN?')
      probeCommand: '*IDN?',
    }
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

## Usage Examples

### Example 1: Query Instrument Identity (USB)

```typescript
import { createResourceManager } from 'visa-ts';

async function main() {
  const rm = createResourceManager();

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
import { createResourceManager } from 'visa-ts';

async function main() {
  const rm = createResourceManager();

  const result = await rm.openResource('ASRL/dev/ttyUSB0::INSTR', {
    timeout: 3000,
    transport: {
      baudRate: 115200,
      commandDelay: 50,
    }
  });

  if (!result.ok) {
    console.error('Failed to open PSU:', result.error);
    await rm.close();
    return;
  }
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
import { createResourceManager } from 'visa-ts';

async function main() {
  const rm = createResourceManager();

  const result = await rm.openResource(
    'USB0::0x1AB1::0x04CE::DS1ZA123456789::INSTR',
    { transport: { quirks: 'rigol' } }
  );

  if (!result.ok) {
    console.error('Failed to open scope:', result.error);
    await rm.close();
    return;
  }
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
import { createResourceManager } from 'visa-ts';

async function main() {
  const rm = createResourceManager();

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

### Example 5: Multiple Instruments Across Transports

A single ResourceManager handles USB, Serial, AND TCP/IP instruments simultaneously.

```typescript
import { createResourceManager } from 'visa-ts';

async function main() {
  // ONE ResourceManager for ALL transports
  const rm = createResourceManager();

  // Discover what's available (USB + Serial)
  const allResources = await rm.listResources();
  console.log('Found:', allResources);
  // ['USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
  //  'USB0::0x1AB1::0x0E11::DL3A456::INSTR',
  //  'ASRL/dev/ttyUSB0::INSTR']

  // Open instruments across different transports
  const [scopeResult, loadResult, psuResult, dmmResult] = await Promise.all([
    // USB-TMC oscilloscope
    rm.openResource('USB0::0x1AB1::0x04CE::DS1ZA123::INSTR', {
      transport: { quirks: 'rigol' }
    }),

    // USB-TMC electronic load
    rm.openResource('USB0::0x1AB1::0x0E11::DL3A456::INSTR'),

    // Serial power supply
    rm.openResource('ASRL/dev/ttyUSB0::INSTR', {
      transport: { baudRate: 115200, commandDelay: 50 }
    }),

    // TCP/IP multimeter (LXI) - no discovery, known IP
    rm.openResource('TCPIP0::192.168.1.50::5025::SOCKET'),
  ]);

  // Use them all together
  const scope = scopeResult.ok ? scopeResult.value : null;
  const load = loadResult.ok ? loadResult.value : null;
  const psu = psuResult.ok ? psuResult.value : null;
  const dmm = dmmResult.ok ? dmmResult.value : null;

  // Example: Automated test sequence using all instruments
  if (psu && load && dmm) {
    await psu.write(':SOUR:VOLT 12.0');
    await psu.write(':OUTP ON');

    await load.write(':SOUR:CURR 1.0');
    await load.write(':INP ON');

    const voltage = await dmm.query(':MEAS:VOLT:DC?');
    console.log('Measured voltage:', voltage.value);
  }

  // Close everything
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

// Pattern 2: Use unwrapOr for default values
import { unwrapOr } from 'visa-ts';
const voltage = unwrapOr(await instr.query(':MEAS:VOLT?'), '0.0');

// Pattern 3: Chain operations with map
import { map } from 'visa-ts';
const numericVoltage = map(
  await instr.query(':MEAS:VOLT?'),
  (s) => parseFloat(s)
);
```

### Error Messages

Errors are returned as standard `Error` objects with descriptive messages:

- Connection failures: `"Connection refused"`, `"Connection timeout after Xms"`
- Device not found: `"USB device not found: VID=0xXXXX, PID=0xXXXX"`
- I/O errors: `"Read timeout after Xms"`, `"Transport is not open"`
- Resource errors: `"Invalid resource string"`, `"Resource is already open in exclusive mode"`

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

### Instrument Wrapper Factory

```typescript
import { createResourceManager, MessageBasedResource, Result, Ok, Err, unwrapOr } from 'visa-ts';

interface Multimeter {
  measureVoltage(range?: 'AUTO' | number): Promise<Result<number, Error>>;
  measureCurrent(range?: 'AUTO' | number): Promise<Result<number, Error>>;
  close(): Promise<void>;
}

async function createMultimeter(resourceString: string): Promise<Result<Multimeter, Error>> {
  const rm = createResourceManager();
  const openResult = await rm.openResource(resourceString);

  if (!openResult.ok) {
    await rm.close();
    return Err(openResult.error);
  }
  const instr = openResult.value;

  return Ok({
    async measureVoltage(range: 'AUTO' | number = 'AUTO'): Promise<Result<number, Error>> {
      if (range !== 'AUTO') {
        const setResult = await instr.write(`:SENS:VOLT:DC:RANG ${range}`);
        if (!setResult.ok) return Err(setResult.error);
      }
      const result = await instr.query(':MEAS:VOLT:DC?');
      if (!result.ok) return Err(result.error);
      return Ok(parseFloat(result.value));
    },

    async measureCurrent(range: 'AUTO' | number = 'AUTO'): Promise<Result<number, Error>> {
      const result = await instr.query(':MEAS:CURR:DC?');
      if (!result.ok) return Err(result.error);
      return Ok(parseFloat(result.value));
    },

    async close(): Promise<void> {
      await instr.close();
      await rm.close();
    },
  });
}

// Usage
const dmmResult = await createMultimeter('USB0::0x1234::0x5678::SN123::INSTR');
if (dmmResult.ok) {
  const dmm = dmmResult.value;
  const voltage = await dmm.measureVoltage();
  if (voltage.ok) {
    console.log('Voltage:', voltage.value);
  }
  await dmm.close();
}
```

---

## Session Management (Optional)

An optional higher-level abstraction for applications that want managed connections with automatic reconnection, polling, and state tracking.

```typescript
import { createSessionManager } from 'visa-ts/sessions';
```

### SessionManager

```typescript
interface SessionManagerOptions {
  /** How often to scan for new/reconnected devices (ms, default: 5000) */
  scanInterval?: number;

  /** How often to poll device status (ms, default: 250) */
  pollInterval?: number;

  /** Max consecutive errors before marking disconnected (default: 5) */
  maxConsecutiveErrors?: number;

  /** Auto-reconnect on disconnect (default: true) */
  autoReconnect?: boolean;

  /**
   * Filter which devices to connect to. Can be:
   * - VISA pattern string: 'USB?*::INSTR', 'ASRL?*::INSTR'
   * - RegExp: /^USB.*0x1AB1/
   * - Function: (resourceString, info?) => boolean
   * - Array of patterns: ['USB?*::INSTR', 'TCPIP?*::INSTR']
   *
   * Default: undefined (connect to all discovered devices)
   */
  filter?: ResourceFilter;
}

type ResourceFilter =
  | string                                           // VISA pattern
  | RegExp                                           // RegExp match
  | ((resourceString: string, info?: ResourceInfo) => boolean)  // Custom function
  | string[];                                        // Array of VISA patterns

interface SessionManager {
  /** Start scanning and managing sessions */
  start(): Promise<void>;

  /** Stop all sessions and scanning */
  stop(): Promise<void>;

  /** Get all active sessions as a Map */
  readonly sessions: Map<string, DeviceSession>;

  /** Get session by resource string */
  getSession(resourceString: string): DeviceSession | undefined;

  /** Get all resource strings for active sessions */
  listSessions(): string[];

  /** Subscribe to session events */
  on(event: 'session-added', handler: (session: DeviceSession) => void): void;
  on(event: 'session-removed', handler: (resourceString: string) => void): void;
  on(event: 'session-state-changed', handler: (session: DeviceSession) => void): void;
}

function createSessionManager(options?: SessionManagerOptions): SessionManager;
```

### DeviceSession

```typescript
type SessionState = 'connecting' | 'connected' | 'polling' | 'disconnected' | 'error';

interface ExecuteOptions {
  /**
   * Max time (ms) for the entire operation (including any reconnect wait).
   * Default: 30000ms
   */
  timeout?: number;
}

interface DeviceSession {
  /** The underlying resource (null if disconnected) */
  readonly resource: MessageBasedResource | null;

  /** Resource string for this session */
  readonly resourceString: string;

  /** Current connection state */
  readonly state: SessionState;

  /** Last error if state is 'error' */
  readonly lastError: Error | null;

  /** Latest polled status (application-defined) */
  readonly status: unknown;

  /** Subscribe to status updates */
  onStatus(handler: (status: unknown) => void): () => void;

  /**
   * Execute a command (queued, handles reconnection).
   * @param fn - Function to execute with the resource
   * @param options - Execution options
   */
  execute<T>(
    fn: (resource: MessageBasedResource) => Promise<T>,
    options?: ExecuteOptions
  ): Promise<Result<T, Error>>;

  /** Manually trigger reconnection attempt */
  reconnect(): Promise<Result<void, Error>>;
}
```

### Example: Using Session Management

```typescript
import { createSessionManager } from 'visa-ts/sessions';

// Connect to ALL discovered devices
const manager = createSessionManager();

// Only USB devices
const usbOnly = createSessionManager({
  filter: 'USB?*::INSTR',
});

// Only Rigol devices (by vendor ID)
const rigolOnly = createSessionManager({
  filter: /^USB.*0x1AB1/,
});

// USB and TCP/IP, but not serial
const noSerial = createSessionManager({
  filter: ['USB?*::INSTR', 'TCPIP?*::SOCKET'],
});

// Custom logic - only devices with specific serial numbers
const specificDevices = createSessionManager({
  filter: (resourceString, info) => {
    const allowed = ['DS1ZA123', 'DL3A456'];
    return info?.serialNumber ? allowed.includes(info.serialNumber) : false;
  },
});

// Full options example
const manager = createSessionManager({
  scanInterval: 5000,
  pollInterval: 250,
  autoReconnect: true,
  filter: 'USB?*::INSTR',
});

// React to devices connecting/disconnecting
manager.on('session-added', (session) => {
  console.log('Device connected:', session.resourceString);

  session.onStatus((status) => {
    console.log('Status update:', status);
  });
});

manager.on('session-removed', (resourceString) => {
  console.log('Device disconnected:', resourceString);
});

// Start scanning
await manager.start();

// List all discovered sessions
const sessionIds = manager.listSessions();
console.log('Active sessions:', sessionIds);
// ['USB0::0x1AB1::0x04CE::DS1ZA123::INSTR', 'ASRL/dev/ttyUSB0::INSTR']

// Get a specific session
const session = manager.getSession('USB0::0x1AB1::0x04CE::DS1ZA123::INSTR');

// Or iterate all sessions
for (const [resourceString, session] of manager.sessions) {
  console.log(resourceString, session.state);
}

// Execute commands through session (handles disconnection gracefully)
if (session) {
  const result = await session.execute(async (resource) => {
    return resource.query(':MEAS:VOLT?');
  });
}

// Cleanup
await manager.stop();
```

### Design Notes

- **Optional import** — Core visa-ts has no session management, import from `visa-ts/sessions` if needed
- **Polling is application-defined** — Session provides the infrastructure, app defines what to poll
- **Queued execution** — `session.execute()` queues commands and handles reconnection
- **Event-based** — Subscribe to state changes instead of polling session state

---

## Circuit Simulation

Circuit simulation enables multiple simulated instruments to interact with realistic physics. For example, a simulated PSU can supply current to a simulated Load, with the PSU's measured current matching what the Load draws.

### Architecture: Pub/Sub Bus

Devices communicate through a shared **bus** using publish/subscribe. Each device owns its own physics and reacts to bus state changes.

```
┌─────────┐  publish   ┌─────────┐  publish   ┌─────────┐
│   PSU   │───────────►│   Bus   │◄───────────│  Load   │
│         │◄───────────│  V, I   │───────────►│         │
└─────────┘  subscribe └─────────┘  subscribe └─────────┘
```

### Core Types

```typescript
/** Electrical state on the bus */
interface BusState {
  voltage: number;
  current: number;
}

/** Bus for device communication */
interface Bus {
  state: BusState;
  publish(state: BusState): void;
  subscribe(callback: (state: BusState) => void): void;
}

/** Device with physics behavior */
interface BusParticipant {
  /** Compute device's desired bus state given current bus state */
  physics(bus: BusState): BusState;
}
```

### How Devices Connect

When a device connects to a bus, it subscribes to receive state changes and publishes its physics response:

```typescript
function connectToBus(device: BusParticipant, bus: Bus): void {
  device.bus = bus;

  bus.subscribe((busState) => {
    const myState = device.physics(busState);
    // Only publish if different (compare values, not references)
    if (myState.voltage !== busState.voltage || myState.current !== busState.current) {
      // Use setTimeout(0) to avoid reentrant publish during iteration
      setTimeout(() => bus.publish(myState), 0);
    }
  });
}
```

### How Device Setters Work

When a device's state changes via SCPI command, it publishes to the bus:

```typescript
set voltage(v: number) {
  this._voltage = v;
  if (this.bus) {
    this.bus.publish(this.physics(this.bus.state));
  }
}

set output(on: boolean) {
  this._output = on;
  if (this.bus) {
    this.bus.publish(this.physics(this.bus.state));
  }
}
```

### How Measurements Work

- **Setpoint queries** (`VOLT?`, `CURR?`) → return device state (what user set)
- **Measurement queries** (`MEAS:VOLT?`, `MEAS:CURR?`) → return bus state (physical reality)

```typescript
get measuredVoltage(): number {
  return this.bus?.state.voltage ?? this._voltage;
}

get measuredCurrent(): number {
  return this.bus?.state.current ?? this._current;
}
```

If no bus is connected, measurements fall back to device setpoints (standalone simulation behavior).

### Settlement

The bus handles settlement internally. When a device publishes, it triggers subscribers, who may publish back, until no device has changes. Devices don't know about settlement — they just publish and subscribe.

```typescript
function createBus(): Bus {
  let state: BusState = { voltage: 0, current: 0 };
  const subscribers: ((state: BusState) => void)[] = [];
  let settling = false;
  let iterations = 0;
  const maxIterations = 100;
  const epsilon = 1e-9;

  return {
    get state() { return state; },

    subscribe(callback) {
      subscribers.push(callback);
    },

    publish(newState) {
      // Close enough? No change needed (damping for convergence)
      if (Math.abs(newState.voltage - state.voltage) < epsilon &&
          Math.abs(newState.current - state.current) < epsilon) {
        return;
      }

      state = newState;

      if (settling) return; // Already in settlement loop

      settling = true;
      iterations = 0;

      while (iterations < maxIterations) {
        iterations++;
        const prevState = state;

        for (const subscriber of subscribers) {
          subscriber(state);
        }

        // If state didn't change, we've settled
        if (state === prevState) break;
      }

      settling = false;
    }
  };
}
```

### Initial State

First device to publish sets the bus state. Bus starts at `{ voltage: 0, current: 0 }`.

### Example: PSU Physics

```typescript
function physics(bus: BusState): BusState {
  if (!this.output) {
    return { voltage: 0, current: 0 };
  }

  // PSU is a voltage source with current limiting
  if (bus.current > this.currentLimit) {
    return { voltage: bus.voltage, current: this.currentLimit };
  }

  return { voltage: this.voltage, current: bus.current };
}
```

### Example: Load Physics

```typescript
function physics(bus: BusState): BusState {
  if (!this.input) {
    return { voltage: bus.voltage, current: 0 };
  }

  switch (this.mode) {
    case 'CC': // Constant current
      return { voltage: bus.voltage, current: this.current };
    case 'CR': // Constant resistance
      return { voltage: bus.voltage, current: bus.voltage / this.resistance };
    case 'CP': // Constant power
      return { voltage: bus.voltage, current: this.power / bus.voltage };
    default:
      return bus;
  }
}
```

### Example: PSU Current Limiting

```
1. PSU: output ON at 5V, 0.5A limit
   → publishes { voltage: 5, current: 0 }

2. Load: CC mode wants 1A, sees 5V
   → publishes { voltage: 5, current: 1 }

3. PSU: sees 1A > 0.5A limit
   → publishes { voltage: 5, current: 0.5 }

4. Load: still wants 1A but only 0.5A available
   → publishes { voltage: 5, current: 0.5 } (no change)

5. Settled — no more changes
```

### Usage Example

```typescript
import { createBus, createPsu, createLoad } from 'visa-ts';

const bus = createBus();
const psu = createPsu();
const load = createLoad();

// Connect devices to bus
psu.connectTo(bus);
load.connectTo(bus);

// Configure via SCPI (setters publish to bus automatically)
psu.write('VOLT 12');
psu.write('CURR 2');     // 2A current limit
psu.write('OUTP ON');

load.write('MODE CC');
load.write('CURR 1.5');  // Draw 1.5A
load.write('INP ON');

// Measurements reflect circuit physics
psu.query('MEAS:CURR?');   // "1.500"
load.query('MEAS:CURR?');  // "1.500"

// Load demands more than PSU can provide
load.write('CURR 5');      // Want 5A, but PSU limited to 2A
psu.query('MEAS:CURR?');   // "2.000" (PSU limiting)
```

### Device Behavior Summary

| Device | Physics Behavior |
|--------|------------------|
| PSU (on) | Sets voltage to setpoint, enforces current limit |
| PSU (off) | Returns { voltage: 0, current: 0 } |
| Load (CC) | Draws constant current at given voltage |
| Load (CR) | Draws I = V / R (Ohm's law) |
| Load (CP) | Draws I = P / V (constant power) |
| Load (off) | Returns { voltage: V, current: 0 } |

### Convergence

The bus uses epsilon comparison ("close enough") to handle floating-point precision and prevent oscillation. A max iteration limit (default 100) prevents infinite loops in pathological cases.

### Constraints

- **Single bus = single node**: This models a simple single-node circuit (PSU → Load). Multi-channel PSUs and complex topologies can be added later.
- **Don't connect two PSUs**: Just like real life, connecting two voltage sources to the same bus causes conflicts.

### Benefits

1. **Decoupled** — Each device only knows its own physics
2. **Extensible** — Add new device types by implementing `physics()`
3. **Testable** — Test each device's behavior in isolation
4. **Transparent** — Settlement happens automatically via pub/sub

---

## Exports Summary

```typescript
// Main entry point (visa-ts)
export { createResourceManager } from './resource-manager';
export type { ResourceManager } from './resource-manager';

// Resource layer
export { createMessageBasedResource } from './resources/message-based';
export type { MessageBasedResource } from './resources/message-based';

// Result type and helpers (never throw)
export { Ok, Err, isOk, isErr, unwrapOr, unwrapOrElse, map, mapErr } from './result';
export type { Result } from './result';

// Transport layer
export { createTcpipTransport, createSerialTransport, createUsbtmcTransport } from './transports';
export type { Transport, TransportState, TransportConfig, TransportFactory } from './transports/transport';
export type { TcpipTransportConfig } from './transports/tcpip';
export type { SerialTransportConfig } from './transports/serial';
export type { UsbtmcTransportConfig } from './transports/usbtmc';

// Session management (visa-ts/sessions) — optional
export { createSessionManager } from './sessions/session-manager';
export type {
  SessionManager,
  SessionManagerOptions,
  DeviceSession,
  SessionState,
  ResourceFilter,
  ExecuteOptions,
} from './sessions/types';

// Types
export type {
  InterfaceType,
  ResourceInfo,
  USBResourceInfo,
  SerialResourceInfo,
  TCPIPResourceInfo,
  OpenOptions,
  TransportOptions,
  USBTMCOptions,
  SerialOptions,
  TCPIPOptions,
  QueryOptions,
  AsciiValuesOptions,
  BinaryDatatype,
  ParsedResourceString,
  ParsedUSBResource,
  ParsedSerialResource,
  ParsedTCPIPSocketResource,
  ParsedTCPIPInstrResource,
  ParsedResource,
} from './types';

// Resource string parsing (for advanced use)
export { parseResourceString, buildResourceString, matchResourcePattern } from './resource-string';

// Serial probe utility (for standalone auto-baud detection)
export { probeSerialPort } from './util/serial-probe';
export type { SerialProbeOptions, SerialProbeResult } from './util/serial-probe';

// Driver abstraction layer
export { defineDriver } from './drivers/define-driver';
export type { DefinedDriver } from './drivers/define-driver';
export type {
  DriverSpec,
  DriverSettings,
  DriverHooks,
  DriverContext,
  PropertyDef,
  CommandDef,
  ChannelSpec,
} from './drivers/types';

// Base equipment interfaces
export type { PowerSupply, PowerSupplyChannel } from './drivers/equipment/power-supply';
export type { Oscilloscope, OscilloscopeChannel } from './drivers/equipment/oscilloscope';
export type { DigitalMultimeter, DMMFunction } from './drivers/equipment/dmm';
export type { BaseInstrument } from './drivers/equipment/base';

// Built-in drivers
export { rigolDS1054Z } from './drivers/implementations/rigol/ds1054z';
export { rigolDP832 } from './drivers/implementations/rigol/dp832';
export { keysight34465A } from './drivers/implementations/keysight/34465a';
```

---

## Driver Abstraction Layer

The driver abstraction layer provides a declarative way to define typed instrument drivers. Instead of writing repetitive SCPI command strings, you define a **specification** that describes properties, commands, and channels. The `defineDriver()` factory generates a fully-typed driver with automatic getter/setter methods.

### Why Use Drivers?

Raw SCPI communication works, but has issues:

```typescript
// Raw SCPI - error-prone, no type safety
await instr.write(':SOUR:VOLT 12.5');
const result = await instr.query(':SOUR:VOLT?');
const voltage = parseFloat(result.value); // Manual parsing every time
```

With drivers:

```typescript
// Typed driver - safe, discoverable, consistent
await psu.channel(1).setVoltage(12.5);
const voltage = await psu.channel(1).getVoltage();
// voltage is Result<number, Error> - already parsed
```

Benefits:
- **Type safety** — TypeScript catches errors at compile time
- **Discoverable** — IDE autocomplete shows available methods
- **Consistent** — All drivers follow the same patterns
- **Result-based** — All I/O returns `Result<T, Error>`, never throws

### Core Concept: DriverSpec

A driver is defined by a `DriverSpec` object that declares:

```typescript
interface DriverSpec<T, TChannel = never> {
  // Metadata (optional)
  type?: string;              // 'oscilloscope', 'power-supply', 'dmm'
  manufacturer?: string;      // 'Rigol', 'Keysight'
  models?: string[];          // ['DS1054Z', 'DS1104Z-Plus']

  // Properties become getXxx() and setXxx() methods
  properties: Record<string, PropertyDef<unknown>>;

  // Commands become methods that send SCPI commands
  commands?: Record<string, CommandDef>;

  // Channels for multi-channel instruments
  channels?: ChannelSpec<TChannel>;

  // Lifecycle hooks
  hooks?: DriverHooks;

  // Device-specific timing settings
  settings?: DriverSettings;

  // Custom method implementations
  methods?: Record<string, (ctx: DriverContext, ...args: unknown[]) => unknown>;
}
```

### Defining Properties

Properties automatically generate getter and setter methods. The property name is converted to `getPropertyName()` and `setPropertyName()`.

```typescript
const spec: DriverSpec = {
  properties: {
    // "voltage" becomes getVoltage() and setVoltage()
    voltage: {
      get: ':SOUR:VOLT?',           // Query command
      set: ':SOUR:VOLT {value}',    // Set command ({value} is replaced)
      parse: parseScpiNumber,        // Convert response string to number
      format: (v) => v.toFixed(3),  // Format value for command
      unit: 'V',                     // Documentation only
    },

    // Read-only property (no setter generated)
    measuredVoltage: {
      get: ':MEAS:VOLT?',
      parse: parseScpiNumber,
      readonly: true,
    },

    // Property with validation
    current: {
      get: ':SOUR:CURR?',
      set: ':SOUR:CURR {value}',
      parse: parseScpiNumber,
      validate: (v) => v >= 0 && v <= 10 ? true : 'Current must be 0-10A',
    },
  },
};
```

**PropertyDef fields:**

| Field | Type | Description |
|-------|------|-------------|
| `get` | `string` | SCPI query command |
| `set` | `string` | SCPI set command with `{value}` placeholder |
| `parse` | `(s: string) => T` | Convert response string to typed value |
| `format` | `(v: T) => string` | Format value for command string |
| `validate` | `(v: T) => true \| string` | Return `true` or error message |
| `readonly` | `boolean` | If true, no setter is generated |
| `unit` | `string` | Documentation only (V, A, Hz, etc.) |

### Defining Commands

Commands are methods that send SCPI commands without expecting a parsed response.

```typescript
const spec: DriverSpec = {
  commands: {
    // "run" becomes run() method
    run: { command: ':RUN' },

    // Command with delay after execution
    autoScale: {
      command: ':AUToscale',
      delay: 3000,  // Wait 3s for auto-scale to complete
    },

    // Command with description
    forceTrigger: {
      command: ':TFORce',
      description: 'Force a trigger event',
    },
  },
};
```

### Defining Channels

Multi-channel instruments use the `channels` spec. Channel properties use `{ch}` as a placeholder for the channel number.

```typescript
const spec: DriverSpec = {
  channels: {
    count: 4,        // Number of channels
    indexStart: 1,   // SCPI index for channel 1 (default: 1)

    properties: {
      // "scale" becomes channel(n).getScale() and channel(n).setScale()
      scale: {
        get: ':CHAN{ch}:SCAL?',      // {ch} replaced with channel index
        set: ':CHAN{ch}:SCAL {value}',
        parse: parseScpiNumber,
      },

      enabled: {
        get: ':CHAN{ch}:DISP?',
        set: ':CHAN{ch}:DISP {value}',
        parse: parseScpiBool,
        format: formatScpiBool,
      },
    },

    commands: {
      // Channel-specific commands
      calibrate: { command: ':CHAN{ch}:CAL' },
    },
  },
};
```

### Channel Type Safety with Literal Types

Channel numbers are validated at **compile time** using TypeScript literal types. This prevents runtime errors from invalid channel access.

```typescript
// In the device-specific interface:
export interface DS1054ZScope extends Oscilloscope {
  // Only channels 1-4 are valid - enforced by TypeScript
  channel(n: 1 | 2 | 3 | 4): DS1054ZChannel;
}

export interface DP832PSU extends PowerSupply {
  // Only channels 1-3 are valid
  channel(n: 1 | 2 | 3): DP832Channel;
}
```

Usage:

```typescript
const scope = scopeResult.value;

// Valid - compiles
const ch1 = scope.channel(1);
const ch4 = scope.channel(4);

// COMPILE ERROR - TypeScript catches this
const ch5 = scope.channel(5);  // Error: Argument of type '5' is not assignable to parameter of type '1 | 2 | 3 | 4'
```

**Important:** The base `Oscilloscope` interface uses `channel(n: number)` for flexibility, but device-specific interfaces (like `DS1054ZScope`) narrow this to literal types. Always use the device-specific interface for type safety.

### Driver Settings

Settings control device-specific timing and behavior:

```typescript
const spec: DriverSpec = {
  settings: {
    // Delay after write commands (some devices need settling time)
    postCommandDelay: 50,  // ms

    // Delay after query commands
    postQueryDelay: 20,    // ms

    // Reset device on connect
    resetOnConnect: false,

    // Clear status on connect
    clearOnConnect: true,

    // Delay after *RST command
    resetDelay: 2000,      // ms
  },
};
```

### Driver Hooks

Hooks allow custom logic at connection/disconnection:

```typescript
const spec: DriverSpec = {
  hooks: {
    // Called after *IDN? query succeeds
    onConnect: async (ctx) => {
      // Initialize device state
      await ctx.write(':SYST:REM');  // Set to remote mode
      return Ok(undefined);
    },

    // Called before resource.close()
    onDisconnect: async (ctx) => {
      await ctx.write(':SYST:LOC');  // Return to local mode
      return Ok(undefined);
    },
  },
};
```

For command/response transformations (e.g., for quirky devices), use middleware instead:

```typescript
import { withMiddleware, commandTransformMiddleware, responseTransformMiddleware } from 'visa-ts';

const wrappedResource = withMiddleware(resource, [
  commandTransformMiddleware((cmd) => cmd.toUpperCase()),
  responseTransformMiddleware((response) => response.trim()),
]);

const psu = await myDriver.connect(wrappedResource);
```

### Using defineDriver()

The `defineDriver()` function creates a driver from a specification:

```typescript
import { defineDriver } from 'visa-ts';

// Define the interface for type safety
interface MyPowerSupply {
  // Identity (provided automatically)
  readonly manufacturer: string;
  readonly model: string;
  readonly serialNumber: string;
  readonly firmwareVersion: string;

  // From properties
  getVoltage(): Promise<Result<number, Error>>;
  setVoltage(v: number): Promise<Result<void, Error>>;
  getCurrent(): Promise<Result<number, Error>>;
  setCurrent(v: number): Promise<Result<void, Error>>;
  getOutputEnabled(): Promise<Result<boolean, Error>>;
  setOutputEnabled(v: boolean): Promise<Result<void, Error>>;

  // Standard commands (provided automatically)
  reset(): Promise<Result<void, Error>>;
  clear(): Promise<Result<void, Error>>;
  close(): Promise<Result<void, Error>>;
}

const myPsuSpec: DriverSpec<MyPowerSupply> = {
  type: 'power-supply',
  manufacturer: 'Acme',
  models: ['PSU-100'],

  properties: {
    voltage: {
      get: ':VOLT?',
      set: ':VOLT {value}',
      parse: parseScpiNumber,
    },
    current: {
      get: ':CURR?',
      set: ':CURR {value}',
      parse: parseScpiNumber,
    },
    outputEnabled: {
      get: ':OUTP?',
      set: ':OUTP {value}',
      parse: parseScpiBool,
      format: formatScpiBool,
    },
  },
};

// Create the driver
export const myPsuDriver = defineDriver(myPsuSpec);
```

### Connecting to an Instrument

```typescript
import { createResourceManager } from 'visa-ts';
import { myPsuDriver } from './my-psu-driver';

async function main() {
  const rm = createResourceManager();

  // Open the raw resource
  const resourceResult = await rm.openResource('USB0::0x1234::0x5678::SN123::INSTR');
  if (!resourceResult.ok) {
    console.error('Failed to open:', resourceResult.error);
    return;
  }

  // Connect using the driver (queries *IDN?, runs hooks)
  const psuResult = await myPsuDriver.connect(resourceResult.value);
  if (!psuResult.ok) {
    console.error('Failed to connect driver:', psuResult.error);
    return;
  }

  const psu = psuResult.value;

  // Now use typed methods
  console.log(`Connected to: ${psu.manufacturer} ${psu.model}`);

  await psu.setVoltage(12.0);
  await psu.setCurrent(1.5);
  await psu.setOutputEnabled(true);

  const voltage = await psu.getVoltage();
  if (voltage.ok) {
    console.log(`Voltage setpoint: ${voltage.value} V`);
  }

  await psu.close();
  await rm.close();
}
```

### Base Equipment Interfaces

The library provides base interfaces for common instrument types. Device-specific drivers extend these.

#### BaseInstrument

All instruments provide:

```typescript
interface BaseInstrument {
  readonly manufacturer: string;
  readonly model: string;
  readonly serialNumber: string;
  readonly firmwareVersion: string;
  readonly resourceString: string;
  readonly resource: MessageBasedResource;  // Escape hatch for raw access

  reset(): Promise<Result<void, Error>>;
  clear(): Promise<Result<void, Error>>;
  selfTest(): Promise<Result<boolean, Error>>;
  getError(): Promise<Result<{ code: number; message: string } | null, Error>>;
  close(): Promise<Result<void, Error>>;
}
```

#### PowerSupply

```typescript
interface PowerSupplyChannel {
  readonly channelNumber: number;

  getVoltage(): Promise<Result<number, Error>>;
  setVoltage(v: number): Promise<Result<void, Error>>;
  getCurrent(): Promise<Result<number, Error>>;
  setCurrent(v: number): Promise<Result<void, Error>>;
  getOutputEnabled(): Promise<Result<boolean, Error>>;
  setOutputEnabled(v: boolean): Promise<Result<void, Error>>;
}

interface PowerSupply extends BaseInstrument {
  readonly channelCount: number;
  channel(n: number): PowerSupplyChannel;
}
```

#### Oscilloscope

```typescript
interface OscilloscopeChannel {
  readonly channelNumber: number;

  getEnabled(): Promise<Result<boolean, Error>>;
  setEnabled(on: boolean): Promise<Result<void, Error>>;
  getScale(): Promise<Result<number, Error>>;
  setScale(voltsPerDiv: number): Promise<Result<void, Error>>;
  getOffset(): Promise<Result<number, Error>>;
  setOffset(volts: number): Promise<Result<void, Error>>;
  getCoupling(): Promise<Result<Coupling, Error>>;
  setCoupling(coupling: Coupling): Promise<Result<void, Error>>;

  // Measurements
  getMeasuredFrequency(): Promise<Result<number, Error>>;
  getMeasuredPeriod(): Promise<Result<number, Error>>;
  getMeasuredVpp(): Promise<Result<number, Error>>;
  getMeasuredVmax(): Promise<Result<number, Error>>;
  getMeasuredVmin(): Promise<Result<number, Error>>;
  getMeasuredVavg(): Promise<Result<number, Error>>;
  getMeasuredVrms(): Promise<Result<number, Error>>;
}

interface Oscilloscope extends BaseInstrument {
  readonly channelCount: number;
  channel(n: number): OscilloscopeChannel;

  getTimebase(): Promise<Result<number, Error>>;
  setTimebase(secondsPerDiv: number): Promise<Result<void, Error>>;

  run(): Promise<Result<void, Error>>;
  stop(): Promise<Result<void, Error>>;
}
```

#### DigitalMultimeter

```typescript
type DMMFunction = 'VDC' | 'VAC' | 'IDC' | 'IAC' | 'RES' | 'FRES' | 'FREQ' | 'TEMP' | 'DIODE' | 'CONT';

interface DigitalMultimeter extends BaseInstrument {
  getFunction(): Promise<Result<DMMFunction, Error>>;
  setFunction(fn: DMMFunction): Promise<Result<void, Error>>;

  getMeasuredValue(): Promise<Result<number, Error>>;
  getRange(): Promise<Result<number | 'AUTO', Error>>;
  setRange(range: number | 'AUTO'): Promise<Result<void, Error>>;
}
```

### Complete Driver Example: Rigol DP832

```typescript
import { defineDriver } from '../../define-driver.js';
import { parseScpiNumber, parseScpiBool, formatScpiBool } from '../../parsers.js';
import type { DriverSpec } from '../../types.js';
import type { Result } from '../../../result.js';
import type { PowerSupply, PowerSupplyChannel, RegulationMode } from '../../equipment/power-supply.js';

// Device-specific channel interface
export interface DP832Channel extends PowerSupplyChannel {
  getMeasuredVoltage(): Promise<Result<number, Error>>;
  getMeasuredCurrent(): Promise<Result<number, Error>>;
  getMeasuredPower(): Promise<Result<number, Error>>;
  getMode(): Promise<Result<RegulationMode, Error>>;

  // Over-voltage protection
  getOvpEnabled(): Promise<Result<boolean, Error>>;
  setOvpEnabled(v: boolean): Promise<Result<void, Error>>;
  getOvpLevel(): Promise<Result<number, Error>>;
  setOvpLevel(v: number): Promise<Result<void, Error>>;
}

// Device-specific instrument interface with literal channel types
export interface DP832PSU extends PowerSupply {
  channel(n: 1 | 2 | 3): DP832Channel;  // Compile-time channel validation

  getAllOutputEnabled(): Promise<Result<boolean, Error>>;
  setAllOutputEnabled(v: boolean): Promise<Result<void, Error>>;
}

// Driver specification
const dp832Spec: DriverSpec<DP832PSU, DP832Channel> = {
  type: 'power-supply',
  manufacturer: 'Rigol',
  models: ['DP832', 'DP832A', 'DP831', 'DP831A'],

  properties: {
    allOutputEnabled: {
      get: ':OUTPut:ALL?',
      set: ':OUTPut:ALL {value}',
      parse: parseScpiBool,
      format: formatScpiBool,
    },
  },

  channels: {
    count: 3,
    indexStart: 1,
    properties: {
      voltage: {
        get: ':SOURce{ch}:VOLTage?',
        set: ':SOURce{ch}:VOLTage {value}',
        parse: parseScpiNumber,
        unit: 'V',
      },
      current: {
        get: ':SOURce{ch}:CURRent?',
        set: ':SOURce{ch}:CURRent {value}',
        parse: parseScpiNumber,
        unit: 'A',
      },
      outputEnabled: {
        get: ':OUTPut:STATe? CH{ch}',
        set: ':OUTPut:STATe CH{ch},{value}',
        parse: parseScpiBool,
        format: formatScpiBool,
      },
      measuredVoltage: {
        get: ':MEASure:VOLTage? CH{ch}',
        parse: parseScpiNumber,
        readonly: true,
        unit: 'V',
      },
      measuredCurrent: {
        get: ':MEASure:CURRent? CH{ch}',
        parse: parseScpiNumber,
        readonly: true,
        unit: 'A',
      },
      measuredPower: {
        get: ':MEASure:POWer? CH{ch}',
        parse: parseScpiNumber,
        readonly: true,
        unit: 'W',
      },
      mode: {
        get: ':OUTPut:MODE? CH{ch}',
        parse: parseRegulationMode,
        readonly: true,
      },
      ovpEnabled: {
        get: ':OUTPut:OVP? CH{ch}',
        set: ':OUTPut:OVP CH{ch},{value}',
        parse: parseScpiBool,
        format: formatScpiBool,
      },
      ovpLevel: {
        get: ':OUTPut:OVP:VALue? CH{ch}',
        set: ':OUTPut:OVP:VALue CH{ch},{value}',
        parse: parseScpiNumber,
        unit: 'V',
      },
    },
  },

  settings: {
    postCommandDelay: 50,
    resetDelay: 1000,
  },
};

// Export the driver
export const rigolDP832 = defineDriver(dp832Spec);
```

### Usage Example

```typescript
import { createResourceManager } from 'visa-ts';
import { rigolDP832 } from 'visa-ts/drivers/implementations/rigol/dp832';

async function main() {
  const rm = createResourceManager();

  const resources = await rm.listResources('USB*::INSTR');
  if (resources.length === 0) return;

  const resourceResult = await rm.openResource(resources[0]);
  if (!resourceResult.ok) return;

  const psuResult = await rigolDP832.connect(resourceResult.value);
  if (!psuResult.ok) return;

  const psu = psuResult.value;
  console.log(`Connected to: ${psu.manufacturer} ${psu.model}`);
  console.log(`Channels: ${psu.channelCount}`);

  // Configure channel 1 (compile-time validated)
  const ch1 = psu.channel(1);
  await ch1.setVoltage(5.0);
  await ch1.setCurrent(1.0);
  await ch1.setOutputEnabled(true);

  // Take measurements
  const voltage = await ch1.getMeasuredVoltage();
  const current = await ch1.getMeasuredCurrent();
  const power = await ch1.getMeasuredPower();
  const mode = await ch1.getMode();

  if (voltage.ok && current.ok && power.ok && mode.ok) {
    console.log(`CH1: ${voltage.value}V, ${current.value}A, ${power.value}W (${mode.value})`);
  }

  // Enable all outputs
  await psu.setAllOutputEnabled(true);

  // This would be a compile error:
  // const ch4 = psu.channel(4);  // Error: '4' not assignable to '1 | 2 | 3'

  await psu.close();
  await rm.close();
}
```

### Built-in Drivers

The library includes drivers for common instruments:

| Driver | Import | Instruments |
|--------|--------|-------------|
| `rigolDS1054Z` | `visa-ts/drivers/implementations/rigol/ds1054z` | DS1054Z, DS1104Z-Plus, DS1074Z |
| `rigolDP832` | `visa-ts/drivers/implementations/rigol/dp832` | DP832, DP832A, DP831, DP821, DP811 |
| `keysight34465A` | `visa-ts/drivers/implementations/keysight/34465a` | 34465A, 34460A, 34461A |

### Design Principles

1. **Declarative over imperative** — Define what properties exist, not how to get/set them
2. **Type safety** — Full TypeScript types, compile-time channel validation
3. **Result-based errors** — All I/O returns `Result<T, Error>`, never throws
4. **Extensible** — Base interfaces define common features, device-specific interfaces add more
5. **Escape hatch** — `instrument.resource` provides raw access when needed
6. **No magic** — Property names directly map to method names (`voltage` → `getVoltage()`)
