/**
 * Power Test Example - Voltage Sag Demonstration
 *
 * Demonstrates realistic physics when a PSU current-limits into a resistive load.
 * Includes a DMM to independently verify circuit measurements.
 * Uses the resource manager public API.
 */

import {
  createResourceManager,
  createSimulatedPsu,
  createSimulatedLoad,
  createSimulatedDmm,
} from '../src/index.js';

async function main() {
  console.log('==================================================================');
  console.log('       Voltage Sag Under Current Limiting                        ');
  console.log('==================================================================\n');

  // Create resource manager and register simulated devices on the same bus
  const rm = createResourceManager();
  const psu = createSimulatedPsu();
  const load = createSimulatedLoad();
  const dmm = createSimulatedDmm();

  rm.registerSimulatedDevice('PSU', psu, { bus: 'bench' });
  rm.registerSimulatedDevice('LOAD', load, { bus: 'bench' });
  rm.registerSimulatedDevice('DMM', dmm, { bus: 'bench' });

  // Open resources
  const psuResult = await rm.openResource('SIM::PSU::INSTR');
  const loadResult = await rm.openResource('SIM::LOAD::INSTR');
  const dmmResult = await rm.openResource('SIM::DMM::INSTR');

  if (!psuResult.ok || !loadResult.ok || !dmmResult.ok) {
    console.error('Failed to open devices');
    return;
  }

  const psuInstr = psuResult.value;
  const loadInstr = loadResult.value;
  const dmmInstr = dmmResult.value;

  // Configure PSU
  const SOURCE_VOLTAGE = 12;
  const SOURCE_CURRENT_LIMIT = 2;

  await psuInstr.write(`VOLT ${SOURCE_VOLTAGE}`);
  await psuInstr.write(`CURR ${SOURCE_CURRENT_LIMIT}`);
  await psuInstr.write('OUTP ON');

  console.log(`Source: ${SOURCE_VOLTAGE}V, ${SOURCE_CURRENT_LIMIT}A limit\n`);

  // Configure Load in CR mode
  await loadInstr.write('MODE CR');
  await loadInstr.write('INP ON');

  // Configure DMM for voltage measurement
  await dmmInstr.write('FUNC VOLT:DC');

  // Test with resistance load behavior
  console.log('Resistive Load (CR mode - I = V/R):');
  console.log(
    '--------------------------------------------------------------------------------------------'
  );
  console.log(
    '|  R (Ω)  | I demand | I actual |  V out  | DMM Volt  | Power (W) |       Status          |'
  );
  console.log(
    '|---------|----------|----------|---------|-----------|-----------|---------------------- |'
  );

  const resistances = [24, 12, 6, 4, 3, 2, 1];

  for (const r of resistances) {
    await loadInstr.write(`RES ${r}`);

    // Query measured values from PSU
    const voltResult = await psuInstr.query('MEAS:VOLT?');
    const currResult = await psuInstr.query('MEAS:CURR?');

    // Query voltage from DMM (independent verification)
    const dmmVoltResult = await dmmInstr.query('MEAS:VOLT:DC?');

    const voltage = parseFloat(voltResult.ok ? voltResult.value : '0');
    const current = parseFloat(currResult.ok ? currResult.value : '0');
    const dmmVoltage = parseFloat(dmmVoltResult.ok ? dmmVoltResult.value : '0');

    const idealCurrent = SOURCE_VOLTAGE / r;
    const isLimited = idealCurrent > SOURCE_CURRENT_LIMIT;
    const power = voltage * current;

    console.log(
      `| ${r.toFixed(1).padStart(7)} | ${idealCurrent.toFixed(2).padStart(8)} | ` +
        `${current.toFixed(2).padStart(8)} | ${voltage.toFixed(2).padStart(7)} | ` +
        `${dmmVoltage.toFixed(3).padStart(9)} | ${power.toFixed(2).padStart(9)} | ` +
        `${(isLimited ? 'Current Limited' : 'Normal (CV)').padStart(21)} |`
    );
  }

  console.log(
    '--------------------------------------------------------------------------------------------'
  );

  // Demonstrate DMM resistance measurement
  console.log('\nDMM Resistance Measurement (R = V/I):');
  await dmmInstr.write('FUNC RES');
  await loadInstr.write('RES 6'); // 6Ω load

  const resResult = await dmmInstr.query('READ?');
  const measuredRes = parseFloat(resResult.ok ? resResult.value : '0');
  console.log(`  Load set to 6Ω, DMM measures: ${measuredRes.toFixed(2)}Ω`);

  console.log('\nPhysics Summary:');
  console.log('----------------');
  console.log("• Resistive load: V sags per Ohm's law (V = I_limit × R)");
  console.log('• When R=4Ω: I would be 3A, limited to 2A, so V = 2A × 4Ω = 8V');
  console.log('• DMM independently confirms PSU voltage readings');

  console.log('\nTest complete.');

  await rm.close();
}

main().catch(console.error);
