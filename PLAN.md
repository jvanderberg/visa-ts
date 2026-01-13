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

### Phase 9: Example Simulated Devices

Built-in device definitions for common instrument types.

| File | Description |
|------|-------------|
| `src/simulation/devices/psu.ts` | Simulated DC Power Supply (voltage/current source, OVP/OCP) |
| `src/simulation/devices/load.ts` | Simulated Electronic Load (CC/CV/CR/CP modes) |
| `src/simulation/devices/index.ts` | Device exports |

### Phase 10: Circuit Simulation (Bus Architecture)

Enables realistic multi-instrument simulation where devices interact with each other (e.g., PSU supplies current that Load draws). Uses a distributed bus-based architecture where each device owns its own physics.

#### Design Goals

- **Distributed physics** — Each device implements its own behavior, not a central solver
- **Bus-based communication** — Devices publish/subscribe to shared electrical state
- **Iterative convergence** — Bus settles when no device needs to change state
- **Extensible** — New device types just implement `CircuitParticipant`
- **ResourceManager integration** — Use standard `openResource()` API

#### Core Types

```typescript
// src/simulation/circuit/types.ts

/** Electrical state on the bus */
interface BusState {
  voltage: number;
  current: number;
}

/** Interface for devices that participate in circuit simulation */
interface CircuitParticipant {
  /**
   * Called when bus state changes. Device applies its physics/constraints
   * and returns updated state, or null if no change needed.
   */
  onBusUpdate(state: BusState): BusState | null;
}
```

#### Bus Implementation

```typescript
// src/simulation/circuit/bus.ts

interface Bus {
  /** Current electrical state */
  state: BusState;

  /** Connected participants */
  participants: CircuitParticipant[];

  /** Add a participant to the bus */
  connect(participant: CircuitParticipant): void;

  /** Iterate until stable (no participant changes state) */
  settle(): void;
}

function createBus(): Bus;
```

#### How It Works

The bus uses iterative relaxation — each device applies its constraints until equilibrium:

```
1. PSU sets output ON at 5V
   → publishes { voltage: 5, current: 0 }

2. Load sees 5V, in CC mode at 1A
   → calculates: "at 5V I draw 1A"
   → publishes { voltage: 5, current: 1 }

3. PSU sees 1A demand, but current limit is 0.5A
   → calculates: "I need to drop voltage to limit current"
   → publishes { voltage: ~2.5, current: 0.5 }

4. Load sees new voltage, recalculates
   → still wants 1A but only 0.5A available
   → publishes { voltage: 2.5, current: 0.5 }

5. No changes → bus is settled
```

#### Device Responsibilities

| Device | Behavior |
|--------|----------|
| PSU | Publishes voltage setpoint, enforces current limit (CC mode), OVP/OCP trips |
| Load (CC) | Given voltage, draws constant current up to available |
| Load (CV) | Draws current to maintain constant voltage |
| Load (CR) | Draws I = V / R (Ohm's law) |
| Load (CP) | Draws I = P / V (constant power) |
| DMM | High impedance, publishes ~0A draw |

#### Extending SimulatedDevice

Currently, `simulatedPsu` and `simulatedLoad` are state stores with command handlers - they don't implement physics. To support circuit simulation, devices need to be extended with a `CircuitParticipant` implementation.

**Option A: Add participant to SimulatedDevice type**

```typescript
interface SimulatedDevice {
  device: DeviceInfo;
  dialogues?: Dialogue[];
  properties?: Record<string, Property>;

  // NEW: Optional circuit participation
  participant?: (getState: () => Record<string, unknown>) => CircuitParticipant;
}
```

**Option B: Separate participant factory**

```typescript
// In psu.ts
export const simulatedPsu: SimulatedDevice = { /* existing */ };

export function createPsuParticipant(
  getState: () => Record<string, unknown>
): CircuitParticipant {
  return {
    onBusUpdate(bus: BusState): BusState | null {
      const state = getState();
      const outputEnabled = state.output as boolean;
      const voltageSetpoint = state.voltage as number;
      const currentLimit = state.current as number;

      if (!outputEnabled) {
        return { voltage: 0, current: 0 };
      }

      // Enforce current limit
      if (bus.current > currentLimit) {
        return { voltage: bus.voltage, current: currentLimit };
      }

      // Set voltage
      if (bus.voltage !== voltageSetpoint) {
        return { voltage: voltageSetpoint, current: bus.current };
      }

      return null;
    }
  };
}
```

The circuit factory would then wire up the participant with the device's state.

#### Circuit Factory

```typescript
// src/simulation/circuit/circuit.ts

interface Circuit {
  /** Add a device to the circuit */
  addDevice(id: string, device: SimulatedDevice): Result<CircuitDevice, Error>;

  /** Register all devices with a ResourceManager */
  registerWith(rm: ResourceManager): void;
}

function createCircuit(): Circuit;
```

#### Usage Example

```typescript
import { createResourceManager, createCircuit, simulatedPsu, simulatedLoad } from 'visa-ts';

const rm = createResourceManager();
const circuit = createCircuit();

// Add devices to circuit
circuit.addDevice('psu', simulatedPsu);
circuit.addDevice('load', simulatedLoad);

// Register with ResourceManager
circuit.registerWith(rm);

// Use standard API — circuit physics happen transparently
const psu = await rm.openResource('SIM::PSU::INSTR');
const load = await rm.openResource('SIM::LOAD::INSTR');

await psu.value.write('VOLT 12');
await psu.value.write('CURR 2');  // 2A limit
await psu.value.write('OUTP ON');

await load.value.write('MODE CC');
await load.value.write('CURR 5');  // Wants 5A
await load.value.write('INP ON');

// PSU is current-limiting at 2A
const current = await psu.value.query('MEAS:CURR?');  // "2.000"
```

#### File Structure

| File | Description |
|------|-------------|
| `src/simulation/circuit/types.ts` | BusState, CircuitParticipant interfaces |
| `src/simulation/circuit/bus.ts` | createBus() factory, settle() logic |
| `src/simulation/circuit/circuit.ts` | createCircuit() factory, ResourceManager integration |
| `src/simulation/circuit/index.ts` | Public exports |

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
- [x] Phase 9: Example Simulated Devices (PSU, Electronic Load)
- [ ] Phase 10: Circuit Simulation (bus-based multi-device physics)
