/**
 * Power Test Example
 *
 * Demonstrates a realistic test scenario using both a PSU and Electronic Load.
 * Tests a device under various load conditions and verifies settings.
 *
 * Uses SIM::PSU::INSTR and SIM::LOAD::INSTR for simulation.
 * Change to real resource strings for hardware.
 *
 * Note: This simulation does not model actual circuit physics - the PSU and Load
 * operate independently. See Phase 10 in PLAN.md for future circuit simulation.
 */

import { createResourceManager } from '../src/index.js';
import type { MessageBasedResource } from '../src/index.js';

// Change these to your real instruments' resource strings for hardware
const PSU_RESOURCE = 'SIM::PSU::INSTR';
const LOAD_RESOURCE = 'SIM::LOAD::INSTR';

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

  const rm = createResourceManager();

  const psuResult = await rm.openResource(PSU_RESOURCE);
  if (!psuResult.ok) {
    console.error('Failed to open PSU:', psuResult.error.message);
    return;
  }

  const loadResult = await rm.openResource(LOAD_RESOURCE);
  if (!loadResult.ok) {
    console.error('Failed to open Load:', loadResult.error.message);
    await psuResult.value.close();
    return;
  }

  const psu = psuResult.value;
  const load = loadResult.value;

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
  psu: MessageBasedResource,
  load: MessageBasedResource,
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
  const voltageOk = psuVolt.ok && parseFloat(psuVolt.value ?? '0') === point.voltage;
  const currentOk = loadCurr.ok && parseFloat(loadCurr.value ?? '0') === point.loadCurrent;

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
