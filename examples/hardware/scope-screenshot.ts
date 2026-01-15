/**
 * Oscilloscope Screenshot - Capture display from Rigol DS1202Z-E
 */

import { createResourceManager } from '../../src/index.js';
import { writeFileSync } from 'fs';

async function main(): Promise<void> {
  const rm = createResourceManager();

  const result = await rm.openResource('USB0::0x1AB1::0x0517::DS1ZE26CM00683::INSTR', {
    timeout: 15000, // Screenshots can take a while
    transport: { quirks: 'rigol' },
  });

  if (!result.ok) {
    console.error('Failed to open:', result.error);
    return;
  }

  const scope = result.value;

  const idn = await scope.query('*IDN?');
  console.log('Connected to:', idn.ok ? idn.value.trim() : 'error');

  console.log('Capturing screenshot (this takes a few seconds)...');

  // Send the command
  const writeResult = await scope.write(':DISP:DATA? ON,OFF,PNG');
  if (!writeResult.ok) {
    console.error('Failed to send command:', writeResult.error);
    await scope.close();
    return;
  }

  // Read using queryBinaryValues with buffer container for large data
  // Use a large chunk size to get all data
  scope.chunkSize = 1024 * 1024; // 1MB chunk size
  const screenshot = await scope.readBinary();

  if (!screenshot.ok) {
    console.error('Failed to capture:', screenshot.error);
    await scope.close();
    return;
  }

  const filename = 'scope-screenshot.png';
  writeFileSync(filename, screenshot.value);
  console.log(`Saved to ${filename} (${screenshot.value.length} bytes)`);

  await scope.close();
}

main().catch(console.error);
