/**
 * Power Test Example
 *
 * Demonstrates a realistic test scenario using both a PSU and Electronic Load.
 * Simulates testing a device under various load conditions.
 */

import { createSimulationTransport, simulatedPsu, simulatedLoad } from '../src/index.js';

interface TestPoint {
  voltage: number;
  currentLimit: number;
  loadCurrent: number;
}

const TEST_POINTS: TestPoint[] = [
  { voltage: 5.0, currentLimit: 3.0, loadCurrent: 0.5 },
  { voltage: 5.0, currentLimit: 3.0, loadCurrent: 1.0 },
  { voltage: 5.0, currentLimit: 3.0, loadCurrent: 2.0 },
  { voltage: 12.0, currentLimit: 2.0, loadCurrent: 0.5 },
  { voltage: 12.0, currentLimit: 2.0, loadCurrent: 1.0 },
  { voltage: 12.0, currentLimit: 2.0, loadCurrent: 1.5 },
  { voltage: 24.0, currentLimit: 1.0, loadCurrent: 0.25 },
  { voltage: 24.0, currentLimit: 1.0, loadCurrent: 0.5 },
  { voltage: 24.0, currentLimit: 1.0, loadCurrent: 0.75 },
];

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║              Power Delivery Test Suite                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Create instruments
  const psu = createSimulationTransport({ device: simulatedPsu });
  const load = createSimulationTransport({ device: simulatedLoad });

  // Open connections
  const psuOpen = await psu.open();
  const loadOpen = await load.open();

  if (!psuOpen.ok || !loadOpen.ok) {
    console.error('Failed to open instruments');
    return;
  }

  // Get instrument info
  const psuIdn = await psu.query('*IDN?');
  const loadIdn = await load.query('*IDN?');

  console.log('Instruments:');
  console.log(`  PSU:  ${psuIdn.ok ? psuIdn.value : 'Unknown'}`);
  console.log(`  Load: ${loadIdn.ok ? loadIdn.value : 'Unknown'}`);

  // Configure load for CC mode
  await load.write('MODE CC');

  // Run tests
  console.log('\n┌──────────┬─────────────┬─────────────┬──────────┬────────┐');
  console.log('│ Voltage  │ PSU Current │ Load Current│  Power   │ Status │');
  console.log('│   (V)    │  Limit (A)  │    (A)      │   (W)    │        │');
  console.log('├──────────┼─────────────┼─────────────┼──────────┼────────┤');

  let passed = 0;
  let failed = 0;

  for (const point of TEST_POINTS) {
    const result = await runTestPoint(psu, load, point);

    const status = result.passed ? '  PASS ' : ' FAIL  ';
    const power = (point.voltage * point.loadCurrent).toFixed(2);

    console.log(
      `│ ${point.voltage.toFixed(1).padStart(6)}   │` +
        `   ${point.currentLimit.toFixed(1).padStart(5)}     │` +
        `    ${point.loadCurrent.toFixed(2).padStart(5)}    │` +
        ` ${power.padStart(6)}   │` +
        `${status}│`
    );

    if (result.passed) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log('└──────────┴─────────────┴─────────────┴──────────┴────────┘');

  // Summary
  console.log('\n════════════════════════════════════════════════════════════');
  console.log(`  Test Results: ${passed} passed, ${failed} failed`);
  console.log(`  Pass Rate:    ${((passed / TEST_POINTS.length) * 100).toFixed(1)}%`);
  console.log('════════════════════════════════════════════════════════════');

  // Cleanup
  await psu.write('OUTP OFF');
  await psu.write('*RST');
  await load.write('INP OFF');
  await load.write('*RST');

  await psu.close();
  await load.close();

  console.log('\nTest complete. Instruments reset and disconnected.');
}

interface TestResult {
  passed: boolean;
  measuredVoltage?: string;
  measuredCurrent?: string;
}

async function runTestPoint(
  psu: ReturnType<typeof createSimulationTransport>,
  load: ReturnType<typeof createSimulationTransport>,
  point: TestPoint
): Promise<TestResult> {
  // Configure PSU
  await psu.write(`VOLT ${point.voltage}`);
  await psu.write(`CURR ${point.currentLimit}`);
  await psu.write('OUTP ON');

  // Configure Load
  await load.write(`CURR ${point.loadCurrent}`);
  await load.write('INP ON');

  // Small delay to simulate settling time
  await delay(10);

  // Read back values
  const psuVolt = await psu.query('VOLT?');
  const loadCurr = await load.query('CURR?');

  // Verify settings match
  const voltageOk = psuVolt.ok && parseFloat(psuVolt.value!) === point.voltage;
  const currentOk = loadCurr.ok && parseFloat(loadCurr.value!) === point.loadCurrent;

  // Turn off for next test
  await load.write('INP OFF');
  await psu.write('OUTP OFF');

  return {
    passed: voltageOk && currentOk,
    measuredVoltage: psuVolt.ok ? psuVolt.value : undefined,
    measuredCurrent: loadCurr.ok ? loadCurr.value : undefined,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch(console.error);
