# Plan: visa-ts Implementation

## Overview

A standalone, reusable npm package implementing the VISA (Virtual Instrument Software Architecture) standard, similar to PyVISA for Python.

## Goals

1. Create a standalone npm package with zero application-specific dependencies
2. Maintain PyVISA-like API patterns for familiarity
3. Support USB-TMC, Serial, and TCP/IP (LXI) transports
4. Enable easy addition of new transports (GPIB, etc.)
5. Provide TypeScript-first experience with full type safety

## Package Structure

```
visa-ts/
├── package.json
├── tsconfig.json
├── README.md
├── CLAUDE.md
├── CONTRIBUTING.md
├── PLAN.md
├── src/
│   ├── index.ts                    # Public API exports
│   ├── types.ts                    # Core interfaces
│   ├── result.ts                   # Result<T,E> type
│   ├── resource-manager.ts         # ResourceManager (PyVISA equivalent)
│   ├── resource-string.ts          # VISA resource string parser
│   ├── resources/
│   │   ├── message-based.ts        # MessageBasedResource interface + factory
│   │   └── register-based.ts       # RegisterBasedResource (stub for future)
│   ├── transports/
│   │   ├── transport.ts            # Transport interface
│   │   ├── usbtmc.ts               # USB-TMC implementation
│   │   ├── serial.ts               # Serial implementation
│   │   └── tcpip.ts                # TCP/IP socket (LXI)
│   ├── util/
│   │   └── scpi-parser.ts          # SCPI response parsing
│   └── sessions/                    # Optional session management
│       ├── index.ts                 # Session exports
│       ├── types.ts                 # Session interfaces
│       ├── session-manager.ts       # SessionManager factory
│       └── device-session.ts        # DeviceSession factory
└── test/
    ├── resource-string.test.ts
    ├── usbtmc.test.ts
    └── serial.test.ts
```

## Implementation Phases

### Phase 1: Core Infrastructure (Foundation)

**Files to create:**

1. **`src/types.ts`** - Core interfaces
   - `Resource` interface (open, close, query, write, read)
   - `ResourceManager` interface
   - `TransportFactory` type
   - `ResourceInfo` type
   - Configuration types

2. **`src/result.ts`** - Error handling
   - `Result<T,E>`, `Ok()`, `Err()` types
   - Helper functions: `isOk()`, `isErr()`, `unwrap()`, `unwrapOr()`

3. **`src/resource-string.ts`** - VISA resource string support
   - Parse: `"USB0::0x1AB1::0x04CE::DS1ZA123456789::INSTR"` → structured object
   - Generate: structured object → resource string
   - Pattern matching for `list_resources()` queries (e.g., `"USB?*::INSTR"`)
   - Support USB, Serial (ASRL), TCPIP formats

**Source from signal-drift:**
- `shared/types.ts` → `Result`, `Ok`, `Err`

---

### Phase 2: Transport Layer

**Files to create:**

1. **`src/transports/transport.ts`** - Transport interface
   ```typescript
   interface Transport {
     open(): Promise<Result<void, Error>>;
     close(): Promise<Result<void, Error>>;
     query(cmd: string, timeout?: number): Promise<Result<string, Error>>;
     queryBinary(cmd: string, timeout?: number): Promise<Result<Buffer, Error>>;
     write(cmd: string): Promise<Result<void, Error>>;
     read(timeout?: number): Promise<Result<string, Error>>;
     readBinary(timeout?: number): Promise<Result<Buffer, Error>>;
     clear(): Promise<Result<void, Error>>;
     isOpen(): boolean;
   }
   ```

2. **`src/transports/usbtmc.ts`** - USB-TMC transport
   - Copy from `signal-drift/server/devices/transports/usbtmc.ts`
   - Remove application-specific logging
   - Add configurable quirk modes (not just Rigol)
   - Export helper functions for device enumeration

3. **`src/transports/serial.ts`** - Serial transport
   - Copy from `signal-drift/server/devices/transports/serial.ts`
   - Add auto-baud detection as option
   - Support different line endings (CR, LF, CRLF)

4. **`src/transports/tcpip.ts`** - TCP/IP socket transport (LXI)
   - Raw socket connection (port 5025 is standard for SCPI)
   - Line-based protocol with configurable termination
   - Connection timeout and keepalive options
   - No discovery - requires explicit IP/hostname

**Source from signal-drift:**
- `server/devices/transports/usbtmc.ts` → USB-TMC implementation
- `server/devices/transports/serial.ts` → Serial implementation
- `server/devices/types.ts:18-31` → Transport interface
- (new) TCP socket transport

---

### Phase 3: Resource Classes

