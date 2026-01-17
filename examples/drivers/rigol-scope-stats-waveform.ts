/**
 * Rigol Oscilloscope Stats, Screenshot, and Waveform Example
 *
 * Demonstrates using the typed driver API to:
 * 1. Get exhaustive channel statistics (all measurements)
 * 2. Capture a screenshot
 * 3. Download waveform data
 *
 * Run with: npx tsx examples/drivers/rigol-scope-stats-waveform.ts
 */

import { writeFileSync } from 'fs';
import { createResourceManager } from '../../src/index.js';
import { rigolScope } from '../../src/drivers/implementations/rigol/scope.js';
import type { RigolScopeChannel } from '../../src/drivers/implementations/rigol/scope.js';
import type { Result } from '../../src/result.js';

async function main(): Promise<void> {
  console.log('=== Rigol Oscilloscope Stats, Screenshot & Waveform Example ===\n');

  // Create resource manager and find instruments
  const rm = createResourceManager();
  const resources = await rm.listResources('USB*::INSTR');

  console.log('Available USB instruments:');
  for (const res of resources) {
    console.log(`  ${res}`);
  }

  if (resources.length === 0) {
    console.log('\nNo USB instruments found.');
    return;
  }

  // Open the first resource with Rigol quirks mode for proper binary transfers
  const resourceResult = await rm.openResource(resources[0], {
    timeout: 10000,
    transport: { quirks: 'rigol' },
  });
  if (!resourceResult.ok) {
    console.error('Failed to open resource:', resourceResult.error.message);
    return;
  }

  // Connect using the Rigol scope driver
  console.log('\nConnecting with Rigol scope driver...');
  const scopeResult = await rigolScope.connect(resourceResult.value);
  if (!scopeResult.ok) {
    console.error('Failed to connect driver:', scopeResult.error.message);
    return;
  }

  const scope = scopeResult.value;
  console.log(`Connected to: ${scope.manufacturer} ${scope.model}`);
  console.log(`Serial: ${scope.serialNumber}`);

  // ─────────────────────────────────────────────────────────────────
  // 1. Get Channel Stats (All Measurements)
  // ─────────────────────────────────────────────────────────────────

  const ch1 = scope.channel(1);
  const ch2 = scope.channel(2);

  console.log('\n' + '='.repeat(60));
  console.log('CHANNEL 1 STATISTICS');
  console.log('='.repeat(60));
  await printChannelStats(ch1);

  console.log('\n' + '='.repeat(60));
  console.log('CHANNEL 2 STATISTICS');
  console.log('='.repeat(60));
  await printChannelStats(ch2);

  // ─────────────────────────────────────────────────────────────────
  // 2. Capture Screenshot
  // ─────────────────────────────────────────────────────────────────

  console.log('\n' + '='.repeat(60));
  console.log('CAPTURING SCREENSHOT');
  console.log('='.repeat(60));

  console.log('Requesting screenshot from oscilloscope...');
  const screenshotResult = await scope.captureScreenshot();

  if (screenshotResult.ok) {
    const filename = 'scope-screenshot.png';
    writeFileSync(filename, screenshotResult.value);
    console.log(`Screenshot saved to: ${filename}`);
    console.log(`Size: ${screenshotResult.value.length} bytes`);
  } else {
    console.error('Failed to capture screenshot:', screenshotResult.error.message);
  }

  // ─────────────────────────────────────────────────────────────────
  // 3. Get Waveform Data
  // ─────────────────────────────────────────────────────────────────

  console.log('\n' + '='.repeat(60));
  console.log('CAPTURING WAVEFORM DATA');
  console.log('='.repeat(60));

  // Capture from channel 1
  console.log('\nCapturing waveform from Channel 1...');
  const waveform1 = await scope.captureWaveform('CHAN1');

  if (waveform1.ok) {
    const data = waveform1.value;
    console.log(`  Points: ${data.points.length}`);
    console.log(`  X increment: ${formatTime(data.xIncrement)}`);
    console.log(`  X origin: ${formatTime(data.xOrigin)}`);
    console.log(`  Y increment: ${data.yIncrement.toExponential(3)} V`);

    // Calculate waveform statistics
    const stats = calculateWaveformStats(data.points);
    console.log(`  Min voltage: ${stats.min.toFixed(4)} V`);
    console.log(`  Max voltage: ${stats.max.toFixed(4)} V`);
    console.log(`  Avg voltage: ${stats.avg.toFixed(4)} V`);

    // Save to CSV
    const csvFilename = 'waveform-ch1.csv';
    saveWaveformToCsv(csvFilename, data.points, data.xIncrement, data.xOrigin);
    console.log(`  Saved to: ${csvFilename}`);
  } else {
    console.error('Failed to capture CH1 waveform:', waveform1.error.message);
  }

  // Capture from channel 2
  console.log('\nCapturing waveform from Channel 2...');
  const waveform2 = await scope.captureWaveform('CHAN2');

  if (waveform2.ok) {
    const data = waveform2.value;
    console.log(`  Points: ${data.points.length}`);
    console.log(`  X increment: ${formatTime(data.xIncrement)}`);
    console.log(`  X origin: ${formatTime(data.xOrigin)}`);
    console.log(`  Y increment: ${data.yIncrement.toExponential(3)} V`);

    // Calculate waveform statistics
    const stats = calculateWaveformStats(data.points);
    console.log(`  Min voltage: ${stats.min.toFixed(4)} V`);
    console.log(`  Max voltage: ${stats.max.toFixed(4)} V`);
    console.log(`  Avg voltage: ${stats.avg.toFixed(4)} V`);

    // Save to CSV
    const csvFilename = 'waveform-ch2.csv';
    saveWaveformToCsv(csvFilename, data.points, data.xIncrement, data.xOrigin);
    console.log(`  Saved to: ${csvFilename}`);
  } else {
    console.error('Failed to capture CH2 waveform:', waveform2.error.message);
  }

  // Close connection
  await scope.close();
  console.log('\nConnection closed.');
}

