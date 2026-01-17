/**
 * Oscilloscope Driver Example
 *
 * Demonstrates using the typed driver API for the Rigol DS1054Z oscilloscope.
 * This example uses the driver abstraction layer instead of raw SCPI commands,
 * providing type-safe access to all oscilloscope features.
 *
 * Run with: npx tsx examples/hardware/scope-driver.ts
 */

import { createResourceManager } from '../../src/index.js';
import { rigolDS1054Z } from '../../src/drivers/implementations/rigol/ds1054z.js';

async function main(): Promise<void> {
  console.log('=== Rigol DS1054Z Driver Example ===\n');

  // Create resource manager and open connection
  const rm = createResourceManager();

  // List USB resources to find scope
  const resources = await rm.listResources('USB*::INSTR');
  console.log('Available USB instruments:');
  for (const res of resources) {
    console.log(`  ${res}`);
  }

  if (resources.length === 0) {
    console.log('\nNo USB instruments found.');
    console.log('Connect a Rigol DS1054Z/DS1104Z oscilloscope and try again.');
    return;
  }

  // Open the first resource
  const resourceResult = await rm.openResource(resources[0], { timeout: 5000 });
  if (!resourceResult.ok) {
    console.error('Failed to open resource:', resourceResult.error.message);
    return;
  }

  // Connect using the typed driver
  console.log('\nConnecting with DS1054Z driver...');
  const scopeResult = await rigolDS1054Z.connect(resourceResult.value);
  if (!scopeResult.ok) {
    console.error('Failed to connect driver:', scopeResult.error.message);
    return;
  }

  const scope = scopeResult.value;
  console.log(`Connected to: ${scope.manufacturer} ${scope.model}`);
  console.log(`Serial: ${scope.serialNumber}`);
  console.log(`Firmware: ${scope.firmwareVersion}`);
  console.log(`Channels: ${scope.channelCount}`);

  // Get channel 1 (channel number validated at compile time via literal types)
  const ch1 = scope.channel(1);
  // --- Display current timebase settings ---
  console.log('\n--- Timebase Settings ---');
  const timebase = await scope.getTimebase();
  const timebaseOffset = await scope.getTimebaseOffset();
  const sampleRate = await scope.getSampleRate();
  const running = await scope.getRunning();

  if (timebase.ok) console.log(`  Time/div: ${formatTime(timebase.value)}`);
  if (timebaseOffset.ok) console.log(`  Offset: ${formatTime(timebaseOffset.value)}`);
  if (sampleRate.ok) console.log(`  Sample rate: ${formatRate(sampleRate.value)}`);
  if (running.ok) console.log(`  Running: ${running.value}`);

  // --- Display trigger settings ---
  console.log('\n--- Trigger Settings ---');
  const trigSource = await scope.getTriggerSource();
  const trigLevel = await scope.getTriggerLevel();
  const trigSlope = await scope.getTriggerSlope();
  const trigMode = await scope.getTriggerMode();

  if (trigSource.ok) console.log(`  Source: ${trigSource.value}`);
  if (trigLevel.ok) console.log(`  Level: ${trigLevel.value.toFixed(3)} V`);
  if (trigSlope.ok) console.log(`  Slope: ${trigSlope.value}`);
  if (trigMode.ok) console.log(`  Mode: ${trigMode.value}`);

  // --- Display channel 1 settings ---
  console.log('\n--- Channel 1 Settings ---');
  const enabled = await ch1.getEnabled();
  const scale = await ch1.getScale();
  const offset = await ch1.getOffset();
  const coupling = await ch1.getCoupling();
  const probe = await ch1.getProbeAttenuation();
  const bwLimit = await ch1.getBandwidthLimit();

  if (enabled.ok) console.log(`  Enabled: ${enabled.value}`);
  if (scale.ok) console.log(`  Scale: ${scale.value} V/div`);
  if (offset.ok) console.log(`  Offset: ${offset.value} V`);
  if (coupling.ok) console.log(`  Coupling: ${coupling.value}`);
  if (probe.ok) console.log(`  Probe: ${probe.value}x`);
  if (bwLimit.ok) console.log(`  BW Limit: ${bwLimit.value}`);

  // --- Take measurements ---
  console.log('\n--- Channel 1 Measurements ---');

  // Basic measurements (from base interface)
  const freq = await ch1.getMeasuredFrequency();
  const period = await ch1.getMeasuredPeriod();
  const vpp = await ch1.getMeasuredVpp();
  const vmax = await ch1.getMeasuredVmax();
  const vmin = await ch1.getMeasuredVmin();
  const vavg = await ch1.getMeasuredVavg();
  const vrms = await ch1.getMeasuredVrms();

  if (freq.ok) console.log(`  Frequency: ${formatFrequency(freq.value)}`);
  if (period.ok) console.log(`  Period: ${formatTime(period.value)}`);
  if (vpp.ok) console.log(`  Vpp: ${vpp.value.toFixed(3)} V`);
  if (vmax.ok) console.log(`  Vmax: ${vmax.value.toFixed(3)} V`);
  if (vmin.ok) console.log(`  Vmin: ${vmin.value.toFixed(3)} V`);
  if (vavg.ok) console.log(`  Vavg: ${vavg.value.toFixed(3)} V`);
  if (vrms.ok) console.log(`  Vrms: ${vrms.value.toFixed(3)} V`);

  // DS1054Z-specific measurements
  console.log('\n--- DS1054Z-Specific Measurements ---');
  const vtop = await ch1.getMeasuredVtop();
  const vbase = await ch1.getMeasuredVbase();
  const vamp = await ch1.getMeasuredVamp();
  const rise = await ch1.getMeasuredRiseTime();
  const fall = await ch1.getMeasuredFallTime();
  const pwidth = await ch1.getMeasuredPositiveWidth();
  const duty = await ch1.getMeasuredPositiveDuty();
  const overshoot = await ch1.getMeasuredOvershoot();

  if (vtop.ok) console.log(`  Vtop: ${vtop.value.toFixed(3)} V`);
  if (vbase.ok) console.log(`  Vbase: ${vbase.value.toFixed(3)} V`);
  if (vamp.ok) console.log(`  Vamp: ${vamp.value.toFixed(3)} V`);
  if (rise.ok) console.log(`  Rise time: ${formatTime(rise.value)}`);
  if (fall.ok) console.log(`  Fall time: ${formatTime(fall.value)}`);
  if (pwidth.ok) console.log(`  Pulse width: ${formatTime(pwidth.value)}`);
  if (duty.ok) console.log(`  Duty cycle: ${duty.value.toFixed(1)}%`);
  if (overshoot.ok) console.log(`  Overshoot: ${overshoot.value.toFixed(1)}%`);

  // --- Configure scope (example) ---
  console.log('\n--- Configure Scope ---');

  // Set timebase to 1ms/div
  console.log('Setting timebase to 1ms/div...');
  const setTb = await scope.setTimebase(1e-3);
  if (!setTb.ok) console.log(`  Error: ${setTb.error.message}`);

  // Set channel 1 to 1V/div
  console.log('Setting CH1 scale to 1V/div...');
  const setScale = await ch1.setScale(1.0);
  if (!setScale.ok) console.log(`  Error: ${setScale.error.message}`);

  // Set trigger level
  console.log('Setting trigger level to 0V...');
  const setTrig = await scope.setTriggerLevel(0);
  if (!setTrig.ok) console.log(`  Error: ${setTrig.error.message}`);

  // --- Acquisition control ---
  console.log('\n--- Acquisition Control ---');

  // Check if running
  const isRunning = await scope.getRunning();
  if (isRunning.ok) {
    console.log(`Currently running: ${isRunning.value}`);
  }

  // Run/Stop example
  console.log('Sending STOP command...');
  await scope.stop();

  console.log('Sending RUN command...');
  await scope.run();

  // --- Check for errors ---
  console.log('\n--- Error Check ---');
  const err = await scope.getError();
  if (err.ok) {
    if (err.value === null) {
      console.log('No errors.');
    } else {
      console.log(`Error ${err.value.code}: ${err.value.message}`);
    }
  }

  // Close connection
  await scope.close();
  console.log('\nConnection closed.');
}

