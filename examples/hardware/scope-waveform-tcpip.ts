/**
 * Oscilloscope Waveform Download via TCP/IP - Get waveform data as CSV over LAN
 *
 * Usage: npx tsx examples/hardware/scope-waveform-tcpip.ts [ip:port]
 * Default: 169.254.245.2:5555
 */

import { createResourceManager } from '../../src/index.js';
import { writeFileSync } from 'fs';

async function main(): Promise<void> {
  // Allow IP:port override from command line
  const target = process.argv[2] ?? '169.254.245.2:5555';
  const [host, portStr] = target.split(':');
  const port = parseInt(portStr ?? '5555');

  const resourceString = `TCPIP0::${host}::${port}::SOCKET`;
  console.log(`Connecting to ${resourceString}...`);

  const rm = createResourceManager();

  const result = await rm.openResource(resourceString, {
    timeout: 10000,
  });

  if (!result.ok) {
    console.error('Failed to open:', result.error.message);
    return;
  }

  const scope = result.value;

  const idn = await scope.query('*IDN?');
  console.log('Connected to:', idn.ok ? idn.value.trim() : 'error');

  // Get waveform preamble (scale factors)
  console.log('Getting waveform parameters...');

  // Set up waveform source and format
  await scope.write(':WAV:SOUR CHAN1');
  await scope.write(':WAV:MODE NORM');
  await scope.write(':WAV:FORM BYTE');

  // Get preamble
  const preambleResult = await scope.query(':WAV:PRE?');
  if (!preambleResult.ok) {
    console.error('Failed to get preamble:', preambleResult.error);
    await scope.close();
    return;
  }

  const preamble = preambleResult.value.split(',');
  const points = parseInt(preamble[2]);
  const xIncrement = parseFloat(preamble[4]);
  const xOrigin = parseFloat(preamble[5]);
  const xReference = parseFloat(preamble[6]);
  const yIncrement = parseFloat(preamble[7]);
  const yOrigin = parseFloat(preamble[8]);
  const yReference = parseFloat(preamble[9]);

  console.log(`Points: ${points}, Y scale: ${yIncrement} V/div`);

  // Get waveform data
  console.log('Downloading waveform...');
  const waveformResult = await scope.queryBinary(':WAV:DATA?');

  if (!waveformResult.ok) {
    console.error('Failed to get waveform:', waveformResult.error);
    await scope.close();
    return;
  }

  const rawData = waveformResult.value;
  console.log(`Got ${rawData.length} samples`);

  // Convert to voltage and time values
  const rows: string[] = ['Time (s),Voltage (V)'];

  for (let i = 0; i < rawData.length; i++) {
    const time = (i - xReference) * xIncrement + xOrigin;
    const voltage = (rawData[i] - yReference - yOrigin) * yIncrement;
    rows.push(`${time.toExponential(6)},${voltage.toFixed(4)}`);
  }

  const filename = 'waveform.csv';
  writeFileSync(filename, rows.join('\n'));
  console.log(`Saved to ${filename}`);

  await scope.close();
}

main().catch(console.error);