// ─────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────

async function printChannelStats(channel: RigolScopeChannel): Promise<void> {
  // Channel settings
  const enabled = await channel.getEnabled();
  const scale = await channel.getScale();
  const offset = await channel.getOffset();
  const coupling = await channel.getCoupling();
  const probe = await channel.getProbeAttenuation();
  const bwLimit = await channel.getBandwidthLimit();

  console.log('\n--- Channel Settings ---');
  printResult('Enabled', enabled);
  printResult('Scale', scale, 'V/div');
  printResult('Offset', offset, 'V');
  printResult('Coupling', coupling);
  printResult('Probe', probe, 'x');
  printResult('BW Limit', bwLimit);

  // Basic voltage measurements
  console.log('\n--- Voltage Measurements ---');
  const vpp = await channel.getMeasuredVpp();
  const vmax = await channel.getMeasuredVmax();
  const vmin = await channel.getMeasuredVmin();
  const vavg = await channel.getMeasuredVavg();
  const vrms = await channel.getMeasuredVrms();
  const vtop = await channel.getMeasuredVtop();
  const vbase = await channel.getMeasuredVbase();
  const vamp = await channel.getMeasuredVamp();

  printResultV('Vpp (peak-to-peak)', vpp);
  printResultV('Vmax (maximum)', vmax);
  printResultV('Vmin (minimum)', vmin);
  printResultV('Vavg (average)', vavg);
  printResultV('Vrms (RMS)', vrms);
  printResultV('Vtop (top level)', vtop);
  printResultV('Vbase (base level)', vbase);
  printResultV('Vamp (amplitude)', vamp);

  // Timing measurements
  console.log('\n--- Timing Measurements ---');
  const freq = await channel.getMeasuredFrequency();
  const period = await channel.getMeasuredPeriod();
  const rise = await channel.getMeasuredRiseTime();
  const fall = await channel.getMeasuredFallTime();
  const pwidth = await channel.getMeasuredPositiveWidth();
  const nwidth = await channel.getMeasuredNegativeWidth();

  if (freq.ok) console.log(`  Frequency: ${formatFrequency(freq.value)}`);
  else console.log(`  Frequency: ${freq.error.message}`);

  if (period.ok) console.log(`  Period: ${formatTime(period.value)}`);
  else console.log(`  Period: ${period.error.message}`);

  if (rise.ok) console.log(`  Rise time (10-90%): ${formatTime(rise.value)}`);
  else console.log(`  Rise time: ${rise.error.message}`);

  if (fall.ok) console.log(`  Fall time (90-10%): ${formatTime(fall.value)}`);
  else console.log(`  Fall time: ${fall.error.message}`);

  if (pwidth.ok) console.log(`  Positive width: ${formatTime(pwidth.value)}`);
  else console.log(`  Positive width: ${pwidth.error.message}`);

  if (nwidth.ok) console.log(`  Negative width: ${formatTime(nwidth.value)}`);
  else console.log(`  Negative width: ${nwidth.error.message}`);

  // Duty cycle and pulse measurements
  console.log('\n--- Duty Cycle & Pulse ---');
  const pduty = await channel.getMeasuredPositiveDuty();
  const nduty = await channel.getMeasuredNegativeDuty();
  const overshoot = await channel.getMeasuredOvershoot();
  const preshoot = await channel.getMeasuredPreshoot();

  printResultPct('Positive duty', pduty);
  printResultPct('Negative duty', nduty);
  printResultPct('Overshoot', overshoot);
  printResultPct('Preshoot', preshoot);

  // Note: Phase requires two channels and counter needs to be enabled on the scope
  // These are omitted as they can cause timeouts if not configured
}

