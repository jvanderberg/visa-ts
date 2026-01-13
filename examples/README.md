# visa-ts Examples

Example scripts demonstrating the visa-ts simulation backend.

These examples use simulated instruments - no hardware required.

## Running Examples

```bash
# From the project root:
npx tsx examples/psu-basic.ts
npx tsx examples/load-basic.ts
npx tsx examples/power-test.ts
```

## Examples

### psu-basic.ts

Basic power supply operations:
- Query device identification
- Set voltage and current limits
- Enable output
- Read back measurements

### load-basic.ts

Basic electronic load operations:
- Configure operating mode (CC/CV/CR/CP)
- Set load parameters
- Enable input
- Monitor settings

### power-test.ts

Combined PSU + Load test scenario:
- Configure PSU as source
- Configure Load as sink
- Simulate a power delivery test
- Display results in a formatted table
