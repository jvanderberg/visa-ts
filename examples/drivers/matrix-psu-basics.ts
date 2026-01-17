/**
 * Matrix WPS300S Power Supply Example
 *
 * Demonstrates basic PSU operations:
 * 1. Read initial measurements
 * 2. Set voltage and current
 * 3. Enable output and measure
 * 4. Turn off output
 *
 * Note: Some Matrix PSU models may not support current measurement (MEAS:CURR?).
 * The driver will timeout on unsupported commands.
 *
 * Run with: npx tsx examples/drivers/matrix-psu-basics.ts
 */

import { createResourceManager } from '../../src/index.js';
import { matrixWPS300S } from '../../src/drivers/implementations/matrix/wps300s.js';

async function main(): Promise<void> {
  console.log('=== Matrix WPS300S Power Supply Example ===\n');

  const rm = createResourceManager();

  // List serial ports to find the PSU
  const serialPorts = await rm.listResources('ASRL*::INSTR');
  console.log('Available serial ports:');
  for (const port of serialPorts) {
    console.log(`  ${port}`);
  }

  if (serialPorts.length === 0) {
    console.log('\nNo serial ports found.');
    return;
  }

  // Find the PSU - typically /dev/tty.usbserial or similar
  const psuPort =
    serialPorts.find(
      (p) => p.includes('usbserial') || p.includes('ttyUSB') || p.includes('CH340')
    ) ?? serialPorts[0];

  console.log(`\nConnecting to: ${psuPort}`);

  // Open serial connection (115200 baud for Matrix PSU)
  const resourceResult = await rm.openResource(psuPort, {
    timeout: 5000,
    transport: { baudRate: 115200 },
  });

  if (!resourceResult.ok) {
    console.error('Failed to open resource:', resourceResult.error.message);
    return;
  }

  // Connect using the Matrix PSU driver
  const psuResult = await matrixWPS300S.connect(resourceResult.value);
  if (!psuResult.ok) {
    console.error('Failed to connect driver:', psuResult.error.message);
    return;
  }

  const psu = psuResult.value;
  const ch1 = psu.channel(1);

  console.log(`Connected to: ${psu.manufacturer} ${psu.model}`);

  // Give PSU time to settle after connection
  await sleep(500);

  // ─────────────────────────────────────────────────────────────────
  // 1. Read initial state
  // ─────────────────────────────────────────────────────────────────

  console.log('\n--- Initial State ---');

  const initialV = await ch1.getVoltage();
  const initialI = await ch1.getCurrent();
  const initialOut = await ch1.getOutputEnabled();

  console.log(
    `  Set voltage: ${initialV.ok ? initialV.value.toFixed(3) + ' V' : initialV.error.message}`
  );
  console.log(
    `  Set current: ${initialI.ok ? initialI.value.toFixed(3) + ' A' : initialI.error.message}`
  );
  console.log(
    `  Output: ${initialOut.ok ? (initialOut.value ? 'ON' : 'OFF') : initialOut.error.message}`
  );

  const measV1 = await ch1.getMeasuredVoltage();
  const measI1 = await ch1.getMeasuredCurrent();

  console.log(
    `  Measured voltage: ${measV1.ok ? measV1.value.toFixed(3) + ' V' : measV1.error.message}`
  );
  console.log(
    `  Measured current: ${measI1.ok ? measI1.value.toFixed(3) + ' A' : measI1.error.message}`
  );

  // ─────────────────────────────────────────────────────────────────
  // 2. Configure output (5V, 100mA limit)
  // ─────────────────────────────────────────────────────────────────

  console.log('\n--- Setting 5V / 0.1A ---');

  const setV = await ch1.setVoltage(5.0);
  if (!setV.ok) console.error('Failed to set voltage:', setV.error.message);

  const setI = await ch1.setCurrent(0.1);
  if (!setI.ok) console.error('Failed to set current:', setI.error.message);

  // Verify settings
  const newV = await ch1.getVoltage();
  const newI = await ch1.getCurrent();

  console.log(`  Voltage set to: ${newV.ok ? newV.value.toFixed(3) + ' V' : newV.error.message}`);
  console.log(`  Current set to: ${newI.ok ? newI.value.toFixed(3) + ' A' : newI.error.message}`);

  // ─────────────────────────────────────────────────────────────────
  // 3. Enable output and measure
  // ─────────────────────────────────────────────────────────────────

  console.log('\n--- Enabling Output ---');

  const enableOut = await ch1.setOutputEnabled(true);
  if (!enableOut.ok) {
    console.error('Failed to enable output:', enableOut.error.message);
  } else {
    console.log('  Output: ON');
  }

  // Wait a moment for output to stabilize
  await sleep(500);

  // Measure
  console.log('\n--- Measurements (output ON) ---');

  const measV2 = await ch1.getMeasuredVoltage();
  const measI2 = await ch1.getMeasuredCurrent();

  console.log(`  Voltage: ${measV2.ok ? measV2.value.toFixed(3) + ' V' : measV2.error.message}`);
  console.log(`  Current: ${measI2.ok ? measI2.value.toFixed(3) + ' A' : measI2.error.message}`);

  if (measV2.ok && measI2.ok) {
    const power = measV2.value * measI2.value;
    console.log(`  Power: ${(power * 1000).toFixed(2)} mW`);
  }

  // ─────────────────────────────────────────────────────────────────
  // 4. Disable output
  // ─────────────────────────────────────────────────────────────────

  console.log('\n--- Disabling Output ---');

  const disableOut = await ch1.setOutputEnabled(false);
  if (!disableOut.ok) {
    console.error('Failed to disable output:', disableOut.error.message);
  } else {
    console.log('  Output: OFF');
  }

  // Final measurement
  await sleep(200);

  const measV3 = await ch1.getMeasuredVoltage();
  const measI3 = await ch1.getMeasuredCurrent();

  console.log('\n--- Final Measurements (output OFF) ---');
  console.log(`  Voltage: ${measV3.ok ? measV3.value.toFixed(3) + ' V' : measV3.error.message}`);
  console.log(`  Current: ${measI3.ok ? measI3.value.toFixed(3) + ' A' : measI3.error.message}`);

  // Close
  await psu.close();
  console.log('\nConnection closed.');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch(console.error);