// --- Formatting helpers ---

function formatTime(seconds: number): string {
  if (seconds >= 1) return `${seconds.toFixed(3)} s`;
  if (seconds >= 1e-3) return `${(seconds * 1e3).toFixed(3)} ms`;
  if (seconds >= 1e-6) return `${(seconds * 1e6).toFixed(3)} us`;
  if (seconds >= 1e-9) return `${(seconds * 1e9).toFixed(3)} ns`;
  return `${seconds.toExponential(3)} s`;
}

function formatFrequency(hz: number): string {
  if (hz >= 1e9) return `${(hz / 1e9).toFixed(3)} GHz`;
  if (hz >= 1e6) return `${(hz / 1e6).toFixed(3)} MHz`;
  if (hz >= 1e3) return `${(hz / 1e3).toFixed(3)} kHz`;
  return `${hz.toFixed(3)} Hz`;
}

function formatRate(rate: number): string {
  if (rate >= 1e9) return `${(rate / 1e9).toFixed(2)} GSa/s`;
  if (rate >= 1e6) return `${(rate / 1e6).toFixed(2)} MSa/s`;
  if (rate >= 1e3) return `${(rate / 1e3).toFixed(2)} kSa/s`;
  return `${rate.toFixed(2)} Sa/s`;
}

main().catch(console.error);