**Files to create:**

1. **`src/resources/message-based.ts`** - MessageBasedResource interface and factory
   ```typescript
   interface MessageBasedResource {
     readonly resourceString: string;
     timeout: number;
     readTermination: string;
     writeTermination: string;

     query(cmd: string): Promise<Result<string, Error>>;
     queryBinaryValues(cmd: string, datatype?: string): Promise<Result<number[], Error>>;
     write(cmd: string): Promise<Result<void, Error>>;
     read(): Promise<Result<string, Error>>;
     readBinaryValues(datatype?: string): Promise<Result<number[], Error>>;
     clear(): Promise<Result<void, Error>>;
     close(): Promise<Result<void, Error>>;
   }

   // Internal factory - called by ResourceManager
   function createMessageBasedResource(transport: Transport, resourceString: string): MessageBasedResource;
   ```

2. **`src/resources/register-based.ts`** - RegisterBasedResource (stub for future)
   - Placeholder for VXI/PXI register-based instruments

**New code required:**
- Binary value encoding/decoding (IEEE 488.2 format)

---

### Phase 4: ResourceManager

**Files to create:**

1. **`src/resource-manager.ts`** - Main entry point
   ```typescript
   interface ResourceManager {
     // Discovery (searches all transports)
     listResources(query?: string): Promise<string[]>;

     // Connection (transport determined by resource string)
     openResource(resourceString: string, options?: OpenOptions): Promise<Result<MessageBasedResource, Error>>;

     // Lifecycle
     close(): Promise<void>;

     // Currently open resources
     readonly openResources: MessageBasedResource[];
   }

   function createResourceManager(): ResourceManager;
   ```

**Source from signal-drift:**
- `server/devices/registry.ts` → Device registration pattern
- `server/devices/scanner.ts` → Device discovery logic

**Discovery Model:**

| Transport | Discovery | Notes |
|-----------|-----------|-------|
| USB-TMC | Automatic | Enumerate all USB devices, filter by class/vendor |
| Serial | Semi-auto | List ports, probe with `*IDN?` |
| TCP/IP | Manual | User provides IP/hostname (no broadcast discovery) |

```typescript
// USB - fully automatic
const usbDevices = await rm.listResources('USB?*::INSTR');

// Serial - lists available ports, user picks
const serialPorts = await rm.listResources('ASRL?*::INSTR');

// TCP/IP - user must know the address
const instr = await rm.openResource('TCPIP0::192.168.1.100::5025::SOCKET');

// Future: mDNS/DNS-SD discovery for LXI devices
const lxiDevices = await rm.listResources('TCPIP?*::INSTR');  // Optional enhancement
```

---

### Phase 5: SCPI Utilities

**Files to create:**

1. **`src/util/scpi-parser.ts`** - SCPI response parsing
   - `parseNumber()` - Handle scientific notation, overflow markers
   - `parseBool()` - Handle 0/1, ON/OFF, TRUE/FALSE
   - `parseEnum()` - Map string responses to enums
   - `parseDefiniteLengthBlock()` - IEEE 488.2 `#NXXX...` format
   - `parseArbitraryBlock()` - IEEE 488.2 `#0...` format

**Source from signal-drift:**
- `server/devices/scpi-parser.ts` → Copy directly with minor cleanup

---

### Phase 6: Package Configuration & Documentation

**Files to create:**

1. **`package.json`**
   ```json
   {
     "name": "visa-ts",
     "version": "0.1.0",
     "description": "TypeScript VISA library for instrument communication",
     "main": "dist/index.js",
     "types": "dist/index.d.ts",
     "exports": {
       ".": "./dist/index.js",
       "./sessions": "./dist/sessions/index.js",
       "./transports/usbtmc": "./dist/transports/usbtmc.js",
       "./transports/serial": "./dist/transports/serial.js"
     },
     "peerDependencies": {
       "usb": "^2.9.0",
       "serialport": "^12.0.0"
     }
   }
   ```

2. **`tsconfig.json`** - TypeScript config for library

---

### Phase 7: Session Management (Optional Layer)

**Files to create:**

1. **`src/sessions/types.ts`** - Session interfaces
   ```typescript
   type SessionState = 'connecting' | 'connected' | 'polling' | 'disconnected' | 'error';

   interface SessionManagerOptions {
     scanInterval?: number;      // Default: 5000ms
     pollInterval?: number;      // Default: 250ms
     maxConsecutiveErrors?: number;  // Default: 5
     autoReconnect?: boolean;    // Default: true
   }

   interface DeviceSession { /* ... */ }
   interface SessionManager { /* ... */ }
   ```

