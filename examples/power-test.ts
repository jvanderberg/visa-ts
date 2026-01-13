/**
 * Power Test Example
 *
 * Demonstrates a realistic test scenario using both a PSU and Electronic Load.
 * Tests a device under various load conditions and verifies settings.
 * Uses simulation backend - no hardware required.
 *
 * With real hardware, you would use:
 *   const rm = createResourceManager();
 *   const psu = await rm.openResource('TCPIP0::192.168.1.100::5025::SOCKET');
 *   const load = await rm.openResource('USB0::0x1AB1::0x0E11::DP8C123456::INSTR');
 *
 * Note: This simulation does not model actual circuit physics - the PSU and Load
 * operate independently. See Phase 10 in PLAN.md for future circuit simulation.
 */

import {
  createResourceManager,
  createSimulationTransport,
  createMessageBasedResource,
  simulatedPsu,
  simulatedLoad,
} from '../src/index.js';
import type { MessageBasedResource } from '../src/index.js';
import type { Result } from '../src/index.js';

// Toggle this to switch between simulation and real hardware
const USE_SIMULATION = true;

interface Instruments {
  psu: MessageBasedResource;
  load: MessageBasedResource;
}

async function openInstruments(): Promise<Result<Instruments, Error>> {
  if (USE_SIMULATION) {
    // Simulation mode
    const psuTransport = createSimulationTransport({ device: simulatedPsu });
    const loadTransport = createSimulationTransport({ device: simulatedLoad });

    const psuOpen = await psuTransport.open();
    if (!psuOpen.ok) return psuOpen;

    const loadOpen = await loadTransport.open();
    if (!loadOpen.ok) return loadOpen;

    return {
      ok: true,
      value: {
        psu: createMessageBasedResource(psuTransport, {
          resourceString: 'SIM::PSU::INSTR',
          interfaceType: 'TCPIP',
          host: 'simulation',
          port: 0,
        }),
        load: createMessageBasedResource(loadTransport, {
          resourceString: 'SIM::LOAD::INSTR',
          interfaceType: 'USB',
          vendorId: 0x0000,
          productId: 0x0000,
          usbClass: 0xfe,
        }),
      },
    };
  } else {
    // Real hardware - use ResourceManager
    const rm = createResourceManager();

    const psuResult = await rm.openResource('TCPIP0::192.168.1.100::5025::SOCKET');
    if (!psuResult.ok) return psuResult;

    const loadResult = await rm.openResource('USB0::0x1AB1::0x0E11::DP8C123456::INSTR');
    if (!loadResult.ok) return loadResult;

    return {
      ok: true,
      value: {
        psu: psuResult.value,
        load: loadResult.value,
      },
    };
  }
}

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

  const instrResult = await openInstruments();
  if (!instrResult.ok) {
    console.error('Failed to open instruments:', instrResult.error.message);
    return;
  }
  const { psu, load } = instrResult.value;

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
