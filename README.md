# visa-ts

[![npm version](https://img.shields.io/npm/v/visa-ts)](https://www.npmjs.com/package/visa-ts)
[![Build Status](https://github.com/jvanderberg/visa-ts/actions/workflows/ci.yml/badge.svg)](https://github.com/jvanderberg/visa-ts/actions)
[![Coverage](https://img.shields.io/codecov/c/github/jvanderberg/visa-ts)](https://codecov.io/gh/jvanderberg/visa-ts)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

TypeScript VISA (Virtual Instrument Software Architecture) library for instrument communication.

A PyVISA-inspired library for controlling test and measurement instruments from Node.js/TypeScript.

## Features

- **PyVISA-compatible API** — Familiar patterns for lab automation developers
- **Multiple transports** — USB-TMC, Serial, TCP/IP (LXI)
- **Device simulation** — Test without hardware using simulated PSU, Load, and DMM
- **Circuit simulation** — Simulated devices interact with realistic physics
- **TypeScript-first** — Full type safety and autocomplete
- **Result-based errors** — No exceptions, explicit error handling
- **SCPI utilities** — Parse responses, binary blocks, etc.

## Installation

```bash
npm install visa-ts
```

This includes `serialport` and `usb` as dependencies for Serial and USB-TMC support.

## Quick Start

```typescript
import { createResourceManager } from 'visa-ts';

// Create resource manager
const rm = createResourceManager();

// List connected USB instruments
const resources = await rm.listResources('USB?*::INSTR');
console.log(resources);
// ['USB0::0x1AB1::0x04CE::DS1ZA123456789::INSTR']

// Open instrument
const result = await rm.openResource('USB0::0x1AB1::0x04CE::DS1ZA123456789::INSTR');
if (!result.ok) {
  console.error('Failed to open:', result.error);
  return;
}
const instr = result.value;

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

## Simulation

Test your instrument control code without physical hardware:

```typescript
import { createResourceManager, createSimulatedPsu } from 'visa-ts';

// Create resource manager and register a simulated PSU
const rm = createResourceManager();
rm.registerSimulatedDevice('PSU', createSimulatedPsu());

// Use it like real hardware
const result = await rm.openResource('SIM::PSU::INSTR');
if (result.ok) {
  const psu = result.value;
  await psu.write('VOLT 12.0');
  await psu.write('OUTP ON');
  const voltage = await psu.query('MEAS:VOLT?');
  console.log(voltage.value); // '12.000'
}
```

Available simulated devices: `createSimulatedPsu()`, `createSimulatedLoad()`, `createSimulatedDmm()`

When multiple simulated devices are connected, circuit simulation makes them interact realistically (e.g., PSU current limiting affects Load measurements).

## Comparison to PyVISA

| PyVISA | visa-ts |
|--------|---------|
| `rm = pyvisa.ResourceManager()` | `rm = createResourceManager()` |
| `rm.list_resources()` | `await rm.listResources()` |
| `instr = rm.open_resource(...)` | `result = await rm.openResource(...)` |
| `instr.query('*IDN?')` | `await instr.query('*IDN?')` |
| `instr.timeout = 5000` | `instr.timeout = 5000` |

Key differences:
- Factory functions instead of classes (`createResourceManager()` not `new ResourceManager()`)
- All I/O operations are async (return Promises)
- Errors returned as `Result<T, Error>` instead of exceptions
- TypeScript provides full type safety

## License

MIT