2. **`src/sessions/device-session.ts`** - Per-device session factory
   - Connection state management
   - Automatic reconnection
   - Command queue with error handling
   - Status polling infrastructure

3. **`src/sessions/session-manager.ts`** - Central session manager factory
   - Device scanning loop
   - Session lifecycle (create/destroy)
   - Event emission for state changes

4. **`src/sessions/index.ts`** - Public exports

**Source from signal-drift:**
- `server/sessions/DeviceSession.ts` → Reconnection, polling, state
- `server/sessions/SessionManager.ts` → Scanning, session lifecycle
- `server/devices/scanner.ts` → Device enumeration loop

---

## API Design (PyVISA Compatibility)

### Example Usage

```typescript
import { createResourceManager } from 'visa-ts';

// Create resource manager (handles all transports)
const rm = createResourceManager();

// List connected instruments (USB + Serial)
const resources = await rm.listResources('USB?*::INSTR');
console.log(resources);
// ['USB0::0x1AB1::0x04CE::DS1ZA123456789::INSTR']

// Open instrument
const result = await rm.openResource('USB0::0x1AB1::0x04CE::DS1ZA123456789::INSTR');
if (!result.ok) throw result.error;
const instr = result.value;

// Configure
instr.timeout = 5000;
instr.readTermination = '\n';

// Communicate
const idn = await instr.query('*IDN?');
if (idn.ok) console.log(idn.value);  // 'RIGOL TECHNOLOGIES,DS1054Z,...'

// Binary data
const waveform = await instr.queryBinaryValues(':WAV:DATA?', 'b');

// Close
await instr.close();
await rm.close();
```

### Resource String Formats

| Type | Format | Example |
|------|--------|---------|
| USB-TMC | `USB[board]::vendor::product::serial::INSTR` | `USB0::0x1AB1::0x04CE::DS1ZA123456789::INSTR` |
| Serial | `ASRL[port]::INSTR` | `ASRL/dev/ttyUSB0::INSTR` or `ASRLCOM3::INSTR` |
| TCP/IP | `TCPIP[board]::host::port::SOCKET` | `TCPIP0::192.168.1.100::5025::SOCKET` |
| TCP/IP (VXI-11) | `TCPIP[board]::host::INSTR` | `TCPIP0::192.168.1.100::INSTR` |

---

## File Mapping: signal-drift → visa-ts

| signal-drift source | visa-ts destination | Changes needed |
|---------------------|---------------------|----------------|
| `shared/types.ts` (Result) | `src/result.ts` | Add helpers |
| `server/devices/types.ts` (Transport) | `src/transports/transport.ts` | Add read(), readBinary() |
| `server/devices/transports/usbtmc.ts` | `src/transports/usbtmc.ts` | Remove logging, generalize quirks |
| `server/devices/transports/serial.ts` | `src/transports/serial.ts` | Add line ending config |
| `server/devices/scpi-parser.ts` | `src/util/scpi-parser.ts` | Cleanup |
| `server/devices/registry.ts` | `src/resource-manager.ts` | Add resource strings |
| `server/devices/scanner.ts` | `src/resource-manager.ts` | Merge discovery logic |
| (new) | `src/resource-string.ts` | VISA string parser |
| (new) | `src/resources/message-based.ts` | PyVISA-style Resource |
| (new) | `src/transports/tcpip.ts` | TCP socket for LXI |

---

## Testing Strategy

1. **Unit tests** - Resource string parsing, SCPI parser
2. **Integration tests** - Mock USB/Serial devices
3. **Hardware tests** - Manual testing with real instruments (optional CI)

---

## Estimated Effort

| Phase | Description | Complexity |
|-------|-------------|------------|
| 1 | Core Infrastructure | Low |
| 2 | Transport Layer | Low (mostly copy) |
| 3 | Resource Classes | Medium |
| 4 | ResourceManager | Medium |
| 5 | SCPI Utilities | Low (mostly copy) |
| 6 | Package & Docs | Low |
| 7 | Session Management | Medium (from signal-drift) |

Total: Medium complexity. Phases 1-6 are the core library (like PyVISA). Phase 7 is an optional higher-level abstraction for session management.

---

## Status

- [x] Phase 0: Repository setup (README, CLAUDE.md, CONTRIBUTING.md, .gitignore)
- [ ] Phase 1: Core Infrastructure
- [ ] Phase 2: Transport Layer
- [ ] Phase 3: Resource Classes
- [ ] Phase 4: ResourceManager
- [ ] Phase 5: SCPI Utilities
- [ ] Phase 6: Package Configuration
- [ ] Phase 7: Session Management (optional layer)
