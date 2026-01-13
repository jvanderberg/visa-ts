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
  pattern: string | RegExp;
  response: string | ((match: RegExpMatchArray) => string) | null;
}

interface Property<T = number | string | boolean> {
  default: T;
  getter?: { pattern: string | RegExp; format: (value: T) => string };
  setter?: { pattern: string | RegExp; parse: (match: RegExpMatchArray) => T };
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
    { pattern: '*IDN?', response: 'RIGOL TECHNOLOGIES,DS1054Z,DS1ZA000000001,00.04.04' },
    { pattern: '*RST', response: null },
    { pattern: ':MEAS:FREQ?', response: () => (1000 + Math.random() * 0.5).toExponential(6) },
  ],

  properties: {
    timebase: {
      default: 1e-3,
      getter: { pattern: ':TIM:MAIN:SCAL?', format: (v) => v.toExponential(6) },
      setter: { pattern: /^:TIM:MAIN:SCAL\s+(.+)$/, parse: (m) => parseFloat(m[1] ?? '0') },
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

### Phase 9: Code Quality Cleanup

Tighten type safety and coding standards across the codebase.

#### 9.1 Remove Type Assertions

Audit and eliminate `as` and `!` assertions where possible:

| Location | Issue | Fix |
|----------|-------|-----|
| `src/simulation/command-handler.ts:49` | `[command] as RegExpMatchArray` | Create proper match object factory |
| `src/simulation/command-handler.ts:112` | `value as never` | Improve Property generic typing |
| `src/simulation/device-state.ts:84,96` | `as T`, `as never` | Stricter generic constraints |
| `src/simulation/devices/*.ts` | `as number`, `as string` in formatters | Narrow Property type or use type guards |
| `src/transports/*.ts` | `port!`, `socket!`, `device!` | State machine pattern or discriminated unions |
| `src/resource-manager.ts` | Multiple `parsed as` casts | Discriminated union for parsed resources |

#### 9.2 Strengthen Generic Types

The `Property<T>` type loses type information when used in `Record<string, Property>`:

```typescript
// Current: T defaults to union, loses specificity
properties?: Record<string, Property>;

// Consider: Builder pattern or stricter typing
properties?: PropertyMap; // with better inference
```

#### 9.3 Transport State Safety

Current pattern relies on runtime checks + assertions:
```typescript
if (!isOpen) return Err(...);
socket!.write(...); // assertion because TS can't track state
```

Consider discriminated union pattern:
```typescript
type TransportState =
  | { status: 'closed' }
  | { status: 'open'; socket: Socket };
```

#### 9.4 ESLint Rules

Add stricter lint rules:

| Rule | Purpose |
|------|---------|
| `@typescript-eslint/no-non-null-assertion` | Ban `!` assertions |
| `@typescript-eslint/no-explicit-any` | Ban `any` type |
| `@typescript-eslint/no-unsafe-*` | Catch unsafe type operations |
| `@typescript-eslint/strict-boolean-expressions` | Require explicit boolean checks |

#### 9.5 Documentation Sync

- Update PLAN.md examples to use `pattern`/`response`/`format` (not `q`/`r`)
- Review DESIGN.md for accuracy
- Ensure JSDoc matches implementation

#### 9.6 Example Devices

- [x] Add `simulatedPsu` - DC power supply simulation
- [x] Add `simulatedLoad` - Electronic load simulation
- [ ] Add example oscilloscope device (Rigol DS1054Z pattern)
- [ ] Add example DMM device

### Phase 10: Circuit Simulation

Enable realistic multi-instrument simulation by connecting device outputs to inputs with simulated physics.

#### 10.1 Design Goals

- **Coupled device state** - PSU output current reflects what Load is drawing
- **Wire/connection modeling** - Configurable resistance, inductance
- **Realistic device physics** - PSU current limiting, Load modes affect circuit
- **Observable measurements** - `MEAS:VOLT?` and `MEAS:CURR?` reflect actual circuit state

#### 10.2 Core Concepts

**Circuit** - Container that connects simulated devices:
```typescript
const circuit = createCircuit();

const psu = circuit.addDevice('psu', simulatedPsu);
const load = circuit.addDevice('load', simulatedLoad);

// Connect PSU output to Load input through a wire
circuit.connect(psu.output, load.input, { resistance: 0.01 }); // 10mΩ wire
```

**Nodes** - Connection points with voltage/current state:
```typescript
interface CircuitNode {
  voltage: number;      // Volts
  current: number;      // Amps (into node)
}
```

**Connections** - Wires with parasitic properties:
```typescript
interface Connection {
  resistance: number;   // Ohms (default: 0.01)
  inductance?: number;  // Henries (optional, for transient sim)
}
```

#### 10.3 Device Physics

**PSU behavior:**
- **CV mode (normal)**: Output voltage = setpoint, current ≤ limit
- **CC mode (limiting)**: Current = limit, voltage drops as needed
- **OVP/OCP**: Trip and disable output if exceeded

```typescript
interface PsuState {
  mode: 'CV' | 'CC' | 'OFF' | 'OVP_TRIP' | 'OCP_TRIP';
  outputVoltage: number;  // Actual output (may differ from setpoint in CC)
  outputCurrent: number;  // Actual current being drawn
}
```

**Load behavior:**
- **CC mode**: Draw constant current (if voltage available)
- **CV mode**: Draw whatever current needed to clamp voltage
- **CR mode**: I = V / R (Ohm's law)
- **CP mode**: I = P / V (constant power)

```typescript
interface LoadState {
  inputVoltage: number;   // What's being supplied
  inputCurrent: number;   // What we're drawing
  mode: 'CC' | 'CV' | 'CR' | 'CP';
}
```

#### 10.4 Simulation Loop

Each "tick" or query triggers circuit resolution:

```typescript
function resolveCircuit(circuit: Circuit): void {
  // 1. Get PSU voltage setpoint and current limit
  // 2. Get Load demand based on mode
  // 3. Calculate actual current (min of supply capability and demand)
  // 4. Apply wire resistance: V_load = V_psu - I * R_wire
  // 5. Check for PSU mode transitions (CV→CC, OCP trip, etc.)
  // 6. Update all device MEAS values
}
```

#### 10.5 Example Usage

```typescript
import { createCircuit, simulatedPsu, simulatedLoad } from 'visa-ts';

const circuit = createCircuit();
const psu = circuit.addDevice('psu', simulatedPsu);
const load = circuit.addDevice('load', simulatedLoad);

circuit.connect(psu.output, load.input, { resistance: 0.05 }); // 50mΩ

// Configure PSU: 12V, 2A limit
await psu.transport.write('VOLT 12');
await psu.transport.write('CURR 2');
await psu.transport.write('OUTP ON');

// Configure Load: CC mode, 1.5A
await load.transport.write('MODE CC');
await load.transport.write('CURR 1.5');
await load.transport.write('INP ON');

// Query actual values (reflects circuit physics)
const psuCurrent = await psu.transport.query('MEAS:CURR?');
// Returns "1.500" - PSU is supplying what Load draws

const loadVoltage = await load.transport.query('MEAS:VOLT?');
// Returns "11.925" - 12V - (1.5A × 0.05Ω) = 11.925V

// Increase load beyond PSU limit
await load.transport.write('CURR 3.0');

const psuMode = await psu.transport.query('STAT:OPER?'); // Or similar
// PSU now in CC mode, limiting at 2A

const actualCurrent = await psu.transport.query('MEAS:CURR?');
// Returns "2.000" - limited by PSU
```

#### 10.6 File Structure

| File | Description |
|------|-------------|
| `src/simulation/circuit.ts` | Circuit container, connection management |
| `src/simulation/circuit-node.ts` | Node voltage/current state |
| `src/simulation/solver.ts` | Circuit resolution algorithm |
| `src/simulation/devices/psu-physics.ts` | PSU electrical model |
| `src/simulation/devices/load-physics.ts` | Load electrical model |

#### 10.7 Future Extensions

- **Transient simulation** - Model inductance, capacitance, settling time
- **Fault injection** - Simulate shorts, opens, overcurrent events
- **Multi-output PSU** - Multiple independent or tracking outputs
- **Waveform sources** - Function generator simulation
- **Oscilloscope probes** - Attach to nodes and capture waveforms

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
- [x] Phase 8: Simulation Backend (typed device definitions, pattern matching, stateful properties)
- [ ] Phase 9: Code Quality Cleanup