function printResult<T>(label: string, result: Result<T, Error>, unit?: string): void {
  if (result.ok) {
    const suffix = unit ? ` ${unit}` : '';
    console.log(`  ${label}: ${result.value}${suffix}`);
  } else {
    console.log(`  ${label}: ${result.error.message}`);
  }
}

function printResultV(label: string, result: Result<number, Error>): void {
  if (result.ok) {
    console.log(`  ${label}: ${result.value.toFixed(4)} V`);
  } else {
    console.log(`  ${label}: ${result.error.message}`);
  }
}

function printResultPct(label: string, result: Result<number, Error>): void {
  if (result.ok) {
    console.log(`  ${label}: ${result.value.toFixed(2)}%`);
  } else {
    console.log(`  ${label}: ${result.error.message}`);
  }
}

function calculateWaveformStats(points: Float64Array): {
  min: number;
  max: number;
  avg: number;
} {
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;

  for (let i = 0; i < points.length; i++) {
    const v = points[i]!;
    if (v < min) min = v;
    if (v > max) max = v;
    sum += v;
  }

  return {
    min,
    max,
    avg: sum / points.length,
  };
}

function saveWaveformToCsv(
  filename: string,
  points: Float64Array,
  xIncrement: number,
  xOrigin: number
): void {
  const lines = ['Time (s),Voltage (V)'];

  for (let i = 0; i < points.length; i++) {
    const time = xOrigin + i * xIncrement;
    lines.push(`${time.toExponential(9)},${points[i]!.toFixed(6)}`);
  }

  writeFileSync(filename, lines.join('\n'));
}

function formatTime(seconds: number): string {
  const abs = Math.abs(seconds);
  if (abs >= 1) return `${seconds.toFixed(3)} s`;
  if (abs >= 1e-3) return `${(seconds * 1e3).toFixed(3)} ms`;
  if (abs >= 1e-6) return `${(seconds * 1e6).toFixed(3)} us`;
  if (abs >= 1e-9) return `${(seconds * 1e9).toFixed(3)} ns`;
  return `${seconds.toExponential(3)} s`;
}

function formatFrequency(hz: number): string {
  if (hz >= 1e9) return `${(hz / 1e9).toFixed(3)} GHz`;
  if (hz >= 1e6) return `${(hz / 1e6).toFixed(3)} MHz`;
  if (hz >= 1e3) return `${(hz / 1e3).toFixed(3)} kHz`;
  return `${hz.toFixed(3)} Hz`;
}

main().catch(console.error);
