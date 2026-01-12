# visa-ts

TypeScript VISA (Virtual Instrument Software Architecture) library for instrument communication.

A PyVISA-inspired library for controlling test and measurement instruments from Node.js/TypeScript.

## Features

- **PyVISA-compatible API** — Familiar patterns for lab automation developers
- **Multiple transports** — USB-TMC, Serial, TCP/IP (LXI)
- **TypeScript-first** — Full type safety and autocomplete
- **Result-based errors** — No exceptions, explicit error handling
- **SCPI utilities** — Parse responses, binary blocks, etc.

## Installation

```bash
npm install visa-ts
```

For USB-TMC support:
```bash
npm install visa-ts usb
```

For Serial support:
```bash
npm install visa-ts serialport
```

## Quick Start

```typescript
import { ResourceManager } from 'visa-ts';

// Create resource manager
const rm = new ResourceManager();

// List connected USB instruments
const resources = await rm.listResources('USB?*::INSTR');
console.log(resources);
// ['USB0::0x1AB1::0x04CE::DS1ZA123456789::INSTR']

// Open instrument
const instr = await rm.openResource('USB0::0x1AB1::0x04CE::DS1ZA123456789::INSTR');

// Configure
instr.timeout = 5000;

// Query device identity
const idn = await instr.query('*IDN?');
if (idn.ok) {
  console.log(idn.value);  // 'RIGOL TECHNOLOGIES,DS1054Z,...'
}

// Close
await instr.close();
await rm.close();
```

## Resource String Formats

| Type | Format | Example |
|------|--------|---------|
| USB-TMC | `USB[board]::vendor::product::serial::INSTR` | `USB0::0x1AB1::0x04CE::DS1ZA123456789::INSTR` |
| Serial | `ASRL[port]::INSTR` | `ASRL/dev/ttyUSB0::INSTR` |
| TCP/IP | `TCPIP[board]::host::port::SOCKET` | `TCPIP0::192.168.1.100::5025::SOCKET` |

## Discovery

```typescript
// USB - automatic enumeration
const usbDevices = await rm.listResources('USB?*::INSTR');

// Serial - lists available ports
const serialPorts = await rm.listResources('ASRL?*::INSTR');

// TCP/IP - manual (requires known IP)
const instr = await rm.openResource('TCPIP0::192.168.1.100::5025::SOCKET');
```

## API Reference

### ResourceManager

- `listResources(query?: string)` — List available instruments
- `openResource(resourceString, options?)` — Open connection to instrument
- `close()` — Close all connections

### MessageBasedResource

- `query(cmd)` — Write command and read response
- `queryBinaryValues(cmd, datatype?)` — Query binary data
- `write(cmd)` — Write command (no response)
- `read()` — Read response
- `clear()` — Clear device buffers
- `close()` — Close connection

### Attributes

- `timeout` — I/O timeout in milliseconds
- `readTermination` — Read termination character
- `writeTermination` — Write termination character

## Comparison to PyVISA

| PyVISA | visa-ts |
|--------|---------|
| `rm = pyvisa.ResourceManager()` | `rm = new ResourceManager()` |
| `rm.list_resources()` | `await rm.listResources()` |
| `instr = rm.open_resource(...)` | `instr = await rm.openResource(...)` |
| `instr.query('*IDN?')` | `await instr.query('*IDN?')` |
| `instr.timeout = 5000` | `instr.timeout = 5000` |

Key differences:
- All I/O operations are async (return Promises)
- Errors returned as `Result<T, Error>` instead of exceptions
- TypeScript provides full type safety

## License

MIT
