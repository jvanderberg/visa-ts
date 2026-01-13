# Plan: visa-ts Implementation

## Overview

A standalone, reusable npm package implementing the VISA (Virtual Instrument Software Architecture) standard, similar to PyVISA for Python.

## Goals

1. Create a standalone npm package with zero application-specific dependencies
2. Maintain PyVISA-like API patterns for familiarity
3. Support USB-TMC, Serial, and TCP/IP (LXI) transports
4. Enable easy addition of new transports (GPIB, etc.)
5. Provide TypeScript-first experience with full type safety
6. **No throwing** - All errors via `Result<T, Error>`
7. **No classes** - Factory functions and interfaces only
8. **Strict TDD** - Tests first, 90% coverage minimum

## Documentation

- **DESIGN.md** - Complete API specification, interfaces, and usage examples
- **CLAUDE.md** - Development guidelines and coding standards
- **CONTRIBUTING.md** - Contribution workflow and TDD requirements

## Package Structure

```
visa-ts/
├── .github/workflows/ci.yml    # GitHub Actions CI
├── .husky/pre-commit           # Pre-commit hooks
├── .nvmrc                      # Node version (20)
├── .prettierrc                 # Prettier config
├── eslint.config.js            # ESLint flat config
├── vitest.config.ts            # Vitest + coverage config
├── tsconfig.json               # TypeScript config
├── package.json
├── LICENSE
├── README.md
├── CLAUDE.md
├── CONTRIBUTING.md
├── DESIGN.md
├── PLAN.md
├── src/
│   ├── index.ts                    # Public API exports
│   ├── types.ts                    # Core interfaces
│   ├── result.ts                   # Result<T,E> type ✅
│   ├── resource-manager.ts         # ResourceManager factory
│   ├── resource-string.ts          # VISA resource string parser
│   ├── resources/
│   │   └── message-based.ts        # MessageBasedResource factory
│   ├── transports/
│   │   ├── transport.ts            # Transport interface
│   │   ├── usbtmc.ts               # USB-TMC implementation
│   │   ├── serial.ts               # Serial implementation
│   │   └── tcpip.ts                # TCP/IP socket (LXI)
│   ├── util/
│   │   └── scpi-parser.ts          # SCPI response parsing
│   └── sessions/                   # Optional session management
│       ├── index.ts
│       ├── session-manager.ts
│       └── device-session.ts
└── test/
    ├── result.test.ts              # ✅ Complete
    ├── resource-string.test.ts
    ├── transports/
    │   ├── usbtmc.test.ts
    │   ├── serial.test.ts
    │   └── tcpip.test.ts
    └── integration/
        └── (hardware tests)
```

## Implementation Phases

### Phase 1: Core Infrastructure ⏳

| File | Description | Status |
|------|-------------|--------|
| `src/result.ts` | Result type, Ok, Err, helpers | ✅ Done |
| `src/types.ts` | Core interfaces (see DESIGN.md) | |
| `src/resource-string.ts` | VISA resource string parser | |

### Phase 2: Transport Layer

| File | Description | Source |
|------|-------------|--------|
| `src/transports/transport.ts` | Transport interface | DESIGN.md |
| `src/transports/usbtmc.ts` | USB-TMC transport | signal-drift |
| `src/transports/serial.ts` | Serial transport | signal-drift |
| `src/transports/tcpip.ts` | TCP/IP socket (LXI) | New |

### Phase 3: Resource Classes

| File | Description |
|------|-------------|
| `src/resources/message-based.ts` | MessageBasedResource factory (see DESIGN.md) |

### Phase 4: ResourceManager

| File | Description |
|------|-------------|
| `src/resource-manager.ts` | createResourceManager() factory, discovery, connection |

### Phase 5: SCPI Utilities

| File | Description | Source |
|------|-------------|--------|
| `src/util/scpi-parser.ts` | SCPI response parsing, IEEE 488.2 blocks | signal-drift |

### Phase 6: Package Configuration ✅

| Item | Status |
|------|--------|
| package.json | ✅ Done |
| tsconfig.json | ✅ Done |
| ESLint + Prettier | ✅ Done |
| Vitest + coverage | ✅ Done |
| Husky pre-commit | ✅ Done |
| GitHub Actions CI | ✅ Done |

### Phase 7: Session Management (Optional)

| File | Description |
|------|-------------|
| `src/sessions/session-manager.ts` | SessionManager factory with auto-reconnect |
| `src/sessions/device-session.ts` | DeviceSession factory with command queue |

See DESIGN.md for full SessionManager and DeviceSession API.

### Phase 8: Simulation Backend

A TypeScript-native simulation backend for testing without hardware, inspired by PyVISA-sim but using typed interfaces instead of YAML.

#### Design Goals

- **Type-safe device definitions** - TypeScript interfaces, not YAML/JSON strings
- **Functional response handlers** - Real functions instead of template strings
- **Stateful properties** - Simulated instrument state with validation
- **Pattern-based command matching** - String literals or RegExp
- **Configurable noise/latency** - Realistic measurement simulation

#### Core Types

