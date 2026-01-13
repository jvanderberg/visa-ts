# visa-ts Examples

Example scripts demonstrating visa-ts instrument control.

These examples use the `MessageBasedResource` interface - the same API you'd use with real hardware. By default they run with simulated instruments, but can be switched to real hardware by changing `USE_SIMULATION = false`.

## Running Examples

```bash
# From the project root:
npx tsx examples/psu-basic.ts
npx tsx examples/load-basic.ts
npx tsx examples/power-test.ts
```

## Switching to Real Hardware

Each example has a `USE_SIMULATION` flag at the top:

```typescript
// Toggle this to switch between simulation and real hardware
const USE_SIMULATION = true;
```

Set this to `false` and update the resource strings to match your instruments:

```typescript
// Real hardware example
const rm = createResourceManager();
const psu = await rm.openResource('TCPIP0::192.168.1.100::5025::SOCKET');
```

## Examples

### psu-basic.ts

Basic power supply operations:
- Query device identification
- Set voltage and current limits
- Configure OVP/OCP protection
- Enable/disable output

### load-basic.ts

Basic electronic load operations:
- Configure operating mode (CC/CV/CR/CP)
- Set load parameters (current, voltage, resistance, power)
- Set slew rate
- Enable/disable input

### power-test.ts

Combined PSU + Load test scenario:
- Open multiple instruments
- Run parametric tests across voltage/current combinations
- Verify instrument settings
- Display results in a formatted table
