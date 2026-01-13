/**
 * Basic Electronic Load example
 *
 * Demonstrates basic operations with an electronic load.
 * Uses SIM::LOAD::INSTR for simulation - change to real resource string for hardware.
 */

import { createResourceManager } from '../src/index.js';
import type { MessageBasedResource } from '../src/index.js';

// Change this to your real instrument's resource string for hardware:
// 'USB0::0x1AB1::0x0E11::DP8C123456::INSTR'
const RESOURCE_STRING = 'SIM::LOAD::INSTR';

async function main() {
  console.log('=== Electronic Load Example ===\n');

  const rm = createResourceManager();
  const loadResult = await rm.openResource(RESOURCE_STRING);

  if (!loadResult.ok) {
    console.error('Failed to open Load:', loadResult.error.message);
    return;
  }
  const load = loadResult.value;

  // Query identification
  const idnResult = await load.query('*IDN?');
  if (idnResult.ok) {
    console.log('Connected to:', idnResult.value);
  }

  console.log('\n--- Initial State ---');
  await displayLoadState(load);

  // Demo each mode
  await demoCCMode(load);
  await demoCVMode(load);
  await demoCRMode(load);
  await demoCPMode(load);

  // Reset to defaults
  console.log('\n--- Reset to Defaults ---');
  await load.write('*RST');
  await displayLoadState(load);

  // Close connection
  await load.close();
  console.log('\nLoad connection closed.');
}

async function demoCCMode(load: MessageBasedResource) {
  console.log('\n--- Constant Current (CC) Mode ---');

  await load.write('MODE CC');
  await load.write('CURR 5.0');
  await load.write('CURR:SLEW 0.5');
  await load.write('INP ON');

  const mode = await load.query('MODE?');
  const curr = await load.query('CURR?');
  const slew = await load.query('CURR:SLEW?');
  const inp = await load.query('INP?');

  console.log(`  Mode:      ${mode.ok ? mode.value : 'ERR'}`);
  console.log(`  Current:   ${curr.ok ? curr.value : 'ERR'} A`);
  console.log(`  Slew Rate: ${slew.ok ? slew.value : 'ERR'} A/us`);
  console.log(`  Input:     ${inp.ok ? inp.value : 'ERR'}`);

  await load.write('INP OFF');
}

async function demoCVMode(load: MessageBasedResource) {
  console.log('\n--- Constant Voltage (CV) Mode ---');

  await load.write('MODE CV');
  await load.write('VOLT 24.0');
  await load.write('INP ON');

  const mode = await load.query('MODE?');
  const volt = await load.query('VOLT?');
  const inp = await load.query('INP?');

  console.log(`  Mode:    ${mode.ok ? mode.value : 'ERR'}`);
  console.log(`  Voltage: ${volt.ok ? volt.value : 'ERR'} V`);
  console.log(`  Input:   ${inp.ok ? inp.value : 'ERR'}`);

  await load.write('INP OFF');
}

async function demoCRMode(load: MessageBasedResource) {
  console.log('\n--- Constant Resistance (CR) Mode ---');

  await load.write('MODE CR');
  await load.write('RES 100');
  await load.write('INP ON');

  const mode = await load.query('MODE?');
  const res = await load.query('RES?');
  const inp = await load.query('INP?');

  console.log(`  Mode:       ${mode.ok ? mode.value : 'ERR'}`);
  console.log(`  Resistance: ${res.ok ? res.value : 'ERR'} ohms`);
  console.log(`  Input:      ${inp.ok ? inp.value : 'ERR'}`);

  await load.write('INP OFF');
}

async function demoCPMode(load: MessageBasedResource) {
  console.log('\n--- Constant Power (CP) Mode ---');

  await load.write('MODE CP');
  await load.write('POW 50');
  await load.write('INP ON');

  const mode = await load.query('MODE?');
  const pow = await load.query('POW?');
  const inp = await load.query('INP?');

  console.log(`  Mode:  ${mode.ok ? mode.value : 'ERR'}`);
  console.log(`  Power: ${pow.ok ? pow.value : 'ERR'} W`);
  console.log(`  Input: ${inp.ok ? inp.value : 'ERR'}`);

  await load.write('INP OFF');
}

async function displayLoadState(load: MessageBasedResource) {
  const mode = await load.query('MODE?');
  const curr = await load.query('CURR?');
  const volt = await load.query('VOLT?');
  const res = await load.query('RES?');
  const pow = await load.query('POW?');
  const inp = await load.query('INP?');

  console.log(`  Mode:       ${mode.ok ? mode.value : 'ERR'}`);
  console.log(`  Current:    ${curr.ok ? curr.value : 'ERR'} A`);
  console.log(`  Voltage:    ${volt.ok ? volt.value : 'ERR'} V`);
  console.log(`  Resistance: ${res.ok ? res.value : 'ERR'} ohms`);
  console.log(`  Power:      ${pow.ok ? pow.value : 'ERR'} W`);
  console.log(`  Input:      ${inp.ok ? inp.value : 'ERR'}`);
}

main().catch(console.error);
