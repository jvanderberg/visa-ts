# visa-ts Examples

Example scripts demonstrating visa-ts instrument control.

These examples use `SIM::` resource strings for simulated instruments. Change the resource string to connect to real hardware - the code is identical.

## Running Examples

```bash
# From the project root:
npx tsx examples/psu-basic.ts
npx tsx examples/load-basic.ts
npx tsx examples/power-test.ts
```

## Switching to Real Hardware

Change the resource string constant at the top of each file:

```typescript
// Simulation
const RESOURCE_STRING = 'SIM::PSU::INSTR';

// Real hardware (TCP/IP)
const RESOURCE_STRING = 'TCPIP0::192.168.1.100::5025::SOCKET';

// Real hardware (USB)
const RESOURCE_STRING = 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR';
```

## Available Simulated Devices

- `SIM::PSU::INSTR` - DC Power Supply
- `SIM::LOAD::INSTR` - Electronic Load

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
