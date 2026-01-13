/**
 * Basic PSU (Power Supply Unit) example
 *
 * Demonstrates basic operations with a simulated DC power supply.
 */

import { createSimulationTransport, simulatedPsu } from '../src/index.js';

async function main() {
  console.log('=== Simulated PSU Example ===\n');

  // Create transport with simulated PSU
  const psu = createSimulationTransport({ device: simulatedPsu });

  // Open connection
  const openResult = await psu.open();
  if (!openResult.ok) {
    console.error('Failed to open PSU:', openResult.error.message);
    return;
  }

  // Query identification
  const idnResult = await psu.query('*IDN?');
  if (idnResult.ok) {
    console.log('Connected to:', idnResult.value);
  }

  console.log('\n--- Initial State ---');
  await displayPsuState(psu);

  // Configure PSU
  console.log('\n--- Configuring PSU ---');
  console.log('Setting voltage to 12.0V...');
  await psu.write('VOLT 12.0');

  console.log('Setting current limit to 2.0A...');
  await psu.write('CURR 2.0');

  console.log('Setting OVP to 15.0V...');
  await psu.write('VOLT:PROT 15.0');

  console.log('Setting OCP to 2.5A...');
  await psu.write('CURR:PROT 2.5');

  console.log('\n--- After Configuration ---');
  await displayPsuState(psu);

  // Enable output
  console.log('\n--- Enabling Output ---');
  await psu.write('OUTP ON');

  const outpResult = await psu.query('OUTP?');
  if (outpResult.ok) {
    console.log('Output state:', outpResult.value);
  }

  // Simulate some work
  console.log('\n--- PSU Running ---');
  console.log('PSU is now supplying power...');

  // Disable output
  console.log('\n--- Disabling Output ---');
  await psu.write('OUTP OFF');

  const finalOutp = await psu.query('OUTP?');
  if (finalOutp.ok) {
    console.log('Output state:', finalOutp.value);
  }

  // Reset to defaults
  console.log('\n--- Reset to Defaults ---');
  await psu.write('*RST');
  await displayPsuState(psu);

  // Close connection
  await psu.close();
  console.log('\nPSU connection closed.');
}

async function displayPsuState(psu: ReturnType<typeof createSimulationTransport>) {
  const voltage = await psu.query('VOLT?');
  const current = await psu.query('CURR?');
  const output = await psu.query('OUTP?');
  const ovp = await psu.query('VOLT:PROT?');
  const ocp = await psu.query('CURR:PROT?');

  console.log(`  Voltage:       ${voltage.ok ? voltage.value : 'ERR'} V`);
  console.log(`  Current Limit: ${current.ok ? current.value : 'ERR'} A`);
  console.log(`  Output:        ${output.ok ? output.value : 'ERR'}`);
  console.log(`  OVP:           ${ovp.ok ? ovp.value : 'ERR'} V`);
  console.log(`  OCP:           ${ocp.ok ? ocp.value : 'ERR'} A`);
}

main().catch(console.error);
