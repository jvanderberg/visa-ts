# visa-ts Examples

Example scripts demonstrating visa-ts instrument control.

These examples discover devices using `listResources()` with pattern filtering. Change the filter pattern to discover real hardware instead of simulated devices.

## Running Examples

```bash
# From the project root:
npx tsx examples/psu-basic.ts
npx tsx examples/load-basic.ts
npx tsx examples/power-test.ts
```

## Device Discovery

Examples use pattern filtering to find devices:

```typescript
const rm = createResourceManager();

// List all available resources
const all = await rm.listResources();

// Filter for simulated PSU
const psuList = await rm.listResources('SIM::PSU::*');

// Filter for real USB instruments
const usbList = await rm.listResources('USB*::INSTR');

// Filter for TCP/IP instruments
const tcpipList = await rm.listResources('TCPIP*::INSTR');

// Open the first matching device
const psu = await rm.openResource(psuList[0]);
```

## Available Simulated Devices

- `SIM::PSU::INSTR` - DC Power Supply
- `SIM::LOAD::INSTR` - Electronic Load

## Examples

### psu-basic.ts

Basic power supply operations:
- Discover PSU using resource filtering
- Query device identification
- Set voltage and current limits
- Configure OVP/OCP protection
- Enable/disable output

### load-basic.ts

Basic electronic load operations:
- Discover Load using resource filtering
- Configure operating mode (CC/CV/CR/CP)
- Set load parameters (current, voltage, resistance, power)
- Set slew rate
- Enable/disable input

### power-test.ts

Combined PSU + Load test scenario:
- Discover both instruments using filtering
- Run parametric tests across voltage/current combinations
- Verify instrument settings
- Display results in a formatted table