```typescript
// src/simulation/types.ts
interface SimulatedDevice {
  device: {
    manufacturer: string;
    model: string;
    serial: string;
  };

  eom?: {
    query?: string;
    response?: string;
  };

  dialogues?: Dialogue[];
  properties?: Record<string, Property>;
}

interface Dialogue {
  q: string | RegExp;
  r: string | ((match: RegExpMatchArray) => string) | null;
}

interface Property<T = number | string | boolean> {
  default: T;
  getter?: { q: string | RegExp; r: (value: T) => string };
  setter?: { q: string | RegExp; parse: (match: RegExpMatchArray) => T };
  validate?: (value: T) => boolean;
}
```

#### Example Device Definition

```typescript
// devices/rigol-ds1054z.ts
import { SimulatedDevice } from '../src/simulation/types.js';

export const rigolDS1054Z: SimulatedDevice = {
  device: {
    manufacturer: 'RIGOL TECHNOLOGIES',
    model: 'DS1054Z',
    serial: 'DS1ZA000000001',
  },

  dialogues: [
    { q: '*IDN?', r: 'RIGOL TECHNOLOGIES,DS1054Z,DS1ZA000000001,00.04.04' },
    { q: '*RST', r: null },
    { q: ':MEAS:FREQ?', r: () => (1000 + Math.random() * 0.5).toExponential(6) },
  ],

  properties: {
    timebase: {
      default: 1e-3,
      getter: { q: ':TIM:MAIN:SCAL?', r: (v) => v.toExponential(6) },
      setter: { q: /^:TIM:MAIN:SCAL\s+(.+)$/, parse: (m) => parseFloat(m[1]) },
      validate: (v) => [5e-9, 1e-8, 2e-8, 5e-8, 1e-7].includes(v),
    },
  },
};
```

#### File Structure

| File | Description |
|------|-------------|
| `src/simulation/types.ts` | SimulatedDevice, Dialogue, Property interfaces |
| `src/simulation/device-state.ts` | Stateful property storage with validation |
| `src/simulation/command-handler.ts` | Pattern matching, dialogue lookup, property get/set |
| `src/simulation/index.ts` | Public exports |
| `src/transports/simulation.ts` | createSimulationTransport() factory |

#### Integration Options

**Option A: Direct transport creation**
```typescript
const transport = createSimulationTransport({
  device: rigolDS1054Z,
  latencyMs: 10,
});
const instr = createMessageBasedResource(transport);
```

**Option B: Simulated ResourceManager**
```typescript
const rm = createSimulatedResourceManager({
  devices: {
    'USB::0x1AB1::0x04CE::SIM001::INSTR': rigolDS1054Z,
    'TCPIP::192.168.1.100::5025::SOCKET': keysightDMM,
  }
});
const resources = await rm.listResources(); // Returns configured resource strings
const instr = await rm.openResource('USB::0x1AB1::0x04CE::SIM001::INSTR');
```

#### Comparison with Signal-Drift Approach

| Aspect | Signal-Drift | visa-ts Simulation |
|--------|--------------|-------------------|
| Device definitions | Hardcoded TypeScript | Typed interfaces |
| Command matching | String `startsWith`/`===` | Pattern-based (string or RegExp) |
| Adding devices | New simulator file | New device definition object |
| State management | Per-simulator closures | Generic property system |
| Validation | Manual if/else | Declarative with `validate` function |
| Response generation | Template literals | Functions with full flexibility |

---

## Testing Strategy

- **Framework**: Vitest
- **Methodology**: Strict Red/Green TDD (see CONTRIBUTING.md)
- **Coverage thresholds**: 90% lines, 90% functions, 85% branches
- **Unit tests**: All parsers, Result helpers, resource strings
- **Integration tests**: Mock transports for USB/Serial/TCP
- **Hardware tests**: Optional, requires real instruments

---

## File Mapping: signal-drift → visa-ts

| signal-drift source | visa-ts destination |
|---------------------|---------------------|
| `shared/types.ts` (Result) | `src/result.ts` |
| `server/devices/types.ts` (Transport) | `src/transports/transport.ts` |
| `server/devices/transports/usbtmc.ts` | `src/transports/usbtmc.ts` |
| `server/devices/transports/serial.ts` | `src/transports/serial.ts` |
| `server/devices/scpi-parser.ts` | `src/util/scpi-parser.ts` |
| `server/sessions/DeviceSession.ts` | `src/sessions/device-session.ts` |
| `server/sessions/SessionManager.ts` | `src/sessions/session-manager.ts` |

---

## Status

- [x] Phase 0: Repository setup
- [x] Phase 6: Package configuration & tooling
- [x] Phase 1: Core Infrastructure (result.ts, types.ts, resource-string.ts)
- [x] Phase 2: Transport Layer (USB-TMC, Serial, TCP/IP)
- [x] Phase 3: Resource Classes (MessageBasedResource)
- [x] Phase 4: ResourceManager (discovery, opening, exclusive mode)
- [x] Phase 5: SCPI Utilities (scpi-parser.ts)
- [x] Phase 7: Session Management (SessionManager, DeviceSession with polling)
- [x] Auto-baud detection for serial ports (probeSerialPort utility)
- [ ] Phase 8: Simulation Backend (typed device definitions, pattern matching, stateful properties)
