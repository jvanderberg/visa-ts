/**
 * Real Hardware Power Test - Voltage Sag Demonstration
 *
 * Uses Matrix WPS300S-8010 PSU and Rigol DL3021 Electronic Load
 */

import { createResourceManager } from '../../src/index.js';

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

async function main(): Promise<void> {
  console.log('==================================================================');
  console.log('       Voltage Sag Under Current Limiting (REAL HARDWARE)        ');
  console.log('==================================================================\n');

  const rm = createResourceManager();

  // Open PSU (Matrix WPS300S-8010 via serial)
  const psuResult = await rm.openResource('ASRL/dev/tty.usbserial-1310::INSTR', {
    timeout: 2000,
    transport: { baudRate: 115200, commandDelay: 100 },
  });

  // Open Load (Rigol DL3021 via USB)
  const loadResult = await rm.openResource('USB0::0x1AB1::0x0E11::DL3A274M00223::INSTR', {
    timeout: 2000,
  });

  if (!psuResult.ok) {
    console.error('Failed to open PSU:', psuResult.error);
    return;
  }
  if (!loadResult.ok) {
    console.error('Failed to open Load:', loadResult.error);
    return;
  }

  const psu = psuResult.value;
  const load = loadResult.value;

  console.log('Connected to:');
  const psuIdn = await psu.query('*IDN?');
  const loadIdn = await load.query('*IDN?');
  console.log('  PSU:', psuIdn.ok ? psuIdn.value.trim() : 'error');
  console.log('  Load:', loadIdn.ok ? loadIdn.value.trim() : 'error');
  console.log('');

  // Configure PSU
  const SOURCE_VOLTAGE = 12;
  const SOURCE_CURRENT_LIMIT = 1; // 1A limit for safety

  console.log('Configuring PSU...');
  await psu.write(`APPL ${SOURCE_VOLTAGE},${SOURCE_CURRENT_LIMIT}`);
  await sleep(200);

  // Turn on PSU output
  await psu.write('OUTP 1');
  await sleep(500); // Let output stabilize
  console.log(`PSU output ON: ${SOURCE_VOLTAGE}V, ${SOURCE_CURRENT_LIMIT}A limit\n`);

  // Configure Load in CR mode
  console.log('Configuring Load...');
  await load.write(':SOUR:FUNC RES');
  await sleep(100);
  await load.write(':SOUR:RES 1000'); // Start with high resistance (low current)
  await sleep(100);
  await load.write(':SOUR:INP:STAT 1');
  await sleep(500); // Let it stabilize
  console.log('Load input ON in CR mode\n');

  // Test with various resistances
  console.log('Resistive Load Test (CR mode - I = V/R):');
  console.log(
    '--------------------------------------------------------------------------------------------------------------'
  );
  console.log(
    '|  R (Ω)  | I demand |   PSU V  |   PSU I  |  PSU W  |  Load V  |  Load I  | Load W  |       Status          |'
  );
  console.log(
    '|---------|----------|----------|----------|---------|----------|----------|---------|---------------------- |'
  );

  const resistances = [120, 60, 24, 12, 8, 6]; // Safe range for 12V/1A

  for (const r of resistances) {
    console.log(`\nSetting load to ${r}Ω...`);
    await load.write(`:SOUR:RES ${r}`);
    await sleep(3000); // Wait 3 seconds for real hardware to settle

    // Query measured values from PSU
    const psuVolt = await psu.query('MEAS:VOLT?');
    await sleep(50);
    const psuCurr = await psu.query('MEAS:CURR?');
    await sleep(50);
    const psuPow = await psu.query('MEAS:POW?');
    await sleep(50);

    // Query measured values from Load
    const loadVolt = await load.query(':MEAS:VOLT?');
    await sleep(50);
    const loadCurr = await load.query(':MEAS:CURR?');
    await sleep(50);
    const loadPow = await load.query(':MEAS:POW?');

    const psuV = parseFloat(psuVolt.ok ? psuVolt.value : '0');
    const psuI = parseFloat(psuCurr.ok ? psuCurr.value : '0');
    const psuW = parseFloat(psuPow.ok ? psuPow.value : '0');

    const loadV = parseFloat(loadVolt.ok ? loadVolt.value : '0');
    const loadI = parseFloat(loadCurr.ok ? loadCurr.value : '0');
    const loadW = parseFloat(loadPow.ok ? loadPow.value : '0');

    const idealCurrent = SOURCE_VOLTAGE / r;
    const isLimited = psuI >= SOURCE_CURRENT_LIMIT * 0.95;

    console.log(
      `| ${r.toFixed(1).padStart(7)} | ${idealCurrent.toFixed(3).padStart(8)} | ` +
        `${psuV.toFixed(2).padStart(8)} | ${psuI.toFixed(3).padStart(8)} | ${psuW.toFixed(2).padStart(7)} | ` +
        `${loadV.toFixed(2).padStart(8)} | ${loadI.toFixed(3).padStart(8)} | ${loadW.toFixed(2).padStart(7)} | ` +
        `${(isLimited ? 'Current Limited' : 'Normal (CV)').padStart(21)} |`
    );
    await sleep(2000); // Pause before next step
  }

  console.log(
    '--------------------------------------------------------------------------------------------------------------'
  );

  // Cleanup - turn everything off
  console.log('\nShutting down...');
  await load.write(':SOUR:INP:STAT 0');
  await sleep(200);
  await psu.write('OUTP 0');
  await sleep(200);

  console.log('Load input OFF');
  console.log('PSU output OFF');

  console.log('\nPhysics Summary:');
  console.log('----------------');
  console.log(
    `• When R is high: I = V/R is below limit, PSU maintains ${SOURCE_VOLTAGE}V (CV mode)`
  );
  console.log(
    `• When R is low: I = V/R exceeds ${SOURCE_CURRENT_LIMIT}A limit, voltage sags (CC mode)`
  );
  console.log('• At R=6Ω: ideal I = 2A, limited to 1A, so V = 1A × 6Ω = 6V');

  console.log('\nTest complete.');

  await rm.close();
}

main().catch(console.error);
